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

function formatReportDate(dateString) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? "Date not provided"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function MatchCenterPage() {
  const [foundReports, setFoundReports] = useState([]);
  const [lostReports, setLostReports] = useState([]);
  const [lostReportCount, setLostReportCount] = useState(0);
  const [selectedFoundReportId, setSelectedFoundReportId] = useState("");
  const [selectedLostReportId, setSelectedLostReportId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [manualReviewOpen, setManualReviewOpen] = useState(false);
  const [approvalCandidate, setApprovalCandidate] = useState(null);
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
      setLostReports(Array.isArray(data.lostReports) ? data.lostReports : []);
      setLostReportCount(data.lostReportCount || 0);
      setSelectedFoundReportId((current) => current || data.foundReports?.[0]?.id || "");
      setSelectedLostReportId((current) => current || data.lostReports?.[0]?.id || "");
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
    setApprovalCandidate(null);
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
          ? `EchoFind found ${data.matches.length} possible match${data.matches.length === 1 ? "" : "es"}. Review each suggestion and approve matches individually.`
          : "EchoFind found no likely matches for this report."
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

  const confirmMatch = async (suggestion, isManual = false) => {
    setConfirming(`${suggestion.lost.id}-${suggestion.found.id}`);
    setError("");
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isManual ? { action: "manualConfirm" } : {}),
          lostReportId: suggestion.lost.id,
          foundReportId: suggestion.found.id,
          ...(isManual ? {} : { score: suggestion.score, reasons: suggestion.reasons }),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to confirm match.");
      setFoundReports((current) => current.filter((report) => report.id !== suggestion.found.id));
      setLostReports((current) => current.filter((report) => report.id !== suggestion.lost.id));
      setLostReportCount((current) => Math.max(0, current - 1));
      setSelectedFoundReportId((current) => (
        current === suggestion.found.id
          ? foundReports.find((report) => report.id !== suggestion.found.id)?.id || ""
          : current
      ));
      setSelectedLostReportId((current) => (
        current === suggestion.lost.id
          ? lostReports.find((report) => report.id !== suggestion.lost.id)?.id || ""
          : current
      ));
      setSuggestions([]);
      setImagesAnalyzed(0);
      setImageWarnings([]);
      setManualReviewOpen(false);
      setApprovalCandidate(null);
      setNotice(
        `Match approved. ${
          data.notified
            ? "The people linked to these reports were notified."
            : "Neither report is linked to an account, so no notification was sent."
        }`
      );
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setConfirming(null);
    }
  };

  const manualLostReport = lostReports.find((report) => report.id === selectedLostReportId);
  const manualFoundReport = foundReports.find((report) => report.id === selectedFoundReportId);

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
                <h1>EchoFind Match Center</h1>
                <p>Review suggested matches and approve each confirmed item reunion.</p>
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
              <strong>Suggested matching:</strong> EchoFind compares available photos, item details,
              category, brand, color, location, description, and dates. Suggestions are not applied
              automatically. Review the reports and explicitly approve each match.
            </p>
          </section>

          <section className={styles.analysisControls}>
            <label htmlFor="found-report">Found report to analyze</label>
            <select
              id="found-report"
              value={selectedFoundReportId}
              onChange={(event) => {
                setSelectedFoundReportId(event.target.value);
                setManualReviewOpen(false);
                setApprovalCandidate(null);
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
              {analyzing ? <><FaSpinner /> Comparing reports...</> : <><FaRobot /> Find suggested matches</>}
            </button>
          </section>

          <section className={styles.manualPanel}>
            <div className={styles.manualHeader}>
              <div>
                <h2>Manual match review</h2>
                <p>Compare reports yourself and submit the same approval for a confirmed match.</p>
              </div>
              <span className={styles.manualBadge}>Admin review</span>
            </div>

            <div className={styles.manualFields}>
              <label>
                <span>Found report</span>
                <select
                  value={selectedFoundReportId}
                  onChange={(event) => {
                    setSelectedFoundReportId(event.target.value);
                    setManualReviewOpen(false);
                    setApprovalCandidate(null);
                  }}
                  disabled={loading || foundReports.length === 0 || confirming !== null}
                >
                  <option value="">Select a found report</option>
                  {foundReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.itemName} — {report.foundLocation}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Lost report</span>
                <select
                  value={selectedLostReportId}
                  onChange={(event) => {
                    setSelectedLostReportId(event.target.value);
                    setManualReviewOpen(false);
                    setApprovalCandidate(null);
                  }}
                  disabled={loading || lostReports.length === 0 || confirming !== null}
                >
                  <option value="">Select a lost report</option>
                  {lostReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.itemName} — {report.lostLocation}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!manualReviewOpen ? (
              <button
                type="button"
                className={styles.manualReviewButton}
                onClick={() => {
                  setError("");
                  setApprovalCandidate(null);
                  setManualReviewOpen(true);
                }}
                disabled={
                  loading ||
                  confirming !== null ||
                  !manualFoundReport ||
                  !manualLostReport
                }
              >
                Review selected reports
              </button>
            ) : (
              <div className={styles.manualConfirmation}>
                <div className={styles.manualComparison}>
                  <article>
                    <h3>Found report</h3>
                    <strong>{manualFoundReport?.itemName}</strong>
                    <span>{manualFoundReport?.category}</span>
                    <span>
                      {manualFoundReport?.foundLocation} · {formatReportDate(manualFoundReport?.foundDate)}
                    </span>
                    <p>{manualFoundReport?.description}</p>
                  </article>
                  <article>
                    <h3>Lost report</h3>
                    <strong>{manualLostReport?.itemName}</strong>
                    <span>{manualLostReport?.category}</span>
                    <span>
                      {manualLostReport?.lostLocation} · {formatReportDate(manualLostReport?.lostDate)}
                    </span>
                    <p>{manualLostReport?.description}</p>
                  </article>
                </div>
                <p>
                  Confirm that <strong>{manualFoundReport?.itemName}</strong> found at{" "}
                  <strong>{manualFoundReport?.foundLocation}</strong> is the same item as{" "}
                  <strong>{manualLostReport?.itemName}</strong>, reported lost at{" "}
                  <strong>{manualLostReport?.lostLocation}</strong>. Confirming marks both reports
                  as matched and notifies their account owners.
                </p>
                <div className={styles.manualActions}>
                  <button
                    type="button"
                    className={styles.manualCancelButton}
                    onClick={() => setManualReviewOpen(false)}
                    disabled={confirming !== null}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.manualReviewButton}
                    onClick={() => confirmMatch(
                      { found: manualFoundReport, lost: manualLostReport },
                      true
                    )}
                    disabled={confirming !== null}
                  >
                    {confirming ? "Approving match..." : "Approve manual match"}
                  </button>
                </div>
              </div>
            )}
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
            <p className={styles.analysisMeta}>EchoFind included {imagesAnalyzed} report photo{imagesAnalyzed === 1 ? "" : "s"} in the comparison.</p>
          ) : null}
          {imageWarnings.length > 0 ? (
            <p className={styles.imageWarning}>
              {imageWarnings.length} report photo{imageWarnings.length === 1 ? "" : "s"} could not be included. The comparison used the available report details and photos.
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
              <p>New found-item reports will appear here for comparison.</p>
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
              <p>Select a found report above to find possible matches.</p>
            </div>
          ) : null}

          {analyzing ? (
            <div className={styles.emptyState}>
              <FaSpinner /> EchoFind is comparing report details and photos...
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
                        <span className={styles.matchLabel}>EchoFind match suggestion · Review required</span>
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
                      <strong>Why this match was suggested</strong>
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
                        onClick={() => {
                          setError("");
                          setApprovalCandidate({ suggestion, isManual: false });
                        }}
                        disabled={Boolean(confirming)}
                      >
                        <FaCheck /> Review & approve
                      </button>
                    </div>
                    {approvalCandidate?.suggestion === suggestion ? (
                      <div className={styles.manualConfirmation} role="group" aria-label="Approve suggested match">
                        <p>
                          You are approving the suggested match between{" "}
                          <strong>{suggestion.lost.itemName}</strong> and{" "}
                          <strong>{suggestion.found.itemName}</strong>. This marks both reports as
                          matched and notifies their account owners. Verify the report details above
                          before continuing.
                        </p>
                        <div className={styles.manualActions}>
                          <button
                            type="button"
                            className={styles.manualCancelButton}
                            onClick={() => setApprovalCandidate(null)}
                            disabled={confirming !== null}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={styles.manualReviewButton}
                            onClick={() => confirmMatch(suggestion)}
                            disabled={confirming !== null}
                          >
                            {confirming === key ? "Approving match..." : "Approve this match"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ) : null}
      </>
    </DashboardShell>
  );
}