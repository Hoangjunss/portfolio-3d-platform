export interface KanbanColumn {
  key: string;
  label: string;
}

export interface KanbanItem {
  id: string;
  stage: string;
}

export interface KanbanBoardProps<T extends KanbanItem> {
  columns: KanbanColumn[];
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onMove: (id: string, newStage: string) => void;
}

export function KanbanBoard<T extends KanbanItem>({ columns, items, renderItem, onMove }: KanbanBoardProps<T>) {
  return (
    <div className="tk-kanban-board">
      {columns.map((column) => (
        <div key={column.key} className="tk-kanban-column">
          <h3>{column.label}</h3>
          <ul>
            {items
              .filter((item) => item.stage === column.key)
              .map((item) => (
                <li key={item.id}>
                  <span>{renderItem(item)}</span>
                  <label>
                    {`Move ${renderItem(item)}`}
                    <select value={item.stage} onChange={(event) => onMove(item.id, event.target.value)}>
                      {columns.map((target) => (
                        <option key={target.key} value={target.key}>{target.label}</option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
