import { Link } from 'react-router-dom';
import { Logo } from './ui';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Link to="/" className="brand brand-light">
            <Logo id="lg-foot" />
            <span>FundRaise</span>
          </Link>
          <p>Creators launch campaigns. Supporters pledge. Every pledge moves the bar in real time.</p>
        </div>
        <div className="footer-links">
          <Link to="/explore">Explore campaigns</Link>
          <Link to="/register">Create an account</Link>
          <Link to="/login">Log in</Link>
        </div>
        <p className="footer-note">
          Payments on FundRaise are simulated. No real money moves, and no card details are stored.
        </p>
      </div>
    </footer>
  );
}
