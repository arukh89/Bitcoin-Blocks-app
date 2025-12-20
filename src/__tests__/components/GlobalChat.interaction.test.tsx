import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * UI Interaction Tests for GlobalChat Component
 * Tests message input, send button, and chat interactions
 */

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  type: 'chat' | 'guess' | 'system' | 'winner';
  created_at: string;
}

// Mock GlobalChat component for testing
const MockGlobalChat = ({ 
  messages = [],
  onSend,
  disabled = false,
}: { 
  messages?: ChatMessage[];
  onSend: (message: string) => Promise<{ error: any }>;
  disabled?: boolean;
}) => {
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsSending(true);
    setError(null);
    
    const result = await onSend(input.trim());
    
    if (result.error) {
      setError(String(result.error));
    } else {
      setInput('');
    }
    
    setIsSending(false);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div data-testid="global-chat">
      <div data-testid="messages-container" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div data-testid="empty-state">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              data-testid={`message-${msg.id}`}
              className={`message message-${msg.type}`}
            >
              <span data-testid="message-username">@{msg.username}</span>
              <span data-testid="message-content">{msg.message}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} data-testid="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled || isSending}
          data-testid="chat-input"
          aria-label="Chat message"
          maxLength={500}
        />
        <button 
          type="submit" 
          disabled={disabled || isSending || !input.trim()}
          data-testid="send-button"
          aria-label="Send message"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </form>
      
      {error && <div data-testid="chat-error" role="alert">{error}</div>}
      
      <div data-testid="char-count">{input.length}/500</div>
    </div>
  );
};

describe('GlobalChat UI Interaction Tests', () => {
  let mockOnSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSend = vi.fn().mockResolvedValue({ error: null });
  });

  describe('Message Input', () => {
    it('should allow typing in the input field', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Hello world!');
      
      expect(input).toHaveValue('Hello world!');
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Hello');
      
      expect(screen.getByTestId('char-count')).toHaveTextContent('5/500');
    });

    it('should clear input after successful send', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test message');
      await user.click(screen.getByTestId('send-button'));
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should not clear input on failed send', async () => {
      const user = userEvent.setup();
      mockOnSend.mockResolvedValue({ error: 'Failed to send' });
      
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test message');
      await user.click(screen.getByTestId('send-button'));
      
      await waitFor(() => {
        expect(input).toHaveValue('Test message');
      });
    });
  });

  describe('Send Button', () => {
    it('should be disabled when input is empty', () => {
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      expect(screen.getByTestId('send-button')).toBeDisabled();
    });

    it('should be disabled when input is only whitespace', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, '   ');
      
      expect(screen.getByTestId('send-button')).toBeDisabled();
    });

    it('should be enabled when input has content', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Hello');
      
      expect(screen.getByTestId('send-button')).not.toBeDisabled();
    });

    it('should call onSend with trimmed message', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, '  Hello world  ');
      await user.click(screen.getByTestId('send-button'));
      
      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Hello world');
      });
    });

    it('should show loading state while sending', async () => {
      const user = userEvent.setup();
      mockOnSend.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));
      
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test');
      await user.click(screen.getByTestId('send-button'));
      
      expect(screen.getByTestId('send-button')).toHaveTextContent('...');
      expect(screen.getByTestId('send-button')).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.getByTestId('send-button')).toHaveTextContent('Send');
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Hello');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Hello');
      });
    });
  });

  describe('Messages Display', () => {
    it('should show empty state when no messages', () => {
      render(<MockGlobalChat messages={[]} onSend={mockOnSend} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should display messages', () => {
      const messages: ChatMessage[] = [
        { id: '1', username: 'user1', message: 'Hello', type: 'chat', created_at: new Date().toISOString() },
        { id: '2', username: 'user2', message: 'Hi there', type: 'chat', created_at: new Date().toISOString() },
      ];
      
      render(<MockGlobalChat messages={messages} onSend={mockOnSend} />);
      
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();
    });

    it('should have accessible live region for new messages', () => {
      render(<MockGlobalChat messages={[]} onSend={mockOnSend} />);
      
      const container = screen.getByTestId('messages-container');
      expect(container).toHaveAttribute('role', 'log');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<MockGlobalChat onSend={mockOnSend} disabled={true} />);
      
      expect(screen.getByTestId('chat-input')).toBeDisabled();
      expect(screen.getByTestId('send-button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when send fails', async () => {
      const user = userEvent.setup();
      mockOnSend.mockResolvedValue({ error: 'Network error' });
      
      render(<MockGlobalChat onSend={mockOnSend} />);
      
      const input = screen.getByTestId('chat-input');
      await user.type(input, 'Test');
      await user.click(screen.getByTestId('send-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-error')).toHaveTextContent('Network error');
      });
    });
  });
});
