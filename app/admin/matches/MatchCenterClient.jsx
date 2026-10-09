"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaBrain,
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
  const [foundReports, setFoundReports] = useState([]);
  const [lostReportCount, setLostReportCount] = useState(0);
  const [selectedFoundReportId, setSelectedFoundReportId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [imagesAnalyzed, setImagesAnalyzed] = useState(0);
  const [imageWarnings, setImageWarnings] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load found reports.");
      setFoundReports(Array.isArray(data.foundReports) ? data.foundReports : []);
      setLostReportCount(data.lostReportCount || 0);
      setSelectedFoundReportId((current) => current || data.foundReports?.[0]?.id || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const analyzeFoundReport = async () => {
    if (!selectedFoundReportId) return;

    setAnalyzing(true);
    setError("");
    setNotice("");
    setSuggestions([]);
    setImageWarnings([]);
    setImagesAnalyzed(0);
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", foundReportId: selectedFoundReportId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to analyze this found report.");

      setSuggestions(Array.isArray(data.matches) ? data.matches : []);
      setImageWarnings(Array.isArray(data.imageWarnings) ? data.imageWarnings : []);
      setImagesAnalyzed(data.imagesAnalyzed || 0);
      setNotice(
        data.matches?.length
          ? `Gemini analyzed the report and found ${data.matches.length} possible match${data.matches.length === 1 ? "" : "es"}.`
          : "Gemini analyzed the report and found no likely matches."
      );
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredSuggestions = suggestions.filter(({ lost, found }) => {
    const text = [
      lost.itemName,
      found.itemName,
      lost.category,
      found.category,
      lost.lostLocation,
      found.foundLocation,
      lost.description,
      found.description,
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
      setFoundReports((current) => current.filter((report) => report.id !== suggestion.found.id));
      setLostReportCount((current) => Math.max(0, current - 1));
      setSelectedFoundReportId((current) => (
        current === suggestion.found.id
          ? foundReports.find((report) => report.id !== suggestion.found.id)?.id || ""
          : current
      ));
      setSuggestions([]);
      setImagesAnalyzed(0);
      setImageWarnings([]);
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
                <FaBrain />
              </span>
              <div>
                <p className={styles.eyebrow}>Admin workspace</p>
                <h1>AI Match Center</h1>
                <p>Ask Gemini to compare found reports with open lost reports.</p>
              </div>
            </div>
            <div className={styles.summary}>
              <strong>{foundReports.length}</strong>
              <span>Open found reports</span>
            </div>
          </section>

          <section className={styles.infoBanner}>
            <FaLightbulb />
            <p>
              <strong>How it works:</strong> Select a found report to have Gemini compare its photo,
              item details, category, brand, color, location, description, and date/time with open
              lost reports. Gemini suggests matches, but you stay in control of every confirmation.
            </p>
          </section>

          <section className={styles.analysisControls}>
            <label htmlFor="found-report">Found report to analyze</label>
            <select
              id="found-report"
              value={selectedFoundReportId}
              onChange={(event) => {
                setSelectedFoundReportId(event.target.value);
                setSuggestions([]);
                setNotice("");
                setError("");
                setImagesAnalyzed(0);
                setImageWarnings([]);
              }}
              disabled={loading || foundReports.length === 0 || analyzing}
            >
              {foundReports.length === 0 ? <option value="">No open found reports</option> : null}
              {foundReports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.itemName} - {report.foundLocation}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={analyzeFoundReport}
              disabled={loading || analyzing || !selectedFoundReportId || lostReportCount === 0}
            >
              {analyzing ? <><FaSpinner /> Analyzing with Gemini...</> : <><FaRobot /> Analyze with Gemini</>}
            </button>
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
          {imagesAnalyzed > 0 ? (
            <p className={styles.analysisMeta}>Gemini analyzed {imagesAnalyzed} report photo{imagesAnalyzed === 1 ? "" : "s"}.</p>
          ) : null}
          {imageWarnings.length > 0 ? (
            <p className={styles.imageWarning}>
              {imageWarnings.length} report photo{imageWarnings.length === 1 ? "" : "s"} could not be included in the visual analysis. Gemini compared the available report details and photos.
            </p>
          ) : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          {loading ? (
            <div className={styles.emptyState}>
              <FaSpinner /> Loading found reports...
            </div>
          ) : null}

          {!loading && foundReports.length === 0 ? (
            <div className={styles.emptyState}>
              <FaCheck />
              <h2>No open found reports</h2>
              <p>New found-item reports will appear here for Gemini analysis.</p>
            </div>
          ) : null}

          {!loading && foundReports.length > 0 && lostReportCount === 0 ? (
            <div className={styles.emptyState}>
              <FaCheck />
              <h2>No open lost reports to compare</h2>
              <p>New lost-item reports will be available for analysis here.</p>
            </div>
          ) : null}

          {!loading && foundReports.length > 0 && lostReportCount > 0 && !analyzing && suggestions.length === 0 && !notice ? (
            <div className={styles.emptyState}>
              <FaRobot />
              <h2>Ready to analyze</h2>
              <p>Select a found report above and ask Gemini to find possible matches.</p>
            </div>
          ) : null}

          {analyzing ? (
            <div className={styles.emptyState}>
              <FaSpinner /> Gemini is comparing report details and photos...
            </div>
          ) : null}

          {!loading && !analyzing && suggestions.length > 0 && filteredSuggestions.length === 0 ? (
            <div className={styles.emptyState}>
              <FaSearch />
              <h2>No suggestions match your search</h2>
              <p>Try another item name or location.</p>
            </div>
          ) : null}

          {!loading && !analyzing && filteredSuggestions.length > 0 ? (
            <section className={styles.matchList}>
              {filteredSuggestions.map((suggestion) => {
                const key = `${suggestion.lost.id}-${suggestion.found.id}`;
                return (
                  <article key={key} className={styles.matchCard}>
                    <div className={styles.matchTop}>
                      <div>
                        <span className={styles.matchLabel}>Gemini suggestion</span>
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
                      <strong>Why Gemini suggests this match</strong>
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