import React from 'react';
import { type Character } from '../types';
import { CharacterCard } from '../components/CharacterCard';

interface CharacterSelectionScreenProps {
  characters: Character[];
  onSelect: (character: Character) => void;
}

export const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({
  characters,
  onSelect,
}) => {
  return (
    <div>
      <header className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-hand text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-stone-600">
          Open a New Chapter
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Who will you talk to today?
        </p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((char) => (
          <CharacterCard
            key={char.key}
            character={char}
            onClick={() => onSelect(char)}
          />
        ))}
      </main>
    </div>
  );
};