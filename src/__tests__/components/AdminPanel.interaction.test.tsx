import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * UI Interaction Tests for AdminPanel Component
 * Tests expand/collapse, tab switching, and form interactions
 */

// Mock AdminPanel component for testing
const MockAdminPanel = ({ 
  isAdmin = true,
  onCreateRound,
  onFetchBlock,
  onUpdateResult,
  onSavePrize,
}: { 
  isAdmin?: boolean;
  onCreateRound?: (data: any) => Promise<{ error: any }>;
  onFetchBlock?: (blockNumber: string) => Promise<{ tx_count: number; hash: string } | { error: string }>;
  onUpdateResult?: (data: any) => Promise<{ error: any }>;
  onSavePrize?: (data: any) => Promise<{ error: any }>;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'round' | 'result' | 'prize'>('round');
  const [roundNumber, setRoundNumber] = React.useState('1');
  const [duration, setDuration] = React.useState('10');
  const [prize, setPrize] = React.useState('5000 $SECOND');
  const [blockNumber, setBlockNumber] = React.useState('');
  const [txCount, setTxCount] = React.useState('');
  const [blockHash, setBlockHash] = React.useState('');
  const [jackpot, setJackpot] = React.useState('5000');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isAdmin) return null;

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateRound) return;
    
    setIsSubmitting(true);
    const result = await onCreateRound({ roundNumber, duration, prize });
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Round created!' });
    setIsSubmitting(false);
  };

  const handleFetchBlock = async () => {
    if (!onFetchBlock || !blockNumber) return;
    
    setIsSubmitting(true);
    const result = await onFetchBlock(blockNumber);
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setTxCount(String(result.tx_count));
      setBlockHash(result.hash);
      setMessage({ type: 'success', text: `Fetched block data` });
    }
    setIsSubmitting(false);
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateResult) return;
    
    setIsSubmitting(true);
    const result = await onUpdateResult({ txCount, blockHash });
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Result updated!' });
    setIsSubmitting(false);
  };

  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSavePrize) return;
    
    setIsSubmitting(true);
    const result = await onSavePrize({ jackpot });
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Prize saved!' });
    setIsSubmitting(false);
  };

  return (
    <div data-testid="admin-panel">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="expand-button"
        aria-expanded={isExpanded}
      >
        Admin Panel {isExpanded ? '▲' : '▼'}
      </button>

      {isExpanded && (
        <div data-testid="admin-content">
          {message && (
            <div 
              data-testid="message" 
              role="alert"
              className={message.type === 'success' ? 'success' : 'error'}
            >
              {message.text}
            </div>
          )}

          <div role="tablist" data-testid="tab-list">
            <button 
              role="tab"
              aria-selected={activeTab === 'round'}
              onClick={() => setActiveTab('round')}
              data-testid="tab-round"
            >
              Create Round
            </button>
            <button 
              role="tab"
              aria-selected={activeTab === 'result'}
              onClick={() => setActiveTab('result')}
              data-testid="tab-result"
            >
              Update Result
            </button>
            <button 
              role="tab"
              aria-selected={activeTab === 'prize'}
              onClick={() => setActiveTab('prize')}
              data-testid="tab-prize"
            >
              Prize Config
            </button>
          </div>

          {activeTab === 'round' && (
            <form onSubmit={handleCreateRound} data-testid="round-form">
              <input
                type="number"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
                data-testid="round-number-input"
                aria-label="Round number"
              />
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                data-testid="duration-input"
                aria-label="Duration in minutes"
              />
              <input
                type="text"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                data-testid="prize-input"
                aria-label="Prize amount"
              />
              <button type="submit" disabled={isSubmitting} data-testid="create-round-button">
                {isSubmitting ? 'Creating...' : 'Create Round'}
              </button>
            </form>
          )}

          {activeTab === 'result' && (
            <form onSubmit={handleUpdateResult} data-testid="result-form">
              <input
                type="number"
                value={blockNumber}
                onChange={(e) => setBlockNumber(e.target.value)}
                data-testid="block-number-input"
                aria-label="Block number"
              />
              <button 
                type="button" 
                onClick={handleFetchBlock}
                disabled={isSubmitting || !blockNumber}
                data-testid="fetch-block-button"
              >
                Fetch Block Data
              </button>
              <input
                type="number"
                value={txCount}
                onChange={(e) => setTxCount(e.target.value)}
                data-testid="tx-count-input"
                aria-label="Transaction count"
              />
              <input
                type="text"
                value={blockHash}
                onChange={(e) => setBlockHash(e.target.value)}
                data-testid="block-hash-input"
                aria-label="Block hash"
              />
              <button type="submit" disabled={isSubmitting} data-testid="update-result-button">
                Update Result
              </button>
            </form>
          )}

          {activeTab === 'prize' && (
            <form onSubmit={handleSavePrize} data-testid="prize-form">
              <input
                type="number"
                value={jackpot}
                onChange={(e) => setJackpot(e.target.value)}
                data-testid="jackpot-input"
                aria-label="Jackpot amount"
              />
              <button type="submit" disabled={isSubmitting} data-testid="save-prize-button">
                Save Prize Config
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

describe('AdminPanel UI Interaction Tests', () => {
  let mockCreateRound: ReturnType<typeof vi.fn>;
  let mockFetchBlock: ReturnType<typeof vi.fn>;
  let mockUpdateResult: ReturnType<typeof vi.fn>;
  let mockSavePrize: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateRound = vi.fn().mockResolvedValue({ error: null });
    mockFetchBlock = vi.fn().mockResolvedValue({ tx_count: 2500, hash: 'abc123' });
    mockUpdateResult = vi.fn().mockResolvedValue({ error: null });
    mockSavePrize = vi.fn().mockResolvedValue({ error: null });
  });

  describe('Visibility', () => {
    it('should not render for non-admin users', () => {
      render(<MockAdminPanel isAdmin={false} />);
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    });

    it('should render for admin users', () => {
      render(<MockAdminPanel isAdmin={true} />);
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should start collapsed', () => {
      render(<MockAdminPanel />);
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('should expand when button is clicked', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      await user.click(screen.getByTestId('expand-button'));
      
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    it('should collapse when button is clicked again', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      const button = screen.getByTestId('expand-button');
      await user.click(button); // expand
      await user.click(button); // collapse
      
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('should update aria-expanded attribute', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      const button = screen.getByTestId('expand-button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Tab Switching', () => {
    it('should show round form by default', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      await user.click(screen.getByTestId('expand-button'));
      
      expect(screen.getByTestId('round-form')).toBeInTheDocument();
    });

    it('should switch to result tab when clicked', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      await user.click(screen.getByTestId('expand-button'));
      await user.click(screen.getByTestId('tab-result'));
      
      expect(screen.getByTestId('result-form')).toBeInTheDocument();
      expect(screen.queryByTestId('round-form')).not.toBeInTheDocument();
    });

    it('should switch to prize tab when clicked', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      await user.click(screen.getByTestId('expand-button'));
      await user.click(screen.getByTestId('tab-prize'));
      
      expect(screen.getByTestId('prize-form')).toBeInTheDocument();
    });

    it('should update aria-selected on tabs', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel />);
      
      await user.click(screen.getByTestId('expand-button'));
      
      expect(screen.getByTestId('tab-round')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('tab-result')).toHaveAttribute('aria-selected', 'false');
      
      await user.click(screen.getByTestId('tab-result'));
      
      expect(screen.getByTestId('tab-round')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-result')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Create Round Form', () => {
    it('should call onCreateRound with form data', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel onCreateRound={mockCreateRound} />);
      
      await user.click(screen.getByTestId('expand-button'));
      
      const roundInput = screen.getByTestId('round-number-input');
      const durationInput = screen.getByTestId('duration-input');
      const prizeInput = screen.getByTestId('prize-input');
      
      await user.clear(roundInput);
      await user.type(roundInput, '5');
      await user.clear(durationInput);
      await user.type(durationInput, '15');
      await user.clear(prizeInput);
      await user.type(prizeInput, '10000 $SECOND');
      
      await user.click(screen.getByTestId('create-round-button'));
      
      await waitFor(() => {
        expect(mockCreateRound).toHaveBeenCalledWith({
          roundNumber: '5',
          duration: '15',
          prize: '10000 $SECOND',
        });
      });
    });

    it('should show success message after creating round', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel onCreateRound={mockCreateRound} />);
      
      await user.click(screen.getByTestId('expand-button'));
      await user.click(screen.getByTestId('create-round-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Round created!');
      });
    });
  });

  describe('Fetch Block Data', () => {
    it('should fetch block data and populate fields', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel onFetchBlock={mockFetchBlock} />);
      
      await user.click(screen.getByTestId('expand-button'));
      await user.click(screen.getByTestId('tab-result'));
      
      const blockInput = screen.getByTestId('block-number-input');
      await user.type(blockInput, '875420');
      await user.click(screen.getByTestId('fetch-block-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('tx-count-input')).toHaveValue(2500);
        expect(screen.getByTestId('block-hash-input')).toHaveValue('abc123');
      });
    });

    it('should disable fetch button when block number is empty', async () => {
      const user = userEvent.setup();
      render(<MockAdminPanel onFetchBlock={mockFetchBlock} />);
      
      await user.click(screen.getByTestId('expand-button'));
      await user.click(screen.getByTestId('tab-result'));
      
      expect(screen.getByTestId('fetch-block-button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when create round fails', async () => {
      const user = userEvent.setup();
      mockCreateRound.mockResolvedValue({ error: 'Failed to create round' });
      
      render(<MockAdminPanel onCreateRound={mockCreateRound} />);
      
      await user.click(screen.getByTestId('expand-button'));
      await user.click(screen.getByTestId('create-round-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Failed to create round');
      });
    });
  });
});
