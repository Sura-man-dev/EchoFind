"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCalendarAlt,
  FaCamera,
  FaClipboardList,
  FaHandshake,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import DashboardShell from "./DashboardShell";
import styles from "./Home.module.css";

const emptyStats = { lostCount: 0, foundCount: 0, messageCount: 0 };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(emptyStats);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [postsThisWeek, setPostsThisWeek] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSessionUser(data.user ?? null))
      .catch(() => {});

    Promise.all([
      fetch("/api/stats", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/reports/lost", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/reports/found", { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([statsData, lost, found]) => {
        setStats(statsData);
        const mergedPosts = [
          ...(Array.isArray(lost) ? lost : []).map((report) => ({
            ...report,
            postType: "lost",
            location: report.lostLocation,
            date: report.lostDate,
          })),
          ...(Array.isArray(found) ? found : []).map((report) => ({
            ...report,
            postType: "found",
            location: report.foundLocation,
            date: report.foundDate,
          })),
        ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
        setPosts(mergedPosts);
        setPostsThisWeek(
          mergedPosts.filter((post) => new Date(post.createdAt) > new Date(Date.now() - 7 * 86400000)).length
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visiblePosts = useMemo(() => {
    return posts.filter((post) => {
      const haystack = [post.itemName, post.category, post.description, post.location]
        .join(" ")
        .toLowerCase();
      return (
        (filter === "all" || post.postType === filter) &&
        (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      );
    });
  }, [filter, posts, query]);

  const greeting = getGreeting();
  const userName = sessionUser?.name ? sessionUser.name.split(" ")[0] : null;

  return (
    <DashboardShell>
      <section className={styles.heroCard}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Operations Overview</p>
          <h1>
            {greeting}
            {userName ? `, ${userName}` : ""}.
          </h1>
          <p className={styles.heroText}>
            Keep your community&apos;s lost and found activity organized, visible, and moving toward a prompt reunion.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push("/report")}>
            <FaPlus /> Report Lost Item
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.push("/foundreport")}>
            <FaBoxOpen /> Report Found Item
          </button>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <StatCard icon={<FaClipboardList />} title="Lost Items Reported" value={stats.lostCount} tone="blue" />
        <StatCard icon={<FaBoxOpen />} title="Found Items Registered" value={stats.foundCount} tone="green" />
        <StatCard icon={<FaHandshake />} title="Potential Matches" value={Math.min(stats.lostCount, stats.foundCount)} tone="orange" />
        <StatCard icon={<FaSearch />} title="Activity This Week" value={postsThisWeek} tone="slate" />
      </section>

      <section className={styles.feedPanel}>
        <div className={styles.feedHeader}>
          <div>
            <p className={styles.eyebrow}>Community Feed</p>
            <h2>Recent Item Reports</h2>
            <p>Review what people have reported across the community and open any post for complete details.</p>
          </div>
          <Link href="/reports" className={styles.viewAll}>
            View all reports <FaArrowRight />
          </Link>
        </div>

        <div className={styles.feedToolbar}>
          <label className={styles.searchField}>
            <FaSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by item name, place, or category..."
              aria-label="Search dashboard posts"
            />
          </label>
          <div className={styles.segmented}>
            <button
              type="button"
              className={filter === "all" ? styles.selected : ""}
              onClick={() => setFilter("all")}
            >
              All Items
            </button>
            <button
              type="button"
              className={filter === "lost" ? styles.selected : ""}
              onClick={() => setFilter("lost")}
            >
              Lost
            </button>
            <button
              type="button"
              className={filter === "found" ? styles.selected : ""}
              onClick={() => setFilter("found")}
            >
              Found
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading recent community activity...</p>
          </div>
        ) : null}

        {!loading && visiblePosts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconCircle}>
              <FaClipboardList />
            </div>
            <h3>No matching reports found</h3>
            <p>Try adjusting your search keywords or publish a new report to get started.</p>
          </div>
        ) : null}

        {!loading && visiblePosts.length > 0 ? (
          <div className={styles.postGrid}>
            {visiblePosts.slice(0, 12).map((post) => (
              <PostCard key={`${post.postType}-${post.id}`} post={post} />
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.actionGrid}>
        <ActionCard
          icon={<FaClipboardList />}
          title="Have you lost something?"
          text="Post detailed specifications and pictures to help finder identify your property swiftly."
          button="Create Lost Report"
          href="/report"
          tone="blue"
        />
        <ActionCard
          icon={<FaBoxOpen />}
          title="Found someone's property?"
          text="Report the location and item description to connect with the rightful owner quickly."
          button="Create Found Report"
          href="/foundreport"
          tone="green"
        />
      </section>
    </DashboardShell>
  );
}

function PostCard({ post }) {
  return (
    <article className={styles.postCard}>
      <div className={styles.postTop}>
        <span className={`${styles.typePill} ${post.postType === "found" ? styles.found : styles.lost}`}>
          {post.postType}
        </span>
        <span className={styles.status}>{post.status || "open"}</span>
      </div>

      <div className={styles.postImageWrap}>
        {post.imageUrls?.[0] ? (
          <Image
            src={post.imageUrls[0]}
            alt={`${post.itemName} ${post.postType} item`}
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className={styles.postImg}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <FaCamera className={styles.placeholderIcon} />
            <span>No image provided</span>
          </div>
        )}
      </div>

      <h3 className={styles.postTitle} title={post.itemName}>{post.itemName}</h3>
      <p className={styles.postDescription}>{post.description}</p>

      <div className={styles.postMeta}>
        <span>
          <FaMapMarkerAlt /> {post.location || "Location not specified"}
        </span>
        <span>
          <FaCalendarAlt /> {formatDate(post.date)}
        </span>
      </div>

      <div className={styles.postFooter}>
        <span className={styles.categoryBadge}>{post.category || "General"}</span>
        <Link href={`/reports/${post.id}?type=${post.postType}`} className={styles.detailsLink}>
          View details <FaArrowRight />
        </Link>
      </div>
    </article>
  );
}

function StatCard({ icon, title, value, tone }) {
  return (
    <article className={styles.statCard}>
      <div className={`${styles.statIcon} ${styles[tone]}`}>{icon}</div>
      <div className={styles.statInfo}>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function ActionCard({ icon, title, text, button, href, tone }) {
  return (
    <article className={styles.actionCard}>
      <div className={`${styles.quickIcon} ${styles[tone]}`}>{icon}</div>
      <div className={styles.actionCardContent}>
        <h3>{title}</h3>
        <p>{text}</p>
        <Link href={href} className={styles.actionLink}>
          {button} <FaArrowRight />
        </Link>
      </div>
    </article>
  );
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
    : "Date not provided";
}

