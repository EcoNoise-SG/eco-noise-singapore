import styles from "./dashboard-section.module.css";

export function DashboardSection({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <p>{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}
