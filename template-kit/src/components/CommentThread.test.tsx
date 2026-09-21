import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommentThread } from './CommentThread';

describe('CommentThread', () => {
  it('renders a message when there are no comments', () => {
    render(<CommentThread comments={[]} onSubmit={async () => {}} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('calls onSubmit with the textarea value and clears it', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CommentThread comments={[]} onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText(/add a comment/i);
    fireEvent.change(textarea, { target: { value: 'Great article' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /post/i }));
    });
    expect(onSubmit).toHaveBeenCalledWith('Great article');
  });
});
