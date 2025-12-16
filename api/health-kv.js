/**
 * Route de vérification de la connexion Vercel KV
 * Permet de diagnostiquer les problèmes de connexion à la base de données
 */

import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'GET',
        },
      }
    );
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    kv_configured: false,
    kv_connected: false,
    env_vars: {},
    error: null,
    test_result: null,
  };

  try {
    // Vérifier les variables d'environnement
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    
    diagnostics.env_vars = {
      KV_REST_API_URL: kvUrl ? `${kvUrl.substring(0, 20)}...` : 'NOT SET',
      KV_REST_API_TOKEN: kvToken ? `${kvToken.substring(0, 10)}...` : 'NOT SET',
      has_url: !!kvUrl,
      has_token: !!kvToken,
    };

    diagnostics.kv_configured = !!(kvUrl && kvToken);

    if (!diagnostics.kv_configured) {
      diagnostics.error = 'Variables d\'environnement KV non configurées';
      return new Response(
        JSON.stringify(diagnostics, null, 2),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Tester la connexion avec une opération simple
    const testKey = 'bandeau:health-check';
    const testValue = { test: true, timestamp: Date.now() };
    
    // Test d'écriture
    await kv.set(testKey, testValue, { ex: 10 }); // Expire dans 10 secondes
    
    // Test de lecture
    const readValue = await kv.get(testKey);
    
    if (readValue && readValue.test === true) {
      diagnostics.kv_connected = true;
      diagnostics.test_result = {
        write: 'OK',
        read: 'OK',
        value: readValue,
      };
      
      // Nettoyer la clé de test
      await kv.del(testKey);
    } else {
      diagnostics.kv_connected = false;
      diagnostics.error = 'La lecture/écriture a échoué';
    }

    // Test supplémentaire : vérifier si la clé principale existe
    const mainData = await kv.get('bandeau:data');
    diagnostics.test_result.main_key_exists = !!mainData;

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      {
        status: diagnostics.kv_connected ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    diagnostics.error = error.message;
    diagnostics.error_stack = error.stack;
    
    return new Response(
      JSON.stringify(diagnostics, null, 2),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

