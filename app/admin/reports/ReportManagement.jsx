"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCheck,
  FaClipboardList,
  FaMapMarkerAlt,
  FaSearch,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import DashboardShell from "../../Components/DashboardShell";
import styles from "./reports.module.css";

const statuses = ["pending", "open", "claimed", "matched", "rejected"];

export default function ReportManagement() {
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [reportType, setReportType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reports", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.error || "Unable to load reports.");
      }
      setReports(data);
    } catch (loadError) {
      setError(loadError.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const searchText = [
      report.itemName,
      report.category,
      report.description,
      report.location,
      report.locationDetails,
      report.brand,
      report.color,
      report.contactName,
      report.contactEmail,
      report.user?.name,
      report.user?.email,
    ].join(" ").toLowerCase();

    return (!query.trim() || searchText.includes(query.trim().toLowerCase()))
      && (reportType === "all" || report.reportType === reportType)
      && (status === "all" || report.status === status);
  }), [query, reportType, reports, status]);

  const updateStatus = async (report, nextStatus) => {
    setSavingId(report.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: report.reportType,
          reportId: report.id,
          status: nextStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update this report.");
      setReports((current) => current.map((item) => (
        item.id === report.id && item.reportType === report.reportType
          ? { ...item, status: data.status }
          : item
      )));
      setNotice(`"${report.itemName}" is now ${data.status}.`);
    } catch (updateError) {
      setError(updateError.message || "Unable to update this report.");
    } finally {
      setSavingId("");
    }
  };

  const removeReport = async (report) => {
    if (!window.confirm(`Permanently remove the ${report.reportType} report for "${report.itemName}"?`)) return;
    setSavingId(report.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: report.reportType, reportId: report.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove this report.");
      setReports((current) => current.filter((item) => (
        item.id !== report.id || item.reportType !== report.reportType
      )));
      setNotice(`"${report.itemName}" was removed.`);
    } catch (deleteError) {
      setError(deleteError.message || "Unable to remove this report.");
    } finally {
      setSavingId("");
    }
  };

  const pendingCount = reports.filter((report) => report.status === "pending").length;

  return (
    <DashboardShell>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin workspace</p>
          <h1>Report management</h1>
          <p>Review submissions, publish approved reports, update their status, and remove inappropriate posts.</p>
        </div>
        <div className={styles.summary}>
          <strong>{pendingCount}</strong>
          <span>Awaiting review</span>
        </div>
      </section>

      <section className={styles.toolbar} aria-label="Search and filter reports">
        <label className={styles.search}>
          <FaSearch />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search item, location, reporter, or details"
            aria-label="Search reports"
          />
        </label>
        <select value={reportType} onChange={(event) => setReportType(event.target.value)} aria-label="Filter report type">
          <option value="all">All report types</option>
          <option value="lost">Lost reports</option>
          <option value="found">Found reports</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter report status">
          <option value="all">All statuses</option>
          {statuses.map((itemStatus) => <option value={itemStatus} key={itemStatus}>{itemStatus}</option>)}
        </select>
      </section>

      <div className={styles.resultLine}>
        <strong>{filteredReports.length}</strong> of {reports.length} reports
      </div>
      {error ? <p className={styles.messageError} role="alert">{error}</p> : null}
      {notice ? <p className={styles.messageSuccess} role="status">{notice}</p> : null}
      {loading ? <div className={styles.empty}>Loading reports...</div> : null}
      {!loading && !error && filteredReports.length === 0 ? (
        <div className={styles.empty}><FaClipboardList /><h2>No reports match</h2><p>Try changing your search or filters.</p></div>
      ) : null}

      {!loading && filteredReports.length > 0 ? (
        <section className={styles.list}>
          {filteredReports.map((report) => (
            <article className={styles.card} key={`${report.reportType}-${report.id}`}>
              <div className={`${styles.typeIcon} ${report.reportType === "found" ? styles.found : styles.lost}`}>
                {report.reportType === "found" ? <FaBoxOpen /> : <FaClipboardList />}
              </div>
              {report.imageUrls?.[0] ? (
                <div className={styles.image}>
                  <Image src={report.imageUrls[0]} alt={`${report.itemName} report`} fill sizes="(max-width: 720px) 100vw, 140px" />
                </div>
              ) : <div className={`${styles.image} ${styles.noImage}`}>No photo</div>}
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <div>
                    <span className={`${styles.typeLabel} ${report.reportType === "found" ? styles.foundLabel : ""}`}>
                      {report.reportType} report
                    </span>
                    <h2>{report.itemName}</h2>
                  </div>
                  <span className={`${styles.status} ${styles[`status_${report.status}`] || ""}`}>{report.status}</span>
                </div>
                <p className={styles.description}>{report.description}</p>
                <div className={styles.metadata}>
                  <span><FaMapMarkerAlt /> {report.location}</span>
                  <span><FaCalendarAlt /> {formatDate(report.date)}</span>
                  <span>{report.category}</span>
                  <span>By {report.user?.name || report.contactName || "Unknown reporter"}</span>
                </div>
                <div className={styles.cardActions}>
                  <Link href={`/reports/${report.id}?type=${report.reportType}`}>View report</Link>
                  {report.status === "pending" ? (
                    <>
                      <button type="button" className={styles.approve} disabled={savingId === report.id} onClick={() => updateStatus(report, "open")}>
                        <FaCheck /> {savingId === report.id ? "Saving..." : "Approve & publish"}
                      </button>
                      <button type="button" className={styles.reject} disabled={savingId === report.id} onClick={() => updateStatus(report, "rejected")}>
                        <FaTimes /> Reject
                      </button>
                    </>
                  ) : null}
                  <label className={styles.statusControl}>
                    <span className={styles.visuallyHidden}>Set report status</span>
                    <select
                      value={report.status || "open"}
                      disabled={savingId === report.id}
                      onChange={(event) => updateStatus(report, event.target.value)}
                      aria-label={`Update status for ${report.itemName}`}
                    >
                      {statuses.map((itemStatus) => <option key={itemStatus} value={itemStatus}>{itemStatus}</option>)}
                    </select>
                  </label>
                  <button type="button" className={styles.remove} disabled={savingId === report.id} onClick={() => removeReport(report)}>
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </DashboardShell>
  );
}

function formatDate(value) {
  if (!value) return "Date not provided";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
