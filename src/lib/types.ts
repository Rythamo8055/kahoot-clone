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
  id: string;
  name: string;
  score: number;
}
