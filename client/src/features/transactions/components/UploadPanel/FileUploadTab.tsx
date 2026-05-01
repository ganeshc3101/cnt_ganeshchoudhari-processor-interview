import { useMemo, useState } from 'react';

import { userFacingApiMessage } from '@/features/auth/lib/loginErrorMessage';
import { Button } from '@/shared/ui/Button';
import { FileDropzone } from '@/shared/ui/FileDropzone';
import { FileIcon, TrashIcon, UploadIcon } from '@/shared/ui/icons';

import styles from './FileUploadTab.module.css';
import { useUploadTransactions } from '../../hooks/useUploadTransactions';

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = '.csv,.json';
const ACCEPTED_EXTS = ['csv', 'json'];

type ResultMessage =
  | { kind: 'success'; accepted: number; rejected: number; errors: string[] }
  | { kind: 'error'; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FileUploadTab() {
  const [queued, setQueued] = useState<File[]>([]);
  const [result, setResult] = useState<ResultMessage | null>(null);
  const upload = useUploadTransactions();

  const helperText = useMemo(
    () =>
      `CSV or JSON (server batch format) · up to ${MAX_FILES} files · ${formatBytes(MAX_BYTES)} max each · one API request per file`,
    [],
  );

  const mergeFiles = (incoming: File[]) => {
    setResult(null);
    const existingKeys = new Set(queued.map((f) => `${f.name}:${f.size}`));
    const next: File[] = [...queued];

    for (const file of incoming) {
      if (next.length >= MAX_FILES) break;
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ACCEPTED_EXTS.includes(ext)) continue;
      if (file.size > MAX_BYTES) continue;
      const key = `${file.name}:${file.size}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      next.push(file);
    }

    setQueued(next);
  };

  const removeFile = (index: number) => {
    setQueued((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (queued.length === 0) return;
    setResult(null);
    upload.mutate(queued, {
      onSuccess: (data) => {
        setResult({
          kind: 'success',
          accepted: data.accepted,
          rejected: data.rejected,
          errors: data.errors.map((e) => `${e.file}: ${e.message}`),
        });
        setQueued([]);
      },
      onError: (err) =>
        setResult({ kind: 'error', message: userFacingApiMessage(err, 'Upload failed.') }),
    });
  };

  const totalProcessed = result?.kind === 'success' ? result.accepted + result.rejected : 0;

  return (
    <div className={styles.root}>
      <FileDropzone
        accept={ACCEPTED}
        multiple
        maxFiles={MAX_FILES}
        label="Drag & drop files here"
        description="or click to browse"
        helperText={helperText}
        disabled={upload.isPending}
        onFilesSelected={mergeFiles}
      />

      {queued.length > 0 ? (
        <ul className={styles.fileList} aria-label="Selected files">
          {queued.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`} className={styles.fileItem}>
              <span className={styles.fileIcon} aria-hidden="true">
                <FileIcon />
              </span>
              <span className={styles.fileMeta}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                disabled={upload.isPending}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.footer}>
        <span className={styles.counter}>
          {queued.length} / {MAX_FILES} files selected
        </span>
        <Button
          type="button"
          leadingIcon={<UploadIcon />}
          onClick={handleUpload}
          disabled={queued.length === 0}
          isLoading={upload.isPending}
        >
          Upload {queued.length > 0 ? `${queued.length} file${queued.length === 1 ? '' : 's'}` : ''}
        </Button>
      </div>

      {result?.kind === 'success' ? (
        <div className={styles.successBox} role="status">
          {totalProcessed === 0 && result.errors.length > 0 ? (
            <p className={styles.summaryMuted}>No rows were processed.</p>
          ) : (
            <p>
              Processed {totalProcessed} record
              {totalProcessed === 1 ? '' : 's'}: <strong>{result.accepted} accepted</strong>
              {result.rejected > 0 ? (
                <>
                  , <strong>{result.rejected} rejected</strong>
                </>
              ) : null}
              .
            </p>
          )}
          {result.errors.length > 0 ? (
            <ul className={styles.errorList}>
              {result.errors.slice(0, 5).map((message, i) => (
                <li key={i}>{message}</li>
              ))}
              {result.errors.length > 5 ? <li>…and {result.errors.length - 5} more.</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      {result?.kind === 'error' ? (
        <p role="alert" className={styles.errorBox}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
