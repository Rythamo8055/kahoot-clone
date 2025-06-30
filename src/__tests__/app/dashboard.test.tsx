
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useAuth } from '@/components/auth-provider';
import { getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/components/auth-provider');
jest.mock('firebase/firestore');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('DashboardPage', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
  });

  it('shows loading skeletons when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(<DashboardPage />);
    // Check for the presence of multiple skeletons
    const skeletons = screen.getAllByRole('generic', { name: '' });
    expect(skeletons.length).toBeGreaterThan(2); 
  });

  it('redirects to /login if user is not authenticated and auth is not loading', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows "No Quizzes Yet!" message when there are no quizzes for an authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user' }, loading: false });
    mockGetDocs.mockResolvedValue({ docs: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No Quizzes Yet!')).toBeInTheDocument();
    });
    expect(screen.getByText('Click the button below to create your first quiz.')).toBeInTheDocument();
  });

  it('displays a list of quizzes when they exist for an authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user' }, loading: false });
    const mockQuizzes = [
      { id: '1', data: () => ({ title: 'Quiz One', description: 'Desc One', questions: [{}] }) },
      { id: '2', data: () => ({ title: 'Quiz Two', description: 'Desc Two', questions: [{}, {}] }) },
    ];
    mockGetDocs.mockResolvedValue({ docs: mockQuizzes });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Quiz One')).toBeInTheDocument();
    });

    expect(screen.getByText('Desc One')).toBeInTheDocument();
    expect(screen.getByText('1 Questions')).toBeInTheDocument();
    expect(screen.getByText('Quiz Two')).toBeInTheDocument();
    expect(screen.getByText('Desc Two')).toBeInTheDocument();
    expect(screen.getByText('2 Questions')).toBeInTheDocument();
  });

  it('shows a toast message on firebase error', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user' }, loading: false });
    mockGetDocs.mockRejectedValue(new Error('Firebase failed'));
    const { toast } = require('@/hooks/use-toast').useToast();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Failed to load quizzes',
        description: 'Could not fetch your quizzes from the database.',
        variant: 'destructive',
      });
    });
  });

  it('does not fetch quizzes if user object is not yet available', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<DashboardPage />);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});
