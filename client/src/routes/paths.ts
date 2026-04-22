export const paths = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  notFound: '*',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
