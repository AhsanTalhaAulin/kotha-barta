import React from 'react';
import { type Conversation } from '../types';
import { BotIcon, UserIcon } from './Icons';

interface HistoryCardProps {
  conversation: Conversation;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ conversation }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-600">
          Conversation with <span className="font-bold font-hand text-purple-700">{conversation.characterName}</span>
        </h3>
        <p className="text-sm text-gray-500">
          Topic: <span className="font-medium text-gray-700">{conversation.topic}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {conversation.startTime.toLocaleString()}
        </p>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-3 p-4 bg-gray-50/70 rounded-lg border border-gray-200">
        {conversation.transcript
          .filter(entry => entry.isFinal && entry.text.trim())
          .map((entry, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1">
                {entry.speaker === 'model' ? <BotIcon className="w-5 h-5 text-purple-600" /> : <UserIcon className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1 text-gray-700">
                <div className="flex justify-between items-baseline">
                    <span className={`font-bold ${entry.speaker === 'model' ? 'text-purple-700' : 'text-blue-700'}`}>
                        {entry.speaker === 'model' ? `${conversation.characterName}:` : 'You:'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                        {entry.timestamp.toLocaleTimeString()}
                    </span>
                </div>
                <p>{entry.text}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
