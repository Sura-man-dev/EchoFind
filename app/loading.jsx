import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.loading} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.spinner} aria-hidden="true" />
      <p>Loading EchoFind…</p>
    </main>
  );
}
