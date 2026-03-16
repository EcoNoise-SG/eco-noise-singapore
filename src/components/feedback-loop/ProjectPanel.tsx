'use client'

import styles from './ProjectPanel.module.css'

export default function ProjectPanel() {
  return (
    <div className={styles.panel}>
      <img 
        src="/feedback-loop-illustration.png" 
        alt="Predictive Feedback Loop Illustration" 
        className={styles.illustration}
      />
    </div>
  )
}