import styles from './LoginPage.module.css';
import { LoginForm } from '../components/LoginForm';


export function LoginPage() {
  return (
    <section className={styles.root} aria-labelledby="login-title">
      <header className={styles.heading}>
        <h1 id="login-title" className={styles.title}>
          Sign in to your account
        </h1>
        <p className={styles.subtitle}>Welcome back. Access your merchant dashboard.</p>
      </header>

      <LoginForm />

      <p className={styles.footer}>
        Don&apos;t have an account?{' '}
        <a href="#" className={styles.footerLink}>
          Get started
        </a>
      </p>
    </section>
  );
}
