"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            <img src="/LOGO.svg" alt="Worker Safety Intelligence Platform Logo" className={styles.logoImage} />
          </div>
          <h2>Worker Safety Intelligence</h2>
          <span>Use your MOM, BCA, or NEA credentials to access the worker safety and dormitory wellness dashboard.</span>
        </div>

        <form
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await login(email, password);
            } catch {
              // Error toast is handled in AuthProvider
            }
          }}
        >
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. test@migirantpulse.com.sg"
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="e.g. MPulse#0085"
            />
          </label>

          <button className={styles.submitButton} type="submit">
            Login / Register
          </button>
        </form>

        <div className={styles.formFooter}>
          <p>Secure sign-in uses Supabase authentication.</p>
          <strong>If the account does not exist yet, the same email and password will be used to create it automatically.</strong>
        </div>
      </section>
    </main>
  );
}
