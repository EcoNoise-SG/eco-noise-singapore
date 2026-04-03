'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './workspace-dock.module.css';
import {
  createWorkspaceMessage,
  createWorkspaceTask,
  getCurrentUserIdentity,
  getWorkspaceMessages,
  getWorkspaceTasks,
  subscribeToWorkspaceMessages,
  subscribeToWorkspaceTasks,
  updateWorkspaceTask,
} from '@/lib/supabase';

type WorkspaceMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

type WorkspaceTask = {
  id: string;
  title: string;
  details?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
};

export default function WorkspaceDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');
  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function bootstrap() {
      const identity = await getCurrentUserIdentity();
      setUserId(identity.id);
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function loadDockData() {
      setLoading(true);
      const [messageRows, taskRows] = await Promise.all([
        getWorkspaceMessages(userId),
        getWorkspaceTasks(userId),
      ]);

      setMessages(messageRows);
      setTasks(taskRows);
      setLoading(false);
    }

    void loadDockData();

    const messageSubscription = subscribeToWorkspaceMessages(userId, () => {
      void getWorkspaceMessages(userId).then(setMessages);
    });
    const taskSubscription = subscribeToWorkspaceTasks(userId, () => {
      void getWorkspaceTasks(userId).then(setTasks);
    });

    return () => {
      messageSubscription.unsubscribe();
      taskSubscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isOpen, activeTab]);

  const unresolvedTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done').length,
    [tasks],
  );

  const unreadStyleCount = useMemo(
    () => messages.filter((message) => message.role === 'assistant').length,
    [messages],
  );

  async function handleSendMessage() {
    const trimmed = messageInput.trim();
    if (!trimmed || !userId) return;

    setMessageInput('');

    const createdMessage = await createWorkspaceMessage(userId, trimmed, 'user');
    if (!createdMessage) {
      toast.error('Unable to save workspace message.');
      return;
    }

    const taskSignal = /(todo|task|follow up|follow-up|remind|assign|action)/i.test(trimmed);
    if (taskSignal) {
      await createWorkspaceTask(userId, {
        title: trimmed.slice(0, 88),
        details: 'Created from workspace chat.',
        priority: 'medium',
      });
    }

    const responseText = taskSignal
      ? 'Saved to your private workspace stream and converted into a task candidate.'
      : 'Saved to your private workspace stream. You can turn this into a task from the Tasks tab.';
    await createWorkspaceMessage(userId, responseText, 'assistant');
  }

  async function handleCreateTask() {
    if (!taskTitle.trim() || !userId) {
      toast.error('Add a task title first.');
      return;
    }

    const created = await createWorkspaceTask(userId, {
      title: taskTitle.trim(),
      details: taskDetails.trim() || undefined,
      priority: taskPriority,
    });

    if (!created) {
      toast.error('Unable to create task.');
      return;
    }

    setTaskTitle('');
    setTaskDetails('');
    setTaskPriority('medium');
    toast.success('Task added to your workspace.');
  }

  async function cycleTaskStatus(task: WorkspaceTask) {
    const nextStatus =
      task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    await updateWorkspaceTask(task.id, { status: nextStatus });
  }

  return (
    <div className={styles.dockShell}>
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.title}>Chat & Task Manager</h3>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close workspace">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className={styles.tabRow}>
            <button
              className={activeTab === 'chat' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('chat')}
              type="button"
            >
              Chat
            </button>
            <button
              className={activeTab === 'tasks' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('tasks')}
              type="button"
            >
              Tasks
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className={styles.messageList} ref={messageListRef}>
                {loading && <div className={styles.emptyState}>Loading your private workspace stream...</div>}
                {!loading && messages.length === 0 && (
                  <div className={styles.emptyState}>
                    Start a private operational note. Messages here stay scoped to your logged-in account.
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.role === 'user' ? styles.userBubble : styles.assistantBubble}
                  >
                    <span>{message.content}</span>
                    <small>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                ))}
              </div>
              <div className={styles.composer}>
                <textarea
                  className={styles.composerInput}
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Write a private note, command update, or task request..."
                />
                <button className={styles.primaryBtn} onClick={() => void handleSendMessage()} type="button">
                  Send
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.taskComposer}>
                <input
                  className={styles.field}
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Add a task title"
                />
                <textarea
                  className={styles.fieldArea}
                  value={taskDetails}
                  onChange={(event) => setTaskDetails(event.target.value)}
                  placeholder="Task detail or reminder"
                />
                <div className={styles.taskRow}>
                  <select
                    className={styles.field}
                    value={taskPriority}
                    onChange={(event) => setTaskPriority(event.target.value as 'low' | 'medium' | 'high')}
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                  <button className={styles.primaryBtn} onClick={() => void handleCreateTask()} type="button">
                    Add
                  </button>
                </div>
              </div>

              <div className={styles.taskList}>
                {!loading && tasks.length === 0 && (
                  <div className={styles.emptyState}>No personal tasks yet. Create one or send a task-like chat message.</div>
                )}
                {tasks.map((task) => (
                  <button key={task.id} type="button" className={styles.taskCard} onClick={() => void cycleTaskStatus(task)}>
                    <div className={styles.taskTop}>
                      <strong>{task.title}</strong>
                      <span className={task.priority === 'high' ? styles.priorityHigh : task.priority === 'medium' ? styles.priorityMedium : styles.priorityLow}>
                        {task.priority}
                      </span>
                    </div>
                    {task.details ? <p>{task.details}</p> : null}
                    <div className={styles.taskMeta}>
                      <span>{task.status.replace('_', ' ')}</span>
                      <span>Click to cycle status</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <button className={styles.launcher} onClick={() => setIsOpen((current) => !current)} type="button" aria-label="Open workspace chat">
        <span className={styles.launcherIcon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h8" />
            <path d="M18 3v6" />
            <path d="M15 6h6" />
          </svg>
        </span>
        <div className={styles.launcherText}>
          <strong>Workspace</strong>
          <small>{unresolvedTasks} tasks · {unreadStyleCount} notes</small>
        </div>
      </button>
    </div>
  );
}
