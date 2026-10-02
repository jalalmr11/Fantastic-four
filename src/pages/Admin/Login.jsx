import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import './Login.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    // If user is already authenticated as admin, go straight to dashboard
    if (!loading && user && isAdmin) {
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, loading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, profile, error } = await signIn({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Authentication failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Check role
      if (profile && profile.role !== 'admin') {
        setErrorMsg('Access denied: This account is authenticated but does not have administrator privileges.');
        setIsSubmitting(false);
        return;
      }

      if (!profile && data?.user) {
        // Profile was not found or not yet created
        setErrorMsg('Account found, but no administrator profile is associated with it. Please verify your Supabase profiles table.');
        setIsSubmitting(false);
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <main className="admin-login-page">
      <div className="admin-login-card glass">
        <div className="admin-login-header">
          <span className="admin-login-badge">Portal</span>
          <h1 className="admin-login-title">Admin Login</h1>
          <p className="admin-login-subtitle">Sign in to manage website photos and memories</p>
        </div>

        {!configured && (
          <div className="admin-config-warning">
            <strong>Supabase Setup Required:</strong>
            <br />
            Supabase environment variables are missing. Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env.local</code> file.
          </div>
        )}

        {errorMsg && (
          <div className="admin-login-error" role="alert">
            {errorMsg}
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-input-group">
            <label htmlFor="admin-email" className="admin-login-label">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="admin-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="admin-login-input-group">
            <label htmlFor="admin-password" className="admin-login-label">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="admin-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary admin-login-btn"
            disabled={isSubmitting || !configured}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/" className="admin-login-back">
            ← Return to public website
          </Link>
        </div>
      </div>
    </main>
  );
}
