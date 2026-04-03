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
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
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
      const { error } = await supabase
        .from('enquiries')
        .insert([
          { 
            full_name: formData.name, 
            department: formData.department, 
            email: formData.email,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      toast.success("Request submitted successfully!");
      setSubmittedId(`REQ-${Date.now().toString().slice(-6)}`);
      setFormData({ name: "", department: "", email: "" });
    } catch (error: unknown) {
      console.error("Submission error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Agency Access">
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
