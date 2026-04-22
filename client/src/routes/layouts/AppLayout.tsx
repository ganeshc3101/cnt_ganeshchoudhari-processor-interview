import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { LogOutIcon, UserIcon } from '@/shared/ui/icons';
import { Logo } from '@/shared/ui/Logo';

import { paths } from '../paths';
import styles from './AppLayout.module.css';

function initialsFor(userId: string): string {
  const trimmed = userId.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function AppLayout() {
  const signOut = useSignOut();
  const { session } = useAuth();

  const handleSignOut = () => {
    void signOut();
  };

  const displayName = session?.userId ?? 'Guest';
  const initials = initialsFor(displayName);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={paths.dashboard} className={styles.brand} aria-label="Go to dashboard">
            <Logo />
          </Link>

          <div className={styles.headerActions}>
            <div className={styles.userChip} title={`Signed in as ${displayName}`}>
              <span className={styles.avatar} aria-hidden="true">
                {initials}
              </span>
              <span className={styles.userMeta}>
                <span className={styles.userLabel}>
                  <UserIcon width={12} height={12} />
                  Signed in as
                </span>
                <span className={styles.userName}>{displayName}</span>
              </span>
            </div>

            <button
              type="button"
              className={styles.signOut}
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <span className={styles.signOutIcon} aria-hidden="true">
                <LogOutIcon />
              </span>
              <span className={styles.signOutLabel}>Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className={styles.main} id="main">
        <Outlet />
      </main>
    </div>
  );
}
