"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { signOut } from "next-auth/react";
import {
  FaBell,
  FaBoxOpen,
  FaCheck,
  FaCheckCircle,
  FaClipboardList,
  FaFileAlt,
  FaHome,
  FaPlus,
  FaSearch,
  FaRobot,
  FaUser,
  FaShieldAlt,
  FaChevronDown,
  FaArrowRight,
} from "react-icons/fa";
import { FiLogOut, FiMenu, FiSidebar, FiX } from "react-icons/fi";
import styles from "./DashboardShell.module.css";

const primaryNavigation = [
  { href: "/", label: "Home", icon: FaHome, match: ["/"] },
  { href: "/report", label: "Report Lost Item", icon: FaPlus, match: ["/report"] },
  { href: "/foundreport", label: "Report Found Item", icon: FaBoxOpen, match: ["/foundreport"] },
  { href: "/foundItems", label: "Found Items", icon: FaSearch, match: ["/foundItems"] },
];

const secondaryNavigation = [
  { href: "/reports", label: "My Reports", icon: FaFileAlt },
];

const adminNavigation = [
  { href: "/admin/matches", label: "AI Match Center", icon: FaRobot },
  { href: "/admin/users", label: "Manage Users", icon: FaUser },
];

const sidebarPreference = {
  subscribe(onChange) {
    window.addEventListener("echofind-sidebar-change", onChange);
    return () => window.removeEventListener("echofind-sidebar-change", onChange);
  },
  getSnapshot() {
    return window.localStorage.getItem("echofind-sidebar") === "collapsed";
  },
  getServerSnapshot() {
    return false;
  },
};

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef(null);
  const actionsWrapRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);

  const sidebarCollapsed = useSyncExternalStore(
    sidebarPreference.subscribe,
    sidebarPreference.getSnapshot,
    sidebarPreference.getServerSnapshot
  );

  const toggleSidebar = () => {
    window.localStorage.setItem("echofind-sidebar", sidebarCollapsed ? "expanded" : "collapsed");
    window.dispatchEvent(new Event("echofind-sidebar-change"));
  };

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSessionUser(data.user ?? null))
      .catch(() => {});

    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  // Close panels on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsWrapRef.current && !actionsWrapRef.current.contains(event.target)) {
        setOpenPanel(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
      // Quick search shortcut (Ctrl+K or Cmd+K)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.refresh();
    router.push("/");
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/foundItems?q=${encodeURIComponent(query)}` : "/foundItems");
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
      );
    } catch (error) {
      console.error("Failed to mark notifications read", error);
    }
  };

  const toggleNotifications = () => {
    const nextPanel = openPanel === "notifications" ? null : "notifications";
    setOpenPanel(nextPanel);
    if (nextPanel === "notifications" && unreadCount > 0) {
      markAllNotificationsRead();
    }
  };

  const isAdmin = sessionUser?.role === "admin";
  const displayName = sessionUser?.name || sessionUser?.email?.split("@")[0] || "Member";
  const userEmail = sessionUser?.email || "EchoFind Member";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`${styles.appShell} ${sidebarCollapsed ? styles.sidebarIsCollapsed : ""}`}>
      {/* Top Navigation Bar */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
          >
            <FiSidebar />
          </button>

          <Link href="/" className={styles.logo}>
            <div className={styles.logoIconWrap}>
              <Image
                src="/logo.png"
                alt="EchoFind Logo"
                width={36}
                height={36}
                priority
              />
            </div>
            <span className={styles.logoText}>EchoFind</span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form className={styles.searchBox} onSubmit={handleSearch}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search items, locations, reports..."
            aria-label="Search items or locations"
          />
          {searchTerm ? (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => {
                setSearchTerm("");
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          ) : (
            <span className={styles.searchShortcut}>
              <kbd>Ctrl</kbd> <kbd>K</kbd>
            </span>
          )}
        </form>

        {/* Action Controls */}
        <div className={styles.topActions} ref={actionsWrapRef}>
          {/* Quick Create Report CTA */}
          <Link href="/report" className={styles.quickReportBtn} title="Report lost item">
            <FaPlus />
            <span className={styles.quickReportLabel}>Report Item</span>
          </Link>

          <div className={styles.actionDivider} />

          {/* Notifications Trigger & Panel */}
          <div className={styles.actionWrap}>
            <button
              type="button"
              className={`${styles.iconButton} ${openPanel === "notifications" ? styles.iconButtonActive : ""}`}
              aria-label="View notifications"
              onClick={toggleNotifications}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span className={styles.notificationDot} aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {openPanel === "notifications" && (
              <div className={`${styles.popover} ${styles.notificationsPopover}`} role="dialog" aria-label="Notifications panel">
                <div className={styles.popoverHeader}>
                  <div className={styles.popoverHeaderTitle}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 ? (
                      <span className={styles.unreadBadge}>{unreadCount} new</span>
                    ) : (
                      <span className={styles.allCaughtUpBadge}>All caught up</span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className={styles.markReadBtn}
                      onClick={markAllNotificationsRead}
                    >
                      <FaCheck /> Mark all read
                    </button>
                  )}
                </div>

                <div className={styles.notificationsList}>
                  {notifications.length > 0 ? (
                    notifications.slice(0, 6).map((notification) => {
                      const isUnread = !notification.readAt;
                      let IconComponent = FaBell;
                      let iconToneClass = styles.iconToneBlue;

                      if (notification.type === "match") {
                        IconComponent = FaRobot;
                        iconToneClass = styles.iconTonePurple;
                      } else if (notification.type === "found") {
                        IconComponent = FaBoxOpen;
                        iconToneClass = styles.iconToneGreen;
                      } else if (notification.type === "lost") {
                        IconComponent = FaClipboardList;
                        iconToneClass = styles.iconToneBlue;
                      }

                      return (
                        <div
                          key={notification.id}
                          className={`${styles.notificationItem} ${isUnread ? styles.notificationUnread : ""}`}
                          onClick={() => {
                            setOpenPanel(null);
                            if (notification.type === "match") {
                              if (isAdmin) {
                                router.push("/admin/matches");
                              } else {
                                router.push("/reports");
                              }
                            } else {
                              router.push("/reports");
                            }
                          }}
                        >
                          <div className={`${styles.notificationIconWrap} ${iconToneClass}`}>
                            <IconComponent />
                          </div>
                          <div className={styles.notificationContent}>
                            <div className={styles.notificationItemHeader}>
                              <strong>{notification.title}</strong>
                              <span className={styles.notificationTime}>
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            <p>{notification.message}</p>
                          </div>
                          {isUnread && <span className={styles.unreadDot} />}
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyNotifications}>
                      <div className={styles.emptyIconCircle}>
                        <FaBell />
                      </div>
                      <strong>No notifications yet</strong>
                      <p>You&apos;re completely up to date. We&apos;ll notify you when an item match or status update happens.</p>
                    </div>
                  )}
                </div>

                <div className={styles.popoverFooter}>
                  <Link
                    href="/reports"
                    className={styles.footerLink}
                    onClick={() => setOpenPanel(null)}
                  >
                    View my reports <FaArrowRight />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Trigger & Panel */}
          <div className={styles.actionWrap}>
            <button
              type="button"
              className={`${styles.profileTrigger} ${openPanel === "profile" ? styles.profileTriggerActive : ""}`}
              aria-label="User profile menu"
              onClick={() => setOpenPanel(openPanel === "profile" ? null : "profile")}
            >
              <div className={styles.avatarWrap}>
                {sessionUser?.image ? (
                  <Image
                    className={styles.avatarImage}
                    src={sessionUser.image}
                    alt={displayName}
                    width={36}
                    height={36}
                  />
                ) : (
                  <span className={styles.avatarFallback}>{initials}</span>
                )}
                <span className={styles.onlineBadge} />
              </div>

              <div className={styles.profileTriggerInfo}>
                <span className={styles.profileTriggerName}>{displayName.split(" ")[0]}</span>
                <FaChevronDown className={`${styles.chevron} ${openPanel === "profile" ? styles.chevronRotated : ""}`} />
              </div>
            </button>

            {openPanel === "profile" && (
              <div className={`${styles.popover} ${styles.profilePopover}`} role="menu" aria-label="User account menu">
                {/* Profile Card Header */}
                <div className={styles.profileHeaderCard}>
                  <div className={styles.avatarLargeWrap}>
                    {sessionUser?.image ? (
                      <Image
                        className={styles.avatarLargeImage}
                        src={sessionUser.image}
                        alt={displayName}
                        width={46}
                        height={46}
                      />
                    ) : (
                      <span className={styles.avatarLargeFallback}>{initials}</span>
                    )}
                    <span className={styles.onlineLargeBadge} />
                  </div>
                  <div className={styles.profileHeaderDetails}>
                    <strong>{displayName}</strong>
                    <span className={styles.profileHeaderEmail} title={userEmail}>
                      {userEmail}
                    </span>
                    <div className={styles.roleContainer}>
                      {isAdmin ? (
                        <span className={styles.roleAdmin}>
                          <FaShieldAlt /> Administrator
                        </span>
                      ) : (
                        <span className={styles.roleMember}>
                          <FaCheckCircle /> Community Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Navigation Links */}
                <div className={styles.profileMenuLinks}>
                  <Link
                    href="/reports"
                    className={styles.profileMenuItem}
                    onClick={() => setOpenPanel(null)}
                  >
                    <FaFileAlt className={styles.menuItemIcon} />
                    <span>My Reports</span>
                  </Link>

                  <Link
                    href="/report"
                    className={styles.profileMenuItem}
                    onClick={() => setOpenPanel(null)}
                  >
                    <FaPlus className={styles.menuItemIcon} />
                    <span>Report Lost Item</span>
                  </Link>

                  <Link
                    href="/foundreport"
                    className={styles.profileMenuItem}
                    onClick={() => setOpenPanel(null)}
                  >
                    <FaBoxOpen className={styles.menuItemIcon} />
                    <span>Report Found Item</span>
                  </Link>

                  <Link
                    href="/foundItems"
                    className={styles.profileMenuItem}
                    onClick={() => setOpenPanel(null)}
                  >
                    <FaSearch className={styles.menuItemIcon} />
                    <span>Browse Found Items</span>
                  </Link>

                  {isAdmin && (
                    <>
                      <div className={styles.menuSectionDivider} />
                      <div className={styles.menuSectionLabel}>Admin Workspace</div>

                      <Link
                        href="/admin/matches"
                        className={styles.profileMenuItem}
                        onClick={() => setOpenPanel(null)}
                      >
                        <FaRobot className={styles.menuItemIcon} />
                        <span>AI Match Center</span>
                      </Link>

                      <Link
                        href="/admin/users"
                        className={styles.profileMenuItem}
                        onClick={() => setOpenPanel(null)}
                      >
                        <FaUser className={styles.menuItemIcon} />
                        <span>Manage Users</span>
                      </Link>
                    </>
                  )}
                </div>

                <div className={styles.profileMenuDivider} />

                {/* Logout Button */}
                <button
                  type="button"
                  className={styles.profileLogoutBtn}
                  onClick={handleLogout}
                >
                  <FiLogOut />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className={styles.body}>
        {/* Navigation Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarHeaderLabel}>Workspace</span>
            <button
              type="button"
              className={styles.sidebarMenu}
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FiMenu />
            </button>
          </div>

          <div className={styles.navGroup}>
            {primaryNavigation.map(({ href, label, icon: Icon, match }) => {
              const isActive = match.includes(pathname);

              return (
                <Link
                  key={href}
                  href={href}
                  title={sidebarCollapsed ? label : undefined}
                  className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                >
                  <span className={styles.menuIconWrap}>
                    <Icon />
                  </span>
                  <span className={styles.menuLabel}>{label}</span>
                  {isActive && <span className={styles.activeIndicator} />}
                </Link>
              );
            })}
          </div>

          <div className={styles.sidebarDivider} />

          <div className={styles.navGroup}>
            {secondaryNavigation.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  title={sidebarCollapsed ? label : undefined}
                  className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                >
                  <span className={styles.menuIconWrap}>
                    <Icon />
                  </span>
                  <span className={styles.menuLabel}>{label}</span>
                  {isActive && <span className={styles.activeIndicator} />}
                </Link>
              );
            })}
          </div>

          {isAdmin && (
            <>
              <div className={styles.sidebarDivider} />
              <div className={styles.sidebarHeader}>
                <span className={styles.sidebarHeaderLabel}>Admin</span>
              </div>
              <div className={styles.navGroup}>
                {adminNavigation.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={label}
                      href={href}
                      title={sidebarCollapsed ? label : undefined}
                      className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                    >
                      <span className={styles.menuIconWrap}>
                        <Icon />
                      </span>
                      <span className={styles.menuLabel}>{label}</span>
                      {isActive && <span className={styles.activeIndicator} />}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <div className={styles.sidebarDivider} />

          <div className={styles.navGroup}>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.logoutMenuItem}`}
              onClick={handleLogout}
              title={sidebarCollapsed ? "Log Out" : undefined}
            >
              <span className={styles.menuIconWrap}>
                <FiLogOut />
              </span>
              <span className={styles.menuLabel}>Log Out</span>
            </button>
          </div>

          {/* Quick Help & Tips Card */}
          <div className={styles.helpCard}>
            <div className={styles.helpIcon}>
              <FaClipboardList />
            </div>
            <h3>Keep reports detailed</h3>
            <p>High-resolution photos and accurate locations boost item recovery by over 80%.</p>
            <Link href="/report" className={styles.helpCardLink}>
              File a report <FaArrowRight />
            </Link>
          </div>
        </aside>

        {/* Dynamic Route Content */}
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
