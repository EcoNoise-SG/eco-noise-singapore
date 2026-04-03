'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { getInterventions, getReports, getRiskAlerts } from "@/lib/supabase";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadStories() {
      const [alerts, interventions, reports] = await Promise.all([
        getRiskAlerts(),
        getInterventions(),
        getReports(),
      ]);

      setPosts([
        {
          id: "live-alert-brief",
          title: "Live Alert Brief",
          tag: "Operational Feed",
          date: new Date().toLocaleDateString(),
          image: "/blog-assets/blog-1.jpg",
          excerpt: `${alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status)).length} active alerts are currently feeding the operational dashboard.`,
          impact: `Top current area: ${alerts[0]?.location || "No active alert location yet"}.`,
        },
        {
          id: "intervention-cycle",
          title: "Intervention Cycle Snapshot",
          tag: "Field Ops",
          date: new Date().toLocaleDateString(),
          image: "/blog-assets/blog-4.jpg",
          excerpt: `${interventions.length} interventions are in the system, with ${interventions.filter((item: any) => item.outcome === "Completed").length} completed outcomes already logged.`,
          impact: `Most recent workflow: ${interventions[0]?.intervention_type?.replace(/_/g, " ") || "Pending new intervention"}.`,
        },
        {
          id: "reporting-archive",
          title: "Reporting Archive Health",
          tag: "Reporting",
          date: new Date().toLocaleDateString(),
          image: "/blog-assets/blog-5.jpg",
          excerpt: `${reports.length} reports are available in the live archive, providing the current operational review trail.`,
          impact: `Latest report: ${reports[0]?.title || "No report generated yet"}.`,
        },
      ]);
    }

    void loadStories();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Back to Home
        </Link>
        <h1 className={styles.title}>Live Scenario Library</h1>
        <p className={styles.description}>
          This page now surfaces live operational summaries instead of fixed example stories.
        </p>

        <div className={styles.grid}>
          {posts.map((post) => (
            <article key={post.id} id={post.id} className={styles.card}>
              <Image
                src={post.image}
                alt={post.title}
                width={720}
                height={420}
                className={styles.image}
              />
              <div className={styles.content}>
                <div className={styles.metaRow}>
                  <span className={styles.tag}>{post.tag}</span>
                  <span className={styles.date}>{post.date}</span>
                </div>
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.copy}>{post.excerpt}</p>
                <p className={styles.impact}>{post.impact}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
