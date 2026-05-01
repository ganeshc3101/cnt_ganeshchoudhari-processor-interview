import { useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/app/providers/AuthProvider';
import { PERMISSIONS } from '@/features/auth';
import { Card } from '@/shared/ui/Card';
import { FileIcon, PlusIcon } from '@/shared/ui/icons';
import { TabPanel, Tabs } from '@/shared/ui/Tabs';

import { FileUploadTab } from './FileUploadTab';
import { ManualEntryTab } from './ManualEntryTab';
import styles from './UploadPanel.module.css';

type TabId = 'upload' | 'manual';

const TAB_IDS = {
  root: 'upload-panel',
  upload: 'upload-panel-tab-upload',
  manual: 'upload-panel-tab-manual',
  uploadPanel: 'upload-panel-panel-upload',
  manualPanel: 'upload-panel-panel-manual',
} as const;

export function UploadPanel() {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission(PERMISSIONS.BATCHES_WRITE);
  const canManual = hasPermission(PERMISSIONS.TRANSACTIONS_WRITE);

  const tabItems = useMemo(() => {
    const items: Array<{ id: TabId; label: string; icon: ReactNode }> = [];
    if (canUpload) {
      items.push({ id: 'upload', label: 'File upload', icon: <FileIcon /> });
    }
    if (canManual) {
      items.push({ id: 'manual', label: 'Manual entry', icon: <PlusIcon /> });
    }
    return items;
  }, [canManual, canUpload]);

  const [picked, setPicked] = useState<TabId | undefined>(undefined);

  const effectiveActive =
    picked !== undefined && tabItems.some((t) => t.id === picked)
      ? picked
      : (tabItems[0]?.id ?? 'upload');

  if (tabItems.length === 0) {
    return null;
  }

  return (
    <Card
      title="Add transactions"
      subtitle="Upload a CSV/JSON batch or enter transactions manually"
      className={styles.root}
      actions={
        <Tabs<TabId>
          ariaLabel="Add transactions mode"
          value={effectiveActive}
          onChange={setPicked}
          items={tabItems}
        />
      }
    >
      <TabPanel tabId={TAB_IDS.upload} id={TAB_IDS.uploadPanel} active={effectiveActive === 'upload'}>
        <FileUploadTab />
      </TabPanel>
      <TabPanel tabId={TAB_IDS.manual} id={TAB_IDS.manualPanel} active={effectiveActive === 'manual'}>
        <ManualEntryTab />
      </TabPanel>
    </Card>
  );
}
