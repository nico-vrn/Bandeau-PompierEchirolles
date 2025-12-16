/**
 * Module de communication avec l'API Vercel
 * Gère le chargement et la sauvegarde des données du bandeau
 */

const STORAGE_KEY_TEXT = 'bandeau_html_content'; 
const STORAGE_KEY_SPEED = 'bandeau_speed';
const STORAGE_KEY_COLOR = 'bandeau_color';

/**
 * Charge les données du bandeau depuis l'API
 * Fallback sur localStorage si l'API échoue
 * @returns {Promise<{html: string, speed: number, color: string}>}
 */
async function loadBandeauData() {
  try {
    const response = await fetch('/api/get-bandeau');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Si les données de l'API sont vides mais qu'on a des données locales,
    // on retourne les données locales (la migration se fera lors de la première sauvegarde)
    const localHtml = localStorage.getItem(STORAGE_KEY_TEXT);
    if (localHtml && (!data.html || data.html === '')) {
      return {
        html: localHtml,
        speed: parseInt(localStorage.getItem(STORAGE_KEY_SPEED) || '5', 10),
        color: localStorage.getItem(STORAGE_KEY_COLOR) || '#FFFFFF'
      };
    }
    
    return data;
  } catch (error) {
    console.warn('Erreur lors du chargement depuis l\'API, utilisation du localStorage:', error);
    
    // Fallback sur localStorage
    const savedHtml = localStorage.getItem(STORAGE_KEY_TEXT);
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
    const savedColor = localStorage.getItem(STORAGE_KEY_COLOR);
    
    return {
      html: savedHtml || '',
      speed: savedSpeed ? parseInt(savedSpeed, 10) : 5,
      color: savedColor || '#FFFFFF'
    };
  }
}

/**
 * Sauvegarde les données du bandeau via l'API
 * Sauvegarde également en localStorage comme backup
 * @param {string} html - Contenu HTML du bandeau
 * @param {number} speed - Vitesse de défilement en secondes
 * @param {string} color - Couleur principale du texte
 * @param {string} accessCode - Code d'accès pour l'authentification
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
async function saveBandeauData(html, speed, color, accessCode) {
  // Sauvegarde locale immédiate (backup)
  localStorage.setItem(STORAGE_KEY_TEXT, html);
  localStorage.setItem(STORAGE_KEY_SPEED, String(speed));
  localStorage.setItem(STORAGE_KEY_COLOR, color);
  
  // Si pas de code d'accès, on sauvegarde seulement en local
  if (!accessCode) {
    return {
      success: false,
      message: 'Sauvegarde locale uniquement (code d\'accès requis pour la base de données)',
      localOnly: true
    };
  }
  
  try {
    const response = await fetch('/api/update-bandeau', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html,
        speed,
        color,
        accessCode: accessCode
      })
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (response.status === 403) {
        errorMessage = 'Code d\'accès incorrect';
      } else if (response.status === 400) {
        errorMessage = responseData.details?.[0] || responseData.error || 'Données invalides';
      } else if (response.status === 503) {
        errorMessage = 'Base de données non disponible. Vérifiez la configuration KV.';
      } else {
        errorMessage = responseData.error || `Erreur HTTP ${response.status}`;
      }
      
      return {
        success: false,
        message: errorMessage,
        error: responseData.error,
        status: response.status
      };
    }
    
    if (responseData.success) {
      return {
        success: true,
        message: 'Modifications sauvegardées avec succès dans la base de données'
      };
    } else {
      return {
        success: false,
        message: 'La sauvegarde a échoué',
        error: responseData.error
      };
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde via l\'API:', error);
    return {
      success: false,
      message: 'Erreur de connexion. Les données sont sauvegardées localement uniquement.',
      error: error.message,
      localOnly: true
    };
  }
}

