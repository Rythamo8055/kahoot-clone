import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateQuizPage from '@/app/create/page';
import { generateQuiz } from '@/ai/flows/generate-quiz';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/ai/flows/generate-quiz', () => ({
  generateQuiz: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  addDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

const mockGenerateQuiz = generateQuiz as jest.Mock;
const mockAddDoc = addDoc as jest.Mock;

describe('CreateQuizPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create quiz page with initial form', () => {
    render(<CreateQuizPage />);
    expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Add Question')).toBeInTheDocument();
    expect(screen.getByText('Save Quiz')).toBeInTheDocument();
  });

  it('shows validation error if title is empty on submit', async () => {
    render(<CreateQuizPage />);
    const saveButton = screen.getByRole('button', { name: /Save Quiz/i });
    
    await userEvent.click(saveButton);
    
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('handles successful AI quiz generation', async () => {
    const aiResponse = {
      quiz: JSON.stringify([
        {
          question: 'What is the capital of France?',
          options: ['London', 'Paris', 'Berlin'],
          answer: 1,
        },
      ]),
    };
    mockGenerateQuiz.mockResolvedValue(aiResponse);

    render(<CreateQuizPage />);
    const topicInput = screen.getByPlaceholderText(/e.g., 'The Roman Empire'/);
    const generateButton = screen.getByRole('button', { name: /Generate/i });

    await userEvent.type(topicInput, 'France');
    await userEvent.click(generateButton);

    expect(screen.getByRole('button', { name: /Generate/i })).toHaveTextContent(''); // Loader is shown

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('Quiz on France');
    });

    expect(screen.getByLabelText('Description')).toHaveValue('An AI-generated quiz about France.');
    expect(screen.getByDisplayValue('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
  });

  it('handles AI quiz generation failure', async () => {
    mockGenerateQuiz.mockRejectedValue(new Error('AI failed'));
    const { toast } = require('@/hooks/use-toast').useToast();
    
    render(<CreateQuizPage />);
    const topicInput = screen.getByPlaceholderText(/e.g., 'The Roman Empire'/);
    const generateButton = screen.getByRole('button', { name: /Generate/i });
    
    await userEvent.type(topicInput, 'Failure Topic');
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'AI Generation Failed',
        variant: 'destructive'
      }));
    });
  });

  it('allows adding and removing questions manually', async () => {
    render(<CreateQuizPage />);
    
    // Starts with one question
    expect(screen.getAllByText(/Question \d/)).toHaveLength(1);

    // Add a question
    const addButton = screen.getByRole('button', { name: /Add Question/i });
    await userEvent.click(addButton);
    expect(screen.getAllByText(/Question \d/)).toHaveLength(2);
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    
    // Remove the second question
    const removeButtons = screen.getAllByRole('button', { name: '' }); // Trash icon buttons have no text
    const secondRemoveButton = removeButtons[1];
    await userEvent.click(secondRemoveButton);
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Question \d/)).toHaveLength(1);
  });

  it('saves a manually created quiz to firebase', async () => {
    const { push } = require('next/navigation').useRouter();
    render(<CreateQuizPage />);
    
    const titleInput = screen.getByLabelText('Title');
    const questionInput = screen.getByLabelText('Question 1');
    const option1Input = screen.getByDisplayValue('Option 1'); // Placeholder for an empty input
    const option2Input = screen.getByDisplayValue('Option 2'); // Placeholder for an empty input
    const answerSelect = screen.getAllByRole('combobox')[0];
    const saveButton = screen.getByRole('button', { name: /Save Quiz/i });

    await userEvent.type(titleInput, 'My Manual Quiz');
    await userEvent.type(questionInput, '1 + 1 = ?');
    
    // It's tricky to get the exact option inputs, let's get all inputs and fill them
    const allOptionInputs = screen.getAllByRole('textbox');
    // Title, Description, Question, Option, Option
    await userEvent.clear(allOptionInputs[3]); // Option 1
    await userEvent.type(allOptionInputs[3], '2');
    await userEvent.clear(allOptionInputs[4]); // Option 2
    await userEvent.type(allOptionInputs[4], '3');
    
    // Open select and choose answer
    await userEvent.click(answerSelect);
    await userEvent.click(await screen.findByText('2')); // Select '2' as the correct answer (index 0)

    await userEvent.click(saveButton);

    await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
            expect.anything(), // The collection object
            expect.objectContaining({
                title: 'My Manual Quiz',
                userId: 'test-user-id',
                questions: expect.arrayContaining([
                    expect.objectContaining({
                        question: '1 + 1 = ?',
                        options: ['2', '3'],
                        answer: 0,
                    }),
                ]),
            })
        );
    });

    expect(push).toHaveBeenCalledWith('/dashboard');
  });
});
