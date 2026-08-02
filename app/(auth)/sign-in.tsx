import { AuthScreen } from '@/features/auth';

/** Routes are one-liners by design: all behaviour lives in the feature. */
export default function SignInRoute() {
  return <AuthScreen mode="signIn" />;
}
