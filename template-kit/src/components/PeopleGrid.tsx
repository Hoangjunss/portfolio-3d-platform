export interface Person {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

export interface PeopleGridProps {
  people: Person[];
  roleLabel: string;
}

export function PeopleGrid({ people, roleLabel }: PeopleGridProps) {
  return (
    <ul className="tk-people-grid" aria-label={roleLabel}>
      {people.map((person) => (
        <li key={person.id}>
          {person.photo ? <img src={person.photo} alt="" /> : null}
          <h3>{person.name}</h3>
          <p>{person.role}</p>
        </li>
      ))}
    </ul>
  );
}
