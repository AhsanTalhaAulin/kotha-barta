import React, { useEffect } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { type Character, type Conversation, type TranscriptEntry, type VoiceName } from '../types';
import { UserIcon, PhoneHangUpIcon, PauseIcon, MicrophoneOffIcon } from '../components/Icons';

interface ConversationScreenProps {
  character: Character;
  topic: string;
  voice: VoiceName;
  onConversationEnd: (conversation: Conversation, userAudioBlob: Blob | null, modelAudioBlob: Blob | null) => void;
}

const TranscriptLine: React.FC<{ entry: TranscriptEntry; characterName: string; characterIcon: React.FC<React.SVGProps<SVGSVGElement>> }> = ({ entry, characterName, characterIcon: CharacterIcon }) => {
  const Icon = entry.speaker === 'model' ? CharacterIcon : UserIcon;
  const bgColor = entry.speaker === 'model' ? 'bg-amber-50/80' : 'bg-blue-50/80';
  const textColor = entry.speaker === 'model' ? 'text-amber-800' : 'text-blue-800';
  const nameColor = entry.speaker === 'model' ? 'text-amber-900' : 'text-blue-900';
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${bgColor}`}>
      <div className={`mt-1 p-1.5 rounded-full ${textColor} bg-white/50`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className={`font-bold ${nameColor}`}>{nameColor === 'text-amber-900' ? characterName : 'You'}</p>
        <p className={`text-gray-700 ${!entry.isFinal ? 'opacity-70' : ''}`}>
          {entry.text}
        </p>
      </div>
    </div>
  );
};

const EventLog: React.FC<{ log: string[] }> = ({ log }) => (
    <details className="bg-gray-100/80 rounded-lg">
        <summary className="p-2 cursor-pointer text-xs text-gray-600 font-mono">
            Event Log
        </summary>
        <div className="p-2 border-t border-gray-200">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all overflow-auto max-h-40 bg-white/50 p-2 rounded">
                {log.length > 0 ? log.join('\n') : 'No events yet.'}
            </pre>
        </div>
    </details>
);

const ConnectingUI: React.FC<{ character: Character }> = ({ character }) => (
    <div className="flex flex-col items-center justify-center h-[550px] text-gray-600 text-center p-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-xl">
        <div className="relative flex items-center justify-center w-28 h-28">
            <div className={`absolute w-full h-full bg-${character.themeColor}-200 rounded-full animate-pulse`}></div>
            <character.Icon className={`w-20 h-20 text-${character.themeColor}-600 z-10`} />
        </div>
        <p className="font-hand text-3xl mt-8">Connecting to {character.name}...</p>
        <p className="mt-2">Please allow microphone access when prompted.</p>
    </div>
);


export const ConversationScreen: React.FC<ConversationScreenProps> = ({ character, topic, voice, onConversationEnd }) => {
  const finalSystemPrompt = `${character.systemPrompt}\n\n${character.getTopicPrompt(topic)}`;

  const {
    isConnected,
    isSpeaking,
    transcript,
    error,
    log,
    isMuted,
    toggleMute,
    startSession,
    stopSession,
  } = useLiveConversation({ 
      finalSystemPrompt,
      onSessionEnd: onConversationEnd,
      characterName: character.name,
      topic: topic,
      voice: voice,
    });

  useEffect(() => {
    startSession();
  }, [startSession]);
  
  const getStatusText = () => {
    if (error) return "Connection Error";
    if (!isConnected) return "Establishing connection...";
    if (isMuted) return "Conversation paused";
    if (isSpeaking) return `${character.name} is speaking...`;
    return "Listening for your reply...";
  };

  if (!isConnected && !error) {
    return <ConnectingUI character={character} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <main className="space-y-4">
        <div className="bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <character.Icon className={`w-10 h-10 text-${character.themeColor}-500`} />
                <div>
                  <h1 className="text-3xl font-bold font-hand text-gray-800">{character.name}</h1>
                  <p className="text-md text-gray-600">Topic: {topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`w-3 h-3 rounded-full ${isConnected ? (isSpeaking ? 'bg-purple-500 animate-pulse' : 'bg-green-500') : 'bg-gray-400'}`}></span>
                {getStatusText()}
              </div>
            </div>
            
            <div className="h-96 bg-gray-50/50 rounded-lg p-4 space-y-3 overflow-y-auto border border-gray-200 flex flex-col">
              {transcript.length > 0 ? (
                transcript.map((entry, index) => <TranscriptLine key={index} entry={entry} characterName={character.name} characterIcon={character.Icon} />)
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
                  <p className="font-hand text-xl">Connection established.</p>
                  <p className="font-semibold mt-1">Start speaking to begin your conversation.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-100/70 p-4 flex flex-col justify-center items-center border-t border-gray-200 gap-4">
            <div className="flex items-center gap-6">
                <button
                    onClick={toggleMute}
                    className="flex flex-col items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={isMuted ? 'Resume call' : 'Pause call'}
                >
                    {isMuted ? <MicrophoneOffIcon className="w-7 h-7" /> : <PauseIcon className="w-7 h-7 text-gray-700" />}
                    <span className="text-xs mt-1 font-semibold">{isMuted ? 'UNMUTE' : 'PAUSE'}</span>
                </button>
                <button
                    onClick={() => stopSession()}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all focus:outline-none focus:ring-4 focus:ring-red-300"
                    aria-label="End call"
                >
                    <PhoneHangUpIcon className="w-8 h-8 text-white" />
                </button>
            </div>
            <div className="text-center text-xs text-gray-500 h-4">
              {error && (
                <span className="text-red-600">
                  <strong>Error:</strong> {error}
                </span>
              )}
            </div>
          </div>
        </div>
        <EventLog log={log} />
      </main>
    </div>
  );
};