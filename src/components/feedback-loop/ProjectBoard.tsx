'use client'

import styles from './ProjectBoard.module.css'
import ProjectPanel from './ProjectPanel'
import TaskNode from './TaskNode'
import ConnectorLines from './ConnectorLines'

export type Task = {
  id: string
  title: string
  color: string
  status?: string
  source?: string
  relatedId?: string
  createdAt?: string
}

const GUIDE_X = [160, 280, 400]
const TASK_TOPS = [40, 160, 280]

export default function ProjectBoard({ tasks }: { tasks?: Task[] }) {
  const safeTasks = tasks && tasks.length > 0 ? tasks : []

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Canvas */}
        <div className={styles.canvas}>
          {GUIDE_X.map((x) => (
            <div key={x} className={styles.guide} style={{ left: x }} />
          ))}

          {safeTasks.map((task, i) => (
            <div
              key={task.id}
              className={styles.taskRow}
              style={{
                top: TASK_TOPS[i] ?? 40 + i * 120,
                animation: `slideIn 0.5s ease ${i * 0.1}s both`,
              }}
            >
              <TaskNode task={task} />
            </div>
          ))}

          <ConnectorLines panelOpen={true} count={safeTasks.length} />
        </div>

        {/* Panel */}
        <div className={styles.panelWrap}>
          <ProjectPanel tasks={safeTasks} />
        </div>
      </div>
    </div>
  )
}
