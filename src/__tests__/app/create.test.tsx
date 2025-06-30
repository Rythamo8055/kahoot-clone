
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateQuizPage from '@/app/create/page';
import { generateQuiz } from '@/ai/flows/generate-quiz';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/components/auth-provider');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
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

const mockUseAuth = useAuth as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockGenerateQuiz = generateQuiz as jest.Mock;
const mockAddDoc = addDoc as jest.Mock;

describe('CreateQuizPage', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
  });

  it('redirects to /login if user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<CreateQuizPage />);
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows loading skeletons when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(<CreateQuizPage />);
    // Check for the presence of multiple skeletons
    const skeletons = screen.getAllByRole('generic', { name: '' });
    expect(skeletons.length).toBeGreaterThan(2); 
  });
  
  it('renders the create quiz page for an authenticated user', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user-id' }, loading: false });
    render(<CreateQuizPage />);
    expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByText('Save Quiz')).toBeInTheDocument();
  });

  it('handles successful AI quiz generation', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user-id' }, loading: false });
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

    expect(screen.getByRole('button', { name: /Generate/i })).toHaveAttribute('disabled');
    
    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('Quiz on France');
    });

    expect(screen.getByLabelText('Description')).toHaveValue('An AI-generated quiz about France.');
    expect(screen.getByDisplayValue('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
  });
  
  it('saves a manually created quiz to firebase', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user-id' }, loading: false });
    render(<CreateQuizPage />);
    
    const titleInput = screen.getByLabelText('Title');
    const questionInput = screen.getByLabelText('Question 1');
    const answerSelect = screen.getAllByRole('combobox')[0];
    const saveButton = screen.getByRole('button', { name: /Save Quiz/i });

    await userEvent.type(titleInput, 'My Manual Quiz');
    await userEvent.type(questionInput, '1 + 1 = ?');
    
    const allOptionInputs = screen.getAllByRole('textbox');
    // Title, Description, AI Topic, Question 1, Option 1, Option 2
    await userEvent.clear(allOptionInputs[4]); 
    await userEvent.type(allOptionInputs[4], '2');
    await userEvent.clear(allOptionInputs[5]);
    await userEvent.type(allOptionInputs[5], '3');
    
    await userEvent.click(answerSelect);
    await userEvent.click(await screen.findByText('2')); 

    await userEvent.click(saveButton);

    await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                title: 'My Manual Quiz',
                userId: 'test-user-id',
            })
        );
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });
});
