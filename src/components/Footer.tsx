import { Link } from 'react-router-dom'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner section-inner">
        <div className="footer__row">
          <div className="footer__brand-block">
            <p className="footer__brand">Boss Lab AI</p>
            <p className="footer__copy">© {year} All rights reserved.</p>
          </div>

          <nav className="footer__links" aria-label="Legal">
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </nav>
        </div>

        <p className="footer__note">
          This website is not a part of Facebook or Google. Additionally, this
          site is not endorsed by or affiliated to Facebook or Google. All brands
          shown on this site belong to its respective owners.
        </p>
      </div>
    </footer>
  )
}
