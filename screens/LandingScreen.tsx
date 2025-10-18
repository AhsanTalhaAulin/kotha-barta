import React from 'react';

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <h2 className="text-4xl sm:text-5xl font-hand text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-stone-600">
        Practice Conversations. Master Communication.
      </h2>
      <p className="mt-4 max-w-3xl text-lg text-gray-600">
        Welcome to Kotha Barta! Improve your speaking skills in a safe, interactive space. Here's how to get started:
      </p>

      <div className="grid md:grid-cols-3 gap-8 mt-10 max-w-4xl text-left">
        <div className="bg-white/50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-hand text-2xl font-bold text-stone-700">1. Choose a Partner</h3>
            <p className="mt-2 text-gray-600">Select an AI character, each with a unique personality—like a sharp debater, a patient teacher, or a professional interviewer.</p>
        </div>
        <div className="bg-white/50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-hand text-2xl font-bold text-stone-700">2. Set the Scene</h3>
            <p className="mt-2 text-gray-600">Pick a topic for your conversation. Choose from pre-set scenarios or create your own to practice what matters most to you.</p>
        </div>
        <div className="bg-white/50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-hand text-2xl font-bold text-stone-700">3. Speak Naturally</h3>
            <p className="mt-2 text-gray-600">Our AI understands and responds in 'Banglish'—the natural mix of Bangla and English. Just speak your mind and the AI will follow.</p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-12 bg-stone-800 hover:bg-stone-900 text-white font-bold py-4 px-10 rounded-lg transition-transform transform hover:scale-105 text-lg font-hand tracking-wider"
      >
        Start a Conversation
      </button>
    </div>
  );
};