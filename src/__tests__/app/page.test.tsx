
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { useAuth } from '@/components/auth-provider';

// Mock the useAuth hook
jest.mock('@/components/auth-provider');
const mockUseAuth = useAuth as jest.Mock;

// Mock Next.js Link component for testing
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Home Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders the main headline', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<Home />);
    const heading = screen.getByRole('heading', {
      name: /the future of quizzing is here/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the main call-to-action buttons', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<Home />);
    const createButton = screen.getByRole('link', { name: /create a quiz/i });
    const joinButton = screen.getByRole('link', { name: /join a game/i });

    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/create');

    expect(joinButton).toBeInTheDocument();
    expect(joinButton).toHaveAttribute('href', '/join');
  });

  it('renders "Sign In" button when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<Home />);
    const signInButton = screen.getByRole('link', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute('href', '/login');
  });

  it('renders "Go to Dashboard" button when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user-id' } });
    render(<Home />);
    const dashboardButton = screen.getByRole('link', { name: /go to dashboard/i });
    expect(dashboardButton).toBeInTheDocument();
    expect(dashboardButton).toHaveAttribute('href', '/dashboard');
  });

  it('renders the footer', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<Home />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} QuizAI. All rights reserved.`)).toBeInTheDocument();
  });

  it('displays the AI-powered badge', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<Home />);
    expect(screen.getByText(/Powered by Generative AI/i)).toBeInTheDocument();
  });
});
