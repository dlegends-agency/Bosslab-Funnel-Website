import { Link } from 'react-router-dom'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner section-inner">
        <p className="footer__brand">Boss Lab AI</p>

        <nav className="footer__links" aria-label="Legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span className="footer__dot" aria-hidden="true">
            ·
          </span>
          <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
        </nav>

        <p className="footer__copy">
          © {year} Boss Lab AI. All Rights Reserved.
        </p>

        <p className="footer__note">
          This website is not a part of Facebook or Google. Additionally, this
          site is not endorsed by or affiliated to Facebook or Google. All brands
          shown on this site belong to its respective owners.
        </p>
      </div>
    </footer>
  )
}
