import { Redirect } from 'expo-router';

/**
 * The tab group needs an index route, but the dashboard lives at `/dashboard` so
 * the URL says what the screen is. This forwards anyone who lands on the group
 * root — deep links, and the redirect out of onboarding.
 */
export default function TabsIndexRoute() {
  return <Redirect href="/dashboard" />;
}
