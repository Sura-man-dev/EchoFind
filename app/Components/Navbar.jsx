"use client";

import styles from "./Navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import SignupModal from "./Signup";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authUser, setAuthUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const isDashboardRoute = ["/", "/report", "/foundreport", "/foundItems", "/reports", "/admin/matches"].includes(pathname);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const data = await response.json();

        if (isMounted) {
          setAuthUser(data.user ?? null);
        }
      } catch (error) {
        console.error("Failed to load session", error);
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user) => {
    setAuthUser(user);
    setShowAuthModal(false);
    router.refresh();
  };

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

  if (isDashboardRoute && pathname !== "/") {
    return null;
  }

  return (
    <div className={styles.navbar}>
      <Link href="/" aria-label="EchoFind home" className={styles.logo}>
        <span className={styles.iconContainer}>
          <Image
            src="/logo.png"
            alt=""
            width={50}
            height={55}
            priority
          />
        </span>
        <span className={styles.text}>EchoFind</span>
      </Link>

      <div className={styles.links}>
        <Link href="/#home">Home</Link>
        <Link href="/#about">About</Link>
        <Link href="/#how-it-works">How It Works</Link>
        <Link href="/#contact">Contact</Link>
      </div>

      <div className={styles.buttons}>
        {authUser ? (
          <>
            <Link href="/profile" className={styles.userPill}>
              {authUser.name?.split(" ")[0] || "My profile"}
            </Link>
            <button className={styles.login} type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </button>
          </>
        ) : (
          <>
            <button className={styles.login} onClick={() => openAuthModal("login")}>
              Log In
            </button>
            <button className={styles.signup} onClick={() => openAuthModal("signup")}>
              Sign Up
            </button>
          </>
        )}
        <SignupModal
          show={showAuthModal}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onModeChange={setAuthMode}
          onAuthSuccess={handleAuthSuccess}
        />
        {logoutError ? <p className={styles.logoutError} role="alert">{logoutError}</p> : null}
      </div>
    </div>
  );
}
