import React, { useState } from 'react';
import { CharacterSelectionScreen } from './screens/CharacterSelectionScreen';
import { ConversationScreen } from './screens/ConversationScreen';
import { TopicSelectionScreen } from './screens/TopicSelectionScreen';
import { SessionSummaryScreen } from './screens/SessionSummaryScreen';
import { LandingScreen } from './screens/LandingScreen';
import { type Character, type Conversation, type VoiceName } from './types';
import { CHARACTERS } from './prompts/index';

type AppState =
  | { view: 'landing' }
  | { view: 'character_selection' }
  | { view: 'topic_selection'; character: Character }
  | { view: 'conversation'; character: Character; topic: string; voice: VoiceName; }
  | { view: 'summary'; conversation: Conversation; userAudioBlob: Blob | null; modelAudioBlob: Blob | null };

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ view: 'landing' });

  const handleStart = () => {
    setState({ view: 'character_selection' });
  };

  const handleSelectCharacter = (character: Character) => {
    setState({ view: 'topic_selection', character });
  };

  const handleSelectTopicAndVoice = (character: Character, topic: string, voice: VoiceName) => {
    setState({ view: 'conversation', character, topic, voice });
  };
  
  const handleConversationEnd = (conversation: Conversation, userAudioBlob: Blob | null, modelAudioBlob: Blob | null) => {
    setState({ view: 'summary', conversation, userAudioBlob, modelAudioBlob });
  };

  const handleGoToLanding = () => {
    setState({ view: 'landing' });
  };
  
  const handleStartNew = (character: Character) => {
    setState({ view: 'topic_selection', character });
  };

  const renderContent = () => {
    switch (state.view) {
      case 'landing':
        return <LandingScreen onStart={handleStart} />;
      case 'character_selection':
        return (
          <CharacterSelectionScreen
            characters={Object.values(CHARACTERS)}
            onSelect={handleSelectCharacter}
          />
        );
      case 'topic_selection':
        return (
          <TopicSelectionScreen
            character={state.character}
            onTopicAndVoiceSelect={(topic, voice) => handleSelectTopicAndVoice(state.character, topic, voice)}
            onGoBack={() => setState({ view: 'character_selection' })}
          />
        );
      case 'conversation':
        return (
          <ConversationScreen
            character={state.character}
            topic={state.topic}
            voice={state.voice}
            onConversationEnd={handleConversationEnd}
          />
        );
      case 'summary':
        return (
          <SessionSummaryScreen
            conversation={state.conversation}
            userAudioBlob={state.userAudioBlob}
            modelAudioBlob={state.modelAudioBlob}
            onStartNew={handleStartNew}
            onGoToHome={handleGoToLanding}
          />
        )
      default:
        return <div>Invalid state</div>;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
            <button onClick={handleGoToLanding} className="cursor-pointer group">
                <h1 className="font-hand text-5xl font-bold text-[--heading-color] tracking-wider group-hover:text-amber-800 transition-colors">Kotha Barta</h1>
                <p className="text-lg text-gray-500 mt-1 group-hover:text-gray-600 transition-colors">Your AI conversation partner</p>
            </button>
        </header>
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;