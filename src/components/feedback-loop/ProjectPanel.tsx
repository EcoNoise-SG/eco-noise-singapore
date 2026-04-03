'use client'

import { useEffect, useState } from 'react'
import styles from './ProjectPanel.module.css'
import type { Task } from './ProjectBoard'
import { getOperationalActivity } from '@/lib/supabase'
import { useDashboardI18n } from '@/components/dashboard/DashboardI18n'

export default function ProjectPanel({ tasks = [] }: { tasks?: Task[] }) {
  const { t } = useDashboardI18n()
  const [liveFallback, setLiveFallback] = useState<Task[]>([])

  useEffect(() => {
    if (tasks.length > 0) return

    async function loadFallbackTasks() {
      const activity = await getOperationalActivity(4)
      setLiveFallback(
        activity.map((item) => ({
          id: item.id,
          title: `${item.action.replace(/_/g, ' ')} · ${item.resource_type}${item.resource_id ? ` ${item.resource_id}` : ''}`,
          color: item.severity === 'critical' ? '#FDB5B5' : item.severity === 'warning' ? '#FDDCB5' : '#B8D0F5',
          status: item.source.toUpperCase(),
          source: item.source,
          relatedId: item.resource_id,
          createdAt: item.created_at,
        })),
      )
    }

    void loadFallbackTasks()
  }, [tasks])

  const visibleTasks = tasks.length > 0 ? tasks : liveFallback
  const statusCounts = visibleTasks.reduce<Record<string, number>>((acc, task) => {
    const key = task.status || 'Live Update'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className={styles.panel}>
      <div style={{ width: '100%', padding: '16px' }}>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
            {t('feedbackLoopSummary', 'Live Loop Summary')}
          </p>
          <h4 style={{ margin: '6px 0 0', fontSize: '1rem', color: '#0f172a' }}>
            {t('operationalLearningSnapshot', 'Operational Learning Snapshot')}
          </h4>
        </div>
        {visibleTasks.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {Object.entries(statusCounts).map(([label, count]) => (
              <span
                key={label}
                style={{
                  borderRadius: '999px',
                  border: '1px solid #dbe4f0',
                  background: '#fff',
                  color: '#475569',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {label} · {count}
              </span>
            ))}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleTasks.length === 0 ? (
            <div
              style={{
                border: '1px dashed #cbd5e1',
                borderRadius: '14px',
                padding: '14px',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '0.78rem',
                lineHeight: 1.5,
              }}
            >
              {t('noLiveLoopTasks', 'No live loop tasks have been recorded yet.')}
            </div>
          ) : visibleTasks.map((task) => (
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
                {task.status || t('liveUpdate', 'Live Update')}
              </strong>
              <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5, color: '#475569' }}>
                {task.title}
              </p>
              {(task.relatedId || task.createdAt) ? (
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                  {task.relatedId ? <span>{task.relatedId}</span> : null}
                  {task.relatedId && task.createdAt ? <span> · </span> : null}
                  {task.createdAt ? <span>{new Date(task.createdAt).toLocaleString()}</span> : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
