import React from 'react';
import { type Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick }) => {
  const themeClasses = {
    blue: 'border-blue-300 hover:bg-blue-50/50 hover:border-blue-400 text-blue-600',
    red: 'border-red-300 hover:bg-red-50/50 hover:border-red-400 text-red-600',
    green: 'border-green-300 hover:bg-green-50/50 hover:border-green-400 text-green-600',
    yellow: 'border-yellow-300 hover:bg-yellow-50/50 hover:border-yellow-400 text-yellow-600',
    indigo: 'border-indigo-300 hover:bg-indigo-50/50 hover:border-indigo-400 text-indigo-600',
  };
  const selectedTheme = themeClasses[character.themeColor as keyof typeof themeClasses] || themeClasses.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-sm rounded-lg p-6 border-2 ${selectedTheme} transition-all duration-300 ease-in-out cursor-pointer hover:shadow-lg hover:shadow-gray-300/50 transform hover:-translate-y-1`}
    >
      <div className="flex items-center gap-4 mb-4">
        <character.Icon className={`w-10 h-10 ${selectedTheme}`} />
        <div>
          <h3 className="text-xl font-bold font-hand text-gray-800">{character.name}</h3>
          <p className={`text-sm font-semibold ${selectedTheme}`}>{character.tagline}</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm">
        {character.description}
      </p>
    </div>
  );
};