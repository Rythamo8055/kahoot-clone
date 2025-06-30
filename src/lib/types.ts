
export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number; // index of correct option
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  userId: string;
  createdAt?: any;
}

export interface QuizResult {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface Player {
  id:string;
  name: string;
  score: number;
  lastAnswer?: number | null;
}

export interface GameState {
  id: string;
  quizId: string;
  quizData: Quiz;
  gameState: 'waiting' | 'question' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  questionStartTime: any;
  createdAt: any;
}
