import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  getPhotos,
  uploadPhoto,
  updatePhotoMetadata,
  replacePhotoFile,
  deletePhoto,
  validateImageFile,
} from '../../services/photoService';
import './Dashboard.css';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // State
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'gallery' | 'memories'
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('gallery');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Edit Modal State
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('gallery');
  const [isUpdating, setIsUpdating] = useState(false);

  // Replace Modal State
  const [replacingPhoto, setReplacingPhoto] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replacePreview, setReplacePreview] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const replaceInputRef = useRef(null);

  // Delete Modal State
  const [deletingPhoto, setDeletingPhoto] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch photos
  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getPhotos(activeTab);
    if (error) {
      setAlert({ type: 'error', message: 'Failed to load photos from database.' });
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    getPhotos(activeTab).then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setAlert({ type: 'error', message: 'Failed to load photos from database.' });
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Handle file selection for new upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAlert({ type: 'error', message: validation.error });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAlert(null);
  };

  const clearUploadForm = () => {
    setTitle('');
    setDescription('');
    setCategory('gallery');
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setAlert({ type: 'error', message: 'Please select an image file to upload.' });
      return;
    }
    if (!title.trim()) {
      setAlert({ type: 'error', message: 'Please provide a title for the photo.' });
      return;
    }

    setIsUploading(true);
    setAlert(null);

    const { data, error } = await uploadPhoto({
      file: selectedFile,
      title,
      description,
      category,
      userId: user?.id,
    });

    setIsUploading(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Photo upload failed.' });
    } else {
      setAlert({ type: 'success', message: `Photo "${data.title}" uploaded successfully!` });
      clearUploadForm();
      loadPhotos();
    }
  };

  // Open Edit Modal
  const openEditModal = (photo) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title);
    setEditDescription(photo.description || '');
    setEditCategory(photo.category);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPhoto) return;
    if (!editTitle.trim()) {
      setAlert({ type: 'error', message: 'Title cannot be empty.' });
      return;
    }

    setIsUpdating(true);
    const { error } = await updatePhotoMetadata(editingPhoto.id, {
      title: editTitle,
      description: editDescription,
      category: editCategory,
    });
    setIsUpdating(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to update photo.' });
    } else {
      setAlert({ type: 'success', message: 'Photo metadata updated successfully!' });
      setEditingPhoto(null);
      loadPhotos();
    }
  };

  // Open Replace Modal
  const openReplaceModal = (photo) => {
    setReplacingPhoto(photo);
    setReplaceFile(null);
    setReplacePreview('');
  };

  const handleReplaceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAlert({ type: 'error', message: validation.error });
      return;
    }

    setReplaceFile(file);
    setReplacePreview(URL.createObjectURL(file));
  };

  // Save Replace
  const handleSaveReplace = async (e) => {
    e.preventDefault();
    if (!replacingPhoto || !replaceFile) {
      setAlert({ type: 'error', message: 'Please select a replacement image.' });
      return;
    }

    setIsReplacing(true);
    const { error } = await replacePhotoFile(replacingPhoto.id, {
      newFile: replaceFile,
      oldStoragePath: replacingPhoto.storage_path,
      category: replacingPhoto.category,
    });
    setIsReplacing(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to replace image file.' });
    } else {
      setAlert({ type: 'success', message: 'Photo replaced successfully in storage and database!' });
      setReplacingPhoto(null);
      setReplaceFile(null);
      setReplacePreview('');
      loadPhotos();
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingPhoto) return;

    setIsDeleting(true);
    const { success, error } = await deletePhoto(deletingPhoto.id, deletingPhoto.storage_path);
    setIsDeleting(false);

    if (error || !success) {
      setAlert({ type: 'error', message: error?.message || 'Failed to delete photo.' });
    } else {
      setAlert({ type: 'success', message: 'Photo deleted permanently from storage and database.' });
      setDeletingPhoto(null);
      loadPhotos();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <main className="admin-dashboard">
      <div className="container">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header__brand">
            <h1 className="admin-header__title">
              Admin Dashboard
              <span className="admin-header__badge">Administrator</span>
            </h1>
            <p className="admin-header__user">Signed in as {user?.email}</p>
          </div>

          <div className="admin-header__actions">
            <Link to="/" className="btn btn--secondary" target="_blank" rel="noopener noreferrer">
              View Website ↗
            </Link>
            <button className="btn btn--ghost" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Feedback Alert */}
        {alert && (
          <div className={`admin-alert admin-alert--${alert.type}`} role="alert">
            <span>{alert.message}</span>
            <button className="admin-alert__close" onClick={() => setAlert(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {/* Add Photo Card */}
        <section className="admin-card glass" aria-label="Add Photo">
          <h2 className="admin-card__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add New Photo
          </h2>

          <form onSubmit={handleUpload}>
            <div className="admin-form-grid">
              {/* Left Column: Image upload */}
              <div>
                <label className="form-label">Photo File * (JPG, PNG, WEBP — Max 10MB)</label>
                {previewUrl ? (
                  <div className="admin-preview-box">
                    <img src={previewUrl} alt="Preview" className="admin-preview-img" />
                    <button
                      type="button"
                      className="admin-preview-remove"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="admin-file-drop" onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Click or drag image to select file</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Supports JPG, PNG, WEBP up to 10MB
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Right Column: Metadata fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="photo-title" className="form-label">
                    Photo Title *
                  </label>
                  <input
                    id="photo-title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Reunion at the Beach"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="photo-category" className="form-label">
                    Display Category *
                  </label>
                  <select
                    id="photo-category"
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="gallery">Public Gallery</option>
                    <option value="memories">Memories</option>
                    <option value="members">Members</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="photo-desc" className="form-label">
                    Description / Story (optional)
                  </label>
                  <textarea
                    id="photo-desc"
                    className="form-input form-textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description or context behind this photo..."
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isUploading || !selectedFile}
                  style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
                >
                  {isUploading ? 'Uploading to Supabase...' : 'Upload & Publish Photo'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Existing Photos Section */}
        <section aria-label="Existing Photos">
          <div className="admin-controls">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>
              Existing Photos ({photos.length})
            </h2>

            <div className="admin-tabs" role="tablist">
              <button
                className={`admin-tab ${activeTab === 'all' ? 'admin-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`admin-tab ${activeTab === 'gallery' ? 'admin-tab--active' : ''}`}
                onClick={() => setActiveTab('gallery')}
              >
                Gallery
              </button>
              <button
                className={`admin-tab ${activeTab === 'memories' ? 'admin-tab--active' : ''}`}
                onClick={() => setActiveTab('memories')}
              >
                Memories
              </button>
            </div>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <div className="admin-auth-spinner" style={{ margin: '0 auto 16px' }} />
              <p>Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="admin-table-container">
              <div className="admin-empty-state">
                <p>No photos uploaded yet in this category.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                  Use the upload form above to add your first photo.
                </p>
              </div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Title & Description</th>
                    <th>Category</th>
                    <th>Date Added</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {photos.map((photo) => (
                    <tr key={photo.id}>
                      <td>
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="admin-thumb"
                          loading="lazy"
                        />
                      </td>
                      <td>
                        <div className="admin-table__title">{photo.title}</div>
                        {photo.description && (
                          <div className="admin-table__desc">{photo.description}</div>
                        )}
                      </td>
                      <td>
                        <span className="admin-table__category">{photo.category}</span>
                      </td>
                      <td>
                        <span className="admin-table__date">
                          {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table__actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="admin-action-btn"
                            onClick={() => openEditModal(photo)}
                            title="Edit Title/Description"
                          >
                            Edit
                          </button>
                          <button
                            className="admin-action-btn"
                            onClick={() => openReplaceModal(photo)}
                            title="Replace image file"
                          >
                            Replace
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--delete"
                            onClick={() => setDeletingPhoto(photo)}
                            title="Delete photo"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Edit Metadata Modal */}
      {editingPhoto && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal glass">
            <h3 className="admin-modal__title">Edit Photo Info</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="gallery">Public Gallery</option>
                  <option value="memories">Memories</option>
                  <option value="members">Members</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setEditingPhoto(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Image Modal */}
      {replacingPhoto && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal glass">
            <h3 className="admin-modal__title">Replace Image</h3>
            <p className="admin-modal__text">
              Select a new file to replace the image for &ldquo;{replacingPhoto.title}&rdquo;.
              The old image will be safely removed from Supabase Storage and replaced.
            </p>

            <form onSubmit={handleSaveReplace}>
              {replacePreview ? (
                <div className="admin-preview-box" style={{ marginBottom: '20px' }}>
                  <img src={replacePreview} alt="Replacement Preview" className="admin-preview-img" />
                  <button
                    type="button"
                    className="admin-preview-remove"
                    onClick={() => {
                      setReplaceFile(null);
                      setReplacePreview('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  className="admin-file-drop"
                  onClick={() => replaceInputRef.current?.click()}
                  style={{ marginBottom: '20px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Select replacement image (JPG, PNG, WEBP)</span>
                </div>
              )}

              <input
                ref={replaceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleReplaceFileChange}
                style={{ display: 'none' }}
              />

              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setReplacingPhoto(null);
                    setReplaceFile(null);
                    setReplacePreview('');
                  }}
                  disabled={isReplacing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isReplacing || !replaceFile}
                >
                  {isReplacing ? 'Replacing...' : 'Upload & Replace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPhoto && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal glass">
            <h3 className="admin-modal__title" style={{ color: '#fca5a5' }}>
              Confirm Delete
            </h3>
            <p className="admin-modal__text">
              Are you sure you want to delete &ldquo;<strong>{deletingPhoto.title}</strong>&rdquo;?
              <br />
              This will permanently delete the photo from Supabase Storage and remove it from the website.
              This action cannot be undone.
            </p>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setDeletingPhoto(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
