import Link from "next/link";
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
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Back to Home
        </Link>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
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
