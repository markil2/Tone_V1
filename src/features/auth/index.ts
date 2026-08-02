/**
 * Public API of the auth feature.
 *
 * Other features and routes may import ONLY from here. Deep imports such as
 * `@/features/auth/data/...` are forbidden (enforced in eslint.config.js), which
 * keeps this feature's internals free to change.
 */
export { AuthScreen } from './presentation/screens/AuthScreen';
export {
  SessionProvider,
  useRequireUserId,
  useSession,
} from './presentation/SessionProvider';
export type { AuthStatus, AuthUser, Session } from './domain/entities/user';
