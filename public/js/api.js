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
 * @returns {Promise<boolean>}
 */
async function saveBandeauData(html, speed, color, accessCode) {
  // Sauvegarde locale immédiate (backup)
  localStorage.setItem(STORAGE_KEY_TEXT, html);
  localStorage.setItem(STORAGE_KEY_SPEED, String(speed));
  localStorage.setItem(STORAGE_KEY_COLOR, color);
  
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
        accessCode: accessCode || ''
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde via l\'API:', error);
    // Les données sont déjà sauvegardées dans localStorage
    return false;
  }
}

