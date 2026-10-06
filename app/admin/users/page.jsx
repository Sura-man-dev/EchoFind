"use client";

import { useEffect, useState } from "react";
import { FaShieldAlt, FaUserFriends, FaSpinner } from "react-icons/fa";
import DashboardShell from "../../Components/DashboardShell";
import styles from "./users.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null);

  const loadUsers = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load users.");
      setUsers(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const updateRole = async (userId, role) => {
    setSaving(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update this user.");
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, role: data.role } : user));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardShell>
      <section className={styles.header}>
        <div className={styles.titleBlock}><span className={styles.icon}><FaUserFriends /></span><div><p className={styles.eyebrow}>Admin workspace</p><h1>User management</h1><p>Review accounts and control who can access administrative tools.</p></div></div>
        <strong className={styles.count}>{users.length}<small> accounts</small></strong>
      </section>
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <div className={styles.empty}><FaSpinner /> Loading users...</div> : null}
      {!loading && !users.length ? <div className={styles.empty}>No users found.</div> : null}
      {!loading && users.length ? <section className={styles.tableWrap}><table><thead><tr><th>User</th><th>Role</th><th>Reports</th><th>Joined</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className={styles.userCell}><span className={styles.avatar}>{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</span><span><strong>{user.name || "Unnamed user"}</strong><small>{user.email}</small></span></div></td><td><span className={`${styles.role} ${user.role === "admin" ? styles.admin : ""}`}><FaShieldAlt /> {user.role}</span></td><td>{user._count.lostReports + user._count.foundReports}</td><td>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(user.createdAt))}</td><td><button type="button" disabled={saving === user.id} onClick={() => updateRole(user.id, user.role === "admin" ? "user" : "admin")}>{saving === user.id ? "Saving..." : user.role === "admin" ? "Make user" : "Make admin"}</button></td></tr>)}</tbody></table></section> : null}
    </DashboardShell>
  );
}
