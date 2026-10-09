"use client";

import { useEffect, useState } from "react";
import { FaCamera, FaCheck, FaLock, FaUser } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import styles from "./profile.module.css";

const initialPasswordForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ProfileClient() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your profile.");
        if (mounted) {
          setProfile(data.user);
          setName(data.user.name || "");
        }
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setNotice("");

    if (!file) {
      setPhoto(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhoto(null);
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhoto(null);
      setError("Your profile photo must be 5MB or smaller.");
      event.target.value = "";
      return;
    }
    setPhoto(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingProfile(true);

    try {
      let image = profile.image;
      if (photo) {
        const imageData = new FormData();
        imageData.set("image", photo);
        const uploadResponse = await fetch("/api/profile/image", { method: "POST", body: imageData });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadResult.error || "Unable to upload your photo.");
        image = uploadResult.image;
      }

      const payload = { name };
      if (photo) payload.image = image;

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update your profile.");

      await applyProfileUpdate(result.user);
      setPhoto(null);
      setNotice("Your profile has been updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to change your password.");

      await applyProfileUpdate(result.user);
      setPasswordForm(initialPasswordForm);
      setNotice("Your password has been changed.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const applyProfileUpdate = async (updatedUser) => {
    setProfile(updatedUser);
    setName(updatedUser.name || "");

    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const sessionData = await response.json();
    if (!response.ok) throw new Error(sessionData.error || "Profile changed, but the session could not be refreshed.");
    window.dispatchEvent(new CustomEvent("echofind-profile-updated", { detail: { user: sessionData.user } }));
  };

  const avatarUrl = photoPreview || profile?.image;
  const initials = (profile?.name || profile?.email || "EF")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.profilePage}>
      <header className={styles.pageHeader}>
        <div className={styles.headerIcon}><FaUser /></div>
        <div>
          <p className={styles.eyebrow}>Account settings</p>
          <h1>Your profile</h1>
          <p>Keep your account details and sign-in information up to date.</p>
        </div>
      </header>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

      {loading ? (
        <div className={styles.loading}><FiLoader /> Loading your profile...</div>
      ) : profile ? (
        <div className={styles.settingsGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div className={styles.sectionIcon}><FaCamera /></div>
              <div>
                <h2>Profile photo</h2>
                <p>Choose a clear image so your community can recognize you.</p>
              </div>
            </div>

            <div className={styles.avatarSection}>
              <div className={styles.avatar} aria-label="Profile photo preview">
                {avatarUrl
                  ? <ImagePreview src={avatarUrl} />
                  : <span>{initials}</span>}
              </div>
              <div className={styles.avatarCopy}>
                <strong>{profile.name || "EchoFind member"}</strong>
                <span>{profile.email}</span>
              </div>
            </div>

            <form onSubmit={saveProfile} className={styles.form}>
              <label className={styles.uploadButton}>
                <FaCamera />
                <span>{photo ? "Choose a different photo" : "Choose a new photo"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} />
              </label>
              <p className={styles.helpText}>JPG, PNG, or WEBP · up to 5MB</p>
              <button className={styles.primaryButton} type="submit" disabled={savingProfile || loading}>
                {savingProfile ? <><FiLoader /> Saving...</> : <><FaCheck /> Save profile</>}
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div className={styles.sectionIcon}><FaUser /></div>
              <div>
                <h2>Personal information</h2>
                <p>Update the name shown on your EchoFind account.</p>
              </div>
            </div>

            <form onSubmit={saveProfile} className={styles.form}>
              <label className={styles.fieldLabel} htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                className={styles.textInput}
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={60}
                autoComplete="name"
                required
              />
              <label className={styles.fieldLabel} htmlFor="profile-email">Email address</label>
              <input id="profile-email" className={styles.textInput} value={profile.email || ""} disabled readOnly />
              <p className={styles.helpText}>Email changes are not available here.</p>
              <button className={styles.primaryButton} type="submit" disabled={savingProfile || loading}>
                {savingProfile ? <><FiLoader /> Saving...</> : <><FaCheck /> Save changes</>}
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div className={styles.sectionIcon}><FaLock /></div>
              <div>
                <h2>Security</h2>
                <p>{profile.hasPassword ? "Change your account password." : "Set a password for email and password sign-in."}</p>
              </div>
            </div>

            <form onSubmit={savePassword} className={styles.form}>
              {profile.hasPassword ? (
                <>
                  <label className={styles.fieldLabel} htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    className={styles.textInput}
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                    required
                  />
                </>
              ) : null}
              <label className={styles.fieldLabel} htmlFor="new-password">New password</label>
              <input
                id="new-password"
                className={styles.textInput}
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                minLength={8}
                required
              />
              <label className={styles.fieldLabel} htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                className={styles.textInput}
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                minLength={8}
                required
              />
              <p className={styles.helpText}>Use at least 8 characters, including uppercase, lowercase, and a number.</p>
              <button className={styles.primaryButton} type="submit" disabled={savingPassword}>
                {savingPassword ? <><FiLoader /> Updating...</> : <><FaLock /> Update password</>}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ImagePreview({ src }) {
  // Profile photos may come from any supported sign-in provider.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Profile preview" />;
}
