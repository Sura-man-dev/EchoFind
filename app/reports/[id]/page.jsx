"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCalendarAlt, FaEnvelope, FaMapMarkerAlt, FaPhone, FaTag } from "react-icons/fa";
import DashboardShell from "../../Components/DashboardShell";
import styles from "./detail.module.css";

export default function ReportDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") === "found" ? "found" : "lost";
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reports/${type}/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load report.");
        setReport(data);
      })
      .catch((loadError) => setError(loadError.message));
  }, [id, type]);

  return (
    <DashboardShell>
      <Link href="/" className={styles.backLink}><FaArrowLeft /> Back to dashboard</Link>
      {error ? <div className={styles.state}>{error}</div> : null}
      {!report && !error ? <div className={styles.state}>Loading report details...</div> : null}
      {report ? (
        <article className={styles.detailCard}>
          <header className={styles.detailHeader}>
            <div>
              <span className={`${styles.typeLabel} ${type === "found" ? styles.found : ""}`}>{type} report</span>
              <h1>{report.itemName}</h1>
              {report.imageUrls?.[0] ? <div className={styles.detailImage}><Image src={report.imageUrls[0]} alt={`${report.itemName} ${type} item`} fill sizes="(max-width: 800px) 100vw, 680px" /></div> : null}
              <p>{report.description}</p>
            </div>
            <span className={styles.status}>{report.status || "open"}</span>
          </header>
          <div className={styles.detailGrid}>
            <Detail label="Category" value={report.category} icon={<FaTag />} />
            <Detail label={type === "found" ? "Found location" : "Lost location"} value={type === "found" ? report.foundLocation : report.lostLocation} icon={<FaMapMarkerAlt />} />
            <Detail label={type === "found" ? "Date found" : "Date lost"} value={formatDate(type === "found" ? report.foundDate : report.lostDate)} icon={<FaCalendarAlt />} />
            <Detail label="Brand / color" value={[report.brand, report.color].filter(Boolean).join(" / ") || "Not provided"} icon={<FaTag />} />
          </div>
          <section className={styles.section}><h2>Additional details</h2><p>{report.locationDetails || "No additional location details were provided."}</p></section>
          <section className={styles.contact}><div><h2>Contact information</h2><p>Use these details to coordinate a safe handoff.</p></div><div className={styles.contactDetails}>{report.contactEmail ? <a href={`mailto:${report.contactEmail}`}><FaEnvelope /> {report.contactEmail}</a> : null}{report.contactPhone ? <a href={`tel:${report.contactPhone}`}><FaPhone /> {report.contactPhone}</a> : null}<span>{report.contactName || "Contact not provided"}</span></div></section>
        </article>
      ) : null}
    </DashboardShell>
  );
}

function Detail({ label, value, icon }) { return <div className={styles.detailItem}><span>{icon}</span><div><small>{label}</small><strong>{value || "Not provided"}</strong></div></div>; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not provided"; }