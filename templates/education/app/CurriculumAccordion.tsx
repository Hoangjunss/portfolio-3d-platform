import type { Course } from '../data/seed';

export interface CurriculumAccordionProps {
  courses: Course[];
  renderAction?: (course: Course) => React.ReactNode;
}

export function CurriculumAccordion({ courses, renderAction }: CurriculumAccordionProps) {
  return (
    <section className="curriculum" aria-labelledby="curriculum-heading">
      <h2 id="curriculum-heading">Khung chương trình chi tiết</h2>
      {courses.map((course) => (
        <details key={course.id}>
          <summary>{course.title}</summary>
          <ol>
            {course.curriculum.map((module, index) => (
              <li key={index}>{module}</li>
            ))}
          </ol>
          {renderAction ? renderAction(course) : null}
        </details>
      ))}
    </section>
  );
}
