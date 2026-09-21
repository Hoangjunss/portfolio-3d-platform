'use client';

import { useLocalCollection, SavedItemsPanel } from '@portfolio/template-kit';
import type { Course } from '../data/seed';

export interface EducationEnrollment {
  id: string;
  title: string;
  enrolledAt: string;
}

const ENROLLMENTS_SEED: EducationEnrollment[] = [];

export interface EnrollmentSectionProps {
  courses: Course[];
}

export function EnrollmentSection({ courses }: EnrollmentSectionProps) {
  const { items, add, remove } = useLocalCollection<EducationEnrollment>(
    'education-enrollments',
    ENROLLMENTS_SEED,
  );

  function handleEnroll(course: Course) {
    try {
      if (items.some((enrollment) => enrollment.id === course.id)) {
        return;
      }
      add({
        id: course.id,
        title: course.title,
        enrolledAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to enroll in course:', err);
    }
  }

  function handleRemove(id: string) {
    try {
      remove(id);
    } catch (err) {
      console.error('Failed to remove course enrollment:', err);
    }
  }

  return (
    <section className="education-enrollment" aria-label="My courses">
      <SavedItemsPanel
        items={items}
        emptyLabel="Bạn chưa đăng ký khoá học nào — hãy chọn một khoá học bên dưới. (You haven't enrolled in any courses yet — pick one below.)"
        onRemove={handleRemove}
        renderItem={(enrollment) => (
          <>
            <strong>{enrollment.title}</strong>{' '}
            <time dateTime={enrollment.enrolledAt}>
              {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
            </time>
          </>
        )}
      />
      <div className="education-enroll-controls">
        {courses.map((course) => {
          const isEnrolled = items.some((i) => i.id === course.id);
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => handleEnroll(course)}
              disabled={isEnrolled}
              aria-label={`Enroll in ${course.title}`}
            >
              {isEnrolled ? `Đã đăng ký: ${course.title}` : `Đăng ký: ${course.title}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}
