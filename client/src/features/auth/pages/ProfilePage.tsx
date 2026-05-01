import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { userFacingApiMessage } from '@/features/auth/lib/loginErrorMessage';
import { paths } from '@/routes/paths';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ErrorState } from '@/shared/ui/ErrorState';
import { ChevronLeftIcon } from '@/shared/ui/icons';
import { InputField } from '@/shared/ui/InputField';

import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [refreshError, setRefreshError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshError(null);
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } catch (err: unknown) {
      setRefreshError(new Error(userFacingApiMessage(err, 'Could not refresh profile.')));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) {
    return null;
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || '—';

  return (
    <section className={styles.root} aria-labelledby="profile-title">
      <Link to={paths.dashboard} className={styles.backLink}>
        <ChevronLeftIcon aria-hidden />
        Back to dashboard
      </Link>
      <header className={styles.header}>
        <div>
          <h1 id="profile-title" className={styles.title}>
            Profile
          </h1>
          <p className={styles.subtitle}>
            Your account details from the processor directory. Profile changes are administered on the
            server — contact an administrator if something looks wrong.
          </p>
        </div>
        <Button type="button" variant="secondary" isLoading={isRefreshing} onClick={handleRefresh}>
          Refresh from server
        </Button>
      </header>

      {refreshError ? (
        <ErrorState
          title="Could not refresh profile"
          description={refreshError.message}
          onRetry={handleRefresh}
        />
      ) : null}

      <div className={styles.grid}>
        <Card title="Identity" subtitle="How you appear in the app">
          <dl className={styles.dl}>
            <div className={styles.row}>
              <dt className={styles.dt}>Username</dt>
              <dd className={styles.dd}>{user.username}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.dt}>Email</dt>
              <dd className={styles.dd}>{user.email}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.dt}>Display name</dt>
              <dd className={styles.dd}>{user.displayName?.trim() || '—'}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.dt}>Name</dt>
              <dd className={styles.dd}>{fullName}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.dt}>Status</dt>
              <dd className={styles.dd}>
                <Badge tone="neutral">{user.status}</Badge>
              </dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.dt}>User ID</dt>
              <dd className={styles.ddMono}>{user.id}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Roles" subtitle="Assigned roles in the system">
          <ul className={styles.list}>
            {user.roleCodes.length === 0 ? (
              <li className={styles.muted}>No roles</li>
            ) : (
              user.roleCodes.map((r) => (
                <li key={r}>
                  <Badge tone="brand">{r}</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card title="Permissions" subtitle="Capabilities granted by your roles">
          <ul className={styles.permList}>
            {user.permissionCodes.length === 0 ? (
              <li className={styles.muted}>No permissions</li>
            ) : (
              user.permissionCodes.map((p) => (
                <li key={p} className={styles.permItem}>
                  <code className={styles.code}>{p}</code>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card
          title="Edit profile"
          subtitle="There is no self-service profile API in this release."
        >
          <InputField
            label="Display name (read-only)"
            defaultValue={user.displayName ?? ''}
            readOnly
            disabled
          />
          <p className={styles.note}>
            When a user profile API is available, this form can be switched to an editable flow with
            validation — the server remains the source of truth for RBAC.
          </p>
        </Card>
      </div>
    </section>
  );
}
