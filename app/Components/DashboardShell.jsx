"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  { href: "/admin/matches", label: "Match Center", icon: FaRobot },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail?.user) setSessionUser(event.detail.user);
    };

    window.addEventListener("echofind-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("echofind-profile-updated", handleProfileUpdate);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load notifications.");
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number.isInteger(data.unreadCount) ? data.unreadCount : 0);
      setNotificationError("");
      return true;
    } catch (error) {
      console.warn("Notifications are unavailable; showing the in-app error state.", error);
      setNotificationError(error.message || "Unable to load notifications.");
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load your session.");
        }
        if (isMounted) {
          setSessionUser(data.user ?? null);
        }
      } catch (error) {
        console.error("Failed to load dashboard session", error);
      }
    };

    void loadSession();
    void loadNotifications();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    const intervalId = window.setInterval(refreshWhenVisible, 15000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadNotifications]);

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
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await signOut({ redirectTo: "/" });
    } catch (error) {
      console.error("Failed to log out", error);
      setLogoutError("Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/foundItems?q=${encodeURIComponent(query)}` : "/foundItems");
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update notifications.");
      }
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notifications read", error);
      setNotificationError(error.message || "Unable to update notifications.");
    }
  };

  const markNotificationRead = async (notification) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update this notification.");
      }

      if (!notification.readAt) {
        const readAt = new Date().toISOString();
        setNotifications((current) =>
          current.map((item) => item.id === notification.id ? { ...item, readAt } : item)
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      setNotificationError("");
    } catch (error) {
      console.error("Failed to mark notification read", error);
      setNotificationError(error.message || "Unable to update this notification.");
    }
  };

  const handleNotificationClick = async (notification) => {
    setOpenPanel(null);
    if (!notification.readAt) {
      await markNotificationRead(notification);
    }

    if (notification.type === "match" && isAdmin) {
      router.push("/admin/matches");
    } else {
      router.push("/reports");
    }
  };

  const toggleNotifications = () => {
    const nextPanel = openPanel === "notifications" ? null : "notifications";
    setOpenPanel(nextPanel);
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
    <div className={`${styles.appShell} ${sidebarCollapsed ? styles.sidebarIsCollapsed : ""} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
      {/* Top Navigation Bar */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="dashboard-navigation"
          >
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
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
            placeholder="Search reports..."
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
          {/* Notifications Trigger & Panel */}
          <div className={styles.actionWrap}>
            <button
              type="button"
              className={`${styles.iconButton} ${openPanel === "notifications" ? styles.iconButtonActive : ""}`}
              aria-label="View notifications"
              aria-expanded={openPanel === "notifications"}
              aria-controls="dashboard-notifications"
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
              <div id="dashboard-notifications" className={`${styles.popover} ${styles.notificationsPopover}`} role="dialog" aria-label="Notifications panel">
                <div className={styles.popoverHeader}>
                  <div className={styles.popoverHeaderTitle}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 ? (
                      <span className={styles.unreadBadge}>{unreadCount} new</span>
                    ) : (
                      <span className={styles.allCaughtUpBadge}>All caught up</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.markReadBtn}
                      onClick={markAllNotificationsRead}
                    >
                      <FaCheck /> Mark all read
                    </button>
                  )}
                </div>

                {notificationError ? (
                  <p className={styles.notificationError} role="alert">{notificationError}</p>
                ) : null}

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
                        <button
                          type="button"
                          key={notification.id}
                          className={`${styles.notificationItem} ${isUnread ? styles.notificationUnread : ""}`}
                          onClick={() => handleNotificationClick(notification)}
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
                        </button>
                      );
                    })
                  ) : (
                    <div className={styles.emptyNotifications}>
                      <div className={styles.emptyIconCircle}>
                        <FaBell />
                      </div>
                      <strong>{notificationError ? "Notifications unavailable" : "No notifications yet"}</strong>
                      <p>
                        {notificationError
                          ? "Please try again in a moment."
                          : "You're up to date. New reports and confirmed matches will appear here."}
                      </p>
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
              aria-expanded={openPanel === "profile"}
              aria-controls="dashboard-profile-menu"
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
              <div id="dashboard-profile-menu" className={`${styles.popover} ${styles.profilePopover}`} role="menu" aria-label="User account menu">
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

                {/* Account actions */}
                <div className={styles.profileMenuLinks}>
                  <Link
                    href="/profile"
                    className={`${styles.profileMenuItem} ${pathname === "/profile" ? styles.profileMenuItemActive : ""}`}
                    onClick={() => setOpenPanel(null)}
                  >
                    <FaUser className={styles.menuItemIcon} />
                    <span>Edit profile</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/users"
                      className={`${styles.profileMenuItem} ${pathname === "/admin/users" ? styles.profileMenuItemActive : ""}`}
                      onClick={() => setOpenPanel(null)}
                    >
                      <FaShieldAlt className={styles.menuItemIcon} />
                      <span>Manage users</span>
                    </Link>
                  )}
                </div>

                <div className={styles.profileMenuDivider} />

                {/* Logout Button */}
                <button
                  type="button"
                  className={styles.profileLogoutBtn}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <FiLogOut />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </button>
                {logoutError ? <p className={styles.profileLogoutError} role="alert">{logoutError}</p> : null}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className={styles.body}>
        {mobileMenuOpen ? (
          <button
            type="button"
            className={styles.mobileMenuBackdrop}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
        ) : null}
        {/* Navigation Sidebar */}
        <aside className={styles.sidebar} id="dashboard-navigation">
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
                  onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
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
                      onClick={() => setMobileMenuOpen(false)}
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
