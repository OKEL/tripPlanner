import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui';
import { ContentText } from '@/components/content-text';
import { LANGUAGES, useLang, useT } from '@/i18n';
import { shortDate } from '@/lib/dates';
import { routeText } from '@/lib/rtl';
import { theme } from '@/theme';
import type { Activity, ArrivalEvent, DayEvent, DepartureEvent, TransitEvent } from '@/types/plan';

const { colors, spacing, radius, timeline, font } = theme;

type IconName = ComponentProps<typeof Ionicons>['name'];

type NodeKind = 'day' | 'transit' | 'edge';

type NodeProps = {
  kind: NodeKind;
  /** Day nodes are cards; `selected` marks the open one. */
  selected?: boolean;
  dot: ReactNode;
  first: boolean;
  last: boolean;
  highlighted?: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
  children: ReactNode;
};

/** One row of the vertical timeline: dot + connecting line on the left, content on the right. */
function Node({ kind, selected, dot, first, last, highlighted, onLayout, children }: NodeProps) {
  const small = kind === 'transit';
  const dotSize = small ? timeline.dotSmall : timeline.dot;
  return (
    <View style={styles.row} onLayout={onLayout}>
      <View style={styles.gutter}>
        <View style={[styles.line, { top: first ? timeline.dot / 2 : 0, bottom: last ? undefined : 0, height: last ? timeline.dot / 2 : undefined }]} />
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              marginTop: (timeline.dot - dotSize) / 2,
              backgroundColor: kind === 'day' ? colors.nodeDay : kind === 'transit' ? colors.nodeTransit : colors.nodeEdge,
            },
            highlighted && styles.dotToday,
          ]}>
          {dot}
        </View>
      </View>
      <View
        style={[
          styles.content,
          kind === 'day' && styles.card,
          kind === 'day' && selected && styles.cardOpen,
          highlighted && styles.contentToday,
        ]}>
        {children}
      </View>
    </View>
  );
}

function IconDot({ name, size = 16 }: { name: IconName; size?: number }) {
  return <Ionicons name={name} size={size} color={colors.onPrimary} />;
}

function Details({ date, time, notes }: { date: string | null; time: string | null; notes: string | null }) {
  const when = [shortDate(date, LANGUAGES[useLang()].locale), time].filter(Boolean).join(' · ');
  return (
    <>
      {when ? <AppText variant="muted">{when}</AppText> : null}
      {notes ? (
        <ContentText style={styles.notes} numberOfLines={3}>
          {notes}
        </ContentText>
      ) : null}
    </>
  );
}

type EdgeProps = { first: boolean; last: boolean };

export function ArrivalNode({ event, first, last }: { event: ArrivalEvent } & EdgeProps) {
  const t = useT();
  return (
    <Node kind="edge" dot={<IconDot name="arrow-down" />} first={first} last={last}>
      <AppText variant="heading">{t.timeline.arrival}</AppText>
      {event.location ? <ContentText>{event.location}</ContentText> : null}
      <Details date={event.date} time={event.time} notes={event.notes} />
    </Node>
  );
}

export function DepartureNode({ event, first, last }: { event: DepartureEvent } & EdgeProps) {
  const t = useT();
  return (
    <Node kind="edge" dot={<IconDot name="arrow-up" />} first={first} last={last}>
      <AppText variant="heading">{t.timeline.departure}</AppText>
      {event.location ? <ContentText>{event.location}</ContentText> : null}
      <Details date={event.date} time={event.time} notes={event.notes} />
    </Node>
  );
}

const TRANSIT_ICONS: Record<TransitEvent['mode'], IconName> = {
  flight: 'airplane',
  drive: 'car',
  train: 'train',
  bus: 'bus',
  ferry: 'boat',
  other: 'swap-horizontal',
};

export function TransitNode({ event, first, last }: { event: TransitEvent } & EdgeProps) {
  const t = useT();
  const route = routeText(event.from, event.to);
  return (
    <Node kind="transit" dot={<IconDot name={TRANSIT_ICONS[event.mode]} size={12} />} first={first} last={last}>
      <AppText variant="label">{t.timeline.transit[event.mode]}</AppText>
      {route ? <ContentText>{route}</ContentText> : null}
      <Details date={event.date} time={event.time} notes={event.notes} />
    </Node>
  );
}

type DayNodeProps = EdgeProps & {
  event: DayEvent;
  isToday: boolean;
  open: boolean;
  onToggle: () => void;
  onOpenActivity: (activity: Activity, number: string) => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function DayNode({ event, first, last, isToday, open, onToggle, onOpenActivity, onLayout }: DayNodeProps) {
  const t = useT();
  const locale = LANGUAGES[useLang()].locale;
  const count = event.activities.length;
  const meta = [count > 0 ? t.common.stops(count) : null, shortDate(event.date, locale), isToday ? t.common.today : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Node
      kind="day"
      selected={open}
      first={first}
      last={last}
      highlighted={isToday}
      onLayout={onLayout}
      dot={
        <AppText variant="small" style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
          {String(event.day_number)}
        </AppText>
      }>
      {/* Only the header toggles the day, so the activity rows below are separate buttons (no nesting). */}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        aria-expanded={open}
        style={[styles.dayHeader, open && styles.dayHeaderOpen]}>
        <View style={styles.dayTitle}>
          <ContentText style={styles.dayLabel}>{event.label ?? event.city ?? t.timeline.day(event.day_number)}</ContentText>
          {meta ? <AppText variant="muted">{meta}</AppText> : null}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {open ? (
        <View style={styles.activities}>
          {count === 0 ? <AppText variant="muted">{t.timeline.noActivities}</AppText> : null}
          {event.activities.map((activity, i) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              number={`${event.day_number}.${i + 1}`}
              onPress={() => onOpenActivity(activity, `${event.day_number}.${i + 1}`)}
            />
          ))}
        </View>
      ) : null}
    </Node>
  );
}

function ActivityRow({ activity, number, onPress }: { activity: Activity; number: string; onPress: () => void }) {
  const t = useT();
  const label = [number, activity.name, activity.time, activity.notes ? t.timeline.hasNotes : null].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.activityRow, pressed && { backgroundColor: colors.background }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t.timeline.opensDetails}>
      <AppText variant="muted" style={styles.activityNumber}>
        {number}
      </AppText>
      <ContentText style={styles.activityName} numberOfLines={2}>
        {activity.name}
      </ContentText>
      {activity.time ? (
        <AppText variant="muted" numberOfLines={1} style={styles.activityTime}>
          {activity.time}
        </AppText>
      ) : null}
      {activity.notes ? (
        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  gutter: { width: timeline.gutter, alignItems: 'center' },
  line: { position: 'absolute', width: timeline.line, backgroundColor: colors.border },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotToday: { backgroundColor: colors.todayBorder },
  dayNumber: { color: colors.onPrimary, fontFamily: font.bold },
  dayNumberToday: { color: colors.onToday },
  content: {
    flex: 1,
    marginBottom: spacing.md,
    marginRight: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xxs,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...theme.shadow.card,
  },
  cardOpen: { borderColor: colors.primary },
  contentToday: { backgroundColor: colors.today, borderWidth: 1, borderColor: colors.todayBorder },
  notes: { color: colors.textMuted, fontSize: font.size.sm },
  // Stretches over the card's padding so the whole closed card is the tap target.
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: -spacing.md,
    padding: spacing.md,
  },
  dayHeaderOpen: { marginBottom: 0, paddingBottom: 0 },
  dayTitle: { flex: 1, gap: spacing.xxs },
  dayLabel: { fontSize: font.size.lg, fontFamily: font.bold },
  activities: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: theme.size.row,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityNumber: { width: timeline.activityNumber, color: colors.primary, fontFamily: font.medium },
  activityName: { flex: 1 },
  activityTime: { maxWidth: timeline.activityTime },
});
