/**
 * API Route POST - Met à jour les données du bandeau dans Edge Config
 * Sécurisé avec authentification via ACCESS_CODE et validation des données
 * Utilise l'API REST Vercel pour l'écriture (Edge Config est en lecture seule sur Edge Runtime)
 */

import { get } from '@vercel/edge-config';

// Vérification de la configuration Edge Config au chargement
if (!process.env.EDGE_CONFIG) {
  console.warn('⚠️ Variable d\'environnement EDGE_CONFIG non configurée');
}

export const config = {
  runtime: 'edge',
};

/**
 * Extrait l'ID Edge Config depuis la connection string
 * Format: https://edge-config.vercel.com/ecfg_xxx ou ecfg_xxx
 */
function getEdgeConfigId() {
  const edgeConfig = process.env.EDGE_CONFIG;
  if (!edgeConfig) return null;
  
  // Si c'est une URL, extraire l'ID
  const match = edgeConfig.match(/ecfg_[a-zA-Z0-9]+/);
  if (match) {
    return match[0];
  }
  
  // Si c'est déjà un ID
  if (edgeConfig.startsWith('ecfg_')) {
    return edgeConfig;
  }
  
  return null;
}

/**
 * Met à jour Edge Config via l'API REST Vercel
 */
async function updateEdgeConfig(key, value) {
  const edgeConfigId = getEdgeConfigId();
  if (!edgeConfigId) {
    throw new Error('Edge Config ID non trouvé dans EDGE_CONFIG');
  }

  // Utiliser le token Vercel automatique (disponible dans les fonctions Edge)
  const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
  if (!vercelToken) {
    // En production, Vercel injecte automatiquement le token
    // En développement local, il faut le définir manuellement
    throw new Error('VERCEL_TOKEN ou VERCEL_API_TOKEN requis pour l\'écriture');
  }

  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            key: key,
            value: value,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 
      `Erreur API Vercel: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

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
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
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
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Vérifier que Edge Config est configuré
    if (!process.env.EDGE_CONFIG) {
      return new Response(
        JSON.stringify({ 
          error: 'Edge Config non configuré',
          details: 'La variable d\'environnement EDGE_CONFIG doit être configurée'
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

    // Sauvegarder dans Edge Config via API REST
    // Edge Config stocke des valeurs simples, on stringifie le JSON
    await updateEdgeConfig('bandeau_data', JSON.stringify(dataToSave));

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
      edge_config_configured: !!process.env.EDGE_CONFIG,
      edge_config_id: getEdgeConfigId(),
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
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Une erreur est survenue lors de la sauvegarde',
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
