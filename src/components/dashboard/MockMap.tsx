"use client";

import styles from "./map.module.css";

export function MockMap({ title }: { title: string }) {
  // Using a professional looking placeholder for the map
  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapHeader}>
        <div className={styles.mapStatus}>
          <span className={styles.statusPulse}></span>
          LIVE SPATIAL INTEL
        </div>
        <h3>{title}</h3>
      </div>
      
      <div className={styles.mapSurface}>
        {/* Placeholder SVG that looks like a technical map of SG */}
        <svg viewBox="0 0 800 400" className={styles.svgMap}>
          <rect width="100%" height="100%" fill="#f1f5f9" />
          <path d="M100,200 Q150,150 200,200 T300,200 T400,250 T500,200 T600,150 T700,200" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx="200" cy="180" r="8" fill="#ef4444" fillOpacity="0.4" />
          <circle cx="200" cy="180" r="3" fill="#ef4444" />
          
          <circle cx="450" cy="220" r="12" fill="#ef4444" fillOpacity="0.2" />
          <circle cx="450" cy="220" r="4" fill="#ef4444" />
          
          <circle cx="580" cy="160" r="10" fill="#f59e0b" fillOpacity="0.3" />
          <circle cx="580" cy="160" r="4" fill="#f59e0b" />
          
          <text x="210" y="175" fontSize="10" fontWeight="600" fill="#0f172a">Jurong West Cluster</text>
          <text x="460" y="215" fontSize="10" fontWeight="600" fill="#0f172a">Woodlands Central</text>
          <text x="590" y="155" fontSize="10" fontWeight="600" fill="#0f172a">Tampines East</text>
        </svg>
        
        <div className={styles.mapOverlay}>
          <div className={styles.overlayCard}>
            <span>Active Sensors</span>
            <strong>1,402</strong>
          </div>
          <div className={styles.overlayCard}>
            <span>Alert Threshold</span>
            <strong>92%</strong>
          </div>
        </div>
      </div>
      
      <div className={styles.mapFooter}>
        <p>Google Maps API integration ready. Interface optimized for spatial data visualization.</p>
      </div>
    </div>
  );
}
