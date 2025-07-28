import cloudinary from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Configuration de Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload une image sur Cloudinary
 * @param {string} imageData - L'image en base64
 * @returns {Promise<string>} - L'URL de l'image uploadée
 */
export const uploadImage = async (imageData) => {
  try {
    // Générer un nom unique pour l'image
    const publicId = `taphair/${uuidv4()}`;

    // Upload de l'image
    const result = await cloudinary.v2.uploader.upload(imageData, {
      public_id: publicId,
      folder: 'taphair',
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
};

/**
 * Supprime une image de Cloudinary
 * @param {string} imageUrl - L'URL de l'image à supprimer
 * @returns {Promise<void>}
 */
export const deleteImage = async (imageUrl) => {
  try {
    // Extraire le public_id de l'URL
    const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];

    // Supprimer l'image
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    throw new Error('Erreur lors de la suppression de l\'image');
  }
}; 