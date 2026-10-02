import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  getPhotos,
  uploadGalleryPhoto,
  uploadMemoriesGroup,
  replaceGalleryPhoto,
  updateMemoriesGroup,
  deletePhoto,
  validateImageFile,
  parsePhotoUrls,
  parseStoragePaths,
} from '../../services/photoService';
import './Dashboard.css';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Navigation tab: 'gallery' | 'memories'
  const [activeSection, setActiveSection] = useState('gallery');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // ---------------------------------------------------------
  // 1. GALLERY UPLOAD STATE (Strictly Image-Only)
  // ---------------------------------------------------------
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryInputRef = useRef(null);

  // ---------------------------------------------------------
  // 2. MEMORIES UPLOAD STATE (1-4 Images + ONE Shared Description)
  // ---------------------------------------------------------
  const [memoryFiles, setMemoryFiles] = useState([]);
  const [memoryDescription, setMemoryDescription] = useState('');
  const [isUploadingMemories, setIsUploadingMemories] = useState(false);
  const memoriesInputRef = useRef(null);

  // ---------------------------------------------------------
  // 3. EDIT / REPLACE MODALS STATE
  // ---------------------------------------------------------
  // Gallery Replace (Image-Only)
  const [replacingGalleryPhoto, setReplacingGalleryPhoto] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replacePreview, setReplacePreview] = useState('');
  const [isReplacingGallery, setIsReplacingGallery] = useState(false);
  const replaceInputRef = useRef(null);

  // Memories Edit (Images Management + ONE Shared Description)
  const [editingMemory, setEditingMemory] = useState(null);
  const [editKeepUrls, setEditKeepUrls] = useState([]);
  const [editKeepPaths, setEditKeepPaths] = useState([]);
  const [editRemovedPaths, setEditRemovedPaths] = useState([]);
  const [editNewFiles, setEditNewFiles] = useState([]);
  const [editDescription, setEditDescription] = useState('');
  const [isUpdatingMemory, setIsUpdatingMemory] = useState(false);
  const editMemoryInputRef = useRef(null);

  // Delete Modal
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------------------------------------------------------
  // Fetch Photos
  // ---------------------------------------------------------
  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getPhotos();
    if (error) {
      setAlert({ type: 'error', message: 'Failed to load photos from database.' });
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getPhotos().then(({ data, error }) => {
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
  }, []);

  // Separate Gallery and Memories lists
  const galleryPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (p.category === 'gallery') return true;
      if (p.category === 'memories') return false;
      // Fallback if category column doesn't exist: check storage_path and JSON array image_url
      return (
        p.storage_path?.startsWith('gallery/') ||
        (!p.image_url?.startsWith('[') && !p.storage_path?.startsWith('memories/'))
      );
    });
  }, [photos]);

  const memoriesPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (p.category === 'memories') return true;
      if (p.category === 'gallery') return false;
      // Fallback: check storage_path or JSON array image_url
      return (
        p.storage_path?.startsWith('memories/') ||
        p.image_url?.startsWith('[')
      );
    });
  }, [photos]);

  // ---------------------------------------------------------
  // GALLERY HANDLERS (Image-Only, One Image at a time)
  // ---------------------------------------------------------
  const handleGalleryFileSelect = (e) => {
    const rawFiles = e.target.files ? Array.from(e.target.files) : [];
    if (rawFiles.length === 0) return;

    if (rawFiles.length > 1) {
      setAlert({ type: 'error', message: 'Gallery allows only one image at a time.' });
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }

    const file = rawFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAlert({ type: 'error', message: validation.error });
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }

    setGalleryFile(file);
    if (galleryPreview) URL.revokeObjectURL(galleryPreview);
    setGalleryPreview(URL.createObjectURL(file));
    setAlert(null);
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    const rawFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (rawFiles.length === 0) return;

    if (rawFiles.length > 1) {
      setAlert({ type: 'error', message: 'Gallery allows only one image at a time.' });
      return;
    }

    const file = rawFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAlert({ type: 'error', message: validation.error });
      return;
    }

    setGalleryFile(file);
    if (galleryPreview) URL.revokeObjectURL(galleryPreview);
    setGalleryPreview(URL.createObjectURL(file));
    setAlert(null);
  };

  const clearGalleryForm = () => {
    setGalleryFile(null);
    if (galleryPreview) URL.revokeObjectURL(galleryPreview);
    setGalleryPreview('');
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleGalleryUpload = async () => {
    if (!galleryFile) {
      setAlert({ type: 'error', message: 'Please select an image to upload.' });
      return;
    }

    setIsUploadingGallery(true);
    setAlert(null);

    const { error } = await uploadGalleryPhoto({
      file: galleryFile,
      userId: user?.id,
    });

    setIsUploadingGallery(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Gallery upload failed.' });
    } else {
      setAlert({ type: 'success', message: 'Gallery image uploaded successfully!' });
      clearGalleryForm();
      loadPhotos();
    }
  };

  // ---------------------------------------------------------
  // MEMORIES HANDLERS (1–4 Images + ONE Shared Description)
  // ---------------------------------------------------------
  const handleMemoriesFileSelect = (e) => {
    const rawFiles = e.target.files ? Array.from(e.target.files) : [];
    if (rawFiles.length === 0) return;

    const totalCount = memoryFiles.length + rawFiles.length;
    if (totalCount > 4 || rawFiles.length > 4) {
      setAlert({ type: 'error', message: 'Memories allows a maximum of 4 images.' });
      if (memoriesInputRef.current) memoriesInputRef.current.value = '';
      return;
    }

    for (const file of rawFiles) {
      const val = validateImageFile(file);
      if (!val.valid) {
        setAlert({ type: 'error', message: `${file.name}: ${val.error}` });
        if (memoriesInputRef.current) memoriesInputRef.current.value = '';
        return;
      }
    }

    setMemoryFiles((prev) => [...prev, ...rawFiles]);
    setAlert(null);
    if (memoriesInputRef.current) memoriesInputRef.current.value = '';
  };

  const handleMemoriesDrop = (e) => {
    e.preventDefault();
    const rawFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (rawFiles.length === 0) return;

    const totalCount = memoryFiles.length + rawFiles.length;
    if (totalCount > 4 || rawFiles.length > 4) {
      setAlert({ type: 'error', message: 'Memories allows a maximum of 4 images.' });
      return;
    }

    for (const file of rawFiles) {
      const val = validateImageFile(file);
      if (!val.valid) {
        setAlert({ type: 'error', message: `${file.name}: ${val.error}` });
        return;
      }
    }

    setMemoryFiles((prev) => [...prev, ...rawFiles]);
    setAlert(null);
  };

  const removeMemoryFile = (index) => {
    setMemoryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearMemoriesForm = () => {
    setMemoryFiles([]);
    setMemoryDescription('');
    if (memoriesInputRef.current) memoriesInputRef.current.value = '';
  };

  const handleMemoriesUpload = async () => {
    if (memoryFiles.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least 1 image for this memory.' });
      return;
    }

    if (memoryFiles.length > 4) {
      setAlert({ type: 'error', message: 'Memories allows a maximum of 4 images.' });
      return;
    }

    setIsUploadingMemories(true);
    setAlert(null);

    const { error } = await uploadMemoriesGroup({
      files: memoryFiles,
      description: memoryDescription,
      userId: user?.id,
    });

    setIsUploadingMemories(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Memories upload failed.' });
    } else {
      setAlert({ type: 'success', message: 'Memories group uploaded successfully!' });
      clearMemoriesForm();
      loadPhotos();
    }
  };

  // ---------------------------------------------------------
  // GALLERY REPLACE (Image-Only)
  // ---------------------------------------------------------
  const openReplaceGalleryModal = (photo) => {
    setReplacingGalleryPhoto(photo);
    setReplaceFile(null);
    setReplacePreview('');
  };

  const handleReplaceFileChange = (e) => {
    const rawFiles = e.target.files ? Array.from(e.target.files) : [];
    if (rawFiles.length === 0) return;

    if (rawFiles.length > 1) {
      setAlert({ type: 'error', message: 'Gallery allows only one image at a time.' });
      if (replaceInputRef.current) replaceInputRef.current.value = '';
      return;
    }

    const file = rawFiles[0];
    const val = validateImageFile(file);
    if (!val.valid) {
      setAlert({ type: 'error', message: val.error });
      return;
    }

    setReplaceFile(file);
    if (replacePreview) URL.revokeObjectURL(replacePreview);
    setReplacePreview(URL.createObjectURL(file));
  };

  const handleSaveGalleryReplace = async () => {
    if (!replacingGalleryPhoto || !replaceFile) {
      setAlert({ type: 'error', message: 'Please select a replacement image.' });
      return;
    }

    setIsReplacingGallery(true);
    const { error } = await replaceGalleryPhoto(replacingGalleryPhoto.id, {
      newFile: replaceFile,
      oldStoragePath: replacingGalleryPhoto.storage_path,
    });
    setIsReplacingGallery(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to replace image.' });
    } else {
      setAlert({ type: 'success', message: 'Gallery image replaced successfully!' });
      setReplacingGalleryPhoto(null);
      setReplaceFile(null);
      setReplacePreview('');
      loadPhotos();
    }
  };

  // ---------------------------------------------------------
  // MEMORIES EDIT (Images Management + Shared Description)
  // ---------------------------------------------------------
  const openEditMemoryModal = (photo) => {
    const urls = parsePhotoUrls(photo.image_url);
    const paths = parseStoragePaths(photo.storage_path);
    setEditingMemory(photo);
    setEditKeepUrls(urls);
    setEditKeepPaths(paths);
    setEditRemovedPaths([]);
    setEditNewFiles([]);
    setEditDescription(photo.description || '');
  };

  const handleRemoveExistingMemoryPhoto = (index) => {
    const pathToRemove = editKeepPaths[index];
    if (pathToRemove) {
      setEditRemovedPaths((prev) => [...prev, pathToRemove]);
    }
    setEditKeepUrls((prev) => prev.filter((_, i) => i !== index));
    setEditKeepPaths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewMemoryFile = (index) => {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddEditMemoryFiles = (e) => {
    const rawFiles = e.target.files ? Array.from(e.target.files) : [];
    if (rawFiles.length === 0) return;

    const totalCount = editKeepUrls.length + editNewFiles.length + rawFiles.length;
    if (totalCount > 4) {
      setAlert({ type: 'error', message: 'Memories allows a maximum of 4 images.' });
      if (editMemoryInputRef.current) editMemoryInputRef.current.value = '';
      return;
    }

    for (const file of rawFiles) {
      const val = validateImageFile(file);
      if (!val.valid) {
        setAlert({ type: 'error', message: `${file.name}: ${val.error}` });
        if (editMemoryInputRef.current) editMemoryInputRef.current.value = '';
        return;
      }
    }

    setEditNewFiles((prev) => [...prev, ...rawFiles]);
    if (editMemoryInputRef.current) editMemoryInputRef.current.value = '';
  };

  const handleSaveMemoryEdit = async () => {
    if (!editingMemory) return;

    const totalPhotos = editKeepUrls.length + editNewFiles.length;
    if (totalPhotos === 0) {
      setAlert({ type: 'error', message: 'A memory must have at least 1 image.' });
      return;
    }

    if (totalPhotos > 4) {
      setAlert({ type: 'error', message: 'Memories allows a maximum of 4 images.' });
      return;
    }

    setIsUpdatingMemory(true);
    const { error } = await updateMemoriesGroup(editingMemory.id, {
      keepUrls: editKeepUrls,
      keepPaths: editKeepPaths,
      newFiles: editNewFiles,
      removedPaths: editRemovedPaths,
      description: editDescription,
    });
    setIsUpdatingMemory(false);

    if (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to update memory.' });
    } else {
      setAlert({ type: 'success', message: 'Memory updated successfully!' });
      setEditingMemory(null);
      loadPhotos();
    }
  };

  // ---------------------------------------------------------
  // DELETE HANDLER (Gallery or Memories)
  // ---------------------------------------------------------
  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    const { success, error } = await deletePhoto(deletingItem.id, deletingItem.storage_path);
    setIsDeleting(false);

    if (error || !success) {
      setAlert({ type: 'error', message: error?.message || 'Failed to delete item.' });
    } else {
      setAlert({ type: 'success', message: 'Item deleted permanently from storage and database.' });
      setDeletingItem(null);
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
        {/* Top Header */}
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

        {/* Global Feedback Alert */}
        {alert && (
          <div className={`admin-alert admin-alert--${alert.type}`} role="alert">
            <span>{alert.message}</span>
            <button
              className="admin-alert__close"
              onClick={() => setAlert(null)}
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section Tabs Switcher */}
        <nav className="admin-tabs-nav" aria-label="Dashboard Sections">
          <button
            type="button"
            className={`admin-tab-btn ${activeSection === 'gallery' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveSection('gallery')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Gallery</span>
            <span className="admin-tab-btn__badge">{galleryPhotos.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeSection === 'memories' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setActiveSection('memories')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <path d="M7 2v20" />
              <path d="M17 2v20" />
              <path d="M2 12h20" />
            </svg>
            <span>Memories</span>
            <span className="admin-tab-btn__badge">{memoriesPhotos.length}</span>
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* GALLERY SECTION: IMAGE-ONLY                                              */}
        {/* ========================================================================= */}
        {activeSection === 'gallery' && (
          <section aria-label="Gallery Section">
            <div className="admin-section-card glass">
              <div className="admin-section-card__header">
                <h2 className="admin-section-card__title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Gallery
                </h2>
                <p className="admin-section-card__subtitle">
                  Upload a single photo directly to the public gallery. No description or text required.
                </p>
              </div>

              {/* Gallery Upload: [ Select Image ] -> [ Image Preview ] -> [ Upload ] */}
              <div>
                {galleryPreview ? (
                  <div className="admin-single-preview">
                    <img src={galleryPreview} alt="Selected Gallery Preview" className="admin-single-preview__img" />
                    <div className="admin-single-preview__info">
                      <span>{galleryFile?.name}</span>
                      <span>{(galleryFile?.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <button
                      type="button"
                      className="admin-preview-remove-btn"
                      onClick={clearGalleryForm}
                      title="Remove selected image"
                      aria-label="Remove selected image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="admin-dropzone"
                    onClick={() => galleryInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleGalleryDrop}
                  >
                    <div className="admin-dropzone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="admin-dropzone__text">Select Image</div>
                    <div className="admin-dropzone__hint">JPG, PNG, or WEBP (Max 10MB) — One image per upload</div>
                  </div>
                )}

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGalleryFileSelect}
                  style={{ display: 'none' }}
                />

                <div className="admin-upload-actions">
                  <button
                    type="button"
                    className="btn btn--primary admin-submit-btn"
                    disabled={!galleryFile || isUploadingGallery}
                    onClick={handleGalleryUpload}
                  >
                    {isUploadingGallery ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery Photos List */}
            <div className="admin-list-header">
              <h3 className="admin-list-title">Existing Gallery Photos</h3>
              <span className="admin-list-count">{galleryPhotos.length} photos</span>
            </div>

            {loading ? (
              <div className="admin-empty-box">
                <p>Loading gallery photos...</p>
              </div>
            ) : galleryPhotos.length === 0 ? (
              <div className="admin-empty-box">
                <p>No gallery photos uploaded yet.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Use the upload section above to select and upload your first photo.
                </p>
              </div>
            ) : (
              <div className="admin-gallery-grid">
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="admin-gallery-card">
                    <div className="admin-gallery-card__img-wrap">
                      <img src={photo.image_url} alt="Gallery Photo" loading="lazy" />
                    </div>
                    <div className="admin-gallery-card__meta">
                      <span className="admin-gallery-card__date">
                        {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : '—'}
                      </span>
                      <div className="admin-gallery-card__actions">
                        <button
                          type="button"
                          className="admin-btn-action"
                          onClick={() => openReplaceGalleryModal(photo)}
                          title="Replace image file"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="admin-btn-action admin-btn-action--delete"
                          onClick={() => setDeletingItem(photo)}
                          title="Delete photo"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* MEMORIES SECTION: 1–4 IMAGES + ONE SHARED DESCRIPTION                    */}
        {/* ========================================================================= */}
        {activeSection === 'memories' && (
          <section aria-label="Memories Section">
            <div className="admin-section-card glass">
              <div className="admin-section-card__header">
                <h2 className="admin-section-card__title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <rect x="2" y="2" width="20" height="20" rx="3" />
                    <path d="M7 2v20" />
                    <path d="M17 2v20" />
                    <path d="M2 12h20" />
                  </svg>
                  Memories
                </h2>
                <p className="admin-section-card__subtitle">
                  Select 1 to 4 images for a single memory group with one shared description.
                </p>
              </div>

              {/* Memories Form */}
              <div>
                {/* Image Previews / Selection */}
                {memoryFiles.length === 0 ? (
                  <div
                    className="admin-dropzone"
                    onClick={() => memoriesInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleMemoriesDrop}
                  >
                    <div className="admin-dropzone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div className="admin-dropzone__text">Select up to 4 Images</div>
                    <div className="admin-dropzone__hint">Minimum 1 image, maximum 4 images per memory</div>
                  </div>
                ) : (
                  <div className="admin-memories-preview-grid">
                    {memoryFiles.map((file, idx) => (
                      <div key={idx} className="admin-memory-preview-item">
                        <img src={URL.createObjectURL(file)} alt={`Memory Preview ${idx + 1}`} />
                        <span className="admin-memory-preview-item__badge">Image {idx + 1}</span>
                        <button
                          type="button"
                          className="admin-preview-remove-btn"
                          onClick={() => removeMemoryFile(idx)}
                          title={`Remove Image ${idx + 1}`}
                          aria-label={`Remove Image ${idx + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Add Slot button if under 4 images */}
                    {memoryFiles.length < 4 && (
                      <button
                        type="button"
                        className="admin-add-slot-btn"
                        onClick={() => memoriesInputRef.current?.click()}
                        title="Add another image"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add ({memoryFiles.length}/4)</span>
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={memoriesInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleMemoriesFileSelect}
                  style={{ display: 'none' }}
                />

                {/* ONE Single Shared Description */}
                <div className="admin-desc-group">
                  <label htmlFor="memories-desc" className="admin-desc-label">
                    Description
                  </label>
                  <textarea
                    id="memories-desc"
                    className="admin-desc-textarea"
                    rows={3}
                    value={memoryDescription}
                    onChange={(e) => setMemoryDescription(e.target.value)}
                    placeholder="Enter the shared story or description for these memories..."
                  />
                </div>

                <div className="admin-upload-actions">
                  <button
                    type="button"
                    className="btn btn--primary admin-submit-btn"
                    disabled={memoryFiles.length === 0 || isUploadingMemories}
                    onClick={handleMemoriesUpload}
                  >
                    {isUploadingMemories ? 'Uploading Memories...' : 'Upload Memories'}
                  </button>
                </div>
              </div>
            </div>

            {/* Memories List */}
            <div className="admin-list-header">
              <h3 className="admin-list-title">Existing Memories</h3>
              <span className="admin-list-count">{memoriesPhotos.length} groups</span>
            </div>

            {loading ? (
              <div className="admin-empty-box">
                <p>Loading memories...</p>
              </div>
            ) : memoriesPhotos.length === 0 ? (
              <div className="admin-empty-box">
                <p>No memories uploaded yet.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Select 1 to 4 images and write a description above to create your first memory group.
                </p>
              </div>
            ) : (
              <div className="admin-memories-list">
                {memoriesPhotos.map((photo) => {
                  const urls = parsePhotoUrls(photo.image_url);
                  return (
                    <div key={photo.id} className="admin-memory-group-card">
                      {/* Images belonging to this Memories Group */}
                      <div className="admin-memory-group-card__images">
                        {urls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Memory ${i + 1}`}
                            className="admin-memory-group-card__thumb"
                            loading="lazy"
                          />
                        ))}
                      </div>

                      {/* ONE Shared Description */}
                      {photo.description ? (
                        <p className="admin-memory-group-card__desc">{photo.description}</p>
                      ) : (
                        <p className="admin-memory-group-card__desc" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                          No description provided for this memory.
                        </p>
                      )}

                      {/* Card Footer */}
                      <div className="admin-memory-group-card__footer">
                        <span className="admin-memory-group-card__date">
                          {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : '—'} · {urls.length} {urls.length === 1 ? 'image' : 'images'}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="admin-btn-action"
                            onClick={() => openEditMemoryModal(photo)}
                          >
                            Edit Memory
                          </button>
                          <button
                            type="button"
                            className="admin-btn-action admin-btn-action--delete"
                            onClick={() => setDeletingItem(photo)}
                          >
                            Delete Group
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REPLACE GALLERY IMAGE (Strictly Image-Only)                     */}
      {/* ========================================================================= */}
      {replacingGalleryPhoto && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-box">
            <h3 className="admin-modal-box__title">Replace Gallery Image</h3>
            <p className="admin-modal-box__text">
              Select a new image file to replace the existing photo. The old image will be permanently removed.
            </p>

            {replacePreview ? (
              <div className="admin-single-preview" style={{ marginBottom: '20px' }}>
                <img src={replacePreview} alt="Replacement Preview" className="admin-single-preview__img" />
                <button
                  type="button"
                  className="admin-preview-remove-btn"
                  onClick={() => {
                    setReplaceFile(null);
                    setReplacePreview('');
                    if (replaceInputRef.current) replaceInputRef.current.value = '';
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className="admin-dropzone"
                onClick={() => replaceInputRef.current?.click()}
                style={{ marginBottom: '20px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="admin-dropzone__text">Select Replacement Image</div>
                <div className="admin-dropzone__hint">JPG, PNG, WEBP (Max 10MB)</div>
              </div>
            )}

            <input
              ref={replaceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleReplaceFileChange}
              style={{ display: 'none' }}
            />

            <div className="admin-modal-box__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setReplacingGalleryPhoto(null);
                  setReplaceFile(null);
                  setReplacePreview('');
                }}
                disabled={isReplacingGallery}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveGalleryReplace}
                disabled={!replaceFile || isReplacingGallery}
              >
                {isReplacingGallery ? 'Replacing...' : 'Upload & Replace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT MEMORIES GROUP (Manage Images + Shared Description)        */}
      {/* ========================================================================= */}
      {editingMemory && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-box" style={{ maxWidth: '560px' }}>
            <h3 className="admin-modal-box__title">Edit Memory</h3>
            <p className="admin-modal-box__text">
              Manage the 1 to 4 images in this memory group and update the shared description.
            </p>

            {/* Images Grid */}
            <label className="admin-desc-label" style={{ marginBottom: '10px' }}>
              Images ({editKeepUrls.length + editNewFiles.length}/4)
            </label>
            <div className="admin-memories-preview-grid" style={{ marginBottom: '20px' }}>
              {/* Existing saved images */}
              {editKeepUrls.map((url, i) => (
                <div key={`existing-${i}`} className="admin-memory-preview-item">
                  <img src={url} alt={`Existing ${i + 1}`} />
                  <button
                    type="button"
                    className="admin-preview-remove-btn"
                    onClick={() => handleRemoveExistingMemoryPhoto(i)}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Newly added files */}
              {editNewFiles.map((file, i) => (
                <div key={`new-${i}`} className="admin-memory-preview-item">
                  <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} />
                  <span className="admin-memory-preview-item__badge">New</span>
                  <button
                    type="button"
                    className="admin-preview-remove-btn"
                    onClick={() => handleRemoveNewMemoryFile(i)}
                    title="Remove new image"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add slot if < 4 */}
              {editKeepUrls.length + editNewFiles.length < 4 && (
                <button
                  type="button"
                  className="admin-add-slot-btn"
                  onClick={() => editMemoryInputRef.current?.click()}
                  title="Add another image"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Image</span>
                </button>
              )}
            </div>

            <input
              ref={editMemoryInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAddEditMemoryFiles}
              style={{ display: 'none' }}
            />

            {/* ONE Shared Description */}
            <div className="admin-desc-group">
              <label htmlFor="edit-memory-desc" className="admin-desc-label">
                Shared Description
              </label>
              <textarea
                id="edit-memory-desc"
                className="admin-desc-textarea"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Shared description for this memories group..."
              />
            </div>

            <div className="admin-modal-box__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setEditingMemory(null)}
                disabled={isUpdatingMemory}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveMemoryEdit}
                disabled={isUpdatingMemory || editKeepUrls.length + editNewFiles.length === 0}
              >
                {isUpdatingMemory ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-box">
            <h3 className="admin-modal-box__title" style={{ color: '#fca5a5' }}>
              Confirm Deletion
            </h3>
            <p className="admin-modal-box__text">
              Are you sure you want to permanently delete this {deletingItem.category === 'memories' || deletingItem.image_url?.startsWith('[') ? 'memories group' : 'gallery photo'}?
              <br /><br />
              All associated files will be removed from Supabase Storage and database. This action cannot be undone.
            </p>
            <div className="admin-modal-box__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteItem}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
