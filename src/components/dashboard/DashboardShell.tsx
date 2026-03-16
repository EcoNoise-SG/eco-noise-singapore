'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./dashboard-shell.module.css";

const navigation = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    )
  },
  {
    href: "/dashboard/hotspots",
    label: "Hotspots",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
    )
  },
  {
    href: "/dashboard/forecasts",
    label: "Forecasts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
    )
  },
  {
    href: "/dashboard/complaints",
    label: "Complaints",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    )
  },
  {
    href: "/dashboard/operations",
    label: "Operations",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    )
  },
  {
    href: "/dashboard/data-sources",
    label: "Data Sources",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
    )
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><path d="M2 20h20" /></svg>
    )
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
    )
  },
  {
    href: "/dashboard/alerts",
    label: "Alerts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    )
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    )
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    )
  },
  {
    href: "/dashboard/maintenance",
    label: "Maintenance",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
    )
  },
  {
    href: "/dashboard/compliance",
    label: "Compliance",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>
    )
  },
  {
    href: "/dashboard/logs",
    label: "Logs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
    )
  },
  {
    href: "/dashboard/patrols",
    label: "Patrols",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    )
  },
  {
    href: "/dashboard/feedback-loop",
    label: "Feedback Loop",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
    )
  },
];

type ActivePoll = {
  is_active: boolean;
  question: string;
  option_1: string;
  option_2: string;
  votes_1: number;
  votes_2: number;
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady, logout, user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Rotating Advisories
  const [advisories] = useState([
    "📊 Weekly Report: 15% reduction in renovation noise complaints in Jurong.",
    "🎯 Goal Tracking: Resource pre-positioning coverage at 92% for Tampines Hub.",
    "⚡ Action Required: 2 upcoming construction permit starts in Woodlands tomorrow!"
  ]);
  const [currentAdvisory, setCurrentAdvisory] = useState(0);

  // Live Deterrence Wins (Ticker)
  const [wins] = useState([
    { id: '1', text: 'Staging unit in Sengkang deterred 3 noise violations! 🚀' },
    { id: '2', text: 'Targeted sweep in Bukit Merah resolved 5 long-standing complaints! 🎉' },
    { id: '3', text: 'Proactive patrol in Hougang prevented illegal dumping at site #34! ⚡' }
  ]);

  const [activePoll, setActivePoll] = useState<ActivePoll>({
    is_active: true,
    question: "What should be our next policy focus?",
    option_1: "Stricter Night Renovation",
    option_2: "Dumping Surcharge Review",
    votes_1: 142,
    votes_2: 89
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [stats] = useState({
    activeSensors: 142,
    pendingAlerts: 3
  });

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdvisory(prev => (prev + 1) % advisories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [advisories.length]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isReady, router]);

  const handleLogout = () => {
    logout();
    toast.success("Signing out...");
    router.replace('/login');
  };

  const userName = user?.name ?? "Command Officer";
  const userAgency = user?.agency ?? "NEA · Enforcement";
  const avatarLabel = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (loading || !isReady || !isAuthenticated) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <p>{isReady ? "Initializing operational workspace..." : "Restoring secure session..."}</p>
          <div className={styles.loadingLogoContainer}>
            <img src="/LOGO.svg" alt="EcoNoise SG Logo" style={{ height: '64px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <Toaster position="top-right" />

      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.logoContainer}>
            <img src="/LOGO.svg" alt="EcoNoise SG Logo" className={styles.logoImage} />
          </Link>
        </div>

        <nav className={styles.nav}>
          {navigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${pathname === link.href ? styles.navItemActive : ''}`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

      </aside>

      {/* Main Workspace */}
      <div className={styles.mainContent}>
        {/* Top Operational Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <span key={currentAdvisory} className={styles.animateFadeIn}>
              {advisories[currentAdvisory]}
            </span>
          </div>
          <div className={styles.bannerRight}>
            <a href="#main" className={styles.accessLink}>Skip to content</a>
            <div className={styles.divider}></div>
            <div className={styles.fontControls}>
              <button className={styles.fontBtn} title="Smaller Font" aria-label="Decrease font size">A-</button>
              <button className={styles.fontBtn} title="Reset Font" aria-label="Reset font size">A</button>
              <button className={styles.fontBtn} title="Larger Font" aria-label="Increase font size">A+</button>
            </div>
            <div className={styles.divider}></div>
            <select className={styles.langSelect} aria-label="Language">
              <option value="en">English</option>
              <option value="ml">Malay</option>
              <option value="zh">中文</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        </div>

        {/* Dynamic Deterrence Ticker */}
        <div className={styles.topTicker}>
          <div className={styles.tickerScrollTitle}>⚡ Deterrence Wins:</div>
          <div className={styles.tickerMarquee}>
            <div className={styles.tickerContent}>
              {wins.map((w, i) => (
                <span key={w.id || i}>{w.text} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;</span>
              ))}
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            {navigation.find(n => n.href === pathname)?.label || 'Intelligence Hub'}
          </div>

          <div className={styles.headerContent}>
            {/* Real-time Status Stats */}
            <div className={styles.statsBadge} title="Network Stats">
              <span>{stats.activeSensors} Sensors Online</span>
              <div className={styles.statsSeparator}></div>
              <span>{stats.pendingAlerts} High-Priority Alerts</span>
            </div>

            {/* Smart Search */}
            <div className={styles.searchContainer}>
              {isSearchOpen && (
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Query sensor, site, or planning area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              )}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={styles.iconBtn}
                aria-label="Toggle search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
            </div>

            {/* Notification Center */}
            <div style={{ position: 'relative' }}>
              <button
                className={`${styles.iconBtn} ${styles.notificationBtn}`}
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                aria-label="Toggle notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                <span className={styles.notificationBadge}>3</span>
              </button>

              {isNotificationOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notifHeader}>
                    <h4>Notifications</h4>
                  </div>
                  <div className={styles.notifList}>
                    <div className={styles.notifItem}>
                      <div className={styles.notifIcon} style={{ background: '#f0fdf4', color: '#166534' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      </div>
                      <div className={styles.notifText}>
                        <h5>Successful Deterrence</h5>
                        <p>Acoustic threshold maintained in Sengkang after staging unit 12 arrival.</p>
                      </div>
                    </div>
                    <div className={styles.notifItem}>
                      <div className={styles.notifIcon} style={{ background: '#fef2f2', color: '#991b1b' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      </div>
                      <div className={styles.notifText}>
                        <h5>Alert Escalation</h5>
                        <p>Noise trend in Woodlands exceeds weekend threshold by 25dB.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Officer Profile */}
            <div className={styles.userProfile}>
              <div className={styles.avatar}>{avatarLabel || "CO"}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userAgency}>{userAgency}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`${styles.iconBtn} ${styles.logoutBtn}`}
              aria-label="Log out"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </header>

        {/* Global Key Metrics Ribbon */}
        <div className={styles.ribbon}>
          <div className={styles.ribbonCard}>
            <p>National Compliant Index</p>
            <strong>82.4% Optimal</strong>
          </div>
          <div className={styles.ribbonCard}>
            <p>Active Staging Units</p>
            <strong>12/15 Deployed</strong>
          </div>
          <div className={styles.ribbonCard}>
            <p>Avg. Forecast Confidence</p>
            <strong>88.2% Accurate</strong>
          </div>
        </div>

        {/* Primary Page Workflow */}
        <main className={styles.contentArea} id="main">
          {children}
        </main>
      </div>

      {/* Active Strategy Poll */}
      {activePoll.is_active && (
        <div className={styles.pollPopup}>
          <div className={styles.pollHeader}>
            <h4>Operational Poll</h4>
            <button className={styles.closeBtn} onClick={() => setActivePoll({ ...activePoll, is_active: false })} aria-label="Close poll">✕</button>
          </div>
          <p className={styles.pollQuestion}>{activePoll.question}</p>
          <div className={styles.pollOptions}>
            <button className={styles.pollOptionBtn} onClick={() => toast.success('Preference Recorded')}>
              <span>{activePoll.option_1}</span>
              <strong>{activePoll.votes_1}</strong>
            </button>
            <button className={styles.pollOptionBtn} onClick={() => toast.success('Preference Recorded')}>
              <span>{activePoll.option_2}</span>
              <strong>{activePoll.votes_2}</strong>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
