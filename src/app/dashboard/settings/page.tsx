'use client';

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import settingsStyles from "./settings.module.css";
import {
  getCurrentUserIdentity,
  getUserPreferences,
  subscribeToUserPreferences,
  updateUserPreferences,
} from "@/lib/supabase";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState("high");
  const [forecastZone, setForecastZone] = useState("all");
  const [dataDays, setDataDays] = useState("14");
  const [language, setLanguage] = useState("en");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("Waiting for sync");
  const notificationItems = [
    {
      label: "Email Notifications",
      value: notifEmail,
      setValue: setNotifEmail,
      description: "Receive operational alerts and reports by email",
      key: "notifEmail",
    },
    {
      label: "SMS Alerts (Critical Only)",
      value: notifSms,
      setValue: setNotifSms,
      description: "Receive SMS for critical sensor or anomaly alerts",
      key: "notifSms",
    },
    {
      label: "Critical System Alerts",
      value: notifCritical,
      setValue: setNotifCritical,
      description: "Sensor outages, model failures, and data pipeline errors",
      key: "notifCritical",
    },
    {
      label: "Weekly Intelligence Brief",
      value: notifWeekly,
      setValue: setNotifWeekly,
      description: "Auto-email weekly report every Sunday at 08:00",
      key: "notifWeekly",
    },
  ];

  useEffect(() => {
    async function loadPreferences() {
      const identity = await getCurrentUserIdentity();
      if (!identity.id) return;
      const preferences = await getUserPreferences(identity.id);
      if (!preferences) return;

      setNotifEmail(preferences.notification_settings?.email ?? true);
      setNotifSms(preferences.notification_settings?.sms ?? false);
      setNotifCritical(preferences.notification_settings?.critical ?? true);
      setNotifWeekly(preferences.notification_settings?.weekly ?? true);
      setAlertThreshold(preferences.notification_settings?.alertThreshold || "high");
      setForecastZone(preferences.notification_settings?.forecastZone || "all");
      setDataDays(preferences.notification_settings?.dataDays || "14");
      setLanguage(preferences.language || "en");
      setLastSyncedAt(preferences.updated_at ? new Date(preferences.updated_at).toLocaleString() : "Live");
    }

    void loadPreferences();
    let unsubscribe: () => void = () => {};
    void getCurrentUserIdentity().then((identity) => {
      if (!identity.id) return;
      unsubscribe = subscribeToUserPreferences(identity.id, () => {
        void loadPreferences();
      }).unsubscribe;
    });

    return () => unsubscribe();
  }, []);

  const persistPreferences = async (overrides: Record<string, unknown> = {}) => {
    try {
      const identity = await getCurrentUserIdentity();
      await updateUserPreferences(identity.id, {
        dashboard_theme: "light",
        notification_settings: {
          email: overrides.notifEmail ?? notifEmail,
          sms: overrides.notifSms ?? notifSms,
          critical: overrides.notifCritical ?? notifCritical,
          weekly: overrides.notifWeekly ?? notifWeekly,
          alertThreshold: overrides.alertThreshold ?? alertThreshold,
          forecastZone: overrides.forecastZone ?? forecastZone,
          dataDays: overrides.dataDays ?? dataDays,
        },
        language: String(overrides.language ?? language),
      });
      toast.success("Preferences saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Preference Sync</p>
          <strong>{lastSyncedAt === "Waiting for sync" ? "Pending" : "Live"}</strong>
          <span className={styles.metaLabel}>Last sync: {lastSyncedAt}</span>
        </div>
        <div className={styles.metricCard}>
          <p>Active Language</p>
          <strong>{language.toUpperCase()}</strong>
          <span className={styles.metaLabel}>Current shell preference</span>
        </div>
        <div className={styles.metricCard}>
          <p>Alert Threshold</p>
          <strong>{alertThreshold}</strong>
          <span className={styles.metaLabel}>Forecast zone: {forecastZone} · data window: {dataDays} days</span>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Notifications" title="Alert and report notification preferences">
          <div className={styles.listCard}>
            {notificationItems.map((item) => (
              <div className={settingsStyles.settingRow} key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
                <button
                  className={`${settingsStyles.toggle} ${item.value ? settingsStyles.toggleOn : ""}`}
                  onClick={() => {
                    const nextValue = !item.value;
                    item.setValue(nextValue);
                    void persistPreferences({ [item.key]: nextValue });
                  }}
                  aria-label={`Toggle ${item.label}`}
                >
                  <span className={settingsStyles.toggleKnob} />
                </button>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Dashboard preferences" title="Forecast and display settings">
          <div className={styles.listCard}>
            <div className={settingsStyles.settingField}>
              <label>Minimum alert severity to display</label>
              <select
                value={alertThreshold}
                onChange={(e) => {
                  setAlertThreshold(e.target.value);
                  void persistPreferences({ alertThreshold: e.target.value });
                }}
                className={settingsStyles.select}
              >
                <option value="critical">Critical only</option>
                <option value="high">High and above</option>
                <option value="medium">Medium and above</option>
                <option value="low">All alerts</option>
              </select>
            </div>

            <div className={settingsStyles.settingField}>
              <label>Default forecast zone</label>
              <select
                value={forecastZone}
                onChange={(e) => {
                  setForecastZone(e.target.value);
                  void persistPreferences({ forecastZone: e.target.value });
                }}
                className={settingsStyles.select}
              >
                <option value="all">All planning areas</option>
                <option value="jurong">Jurong West</option>
                <option value="woodlands">Woodlands</option>
                <option value="tampines">Tampines</option>
                <option value="bukit-merah">Bukit Merah</option>
              </select>
            </div>

            <div className={settingsStyles.settingField}>
              <label>Historical data window (days)</label>
              <select
                value={dataDays}
                onChange={(e) => {
                  setDataDays(e.target.value);
                  void persistPreferences({ dataDays: e.target.value });
                }}
                className={settingsStyles.select}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
