// src/ai/flows/generate-quiz.ts
'use server';
/**
 * @fileOverview AI quiz generator flow.
 *
 * This file defines a Genkit flow for generating quizzes on a given topic using AI.
 * It includes the input and output schema definitions, the AI prompt, and the flow definition.
 *
 * @exports generateQuiz - An async function that takes a topic as input and returns a generated quiz.
 * @exports GenerateQuizInput - The input type for the generateQuiz function.
 * @exports GenerateQuizOutput - The output type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Define the output schema
const GenerateQuizOutputSchema = z.object({
  quiz: z.string().describe('The generated quiz in JSON format.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

// Define the async wrapper function
export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

// Define the prompt
const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are a quiz generator AI.

  Generate a quiz on the topic of "{{topic}}". The quiz MUST have exactly 10 questions.

  The quiz should be returned as a JSON string that is an array of question objects.

  Each question object MUST have the following properties:
  - question: the question text (string)
  - options: an array of 4 possible answers (array of strings)
  - answer: the 0-based index of the correct answer in the options array (number)

  Example:
  [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Rome"],
      "answer": 1
    },
    {
      "question": "What is the highest mountain in the world?",
      "options": ["Mount Everest", "K2", "Kangchenjunga", "Lhotse"],
      "answer": 0
    }
  ]
  `,
});

// Define the flow
const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
