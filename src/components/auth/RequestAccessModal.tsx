import React, { useState } from "react";
import Modal from "../ui/Modal";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import styles from "./RequestAccessModal.module.css";

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to submit request.";
}

const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"submit" | "track">("submit");
  const [trackedStatus, setTrackedStatus] = useState<{ reference: string; status: string; updatedAt?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    email: "",
  });
  const [lookupData, setLookupData] = useState({
    reference: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const referenceCode = `REQ-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase
        .from('enquiries')
        .insert([
          { 
            full_name: formData.name, 
            department: formData.department, 
            email: formData.email,
            reference_code: referenceCode,
            status: "submitted",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      toast.success("Request submitted successfully!");
      setSubmittedId(referenceCode);
      setFormData({ name: "", department: "", email: "" });
    } catch (error: unknown) {
      console.error("Submission error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLookupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingStatus(true);

    try {
      const { data, error } = await supabase
        .from("enquiries")
        .select("reference_code, status, updated_at")
        .eq("reference_code", lookupData.reference.trim())
        .eq("email", lookupData.email.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("No matching request found for that reference and email.");
      }

      setTrackedStatus({
        reference: data.reference_code,
        status: data.status || "submitted",
        updatedAt: data.updated_at,
      });
      toast.success("Request status loaded");
    } catch (error: unknown) {
      console.error("Status lookup error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Agency Access">
      <div className={styles.inputGroup} style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className={styles.submitBtn} onClick={() => { setMode("submit"); setTrackedStatus(null); }} style={{ flex: 1, opacity: mode === "submit" ? 1 : 0.75 }}>
            Submit Request
          </button>
          <button type="button" className={styles.submitBtn} onClick={() => setMode("track")} style={{ flex: 1, opacity: mode === "track" ? 1 : 0.75 }}>
            Track Request
          </button>
        </div>
      </div>
      {submittedId ? (
        <div className={styles.form}>
          <div className={styles.description}>
            Your request has been recorded successfully.
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Request Reference</label>
            <div className={styles.input}>{submittedId}</div>
          </div>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => {
              setSubmittedId(null);
              onClose();
            }}
          >
            Close
          </button>
        </div>
      ) : mode === "track" ? (
      <form onSubmit={handleTrackRequest} className={styles.form}>
        <div className={styles.description}>
          Enter your request reference and email to check the current intake status.
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="reference" className={styles.label}>Request Reference</label>
          <input
            type="text"
            id="reference"
            name="reference"
            placeholder="REQ-123456"
            required
            className={styles.input}
            value={lookupData.reference}
            onChange={handleLookupChange}
            disabled={isCheckingStatus}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="lookup-email" className={styles.label}>Official Email</label>
          <input
            type="email"
            id="lookup-email"
            name="email"
            placeholder="john.doe@agency.gov.sg"
            required
            className={styles.input}
            value={lookupData.email}
            onChange={handleLookupChange}
            disabled={isCheckingStatus}
          />
        </div>

        {trackedStatus ? (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Current Status</label>
            <div className={styles.input}>
              {trackedStatus.status.toUpperCase()}
              {trackedStatus.updatedAt ? ` · Updated ${new Date(trackedStatus.updatedAt).toLocaleString()}` : ""}
            </div>
          </div>
        ) : null}

        <button type="submit" className={styles.submitBtn} disabled={isCheckingStatus}>
          {isCheckingStatus ? "Checking..." : "Check Status"}
        </button>
      </form>
      ) : (
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.description}>
          Please provide your details to request sandbox access for your agency.
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.label}>Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="John Doe"
            required
            className={styles.input}
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="department" className={styles.label}>Department / Agency</label>
          <input
            type="text"
            id="department"
            name="department"
            placeholder="e.g. NEA, BCA, Town Council"
            required
            className={styles.input}
            value={formData.department}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>Official Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="john.doe@agency.gov.sg"
            required
            className={styles.input}
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
      )}
    </Modal>
  );
};

export default RequestAccessModal;
