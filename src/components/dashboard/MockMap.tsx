"use client";

import styles from "./map.module.css";

export function MockMap({ title }: { title: string }) {
  const oneMapSrc =
    "https://www.onemap.gov.sg/amm/amm.html?mapStyle=Default&zoomLevel=11&lat=1.352083&lng=103.819836&popupWidth=200";

  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapHeader}>
        <div className={styles.mapStatus}>
          <span className={styles.statusPulse}></span>
          Live Spatial Intel
        </div>
        <h3>{title}</h3>
      </div>
      
      <div className={styles.mapSurface}>
        <iframe
          src={oneMapSrc}
          className={styles.mapFrame}
          title={`${title} OneMap view`}
          allowFullScreen
        />

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
        <p>Powered by Singapore OneMap to match the landing-page spatial view.</p>
      </div>
    </div>
  );
}
