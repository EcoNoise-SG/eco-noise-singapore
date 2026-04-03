/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://apjomfculzncvglxuegt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Unsubscribe = { unsubscribe: () => void };

function getDemoUserFromStorage() {
  if (typeof window === 'undefined') return null;

  const storedUser = window.localStorage.getItem('mockAuthUser');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as { id?: string; email?: string };
  } catch {
    return null;
  }
}

export async function getCurrentUserIdentity() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      id: user.id,
      email: user.email || '',
      isDemo: false,
    };
  }

  const demoUser = getDemoUserFromStorage();

  return {
    id: demoUser?.id || '00000000-0000-0000-0000-000000000001',
    email: demoUser?.email || 'demo@econoise.sg',
    isDemo: true,
  };
}

async function safeAudit(action: string, resourceType?: string, resourceId?: string, details?: any) {
  try {
    const identity = await getCurrentUserIdentity();
    await logAudit(identity.id, action, resourceType, resourceId, details);
  } catch (error) {
    console.error('Error writing audit log:', error);
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
  return subscribeToTable('audit-logs-live', 'audit_logs', onChange);
}

export function subscribeToReports(onChange: () => void): Unsubscribe {
  return subscribeToTable('reports-live', 'reports', onChange);
}

export function subscribeToUserPreferences(onChange: () => void): Unsubscribe {
  return subscribeToTable('user-preferences-live', 'user_preferences', onChange);
}

export async function getOperationalPollState(pollId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', 'poll')
    .eq('resource_id', pollId)
    .eq('action', 'operational_poll_vote')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching operational poll state:', error);
    return { votes: { option1: 0, option2: 0 }, total: 0 };
  }

  const votes = (data || []).reduce(
    (acc, entry: any) => {
      const choice = entry.details?.choice;
      if (choice === 'option_1') acc.option1 += 1;
      if (choice === 'option_2') acc.option2 += 1;
      return acc;
    },
    { option1: 0, option2: 0 },
  );

  return {
    votes,
    total: votes.option1 + votes.option2,
  };
}

export async function submitOperationalPollVote(
  pollId: string,
  choice: 'option_1' | 'option_2',
  metadata?: Record<string, unknown>,
) {
  const identity = await getCurrentUserIdentity();
  await logAudit(identity.id, 'operational_poll_vote', 'poll', pollId, {
    choice,
    ...metadata,
  });
  return true;
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
    if (!identity.isDemo) {
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
    if (!identity.isDemo) {
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
  const { data, error } = await supabase
    .from('audit_logs')
    .insert([{
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    }]);

  if (error) console.error('Error logging audit:', error);
  return !!data;
}

export async function getAuditLogs(userId?: string, limit = 100) {
  let query = supabase.from('audit_logs').select('*');

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) console.error('Error fetching audit logs:', error);
  return data || [];
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
    errorMessage.toLowerCase().includes('0 rows') ||
    errorMessage.toLowerCase().includes('no rows');

  if (error && !isBenignPreferenceError) console.error('Error updating preferences:', error);
  if (!error) {
    await safeAudit('updated_preferences', 'user_preferences', userId, preferences);
  }
  return !error;
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
    if (!identity.isDemo) {
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

