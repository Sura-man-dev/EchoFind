"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaBoxOpen, FaCalendarAlt, FaClipboardList, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import DashboardShell from "../Components/DashboardShell";
import styles from "./reports.module.css";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [lostResponse, foundResponse] = await Promise.all([
          fetch("/api/reports/lost", { cache: "no-store" }),
          fetch("/api/reports/found", { cache: "no-store" }),
        ]);
        const [lost, found] = await Promise.all([lostResponse.json(), foundResponse.json()]);
        if (!lostResponse.ok || !foundResponse.ok || !Array.isArray(lost) || !Array.isArray(found)) {
          throw new Error(lost?.error || found?.error || "Unable to load reports.");
        }
        setReports([
          ...(Array.isArray(lost) ? lost : []).map((report) => ({ ...report, reportType: "lost", location: report.lostLocation, date: report.lostDate })),
          ...(Array.isArray(found) ? found : []).map((report) => ({ ...report, reportType: "found", location: report.foundLocation, date: report.foundDate })),
        ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
        setError("");
      } catch (loadError) {
        setError(loadError.message || "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const text = [
      report.itemName,
      report.category,
      report.description,
      report.location,
      report.locationDetails,
      report.brand,
      report.color,
      report.contactName,
      report.contactEmail,
      report.contactPhone,
    ].join(" ").toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase()))
      && (type === "all" || report.reportType === type)
      && (status === "all" || (report.status || "open") === status);
  }), [query, reports, status, type]);

  return (
    <DashboardShell>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Posted reports</h1>
          <p>Keep track of every lost and found item submitted to EchoFind.</p>
        </div>
        <div className={styles.totalBadge}><strong>{reports.length}</strong><span>Total posts</span></div>
      </section>

      <section className={styles.toolbar} aria-label="Filter posted reports">
        <label className={styles.searchField}><FaSearch /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search item, location, category, or details" aria-label="Search reports" /></label>
        <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter report type">
          <option value="all">All reports</option><option value="lost">Lost items</option><option value="found">Found items</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter report status">
          <option value="all">All statuses</option><option value="open">Open</option><option value="claimed">Claimed</option><option value="matched">Matched</option>
        </select>
      </section>

      <div className={styles.resultLine}><strong>{filteredReports.length}</strong> reports matching your view</div>
      {loading ? <div className={styles.emptyState}>Loading posted reports...</div> : null}
      {!loading && error ? <div className={styles.emptyState} role="alert">{error}</div> : null}
      {!loading && !error && filteredReports.length === 0 ? <div className={styles.emptyState}><FaClipboardList /><h2>No reports found</h2><p>Try another keyword or adjust the report filters.</p></div> : null}
      {!loading && !error && filteredReports.length > 0 ? (
        <section className={styles.reportList}>
          {filteredReports.map((report) => (
            <article key={`${report.reportType}-${report.id}`} className={styles.reportCard}>
              <div className={`${styles.typeIcon} ${report.reportType === "found" ? styles.found : styles.lost}`}>
                {report.reportType === "found" ? <FaBoxOpen /> : <FaClipboardList />}
              </div>
              {report.imageUrls?.[0] ? (
                <div className={styles.reportImage}>
                  <Image
                    src={report.imageUrls[0]}
                    alt={`${report.itemName} ${report.reportType} item`}
                    fill
                    sizes="(max-width: 720px) 100vw, 140px"
                  />
                </div>
              ) : (
                <div className={`${styles.reportImage} ${styles.imagePlaceholder}`} aria-label="No item photo">
                  No photo
                </div>
              )}
              <div className={styles.reportBody}>
                <div className={styles.reportHeading}><div><span className={`${styles.typeLabel} ${report.reportType === "found" ? styles.foundLabel : ""}`}>{report.reportType} report</span><h2>{report.itemName}</h2></div><span className={styles.status}>{report.status || "open"}</span></div>
                <p>{report.description}</p>
                <div className={styles.metadata}><span><FaMapMarkerAlt /> {report.location}</span><span><FaCalendarAlt /> {formatDate(report.date)}</span><span>{report.category}</span></div>
                <Link href={`/reports/${report.id}?type=${report.reportType}`} className={styles.reportLink}>View report details</Link>
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