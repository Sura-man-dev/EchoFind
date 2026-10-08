"use client";

import { useState } from "react";
import SignupModal from "./Signup";
import styles from "./AuthPage.module.css";

export default function AuthPage({ mode }) {
  const [authMode, setAuthMode] = useState(mode);

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.intro}>
        <p className={styles.eyebrow}>A little help goes a long way</p>
        <h1>Good things find their way home.</h1>
        <p className={styles.description}>
          Sign in to report an item, search what has been found, and help your
          community reconnect with the things that matter.
        </p>
        <div className={styles.trustNote}>
          <span className={styles.trustDot} />
          A safer, more connected lost-and-found community
        </div>
      </section>
      <SignupModal
        show
        dismissible={false}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </main>
  );
}
