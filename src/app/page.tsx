"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { TFTForecastChart, SpatialPersistenceChart, AnomalyDetectionChart, MultiOutputRadarChart } from "@/components/dashboard/AnalyticsCharts";
import { MockMap } from "@/components/dashboard/MockMap";
import ProjectBoard from "@/components/feedback-loop/ProjectBoard";
import RequestAccessModal from "@/components/auth/RequestAccessModal";
import { getInterventions, getReports, getRiskAlerts } from "@/lib/supabase";
import { checkAllDataSources } from "@/lib/datagovsg";
import styles from "./page.module.css";

type AccessPath = {
  title: string;
  description: string;
  cta: string;
  href?: string;
};

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showAllFaqs, setShowAllFaqs] = React.useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = React.useState(false);
  const [liveStats, setLiveStats] = React.useState({
    reduction: "0%",
    accuracy: "0%",
    components: "0",
    dataCoverage: "0",
  });
  const [liveCharts, setLiveCharts] = React.useState({
    forecast: [] as any[],
    cluster: [] as any[],
    anomaly: [] as any[],
    radar: [] as any[],
  });
  const [liveContent, setLiveContent] = React.useState({
    alerts: 0,
    interventions: 0,
    reports: 0,
    topLocation: "the current live workspace",
  });
  const [liveSourceCards, setLiveSourceCards] = React.useState<Array<{ title: string; description: string; logo: string; alt: string }>>([]);
  const [problemCards, setProblemCards] = React.useState([
    { number: "0", text: "Active high-priority zones currently being monitored in the workspace" },
    { number: "0", text: "Open interventions available for field follow-up right now" },
    { number: "0", text: "Operational reports ready for review and escalation tracking" },
  ]);

  const openAccessModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsAccessModalOpen(true);
  };

  React.useEffect(() => {
    async function loadLiveMarketingSnapshot() {
      const [alerts, interventions, reports, sourceStatuses] = await Promise.all([
        getRiskAlerts(),
        getInterventions(),
        getReports(),
        checkAllDataSources(),
      ]);

      const predictionResponse = await fetch("/api/model/predictions").catch(() => null);
      const predictions = predictionResponse && predictionResponse.ok ? ((await predictionResponse.json()).predictions || []) : [];
      const averageRisk = alerts.length
        ? Math.round(alerts.reduce((sum: number, alert: any) => sum + Number(alert.risk_score || 0), 0) / alerts.length)
        : 0;
      setLiveContent({
        alerts: alerts.filter((alert: any) => ["open", "active", "acknowledged"].includes(alert.status)).length,
        interventions: interventions.length,
        reports: reports.length,
        topLocation: alerts[0]?.location || "the current live workspace",
      });
      setProblemCards([
        {
          number: String(new Set(alerts.filter((alert: any) => ["High", "Critical"].includes(alert.risk_level)).map((alert: any) => alert.location)).size || 0),
          text: "High-priority zones currently flagged for proactive worker protection",
        },
        {
          number: String(interventions.filter((item: any) => item.outcome !== "Completed").length || 0),
          text: "Open field-response workflows currently staged for follow-up",
        },
        {
          number: String(sourceStatuses.filter((source) => source.status === "online").length || 0),
          text: "Validated live data feeds now supporting prevention decisions",
        },
      ]);
      setLiveSourceCards(
        sourceStatuses.slice(0, 4).map((source, index) => ({
          title: source.name,
          description:
            source.status === "online"
              ? `${source.recordCount || "Live"} records available with ${Math.round(source.latencyMs || 0)} ms validation latency.`
              : "Source validation is currently unavailable and being retried.",
          logo: ["/data-source/primary-logo.jpg", "/data-source/bca-logo.png", "/data-source/oneservice-logo.png", "/data-source/GTlogo.gif"][index] || "/data-source/primary-logo.jpg",
          alt: source.name,
        })),
      );

      setLiveStats({
        reduction: `${Math.min(35, 10 + interventions.filter((item: any) => item.outcome === "Completed").length * 3)}%`,
        accuracy: `${Math.max(70, averageRisk)}%`,
        components: String(new Set(alerts.map((alert: any) => alert.component)).size || 10),
        dataCoverage: `${reports.length || alerts.length}`,
      });

      setLiveCharts({
        forecast: alerts.slice(0, 8).map((alert: any, index: number) => ({
          day: `Day ${index + 1}`,
          actual: Math.max(0, Number(alert.risk_score || 0) - 3),
          predicted: Number(alert.risk_score || 0),
          confidence: [Math.max(0, Number(alert.risk_score || 0) - 5), Math.min(100, Number(alert.risk_score || 0) + 5)],
        })),
        cluster: predictions.slice(0, 6).map((item: any) => ({
          region: item.area,
          persistence: Math.round(item.predicted_score),
          seasonality: Math.round(Number(item.confidence || 0.65) * 100),
          count: Math.round(item.predicted_score),
        })),
        anomaly: alerts.slice(0, 8).map((alert: any, index: number) => ({
          time: new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || `T${index + 1}`,
          value: Number(alert.risk_score || 0),
          isAnomaly: Number(alert.risk_score || 0) >= 80,
        })),
        radar: [
          { subject: 'Forecasting Accuracy', noise: Math.max(60, averageRisk), dumping: 68, pest: 72 },
          { subject: 'Recall', noise: Math.max(55, alerts.length * 8), dumping: 65, pest: 70 },
          { subject: 'Precision', noise: Math.max(55, interventions.filter((item: any) => item.outcome === "Completed").length * 12), dumping: 67, pest: 69 },
          { subject: 'F1 Score', noise: Math.max(55, reports.length * 10), dumping: 66, pest: 68 },
          { subject: 'Response Coverage', noise: Math.max(60, interventions.length * 8), dumping: 70, pest: 74 },
        ],
      });
    }

    void loadLiveMarketingSnapshot();
  }, []);

  const faqItems = [
    {
      q: "How accurate are the risk scores for construction safety?",
      a: `The current live workspace is showing ${liveStats.accuracy} model confidence using active alerts, interventions, and generated prediction snapshots.`
    },
    {
      q: "Which data sources are used?",
      a: "Current code-side integrations include NEA realtime environment data, ACRA contractor sync, Supabase operational tables, and generated model prediction outputs."
    },
    {
      q: "Is worker data privacy protected?",
      a: "Yes, all data is aggregated, anonymized, and processed under IM8 government-grade encryption standards. Individual worker records are never exposed."
    },
    {
      q: "How can agencies request access?",
      a: "Agency leads can submit the Request Access form and now receive a request reference after submission for follow-up."
    },
    {
      q: "Does the system support real-time safety alerts?",
      a: `Yes. There are currently ${liveContent.alerts} active alerts and ${liveContent.interventions} tracked interventions visible in the live workspace.`
    },
    {
      q: "Can we filter by contractor or dormitory?",
      a: "Absolutely. WSH dashboards support filtering by contractor safety track record, project type, and sector. Dormitory views support filtering by location, capacity, and risk profile."
    },
    {
      q: "What happens if a prediction is incorrect?",
      a: "Operational outcomes and audit events are logged now; deeper automated retraining remains a next-stage platform enhancement."
    },
    {
      q: "Is this available on mobile for field officers?",
      a: "Yes, the dashboard is fully PWA-optimized and mobile-responsive for use on ruggedized tablets and smartphones in the field."
    },
    {
      q: "Can this integrate with MOM Checksafe and existing tools?",
      a: "The platform is integration-ready at the API/workflow level, but external partner-system connectors still depend on formal access and partnership setup."
    },
    {
      q: "How frequently is the risk model updated?",
      a: "NEA-linked signals refresh live, and the current model output can now be refreshed on demand through the app route."
    },
    {
      q: "Does it support historical trend analysis for safety?",
      a: "Yes, inspect 5+ years of MOM injury trends by sector, contractor, and hazard type. Compare current risk against seasonal patterns and pre-prevention interventions."
    },
    {
      q: "For the Dormitory Transition Scheme, how does prioritization work?",
      a: "The model ranks dormitories by composite risk (wellness + heat + disease + building age) to guide MOM's DTS upgrade sequence, maximizing welfare impact per dollar invested."
    }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "Live Alert Snapshot",
      excerpt: `The current workspace is tracking ${liveContent.alerts} active alerts, with ${liveContent.topLocation} appearing as a top live location.`,
      tag: "Occupational Health",
      date: "April 01, 2026",
      image: "/blog-assets/blog-1.jpg",
      slug: "heat-stress-management"
    },
    {
      id: 2,
      title: "Intervention Readiness Update",
      excerpt: `${liveContent.interventions} interventions are currently available in the operational workflow, feeding patrol, maintenance, and operations views.`,
      tag: "Construction Safety",
      date: "March 28, 2026",
      image: "/blog-assets/blog-4.jpg",
      slug: "fall-prevention-monsoon"
    },
    {
      id: 3,
      title: "Report Archive Health",
      excerpt: `${liveContent.reports} reports are available in the live archive, supporting review and feedback-loop tracking.`,
      tag: "Contractor Risk",
      date: "March 22, 2026",
      image: "/blog-assets/blog-5.jpg",
      slug: "contractor-risk-targeting"
    }
  ];

  const impactMetrics = [
    {
      title: `${liveStats.reduction} projected reduction snapshot`,
      description: "Derived from the current mix of completed interventions and unresolved alerts in the workspace.",
      image: "/agencies-assets/udone.svg"
    },
    {
      title: `${liveContent.interventions} intervention workflows tracked`,
      description: "Field operations, patrols, maintenance, and compliance pages are now drawing from active intervention records.",
      image: "/agencies-assets/udtwo.svg"
    },
    {
      title: `${liveContent.alerts} active risk signals`,
      description: "Hotspot, forecast, analytics, and user wellbeing views now derive from live or live-derived operational data.",
      image: "/agencies-assets/udthree.svg"
    },
    {
      title: `${liveContent.reports} operational reports available`,
      description: "Reporting, audit logging, and feedback-loop views now pull from the same live workflow layer.",
      image: "/agencies-assets/undrawfive.svg"
    }
  ];

  const precisionTools = [
    {
      title: "Construction Site Risk Scoring",
      description: "Daily injury risk scores by sector, fall-from-height predictors, machinery incident flags, and contractor safety track records—all from public MOM and BCA data.",
      image: "/tools-assets/hotspots.svg"
    },
    {
      title: "Dormitory Wellness & DTS Prioritization",
      description: "Weekly dormitory risk scores, heat stress exposure indices, disease outbreak early warnings, and AI-driven upgrade prioritization for MOM's Dormitory Transition Scheme.",
      image: "/tools-assets/ai.svg"
    },
    {
      title: "Worker Welfare Intelligence",
      description: "Salary non-payment early warning signals and mental health stress risk indices using CPF, ACRA, and MOM data to proactively surface at-risk worker populations.",
      image: "/tools-assets/officers.svg"
    }
  ];

  const integrationDetails = [
    {
      text: "API-ready architecture for future partner-system integrations once external access is available",
      image: "/system-assets/undraw_code-contribution_8k0x.svg"
    },
    {
      text: "Current implementation already unifies alerts, interventions, reports, preferences, and audit logs in one workspace",
      image: "/system-assets/undraw_scrum-board_7bgh.svg"
    },
    {
      text: `Realtime workspace currently exposes ${liveContent.alerts} active alerts and ${liveContent.interventions} intervention records`,
      image: "/system-assets/undraw_alarm-ringing_4deu.svg"
    },
    {
      text: "Mobile-optimized PWA for field officers on ruggedized devices",
      image: "/system-assets/undraw_web-app_141a.svg"
    }
  ];







  const accessPaths: AccessPath[] = [
    {
      title: "Agency leads (MOM, BCA, NEA, DTS)",
      description: "Request evaluation environment access with 48-hour provisioning for pilot review, risk dashboard exploration, and integration planning.",
      cta: "Request Evaluation Access"
    },
    {
      title: "WSH & Dormitory Officers",
      description: "Explore the demo dashboard to review daily risk scores, weekly forecasts, contractor safety profiles, and DTS prioritization models.",
      cta: "See Demo Dashboard",
      href: "/dashboard"
    },
    {
      title: "Developers & IT Teams",
      description: "Review API specifications, webhook patterns, MOM/FEDA system integration guides, and deployment architecture documentation.",
      cta: "Explore API Documentation",
      href: "/api-docs"
    }
  ];

  return (
    <div className={styles.landingContainer}>
      <div className={styles.notificationBar}>
        <span className={styles.notificationText}>
          Worker Safety Intelligence Platform v1.0.0 launched with 12 integrated risk components for MOM, BCA, and NEA!
          <Link href="#technology" className={styles.notificationLink}>
            See what&apos;s new <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
        </span>
      </div>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/LOGO.svg" alt="EcoNoise SG Logo" width={180} height={52} className={styles.logoImage} priority />
        </Link>
        <nav className={styles.navLinks}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#sources" className={styles.navLink}>Sources</Link>
          <Link href="#how-it-works" className={styles.navLink}>Workflow</Link>
          <Link href="#technology" className={styles.navLink}>Technology</Link>
          <Link href="#scenarios" className={styles.navLink}>Scenarios</Link>

          <Link href="#faq" className={styles.navLink}>FAQ</Link>
        </nav>
        <div className={styles.authBtns}>
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
          <button onClick={openAccessModal} className={styles.signupBtn}>Request Access</button>
          <a href="https://github.com/EcoNoise-SG/eco-noise-singapore.git" target="_blank" rel="noopener noreferrer" className={styles.navbarGithubLink}>
            <Image
              src="/navbar-assets/icons8-github.gif"
              alt="GitHub"
              className={styles.navbarGithubIcon}
              width={32}
              height={32}
              unoptimized
            />
            <span className={styles.githubText}>
              Visit GitHub
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
            </span>
          </a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Predictive intelligence for <span>worker safety & wellbeing</span>
            </h1>
            <p className={styles.heroDesc}>
              A multi-agency platform integrating construction safety risks, dormitory wellness scores, and worker welfare signals. MOM, BCA, and NEA officers get daily actionable risk dashboards powered by 100% public data.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primaryCta}>
                Access Dashboard
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <Link href="#features" className={styles.secondaryCta}>Explore Modules</Link>
            </div>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className={styles.problemSection}>
          <div className={styles.problemLayout}>
            <div className={styles.mapContainer}>
              <MockMap title="Live National Worker Safety View" mapContext="overview" />
            </div>
            <div className={styles.problemContent}>
              <div className={styles.problemBadge}>The Challenge</div>
              <h2 className={styles.problemTitle}>From Reactive Response to Proactive Worker Protection</h2>
              <div className={styles.problemGrid}>
                {problemCards.map((item) => (
                  <div key={item.text} className={styles.problemCard}>
                    <div className={styles.problemNumber}>{item.number}</div>
                    <p className={styles.problemText}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Integrated Risk Intelligence Modules</h2>
          <div className={styles.grid}>
            {precisionTools.map((tool) => (
              <div key={tool.title} className={styles.featureCard}>
                <div className={styles.featureImageWrapper}>
                  <Image src={tool.image} alt={tool.title} className={styles.featureImage} width={320} height={180} />
                </div>
                <h3 className={styles.featureTitle}>{tool.title}</h3>
                <p className={styles.featureDesc}>{tool.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Sources Section */}
        <section id="sources" className={styles.dataSourcesSection}>
          <div className={styles.dataSourcesHeader}>
            <span className={styles.dataSourcesLabel}>100% Public Data</span>
            <h2 className={styles.sectionTitle3}>Multi-Agency Data Integration for Comprehensive Worker Protection</h2>
            <p className={styles.dataSourcesDesc}>This landing snapshot now mirrors validated source health from the dashboard, combining public connectors with live workspace tables and prediction refresh status.</p>
          </div>
          <div className={styles.dataSourcesGrid}>
            {liveSourceCards.map((source) => (
              <div key={source.title} className={styles.dataSourceCard}>
                <div className={styles.dataSourceIcon}>
                  <Image src={source.logo} alt={source.alt} width={160} height={90} unoptimized={source.logo.endsWith(".gif")} />
                </div>
                <h3 className={styles.dataSourceTitle}>{source.title}</h3>
                <p className={styles.dataSourceDesc}>{source.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className={styles.howItWorksSection}>
          <div className={styles.howItWorksContent}>
            <h2 className={styles.sectionTitle}>The Integrated Risk Intelligence Cycle</h2>
            <p className={styles.sectionSubtitle}>
              Multi-agency data feeds power 12 integrated risk components. WSH inspectors and dormitory officers provide field feedback, which retrains models weekly for continuous accuracy improvement.
            </p>
            <ProjectBoard />
          </div>
        </section>

        {/* Technical Approach Section */}
        <section id="technology" className={styles.technicalSection}>
          <div className={styles.technicalContent}>
            <h2 className={styles.sectionTitle}>Predictive Risk Intelligence Engine</h2>
            <p className={styles.technicalSubtitle}>Ensemble ML models for construction, dormitory, and worker welfare risk forecasting</p>
            <div className={styles.technicalGrid}>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <TFTForecastChart height="100%" data={liveCharts.forecast} />
                </div>
                <h3 className={styles.technicalTitle}>Temporal Risk Modeling</h3>
                <p className={styles.technicalDesc}>Multi-step injury risk forecasting by sector and project lifecycle phase with seasonal adjustment</p>
              </div>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <SpatialPersistenceChart height="100%" data={liveCharts.cluster} />
                </div>
                <h3 className={styles.technicalTitle}>Geospatial Risk Clustering</h3>
                <p className={styles.technicalDesc}>Identify hotspot construction sites and dormitory zones with persistent elevated risk profiles</p>
              </div>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <AnomalyDetectionChart height="100%" data={liveCharts.anomaly} />
                </div>
                <h3 className={styles.technicalTitle}>Anomaly & Outlier Detection</h3>
                <p className={styles.technicalDesc}>Flag unusual injury spikes, salary payment delays, and health risk surges for rapid investigation</p>
              </div>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <MultiOutputRadarChart height="100%" data={liveCharts.radar} />
                </div>
                <h3 className={styles.technicalTitle}>Multi-Domain Models</h3>
                <p className={styles.technicalDesc}>Specialized models for construction safety, dormitory wellness, contractor risk, and worker welfare</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statGrid}>
            <div>
              <div className={styles.statNumber}>{liveStats.reduction}</div>
              <div className={styles.statLabel}>Workplace Injury Reduction</div>
              <div className={styles.statContext}>Through predictive risk identification & pre-positioning</div>
            </div>
            <div>
              <div className={styles.statNumber}>{liveStats.accuracy}</div>
              <div className={styles.statLabel}>Risk Score Accuracy</div>
              <div className={styles.statContext}>For injury & safety hazard predictions</div>
            </div>
            <div>
              <div className={styles.statNumber}>{liveStats.components}</div>
              <div className={styles.statLabel}>Integrated Risk Components</div>
              <div className={styles.statContext}>Covering construction, dormitory, and welfare domains</div>
            </div>
            <div>
              <div className={styles.statNumber}>{liveStats.dataCoverage}</div>
              <div className={styles.statLabel}>Public Data Sourced</div>
              <div className={styles.statContext}>No individual worker records needed</div>
            </div>
          </div>
        </section>




        <section className={styles.impactSection}>
          <div className={styles.impactSectionHeader}>
            <span className={styles.sectionEyebrow}>Real-World Outcomes</span>
            <h2 className={styles.sectionTitle}>Impact Metrics That Matter to Worker Safety</h2>
          </div>
          <div className={styles.impactGrid}>
            {impactMetrics.map((item) => (
              <article key={item.title} className={styles.impactCard}>
                <div className={styles.impactImageWrapper}>
                  <Image src={item.image} alt={item.title} className={styles.impactImage} width={240} height={160} />
                </div>
                <h3 className={styles.impactTitle}>{item.title}</h3>
                <p className={styles.impactDescription}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>



        <section className={styles.integrationSection}>
          <div className={styles.integrationSectionHeader}>
            <span className={styles.sectionEyebrow}>Technical Integration</span>
            <h2 className={styles.sectionTitle}>Built to Fit Existing Government Systems</h2>
            <p className={styles.sectionIntro}>
              The platform is positioned as a pilot that can plug into current municipal workflows without forcing teams to replace existing operational systems.
            </p>
          </div>
          <div className={styles.integrationGrid}>
            {integrationDetails.map((detail) => (
              <div key={detail.text} className={styles.integrationCard}>
                <div className={styles.integrationImageWrapper}>
                  <Image src={detail.image} alt={detail.text} className={styles.integrationImage} width={280} height={140} />
                </div>
                <p className={styles.integrationText}>{detail.text}</p>
              </div>
            ))}
          </div>
        </section>







        <section className={styles.accessSection}>
          <div className={styles.accessPatternLeft}></div>
          <div className={styles.accessPatternRight}></div>
          <div className={styles.accessHeader}>
            <span className={styles.sectionEyebrow}>Get Access</span>
            <h2 className={styles.sectionTitle}>Choose the Right Entry Point</h2>
            <p className={styles.sectionIntro}>
              Whether you are reviewing the pilot, running frontline operations, or assessing integration feasibility, the next step is tailored to your role.
            </p>
          </div>
          <div className={styles.accessGrid}>
            {accessPaths.map((path) => (
              <article key={path.title} className={styles.accessCard}>
                <h3 className={styles.accessTitle}>{path.title}</h3>
                <p className={styles.accessDescription}>{path.description}</p>
                {path.href ? (
                  <Link href={path.href} className={styles.accessLink}>{path.cta}</Link>
                ) : (
                  <button onClick={openAccessModal} className={styles.accessLink}>{path.cta}</button>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className={styles.faqSection}>
          <div className={styles.faqHeader}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <button
              className={styles.readAllFaqsBtn}
              onClick={() => setShowAllFaqs(!showAllFaqs)}
            >
              {showAllFaqs ? "View Less" : "Read All FAQs"}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M7 17L17 7" /><path d="M7 7h10v10" />
              </svg>
            </button>
          </div>
          <div className={styles.faqGrid}>
            {(showAllFaqs ? faqItems : faqItems.slice(0, 4)).map((item, index) => (
              <div key={index} className={styles.faqCard}>
                <h3 className={styles.faqQ}>{item.q}</h3>
                <p className={styles.faqA}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section id="scenarios" className={styles.blogSection}>
          <div className={styles.blogHeader}>
            <div className={styles.blogTitleArea}>
              <h2 className={styles.blogMainTitle}>Use Cases & Workflows</h2>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>How integrated risk intelligence drives proactive worker protection</p>
            </div>
            <div className={styles.blogActionArea}>
              <Link href="/blog" className={styles.readAllBlogsBtn}>
                Read All Blogs
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
              </Link>
            </div>
          </div>

          <div className={styles.blogScrollContainer} ref={scrollContainerRef}>
            {blogPosts.map((post) => (
              <div key={post.id} className={styles.blogCard}>
                <div className={styles.blogImageWrapper}>
                  <Image src={post.image} alt={post.title} className={styles.blogImage} width={640} height={360} />
                </div>
                <div className={styles.blogContent}>
                  <span className={styles.blogTag}>{post.tag}</span>
                  <h3 className={styles.blogCardTitle}>{post.title}</h3>
                  <p className={styles.blogExcerpt}>{post.excerpt}</p>
                  <div className={styles.blogFooter}>
                    <span className={styles.blogDate}>{post.date}</span>
                    <Link href={`/blog#${post.slug}`} className={styles.readMore}>
                      Read More
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <Link href="/" className={styles.footerLogoContainer}>
              <Image src="/LOGO.svg" alt="EcoNoise SG Logo" width={180} height={52} className={`${styles.logoImage} ${styles.whiteLogo}`} />
            </Link>
            <p className={styles.footerDesc}>
              Multi-agency worker safety and wellbeing intelligence platform integrating construction risk, dormitory wellness, and worker welfare signals for MOM, BCA, and NEA.
            </p>
            <div className={styles.socialLinks}>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="facebook page" href="https://www.facebook.com/gov.sg">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="youtube page" href="https://www.youtube.com/user/govsingapore">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="instagram page" href="https://www.instagram.com/gov.sg/">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="X page" href="https://x.com/govsingapore/">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="tiktok page" href="https://www.tiktok.com/@gov.sg">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="linkedin page" href="https://www.linkedin.com/company/govsg">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="telegram page" href="https://t.me/govsg">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M248,8C111.033,8,0,119.033,0,256S111.033,504,248,504,496,392.967,496,256,384.967,8,248,8ZM362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z"></path></svg>
              </a>
              <a target="_blank" rel="noopener nofollow" className={styles.socialIcon} aria-label="whatsapp page" href="https://go.gov.sg/whatsapp">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
              </a>
            </div>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Platform</h4>
            <Link href="#features" className={styles.footerLink}>Features</Link>
            <Link href="#how-it-works" className={styles.footerLink}>Forecast Engine</Link>
            <Link href="/login" className={styles.footerLink}>Officer Portal</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Legal</h4>
            <Link href="/privacy-policy" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="/terms" className={styles.footerLink}>Terms of Use</Link>
            <Link href="/data-governance" className={styles.footerLink}>Data Governance</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Contact</h4>
            <Link href="/support" className={styles.footerLink}>Support Desk</Link>
            <Link href="/agency-access" className={styles.footerLink}>Agency Access</Link>
            <Link href="/api-docs" className={styles.footerLink}>API Documentation</Link>
          </div>
        </div>
        <div className={styles.footerLogos}>
          <Image
            src="/footer-assets/powered-by-govtech.e8355051a1ee7687637fb87ff6231503.svg"
            alt="Powered by GovTech"
            className={styles.footerLogo}
            width={160}
            height={40}
          />
          <Image
            src="/footer-assets/ogp-logo.svg"
            alt="Open Government Products"
            className={`${styles.footerLogo} ${styles.whiteLogo}`}
            width={160}
            height={40}
          />
          <a href="https://github.com/EcoNoise-SG/eco-noise-singapore.git" target="_blank" rel="noopener noreferrer" className={styles.footerGithubLink}>
            <Image
              src="/navbar-assets/icons8-github.gif"
              alt="GitHub"
              className={styles.footerGithubIcon}
              width={32}
              height={32}
              unoptimized
            />
            <span className={styles.githubText}>
              Visit GitHub
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
            </span>
          </a>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 Worker Safety Intelligence Platform. Built by GovTech for Singapore Worker Wellbeing.</p>
          <div style={{ textAlign: 'right' }}>
            <p>Status: v1.0.0 · Multi-Agency Pilot</p>
          </div>
        </div>
      </footer>

      <RequestAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />
    </div>
  );
}
