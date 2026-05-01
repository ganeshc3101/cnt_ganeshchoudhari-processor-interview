import clsx from 'clsx';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { useSignOut } from '@/features/auth/hooks/useSignOut';
import { LogOutIcon, UserIcon } from '@/shared/ui/icons';
import { Logo } from '@/shared/ui/Logo';

import { paths } from '../paths';
import styles from './AppLayout.module.css';

function initialsFor(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function AppLayout() {
  const signOut = useSignOut();
  const { user } = useAuth();

  const handleSignOut = () => {
    void signOut();
  };

  const displayName: string =
    user?.displayName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'Guest';
  const initials = initialsFor(displayName);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerStart}>
            <NavLink
              to={paths.dashboard}
              className={clsx(styles.brand)}
              aria-label="Go to dashboard"
            >
              <Logo />
            </NavLink>
          </div>

          <div className={styles.headerActions}>
            <Link
              to={paths.profile}
              className={styles.userChip}
              title={`Signed in as ${displayName}`}
              aria-label={`View profile for ${displayName}`}
            >
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
            </Link>

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
