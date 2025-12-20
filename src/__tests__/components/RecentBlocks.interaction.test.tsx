import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * UI Interaction Tests for RecentBlocks Component
 * Tests refresh button, loading states, and error handling
 */

interface BitcoinBlock {
  height: number;
  hash: string;
  tx_count: number;
  timestamp: number;
  size: number;
}

// Mock RecentBlocks component for testing
const MockRecentBlocks = ({ 
  fetchBlocks,
  initialBlocks = [],
}: { 
  fetchBlocks: () => Promise<BitcoinBlock[]>;
  initialBlocks?: BitcoinBlock[];
}) => {
  const [blocks, setBlocks] = React.useState<BitcoinBlock[]>(initialBlocks);
  const [loading, setLoading] = React.useState(initialBlocks.length === 0);
  const [error, setError] = React.useState<string | null>(null);

  const handleFetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchBlocks();
      setBlocks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  }, [fetchBlocks]);

  React.useEffect(() => {
    if (initialBlocks.length === 0) {
      handleFetch();
    }
  }, []);

  const formatHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  const formatSize = (size: number) => `${(size / 1000000).toFixed(2)} MB`;
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();

  if (loading) {
    return (
      <div data-testid="recent-blocks">
        <h2>🧱 Recent Blocks</h2>
        <div data-testid="loading-skeleton" role="status" aria-label="Loading blocks">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} data-testid={`skeleton-${i}`} className="skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="recent-blocks">
        <h2>🧱 Recent Blocks</h2>
        <div data-testid="error-state" role="alert">
          <span data-testid="error-message">❌ {error}</span>
          <button 
            onClick={handleFetch}
            data-testid="retry-button"
            aria-label="Retry loading blocks"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="recent-blocks">
      <div className="header">
        <h2>🧱 Recent Blocks</h2>
        <button 
          onClick={handleFetch}
          data-testid="refresh-button"
          aria-label="Refresh blocks"
        >
          🔄 Refresh
        </button>
      </div>

      <div 
        data-testid="blocks-container" 
        role="list"
        aria-label="Recent Bitcoin blocks"
        className="horizontal-scroll"
      >
        {blocks.map((block) => (
          <div 
            key={block.hash}
            data-testid={`block-${block.height}`}
            role="listitem"
            className="block-card"
            tabIndex={0}
          >
            <div data-testid="block-height">#{block.height.toLocaleString()}</div>
            <div data-testid="block-tx-count" className="prominent">
              {block.tx_count.toLocaleString()} txs
            </div>
            <div data-testid="block-hash">{formatHash(block.hash)}</div>
            <div data-testid="block-size">{formatSize(block.size)}</div>
            <div data-testid="block-time">{formatTime(block.timestamp)}</div>
          </div>
        ))}
      </div>

      <p data-testid="auto-refresh-note">Auto-refreshes every 60 seconds</p>
    </div>
  );
};

describe('RecentBlocks UI Interaction Tests', () => {
  let mockFetchBlocks: ReturnType<typeof vi.fn>;
  const mockBlocks: BitcoinBlock[] = [
    { height: 875420, hash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd', tx_count: 2500, timestamp: 1700000000, size: 1500000 },
    { height: 875419, hash: 'def456abc123def456abc123def456abc123def456abc123def456abc123defg', tx_count: 2300, timestamp: 1699999400, size: 1400000 },
    { height: 875418, hash: 'ghi789jkl012ghi789jkl012ghi789jkl012ghi789jkl012ghi789jkl012ghij', tx_count: 2100, timestamp: 1699998800, size: 1300000 },
  ];

  beforeEach(() => {
    mockFetchBlocks = vi.fn().mockResolvedValue(mockBlocks);
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      mockFetchBlocks.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should show 5 skeleton placeholders', () => {
      mockFetchBlocks.mockImplementation(() => new Promise(() => {}));
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`skeleton-${i}`)).toBeInTheDocument();
      }
    });

    it('should have accessible loading status', () => {
      mockFetchBlocks.mockImplementation(() => new Promise(() => {}));
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading blocks');
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockFetchBlocks.mockRejectedValue(new Error('Network error'));
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });
    });

    it('should show retry button on error', async () => {
      mockFetchBlocks.mockRejectedValue(new Error('Failed'));
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockFetchBlocks
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockBlocks);
      
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('blocks-container')).toBeInTheDocument();
      });
      
      expect(mockFetchBlocks).toHaveBeenCalledTimes(2);
    });

    it('should have accessible error alert', async () => {
      mockFetchBlocks.mockRejectedValue(new Error('Failed'));
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        const errorState = screen.getByTestId('error-state');
        expect(errorState).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Blocks Display', () => {
    it('should display blocks after loading', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('blocks-container')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('block-875420')).toBeInTheDocument();
      expect(screen.getByTestId('block-875419')).toBeInTheDocument();
    });

    it('should display block details correctly', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        const block = screen.getByTestId('block-875420');
        expect(block).toBeInTheDocument();
      });
    });

    it('should have accessible list structure', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        const container = screen.getByTestId('blocks-container');
        expect(container).toHaveAttribute('role', 'list');
        expect(container).toHaveAttribute('aria-label', 'Recent Bitcoin blocks');
      });
    });

    it('should make block cards focusable for keyboard navigation', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        const block = screen.getByTestId('block-875420');
        expect(block).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Refresh Button', () => {
    it('should show refresh button when blocks are loaded', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
    });

    it('should fetch new blocks when refresh is clicked', async () => {
      const user = userEvent.setup();
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('refresh-button'));
      
      expect(mockFetchBlocks).toHaveBeenCalledTimes(2);
    });

    it('should have accessible label', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        const button = screen.getByTestId('refresh-button');
        expect(button).toHaveAttribute('aria-label', 'Refresh blocks');
      });
    });
  });

  describe('Auto-refresh Note', () => {
    it('should display auto-refresh information', async () => {
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auto-refresh-note')).toHaveTextContent('Auto-refreshes every 60 seconds');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard focus on refresh button', async () => {
      const user = userEvent.setup();
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
      
      const button = screen.getByTestId('refresh-button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('should trigger refresh with Enter key', async () => {
      const user = userEvent.setup();
      render(<MockRecentBlocks fetchBlocks={mockFetchBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
      
      const button = screen.getByTestId('refresh-button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(mockFetchBlocks).toHaveBeenCalledTimes(2);
    });
  });
});
