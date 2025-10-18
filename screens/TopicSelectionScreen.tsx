import React, { useState } from 'react';
import { type Character, type VoiceName, AVAILABLE_VOICES } from '../types';
import { BackIcon, SpeakerIcon, PlayIcon, LoadingSpinnerIcon } from '../components/Icons';
import { useVoicePlayer } from '../hooks/useVoicePlayer';

interface TopicSelectionScreenProps {
  character: Character;
  onTopicAndVoiceSelect: (topic: string, voice: VoiceName) => void;
  onGoBack: () => void;
}

const TopicCard: React.FC<{ title: string, description: string, onClick: () => void, themeColor: string, isSelected: boolean }> = ({ title, description, onClick, themeColor, isSelected }) => {
    const themeClasses = {
        blue: 'border-blue-300/70 hover:border-blue-500 hover:bg-blue-500/10',
        red: 'border-red-300/70 hover:border-red-500 hover:bg-red-500/10',
        green: 'border-green-300/70 hover:border-green-500 hover:bg-green-500/10',
        yellow: 'border-yellow-300/70 hover:border-yellow-500 hover:bg-yellow-500/10',
        indigo: 'border-indigo-300/70 hover:border-indigo-500 hover:bg-indigo-500/10',
    };
    const selectedTheme = themeClasses[themeColor as keyof typeof themeClasses] || themeClasses.blue;
    const selectedClasses = {
        blue: 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-400',
        red: 'border-red-500 bg-red-500/10 ring-2 ring-red-400',
        green: 'border-green-500 bg-green-500/10 ring-2 ring-green-400',
        yellow: 'border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-400',
        indigo: 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-400',
    }
    const finalSelectedClasses = isSelected ? (selectedClasses[themeColor as keyof typeof selectedClasses] || selectedClasses.blue) : '';

    return (
        <div onClick={onClick} className={`bg-white/50 rounded-lg p-4 border ${selectedTheme} ${finalSelectedClasses} transition-all cursor-pointer`}>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
    )
}

const VoiceCard: React.FC<{ voice: typeof AVAILABLE_VOICES[0], onClick: () => void, isSelected: boolean, isLoading: boolean, isPlaying: boolean, onPlay: () => void, themeColor: string }> = ({ voice, onClick, isSelected, isLoading, isPlaying, onPlay, themeColor }) => {
    const selectedClasses = {
        blue: 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-400',
        red: 'border-red-500 bg-red-500/10 ring-2 ring-red-400',
        green: 'border-green-500 bg-green-500/10 ring-2 ring-green-400',
        yellow: 'border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-400',
        indigo: 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-400',
    }
    const finalSelectedClasses = isSelected ? (selectedClasses[themeColor as keyof typeof selectedClasses] || selectedClasses.blue) : '';

    return (
        <div onClick={onClick} className={`bg-white/50 rounded-lg p-3 border border-gray-300/70 hover:border-gray-400 ${finalSelectedClasses} transition-all cursor-pointer flex items-center justify-between`}>
            <div>
                <h4 className="font-semibold text-gray-800">{voice.name}</h4>
                <p className="text-xs text-gray-500">{voice.description}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onPlay(); }} className={`p-2 rounded-full transition-colors hover:bg-gray-200/80 ${isPlaying ? 'text-purple-600' : 'text-gray-600'}`}>
                {isLoading ? <LoadingSpinnerIcon className="w-5 h-5" /> : (isPlaying ? <SpeakerIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />)}
            </button>
        </div>
    )
}

export const TopicSelectionScreen: React.FC<TopicSelectionScreenProps> = ({
  character,
  onTopicAndVoiceSelect,
  onGoBack
}) => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<VoiceName | null>(null);
    const [customTopic, setCustomTopic] = useState('');
    const { isLoading, isPlaying, playPreview } = useVoicePlayer();


    const handleRandomSelect = () => {
        const randomIndex = Math.floor(Math.random() * character.topics.length);
        setSelectedTopic(character.topics[randomIndex].title);
        setCustomTopic('');
    }

    const handleCustomTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomTopic(e.target.value);
        setSelectedTopic(e.target.value);
    }
    
    const handleTopicCardClick = (title: string) => {
        setSelectedTopic(title);
        setCustomTopic('');
    }
    
    const handleStartConversation = () => {
        if (selectedTopic && selectedTopic.trim() && selectedVoice) {
            onTopicAndVoiceSelect(selectedTopic.trim(), selectedVoice);
        }
    }

  return (
    <div className="space-y-8 animate-fade-in">
        <header className="flex items-center gap-4">
            <button
            onClick={onGoBack}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Go back to character selection"
            >
            <BackIcon className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-3">
                <character.Icon className={`w-10 h-10 text-${character.themeColor}-500`} />
                <div>
                    <h1 className="text-3xl font-bold font-hand text-gray-800">Set the Scene</h1>
                    <p className="text-md text-gray-600">with <span className="font-bold">{character.name}</span></p>
                </div>
            </div>
        </header>

        <main className="space-y-8">
            <section>
              <h2 className="text-xl font-hand text-gray-700 mb-3">1. Choose a Topic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {character.topics.map(topic => (
                      <TopicCard 
                          key={topic.title}
                          title={topic.title}
                          description={topic.description}
                          onClick={() => handleTopicCardClick(topic.title)}
                          themeColor={character.themeColor}
                          isSelected={selectedTopic === topic.title}
                      />
                  ))}
              </div>
            

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[--bg-color] px-2 text-sm text-gray-500">Or</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <input 
                        type="text"
                        value={customTopic}
                        onChange={handleCustomTopicChange}
                        placeholder="Write your own topic to begin..."
                        className={`flex-grow w-full bg-white/80 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:outline-none transition ${selectedTopic === customTopic && customTopic ? 'ring-2 ring-purple-400 border-purple-400' : ''}`}
                    />
                    <button 
                        onClick={handleRandomSelect}
                        className="w-full md:w-auto bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg transition"
                    >
                        Choose for me
                    </button>
                </div>
            </section>

            <section>
                 <h2 className="text-xl font-hand text-gray-700 mb-3">2. Choose a Voice</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {AVAILABLE_VOICES.map(voice => (
                        <VoiceCard
                            key={voice.name}
                            voice={voice}
                            onClick={() => setSelectedVoice(voice.name)}
                            isSelected={selectedVoice === voice.name}
                            isLoading={isLoading === voice.name}
                            isPlaying={isPlaying === voice.name}
                            onPlay={() => playPreview(voice.name, voice.sampleText)}
                            themeColor={character.themeColor}
                        />
                    ))}
                 </div>
            </section>
            
             <div className="pt-6 text-center">
                <button 
                    onClick={handleStartConversation}
                    disabled={!selectedTopic || !selectedTopic.trim() || !selectedVoice}
                    className={`w-full md:w-auto font-bold py-4 px-12 rounded-lg transition text-white text-lg font-hand tracking-wider disabled:opacity-50 disabled:cursor-not-allowed
                      ${character.themeColor === 'yellow' ? 'text-stone-900' : 'text-white'}
                      bg-${character.themeColor}-500 hover:bg-${character.themeColor}-600 disabled:bg-gray-400
                    `}
                >
                    Start Conversation
                </button>
             </div>
        </main>
    </div>
  );
};
