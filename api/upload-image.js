/**
 * API Route POST - Upload d'images vers Vercel Blob Storage
 * Sécurisé avec authentification via ACCESS_CODE et validation des fichiers
 * Taille maximale : 2MB
 * Types acceptés : JPEG, PNG, GIF, WEBP
 */

import { put } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
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
 * Valide le fichier uploadé
 */
function validateFile(file) {
  const errors = [];

  // Vérifier le type MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(`Type de fichier non autorisé. Types acceptés : ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Fichier trop volumineux. Taille maximale : ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Vérifier qu'il y a bien un fichier
  if (!file || file.size === 0) {
    errors.push('Aucun fichier fourni');
  }

  return errors;
}

/**
 * Génère un nom de fichier sécurisé et unique
 */
function generateSafeFilename(originalName, mimeType) {
  // Extraire l'extension depuis le type MIME ou le nom de fichier
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
    // Fallback : extraire depuis le nom original
    const match = originalName.match(/\.([^.]+)$/);
    extension = match ? `.${match[1]}` : '';
  }

  // Générer un UUID simple (format simplifié pour Edge Runtime)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uuid = `${timestamp}-${random}`;

  return `bandeau-${uuid}${extension}`;
}

export default async function handler(req) {
  // Seulement POST autorisé
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  }

  try {
    // Parser le FormData
    const formData = await req.formData();
    const file = formData.get('file');
    const accessCode = formData.get('accessCode');

    // Debug logging
    console.log('Upload attempt:', {
      hasFile: !!file,
      fileType: file?.type,
      fileSize: file?.size,
      hasAccessCode: !!accessCode,
      accessCodeMatches: accessCode === process.env.ACCESS_CODE,
      expectedCode: process.env.ACCESS_CODE
    });

    // Vérifier le code d'accès
    if (!accessCode || accessCode !== process.env.ACCESS_CODE) {
      console.error('Access code mismatch:', { received: accessCode, expected: process.env.ACCESS_CODE });
      return new Response(
        JSON.stringify({ 
          error: 'Code d\'accès incorrect ou manquant',
          details: !accessCode ? 'Code manquant' : 'Code incorrect'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Vérifier qu'un fichier a été fourni
    // Note: Dans Vercel Edge Runtime, instanceof File peut retourner false
    // On vérifie plutôt les propriétés du fichier (Blob-like object)
    if (!file || !file.name || !file.type || typeof file.size !== 'number') {
      console.error('File validation failed:', { 
        file: !!file, 
        hasName: !!file?.name, 
        hasType: !!file?.type, 
        hasSize: typeof file?.size === 'number' 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Aucun fichier fourni',
          details: !file ? 'Pas de fichier dans la requête' : 'Le fichier n\'est pas valide'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Valider le fichier
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Générer un nom de fichier sécurisé
    const safeFilename = generateSafeFilename(file.name, file.type);

    // Upload vers Vercel Blob Storage
    const blob = await put(safeFilename, file, {
      access: 'public',
      contentType: file.type,
    });

    // Retourner l'URL de l'image
    return new Response(
      JSON.stringify({ 
        success: true,
        url: blob.url,
        filename: safeFilename
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Une erreur est survenue lors de l\'upload de l\'image',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  }
}
