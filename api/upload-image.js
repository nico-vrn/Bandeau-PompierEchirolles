/**
 * API Route POST - Upload d'images vers Vercel Blob Storage
 * Sécurisé avec authentification via ACCESS_CODE et validation des fichiers
 * Taille maximale : 2MB
 * Types acceptés : JPEG, PNG, GIF, WEBP
 */

import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false, // Désactiver le body parser par défaut pour gérer FormData
  },
};

// Types MIME acceptés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Taille maximale : 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Parser le FormData avec formidable
 */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      allowEmptyFiles: false,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

/**
 * Génère un nom de fichier sécurisé et unique
 */
function generateSafeFilename(originalName, mimeType) {
  let extension = '';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    extension = '.jpg';
  } else if (mimeType.includes('png')) {
    extension = '.png';
  } else if (mimeType.includes('gif')) {
    extension = '.gif';
  } else if (mimeType.includes('webp')) {
    extension = '.webp';
  } else {
    const match = originalName.match(/\.([^.]+)$/);
    extension = match ? `.${match[1]}` : '';
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uuid = `${timestamp}-${random}`;

  return `bandeau-${uuid}${extension}`;
}

export default async function handler(req, res) {
  // Seulement POST autorisé
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    // Parser le FormData
    const { fields, files } = await parseForm(req);
    
    const fileArray = files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    const accessCodeArray = fields.accessCode;
    const accessCode = Array.isArray(accessCodeArray) ? accessCodeArray[0] : accessCodeArray;

    // Debug logging
    console.log('Upload attempt:', {
      hasFile: !!file,
      fileType: file?.mimetype,
      fileSize: file?.size,
      hasAccessCode: !!accessCode,
      accessCodeMatches: accessCode === process.env.ACCESS_CODE,
    });

    // Vérifier le code d'accès
    if (!accessCode || accessCode !== process.env.ACCESS_CODE) {
      console.error('Access code mismatch');
      return res.status(403).json({
        error: 'Code d\'accès incorrect ou manquant',
        details: !accessCode ? 'Code manquant' : 'Code incorrect'
      });
    }

    // Vérifier qu'un fichier a été fourni
    if (!file || !file.filepath) {
      console.error('File validation failed');
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      });
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Type de fichier non autorisé',
        details: `Types acceptés : ${ALLOWED_MIME_TYPES.join(', ')}`
      });
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        details: `Taille maximale : ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }

    // Lire le fichier
    const fileBuffer = readFileSync(file.filepath);

    // Générer un nom de fichier sécurisé
    const safeFilename = generateSafeFilename(file.originalFilename || 'image', file.mimetype);

    // Upload vers Vercel Blob Storage
    const blob = await put(safeFilename, fileBuffer, {
      access: 'public',
      contentType: file.mimetype,
    });

    // Retourner l'URL de l'image
    return res.status(200).json({
      success: true,
      url: blob.url,
      filename: safeFilename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Une erreur est survenue lors de l\'upload de l\'image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
