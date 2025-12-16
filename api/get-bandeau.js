/**
 * API Route GET - Récupère les données du bandeau depuis Edge Config
 * Retourne les valeurs par défaut si aucune donnée n'existe
 */

import { get } from '@vercel/edge-config';

// Vérification de la configuration Edge Config au chargement
if (!process.env.EDGE_CONFIG) {
  console.warn('⚠️ Variable d\'environnement EDGE_CONFIG non configurée');
}

const CHECKMARK_BLUE_SVG_HTML = '<svg class="blue-check-svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
const DEFAULT_COLOR = '#FFFFFF';

// Messages par défaut au format HTML
const defaultMessagesHTML = `
  ${CHECKMARK_BLUE_SVG_HTML} Engin : <span class="status-red">néant</span><br><br>
  ${CHECKMARK_BLUE_SVG_HTML} Rue barrée : <span class="status-yellow">néant</span><br><br>
  ${CHECKMARK_BLUE_SVG_HTML} Divers : <span class="status-blue">néant</span><br><br>
  ${CHECKMARK_BLUE_SVG_HTML} Manoeuvre: néant<br><br>
  ${CHECKMARK_BLUE_SVG_HTML} Sport:<br><br>
  ${CHECKMARK_BLUE_SVG_HTML} Merci de votre coopération
`;

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Seulement GET autorisé
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'GET',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  }

  try {
    // Vérifier que Edge Config est configuré
    if (!process.env.EDGE_CONFIG) {
      throw new Error('Edge Config non configuré : variable d\'environnement EDGE_CONFIG manquante');
    }

    // Récupération des données depuis Edge Config
    // Edge Config stocke des valeurs simples, on récupère le JSON stringifié
    const dataJson = await get('bandeau_data');

    // Si aucune donnée n'existe, retourner les valeurs par défaut
    if (!dataJson) {
      return new Response(
        JSON.stringify({
          html: defaultMessagesHTML,
          speed: 5,
          color: DEFAULT_COLOR,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60', // Cache de 60 secondes
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Parser le JSON stocké
    let data;
    if (typeof dataJson === 'string') {
      data = JSON.parse(dataJson);
    } else {
      data = dataJson; // Si déjà un objet
    }

    // Retourner les données stockées
    return new Response(
      JSON.stringify({
        html: data.html || defaultMessagesHTML,
        speed: data.speed || 5,
        color: data.color || DEFAULT_COLOR,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching bandeau data:', error);
    console.error('Error details:', {
      message: error.message,
      edge_config_configured: !!process.env.EDGE_CONFIG,
    });
    
    // En cas d'erreur, retourner les valeurs par défaut avec détails de l'erreur
    return new Response(
      JSON.stringify({
        html: defaultMessagesHTML,
        speed: 5,
        color: DEFAULT_COLOR,
        error: 'Failed to load data, using defaults',
        error_details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        edge_config_configured: !!process.env.EDGE_CONFIG,
      }),
      {
        status: 200, // 200 pour permettre le fonctionnement même en cas d'erreur
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
