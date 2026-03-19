"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import styles from "./profile.module.css";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to update profile";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [agency, setAgency] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || "");
      setAgency(user.user_metadata.agency || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          agency: agency,
        },
      });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>Manage your officer profile and agency details.</p>
      </header>

      <div className={styles.profileGrid}>
        <div className={styles.card}>
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Identity & Role</h2>
              <p className={styles.sectionDesc}>These details are visible to other officers in the joint operations center.</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="text"
                id="email"
                value={user?.email || ""}
                disabled
                className={styles.inputDisabled}
              />
              <span className={styles.inputHint}>Email cannot be changed in the pilot stage.</span>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="fullName" className={styles.label}>Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="agency" className={styles.label}>Agency / Department</label>
              <input
                type="text"
                id="agency"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="e.g. NEA, BCA, Town Council"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>

        <div className={styles.sideInfo}>
          <div className={styles.card}>
            <h3 className={styles.infoTitle}>Session Information</h3>
            <div className={styles.infoRow}>
              <span>Status</span>
              <span className={styles.badgeSuccess}>Active Session</span>
            </div>
            <div className={styles.infoRow}>
              <span>Last Login</span>
              <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Just now"}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Identity Provider</span>
              <span>Supabase Auth (Official)</span>
            </div>
          </div>
          
          <div className={`${styles.card} ${styles.dangerCard}`}>
            <h3 className={styles.infoTitle}>Security</h3>
            <p className={styles.dangerText}>Access to sensitive enforcement data is logged and audited by GovTech.</p>
            <button className={styles.secondaryBtn} onClick={() => toast.error("Request sent to administration workspace")}>Request Password Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
