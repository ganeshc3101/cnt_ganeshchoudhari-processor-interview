import clsx from 'clsx';
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { UploadIcon } from '@/shared/ui/icons';

import styles from './FileDropzone.module.css';

type Props = {
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  label: string;
  description?: string;
  helperText?: ReactNode;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function FileDropzone({
  accept,
  multiple = true,
  maxFiles,
  label,
  description,
  helperText,
  disabled = false,
  onFilesSelected,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emit = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const asArray = Array.from(fileList);
      const sliced = maxFiles !== undefined ? asArray.slice(0, maxFiles) : asArray;
      onFilesSelected(sliced);
    },
    [maxFiles, onFilesSelected],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    emit(event.target.files);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    emit(event.dataTransfer.files);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        styles.root,
        isDragging && styles.rootDragging,
        disabled && styles.rootDisabled,
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled || undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        <UploadIcon />
      </span>
      <span className={styles.label}>{label}</span>
      {description ? <span className={styles.description}>{description}</span> : null}
      {helperText !== undefined ? <span className={styles.helper}>{helperText}</span> : null}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={styles.input}
        disabled={disabled}
        onChange={handleChange}
      />
    </label>
  );
}
