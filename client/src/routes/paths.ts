export const paths = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  profile: '/profile',
  notFound: '*',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
