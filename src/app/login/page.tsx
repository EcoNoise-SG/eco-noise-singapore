"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAuth();
  const [email, setEmail] = useState("ops@nea.gov.sg");
  const [password, setPassword] = useState("password");

  useEffect(() => {
    if (isReady && isAuthenticated) {
      startTransition(() => {
        router.replace("/dashboard");
      });
    }
  }, [isAuthenticated, isReady, router]);

  return (
    <main className={styles.page}>
      <section className={styles.heroPanel}>
        {/* Background image is set in CSS */}
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formHeader}>
          <div className={styles.logoContainer}>
            <img src="/LOGO.svg" alt="EcoNoise SG Logo" className={styles.logoImage} />
          </div>
          <h2>Access dashboard</h2>
          <span>Use the mock frontend login to enter the prototype workspace.</span>
        </div>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            login(email);
            startTransition(() => {
              router.replace("/dashboard");
            });
          }}
        >
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ops@nea.gov.sg"
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>

          <button className={styles.submitButton} type="submit">
            Login
          </button>
        </form>

        <div className={styles.formFooter}>
          <p>Suggested demo credentials</p>
          <strong>`ops@nea.gov.sg` with any password</strong>
        </div>
      </section>
    </main>
  );
}
