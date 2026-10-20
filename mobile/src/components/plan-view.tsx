import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, RefreshControl, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ActivitySheet } from '@/components/activity-sheet';
import { ArrivalNode, DayNode, DepartureNode, TransitNode } from '@/components/timeline';
import { todayISO } from '@/lib/dates';
import { theme } from '@/theme';
import type { Activity, Plan, PlanEvent } from '@/types/plan';

type Props = { plan: Plan; refreshing: boolean; onRefresh: () => void };

/**
 * Key of a timeline node. Days are keyed by their number and label, so the open day stays the same day
 * after a refetch or a refinement adds or removes other nodes (a changed day simply closes).
 */
function eventKey(event: PlanEvent, index: number): string {
  return event.type === 'day' ? `day-${event.day_number}-${event.label ?? ''}` : `${event.type}-${index}`;
}

/** Key of the day that should start open: today's day, if the plan has dates. */
function initialOpenKey(plan: Plan): string | null {
  const today = todayISO();
  const idx = plan.events.findIndex((e) => e.type === 'day' && e.date === today);
  return idx >= 0 ? eventKey(plan.events[idx], idx) : null;
}

/** The timeline: arrival, days (accordion, one open at a time), transit, departure. */
export function PlanView({ plan, refreshing, onRefresh }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const [openKey, setOpenKey] = useState<string | null>(() => initialOpenKey(plan));
  const [selected, setSelected] = useState<{ activity: Activity; number: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrolledInitially = useRef(false);
  const today = todayISO();

  const scrollToKey = useCallback((key: string, animated: boolean) => {
    const y = positions.current[key];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - theme.spacing.sm), animated });
  }, []);

  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = openKey === key ? null : key;
    setOpenKey(next);
    // Wait for the layout animation: a day above may collapse and shift this one up.
    clearTimeout(scrollTimer.current);
    if (next) scrollTimer.current = setTimeout(() => scrollToKey(next, true), 300);
  };

  const onDayLayout = (key: string) => (e: LayoutChangeEvent) => {
    positions.current[key] = e.nativeEvent.layout.y;
    if (key === openKey && !scrolledInitially.current) {
      scrolledInitially.current = true;
      scrollToKey(key, false);
    }
  };

  const last = plan.events.length - 1;
  return (
    <>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View>
          {plan.events.map((event, i) => {
            const edge = { first: i === 0, last: i === last };
            const key = eventKey(event, i);
            switch (event.type) {
              case 'arrival':
                return <ArrivalNode key={key} event={event} {...edge} />;
              case 'departure':
                return <DepartureNode key={key} event={event} {...edge} />;
              case 'transit':
                return <TransitNode key={key} event={event} {...edge} />;
              case 'day':
                return (
                  <DayNode
                    key={key}
                    event={event}
                    {...edge}
                    isToday={event.date === today}
                    open={openKey === key}
                    onToggle={() => toggle(key)}
                    onOpenActivity={(activity, number) => {
                      setSelected({ activity, number });
                      setSheetOpen(true);
                    }}
                    onLayout={onDayLayout(key)}
                  />
                );
            }
          })}
        </View>
      </ScrollView>
      <ActivitySheet
        visible={sheetOpen}
        activity={selected?.activity ?? null}
        number={selected?.number ?? ''}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xxl * 2 },
});
