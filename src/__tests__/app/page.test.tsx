import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock Next.js Link component for testing
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Home Page', () => {
  it('renders the main headline', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', {
      name: /the future of quizzing is here/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the main call-to-action buttons', () => {
    render(<Home />);
    const createButton = screen.getByRole('link', { name: /create a quiz/i });
    const joinButton = screen.getByRole('link', { name: /join a game/i });

    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/create');

    expect(joinButton).toBeInTheDocument();
    expect(joinButton).toHaveAttribute('href', '/join');
  });

  it('renders the header and footer', () => {
    render(<Home />);
    // Check for header content
    expect(screen.getByText('QuizAI')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();

    // Check for footer content
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} QuizAI. All rights reserved.`)).toBeInTheDocument();
  });

  it('displays the AI-powered badge', () => {
    render(<Home />);
    expect(screen.getByText(/Powered by Generative AI/i)).toBeInTheDocument();
  });
});
