import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './AdminRoute.css';

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-auth-loading">
        <div className="admin-auth-spinner" />
        <p>Verifying admin permissions...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in, but NOT an admin -> 403 Forbidden
  if (!isAdmin) {
    return (
      <main className="admin-unauthorized">
        <div className="admin-unauthorized__card glass">
          <span className="admin-unauthorized__badge">Access Denied (403)</span>
          <h1 className="admin-unauthorized__title">Administrator Access Only</h1>
          <p className="admin-unauthorized__desc">
            You are signed in as:
            <br />
            <strong className="admin-unauthorized__user">{user.email}</strong>
            <br />
            This account does not have administrator privileges. Only the designated website administrator can add, edit, or delete photos.
          </p>
          <div className="admin-unauthorized__actions">
            <button className="btn btn--secondary" onClick={() => signOut()}>
              Sign Out
            </button>
            <Link to="/" className="btn btn--ghost">
              Return to Website
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // User is verified admin
  return children;
}
