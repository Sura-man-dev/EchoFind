"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaCheck,
  FaLightbulb,
  FaMapMarkerAlt,
  FaRobot,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";
import DashboardShell from "../../Components/DashboardShell";
import styles from "./matches.module.css";

export default function MatchCenterPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadSuggestions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load match suggestions.");
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const filteredSuggestions = suggestions.filter(({ lost, found }) => {
    const text = [
      lost.itemName,
      found.itemName,
      lost.category,
      found.category,
      lost.lostLocation,
      found.foundLocation,
    ]
      .join(" ")
      .toLowerCase();
    return !query.trim() || text.includes(query.trim().toLowerCase());
  });

  const confirmMatch = async (suggestion) => {
    setConfirming(`${suggestion.lost.id}-${suggestion.found.id}`);
    setError("");
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lostReportId: suggestion.lost.id,
          foundReportId: suggestion.found.id,
          score: suggestion.score,
          reasons: suggestion.reasons,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to confirm match.");
      setSuggestions((current) => current.filter((item) => item !== suggestion));
      setNotice(
        data.notified
          ? "Match confirmed. The people linked to these reports were notified."
          : "Match confirmed. Neither report is linked to an account, so no notification was sent."
      );
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setConfirming(null);
    }
  };

  return (
    <DashboardShell>
      <>
          <section className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <span className={styles.aiMark}>
                <FaRobot />
              </span>
              <div>
                <p className={styles.eyebrow}>Admin workspace</p>
                <h1>AI Match Center</h1>
                <p>Review explainable suggestions before notifying a lost-item owner.</p>
              </div>
            </div>
            <div className={styles.summary}>
              <strong>{suggestions.length}</strong>
              <span>Suggestions</span>
            </div>
          </section>

          <section className={styles.infoBanner}>
            <FaLightbulb />
            <p>
              <strong>How it works:</strong> EchoFind compares item details, category, brand, color,
              location, description, and date to rank the most likely matches. You stay in control of
              every confirmation.
            </p>
          </section>

          <label className={styles.searchField}>
            <FaSearch />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search suggestions by item or location"
              aria-label="Search match suggestions"
            />
          </label>

          {notice ? <p className={styles.notice}>{notice}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          {loading ? (
            <div className={styles.emptyState}>
              <FaSpinner /> Loading suggestions...
            </div>
          ) : null}

          {!loading && filteredSuggestions.length === 0 ? (
            <div className={styles.emptyState}>
              <FaCheck />
              <h2>No match suggestions</h2>
              <p>New lost and found reports will be scored here automatically.</p>
            </div>
          ) : null}

          {!loading && filteredSuggestions.length > 0 ? (
            <section className={styles.matchList}>
              {filteredSuggestions.map((suggestion) => {
                const key = `${suggestion.lost.id}-${suggestion.found.id}`;
                return (
                  <article key={key} className={styles.matchCard}>
                    <div className={styles.matchTop}>
                      <div>
                        <span className={styles.matchLabel}>Suggested connection</span>
                        <h2>{suggestion.score}% confidence</h2>
                      </div>
                      <div
                        className={styles.scoreRing}
                        style={{ "--score": `${suggestion.score * 3.6}deg` }}
                      >
                        {suggestion.score}%
                      </div>
                    </div>

                    <div className={styles.comparison}>
                      <div className={styles.report}>
                        <span className={styles.lostTag}>Lost item</span>
                        <h3>{suggestion.lost.itemName}</h3>
                        <p>{suggestion.lost.description}</p>
                        <span>
                          <FaMapMarkerAlt /> {suggestion.lost.lostLocation}
                        </span>
                      </div>
                      <div className={styles.connector}>+</div>
                      <div className={styles.report}>
                        <span className={styles.foundTag}>Found item</span>
                        <h3>{suggestion.found.itemName}</h3>
                        <p>{suggestion.found.description}</p>
                        <span>
                          <FaMapMarkerAlt /> {suggestion.found.foundLocation}
                        </span>
                      </div>
                    </div>

                    <div className={styles.reasons}>
                      <strong>Why this is suggested</strong>
                      <ul>
                        {suggestion.reasons.slice(0, 4).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.cardActions}>
                      <Link href="/reports">Review reports</Link>
                      <button
                        type="button"
                        onClick={() => confirmMatch(suggestion)}
                        disabled={Boolean(confirming)}
                      >
                        {confirming === key ? (
                          "Confirming..."
                        ) : (
                          <>
                            <FaCheck /> Confirm match
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}
      </>
    </DashboardShell>
  );
}