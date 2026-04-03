'use client'

import styles from './TaskNode.module.css'
import { Task } from './ProjectBoard'

export default function TaskNode({ task }: { task: Task }) {
  return (
    <div className={styles.node} style={{ background: task.color }}>
      <div style={{ flex: 1 }}>
        {task.status ? (
          <strong style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '4px' }}>
            {task.status}
          </strong>
        ) : null}
        <span className={styles.title}>{task.title}</span>
      </div>

      <button className={styles.dotsBtn} aria-label="options">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </button>

      <div className={styles.connector} />
    </div>
  )
}
