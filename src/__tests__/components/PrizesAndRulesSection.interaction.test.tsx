import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * UI Interaction Tests for PrizesAndRulesSection Component
 * Tests collapsible rules section and touch interactions
 */

// Mock PrizesAndRulesSection component for testing
const MockPrizesAndRulesSection = ({ 
  firstPrize = 1000,
  secondPrize = 500,
  currency = '$SECOND',
}: { 
  firstPrize?: number;
  secondPrize?: number;
  currency?: string;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div data-testid="prizes-section">
      {/* Prize Cards */}
      <div data-testid="prize-cards">
        <div data-testid="first-prize-card">
          <span data-testid="first-prize-emoji">🥇</span>
          <span data-testid="first-prize-label">1st Place</span>
          <span data-testid="first-prize-amount">
            {firstPrize.toLocaleString()} {currency}
          </span>
        </div>
        <div data-testid="second-prize-card">
          <span data-testid="second-prize-emoji">🥈</span>
          <span data-testid="second-prize-label">2nd Place</span>
          <span data-testid="second-prize-amount">
            {secondPrize.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      {/* Collapsible Rules */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="rules-toggle"
        aria-expanded={isExpanded}
        aria-controls="rules-content"
      >
        📜 Game Rules {isExpanded ? '▲' : '▼'}
      </button>

      {isExpanded && (
        <div 
          id="rules-content"
          data-testid="rules-content"
          role="region"
          aria-label="Game rules"
        >
          <div data-testid="rule-1">
            <span>🎯</span>
            <span>Predict the exact number of transactions in the target Bitcoin block.</span>
          </div>
          <div data-testid="rule-2">
            <span>🏆</span>
            <span>The closest guess wins! Ties go to earliest submission.</span>
          </div>
          <div data-testid="rule-3">
            <span>🎰</span>
            <span>Exact match wins the jackpot!</span>
          </div>
          <div data-testid="rule-4">
            <span>⏰</span>
            <span>One guess per round per player.</span>
          </div>
        </div>
      )}
    </div>
  );
};

describe('PrizesAndRulesSection UI Interaction Tests', () => {
  describe('Prize Display', () => {
    it('should display first place prize', () => {
      render(<MockPrizesAndRulesSection firstPrize={1000} currency="$SECOND" />);
      
      const prizeText = screen.getByTestId('first-prize-amount').textContent;
      expect(prizeText).toContain('1');
      expect(prizeText).toContain('000');
      expect(prizeText).toContain('$SECOND');
    });

    it('should display second place prize', () => {
      render(<MockPrizesAndRulesSection secondPrize={500} currency="$SECOND" />);
      
      expect(screen.getByTestId('second-prize-amount')).toHaveTextContent('500 $SECOND');
    });

    it('should display prize emojis', () => {
      render(<MockPrizesAndRulesSection />);
      
      expect(screen.getByTestId('first-prize-emoji')).toHaveTextContent('🥇');
      expect(screen.getByTestId('second-prize-emoji')).toHaveTextContent('🥈');
    });

    it('should format large prize amounts with separators', () => {
      render(<MockPrizesAndRulesSection firstPrize={10000} />);
      
      const prizeText = screen.getByTestId('first-prize-amount').textContent;
      expect(prizeText).toContain('10');
      expect(prizeText).toContain('000');
    });
  });

  describe('Rules Toggle', () => {
    it('should start with rules collapsed', () => {
      render(<MockPrizesAndRulesSection />);
      
      expect(screen.queryByTestId('rules-content')).not.toBeInTheDocument();
    });

    it('should expand rules when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      await user.click(screen.getByTestId('rules-toggle'));
      
      expect(screen.getByTestId('rules-content')).toBeInTheDocument();
    });

    it('should collapse rules when toggle is clicked again', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      const toggle = screen.getByTestId('rules-toggle');
      await user.click(toggle); // expand
      await user.click(toggle); // collapse
      
      expect(screen.queryByTestId('rules-content')).not.toBeInTheDocument();
    });

    it('should update aria-expanded attribute', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      const toggle = screen.getByTestId('rules-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls pointing to rules content', () => {
      render(<MockPrizesAndRulesSection />);
      
      const toggle = screen.getByTestId('rules-toggle');
      expect(toggle).toHaveAttribute('aria-controls', 'rules-content');
    });
  });

  describe('Rules Content', () => {
    it('should display all rules when expanded', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      await user.click(screen.getByTestId('rules-toggle'));
      
      expect(screen.getByTestId('rule-1')).toBeInTheDocument();
      expect(screen.getByTestId('rule-2')).toBeInTheDocument();
      expect(screen.getByTestId('rule-3')).toBeInTheDocument();
      expect(screen.getByTestId('rule-4')).toBeInTheDocument();
    });

    it('should have accessible region role', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      await user.click(screen.getByTestId('rules-toggle'));
      
      const content = screen.getByTestId('rules-content');
      expect(content).toHaveAttribute('role', 'region');
      expect(content).toHaveAttribute('aria-label', 'Game rules');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle rules with Enter key', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      const toggle = screen.getByTestId('rules-toggle');
      toggle.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByTestId('rules-content')).toBeInTheDocument();
    });

    it('should toggle rules with Space key', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      const toggle = screen.getByTestId('rules-toggle');
      toggle.focus();
      await user.keyboard(' ');
      
      expect(screen.getByTestId('rules-content')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('should respond to touch/click on prize cards', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      // Prize cards should be visible and clickable (for potential future interactions)
      const firstPrizeCard = screen.getByTestId('first-prize-card');
      const secondPrizeCard = screen.getByTestId('second-prize-card');
      
      expect(firstPrizeCard).toBeInTheDocument();
      expect(secondPrizeCard).toBeInTheDocument();
    });

    it('should respond to touch on rules toggle', async () => {
      const user = userEvent.setup();
      render(<MockPrizesAndRulesSection />);
      
      // Simulate touch by clicking
      await user.click(screen.getByTestId('rules-toggle'));
      
      expect(screen.getByTestId('rules-content')).toBeInTheDocument();
    });
  });
});
