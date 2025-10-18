import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: The type `LiveSession` is not exported from the `@google/genai` package.
// A local interface is defined below to match its usage.
import { GoogleGenAI, Modality } from '@google/genai';
import { type TranscriptEntry, type Conversation, type VoiceName } from '../types';

// Helper functions for audio encoding/decoding, defined outside the hook
const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const createWavBlob = (pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob => {
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
  
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
  
    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
    view.setUint16(32, numChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
  
    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);
  
    // Write PCM data
    const pcmAsUint8 = new Uint8Array(pcmData.buffer);
    for (let i = 0; i < dataSize; i++) {
      view.setUint8(44 + i, pcmAsUint8[i]);
    }
  
    return new Blob([view], { type: 'audio/wav' });
};

// FIX: Define a local interface for the LiveSession object as it's not an exported member of the SDK.
interface LiveSession {
  close: () => void;
  sendRealtimeInput: (input: { media: { data: string; mimeType: string; } }) => void;
}

interface UseLiveConversationProps {
  finalSystemPrompt: string;
  onSessionEnd: (conversation: Conversation, userAudioBlob: Blob | null, modelAudioBlob: Blob | null) => void;
  characterName: string;
  topic: string;
  voice: VoiceName;
}

export const useLiveConversation = ({ finalSystemPrompt, onSessionEnd, characterName, topic, voice }: UseLiveConversationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const userAudioChunksRef = useRef<Blob[]>([]);
  const modelAudioChunksRef = useRef<Uint8Array[]>([]);
  
  const nextStartTimeRef = useRef<number>(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const conversationStartTimeRef = useRef<Date | null>(null);

  // Refs for robust transcript management
  const transcriptHistoryRef = useRef<TranscriptEntry[]>([]);
  const currentInputRef = useRef<TranscriptEntry | null>(null);
  const currentOutputRef = useRef<TranscriptEntry | null>(null);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  const logEvent = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const stopSession = useCallback((isError = false) => {
    logEvent('[stopSession] Stopping session...');
    sessionPromiseRef.current?.then(session => {
        session.close();
    }).catch(() => {});

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close().catch(console.error);
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(console.error);
    }
    
    playingSourcesRef.current.forEach(source => source.stop());
    playingSourcesRef.current.clear();

    const finalTranscript = [
        ...transcriptHistoryRef.current,
        ...(currentInputRef.current ? [currentInputRef.current] : []),
        ...(currentOutputRef.current ? [currentOutputRef.current] : []),
    ].map(t => ({...t, isFinal: true})).filter(t => t.text.trim());

    if (!isError && finalTranscript.length > 0) {
        const finalConversation: Conversation = {
            id: conversationStartTimeRef.current?.toISOString() || new Date().toISOString(),
            startTime: conversationStartTimeRef.current || new Date(),
            characterName: characterName,
            topic: topic,
            transcript: finalTranscript,
        };
        const userAudioBlob = userAudioChunksRef.current.length > 0 ? new Blob(userAudioChunksRef.current, { type: 'audio/webm' }) : null;
        
        let modelAudioBlob: Blob | null = null;
        if (modelAudioChunksRef.current.length > 0) {
            const totalLength = modelAudioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of modelAudioChunksRef.current) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            modelAudioBlob = createWavBlob(combined, 24000, 1);
        }

        onSessionEnd(finalConversation, userAudioBlob, modelAudioBlob);
    }

    setIsConnected(false);
    setIsSpeaking(false);
    sessionPromiseRef.current = null;
    mediaRecorderRef.current = null;
    transcriptHistoryRef.current = [];
    currentInputRef.current = null;
    currentOutputRef.current = null;
  }, [onSessionEnd, characterName, topic, logEvent]);

  useEffect(() => {
    return () => {
      stopSession(true);
    };
  }, [stopSession]);
  
  const processAudioPlayback = useCallback(async (base64Audio: string) => {
    if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') return;
    setIsSpeaking(true);
    
    try {
        const decodedBytes = decode(base64Audio);
        modelAudioChunksRef.current.push(decodedBytes);

        const audioBuffer = await decodeAudioData(
            decodedBytes,
            outputAudioContextRef.current,
            24000,
            1,
        );
        
        const currentTime = outputAudioContextRef.current.currentTime;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);
        
        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContextRef.current.destination);

        source.addEventListener('ended', () => {
            playingSourcesRef.current.delete(source);
            if (playingSourcesRef.current.size === 0) {
                setIsSpeaking(false);
            }
        });

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        playingSourcesRef.current.add(source);
    } catch(e) {
        console.error("Error playing audio:", e);
        setError("Failed to play response audio.");
        setIsSpeaking(false);
    }
  }, []);
  
  const updateTranscriptState = useCallback(() => {
    const liveEntries = [currentInputRef.current, currentOutputRef.current].filter(Boolean) as TranscriptEntry[];
    setTranscript([...transcriptHistoryRef.current, ...liveEntries]);
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setLog([]);
    userAudioChunksRef.current = [];
    modelAudioChunksRef.current = [];
    transcriptHistoryRef.current = [];
    currentInputRef.current = null;
    currentOutputRef.current = null;
    conversationStartTimeRef.current = new Date();
    logEvent('[startSession] Starting session...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) userAudioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: finalSystemPrompt,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            logEvent('[onopen] Connection opened.');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isMutedRef.current) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const messageToLog = JSON.parse(JSON.stringify(message));
            if (messageToLog.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                messageToLog.serverContent.modelTurn.parts[0].inlineData.data = `[AUDIO_DATA:${messageToLog.serverContent.modelTurn.parts[0].inlineData.data.length}b]`;
            }
            logEvent(`[onmessage] Received: ${JSON.stringify(messageToLog, null, 2)}`);
            
            const inputTranscription = message.serverContent?.inputTranscription;
            const outputTranscription = message.serverContent?.outputTranscription;

            // If the model starts speaking, the user's turn is over. Finalize it.
            if (outputTranscription && currentInputRef.current) {
                if (currentInputRef.current.text.trim()) {
                    transcriptHistoryRef.current.push({ ...currentInputRef.current, isFinal: true });
                }
                currentInputRef.current = null;
            }
            
            // If the user starts speaking, the model's turn is over. Finalize it.
            if (inputTranscription && currentOutputRef.current) {
                if (currentOutputRef.current.text.trim()) {
                    transcriptHistoryRef.current.push({ ...currentOutputRef.current, isFinal: true });
                }
                currentOutputRef.current = null;
            }

            if (outputTranscription) {
                currentOutputRef.current = { speaker: 'model', text: outputTranscription.text, isFinal: false, timestamp: new Date() };
            }

            if (inputTranscription) {
                currentInputRef.current = { speaker: 'user', text: inputTranscription.text, isFinal: false, timestamp: new Date() };
            }

            if (message.serverContent?.turnComplete) {
                if (currentInputRef.current) {
                    if (currentInputRef.current.text.trim()) transcriptHistoryRef.current.push({ ...currentInputRef.current, isFinal: true });
                    currentInputRef.current = null;
                }
                if (currentOutputRef.current) {
                    if (currentOutputRef.current.text.trim()) transcriptHistoryRef.current.push({ ...currentOutputRef.current, isFinal: true });
                    currentOutputRef.current = null;
                }
            }

            updateTranscriptState();
            
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              await processAudioPlayback(base64Audio);
            }
            if (message.serverContent?.interrupted) {
                logEvent('[onmessage] Playback interrupted.');
                playingSourcesRef.current.forEach(source => source.stop());
                playingSourcesRef.current.clear();
                setIsSpeaking(false);
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            const errorMessage = e.message || 'An unknown error occurred.';
            logEvent(`[onerror] Error: ${errorMessage}`);
            console.error('Gemini API Error:', e);
            setError(`API error: ${errorMessage}`);
            stopSession(true);
          },
          onclose: (e) => {
            logEvent(`[onclose] Connection closed. Code: ${e.code}, Reason: ${e.reason}`);
            if (e.code !== 1000 && e.code !== 1005) {
                setError(`Connection closed unexpectedly: Code ${e.code}`);
                stopSession(true);
            } else {
                stopSession(false);
            }
          },
        },
      });

    } catch (err) {
      logEvent(`[startSession] Error: ${(err as Error).message}`);
      console.error("Session start error:", err);
      if (err instanceof Error) {
        setError(`Failed to start: ${err.message}`);
      } else {
        setError('An unknown error occurred while starting.');
      }
      stopSession(true);
    }
  }, [finalSystemPrompt, stopSession, processAudioPlayback, voice, logEvent, updateTranscriptState]);

  return { isConnected, isSpeaking, transcript, error, log, isMuted, toggleMute, startSession, stopSession };
};
