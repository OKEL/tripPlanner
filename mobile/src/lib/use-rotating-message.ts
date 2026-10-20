import { useEffect, useState } from 'react';

/** Cycles through `messages` every few seconds while `active`, starting from the first each time. */
export function useRotatingMessage(messages: readonly string[], active: boolean, intervalMs = 4000): string {
  const [index, setIndex] = useState(0);
  const [wasActive, setWasActive] = useState(active);
  // Restart from the first message whenever it becomes active (state adjusted during render).
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setIndex(0);
  }
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), intervalMs);
    return () => clearInterval(timer);
  }, [active, messages.length, intervalMs]);
  return messages[index];
}
