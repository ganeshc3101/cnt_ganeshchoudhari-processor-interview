import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/routes/paths';

import { LoginFormSchema, type LoginFormValues } from '../types/auth';

type LocationState = { from?: { pathname: string } } | null;

type UseLoginFormReturn = {
  form: UseFormReturn<LoginFormValues>;
  onSubmit: (event: React.BaseSyntheticEvent) => Promise<void>;
  submitError: Error | null;
  isSubmitting: boolean;
};

export function useLoginForm(): UseLoginFormReturn {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitError, setSubmitError] = useState<Error | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = form.handleSubmit(async () => {
    setSubmitError(null);
    try {
      // Mock auth: the service currently ignores credentials. The form shape
      // is already correct for the future `signIn(values)` signature.
      await signIn();
      const state = location.state as LocationState;
      const redirectTo = state?.from?.pathname ?? paths.dashboard;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err : new Error('Sign-in failed.'));
    }
  });

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: form.formState.isSubmitting,
  };
}
