import { useState, type FormEvent } from 'react';

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: string;
}

export interface CommentThreadProps {
  comments: Comment[];
  onSubmit: (text: string) => Promise<void>;
}

export function CommentThread({ comments, onSubmit }: CommentThreadProps) {
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setPending(true);
    try {
      await onSubmit(draft);
      setDraft('');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="tk-comment-thread">
      {comments.length === 0 ? (
        <p>No comments yet</p>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.author}</strong>
              <p>{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Add a comment
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={pending} />
        </label>
        <button type="submit" disabled={pending}>Post</button>
      </form>
    </div>
  );
}
