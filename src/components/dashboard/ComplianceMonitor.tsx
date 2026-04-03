"use client";

import styles from "./compliance.module.css";

export function ComplianceMonitor({ alerts = [] }: { alerts?: any[] }) {
  // Calculate dynamic compliance score based on live signals
  const critical = alerts.filter(a => a.risk_level === 'Critical' || a.severity === 'critical').length;
  const high = alerts.filter(a => a.risk_level === 'High' || a.severity === 'high').length;
  
  const baseScore = 98;
  const penalty = (critical * 12) + (high * 5);
  const score = Math.max(12, baseScore - penalty);
  
  let status = "Green";
  let color = "#10b981";

  if (score < 40) {
    status = "Red";
    color = "#ef4444";
  } else if (score < 75) {
    status = "Amber";
    color = "#f59e0b";
  }

  return (
    <div className={styles.complianceCard}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h4>MOM Compliance Monitor</h4>
          <span>Live WSH Signal Integration</span>
        </div>
        <div className={styles.ratingBadge}>BCA Tier 1</div>
      </div>

      <div className={styles.scoreContainer}>
        <div className={styles.scoreCircle} style={{ borderColor: color }}>
          <div className={styles.scoreInner}>
            <strong style={{ color: color }}>{score}</strong>
            <span>Rating</span>
          </div>
        </div>
        <div className={styles.statusInfo}>
          <div className={styles.statusBadge} style={{ backgroundColor: color }}>
            {status}
          </div>
          <p>
            {score < 75 
              ? "Multiple active risk signals detected. Immediate safety intervention required."
              : "Ongoing operations are currently meeting MOM safety benchmarks."}
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <label>Critical Detections</label>
          <strong style={critical > 0 ? { color: '#ef4444' } : {}}>{critical}</strong>
        </div>
        <div className={styles.statItem}>
          <label>High Risk Sites</label>
          <strong>{high}</strong>
        </div>
        <div className={styles.statItem}>
          <label>WSH Audit</label>
          <strong>{score > 60 ? 'Pass' : 'Critical Fail'}</strong>
        </div>
      </div>

      <div className={styles.footer}>
        <span>Inferred via AI-Signal & MOM CheckSafe API</span>
      </div>
    </div>
  );
}

