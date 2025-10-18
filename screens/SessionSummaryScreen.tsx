import React, { useState, useEffect } from 'react';
import { type Conversation, type SessionSummary, type Character } from '../types';
import { HistoryCard } from '../components/HistoryCard';
import { StarIcon, DownloadIcon } from '../components/Icons';
import { CHARACTERS } from '../prompts/index';

interface SessionSummaryScreenProps {
  conversation: Conversation;
  userAudioBlob: Blob | null;
  modelAudioBlob: Blob | null;
  onStartNew: (character: Character) => void;
  onGoToHome: () => void;
}

const uploadToCloudBucket = (data: SessionSummary, audioBase64: string | null) => {
    const payload = {
        ...data,
        audio: audioBase64 ? { mimeType: 'audio/webm', data: audioBase64 } : null
    };

    console.log("--- SIMULATING CLOUD UPLOAD ---");
    console.log("This data would be sent to a cloud bucket (e.g., S3, GCS).");
    console.log(JSON.stringify(payload, null, 2));
    console.log("--- END OF SIMULATION ---");
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


export const SessionSummaryScreen: React.FC<SessionSummaryScreenProps> = ({
  conversation,
  userAudioBlob,
  modelAudioBlob,
  onStartNew,
  onGoToHome,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const character = Object.values(CHARACTERS).find(c => c.name === conversation.characterName);

  useEffect(() => {
    const processAndUpload = async () => {
        const summary: SessionSummary = {
            ...conversation,
            endTime: new Date(),
        };
        // For simplicity, we'll just upload the user's audio for now.
        const audioBase64 = userAudioBlob ? await blobToBase64(userAudioBlob) : null;
        uploadToCloudBucket(summary, audioBase64);
    };
    processAndUpload();
  }, [conversation, userAudioBlob]);


  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
        alert("Please provide a rating.");
        return;
    }
    const feedback = { rating, comment };
    const summary: SessionSummary = {
        ...conversation,
        endTime: new Date(),
        feedback,
    };
    console.log("--- FEEDBACK SUBMITTED ---");
    console.log(JSON.stringify(feedback, null, 2));
    console.log("--- END FEEDBACK ---");

    setFeedbackSubmitted(true);
  };
  
  const handleDownloadTranscript = () => {
    const transcriptText = `Conversation with ${conversation.characterName} about "${conversation.topic}"\nStarted at: ${conversation.startTime.toLocaleString()}\n\n` + conversation.transcript
      .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker === 'model' ? conversation.characterName : 'You'}: ${entry.text}`)
      .join('\n');
    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${conversation.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = (blob: Blob | null, filename: string) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const themeClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-gray-800',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
  };
  const selectedTheme = character ? themeClasses[character.themeColor as keyof typeof themeClasses] : 'bg-gray-600';


  return (
    <div className="space-y-8 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl font-bold font-hand text-gray-800">Session Summary</h1>
        <p className="mt-2 text-lg text-gray-600">Your conversation has been saved to the notebook.</p>
      </header>

      <HistoryCard conversation={conversation} />

      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-center mb-4 font-hand text-gray-800">Download Records</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownloadTranscript} className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition w-full">
                <DownloadIcon className="w-5 h-5 text-gray-600"/> Transcript
            </button>
            {userAudioBlob && (
                <button onClick={() => handleDownloadAudio(userAudioBlob, `your_audio_${conversation.id}.webm`)} className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition w-full">
                    <DownloadIcon className="w-5 h-5 text-gray-600"/> Your Audio
                </button>
            )}
            {modelAudioBlob && (
                <button onClick={() => handleDownloadAudio(modelAudioBlob, `ai_audio_${conversation.id}.wav`)} className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition w-full">
                    <DownloadIcon className="w-5 h-5 text-gray-600"/> AI Audio
                </button>
            )}
        </div>
      </div>


      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-center mb-4 font-hand text-gray-800">Leave a Note</h2>
        {feedbackSubmitted ? (
            <div className="text-center text-green-600 py-8">
                <h3 className="text-xl font-bold font-hand">Thank you for your feedback!</h3>
            </div>
        ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setRating(star)}>
                            <StarIcon className={`w-8 h-8 transition-colors ${rating >= star ? 'text-yellow-500 fill-current' : 'text-gray-300 hover:text-gray-400'}`} />
                        </button>
                    ))}
                </div>
                <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any additional comments? (optional)"
                    rows={3}
                    className="w-full bg-white/80 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
                />
                <button type="submit" className="w-full bg-stone-700 hover:bg-stone-800 text-white font-bold py-3 px-4 rounded-lg transition">
                    Save Note
                </button>
            </form>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {character && (
            <button onClick={() => onStartNew(character)} className={`${selectedTheme} text-white font-bold py-3 px-6 rounded-lg transition`}>
                Start New Session with {character.name}
            </button>
          )}
        <button onClick={onGoToHome} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition">
            Close Notebook
        </button>
      </div>
    </div>
  );
};
