'use client';

import { useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import styles from "../dashboard.module.css";

const users = [
  { id: "USR-001", name: "Cpt. Ravi Kumar", role: "Senior Enforcement Officer", agency: "NEA · Enforcement West", status: "active", lastLogin: "Today, 09:14", area: "Jurong West, Clementi" },
  { id: "USR-002", name: "Insp. Sarah Lim", role: "Operations Lead", agency: "NEA · HQ Operations", status: "active", lastLogin: "Today, 08:47", area: "All Areas" },
  { id: "USR-003", name: "Daniel Tan", role: "Data Intelligence Analyst", agency: "NEA · Data Science Unit", status: "active", lastLogin: "Yesterday, 14:22", area: "Model Management" },
  { id: "USR-004", name: "Fiona Ng", role: "TC Liaison Officer", agency: "Jurong-Clementi TC", status: "active", lastLogin: "Yesterday, 11:05", area: "Jurong West" },
  { id: "USR-005", name: "Marcus Chia", role: "Field Inspector", agency: "NEA · Enforcement North", status: "active", lastLogin: "2 days ago", area: "Woodlands, Yishun" },
  { id: "USR-006", name: "Priya Nair", role: "Environmental Health Officer", agency: "NEA · Enforcement East", status: "inactive", lastLogin: "5 days ago", area: "Tampines, Pasir Ris" },
  { id: "USR-007", name: "Loh Wei Ming", role: "System Administrator", agency: "GovTech · NEA Platform", status: "active", lastLogin: "Today, 07:30", area: "Platform Admin" },
  { id: "USR-008", name: "Aigerim Bekova", role: "Policy Analyst", agency: "MND · Environmental Policy", status: "active", lastLogin: "3 days ago", area: "Read-only Access" },
];

const roleColors: Record<string, { bg: string; color: string }> = {
  "Senior Enforcement Officer": { bg: "#fef2f2", color: "#991b1b" },
  "Operations Lead": { bg: "#eff6ff", color: "#1d4ed8" },
  "Data Intelligence Analyst": { bg: "#faf5ff", color: "#7c3aed" },
  "TC Liaison Officer": { bg: "#f0fdf4", color: "#166534" },
  "Field Inspector": { bg: "#fffbeb", color: "#b45309" },
  "Environmental Health Officer": { bg: "#f0fdf4", color: "#166534" },
  "System Administrator": { bg: "#f8fafc", color: "#475569" },
  "Policy Analyst": { bg: "#eff6ff", color: "#1d4ed8" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.agency.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.status === "active").length;

  return (
    <div className={styles.stack}>
      <div className={styles.gridThree}>
        <div className={styles.metricCard}>
          <p>Total Users</p>
          <strong>{users.length}</strong>
          <span className={styles.metaLabel}>Registered in system</span>
        </div>
        <div className={styles.metricCard}>
          <p>Active Sessions</p>
          <strong className={styles.positive}>{activeCount}</strong>
          <span className={styles.metaLabel}>Users active this week</span>
        </div>
        <div className={styles.metricCard}>
          <p>Agencies Connected</p>
          <strong>5</strong>
          <span className={styles.metaLabel}>NEA, TC, GovTech, MND, LTA</span>
        </div>
      </div>

      <DashboardSection
        eyebrow="Access management"
        title="Registered platform users and agency roles"
      >
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search by name, role, or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: "50px",
              border: "1px solid #e2e8f0",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              width: "100%",
              outline: "none",
              background: "#f8fafc",
              maxWidth: "400px",
            }}
          />
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Agency</th>
                <th>Area Access</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "#5925dc", color: "white", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.name.split(" ").filter(Boolean).slice(-2).map((p) => p[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{u.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: roleColors[u.role]?.bg ?? "#f1f5f9",
                      color: roleColors[u.role]?.color ?? "#475569",
                      padding: "3px 8px", borderRadius: "4px",
                      fontSize: "0.6875rem", fontWeight: 700,
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{u.agency}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{u.area}</td>
                  <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{u.lastLogin}</td>
                  <td>
                    <span style={{
                      color: u.status === "active" ? "#22c55e" : "#94a3b8",
                      fontWeight: 700, fontSize: "0.75rem",
                    }}>
                      ● {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <div className={styles.gridTwo}>
        <DashboardSection eyebrow="Access control" title="Permission levels">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>Command Access:</strong> Full read + action rights. NEA HQ, Ops Leads.</li>
              <li><strong>Field Enforcement:</strong> View hotspots, log outcomes, receive alerts.</li>
              <li><strong>TC Liaison:</strong> Read-only dashboards for assigned planning areas.</li>
              <li><strong>Analyst:</strong> Full data + model management. No field action rights.</li>
              <li><strong>Read-only:</strong> MND / policy stakeholders. Summary views only.</li>
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection eyebrow="Agency breakdown" title="Connected organisations">
          <div className={styles.listCard}>
            <ul className={styles.list}>
              <li><strong>NEA Enforcement</strong> — 5 officers (3 West, 1 North, 1 East)</li>
              <li><strong>NEA HQ / Data Science</strong> — 2 users (Ops Lead, Analyst)</li>
              <li><strong>Town Councils</strong> — 1 liaison (Jurong-Clementi TC)</li>
              <li><strong>GovTech</strong> — 1 platform admin</li>
              <li><strong>MND Policy</strong> — 1 read-only user</li>
            </ul>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
