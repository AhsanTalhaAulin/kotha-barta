import {
  SurveyorIcon,
  DebaterIcon,
  NegotiatorIcon,
  InterviewerIcon,
  TeacherIcon,
} from '../components/Icons';
import { type Character } from '../types';
import { basePrompt } from './base';
import { nemoPrompt } from './nemo';
import { torkoPrompt } from './torko';
import { shondhiPrompt } from './shondhi';
import { porikhaPrompt } from './porikha';
import { gyanPrompt } from './gyan';

export const CHARACTERS: Record<string, Character> = {
  nemo: {
    key: 'nemo',
    name: 'Nemo',
    tagline: 'The Social Surveyor',
    description: 'A witty, curious conversationalist trying to understand the human perception of AI in Bangladesh.',
    Icon: SurveyorIcon,
    themeColor: 'blue',
    systemPrompt: `${basePrompt}\n${nemoPrompt}`,
    topics: [
        { title: "Google's $15B Investment in India", description: "Discuss the impact of major AI investments in the region on Bangladesh." },
        { title: "AI in the Bangladeshi Workplace", description: "Explore hopes and fears about AI affecting jobs in local industries." },
        { title: "ChatGPT and Education", description: "How is generative AI changing the way students learn and think in Bangladesh?" },
    ],
    getTopicPrompt: (topic: string) => `The user wants to discuss the following topic: "${topic}". Please initiate the conversation based on this topic, keeping your Nemo persona in mind.`
  },
  torko: {
    key: 'torko',
    name: 'Torko',
    tagline: 'The Debater',
    description: 'A sharp and logical debater who loves intellectual challenges. Ready to argue for or against any topic.',
    Icon: DebaterIcon,
    themeColor: 'red',
    systemPrompt: `${basePrompt}\n${torkoPrompt}`,
    topics: [
        { title: "Technology is making people lonelier", description: "Argue whether modern tech fosters true connection or isolation." },
        { title: "Remote work is better than office work", description: "Debate the pros and cons of remote versus traditional work models." },
        { title: "Social media does more harm than good", description: "Weigh the societal benefits of social media against its negative impacts." },
    ],
    getTopicPrompt: (topic: string) => `The motion for this debate is: "${topic}". For the purpose of this debate, you will argue FOR the motion. Please begin with your opening statement.`
  },
  shondhi: {
    key: 'shondhi',
    name: 'Shondhi',
    tagline: 'The Negotiator',
    description: 'A calm, strategic negotiator focused on finding a win-win solution. Can you strike a good deal?',
    Icon: NegotiatorIcon,
    themeColor: 'green',
    systemPrompt: `${basePrompt}\n${shondhiPrompt}`,
    topics: [
        { title: "Salary for a Senior Product Manager", description: "Negotiate your salary for a new job offer at a top tech company." },
        { title: "Price of a second-hand car", description: "You are buying a used car. Haggle with the seller to get the best price." },
        { title: "Project deadline with a client", description: "Negotiate a more realistic project deadline without losing the client's trust." },
    ],
    getTopicPrompt: (topic: string) => `The negotiation scenario is: "${topic}". You are the hiring manager/seller/client lead. Please start the negotiation with your opening offer.`
  },
  porikha: {
    key: 'porikha',
    name: 'Porikha',
    tagline: 'The Interviewer',
    description: 'A professional and insightful interviewer. Get ready for a realistic job interview experience.',
    Icon: InterviewerIcon,
    themeColor: 'yellow',
    systemPrompt: `${basePrompt}\n${porikhaPrompt}`,
    topics: [
        { title: "Software Engineer role", description: "A standard technical interview focusing on behavioral and conceptual questions." },
        { title: "Product Manager role", description: "An interview assessing your product sense, strategic thinking, and leadership." },
        { title: "Data Analyst role", description: "An interview focused on your analytical skills, data interpretation, and business acumen." },
    ],
    getTopicPrompt: (topic: string) => `You are interviewing the user for a "${topic}" position. Please begin the interview with your introduction.`
  },
  gyan: {
    key: 'gyan',
    name: 'Gyan',
    tagline: 'The Teacher',
    description: 'A patient and enthusiastic teacher who can break down complex topics into simple, understandable concepts.',
    Icon: TeacherIcon,
    themeColor: 'indigo',
    systemPrompt: `${basePrompt}\n${gyanPrompt}`,
    topics: [
        { title: "How does a blockchain work?", description: "Learn the fundamentals of blocks, chains, and decentralization." },
        { title: "What is a Neural Network?", description: "An introduction to the core concept behind modern AI and machine learning." },
        { title: "The Basics of Quantum Computing", description: "A simple explanation of qubits, superposition, and entanglement." },
    ],
    getTopicPrompt: (topic: string) => `The user has chosen to learn about: "${topic}". Please begin your lesson in your patient and encouraging teaching style.`
  },
};
