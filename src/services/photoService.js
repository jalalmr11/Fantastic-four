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
 * Fetches all photos or photos by category from Supabase.
 * Gracefully handles databases that do or do not have a category column.
 */
export async function getPhotos(category = null) {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    if (category && category !== 'all') {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (!error) {
        return { data: data || [], error: null };
      }

      // If category column does not exist in schema, query without category filter
      if (error.message && error.message.includes('category')) {
        const fallback = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false });
        return { data: fallback.data || [], error: fallback.error };
      }
      throw error;
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching photos:', err.message);
    return { data: [], error: err };
  }
}

/**
 * Uploads a photo to Supabase Storage and records metadata in the database.
 */
export async function uploadPhoto({ file, title, description = '', category = 'gallery', userId }) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured. Please add your credentials to .env.local') };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { data: null, error: new Error(validation.error) };
  }

  const storagePath = createUniquePath(category, file);

  try {
    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
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

    // 3. Insert record into database
    const payload = {
      title: title.trim(),
      description: (description || '').trim(),
      image_url: urlData.publicUrl,
      storage_path: storagePath,
      created_by: userId || null,
    };
    if (category) {
      payload.category = category;
    }

    let { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert(payload)
      .select()
      .single();

    // If category column does not exist in user's table, retry without category
    if (dbError && dbError.message && dbError.message.includes('category')) {
      delete payload.category;
      const retry = await supabase
        .from('photos')
        .insert(payload)
        .select()
        .single();
      photoData = retry.data;
      dbError = retry.error;
    }

    if (dbError) {
      // Clean up orphaned file from storage if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      throw new Error(`Database record creation failed: ${dbError.message}`);
    }

    return { data: photoData, error: null };
  } catch (err) {
    console.error('Upload photo error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Updates an existing photo's metadata (title, description, category).
 */
export async function updatePhotoMetadata(id, { title, description, category }) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const payload = {
      title: title.trim(),
      description: (description || '').trim(),
    };
    if (category) {
      payload.category = category;
    }

    let { data, error } = await supabase
      .from('photos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    // If category column doesn't exist, retry without it
    if (error && error.message && error.message.includes('category')) {
      delete payload.category;
      const retry = await supabase
        .from('photos')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error updating photo metadata:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Replaces an existing photo with a newly uploaded file.
 */
export async function replacePhotoFile(id, { newFile, oldStoragePath, category }) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const validation = validateImageFile(newFile);
  if (!validation.valid) {
    return { data: null, error: new Error(validation.error) };
  }

  const newStoragePath = createUniquePath(category || 'gallery', newFile);

  try {
    // 1. Upload new image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newStoragePath, newFile, {
        cacheControl: '3600',
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
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      // Revert newly uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([newStoragePath]);
      throw new Error(`Failed to update photo record: ${dbError.message}`);
    }

    // 4. Remove old image from storage if it exists
    if (oldStoragePath) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([oldStoragePath]);

      if (removeError) {
        console.warn('Could not remove previous image from storage:', removeError.message);
      }
    }

    return { data: updatedRecord, error: null };
  } catch (err) {
    console.error('Replace photo error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Deletes a photo from both Supabase Storage and Database.
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

    // 2. Remove file from storage
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) {
        console.warn('File record removed but storage deletion had an issue:', storageError.message);
      }
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Delete photo error:', err.message);
    return { success: false, error: err };
  }
}
