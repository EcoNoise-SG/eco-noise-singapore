'use client'

import styles from './TaskNode.module.css'
import { Task } from './ProjectBoard'

export default function TaskNode({ task }: { task: Task }) {
  return (
    <div className={styles.node} style={{ background: task.color }}>
      <span className={styles.title}>{task.title}</span>

      <button className={styles.dotsBtn} aria-label="options">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </button>

      <div className={styles.connector} />
    </div>
  )
}