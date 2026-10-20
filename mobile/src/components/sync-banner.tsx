import { Banner } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/store';

/** Shown when the last refetch failed: offline, or the server had an error. Either way the saved copy is shown. */
export function SyncBanner() {
  const t = useT();
  const status = useStore((s) => s.syncStatus);
  if (status === 'offline') return <Banner tone="warning" icon="cloud-offline-outline" text={t.sync.offline} />;
  if (status === 'error') return <Banner tone="warning" text={t.sync.error} />;
  return null;
}
