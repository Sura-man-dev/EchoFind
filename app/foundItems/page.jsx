"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaBoxOpen, FaCalendarAlt, FaMapMarkerAlt, FaPlus, FaRedo, FaSearch } from "react-icons/fa";
import DashboardShell from "../Components/DashboardShell";
import styles from "./foundItems.module.css";

export default function FoundItemsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reports/found", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.error || "Unable to load found items.");
      }

      setReports(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    loadReports();
  }, []);

  const categories = [...new Set(reports.map((report) => report.category).filter(Boolean))];
  const filteredReports = reports.filter((report) => {
    const haystack = [report.itemName, report.description, report.foundLocation, report.category]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesCategory = category === "all" || report.category === category;
    const matchesStatus = status === "all" || (report.status || "open") === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });

  return (
    <DashboardShell>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Inventory</p>
          <h1>Found items</h1>
          <p>Review recently reported items and help reconnect them with their owners.</p>
        </div>
        <Link href="/foundreport" className={styles.primaryButton}>
          <FaPlus />
          Report found item
        </Link>
      </section>

      <section className={styles.toolbar} aria-label="Filter found items">
        <label className={styles.searchField}>
          <FaSearch />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by item, place, or details"
            aria-label="Search found items"
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((itemCategory) => <option key={itemCategory} value={itemCategory}>{itemCategory}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
        </select>
        <button type="button" className={styles.refreshButton} onClick={loadReports} aria-label="Refresh found items">
          <FaRedo />
        </button>
      </section>

      <div className={styles.resultsSummary}>
        <strong>{filteredReports.length}</strong> {filteredReports.length === 1 ? "item" : "items"} shown
        <span>{reports.length} total reports</span>
      </div>

      {loading ? <div className={styles.emptyState}>Loading found items...</div> : null}
      {!loading && error ? <div className={styles.errorState}>{error}</div> : null}
      {!loading && !error && filteredReports.length === 0 ? (
        <div className={styles.emptyState}>
          <FaBoxOpen />
          <h2>No matching items</h2>
          <p>Try another search or report a found item to start building the inventory.</p>
        </div>
      ) : null}

      {!loading && !error && filteredReports.length > 0 ? (
        <section className={styles.itemsGrid}>
          {filteredReports.map((report) => (
            <article key={report.id} className={styles.itemCard}>
              <div className={styles.cardTopline}>
                <span className={styles.category}>{report.category || "Uncategorised"}</span>
                <span className={`${styles.status} ${report.status === "claimed" ? styles.claimed : ""}`}>
                  {report.status || "open"}
                </span>
              </div>
              <h2>{report.itemName}</h2>
              {report.imageUrls?.[0] ? <div className={styles.itemImage}><Image src={report.imageUrls[0]} alt={`${report.itemName} found item`} fill sizes="(max-width: 720px) 100vw, (max-width: 1050px) 50vw, 33vw" /></div> : <div className={`${styles.itemImage} ${styles.imagePlaceholder}`}>No photo</div>}
              <p className={styles.description}>{report.description}</p>
              <div className={styles.metadata}>
                <span><FaMapMarkerAlt /> {report.foundLocation}</span>
                <span><FaCalendarAlt /> {formatDate(report.foundDate)}</span>
              </div>
              <div className={styles.cardFooter}>
                <span>{report.contactName || "Anonymous finder"}</span>
                <Link href={`/foundreport?item=${report.id}`}>View details</Link>
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