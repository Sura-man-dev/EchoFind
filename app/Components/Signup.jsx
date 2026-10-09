"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { createPortal } from "react-dom";
import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaFacebook,
  FaGithub,
  FaGoogle,
  FaLock,
  FaRegEnvelope,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import styles from "./Signup.module.css";

const initialFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

const socialProviders = [
  { id: "google", label: "Google", icon: FaGoogle },
  { id: "github", label: "GitHub", icon: FaGithub },
  { id: "facebook", label: "Facebook", icon: FaFacebook },
];

async function loadSessionUser() {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load your account session.");
  }

  return data.user ?? null;
}

export default function SignupModal({
  show,
  mode = "signup",
  dismissible = true,
  onClose,
  onModeChange,
  onAuthSuccess,
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState({});
  const [isMounted, setIsMounted] = useState(false);

  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot";
  const passwordStrength = getPasswordStrength(form.password);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      show &&
      mode === "login" &&
      new URLSearchParams(window.location.search).get("passwordReset") === "success"
    ) {
      setNotice("Your password was reset successfully. Sign in with your new password.");
    }
  }, [mode, show]);

  useEffect(() => {
    if (!show) {
      return;
    }

    let isMounted = true;

    const loadProviders = async () => {
      try {
        const response = await fetch("/api/auth/providers", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const providers = await response.json();

        if (isMounted) {
          setConfiguredProviders(providers ?? {});
        }
      } catch (providerError) {
        console.error("Failed to load auth providers", providerError);
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, [show]);

  useEffect(() => {
    if (!show) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (dismissible && event.key === "Escape") {
        setForm(initialFormState);
        setError("");
        setNotice("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, onClose, dismissible]);

  if (!show || !isMounted) {
    return null;
  }

  const resetState = () => {
    setForm(initialFormState);
    setError("");
    setNotice("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const closeModal = () => {
    resetState();
    onClose?.();
  };

  const switchMode = (nextMode) => {
    resetState();
    onModeChange?.(nextMode);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCredentialsSignIn = async () => {
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (!result?.ok || result.error) {
      throw new Error("Invalid email or password.");
    }

    const user = await loadSessionUser();
    if (!user) {
      throw new Error("You are signed in, but your session could not be loaded. Please try again.");
    }
    resetState();
    onAuthSuccess?.(user);
    window.location.assign(getPostAuthRedirect());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      if (isForgotPassword) {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to start password reset.");
        }

        setNotice(data.message);
        setForm((current) => ({
          ...current,
          email: "",
        }));
        return;
      }

      if (isSignup) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to create your account.");
        }
      }

      await handleCredentialsSignIn();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderSignIn = async (providerId, label) => {
    setError("");
    setNotice("");

    if (!configuredProviders?.[providerId]) {
      setError(`${label} sign-in is not configured yet.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(providerId, { redirectTo: getPostAuthRedirect() });
    } catch (providerError) {
      setError(providerError.message || `Unable to sign in with ${label}.`);
      setIsSubmitting(false);
    }
  };

  const modalTitle = isSignup
    ? "Create Account"
    : isForgotPassword
      ? "Forgot Password"
      : "Welcome Back";

  const modalText = isSignup
    ? "Create your EchoFind account to report and recover lost items."
    : isForgotPassword
      ? "Enter your email and we will send you a secure reset link."
      : "Log in to continue reporting and recovering lost items.";

  return createPortal((
    <div
      className={styles.modalOverlay}
      onClick={dismissible ? closeModal : undefined}
    >
      <div
        className={`${styles.modalCard} ${isSignup ? styles.signupCard : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {dismissible ? (
          <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Close dialog">
            <FaTimes />
          </button>
        ) : null}

        <div className={styles.brandHeader}>
          <div className={styles.logoBadge}>
            <Image src="/logo.png" alt="EchoFind" width={42} height={42} priority />
          </div>
          <div className={styles.logoLockup}>
            <span className={styles.logoText}>EchoFind</span>
            <span className={styles.logoSubtext}>Lost & Found System</span>
          </div>
        </div>

        <div className={styles.heading}>
          <h2 id="auth-modal-title">{modalTitle}</h2>
          <p>{modalText}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {isSignup ? (
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Full Name</span>
                <div className={styles.inputWrap}>
                  <FaUser />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              <label className={styles.field}>
                <span>Email address</span>
                <div className={styles.inputWrap}>
                  <FaRegEnvelope />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <div className={styles.inputWrap}>
                  <FaLock />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="********"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityBtn}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className={styles.strengthWrap} aria-hidden="true">
                  <span
                    className={`${styles.strengthLabel} ${
                      passwordStrength.level <= 1
                        ? styles.strengthWeak
                        : passwordStrength.level < 4
                          ? styles.strengthMedium
                          : styles.strengthStrong
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                  <div className={styles.strengthBars}>
                    {[0, 1, 2, 3].map((index) => (
                      <span
                        key={index}
                        className={`${styles.strengthBar} ${
                          index < passwordStrength.level ? styles.strengthBarActive : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </label>

              <label className={styles.field}>
                <span>Confirm Password</span>
                <div className={styles.inputWrap}>
                  <FaLock />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="********"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityBtn}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>
            </div>
          ) : (
            <>
              <label className={styles.field}>
                <span>Email Address</span>
                <div className={styles.inputWrap}>
                  <FaRegEnvelope />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              {isForgotPassword ? null : (
                <label className={styles.field}>
                  <span>Password</span>
                  <div className={styles.inputWrap}>
                    <FaLock />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      placeholder="********"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className={styles.visibilityBtn}
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </label>
              )}
            </>
          )}

          {isSignup ? (
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                required
              />
              <span>
                I agree to the <a href="#contact">Terms of Service</a> and{" "}
                <a href="#contact">Privacy Policy</a>
              </span>
            </label>
          ) : null}

          {!isForgotPassword && !isSignup ? (
            <button
              type="button"
              className={styles.inlineLink}
              onClick={() => switchMode("forgot")}
            >
              Forgot Password?
            </button>
          ) : null}

          {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
          {notice ? <p className={styles.noticeText} role="status">{notice}</p> : null}

          <button className={styles.primaryBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isSignup
                ? "Creating Account..."
                : isForgotPassword
                  ? "Sending Link..."
                  : "Logging In..."
              : (
                  <>
                    {isSignup ? "Create Account" : isForgotPassword ? "Send Reset Link" : "Log In"}
                    <FaArrowRight aria-hidden="true" />
                  </>
                )}
          </button>
        </form>

        {!isForgotPassword && socialProviders.some(({ id }) => configuredProviders?.[id]) ? (
          <>
            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            <div className={styles.socialRow}>
              {socialProviders.filter(({ id }) => configuredProviders?.[id]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={styles.socialBtn}
                  onClick={() => handleProviderSignIn(id, label)}
                  disabled={isSubmitting}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <p className={styles.footerText}>
          {isSignup
            ? "Already have an account?"
            : isForgotPassword
              ? "Remembered your password?"
              : "Need an account?"}{" "}
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => switchMode(isSignup || isForgotPassword ? "login" : "signup")}
          >
            {isSignup || isForgotPassword ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>
    </div>
  ), document.body);
}

function getPostAuthRedirect() {
  const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");

  if (!callbackUrl) {
    return "/";
  }

  const destination = new URL(callbackUrl, window.location.origin);
  return destination.origin === window.location.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/";
}

function getPasswordStrength(password) {
  if (!password) {
    return { label: "Use 8+ characters", level: 0 };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) {
    score += 1;
  }

  if (score <= 1) {
    return { label: "Weak password", level: 1 };
  }

  if (score < 4) {
    return { label: "Strong password", level: 3 };
  }

  return { label: "Very strong password", level: 4 };
}
