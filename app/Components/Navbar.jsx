"use client";

import styles from "./Navbar.module.css";
import Image from "next/image";
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
    try {
      await signOut({
        redirect: false,
      });

      setAuthUser(null);
      setShowAuthModal(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (isDashboardRoute && pathname !== "/") {
    return null;
  }

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <div className={styles.iconContainer}>
          <Image
            src="/logo.png"
            alt="Company Logo"    
            width={50}
            height={55}
            priority
          />
        </div>
        <span className={styles.text}>EchoFind</span>
      </div>

      <div className={styles.links}>
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#contact">Contact</a>
      </div>

      <div className={styles.buttons}>
        {authUser ? (
          <>
            <div className={styles.userPill}>Hi, {authUser.name?.split(" ")[0] || "there"}</div>
            <button className={styles.login} onClick={handleLogout}>
              Log Out
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
      </div>
    </div>
  );
}
