'use client'

import styles from './ProjectBoard.module.css'
import ProjectPanel from './ProjectPanel'
import TaskNode from './TaskNode'
import ConnectorLines from './ConnectorLines'

export type Task = {
  id: string
  title: string
  color: string
}

const TASKS: Task[] = [
  { id: 'task-1', title: 'Connecting OneService reports, BCA permits, LTA road works, and NEA weather data into a unified lake.', color: '#FDDCB5' },
  { id: 'task-2', title: 'Spatial-temporal models process signals to identify risk correlations and upcoming activity peaks.', color: '#D4B8F0' },
  { id: 'task-3', title: 'Command teams receive precise recommendations for officer staging and inspection sweeps.', color: '#B8D0F5' },
]

const GUIDE_X = [160, 280, 400]
const TASK_TOPS = [40, 160, 280]

export default function ProjectBoard() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Canvas */}
        <div className={styles.canvas}>
          {GUIDE_X.map((x) => (
            <div key={x} className={styles.guide} style={{ left: x }} />
          ))}

          {TASKS.map((task, i) => (
            <div
              key={task.id}
              className={styles.taskRow}
              style={{
                top: TASK_TOPS[i],
                animation: `slideIn 0.5s ease ${i * 0.1}s both`,
              }}
            >
              <TaskNode task={task} />
            </div>
          ))}

          <ConnectorLines panelOpen={true} />
        </div>

        {/* Panel */}
        <div className={styles.panelWrap}>
          <ProjectPanel />
        </div>
      </div>
    </div>
  )
}