'use client';

import { useEffect, useState } from 'react';
import { computeCountdown, type CountdownParts } from './computeCountdown';
import { WEDDING } from '../data/seed';

export function WeddingCountdown() {
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    setParts(computeCountdown(WEDDING.weddingDateIso, new Date()));
    setMounted(true);
    const id = setInterval(() => {
      setParts(computeCountdown(WEDDING.weddingDateIso, new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted || !parts) {
    return (
      <div className="wedding-countdown" role="timer" aria-live="polite" suppressHydrationWarning>
        <div>
          <span className="count">--</span>
          <span className="label">days</span>
        </div>
        <div>
          <span className="count">--</span>
          <span className="label">hours</span>
        </div>
        <div>
          <span className="count">--</span>
          <span className="label">minutes</span>
        </div>
        <div>
          <span className="count">--</span>
          <span className="label">seconds</span>
        </div>
      </div>
    );
  }

  if (parts.hasPassed) {
    return <p className="wedding-countdown wedding-countdown-passed">We&apos;re married!</p>;
  }

  return (
    <div className="wedding-countdown" role="timer" aria-live="polite" suppressHydrationWarning>
      <div>
        <span className="count">{parts.days}</span>
        <span className="label">days</span>
      </div>
      <div>
        <span className="count">{parts.hours}</span>
        <span className="label">hours</span>
      </div>
      <div>
        <span className="count">{parts.minutes}</span>
        <span className="label">minutes</span>
      </div>
      <div>
        <span className="count">{parts.seconds}</span>
        <span className="label">seconds</span>
      </div>
    </div>
  );
}
