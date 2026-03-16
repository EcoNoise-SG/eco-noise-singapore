'use client';

import { useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";
import settingsStyles from "./settings.module.css";

export default function SettingsPage() {
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState("high");
  const [forecastZone, setForecastZone] = useState("all");
  const [dataDays, setDataDays] = useState("14");

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>System Version</p>
          <strong>v2.4.1</strong>
          <span className={styles.metaLabel}>Last updated: 15 Mar 2024</span>
        </div>
        <div className={styles.metricCard}>
          <p>Data Retention</p>
          <strong>36 months</strong>
          <span className={styles.metaLabel}>Historical complaint data</span>
        </div>
        <div className={styles.metricCard}>
          <p>Model Retraining</p>
          <strong>Monthly</strong>
          <span className={styles.metaLabel}>Next: 1 Apr 2024</span>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Notifications" title="Alert and report notification preferences">
          <div className={styles.listCard}>
            <div className={settingsStyles.settingRow}>
              <div>
                <strong>Email Notifications</strong>
                <p>Receive operational alerts and reports by email</p>
              </div>
              <button
                className={`${settingsStyles.toggle} ${notifEmail ? settingsStyles.toggleOn : ""}`}
                onClick={() => setNotifEmail(!notifEmail)}
                aria-label="Toggle email notifications"
              >
                <span className={settingsStyles.toggleKnob} />
              </button>
            </div>
            <div className={settingsStyles.settingRow}>
              <div>
                <strong>SMS Alerts (Critical Only)</strong>
                <p>Receive SMS for critical sensor or anomaly alerts</p>
              </div>
              <button
                className={`${settingsStyles.toggle} ${notifSms ? settingsStyles.toggleOn : ""}`}
                onClick={() => setNotifSms(!notifSms)}
                aria-label="Toggle SMS alerts"
              >
                <span className={settingsStyles.toggleKnob} />
              </button>
            </div>
            <div className={settingsStyles.settingRow}>
              <div>
                <strong>Critical System Alerts</strong>
                <p>Sensor outages, model failures, and data pipeline errors</p>
              </div>
              <button
                className={`${settingsStyles.toggle} ${notifCritical ? settingsStyles.toggleOn : ""}`}
                onClick={() => setNotifCritical(!notifCritical)}
                aria-label="Toggle critical alerts"
              >
                <span className={settingsStyles.toggleKnob} />
              </button>
            </div>
            <div className={settingsStyles.settingRow}>
              <div>
                <strong>Weekly Intelligence Brief</strong>
                <p>Auto-email weekly report every Sunday at 08:00</p>
              </div>
              <button
                className={`${settingsStyles.toggle} ${notifWeekly ? settingsStyles.toggleOn : ""}`}
                onClick={() => setNotifWeekly(!notifWeekly)}
                aria-label="Toggle weekly brief"
              >
                <span className={settingsStyles.toggleKnob} />
              </button>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Dashboard preferences" title="Forecast and display settings">
          <div className={styles.listCard}>
            <div className={settingsStyles.settingField}>
              <label>Minimum alert severity to display</label>
              <select
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
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
                onChange={(e) => setForecastZone(e.target.value)}
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
                onChange={(e) => setDataDays(e.target.value)}
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

      <DashboardSection eyebrow="System information" title="Platform and data governance details">
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <tbody>
              {[
                ["Platform", "EcoNoise Intelligence Hub v2.4.1"],
                ["ML Framework", "PyTorch 2.2 + Temporal Fusion Transformer (TFT)"],
                ["Data Pipeline", "Apache Kafka + Spark Streaming (GovTech Cloud)"],
                ["Deployment Environment", "GovTech Singapore Cloud (GCC) — Restricted zone"],
                ["Data Classification", "OFFICIAL (CLOSED) — Protected under PDPA"],
                ["Audit Logging", "Enabled — 365 day retention"],
                ["Last Model Retrain", "1 Mar 2024 — 88.2% ensemble accuracy achieved"],
                ["IoT Protocol", "MQTT over TLS 1.3 — 142/152 nodes active"],
              ].map(([key, val]) => (
                <tr key={key}>
                  <td style={{ fontWeight: 600, color: "#0f172a", width: "220px" }}>{key}</td>
                  <td style={{ color: "#475569" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
