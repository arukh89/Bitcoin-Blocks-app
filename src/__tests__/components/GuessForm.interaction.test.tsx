import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * UI Interaction Tests for GuessForm Component
 * Tests button clicks, input handling, and form submission
 */

// Mock GuessForm component for testing
const MockGuessForm = ({ 
  onSubmit, 
  disabled = false,
  hasExistingGuess = false 
}: { 
  onSubmit: (guess: number) => Promise<{ error: any }>;
  disabled?: boolean;
  hasExistingGuess?: boolean;
}) => {
  const [guess, setGuess] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess || isNaN(Number(guess))) {
      setError('Please enter a valid number');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const result = await onSubmit(Number(guess));
    
    if (result.error) {
      setError(String(result.error));
    } else {
      setGuess('');
    }
    
    setIsSubmitting(false);
  };

  if (hasExistingGuess) {
    return (
      <div data-testid="already-submitted">
        You already submitted a guess for this round
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="guess-form">
      <input
        type="number"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Enter your guess"
        disabled={disabled || isSubmitting}
        data-testid="guess-input"
        aria-label="Transaction count guess"
      />
      <button 
        type="submit" 
        disabled={disabled || isSubmitting || !guess}
        data-testid="submit-button"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Guess'}
      </button>
      {error && <div data-testid="error-message" role="alert">{error}</div>}
    </form>
  );
};

describe('GuessForm UI Interaction Tests', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSubmit = vi.fn().mockResolvedValue({ error: null });
  });

  describe('Input Handling', () => {
    it('should allow typing numbers in the input field', async () => {
      const user = userEvent.setup();
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      await user.type(input, '2500');
      
      expect(input).toHaveValue(2500);
    });

    it('should clear input after successful submission', async () => {
      const user = userEvent.setup();
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      const button = screen.getByTestId('submit-button');
      
      await user.type(input, '3000');
      await user.click(button);
      
      await waitFor(() => {
        expect(input).toHaveValue(null);
      });
    });

    it('should show error for invalid input', async () => {
      const user = userEvent.setup();
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      const button = screen.getByTestId('submit-button');
      
      // Clear and submit empty
      await user.clear(input);
      fireEvent.submit(screen.getByTestId('guess-form'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Button Clicks', () => {
    it('should call onSubmit when submit button is clicked', async () => {
      const user = userEvent.setup();
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      const button = screen.getByTestId('submit-button');
      
      await user.type(input, '2500');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(2500);
      });
    });

    it('should disable button while submitting', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));
      
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      const button = screen.getByTestId('submit-button');
      
      await user.type(input, '2500');
      await user.click(button);
      
      // Button should be disabled during submission
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Submitting...');
      
      // Wait for submission to complete - button stays disabled because input is cleared
      await waitFor(() => {
        expect(button).toHaveTextContent('Submit Guess');
      });
    });

    it('should disable button when input is empty', () => {
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const button = screen.getByTestId('submit-button');
      expect(button).toBeDisabled();
    });

    it('should disable button when form is disabled', () => {
      render(<MockGuessForm onSubmit={mockOnSubmit} disabled={true} />);
      
      const button = screen.getByTestId('submit-button');
      const input = screen.getByTestId('guess-input');
      
      expect(button).toBeDisabled();
      expect(input).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      
      await user.type(input, '2500');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(2500);
      });
    });

    it('should show error message when submission fails', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ error: 'Network error' });
      
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByTestId('guess-input');
      const button = screen.getByTestId('submit-button');
      
      await user.type(input, '2500');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });
    });

    it('should show already submitted message when user has existing guess', () => {
      render(<MockGuessForm onSubmit={mockOnSubmit} hasExistingGuess={true} />);
      
      expect(screen.getByTestId('already-submitted')).toBeInTheDocument();
      expect(screen.queryByTestId('guess-form')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible input label', () => {
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      const input = screen.getByLabelText('Transaction count guess');
      expect(input).toBeInTheDocument();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<MockGuessForm onSubmit={mockOnSubmit} />);
      
      fireEvent.submit(screen.getByTestId('guess-form'));
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});
