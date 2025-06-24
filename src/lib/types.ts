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
}

export interface QuizResult {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  date: string;
}
