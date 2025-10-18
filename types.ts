export interface TranscriptEntry {
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  startTime: Date;
  characterName: string;
  topic: string;
  transcript: TranscriptEntry[];
}

export interface Character {
  key: string;
  name: string;
  tagline: string;
  description: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  systemPrompt: string;
  themeColor: string;
  topics: { title: string; description: string; }[];
  getTopicPrompt: (topic: string) => string;
}

export interface SessionSummary extends Conversation {
  endTime: Date;
  feedback?: {
    rating: number;
    comment: string;
  };
}

export type VoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

export const AVAILABLE_VOICES: { name: VoiceName; description: string, sampleText: string }[] = [
  { name: 'Kore', description: 'Firm, Middle pitch', sampleText: 'Hello, I can be your voice assistant.' },
  { name: 'Fenrir', description: 'Excitable, Lower middle pitch', sampleText: 'Hello, I can be your voice assistant.' },
  { name: 'Zephyr', description: 'Bright, Higher pitch', sampleText: 'Hello, I can be your voice assistant.' },
  { name: 'Puck', description: 'Upbeat, Middle pitch', sampleText: 'Hello, I can be your voice assistant.' },
  { name: 'Charon', description: 'Informative, Lower pitch', sampleText: 'Hello, I can be your voice assistant.' },
];
