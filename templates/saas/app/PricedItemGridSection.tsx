'use client';

import { useState } from 'react';
import { PricedItemGrid, useLocalCollection } from '@portfolio/template-kit';
import { PRICING_TIERS } from '../data/seed';

interface TrialSelection {
  id: string;
  planId: string;
  selectedAt: string;
}

const seed: TrialSelection[] = [];

export function PricedItemGridSection() {
  const { items, reset, add } = useLocalCollection<TrialSelection>('saas-trial-selection', seed);
  const [message, setMessage] = useState<string | null>(null);
  const selectedPlanId = items[0]?.planId;

  function selectPlan(item: { id: string; title: string }) {
    try {
      reset();
      add({ id: crypto.randomUUID(), planId: item.id, selectedAt: new Date().toISOString() });
      setMessage(`${item.title} selected for your trial.`);
    } catch {
      setMessage('We could not save your plan selection. Please try again.');
    }
  }

  function clearSelection() {
    try {
      reset();
      setMessage('Plan selection cleared.');
    } catch {
      setMessage('We could not clear your plan selection. Please try again.');
    }
  }

  return (
    <section id="pricing" className="saas-section saas-pricing" aria-labelledby="pricing-heading">
      <div className="saas-heading"><p>Start where the work is.</p><h2 id="pricing-heading">A clear plan for each kind of momentum.</h2></div>
      <PricedItemGrid items={PRICING_TIERS} currency="USD" ctaLabel="Start free trial" onSelect={selectPlan} selectedItemId={selectedPlanId} />
      {selectedPlanId ? <button className="saas-reset" type="button" onClick={clearSelection}>Reset demo data</button> : null}
      <p className="saas-selection-message" aria-live="polite">{message}</p>
    </section>
  );
}
