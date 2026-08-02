import { useCallback, useState } from 'react';

import { container } from '@/bootstrap/container';
import { AppError } from '@/core/errors';
import { isErr } from '@/core/result';

type Mode = 'signIn' | 'signUp';

/**
 * View-model hook for the auth screens.
 *
 * Screens stay declarative: they render what this returns and call `submit`.
 * All orchestration — validation, error mapping, in-flight state — lives here,
 * which is what makes the screens trivial to restyle or replace.
 *
 * Navigation is intentionally NOT handled here. The route guards in
 * app/(auth)/_layout.tsx redirect automatically once SessionProvider observes
 * the new session, so there is exactly one place that decides where the user
 * lands.
 */
export function useAuthForm(mode: Mode) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const result =
        mode === 'signIn'
          ? await container.auth.signIn({ email, password })
          : await container.auth.signUp({ email, password });

      if (isErr(result)) {
        setError(result.error.userMessage);
        return;
      }

      // Sign-up with email confirmation enabled succeeds without a session.
      if (mode === 'signUp' && result.value === null) {
        setNotice('Check your inbox to confirm your email, then sign in.');
      }
    } catch (cause) {
      setError(AppError.from(cause).userMessage);
    } finally {
      setSubmitting(false);
    }
  }, [mode, email, password]);

  return {
    email,
    password,
    error,
    notice,
    isSubmitting,
    canSubmit: email.length > 0 && password.length > 0 && !isSubmitting,
    setEmail,
    setPassword,
    submit,
  };
}
