import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <main className="notfound-page">
      <div className="notfound-content">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Lost in the memories?</p>
        <p className="notfound-text">The page you're looking for doesn't seem to exist. Let's go back to where the stories are.</p>
        <Link to="/" className="btn btn--primary" id="notfound-home">
          Back to FANTASTIC
        </Link>
      </div>
    </main>
  );
}
