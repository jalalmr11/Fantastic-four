import { useState, useEffect } from 'react';
import './AddMemoryModal.css';

const MAX_PHOTOS = 4;

export default function AddMemoryModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    photos: [],       // array of base64 strings
    photoPreviews: [], // array of base64 preview strings
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm({ title: '', description: '', date: '', location: '', photos: [], photoPreviews: [] });
      setErrors({});
      setSuccess(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Please add a title';
    if (!form.description.trim()) errs.description = 'Please add a description';
    if (form.photos.length === 0) errs.photos = 'Please add at least 1 photo';
    return errs;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAddPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    e.target.value = '';

    if (form.photos.length >= MAX_PHOTOS) {
      setErrors((prev) => ({ ...prev, photos: `Maximum ${MAX_PHOTOS} photos allowed per memory` }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photos: 'Please select an image file' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photos: 'Image must be under 10MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ev.target.result],
        photoPreviews: [...prev.photoPreviews, ev.target.result],
      }));
      setErrors((prev) => ({ ...prev, photos: null }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== indexToRemove),
      photoPreviews: prev.photoPreviews.filter((_, i) => i !== indexToRemove),
    }));
    setErrors((prev) => ({ ...prev, photos: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const newMemory = {
      id: `memory-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      location: form.location.trim(),
      photos: form.photos,
    };

    onAdd(newMemory);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const canAddMore = form.photos.length < MAX_PHOTOS;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add new memory">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Add New Memory</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close" id="add-memory-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="modal__success">
            <div className="modal__success-icon">✓</div>
            <p>Memory added successfully!</p>
          </div>
        ) : (
          <form className="modal__form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="memory-title" className="form-label">Title *</label>
              <input
                id="memory-title"
                type="text"
                className={`form-input ${errors.title ? 'form-input--error' : ''}`}
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Give this memory a name..."
                maxLength={100}
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Photos * <span className="form-label__hint">({form.photos.length}/{MAX_PHOTOS})</span>
              </label>

              {/* Photo previews */}
              {form.photoPreviews.length > 0 && (
                <div className="form-photos__grid">
                  {form.photoPreviews.map((preview, i) => (
                    <div key={i} className="form-photos__item">
                      <img src={preview} alt={`Photo ${i + 1}`} />
                      <button
                        type="button"
                        className="form-photos__remove"
                        onClick={() => removePhoto(i)}
                        aria-label={`Remove photo ${i + 1}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <span className="form-photos__number">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add photo button */}
              {canAddMore && (
                <label htmlFor="memory-photo-input" className="form-file__drop">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span>
                    {form.photos.length === 0
                      ? 'Click to add a photo (1–4 photos)'
                      : `Add another photo (${MAX_PHOTOS - form.photos.length} remaining)`
                    }
                  </span>
                </label>
              )}

              {!canAddMore && (
                <p className="form-photos__max">Maximum {MAX_PHOTOS} photos reached</p>
              )}

              <input
                id="memory-photo-input"
                type="file"
                accept="image/*"
                onChange={handleAddPhoto}
                className="form-file__input"
              />
              {errors.photos && <span className="form-error">{errors.photos}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="memory-desc" className="form-label">Description *</label>
              <textarea
                id="memory-desc"
                className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="What made this moment special?"
                rows={4}
                maxLength={500}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="memory-date" className="form-label">Date</label>
                <input
                  id="memory-date"
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="memory-location" className="form-label">Location</label>
                <input
                  id="memory-location"
                  type="text"
                  className="form-input"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Where was this?"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={onClose} id="add-memory-cancel">
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" id="add-memory-submit">
                Add Memory
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
