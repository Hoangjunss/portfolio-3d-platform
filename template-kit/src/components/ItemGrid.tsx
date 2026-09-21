export interface GridItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

export interface ItemGridProps {
  items: GridItem[];
  columns?: 2 | 3 | 4 | 6;
}

export function ItemGrid({ items, columns = 3 }: ItemGridProps) {
  return (
    <ul className="tk-item-grid" data-columns={columns}>
      {items.map((item) => (
        <li key={item.id}>
          {item.image ? <img src={item.image} alt="" /> : null}
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </li>
      ))}
    </ul>
  );
}
