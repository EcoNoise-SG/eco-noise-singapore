import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const posts = [
  {
    id: "chinese-new-year-preparation",
    title: "Chinese New Year Preparation",
    tag: "Festive Season",
    date: "March 12, 2026",
    image: "/blog-assets/blog-1.jpg",
    excerpt:
      "Predict renovation noise surges 3 weeks ahead during CNY prep season. Pre-position officers in high-density HDB areas with historical renovation patterns.",
    impact: "Impact: 18% reduction in noise complaints through earlier staging and resident outreach."
  },
  {
    id: "monsoon-season-response",
    title: "Monsoon Season Response",
    tag: "Weather-Driven",
    date: "March 08, 2026",
    image: "/blog-assets/blog-4.jpg",
    excerpt:
      "Correlate NEA weather forecasts with flooding complaint hotspots and dispatch inspection teams to drainage-prone areas before heavy rainfall events.",
    impact: "Impact: 22% faster response times when alerts align with weather-linked risk windows."
  },
  {
    id: "construction-zone-coordination",
    title: "Construction Zone Coordination",
    tag: "Construction",
    date: "March 05, 2026",
    image: "/blog-assets/blog-5.jpg",
    excerpt:
      "Sync with BCA permit start dates and LTA road works schedules to coordinate proactive site inspections during high-activity construction phases.",
    impact: "Impact: Officer utilization up 22% through better inspection sequencing."
  }
];

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Back to Home
        </Link>
        <h1 className={styles.title}>Real-World Scenario Library</h1>
        <p className={styles.description}>
          A deeper look at the operational stories behind the landing page cards.
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
