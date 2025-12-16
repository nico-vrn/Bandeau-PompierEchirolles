/**
 * Route de vérification de la connexion Edge Config
 * Permet de diagnostiquer les problèmes de connexion à Edge Config
 */

import { get } from '@vercel/edge-config';

export const config = {
  runtime: 'edge',
};

/**
 * Extrait l'ID Edge Config depuis la connection string
 */
function getEdgeConfigId() {
  const edgeConfig = process.env.EDGE_CONFIG;
  if (!edgeConfig) return null;
  
  const match = edgeConfig.match(/ecfg_[a-zA-Z0-9]+/);
  if (match) {
    return match[0];
  }
  
  if (edgeConfig.startsWith('ecfg_')) {
    return edgeConfig;
  }
  
  return null;
}

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
    edge_config_configured: false,
    edge_config_connected: false,
    env_vars: {},
    error: null,
    test_result: null,
  };

  try {
    // Vérifier les variables d'environnement
    const edgeConfig = process.env.EDGE_CONFIG;
    const edgeConfigId = getEdgeConfigId();
    
    diagnostics.env_vars = {
      EDGE_CONFIG: edgeConfig ? `${edgeConfig.substring(0, 30)}...` : 'NOT SET',
      EDGE_CONFIG_ID: edgeConfigId || 'NOT FOUND',
      has_edge_config: !!edgeConfig,
      has_id: !!edgeConfigId,
    };

    diagnostics.edge_config_configured = !!edgeConfig;

    if (!diagnostics.edge_config_configured) {
      diagnostics.error = 'Variable d\'environnement EDGE_CONFIG non configurée';
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

    // Tester la lecture avec une opération simple
    try {
      const testValue = await get('bandeau_data');
      
      diagnostics.edge_config_connected = true;
      diagnostics.test_result = {
        read: 'OK',
        main_key_exists: testValue !== undefined && testValue !== null,
        value_type: typeof testValue,
      };
      
      // Si la valeur existe, essayer de la parser
      if (testValue) {
        try {
          const parsed = typeof testValue === 'string' ? JSON.parse(testValue) : testValue;
          diagnostics.test_result.parsed_successfully = true;
          diagnostics.test_result.has_html = !!parsed.html;
          diagnostics.test_result.has_speed = parsed.speed !== undefined;
          diagnostics.test_result.has_color = !!parsed.color;
        } catch (e) {
          diagnostics.test_result.parsed_successfully = false;
          diagnostics.test_result.parse_error = e.message;
        }
      }
    } catch (readError) {
      diagnostics.edge_config_connected = false;
      diagnostics.error = `Erreur de lecture: ${readError.message}`;
      diagnostics.test_result = {
        read: 'FAILED',
        error: readError.message,
      };
    }

    // Note sur l'écriture
    diagnostics.test_result.write_note = 'L\'écriture nécessite VERCEL_TOKEN et utilise l\'API REST Vercel';

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      {
        status: diagnostics.edge_config_connected ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    diagnostics.error = error.message;
    diagnostics.error_stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
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

