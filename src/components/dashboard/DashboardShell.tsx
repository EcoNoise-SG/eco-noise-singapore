'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./dashboard-shell.module.css";
import WorkspaceDock from "./WorkspaceDock";
import { DashboardI18nProvider } from "./DashboardI18n";
import {
  getCurrentUserIdentity,
  getInterventions,
  getOperationalActivity,
  getReports,
  getRiskAlerts,
  getUserPreferences,
  getUserNotifications,
  markNotificationAsRead,
  subscribeToOperationalActivity,
  subscribeToInterventions,
  subscribeToNotifications,
  subscribeToReports,
  subscribeToRiskAlerts,
  subscribeToUserPreferences,
  updateUserPreferences,
} from "@/lib/supabase";
import { fetchNEADengueClusters } from "@/lib/datagovsg";

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
    label: "Construction Risk Hotspots",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
    )
  },
  {
    href: "/dashboard/forecasts",
    label: "Injury Risk Forecasts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
    )
  },
  {
    href: "/dashboard/complaints",
    label: "Fall from Height Alerts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    )
  },
  {
    href: "/dashboard/operations",
    label: "Machinery Incidents",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    )
  },
  {
    href: "/dashboard/compliance",
    label: "Contractor Safety Track",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
    )
  },
  {
    href: "/dashboard/analytics",
    label: "Dormitory Wellness",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
    )
  },
  {
    href: "/dashboard/heat-stress",
    label: "Heat Stress Index",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>
    )
  },
  {
    href: "/dashboard/alerts",
    label: "Disease Outbreak Warnings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /><path d="M4 2C2.8 3.7 2 5.7 2 8" /><path d="M22 8c0-2.3-.8-4.3-2-6" /></svg>
    )
  },
  {
    href: "/dashboard/patrols",
    label: "DTS Prioritization",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
    )
  },
  {
    href: "/dashboard/reports",
    label: "Salary Non-Payment Alerts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="16" y2="17" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="8" y1="15" x2="8" y2="17" /></svg>
    )
  },
  {
    href: "/dashboard/users",
    label: "Mental Health Risk Index",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
    )
  },
  {
    href: "/dashboard/logs",
    label: "Activity Logs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
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
    href: "/dashboard/feedback-loop",
    label: "Feedback Loop",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
    )
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
    )
  },
];

const navigationTranslations: Record<string, Record<string, string>> = {
  ml: {
    "Overview": "Gambaran Keseluruhan",
    "Construction Risk Hotspots": "Titik Panas Risiko Pembinaan",
    "Injury Risk Forecasts": "Ramalan Risiko Kecederaan",
    "Fall from Height Alerts": "Amaran Jatuh Dari Tempat Tinggi",
    "Machinery Incidents": "Insiden Jentera",
    "Contractor Safety Track": "Jejak Keselamatan Kontraktor",
    "Dormitory Wellness": "Kesejahteraan Asrama",
    "Heat Stress Index": "Indeks Tekanan Haba",
    "Disease Outbreak Warnings": "Amaran Wabak Penyakit",
    "DTS Prioritization": "Keutamaan DTS",
    "Salary Non-Payment Alerts": "Amaran Gaji Tidak Dibayar",
    "Mental Health Risk Index": "Indeks Risiko Kesihatan Mental",
    "Activity Logs": "Log Aktiviti",
    "Data Sources": "Sumber Data",
    "Feedback Loop": "Gelung Maklum Balas",
    "Settings": "Tetapan",
  },
  zh: {
    "Overview": "概览",
    "Construction Risk Hotspots": "施工风险热点",
    "Injury Risk Forecasts": "伤害风险预测",
    "Fall from Height Alerts": "高处坠落警报",
    "Machinery Incidents": "机械事故",
    "Contractor Safety Track": "承包商安全追踪",
    "Dormitory Wellness": "宿舍健康",
    "Heat Stress Index": "热应激指数",
    "Disease Outbreak Warnings": "疾病暴发预警",
    "DTS Prioritization": "DTS 优先级",
    "Salary Non-Payment Alerts": "欠薪预警",
    "Mental Health Risk Index": "心理健康风险指数",
    "Activity Logs": "活动日志",
    "Data Sources": "数据源",
    "Feedback Loop": "反馈回路",
    "Settings": "设置",
  },
  ta: {
    "Overview": "மேலோட்டம்",
    "Construction Risk Hotspots": "கட்டுமான ஆபத்து மையங்கள்",
    "Injury Risk Forecasts": "காய அபாய முன்கணிப்புகள்",
    "Fall from Height Alerts": "உயரத்தில் இருந்து விழும் எச்சரிக்கைகள்",
    "Machinery Incidents": "இயந்திர சம்பவங்கள்",
    "Contractor Safety Track": "ஒப்பந்ததாரர் பாதுகாப்பு கண்காணிப்பு",
    "Dormitory Wellness": "விடுதி நலன்",
    "Heat Stress Index": "வெப்ப அழுத்த குறியீடு",
    "Disease Outbreak Warnings": "நோய் பரவல் எச்சரிக்கைகள்",
    "DTS Prioritization": "DTS முன்னுரிமை",
    "Salary Non-Payment Alerts": "சம்பள செலுத்தாமை எச்சரிக்கைகள்",
    "Mental Health Risk Index": "மனநல ஆபத்து குறியீடு",
    "Activity Logs": "செயல் பதிவுகள்",
    "Data Sources": "தரவு மூலங்கள்",
    "Feedback Loop": "பின்னூட்ட வட்டு",
    "Settings": "அமைப்புகள்",
  },
};

const translations: Record<string, Record<string, string>> = {
  en: {
    noNotifications: "No notifications yet",
    newAlerts: "New alerts and workflow updates will appear here.",
    notifications: "Notifications",
    quickNavigate: "Quick Navigate",
    searchPlaceholder: "Query sensor, site, or planning area...",
    liveZones: "Live Zones Online",
    highPriorityAlerts: "High-Priority Alerts",
    preferenceRecorded: "Preference recorded",
    skip: "Skip to content",
    activeResolution: "National Active Resolution",
    activeStaging: "Active Staging Units",
    reports: "Operational Reports",
  },
  ml: {
    noNotifications: "Tiada notifikasi lagi",
    newAlerts: "Amaran baharu dan kemas kini aliran kerja akan muncul di sini.",
    notifications: "Notifikasi",
    quickNavigate: "Navigasi Pantas",
    searchPlaceholder: "Cari sensor, tapak, atau kawasan perancangan...",
    liveZones: "Zon Langsung Online",
    highPriorityAlerts: "Amaran Keutamaan Tinggi",
    preferenceRecorded: "Pilihan direkodkan",
    skip: "Langkau ke kandungan",
    activeResolution: "Resolusi Aktif Nasional",
    activeStaging: "Unit Pementasan Aktif",
    reports: "Laporan Operasi",
  },
  zh: {
    noNotifications: "暂无通知",
    newAlerts: "新的警报和流程更新会显示在这里。",
    notifications: "通知",
    quickNavigate: "快速导航",
    searchPlaceholder: "搜索传感器、站点或规划区域...",
    liveZones: "在线实时区域",
    highPriorityAlerts: "高优先级警报",
    preferenceRecorded: "已记录选择",
    skip: "跳到内容",
    activeResolution: "全国活跃处置",
    activeStaging: "活跃部署单元",
    reports: "运行报告",
  },
  ta: {
    noNotifications: "அறிவிப்புகள் இல்லை",
    newAlerts: "புதிய எச்சரிக்கைகள் மற்றும் பணிச்சுற்று புதுப்பிப்புகள் இங்கே தோன்றும்.",
    notifications: "அறிவிப்புகள்",
    quickNavigate: "விரைவு வழிசெலுத்தல்",
    searchPlaceholder: "சென்சார், தளம், அல்லது திட்டப்பகுதியை தேடுங்கள்...",
    liveZones: "நேரடி மண்டலங்கள் ஆன்லைனில்",
    highPriorityAlerts: "உயர் முன்னுரிமை எச்சரிக்கைகள்",
    preferenceRecorded: "தேர்வு பதிவு செய்யப்பட்டது",
    skip: "உள்ளடக்கத்திற்குச் செல்லவும்",
    activeResolution: "தேசிய செயலில் தீர்வு",
    activeStaging: "செயலில் உள்ள தளப்படுத்தல் அணிகள்",
    reports: "செயற்பாட்டு அறிக்கைகள்",
    workspace: "வேலைப்பகுதி",
  },
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady, logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [advisories, setAdvisories] = useState<string[]>([]);
  const [currentAdvisory, setCurrentAdvisory] = useState(0);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [fontScale, setFontScale] = useState(1);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [stats, setStats] = useState({
    activeSensors: 0,
    pendingAlerts: 3
  });
  const [ribbonStats, setRibbonStats] = useState({
    compliance: "0 live alerts",
    staging: "0 active units",
    confidence: "0 reports",
  });
  const t = (key: keyof typeof translations.en) => translations[language]?.[key] || translations.en[key];
  const navLabel = (label: string) => navigationTranslations[language]?.[label] || label;

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontScale]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdvisory(prev => (advisories.length ? (prev + 1) % advisories.length : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, [advisories.length]);

  useEffect(() => {
    let preferencesSubscription: { unsubscribe: () => void } = { unsubscribe: () => undefined };

    async function loadLiveHeaderData() {
      const [identity, alerts, interventions, reports, activity, domainIntelResponse, dengueData] = await Promise.all([
        getCurrentUserIdentity(),
        getRiskAlerts(),
        getInterventions(),
        getReports(),
        getOperationalActivity(6),
        fetch("/api/model/domain-intel").catch(() => null),
        fetchNEADengueClusters().catch(() => null),
      ]);
      const domainIntel = domainIntelResponse && domainIntelResponse.ok ? await domainIntelResponse.json() : null;
      const dengueCount = (dengueData?.records || []).length;
      const criticalDengue = (dengueData?.records || []).filter((r: any) => {
        const cases = parseInt(r.properties?.CASE_SIZE || r.properties?.case_size || r.case_size) || 0;
        return cases > 25;
      }).length;
      const highDengue = dengueCount - criticalDengue;
      const userNotifications = identity.id ? await getUserNotifications(identity.id) : [];
      const preferences = identity.id ? await getUserPreferences(identity.id) : null;
      const liveAlerts = alerts.filter((alert: any) => ['open', 'active', 'acknowledged'].includes(alert.status));
      const activeInterventions = interventions.filter((item: any) => item.outcome !== 'Completed');
      const highPriorityAlerts = liveAlerts.filter((alert: any) => ['High', 'Critical'].includes(alert.risk_level));
      const activeZones = new Set([
        ...liveAlerts.map((alert: any) => String(alert.location || 'Unknown')),
        ...activeInterventions.map((item: any) => String(item.location || 'Unknown')),
      ]);

      setNotifications(userNotifications);
      if (preferences?.language) {
        setLanguage(preferences.language);
      }
      setStats({
        activeSensors: activeZones.size,
        pendingAlerts: highPriorityAlerts.length,
      });
      setRibbonStats({
        compliance: pathname === '/dashboard/alerts'
          ? `${liveAlerts.filter((a: any) => a.risk_level === 'Critical').length + criticalDengue} critical alerts`
          : `${alerts.filter((alert: any) => alert.status === 'resolved').length} resolved signals`,
        staging: pathname === '/dashboard/alerts'
          ? `${liveAlerts.filter((a: any) => a.risk_level === 'High').length + highDengue} high priority`
          : `${activeInterventions.length}/${Math.max(interventions.length, 1)} active units`,
        confidence: pathname === '/dashboard/alerts'
          ? `${liveAlerts.length + dengueCount} pending alerts`
          : `${reports.length} reports in archive`,
      });
      const liveAdvisories = [
        ...activity
          .filter((item: any) => item.resource_type && item.action)
          .slice(0, 4)
          .map((item: any) => `${item.action.replace(/_/g, " ")} · ${item.resource_type}${item.resource_id ? ` ${item.resource_id}` : ""}`),
        ...liveAlerts.slice(0, 2).map((alert: any) =>
          `${alert.component} ${alert.risk_level} alert in ${alert.location} (${alert.risk_score}/100)`,
        ),
        ...(domainIntel
          ? [
              `${domainIntel.construction.activeProjects} BCA project records active · ${domainIntel.construction.topProjectTypes.slice(0, 2).join(", ") || "project mix syncing"}`,
              `${domainIntel.dormitories.indexedRecords} HDB baseline records indexed · ${domainIntel.health.datasetCount} MOH datasets available`,
            ]
          : []),
      ].filter(Boolean);
      setAdvisories(liveAdvisories.length ? liveAdvisories : ["Realtime operational feed healthy."]);

      if (identity.id) {
        preferencesSubscription.unsubscribe();
        preferencesSubscription = subscribeToUserPreferences(identity.id, () => {
          void loadLiveHeaderData();
        });
      }
    }

    void loadLiveHeaderData();

    const alertsSubscription = subscribeToRiskAlerts(() => {
      void loadLiveHeaderData();
    });
    const interventionsSubscription = subscribeToInterventions(() => {
      void loadLiveHeaderData();
    });
    const notificationsSubscription = subscribeToNotifications(() => {
      void loadLiveHeaderData();
    });
    const reportsSubscription = subscribeToReports(() => {
      void loadLiveHeaderData();
    });
    const activitySubscription = subscribeToOperationalActivity(() => {
      void loadLiveHeaderData();
    });
    return () => {
      alertsSubscription.unsubscribe();
      interventionsSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
      reportsSubscription.unsubscribe();
      activitySubscription.unsubscribe();
      preferencesSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function persistLanguagePreference() {
      const identity = await getCurrentUserIdentity();
      if (!identity.id) return;
      await updateUserPreferences(identity.id, { language });
    }

    if (isReady && isAuthenticated) {
      void persistLanguagePreference();
    }
  }, [isAuthenticated, isReady, language]);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

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

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Command Officer";
  const userAgency = user?.user_metadata?.agency || (user?.email?.includes('gov') ? "NEA · Enforcement" : "EcoNoise SG Pilot");

  const avatarLabel = userName
    .split(/[\s.@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");

  const filteredNavigation = navigation.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Page title metadata - Available for future use in breadcrumb or header context


  if (loading || !isReady || !isAuthenticated) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <p>{isReady ? "Initializing operational workspace..." : "Restoring secure session..."}</p>
          <div className={styles.loadingLogoContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO.svg" alt="EcoNoise SG Logo" className={styles.logoImage} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <Toaster position="top-right" />

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? '' : styles.sidebarCollapsed}`}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.logoContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
              {navLabel(link.label)}
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
              {advisories[currentAdvisory] || "Realtime operational feed healthy."}
            </span>
          </div>
          <div className={styles.bannerRight}>
            <a href="#main" className={styles.accessLink}>{t('skip')}</a>
            <div className={styles.divider}></div>
            <div className={styles.fontControls}>
              <button className={styles.fontBtn} title="Smaller Font" aria-label="Decrease font size" onClick={() => setFontScale((value) => Math.max(0.9, Number((value - 0.05).toFixed(2))))}>A-</button>
              <button className={styles.fontBtn} title="Reset Font" aria-label="Reset font size" onClick={() => setFontScale(1)}>A</button>
              <button className={styles.fontBtn} title="Larger Font" aria-label="Increase font size" onClick={() => setFontScale((value) => Math.min(1.15, Number((value + 0.05).toFixed(2))))}>A+</button>
            </div>
            <div className={styles.divider}></div>
            <select className={styles.langSelect} aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="en">English</option>
              <option value="ml">Malay</option>
              <option value="zh">中文</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        </div>

        {/* Global Toolbar */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={styles.menuToggleBtn}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="16" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
            <div className={styles.headerTitle}>
              {navLabel(navigation.find(n => n.href === pathname)?.label || 'Intelligence Hub')}
            </div>
          </div>

          <div className={styles.headerContent}>
            {/* Real-time Status Stats */}
            <div className={styles.statsBadge} title="Network Stats">
              <span>{stats.activeSensors} {t('liveZones')}</span>
              <div className={styles.statsSeparator}></div>
              <span>{stats.pendingAlerts} {t('highPriorityAlerts')}</span>
            </div>

            {/* Smart Search */}
            <div className={styles.searchContainer}>
              {isSearchOpen && (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <div className={styles.notificationDropdown} style={{ right: 0, top: "calc(100% + 8px)", width: "280px" }}>
                      <div className={styles.notifHeader}>
                        <h4>{t('quickNavigate')}</h4>
                      </div>
                      <div className={styles.notifList}>
                        {filteredNavigation.slice(0, 5).map((item) => (
                          <button
                            key={item.href}
                            className={styles.notifItem}
                            onClick={() => {
                              router.push(item.href);
                              setSearchQuery('');
                              setIsSearchOpen(false);
                            }}
                            style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                          >
                            <div className={styles.notifText}>
                              <h5>{navLabel(item.label)}</h5>
                              <p>{item.href}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                <span className={styles.notificationBadge}>{notifications.filter((notification) => !notification.is_read).length}</span>
              </button>

              {isNotificationOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notifHeader}>
                    <h4>{t('notifications')}</h4>
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 && (
                      <div className={styles.notifItem}>
                        <div className={styles.notifText}>
                          <h5>{t('noNotifications')}</h5>
                          <p>{t('newAlerts')}</p>
                        </div>
                      </div>
                    )}
                    {notifications.map((notification) => (
                      <div
                        className={styles.notifItem}
                        key={notification.id}
                        onClick={() => {
                          void markNotificationAsRead(String(notification.id));
                        }}
                      >
                        <div className={styles.notifIcon} style={{ background: notification.is_read ? '#eff6ff' : '#fef2f2', color: notification.is_read ? '#1d4ed8' : '#991b1b' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </div>
                        <div className={styles.notifText}>
                          <h5>{notification.title}</h5>
                          <p>{notification.message || notification.notification_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Officer Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <div
                className={styles.userProfile}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className={styles.avatar}>{avatarLabel || "CO"}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{userName}</span>
                  <span className={styles.userAgency}>{userAgency}</span>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`${styles.dropdownArrow} ${isProfileOpen ? styles.arrowRotate : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              {isProfileOpen && (
                <div className={styles.profileDropdown}>
                  <Link
                    href="/dashboard/profile"
                    className={styles.dropdownItem}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Edit Profile
                  </Link>
                  <div className={styles.dropdownDivider}></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsProfileOpen(false);
                    }}
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Key Metrics Ribbon */}
        {pathname !== '/dashboard/profile' && pathname !== '/dashboard/data-sources' && pathname !== '/dashboard/heat-stress' && (
          <div className={styles.ribbon}>
            <div className={styles.ribbonCard}>
              <p>{pathname === '/dashboard/alerts' ? 'Critical Alerts' : t('activeResolution')}</p>
              <strong style={pathname === '/dashboard/alerts' ? { color: "#dc2626", fontSize: "24px" } : {}}>{ribbonStats.compliance.split(' ')[0]}</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {pathname === '/dashboard/alerts' ? 'Requiring immediate response' : ribbonStats.compliance.split(' ').slice(1).join(' ')}
              </span>
            </div>
            <div className={styles.ribbonCard}>
              <p>{pathname === '/dashboard/alerts' ? 'High Priority' : t('activeStaging')}</p>
              <strong style={pathname === '/dashboard/alerts' ? { color: "#f59e0b", fontSize: "24px" } : {}}>{ribbonStats.staging.split(' ')[0]}</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {pathname === '/dashboard/alerts' ? 'Actionable within 2 hours' : ribbonStats.staging.split(' ').slice(1).join(' ')}
              </span>
            </div>
            <div className={styles.ribbonCard}>
              <p>{pathname === '/dashboard/alerts' ? 'Open Alerts' : t('reports')}</p>
              <strong style={pathname === '/dashboard/alerts' ? { fontSize: "24px" } : {}}>{ribbonStats.confidence.split(' ')[0]}</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {pathname === '/dashboard/alerts' ? 'Pending officer response' : ribbonStats.confidence.split(' ').slice(1).join(' ')}
              </span>
            </div>
          </div>
        )}

        {/* Primary Page Workflow */}
        <DashboardI18nProvider value={{ language, t: (key, fallback) => translations[language]?.[key] || fallback || key }}>
          <main className={styles.contentArea} id="main">
            {children}
          </main>
        </DashboardI18nProvider>
      </div>

      <WorkspaceDock />
    </div>
  );
}
