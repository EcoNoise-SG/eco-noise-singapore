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
        {(task.source || task.relatedId || task.createdAt) ? (
          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {task.source ? (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', background: 'rgba(255,255,255,0.65)', borderRadius: '999px', padding: '3px 7px' }}>
                {task.source}
              </span>
            ) : null}
            {task.relatedId ? (
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>{task.relatedId}</span>
            ) : null}
            {task.createdAt ? (
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            ) : null}
          </div>
        ) : null}
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
