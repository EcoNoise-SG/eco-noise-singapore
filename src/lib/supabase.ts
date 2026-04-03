/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://apjomfculzncvglxuegt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const auditLoggingEnabled = process.env.NEXT_PUBLIC_ENABLE_AUDIT_LOGS === 'true';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Unsubscribe = { unsubscribe: () => void };
let auditLoggingDisabled = false;
export type OperationalActivityItem = {
  id: string;
  created_at: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  severity: 'info' | 'warning' | 'critical';
  details?: any;
  source: 'audit' | 'alerts' | 'interventions' | 'reports';
};

export async function getCurrentUserIdentity() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      id: user.id,
      email: user.email || '',
      isDemo: false,
      isAuthenticated: true,
    };
  }

  return {
    id: '',
    email: '',
    isDemo: false,
    isAuthenticated: false,
  };
}

async function safeAudit(action: string, resourceType?: string, resourceId?: string, details?: any) {
  try {
    const identity = await getCurrentUserIdentity();
    if (!identity.id) return;
    await logAudit(identity.id, action, resourceType, resourceId, details);
  } catch {
    // Audit writes should never surface to the UI; the app remains usable without them.
  }
}

function subscribeToTable(
  channelName: string,
  table: string,
  onChange: () => void,
): Unsubscribe {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => onChange(),
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

function subscribeToScopedTable(
  channelName: string,
  table: string,
  userId: string,
  onChange: () => void,
): Unsubscribe {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

export function subscribeToRiskAlerts(onChange: () => void): Unsubscribe {
  return subscribeToTable('risk-alerts-live', 'risk_alerts', onChange);
}

export function subscribeToInterventions(onChange: () => void): Unsubscribe {
  return subscribeToTable('interventions-live', 'interventions', onChange);
}

export function subscribeToNotifications(onChange: () => void): Unsubscribe {
  return subscribeToTable('notifications-live', 'notifications', onChange);
}

export function subscribeToAuditLogs(onChange: () => void): Unsubscribe {
  if (!auditLoggingEnabled) {
    return { unsubscribe: () => undefined };
  }
  return subscribeToTable('audit-logs-live', 'audit_logs', onChange);
}

export function subscribeToReports(onChange: () => void): Unsubscribe {
  return subscribeToTable('reports-live', 'reports', onChange);
}

export function subscribeToUserPreferences(userId: string, onChange: () => void): Unsubscribe;
export function subscribeToUserPreferences(onChange: () => void): Unsubscribe;
export function subscribeToUserPreferences(
  userIdOrOnChange: string | (() => void),
  maybeOnChange?: () => void,
): Unsubscribe {
  if (typeof userIdOrOnChange === 'string') {
    return subscribeToScopedTable(
      `user-preferences-live-${userIdOrOnChange}`,
      'user_preferences',
      userIdOrOnChange,
      maybeOnChange || (() => {}),
    );
  }

  return subscribeToTable('user-preferences-live', 'user_preferences', userIdOrOnChange);
}

export function subscribeToWorkspaceMessages(userId: string, onChange: () => void): Unsubscribe {
  return subscribeToScopedTable(`workspace-messages-${userId}`, 'workspace_messages', userId, onChange);
}

export function subscribeToWorkspaceTasks(userId: string, onChange: () => void): Unsubscribe {
  return subscribeToScopedTable(`workspace-tasks-${userId}`, 'workspace_tasks', userId, onChange);
}

// ==================== ALERTS ====================

export async function createRiskAlert(alertData: {
  alert_id: string;
  component: string;
  location: string;
  risk_score: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  description?: string;
  triggered_by?: any;
  status?: string;
  assigned_to?: string | null;
}) {
  const { data, error } = await supabase
    .from('risk_alerts')
    .insert([{ ...alertData, status: alertData.status || 'open' }])
    .select();
  
  if (error) console.error('Error creating alert:', error);
  if (!error && data?.[0]) {
    await safeAudit('created_alert', 'alert', data[0].alert_id, {
      component: data[0].component,
      location: data[0].location,
      risk_score: data[0].risk_score,
    });
    const identity = await getCurrentUserIdentity();
    if (identity.id) {
      await createNotification(
        identity.id,
        `New ${data[0].component} alert created`,
        `${data[0].location} scored ${data[0].risk_score}/100.`,
        'alert_created',
        data[0].alert_id,
      );
    }
  }
  return data?.[0] || null;
}

export async function getRiskAlerts(filters?: { component?: string; location?: string; status?: string }) {
  let query = supabase
    .from('risk_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.component) query = query.eq('component', filters.component);
  if (filters?.location) query = query.eq('location', filters.location);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) console.error('Error fetching alerts:', error);
  return data || [];
}

export async function updateAlertStatus(alertId: string, status: string) {
  const { data, error } = await supabase
    .from('risk_alerts')
    .update({
      status,
      updated_at: new Date().toISOString(),
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('alert_id', alertId)
    .select();

  if (error) console.error('Error updating alert:', error);
  if (!error && data?.[0]) {
    await safeAudit('updated_alert_status', 'alert', alertId, { status });
  }
  return data?.[0] || null;
}

// ==================== INTERVENTIONS ====================

export async function createIntervention(interventionData: {
  intervention_id: string;
  alert_id?: string;
  intervention_type: string;
  location: string;
  assigned_to: string;
  team_members?: string[];
  start_time: string;
  objectives?: any;
}) {
  const { data, error } = await supabase
    .from('interventions')
    .insert([{ ...interventionData, outcome: 'In Progress' }])
    .select();

  if (error) console.error('Error creating intervention:', error);
  if (!error && data?.[0]) {
    await safeAudit('created_intervention', 'intervention', data[0].intervention_id, {
      type: data[0].intervention_type,
      location: data[0].location,
    });
    const identity = await getCurrentUserIdentity();
    if (identity.id) {
      await createNotification(
        identity.id,
        'Intervention created',
        `${data[0].intervention_type} scheduled for ${data[0].location}.`,
        'intervention_created',
        data[0].alert_id,
      );
    }
  }
  return data?.[0] || null;
}

export async function getInterventions(filters?: { alert_id?: string; assigned_to?: string; outcome?: string }) {
  let query = supabase.from('interventions').select('*');

  if (filters?.alert_id) query = query.eq('alert_id', filters.alert_id);
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
  if (filters?.outcome) query = query.eq('outcome', filters.outcome);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) console.error('Error fetching interventions:', error);
  return data || [];
}

export async function updateInterventionOutcome(interventionId: string, outcome: string, findings?: any) {
  const { data, error } = await supabase
    .from('interventions')
    .update({
      outcome,
      findings,
      end_time: outcome === 'Completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('intervention_id', interventionId)
    .select();

  if (error) console.error('Error updating intervention:', error);
  if (!error && data?.[0]) {
    await safeAudit('updated_intervention_outcome', 'intervention', interventionId, {
      outcome,
      findings,
    });
  }
  return data?.[0] || null;
}

// ==================== AUDIT LOGS ====================

export async function logAudit(userId: string, action: string, resourceType?: string, resourceId?: string, details?: any) {
  if (!auditLoggingEnabled || auditLoggingDisabled) {
    return false;
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert([{
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    }]);

  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message)
      : '';

  const errorName =
    typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name?: string }).name)
      : '';

  const hasUsefulAuditError =
    Boolean(errorCode) ||
    Boolean(errorMessage) ||
    Boolean(errorName);

  const isBenignAuditError =
    !hasUsefulAuditError ||
    errorCode === '403' ||
    errorCode === '42501' ||
    errorCode === 'PGRST116' ||
    errorMessage.toLowerCase().includes('permission') ||
    errorMessage.toLowerCase().includes('forbidden') ||
    errorMessage.toLowerCase().includes('row-level security') ||
    errorMessage.toLowerCase().includes('0 rows') ||
    errorMessage.toLowerCase().includes('no rows');

  if (error && isBenignAuditError) {
    auditLoggingDisabled = true;
  }

  if (error && !isBenignAuditError) console.error('Error logging audit:', error);
  return !!data;
}

export async function getAuditLogs(userId?: string, limit = 100) {
  if (!auditLoggingEnabled) {
    return [];
  }

  let query = supabase.from('audit_logs').select('*');

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) console.error('Error fetching audit logs:', error);
  return data || [];
}

function toSeverity(label: string) {
  if (/critical|error|failed/i.test(label)) return 'critical' as const;
  if (/warning|acknowledged|deferred/i.test(label)) return 'warning' as const;
  return 'info' as const;
}

export async function getOperationalActivity(limit = 100) {
  const [auditLogs, alerts, interventions, reports] = await Promise.all([
    getAuditLogs(undefined, limit),
    getRiskAlerts(),
    getInterventions(),
    getReports(),
  ]);

  const derivedLogs: OperationalActivityItem[] = [
    ...alerts.map((alert: any) => ({
      id: `alert-${alert.alert_id}`,
      created_at: alert.updated_at || alert.created_at,
      user_id: alert.assigned_to || undefined,
      action: `${alert.status === 'resolved' ? 'Resolved' : 'Tracked'} ${alert.component} alert at ${alert.location}`,
      resource_type: 'alert',
      resource_id: alert.alert_id,
      severity: toSeverity(alert.risk_level || alert.status || 'info'),
      details: {
        risk_level: alert.risk_level,
        risk_score: alert.risk_score,
        status: alert.status,
      },
      source: 'alerts' as const,
    })),
    ...interventions.map((intervention: any) => ({
      id: `intervention-${intervention.intervention_id}`,
      created_at: intervention.updated_at || intervention.end_time || intervention.start_time || intervention.created_at,
      user_id: intervention.assigned_to || undefined,
      action: `${intervention.outcome === 'Completed' ? 'Completed' : 'Updated'} ${intervention.intervention_type} at ${intervention.location}`,
      resource_type: 'intervention',
      resource_id: intervention.intervention_id,
      severity: toSeverity(intervention.outcome || 'info'),
      details: {
        outcome: intervention.outcome,
        team_members: intervention.team_members,
      },
      source: 'interventions' as const,
    })),
    ...reports.map((report: any) => ({
      id: `report-${report.report_id}`,
      created_at: report.published_at || report.created_at,
      user_id: report.generated_by || undefined,
      action: `${report.status === 'published' ? 'Published' : 'Generated'} ${report.report_type} report`,
      resource_type: 'report',
      resource_id: report.report_id,
      severity: toSeverity(report.status || 'info'),
      details: {
        title: report.title,
        status: report.status,
      },
      source: 'reports' as const,
    })),
  ];

  const canonicalAuditLogs: OperationalActivityItem[] = auditLogs.map((log: any) => ({
    id: `audit-${log.id}`,
    created_at: log.created_at,
    user_id: log.user_id || undefined,
    action: log.action,
    resource_type: log.resource_type || 'audit',
    resource_id: log.resource_id || undefined,
    severity: toSeverity(log.action || 'info'),
    details: log.details,
    source: 'audit',
  }));

  const activity = [...canonicalAuditLogs, ...derivedLogs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return activity;
}

export function subscribeToOperationalActivity(onChange: () => void): Unsubscribe {
  const subscriptions = [
    subscribeToRiskAlerts(onChange),
    subscribeToInterventions(onChange),
    subscribeToReports(onChange),
  ];

  if (auditLoggingEnabled) {
    subscriptions.push(subscribeToAuditLogs(onChange));
  }

  return {
    unsubscribe: () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
  };
}

// ==================== RISK HISTORY ====================

export async function logRiskScore(location: string, component: string, score: number, dataDrivers?: any) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('risk_scores_history')
    .insert([{
      location,
      component,
      score,
      score_date: today,
      data_drivers: dataDrivers
    }]);

  if (error) console.error('Error logging risk score:', error);
  return !!data;
}

export async function getRiskHistory(location: string, component: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('risk_scores_history')
    .select('*')
    .eq('location', location)
    .eq('component', component)
    .gte('score_date', startDate.toISOString().split('T')[0])
    .order('score_date', { ascending: true });

  if (error) console.error('Error fetching risk history:', error);
  return data || [];
}

// ==================== DATA CACHING ====================

export async function cacheDataSourceResponse(sourceName: string, data: any, ttlMinutes = 600) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const { error } = await supabase
    .from('data_source_cache')
    .insert([{
      source_name: sourceName,
      data,
      expires_at: expiresAt,
      status: 'valid'
    }]);

  if (error) console.error('Error caching data source:', error);
  return !!data;
}

export async function getCachedDataSource(sourceName: string) {
  const { data, error } = await supabase
    .from('data_source_cache')
    .select('*')
    .eq('source_name', sourceName)
    .gt('expires_at', new Date().toISOString())
    .eq('status', 'valid')
    .order('cached_at', { ascending: false })
    .limit(1)
    .single();

  if (error) console.error('Error retrieving cached data:', error);
  return data?.data || null;
}

// ==================== CONTRACTORS (C4) ====================

export async function syncContractorData(contractorData: {
  uen: string;
  company_name: string;
  crs_status?: string;
  safety_score?: number;
  stop_work_orders?: number;
  incident_count?: number;
} | Array<{
  uen: string;
  company_name: string;
  crs_status?: string;
  safety_score?: number;
  stop_work_orders?: number;
  incident_count?: number;
}>) {
  const rows = Array.isArray(contractorData) ? contractorData : [contractorData];
  const { data, error } = await supabase
    .from('contractors')
    .upsert(rows.map((row) => ({
      ...row,
      last_synced: new Date()
    })), { onConflict: 'uen' })
    .select();

  if (error) console.error('Error syncing contractor:', error);
  if (!error && data?.length) {
    await safeAudit('synced_contractors', 'contractor', data[0].uen, {
      count: data.length,
    });
  }
  return Array.isArray(contractorData) ? (data || []) : (data?.[0] || null);
}

export async function getContractors() {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .order('safety_score', { ascending: false });

  if (error) console.error('Error fetching contractors:', error);
  return data || [];
}

export async function getContractorBySafety(minScore?: number) {
  let query = supabase.from('contractors').select('*');

  if (minScore) query = query.gte('safety_score', minScore);

  const { data, error } = await query.order('safety_score', { ascending: false });
  if (error) console.error('Error fetching contractors:', error);
  return data || [];
}

// ==================== NOTIFICATIONS ====================

export async function createNotification(userId: string, title: string, message?: string, type?: string, relatedAlertId?: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      title,
      message,
      notification_type: type,
      related_alert_id: relatedAlertId
    }])
    .select();

  if (error) console.error('Error creating notification:', error);
  if (!error && data?.[0]) {
    await safeAudit('created_notification', 'notification', String(data[0].id), {
      title,
      type,
    });
  }
  return data?.[0] || null;
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) console.error('Error fetching notifications:', error);
  return data || [];
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date() })
    .eq('id', notificationId)
    .select();

  if (error) console.error('Error marking notification as read:', error);
  if (!error) {
    await safeAudit('read_notification', 'notification', notificationId);
  }
  return !!data?.length;
}

// ==================== USER PREFERENCES ====================

export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message)
      : '';

  const isNoRowError =
    errorCode === 'PGRST116' ||
    errorCode === '406' ||
    errorCode === '403' ||
    errorMessage.toLowerCase().includes('0 rows') ||
    errorMessage.toLowerCase().includes('no rows');

  if (error && !isNoRowError) console.error('Error fetching preferences:', error);
  return data || null;
}

export async function updateUserPreferences(userId: string, preferences: any) {
  const { error } = await supabase
    .from('user_preferences')
    .upsert([{
      user_id: userId,
      ...preferences,
      updated_at: new Date()
    }], { onConflict: 'user_id' });

  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message)
      : '';

  const isBenignPreferenceError =
    !errorMessage && !errorCode ||
    errorCode === 'PGRST116' ||
    errorCode === '406' ||
    errorCode === '403' ||
    errorMessage.toLowerCase().includes('0 rows') ||
    errorMessage.toLowerCase().includes('no rows');

  if (error && !isBenignPreferenceError) console.error('Error updating preferences:', error);
  if (!error) {
    await safeAudit('updated_preferences', 'user_preferences', userId, preferences);
  }
  return !error;
}

// ==================== PERSONAL WORKSPACE CHAT + TASKS ====================

export async function getOrCreateWorkspaceThread(userId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('workspace_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching workspace thread:', fetchError);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('workspace_threads')
    .insert([{
      user_id: userId,
      title: 'My workspace thread',
      is_archived: false,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating workspace thread:', error);
    return null;
  }

  await safeAudit('created_workspace_thread', 'workspace_thread', String(data.id));
  return data;
}

export async function getWorkspaceMessages(userId: string, threadId?: string) {
  let activeThreadId = threadId;

  if (!activeThreadId) {
    const thread = await getOrCreateWorkspaceThread(userId);
    activeThreadId = thread?.id;
  }

  if (!activeThreadId) return [];

  const { data, error } = await supabase
    .from('workspace_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('thread_id', activeThreadId)
    .order('created_at', { ascending: true });

  if (error) console.error('Error fetching workspace messages:', error);
  return data || [];
}

export async function createWorkspaceMessage(userId: string, content: string, role: 'user' | 'assistant' | 'system' = 'user', threadId?: string) {
  const thread = threadId ? { id: threadId } : await getOrCreateWorkspaceThread(userId);
  if (!thread?.id) return null;

  const { data, error } = await supabase
    .from('workspace_messages')
    .insert([{
      user_id: userId,
      thread_id: thread.id,
      role,
      content,
    }])
    .select()
    .single();

  if (error) console.error('Error creating workspace message:', error);

  if (!error) {
    await supabase
      .from('workspace_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', thread.id);
    await safeAudit('created_workspace_message', 'workspace_message', String(data.id), { role });
  }

  return data || null;
}

export async function getWorkspaceTasks(userId: string) {
  const { data, error } = await supabase
    .from('workspace_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching workspace tasks:', error);
  return data || [];
}

export async function createWorkspaceTask(userId: string, task: {
  title: string;
  details?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'done';
}) {
  const { data, error } = await supabase
    .from('workspace_tasks')
    .insert([{
      user_id: userId,
      title: task.title,
      details: task.details,
      priority: task.priority || 'medium',
      status: task.status || 'todo',
    }])
    .select()
    .single();

  if (error) console.error('Error creating workspace task:', error);
  if (!error) {
    await safeAudit('created_workspace_task', 'workspace_task', String(data.id), {
      priority: task.priority || 'medium',
      status: task.status || 'todo',
    });
  }
  return data || null;
}

export async function updateWorkspaceTask(taskId: string, updates: {
  title?: string;
  details?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'done';
}) {
  const { data, error } = await supabase
    .from('workspace_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) console.error('Error updating workspace task:', error);
  if (!error) {
    await safeAudit('updated_workspace_task', 'workspace_task', String(taskId), updates);
  }
  return data || null;
}

// ==================== REPORTS ====================

export async function createReport(reportData: {
  report_id: string;
  title: string;
  report_type: string;
  summary?: string;
  data?: any;
  generated_by: string;
  status?: string;
}) {
  const { data, error } = await supabase
    .from('reports')
    .insert([{ ...reportData, status: reportData.status || 'draft' }])
    .select();

  if (error) console.error('Error creating report:', error);
  if (!error && data?.[0]) {
    await safeAudit('created_report', 'report', data[0].report_id, {
      report_type: data[0].report_type,
      status: data[0].status,
    });
  }
  return data?.[0] || null;
}

export async function getReports(status?: string) {
  let query = supabase.from('reports').select('*');

  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) console.error('Error fetching reports:', error);
  return data || [];
}

export async function publishReport(reportId: string) {
  const { data, error } = await supabase
    .from('reports')
    .update({ status: 'published', published_at: new Date() })
    .eq('report_id', reportId)
    .select();

  if (error) console.error('Error publishing report:', error);
  if (!error && data?.[0]) {
    await safeAudit('published_report', 'report', reportId, {
      status: 'published',
    });
    const identity = await getCurrentUserIdentity();
    if (identity.id) {
      await createNotification(
        identity.id,
        'Report published',
        `${data[0].title} is now published.`,
        'report_published',
        undefined,
      );
    }
  }
  return data?.[0] || null;
}

export default supabase;
