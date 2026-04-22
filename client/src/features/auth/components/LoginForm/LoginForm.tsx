import { Controller } from 'react-hook-form';

import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { InputField } from '@/shared/ui/InputField';
import { PasswordField } from '@/shared/ui/PasswordField';

import styles from './LoginForm.module.css';
import { useLoginForm } from '../../hooks/useLoginForm';


export function LoginForm() {
  const { form, onSubmit, submitError, isSubmitting } = useLoginForm();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <InputField
        label="Username"
        autoComplete="username"
        autoFocus
        placeholder="merchant@example.com"
        error={errors.username?.message}
        {...register('username')}
      />

      <PasswordField
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className={styles.row}>
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Remember me"
              name={field.name}
              checked={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.checked)}
              ref={field.ref}
            />
          )}
        />
        <a href="#" className={styles.forgot}>
          Forgot password?
        </a>
      </div>

      {submitError ? (
        <p role="alert" className={styles.submitError}>
          {submitError.message}
        </p>
      ) : null}

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
