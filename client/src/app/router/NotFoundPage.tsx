import { Link } from 'react-router-dom';

import { paths } from '@/routes/paths';

export function NotFoundPage() {
  return (
    <main style={{ padding: 'var(--space-8)' }}>
      <h1>404 — Page not found</h1>
      <p>
        <Link to={paths.root}>Back to home</Link>
      </p>
    </main>
  );
}
