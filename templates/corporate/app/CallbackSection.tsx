'use client';

import { useLocalCollection, InquiryForm } from '@portfolio/template-kit';

export interface CallbackRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: string;
}

const CALLBACK_SEED: CallbackRequest[] = [];

export function CallbackSection() {
  const { items, add, reset } = useLocalCollection<CallbackRequest>(
    'corporate-callback-requests',
    CALLBACK_SEED,
  );

  async function handleSubmit(values: Record<string, string>) {
    add({
      id: crypto.randomUUID(),
      name: values.name,
      email: values.email,
      phone: values.phone,
      message: values.message,
      submittedAt: new Date().toISOString(),
    });
  }

  const sorted = [...items].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <section className="corporate-callback" id="callback">
      <h2>Request a callback</h2>
      <div className="corporate-callback-grid">
        <InquiryForm fields={[]} submitLabel="Request a callback" onSubmit={handleSubmit} />
        <aside aria-label="Your requests">
          <h3>Your requests</h3>
          {sorted.length === 0 ? (
            <p>No requests yet — submit the form above and it will appear here.</p>
          ) : (
            <ol>
              {sorted.map((request) => (
                <li key={request.id}>
                  <strong>{request.name}</strong>
                  <time dateTime={request.submittedAt}>
                    {new Date(request.submittedAt).toLocaleString('vi-VN')}
                  </time>
                </li>
              ))}
            </ol>
          )}
          <button type="button" onClick={reset}>
            Reset demo data
          </button>
        </aside>
      </div>
    </section>
  );
}
