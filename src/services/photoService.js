import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const BUCKET_NAME = 'website-photos';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file type and size.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG/JPEG, PNG, and WEBP images are supported.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Generates a sanitized, unique filename with appropriate extension.
 */
function createUniquePath(category, file) {
  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extensionMap[file.type.toLowerCase()] || 'jpg';
  const cleanCategory = (category || 'gallery').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `${cleanCategory}/${timestamp}-${randomSuffix}.${ext}`;
}

/**
 * Helper to safely parse image URLs (handles single string or JSON array)
 */
export function parsePhotoUrls(imageUrl) {
  if (!imageUrl) return [];
  if (Array.isArray(imageUrl)) return imageUrl;
  if (typeof imageUrl === 'string') {
    if (imageUrl.startsWith('[')) {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [imageUrl];
  }
  return [];
}

/**
 * Helper to safely parse storage paths
 */
export function parseStoragePaths(storagePath) {
  if (!storagePath) return [];
  if (Array.isArray(storagePath)) return storagePath;
  if (typeof storagePath === 'string') {
    if (storagePath.startsWith('[')) {
      try {
        const parsed = JSON.parse(storagePath);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [storagePath];
  }
  return [];
}

// In-memory cache for getPhotos to prevent redundant network roundtrips on route navigation
const photosCache = new Map();
const CACHE_TTL_MS = 60_000; // 60 seconds

export function clearPhotoCache() {
  photosCache.clear();
}

/**
 * Fetches all photos or photos by category from Supabase.
 */
export async function getPhotos(category = null, forceRefresh = false) {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  const cacheKey = category || 'all';
  const cached = photosCache.get(cacheKey);
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data, error: null };
  }

  try {
    if (category && category !== 'all') {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (!error) {
        const result = data || [];
        photosCache.set(cacheKey, { data: result, timestamp: now });
        return { data: result, error: null };
      }

      // If category column does not exist in schema, query without category filter and strictly filter in-memory
      if (error.message && error.message.includes('category')) {
        const fallback = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallback.error) {
          return { data: [], error: fallback.error };
        }

        const filtered = (fallback.data || []).filter((p) => {
          if (p.category) {
            return p.category === category;
          }
          if (category === 'gallery') {
            return (
              p.storage_path?.startsWith('gallery/') ||
              (!p.image_url?.startsWith('[') && !p.storage_path?.startsWith('memories/'))
            );
          }
          if (category === 'memories') {
            return (
              p.storage_path?.startsWith('memories/') ||
              p.image_url?.startsWith('[')
            );
          }
          return false;
        });

        photosCache.set(cacheKey, { data: filtered, timestamp: now });
        return { data: filtered, error: null };
      }
      throw error;
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const result = data || [];
    photosCache.set(cacheKey, { data: result, timestamp: now });
    return { data: result, error: null };
  } catch (err) {
    console.error('Error fetching photos:', err.message);
    return { data: [], error: err };
  }
}

/**
 * GALLERY UPLOAD: Image-only (One image, no title/description)
 */
export async function uploadGalleryPhoto({ file, userId }) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  if (!file) {
    return { data: null, error: new Error('Please select an image file to upload.') };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { data: null, error: new Error(validation.error) };
  }

  const storagePath = createUniquePath('gallery', file);

  try {
    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '31536000',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to retrieve public URL from Supabase Storage.');
    }

    // 3. Insert record into database (image only)
    const payload = {
      title: 'Gallery Photo',
      description: '',
      category: 'gallery',
      image_url: urlData.publicUrl,
      storage_path: storagePath,
      created_by: userId || null,
    };

    let { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert(payload)
      .select()
      .single();

    if (dbError && dbError.message && dbError.message.includes('category')) {
      delete payload.category;
      const retry = await supabase.from('photos').insert(payload).select().single();
      photoData = retry.data;
      dbError = retry.error;
    }

    if (dbError) {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      throw new Error(`Database record creation failed: ${dbError.message}`);
    }

    clearPhotoCache();
    return { data: photoData, error: null };
  } catch (err) {
    console.error('Upload gallery photo error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * MEMORIES UPLOAD: 1 to 4 images + ONE shared description
 */
export async function uploadMemoriesGroup({ files, description = '', userId }) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  if (!files || files.length === 0) {
    return { data: null, error: new Error('Please select at least 1 image for this memory.') };
  }

  if (files.length > 4) {
    return { data: null, error: new Error('Memories allows a maximum of 4 images.') };
  }

  // Validate all files
  for (let i = 0; i < files.length; i++) {
    const val = validateImageFile(files[i]);
    if (!val.valid) {
      return { data: null, error: new Error(`Image ${i + 1}: ${val.error}`) };
    }
  }

  const uploadedPaths = [];
  const publicUrls = [];

  try {
    // 1. Upload all 1-4 images to Supabase Storage
    for (const file of files) {
      const storagePath = createUniquePath('memories', file);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      uploadedPaths.push(storagePath);
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      publicUrls.push(urlData.publicUrl);
    }

    // 2. Insert ONE Memories record with all image URLs and ONE shared description
    const payload = {
      title: 'Memory',
      description: (description || '').trim(),
      category: 'memories',
      image_url: JSON.stringify(publicUrls),
      storage_path: JSON.stringify(uploadedPaths),
      created_by: userId || null,
    };

    let { data: memoryData, error: dbError } = await supabase
      .from('photos')
      .insert(payload)
      .select()
      .single();

    if (dbError && dbError.message && dbError.message.includes('category')) {
      delete payload.category;
      const retry = await supabase.from('photos').insert(payload).select().single();
      memoryData = retry.data;
      dbError = retry.error;
    }

    if (dbError) {
      // Cleanup all uploaded files
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(uploadedPaths);
      }
      throw new Error(`Failed to save memory record: ${dbError.message}`);
    }

    clearPhotoCache();
    return { data: memoryData, error: null };
  } catch (err) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(uploadedPaths);
    }
    console.error('Upload memories error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Updates a Memories group's shared description
 */
export async function updateMemoryDescription(id, description) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('photos')
      .update({
        description: (description || '').trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error updating memory description:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Updates a Memories group: manages images (keep, add, remove) and updates shared description.
 * Enforces maximum of 4 images total and 1 shared description.
 */
export async function updateMemoriesGroup(id, {
  keepUrls = [],
  keepPaths = [],
  newFiles = [],
  removedPaths = [],
  description = '',
}) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const totalCount = keepUrls.length + newFiles.length;
  if (totalCount === 0) {
    return { data: null, error: new Error('Memories group must have at least 1 image.') };
  }
  if (totalCount > 4) {
    return { data: null, error: new Error('Memories allows a maximum of 4 images.') };
  }

  // Validate new files
  for (let i = 0; i < newFiles.length; i++) {
    const val = validateImageFile(newFiles[i]);
    if (!val.valid) {
      return { data: null, error: new Error(val.error) };
    }
  }

  const newlyUploadedPaths = [];
  const finalUrls = [...keepUrls];
  const finalPaths = [...keepPaths];

  try {
    // 1. Upload new files if any
    for (const file of newFiles) {
      const storagePath = createUniquePath('memories', file);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      newlyUploadedPaths.push(storagePath);
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      finalUrls.push(urlData.publicUrl);
      finalPaths.push(storagePath);
    }

    // 2. Update DB record
    const { data: updatedRecord, error: dbError } = await supabase
      .from('photos')
      .update({
        description: (description || '').trim(),
        image_url: JSON.stringify(finalUrls),
        storage_path: JSON.stringify(finalPaths),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (newlyUploadedPaths.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(newlyUploadedPaths);
      }
      throw new Error(`Failed to update memory: ${dbError.message}`);
    }

    // 3. Delete removed files from storage
    if (removedPaths && removedPaths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(removedPaths);
    }

    clearPhotoCache();
    return { data: updatedRecord, error: null };
  } catch (err) {
    if (newlyUploadedPaths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(newlyUploadedPaths);
    }
    console.error('Update memories group error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Replaces a single Gallery image file
 */
export async function replaceGalleryPhoto(id, { newFile, oldStoragePath }) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const validation = validateImageFile(newFile);
  if (!validation.valid) {
    return { data: null, error: new Error(validation.error) };
  }

  const newStoragePath = createUniquePath('gallery', newFile);

  try {
    // 1. Upload new image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newStoragePath, newFile, {
        cacheControl: '31536000',
        upsert: false,
        contentType: newFile.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload replacement image: ${uploadError.message}`);
    }

    // 2. Get new public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newStoragePath);

    // 3. Update database record
    const { data: updatedRecord, error: dbError } = await supabase
      .from('photos')
      .update({
        image_url: urlData.publicUrl,
        storage_path: newStoragePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from(BUCKET_NAME).remove([newStoragePath]);
      throw new Error(`Failed to update photo record: ${dbError.message}`);
    }

    // 4. Remove old image from storage
    if (oldStoragePath) {
      const paths = parseStoragePaths(oldStoragePath);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(paths);
      }
    }

    clearPhotoCache();
    return { data: updatedRecord, error: null };
  } catch (err) {
    console.error('Replace gallery photo error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Deletes a photo or memories group from both Supabase Storage and Database.
 */
export async function deletePhoto(id, storagePath) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    // 1. Remove from database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(`Failed to delete record: ${dbError.message}`);
    }

    // 2. Remove file(s) from storage (handles single path or array)
    if (storagePath) {
      const paths = parseStoragePaths(storagePath);
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(paths);

        if (storageError) {
          console.warn('Storage deletion warning:', storageError.message);
        }
      }
    }

    clearPhotoCache();
    return { success: true, error: null };
  } catch (err) {
    console.error('Delete photo error:', err.message);
    return { success: false, error: err };
  }
}
