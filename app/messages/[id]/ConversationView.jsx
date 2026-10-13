"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaLock, FaPaperPlane } from "react-icons/fa";
import { FiShield } from "react-icons/fi";
import styles from "../messages.module.css";

export default function ConversationView({ conversationId }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerId, setViewerId] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load this conversation.");
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setViewerId(data.viewerId);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load this conversation.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages(true);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages();
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setError("");
    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send your message.");
      setDraft("");
      await loadMessages();
    } catch (sendError) {
      setError(sendError.message || "Unable to send your message.");
    } finally {
      setSending(false);
    }
  };

  const otherPerson = conversation
    ? (conversation.starterId === viewerId ? conversation.recipient : conversation.starter)
    : null;

  return (
    <main className={styles.chatPage}>
      <Link href="/messages" className={styles.backLink}><FaArrowLeft /> All messages</Link>
      <section className={styles.chatCard} aria-label="Conversation">
        {conversation ? (
          <header className={styles.chatHeader}>
            <span className={styles.avatar}>{(otherPerson?.name || "M").trim().charAt(0).toUpperCase()}</span>
            <div className={styles.chatHeaderText}>
              <p className={styles.eyebrow}>Item conversation</p>
              <h1>{otherPerson?.name || "EchoFind member"}</h1>
              <span>{conversation.reportType === "found" ? "Found item" : "Lost item"} · {conversation.itemName}</span>
            </div>
            <span className={styles.secureLabel}><FaLock /> Private</span>
          </header>
        ) : null}

        <div className={styles.chatNotice}>
          <FiShield />
          <span>Keep personal details private and arrange any handoff in a safe, public place.</span>
        </div>

        <div className={styles.messageHistory} aria-live="polite">
          {loading ? <p className={styles.historyState}>Loading conversation…</p> : null}
          {!loading && !error && messages.length === 0 ? (
            <p className={styles.historyState}>Start the conversation with a message about this item.</p>
          ) : null}
          {messages.map((message) => {
            const isMine = message.senderId === viewerId;
            return (
              <article
                className={`${styles.messageBubble} ${isMine ? styles.myMessage : styles.theirMessage}`}
                key={message.id}
              >
                <p>{message.body}</p>
                <time>{formatMessageTime(message.createdAt)}</time>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <form className={styles.composer} onSubmit={sendMessage}>
          <label className={styles.srOnly} htmlFor="message-draft">Write a message</label>
          <textarea
            id="message-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message about the item…"
            maxLength={2000}
            rows={2}
            disabled={loading || sending || !conversation}
          />
          <div className={styles.composerFooter}>
            <span>{draft.length}/2,000</span>
            <button type="submit" disabled={!draft.trim() || sending || !conversation}>
              <FaPaperPlane /> {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function formatMessageTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
