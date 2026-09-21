import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InquiryForm } from './InquiryForm';

describe('InquiryForm', () => {
  it('renders exactly the base 4 fields when fields=[]', () => {
    render(<InquiryForm fields={[]} submitLabel="Send" onSubmit={async () => {}} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('renders base + extra fields when fields has entries', () => {
    render(<InquiryForm fields={[{ name: 'company', label: 'Company', type: 'text', required: false }]} submitLabel="Send" onSubmit={async () => {}} />);
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });

  it('disables submit while onSubmit is pending, re-enables after it resolves', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => { resolveSubmit = resolve; }));
    const { container } = render(<InquiryForm fields={[]} submitLabel="Send" onSubmit={onSubmit} />);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled());
    resolveSubmit();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled());
  });
});
