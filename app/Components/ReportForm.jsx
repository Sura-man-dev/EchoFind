"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaBox,
  FaCloudUploadAlt,
  FaImage,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";
import DashboardShell from "./DashboardShell";
import styles from "./ReportForm.module.css";

const categories = ["Electronics", "Bags", "Keys", "Documents", "Accessories", "Other"];

export default function ReportForm({ kind = "lost" }) {
  const router = useRouter();
  const isFound = kind === "found";
  const route = isFound ? "/api/reports/found" : "/api/reports/lost";
  const heroImage = isFound ? "/losthero.png" : "/reportHero.png";

  const [form, setForm] = useState({
    itemName: "",
    category: "",
    brand: "",
    color: "",
    description: "",
    location: "",
    date: "",
    time: "",
    locationDetails: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files ?? []).slice(0, 5);
    setSelectedImages(files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      let imageUrls = [];

      if (selectedImages.length) {
        const imageData = new FormData();

        selectedImages.forEach((file) => {
          imageData.append("images", file);
        });

        const uploadResponse = await fetch("/api/uploads/report-images", {
          method: "POST",
          body: imageData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Unable to upload report images.");
        }

        imageUrls = uploadData.imageUrls ?? [];
      }

      const payload = isFound
        ? {
            itemName: form.itemName,
            category: form.category,
            imageUrls,
            brand: form.brand,
            color: form.color,
            description: form.description,
            foundLocation: form.location,
            foundDate: form.date,
            foundTime: form.time,
            locationDetails: form.locationDetails,
            contactName: form.contactName,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
          }
        : {
            itemName: form.itemName,
            category: form.category,
            imageUrls,
            brand: form.brand,
            color: form.color,
            description: form.description,
            lostLocation: form.location,
            lostDate: form.date,
            lostTime: form.time,
            locationDetails: form.locationDetails,
            contactName: form.contactName,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
          };

      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save this report.");
      }

      setNotice(`${isFound ? "Found" : "Lost"} item report saved successfully.`);
      setForm({
        itemName: "",
        category: "",
        brand: "",
        color: "",
        description: "",
        location: "",
        date: "",
        time: "",
        locationDetails: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
      setSelectedImages([]);

      router.refresh();
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className={styles.page}>
        <section
          className={styles.header}
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 45%, rgba(255,255,255,0.3) 100%), url('${heroImage}')`,
          }}
        >
          <div className={styles.headerContent}>
            <h1>{isFound ? "Report a Found Item" : "Report a Lost Item"}</h1>
            <p>
              {isFound
                ? "Found something? Save the details clearly so the owner can recognize it."
                : "Lost something? Add the important details so people can help return it."}
            </p>
          </div>

          <div className={styles.tipCard}>
            {isFound
              ? "You're making a difference. Thank you for helping return someone else's item."
              : "The more details you provide, the higher the chance of getting your item back."}
          </div>
        </section>

        <section className={styles.steps}>
          <div className={styles.stepActive}>1. Item Details</div>
          <div>2. Location & Time</div>
          <div>3. Your Info</div>
          <div>4. Review & Submit</div>
        </section>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <SectionTitle icon={<FaBox />} text="Item Details" />

          <div className={styles.field}>
            <label htmlFor="itemName">Item Name</label>
            <input
              id="itemName"
              name="itemName"
              placeholder="e.g. Black wallet, iPhone 14, headphones"
              value={form.itemName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.gridThree}>
            <div className={styles.field}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="brand">Brand</label>
              <input
                id="brand"
                name="brand"
                placeholder="Optional"
                value={form.brand}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="color">Color</label>
              <input
                id="color"
                name="color"
                placeholder="Optional"
                value={form.color}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe visible marks, size, labels, or other details."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <SectionTitle icon={<FaImage />} text="Add Photos" />
          <label className={styles.uploadBox}>
            <FaCloudUploadAlt />
            <div>
              <strong>Upload item photos</strong>
              <p>JPG, PNG, or WEBP. Up to 5 images, 5MB each.</p>
              {selectedImages.length ? (
                <span className={styles.fileCount}>
                  {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""} selected
                </span>
              ) : null}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className={styles.fileInput}
              onChange={handleImageChange}
            />
          </label>

          {selectedImages.length ? (
            <div className={styles.fileList}>
              {selectedImages.map((file) => (
                <div key={`${file.name}-${file.size}`} className={styles.fileChip}>
                  {file.name}
                </div>
              ))}
            </div>
          ) : null}

          <SectionTitle icon={<FaMapMarkerAlt />} text="Location & Time" />

          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label htmlFor="location">
                {isFound ? "Where did you find it?" : "Where did you lose it?"}
              </label>
              <input
                id="location"
                name="location"
                placeholder="e.g. Library, Cafeteria, Parking Lot A"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="date">{isFound ? "Date Found" : "Date Lost"}</label>
                <input id="date" type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>

              <div className={styles.field}>
                <label htmlFor="time">Time</label>
                <input id="time" type="time" name="time" value={form.time} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="locationDetails">Additional Location Details</label>
            <textarea
              id="locationDetails"
              name="locationDetails"
              placeholder="e.g. On a table near the vending machine, seat B22"
              value={form.locationDetails}
              onChange={handleChange}
            />
          </div>

          <SectionTitle icon={<FaUser />} text="Your Information" />

          <div className={styles.gridThree}>
            <div className={styles.field}>
              <label htmlFor="contactName">Full Name</label>
              <input id="contactName" name="contactName" value={form.contactName} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label htmlFor="contactEmail">Email</label>
              <input
                id="contactEmail"
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="contactPhone">Phone Number</label>
              <input id="contactPhone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
            </div>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}
          {notice ? <p className={styles.notice}>{notice}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.push("/")}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : `Publish ${isFound ? "Found" : "Lost"} Report`}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

function SectionTitle({ icon, text }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{icon}</span>
      <h2>{text}</h2>
    </div>
  );
}
