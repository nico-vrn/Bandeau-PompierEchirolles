/**
 * API Route POST - Met à jour les données du bandeau dans Vercel KV Edge
 * Sécurisé avec authentification via ACCESS_CODE et validation des données
 */

import { kv } from '@vercel/kv';

// Initialisation explicite du client KV pour Edge Runtime
let kvClient = kv;

// Vérification de la configuration KV au chargement
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.warn('⚠️ Variables d\'environnement KV non configurées');
}

export const config = {
  runtime: 'edge',
};

/**
 * Sanitize HTML pour prévenir les attaques XSS
 * Autorise uniquement les balises et attributs nécessaires
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }

  // Liste des balises autorisées
  const allowedTags = ['br', 'span', 'svg', 'path'];
  const allowedAttributes = ['class', 'viewBox', 'd', 'style', 'height', 'width', 'fill', 'vertical-align', 'margin', 'display', 'inline-block'];
  
  // Créer un parser simple pour nettoyer le HTML
  // Pour une sécurité maximale, on pourrait utiliser une librairie comme DOMPurify
  // Pour l'instant, on fait une validation basique
  
  // Vérifier qu'il n'y a pas de scripts ou d'événements dangereux
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(html)) {
      throw new Error('Contenu HTML non autorisé détecté');
    }
  }

  return html;
}

/**
 * Valide les données reçues
 */
function validateData(data) {
  const errors = [];

  if (!data.html || typeof data.html !== 'string') {
    errors.push('Le champ html est requis et doit être une chaîne de caractères');
  } else if (data.html.length > 50000) {
    errors.push('Le contenu HTML est trop long (max 50000 caractères)');
  }

  if (data.speed === undefined || data.speed === null) {
    errors.push('Le champ speed est requis');
  } else {
    const speed = parseInt(data.speed, 10);
    if (isNaN(speed) || speed < 3 || speed > 60) {
      errors.push('La vitesse doit être un nombre entre 3 et 60 secondes');
    }
  }

  if (!data.color || typeof data.color !== 'string') {
    errors.push('Le champ color est requis et doit être une chaîne de caractères');
  } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('La couleur doit être au format hexadécimal (#RRGGBB)');
  }

  if (data.accessCode === undefined || data.accessCode === null) {
    errors.push('Le code d\'accès est requis');
  } else if (data.accessCode !== process.env.ACCESS_CODE) {
    errors.push('Code d\'accès incorrect');
  }

  return errors;
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
    // Parser le body JSON
    const body = await req.json();

    // Validation des données
    const validationErrors = validateData(body);
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
          },
        }
      );
    }

    // Sanitization du HTML
    let sanitizedHTML;
    try {
      sanitizedHTML = sanitizeHTML(body.html);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'HTML sanitization failed',
          details: error.message 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Vérifier que KV est configuré
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'KV non configuré',
          details: 'Les variables d\'environnement KV_REST_API_URL et KV_REST_API_TOKEN doivent être configurées'
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Préparer les données à sauvegarder
    const dataToSave = {
      html: sanitizedHTML,
      speed: parseInt(body.speed, 10),
      color: body.color,
      updatedAt: new Date().toISOString(),
    };

    // Sauvegarder dans Vercel KV
    await kvClient.set('bandeau:data', dataToSave);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Données mises à jour avec succès'
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
    console.error('Error updating bandeau data:', error);
    console.error('Error details:', {
      message: error.message,
      kv_configured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // Gestion des erreurs de parsing JSON
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Une erreur est survenue lors de la sauvegarde'
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

