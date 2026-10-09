import styles from "./InfoPage.module.css";

export default function InfoPage({ eyebrow, title, intro, children }) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </header>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
