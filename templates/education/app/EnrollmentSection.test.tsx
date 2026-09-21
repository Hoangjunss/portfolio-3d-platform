import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { EnrollmentSection } from './EnrollmentSection';
import { COURSES } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
});

describe('EnrollmentSection', () => {
  it('shows an empty "My courses" state before any enrollment', () => {
    render(<EnrollmentSection courses={COURSES} />);
    expect(screen.getByText(/haven't enrolled/i)).toBeInTheDocument();
  });

  it('enrolling in a course adds it to the "My courses" panel', async () => {
    render(<EnrollmentSection courses={COURSES} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`enroll.*${COURSES[0].title}`, 'i') }));

    await waitFor(() => {
      expect(screen.getByText(COURSES[0].title, { selector: '[aria-label="My courses"] *' })).toBeInTheDocument();
    });
  });

  it('persists an enrollment across remount (simulated reload)', async () => {
    const { unmount } = render(<EnrollmentSection courses={COURSES} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`enroll.*${COURSES[1].title}`, 'i') }));
    await waitFor(() =>
      expect(screen.getByText(COURSES[1].title, { selector: '[aria-label="My courses"] *' })).toBeInTheDocument(),
    );
    unmount();

    render(<EnrollmentSection courses={COURSES} />);
    await waitFor(() =>
      expect(screen.getByText(COURSES[1].title, { selector: '[aria-label="My courses"] *' })).toBeInTheDocument(),
    );
  });

  it('unenrolling removes the course from "My courses"', async () => {
    render(<EnrollmentSection courses={COURSES} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`enroll.*${COURSES[2].title}`, 'i') }));
    await waitFor(() =>
      expect(screen.getByText(COURSES[2].title, { selector: '[aria-label="My courses"] *' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/haven't enrolled/i)).toBeInTheDocument();
    });
  });

  it('clicking enroll twice on the same course is idempotent', async () => {
    render(<EnrollmentSection courses={COURSES} />);
    const button = screen.getByRole('button', { name: new RegExp(`enroll.*${COURSES[0].title}`, 'i') });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      const items = screen.getAllByText(COURSES[0].title, { selector: '[aria-label="My courses"] *' });
      expect(items).toHaveLength(1);
    });
  });
});
