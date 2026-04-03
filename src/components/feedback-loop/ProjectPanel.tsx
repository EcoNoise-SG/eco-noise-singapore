'use client'

import styles from './ProjectPanel.module.css'
import type { Task } from './ProjectBoard'

export default function ProjectPanel({ tasks = [] }: { tasks?: Task[] }) {
  return (
    <div className={styles.panel}>
      <div style={{ width: '100%', padding: '16px' }}>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
            Live Loop Summary
          </p>
          <h4 style={{ margin: '6px 0 0', fontSize: '1rem', color: '#0f172a' }}>
            Operational Learning Snapshot
          </h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '12px 14px',
                background: '#f8fafc',
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', marginBottom: '4px' }}>
                {task.status || 'Live Update'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5, color: '#475569' }}>
                {task.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
