"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FaArrowRight, FaComments, FaLock } from "react-icons/fa";
import styles from "./messages.module.css";

export default function MessagesInbox() {
  const [conversations, setConversations] = useState([]);
  const [viewerId, setViewerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your messages.");
      setConversations(data.conversations || []);
      setViewerId(data.viewerId || "");
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load your messages.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations(true);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadConversations();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadConversations]);

  return (
    <main className={styles.inboxPage}>
      <header className={styles.pageHeader}>
        <div className={styles.headerIcon}><FaComments /></div>
        <div>
          <p className={styles.eyebrow}>Private item discussions</p>
          <h1>Your messages</h1>
          <p>Coordinate with other community members to safely reunite people with their belongings.</p>
        </div>
      </header>

      <section className={styles.inboxCard} aria-label="Your conversations">
        <div className={styles.sectionHeader}>
          <div>
            <h2>Conversations</h2>
            <p>Messages stay between you and the other participant.</p>
          </div>
          <span className={styles.secureLabel}><FaLock /> Private</span>
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {loading ? <div className={styles.emptyState}>Loading your conversations…</div> : null}
        {!loading && !error && conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}><FaComments /></span>
            <h3>No conversations yet</h3>
            <p>Open a lost or found item report and message its reporter to start coordinating.</p>
            <Link href="/reports" className={styles.browseLink}>Browse item reports <FaArrowRight /></Link>
          </div>
        ) : null}

        {!loading && conversations.length > 0 ? (
          <div className={styles.conversationList}>
            {conversations.map((conversation) => {
              const otherPerson = conversation.starterId === viewerId
                ? conversation.recipient
                : conversation.starter;
              const latestMessage = conversation.messages[0];
              return (
                <Link
                  className={styles.conversationRow}
                  href={`/messages/${conversation.id}`}
                  key={conversation.id}
                >
                  <span className={styles.avatar}>
                    {(otherPerson?.name || "M").trim().charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.conversationContent}>
                    <span className={styles.conversationTop}>
                      <strong>{otherPerson?.name || "EchoFind member"}</strong>
                      <time>{formatDate(latestMessage?.createdAt || conversation.updatedAt)}</time>
                    </span>
                    <span className={styles.itemName}>
                      {conversation.reportType === "found" ? "Found item" : "Lost item"} · {conversation.itemName}
                    </span>
                    <span className={styles.preview}>
                      {latestMessage?.body || "Conversation started — send a message to coordinate."}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span className={styles.unreadBadge} aria-label={`${conversation.unreadCount} unread messages`}>
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                  ) : null}
                  <FaArrowRight className={styles.rowArrow} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
