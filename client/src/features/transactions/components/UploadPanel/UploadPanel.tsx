import { useState } from 'react';

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
  const [active, setActive] = useState<TabId>('upload');

  return (
    <Card
      title="Add transactions"
      subtitle="Upload a file or enter a transaction manually"
      className={styles.root}
      actions={
        <Tabs<TabId>
          ariaLabel="Add transactions mode"
          value={active}
          onChange={setActive}
          items={[
            { id: 'upload', label: 'File upload', icon: <FileIcon /> },
            { id: 'manual', label: 'Manual entry', icon: <PlusIcon /> },
          ]}
        />
      }
    >
      <TabPanel tabId={TAB_IDS.upload} id={TAB_IDS.uploadPanel} active={active === 'upload'}>
        <FileUploadTab />
      </TabPanel>
      <TabPanel tabId={TAB_IDS.manual} id={TAB_IDS.manualPanel} active={active === 'manual'}>
        <ManualEntryTab />
      </TabPanel>
    </Card>
  );
}
