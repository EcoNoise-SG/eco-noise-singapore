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
            <img src="/LOGO.svg" alt="EcoNoise SG Logo" className={styles.logoImage} />
          </div>
          <h2>Enterprise Workspace</h2>
          <span>Use your credentials to enter the EcoNoise SG operations dashboard.</span>
        </div>

        <form
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await login(email, password);
              // Redirect is handled by the useEffect
            } catch (err) {
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
              placeholder="e.g. officer@agency.gov.sg"
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create or enter password"
            />
          </label>

          <button className={styles.submitButton} type="submit">
            Login
          </button>
        </form>

        <div className={styles.formFooter}>
          <p>Prototype Sandbox</p>
          <strong>Enter any email and password to create or access a workspace.</strong>
        </div>
      </section>
    </main>
  );
}
