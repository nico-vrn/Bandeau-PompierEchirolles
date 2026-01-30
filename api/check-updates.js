/**
 * API Route GET - Vérifie s'il y a des mises à jour du bandeau
 * Retourne uniquement le timestamp lastModified pour optimiser les requêtes
 * Utilisé pour le polling de refresh automatique multi-navigateurs
 */

import { get } from '@vercel/edge-config';

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
      return new Response(
        JSON.stringify({
          lastModified: new Date().toISOString(),
          error: 'Edge Config non configuré',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Récupération des données depuis Edge Config
    const data = await get('bandeau_data');

    // Retourner le timestamp lastModified (ou timestamp actuel si aucune donnée)
    const lastModified = data?.lastModified || new Date().toISOString();

    return new Response(
      JSON.stringify({
        lastModified: lastModified,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  } catch (error) {
    console.error('Error checking updates:', error);
    
    // En cas d'erreur, retourner un timestamp actuel pour éviter les blocages
    return new Response(
      JSON.stringify({
        lastModified: new Date().toISOString(),
        error: 'Failed to check updates',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  }
}
