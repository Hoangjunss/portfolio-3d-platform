'use client';

import { useState, type FormEvent } from 'react';

export interface InquiryField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number';
  required: boolean;
}

export interface InquiryFormProps {
  fields: InquiryField[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

const BASE_FIELDS: InquiryField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: false },
];

export function InquiryForm({ fields, submitLabel, onSubmit }: InquiryFormProps) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const allFields = [...BASE_FIELDS, ...fields];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    for (const field of allFields) values[field.name] = String(formData.get(field.name) ?? '');
    values.message = String(formData.get('message') ?? '');

    setPending(true);
    setStatus('idle');
    try {
      await onSubmit(values);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="tk-inquiry-form" onSubmit={handleSubmit}>
      {allFields.map((field) => (
        <label key={field.name}>
          {field.label}
          <input name={field.name} type={field.type} required={field.required} disabled={pending} />
        </label>
      ))}
      <label>
        Message
        <textarea name="message" disabled={pending} />
      </label>
      <button type="submit" disabled={pending}>{submitLabel}</button>
      {status === 'success' ? <p role="status">Sent</p> : null}
      {status === 'error' ? <p role="alert">Something went wrong</p> : null}
    </form>
  );
}
