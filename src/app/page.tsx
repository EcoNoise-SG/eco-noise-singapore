"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { TFTForecastChart, SpatialPersistenceChart, AnomalyDetectionChart, MultiOutputRadarChart } from "@/components/dashboard/AnalyticsCharts";
import ProjectBoard from "@/components/feedback-loop/ProjectBoard";
import RequestAccessModal from "@/components/auth/RequestAccessModal";
import styles from "./page.module.css";

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showAllFaqs, setShowAllFaqs] = React.useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = React.useState(false);

  const openAccessModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsAccessModalOpen(true);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.offsetWidth / 3 + 11; // Scroll by one card width including gap logic
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const faqItems = [
    {
      q: "How accurate are the forecasts?",
      a: "Our ensemble models average 84% confidence for noise and pest risk levels, backed by 5 years of historical baseline depth."
    },
    {
      q: "Which data sources are used?",
      a: "We integrate OneService reports, BCA construction permits, LTA road works, and real-time NEA IoT sensor data."
    },
    {
      q: "Is my data secure within the platform?",
      a: "Yes, we use government-grade encryption and comply with IM8 standards for all data at rest and in transit."
    },
    {
      q: "How can agencies request access?",
      a: "Agency leads can request an onboarding call via the 'Request Access' button. We typically provision sandboxes within 48 hours."
    },
    {
      q: "Does the system support real-time alerts?",
      a: "Absolutely. Officers receive push notifications via the portal when a high-risk surge is detected in their assigned zone."
    },
    {
      q: "Can we customize dashboards for specific town councils?",
      a: "Yes, the workspace allows filtering by GRC, Town Council boundaries, and specific HDB precinct levels."
    },
    {
      q: "What happens if the AI makes a wrong prediction?",
      a: "The system uses a feedback loop. Officers log actual findings, which are used to retrain and refine the model weekly."
    },
    {
      q: "Is there a mobile app for officers on the ground?",
      a: "The dashboard is fully responsive and PWA-enabled, optimized for use on official ruggedized tablets and smartphones."
    },
    {
      q: "Can this system integrate with existing case management tools?",
      a: "Yes, EcoNoise SG provides a RESTful API and webhooks for integration with OneService backend and other CRM systems."
    },
    {
      q: "How frequently is the prediction model retrained?",
      a: "Models are retrained every Saturday at 0300h using the latest batch of reports, sensor signals, and officer feedback."
    },
    {
      q: "Does it support historical trend analysis?",
      a: "Absolutely. The workspace includes a 'Retrospective' mode where you can compare current noise levels against any date range in the last 5 years."
    },
    {
      q: "Which environmental sensors are currently supported?",
      a: "We integrate directly with NEA's Sound Level Meters (SLMs), weather stations, and specialized vibration sensors for construction sites."
    }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "Chinese New Year Preparation",
      excerpt: "Predict renovation noise surges 3 weeks ahead during CNY prep season. Pre-position officers in high-density HDB areas with historical renovation patterns. Impact: 18% reduction in noise complaints",
      tag: "Festive Season",
      date: "March 12, 2026",
      image: "/blog-assets/blog-1.jpg"
    },
    {
      id: 2,
      title: "Monsoon Season Response",
      excerpt: "Correlate NEA weather forecasts with flooding complaint hotspots. Deploy inspection teams to drainage-prone areas before heavy rainfall events. Impact: 22% faster response times",
      tag: "Weather-Driven",
      date: "March 08, 2026",
      image: "/blog-assets/blog-4.jpg"
    },
    {
      id: 3,
      title: "Construction Zone Coordination",
      excerpt: "Sync with BCA permit start dates and LTA road works schedules. Coordinate proactive site inspections during high-activity construction phases. Impact: Officer utilization +22%",
      tag: "Construction",
      date: "March 05, 2026",
      image: "/blog-assets/blog-5.jpg"
    }
  ];

  const partnerBadges = [
    "Built for NEA & Town Councils",
    "Compliant with IM8 Standards",
    "Powered by GovTech & OGP",
    "Data from data.gov.sg"
  ];

  const impactMetrics = [
    {
      title: "15-25% complaint reduction",
      description: "Projected through proactive deterrence before nuisance activity escalates into resident reports.",
      image: "/agencies-assets/udone.svg"
    },
    {
      title: "Faster travel-to-incident planning",
      description: "Pre-positioned teams shorten dispatch routing and reduce time lost moving officers between estates.",
      image: "/agencies-assets/udtwo.svg"
    },
    {
      title: "Higher resident satisfaction",
      description: "Visible preventive action supports better service perception across recurring hotspot communities.",
      image: "/agencies-assets/udthree.svg"
    },
    {
      title: "Low-cost, high-visibility operations",
      description: "Uses public datasets and existing agency workflows to improve estate quality without heavy new infrastructure.",
      image: "/agencies-assets/undrawfive.svg"
    }
  ];

  const precisionTools = [
    {
      title: "Complaint Hotspots",
      description: "Identify clusters of frequent reports across 55 planning areas with historical pattern matching.",
      image: "/tools-assets/hotspots.svg"
    },
    {
      title: "Predictive Forecasts",
      description: "Anticipate surges in noise, dumping, and pest reports 2-4 weeks in advance using ensemble AI models.",
      image: "/tools-assets/ai.svg"
    },
    {
      title: "Staging Operations",
      description: "Coordinate officer pre-positioning based on high-risk time blocks to deter violations before they happen.",
      image: "/tools-assets/officers.svg"
    }
  ];

  const integrationDetails = [
    {
      text: "RESTful API with webhook support",
      image: "/system-assets/undraw_code-contribution_8k0x.svg"
    },
    {
      text: "Compatible with existing case management systems",
      image: "/system-assets/undraw_scrum-board_7bgh.svg"
    },
    {
      text: "Real-time push notifications for high-risk zones",
      image: "/system-assets/undraw_alarm-ringing_4deu.svg"
    },
    {
      text: "Responsive PWA optimized for ruggedized tablets",
      image: "/system-assets/undraw_web-app_141a.svg"
    }
  ];







  const accessPaths = [
    {
      title: "Agency leads",
      description: "Request sandbox access with 48-hour provisioning for pilot review and stakeholder walkthroughs.",
      cta: "Request Sandbox Access"
    },
    {
      title: "Officers",
      description: "Open the demo workspace to explore hotspot views, forecast cards, and deployment guidance.",
      cta: "See Demo Workspace"
    },
    {
      title: "Developers",
      description: "Review platform integration patterns, API endpoints, and webhook-ready architecture.",
      cta: "Explore API Documentation"
    }
  ];

  return (
    <div className={styles.landingContainer}>
      <div className={styles.notificationBar}>
        <span className={styles.notificationText}>
          EcoNoise SG v1.2.0 is now live with enhanced spatio-temporal forecasting!
          <Link href="#whats-new" className={styles.notificationLink}>
            See what&apos;s new <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
        </span>
      </div>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <img src="/LOGO.svg" alt="EcoNoise SG Logo" className={styles.logoImage} />
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
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.navbarGithubLink}>
            <img
              src="/navbar-assets/icons8-github.gif"
              alt="GitHub"
              className={styles.navbarGithubIcon}
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
              Operational intelligence for <span>nuisance prevention</span>
            </h1>
            <p className={styles.heroDesc}>
              A spatio-temporal complaint prediction model designed for NEA and Town Councils. Monitor hotspots, review weekly forecasts, and coordinate proactive enforcement activity.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primaryCta}>
                Enter Workspace
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <Link href="#features" className={styles.secondaryCta}>Explore Features</Link>
            </div>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className={styles.problemSection}>
          <div className={styles.problemLayout}>
            <div className={styles.mapContainer}>
              <iframe
                src="https://www.onemap.gov.sg/amm/amm.html?mapStyle=Default&zoomLevel=11&lat=1.352083&lng=103.819836&popupWidth=200"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                title="Singapore OneMap"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms"
              ></iframe>
            </div>
            <div className={styles.problemContent}>
              <div className={styles.problemBadge}>The Challenge</div>
              <h2 className={styles.problemTitle}>From Reactive Response to Proactive Prevention</h2>
              <div className={styles.problemGrid}>
                <div className={styles.problemCard}>
                  <div className={styles.problemNumber}>50,000+</div>
                  <p className={styles.problemText}>Environmental complaints received annually through OneService app</p>
                </div>
                <div className={styles.problemCard}>
                  <div className={styles.problemNumber}>100%</div>
                  <p className={styles.problemText}>Reactive enforcement: officers respond only after complaints arrive</p>
                </div>
                <div className={styles.problemCard}>
                  <div className={styles.problemNumber}>Multiple</div>
                  <p className={styles.problemText}>Predictive signals exist but remain siloed across government agencies</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Precision Tools for Enforcement</h2>
          <div className={styles.grid}>
            {precisionTools.map((tool) => (
              <div key={tool.title} className={styles.featureCard}>
                <div className={styles.featureImageWrapper}>
                  <img src={tool.image} alt={tool.title} className={styles.featureImage} />
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
            <span className={styles.dataSourcesLabel}>Transparency & Trust</span>
            <h2 className={styles.sectionTitle3}>Built on Public Data Sources, Designed for Inter-Agency Collaboration</h2>
            <p className={styles.dataSourcesDesc}>All data is aggregated, anonymized, and sourced from publicly available government datasets, The initiative is framed for public good, evidence-based policymaking, and operational coordination across NEA, Town Councils, BCA, LTA, GovTech, and OGP.</p>
          </div>
          <div className={styles.dataSourcesGrid}>
            <div className={styles.dataSourceCard}>
              <div className={styles.dataSourceIcon}>
                <img src="/data-source/oneservice-logo.png" alt="OneService" />
              </div>
              <h3 className={styles.dataSourceTitle}>OneService Reports</h3>
              <p className={styles.dataSourceDesc}>Aggregate complaint patterns by type and planning area</p>
            </div>
            <div className={styles.dataSourceCard}>
              <div className={styles.dataSourceIcon}>
                <img src="/data-source/bca-logo.png" alt="BCA" />
              </div>
              <h3 className={styles.dataSourceTitle}>BCA Construction Permits</h3>
              <p className={styles.dataSourceDesc}>Project start dates and location data</p>
            </div>
            <div className={styles.dataSourceCard}>
              <div className={styles.dataSourceIcon}>
                <img src="/data-source/primary-logo.jpg" alt="LTA" />
              </div>
              <h3 className={styles.dataSourceTitle}>LTA Road Works</h3>
              <p className={styles.dataSourceDesc}>Weekly published maintenance schedules</p>
            </div>
            <div className={styles.dataSourceCard}>
              <div className={styles.dataSourceIcon}>
                <img src="/data-source/ogp-logo.svg" alt="OPG" />
              </div>
              <h3 className={styles.dataSourceTitle}>OPG Weather API</h3>
              <p className={styles.dataSourceDesc}>Real-time rain, temperature, and humidity data</p>
            </div>
            <div className={styles.dataSourceCard}>
              <div className={styles.dataSourceIcon}>
                <img src="/data-source/GTlogo.gif" alt="Calendar" />
              </div>
              <h3 className={styles.dataSourceTitle}>Calendar Features</h3>
              <p className={styles.dataSourceDesc}>Public holidays, school terms, and festive seasons</p>
            </div>
            <div className={styles.dataSourceCard}>
              <div className={styles.dataSourceIcon}>
                <img src="/data-source/CSA10-international-fullcolour.png" alt="IM8" />
              </div>
              <h3 className={styles.dataSourceTitle}>IM8 Compliant</h3>
              <p className={styles.dataSourceDesc}>Government-grade encryption and data governance</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className={styles.howItWorksSection}>
          <div className={styles.howItWorksContent}>
            <h2 className={styles.sectionTitle}>The Predictive Feedback Loop</h2>
            <p className={styles.sectionSubtitle}>
              Our operational intelligence cycle ensures continuous model refinement through direct officer feedback and multi-agency data synchronization.
            </p>
            <ProjectBoard />
          </div>
        </section>

        {/* Technical Approach Section */}
        <section id="technology" className={styles.technicalSection}>
          <div className={styles.technicalContent}>
            <h2 className={styles.sectionTitle}>Advanced ML Architecture</h2>
            <p className={styles.technicalSubtitle}>Built on state-of-the-art machine learning models for accurate multi-step forecasting</p>
            <div className={styles.technicalGrid}>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <TFTForecastChart height="100%" />
                </div>
                <h3 className={styles.technicalTitle}>Temporal Fusion Transformer</h3>
                <p className={styles.technicalDesc}>Multi-step complaint volume forecasting by planning area with attention mechanisms</p>
              </div>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <SpatialPersistenceChart height="100%" />
                </div>
                <h3 className={styles.technicalTitle}>Spatial Clustering</h3>
                <p className={styles.technicalDesc}>Identify persistent high-complaint patterns versus seasonal spikes across regions</p>
              </div>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <AnomalyDetectionChart height="100%" />
                </div>
                <h3 className={styles.technicalTitle}>Anomaly Detection</h3>
                <p className={styles.technicalDesc}>Flag unusual complaint surges for immediate investigation and rapid response</p>
              </div>
              <div className={styles.technicalCard}>
                <div className={styles.chartContainer}>
                  <MultiOutputRadarChart height="100%" />
                </div>
                <h3 className={styles.technicalTitle}>Multi-Output Models</h3>
                <p className={styles.technicalDesc}>Separate specialized models for noise, illegal dumping, and pest complaints</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statGrid}>
            <div>
              <div className={styles.statNumber}>15-25%</div>
              <div className={styles.statLabel}>Projected Complaint Reduction</div>
              <div className={styles.statContext}>Through proactive deterrence and pre-positioning</div>
            </div>
            <div>
              <div className={styles.statNumber}>84%</div>
              <div className={styles.statLabel}>Model Confidence Level</div>
              <div className={styles.statContext}>For noise and pest risk predictions</div>
            </div>
            <div>
              <div className={styles.statNumber}>2-4 weeks</div>
              <div className={styles.statLabel}>Forecast Horizon</div>
              <div className={styles.statContext}>Advance warning for resource planning</div>
            </div>
            <div>
              <div className={styles.statNumber}>55</div>
              <div className={styles.statLabel}>Planning Areas Covered</div>
              <div className={styles.statContext}>Island-wide predictive coverage</div>
            </div>
          </div>
        </section>




        <section className={styles.impactSection}>
          <div className={styles.impactSectionHeader}>
            <span className={styles.sectionEyebrow}>Operational Outcomes</span>
            <h2 className={styles.sectionTitle}>Impact Metrics That Matter to Agencies</h2>
          </div>
          <div className={styles.impactGrid}>
            {impactMetrics.map((item) => (
              <article key={item.title} className={styles.impactCard}>
                <div className={styles.impactImageWrapper}>
                  <img src={item.image} alt={item.title} className={styles.impactImage} />
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
                  <img src={detail.image} alt={detail.text} className={styles.integrationImage} />
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
                {path.cta === "Request Sandbox Access" ? (
                  <button onClick={openAccessModal} className={styles.accessLink}>{path.cta}</button>
                ) : (
                  <Link href="/login" className={styles.accessLink}>{path.cta}</Link>
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
              <h2 className={styles.blogMainTitle}>Real-World Scenarios</h2>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>How predictive intelligence transforms enforcement operations</p>
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
                  <img src={post.image} alt={post.title} className={styles.blogImage} />
                </div>
                <div className={styles.blogContent}>
                  <span className={styles.blogTag}>{post.tag}</span>
                  <h3 className={styles.blogCardTitle}>{post.title}</h3>
                  <p className={styles.blogExcerpt}>{post.excerpt}</p>
                  <div className={styles.blogFooter}>
                    <span className={styles.blogDate}>{post.date}</span>
                    <Link href="#" className={styles.readMore}>
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
              <img src="/LOGO.svg" alt="EcoNoise SG Logo" className={`${styles.logoImage} ${styles.whiteLogo}`} />
            </Link>
            <p className={styles.footerDesc}>
              Advanced predictive modeling for urban noise and environmental nuisance management in Singapore.
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
            <Link href="#" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="#" className={styles.footerLink}>Terms of Use</Link>
            <Link href="#" className={styles.footerLink}>Data Governance</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Contact</h4>
            <Link href="#" className={styles.footerLink}>Support Desk</Link>
            <Link href="#" className={styles.footerLink}>Agency Access</Link>
            <Link href="#" className={styles.footerLink}>API Documentation</Link>
          </div>
        </div>
        <div className={styles.footerLogos}>
          <img
            src="/footer-assets/powered-by-govtech.e8355051a1ee7687637fb87ff6231503.svg"
            alt="Powered by GovTech"
            className={styles.footerLogo}
          />
          <img
            src="/footer-assets/ogp-logo.svg"
            alt="Open Government Products"
            className={`${styles.footerLogo} ${styles.whiteLogo}`}
          />
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.footerGithubLink}>
            <img
              src="/navbar-assets/icons8-github.gif"
              alt="GitHub"
              className={styles.footerGithubIcon}
            />
            <span className={styles.githubText}>
              Visit GitHub
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
            </span>
          </a>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 EcoNoise SG. Prototype for Government Innovation.</p>
          <div style={{ textAlign: 'right' }}>
            <p>Status: v1.2.0-alpha · Ops Mode</p>
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
