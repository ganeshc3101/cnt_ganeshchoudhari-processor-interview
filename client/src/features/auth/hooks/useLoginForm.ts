import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { loginErrorMessage } from '@/features/auth/lib/loginErrorMessage';
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

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await signIn(values);
      const state = location.state as LocationState;
      const redirectTo = state?.from?.pathname ?? paths.root;
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setSubmitError(new Error(loginErrorMessage(err)));
    }
  });

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: form.formState.isSubmitting,
  };
}
