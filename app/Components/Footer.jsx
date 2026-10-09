import Link from "next/link";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
    
        {/* Brand */}
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.brandLink} aria-label="EchoFind home">
            <h3>EchoFind</h3>
          </Link>
          <p>Reuniting things with their people.</p>
        </div>
    
        {/* Quick Links */}
        <div className={styles.footerSection}>
          <h4>Quick Links</h4>
          <Link href="/#home">Home</Link>
          <Link href="/#about">About</Link>
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/#contact">Contact</Link>
        </div>
    
        {/* Support */}
        <div className={styles.footerSection}>
          <h4>Support</h4>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
        </div>
    
      </div>
    
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} EchoFind. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer;
