import styles from "./Hero.module.css";
import { FaPlusCircle } from "react-icons/fa";
import {
  FaBolt,
  FaHandshake,
  FaMapMarkerAlt,
  FaPen,
  FaSearch,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const Hero = () => {
  return (
    <>
      <section id="home" className={styles.heroWrapper}>
        <div className={styles.heroBox}>
          <div className={styles.textColumn}>
            <div className={styles.statusBadge}>
              <span>Lost Something? Let&apos;s Find It.</span>
            </div>

            <h1 className={styles.mainTitle}>
              Reuniting <br />
              <span className={styles.accentText}>Things</span> with <br />
              Their People
            </h1>

            <p className={styles.subText}>
              EchoFind is a smart Lost and Found System that helps you report,
              search, and recover lost items easily.
            </p>

            <div className={styles.actions}>
              
              <button className={styles.primaryBtn}>
                <FaPlusCircle style={{ marginRight: "8px" }} />
                Report an Item
              </button>
              

              <button className={styles.secondaryBtn}>
                <FaSearch style={{ marginRight: "8px" }} />
                Search Items
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.featuresSection}>
        <h2>How EchoFind Works</h2>
        <p>A Simple 3-steps Process to help you recover lost items.</p>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.icon}>
              <FaPen />
            </div>
            <h3>1.Report Lost Items</h3>
            <p>Report a lost item with details and location.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.icon}>
              <FaSearch />
            </div>
            <h3>2.Search</h3>
            <p>Browse or search for found items.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.icon}>
              <FaHandshake />
            </div>
            <h3>3.Reconnect People</h3>
            <p>We help return the item to its rightful owner.</p>
          </div>
        </div>
      </section>

      <section id="about" className={styles.aboutSection}>
        <div className={styles.aboutContent}>
          <div>
            <p className={styles.sectionEyebrow}>About EchoFind</p>
            <h2>Built to make lost and found feel organized and human again.</h2>
            <p className={styles.aboutText}>
              EchoFind helps schools, campuses, and communities report missing
              belongings, review found items, and reconnect owners faster with a
              simple shared system.
            </p>
          </div>

          <div className={styles.aboutHighlights}>
            <div className={styles.aboutCard}>
              <FaSearch className={styles.aboutIcon} />
              <h3>Smart discovery</h3>
              <p>Search reports and found items quickly without digging through posts.</p>
            </div>

            <div className={styles.aboutCard}>
              <FaHandshake className={styles.aboutIcon} />
              <h3>Faster returns</h3>
              <p>Clear details and better matching help owners recover belongings sooner.</p>
            </div>

            <div className={styles.aboutCard}>
              <FaMapMarkerAlt className={styles.aboutIcon} />
              <h3>Location aware</h3>
              <p>Track where an item was lost or found so follow-up becomes easier.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <h2>Why Choose EchoFind</h2>
        <p>We make lost and found simple, fast, and reliable.</p>

        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <FaBolt />
            </div>
            <h3>Easy to Use</h3>
            <p>Simple and user-friendly interface for everyone.</p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <FaSearch />
            </div>
            <h3>Fast Matching</h3>
            <p>Quickly match lost and found items in seconds.</p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <FaShieldAlt />
            </div>
            <h3>Secure & Reliable</h3>
            <p>Your data and reports are safe and protected.</p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <FaUsers />
            </div>
            <h3>Community Driven</h3>
            <p>Powered by people helping each other.</p>
          </div>
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactIntro}>
          <p className={styles.sectionEyebrow}>Contact</p>
          <h2>Need help or want to partner with EchoFind?</h2>
          <p>
            Reach out for support, product questions, or campus onboarding. We are
            here to help your community run lost and found better.
          </p>
        </div>

        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <h3>Email</h3>
            <p>support@echofind.com</p>
          </div>

          <div className={styles.contactCard}>
            <h3>Phone</h3>
            <p>+1 (555) 210-3344</p>
          </div>

          <div className={styles.contactCard}>
            <h3>Office Hours</h3>
            <p>Monday to Friday, 8:00 AM to 5:00 PM</p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaText}>
            <h2>Lost something? Don&apos;t worry.</h2>
            <p>EchoFind is here to help you find it quickly and easily.</p>
          </div>

          <div className={styles.ctaAction}>
            <button className={styles.ctaBtn}>Get Started</button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
