'use client';

import { useState } from 'react';
import { useLocalCollection, InquiryForm, type InquiryField } from '@portfolio/template-kit';
import { PLEDGE_SEED, type Pledge } from '../data/seed';

const PLEDGE_FIELDS: InquiryField[] = [
  { name: 'amountVnd', label: 'Pledge amount (VND)', type: 'number', required: true },
];

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function PledgeSection() {
  const { items, add, reset } = useLocalCollection<Pledge>('nonprofit-pledges', PLEDGE_SEED);
  const [ownPledgeId, setOwnPledgeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    setError(null);
    try {
      const id = crypto.randomUUID();
      add({
        id,
        name: values.name,
        amountVnd: Number(values.amountVnd),
        pledgedAt: new Date().toISOString(),
      });
      setOwnPledgeId(id);
    } catch (err) {
      setError('Unable to save your pledge. Storage may be full or disabled.');
      console.error('Failed to submit pledge:', err);
      throw err;
    }
  }

  function handleReset() {
    setError(null);
    try {
      reset();
      setOwnPledgeId(null);
    } catch (err) {
      setError('Unable to reset demo data. Storage may be full or disabled.');
      console.error('Failed to reset demo data:', err);
    }
  }

  const runningTotal = items.reduce((sum, pledge) => sum + pledge.amountVnd, 0);
  const sorted = [...items].sort((a, b) => b.pledgedAt.localeCompare(a.pledgedAt));

  return (
    <section id="pledge" className="doc-section">
      <h2>Make a pledge</h2>
      <p>This is a donation-intent demo — no real payment is processed.</p>
      {error ? <p className="pledge-error">{error}</p> : null}
      <InquiryForm fields={PLEDGE_FIELDS} submitLabel="Pledge" onSubmit={handleSubmit} />
      <aside aria-label="Running total">
        <p>
          Running total pledged: <strong>{formatVnd(runningTotal)} VND</strong>
        </p>
        <ol>
          {sorted.map((pledge) => (
            <li key={pledge.id} data-own-pledge={pledge.id === ownPledgeId}>
              <strong>{pledge.name}</strong> — {formatVnd(pledge.amountVnd)} VND
            </li>
          ))}
        </ol>
        <button type="button" onClick={handleReset}>
          Reset demo data
        </button>
      </aside>
    </section>
  );
}
