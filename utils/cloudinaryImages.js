import cloudinary from '@/config/cloudinary';

const CLOUDINARY_FOLDER = 'RecipeApp';

// Upload image File objects (from FormData) to Cloudinary in parallel.
// Returns the secure URLs in the same order as the input files.
export const uploadImages = async (files) => {
  const uploads = files.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: CLOUDINARY_FOLDER,
    });

    return result.secure_url;
  });

  return Promise.all(uploads);
};

// Extract the Cloudinary public_id from a delivery URL, e.g.
// https://res.cloudinary.com/<cloud>/image/upload/v123/RecipeApp/abc.jpg -> RecipeApp/abc
// Returns null for non-Cloudinary images (e.g. seed images stored in /public).
const getPublicId = (url) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null;
  }
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
};

// Delete images from Cloudinary. Failures are logged, not thrown, so a
// Cloudinary hiccup never blocks deleting or updating the recipe itself.
export const deleteImages = async (urls = []) => {
  const publicIds = urls.map(getPublicId).filter(Boolean);

  const results = await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id))
  );

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Failed to delete Cloudinary image ${publicIds[i]}:`, result.reason);
    }
  });
};
