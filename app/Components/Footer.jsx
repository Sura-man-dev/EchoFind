import React from 'react'
import styles from './Footer.module.css';
import {FaFacebookF, FaTwitter, FaInstagram} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
    
        {/* Brand */}
        <div className={styles.footerBrand}>
          <h3>EchoFind</h3>
          <p>Reuniting things with their people.</p>
        </div>
    
        {/* Quick Links */}
        <div className={styles.footerSection}>
          <h4>Quick Links</h4>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#contact">Contact</a>
        </div>
    
        {/* Support */}
        <div className={styles.footerSection}>
          <h4>Support</h4>
          <a href="#">FAQ</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
    
      </div>
    
      {/* Bottom */}
      <div className={styles.footerBottom}>
        <p>© 2024 EchoFind. All rights reserved.</p>
    
        <div className={styles.socials}>
      <FaFacebookF />
      <FaTwitter />
      <FaInstagram />
    </div>
      </div>
    </footer>
  )
}

export default Footer;
