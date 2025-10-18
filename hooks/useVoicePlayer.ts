import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { type VoiceName } from '../types';

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

export const useVoicePlayer = () => {
    const [isLoading, setIsLoading] = useState<VoiceName | null>(null);
    const [isPlaying, setIsPlaying] = useState<VoiceName | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const playPreview = useCallback(async (voice: VoiceName, text: string) => {
        if (isLoading || isPlaying) {
            // Stop current playback if any
            if (sourceRef.current) {
                sourceRef.current.stop();
                sourceRef.current.disconnect();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            setIsLoading(null);
            setIsPlaying(null);

            if (isLoading === voice || isPlaying === voice) return;
        }

        setIsLoading(voice);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voice },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("No audio data received from API.");
            }

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContextRef.current,
                24000,
                1
            );

            sourceRef.current = audioContextRef.current.createBufferSource();
            sourceRef.current.buffer = audioBuffer;
            sourceRef.current.connect(audioContextRef.current.destination);
            
            setIsLoading(null);
            setIsPlaying(voice);

            sourceRef.current.onended = () => {
                setIsPlaying(null);
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close();
                }
            };
            sourceRef.current.start();

        } catch (error) {
            console.error("Failed to play voice preview:", error);
            alert(`Could not play voice preview for ${voice}. Please check the console.`);
            setIsLoading(null);
        }
    }, [isLoading, isPlaying]);

    return { isLoading, isPlaying, playPreview };
};
