"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInterventions, getReports, getRiskAlerts } from "@/lib/supabase";
import styles from "./InfoPage.module.css";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export default function InfoPage({ eyebrow, title, description, sections }: InfoPageProps) {
  const [snapshot, setSnapshot] = useState({
    alerts: 0,
    interventions: 0,
    reports: 0,
  });

  useEffect(() => {
    async function loadSnapshot() {
      const [alerts, interventions, reports] = await Promise.all([
        getRiskAlerts(),
        getInterventions(),
        getReports(),
      ]);
      setSnapshot({
        alerts: alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status)).length,
        interventions: interventions.length,
        reports: reports.length,
      });
    }

    void loadSnapshot();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Back to Home
        </Link>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <section className={styles.card}>
          <h2 className={styles.heading}>Live operational snapshot</h2>
          <p className={styles.body}>
            {snapshot.alerts} active alerts, {snapshot.interventions} interventions, and {snapshot.reports} reports are currently available in the live workspace.
          </p>
        </section>
        <div className={styles.sectionList}>
          {sections.map((section) => (
            <section key={section.heading} className={styles.card}>
              <h2 className={styles.heading}>{section.heading}</h2>
              <p className={styles.body}>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
