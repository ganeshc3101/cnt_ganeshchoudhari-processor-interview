import { forwardRef, useState, type InputHTMLAttributes } from 'react';

import { EyeIcon, EyeOffIcon } from '@/shared/ui/icons';
import { InputField } from '@/shared/ui/InputField';

import styles from './PasswordField.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
};

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(
  { label, error, hint, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  const handleToggle = () => {
    setVisible((current) => !current);
  };

  const toggleButton = (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      tabIndex={0}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  return (
    <InputField
      ref={ref}
      label={label}
      error={error}
      hint={hint}
      type={visible ? 'text' : 'password'}
      endAdornment={toggleButton}
      {...rest}
    />
  );
});
