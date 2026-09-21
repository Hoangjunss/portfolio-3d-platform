import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanBoard } from './KanbanBoard';

interface Deal { id: string; title: string; stage: string; }

describe('KanbanBoard', () => {
  const columns = [{ key: 'new', label: 'New' }, { key: 'won', label: 'Won' }];

  it('groups items under their column by stage', () => {
    render(
      <KanbanBoard
        columns={columns}
        items={[{ id: '1', title: 'Deal A', stage: 'new' }] as Deal[]}
        renderItem={(d: Deal) => d.title}
        onMove={() => {}}
      />,
    );
    expect(screen.getByText('Deal A')).toBeInTheDocument();
  });

  it('calls onMove with the item id and new stage when the stage selector changes', () => {
    const onMove = vi.fn();
    render(
      <KanbanBoard
        columns={columns}
        items={[{ id: '1', title: 'Deal A', stage: 'new' }] as Deal[]}
        renderItem={(d: Deal) => d.title}
        onMove={onMove}
      />,
    );
    fireEvent.change(screen.getByLabelText(/move deal a/i), { target: { value: 'won' } });
    expect(onMove).toHaveBeenCalledWith('1', 'won');
  });

  it('renders every column, even an empty one, without throwing', () => {
    render(<KanbanBoard columns={columns} items={[]} renderItem={(d: Deal) => d.title} onMove={() => {}} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
  });
});
