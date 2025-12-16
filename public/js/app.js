/**
 * Logique principale de l'application bandeau défilant
 * Gère l'interface utilisateur, les animations et les interactions
 */

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

const root = document.documentElement;

// Variable globale pour stocker le code d'accès
let currentAccessCode = null;

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée d'affichage en millisecondes (défaut: 4000)
 */
function showNotification(message, type = 'info', duration = 4000) {
  // Supprimer les notifications existantes
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notif => {
    notif.classList.add('hiding');
    setTimeout(() => notif.remove(), 300);
  });

  // Créer la notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Icône selon le type
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  notification.innerHTML = `
    <span style="font-size: 1.2em; font-weight: bold;">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Supprimer automatiquement après la durée spécifiée
  setTimeout(() => {
    notification.classList.add('hiding');
    setTimeout(() => notification.remove(), 300);
  }, duration);
  
  return notification;
}

/**
 * Applique une classe CSS à la sélection (Utilisée pour toutes les couleurs, y compris Blanc)
 */
function applyColorClassToSelection(className) {
    // Enlève toutes les classes de couleur existantes avant d'appliquer la nouvelle
    // Cela garantit que la couleur précédente est supprimée.
    document.execCommand('removeFormat', false, null);
    
    // Utilise execCommand('insertHTML') pour appliquer le span de couleur
    const selection = document.getSelection();
    if (selection && selection.toString().trim()) {
        document.execCommand('insertHTML', false, `<span class="${className}">${selection.toString()}</span>`);
        document.getElementById('updateBtn').click();
    }
}

/**
 * Fonction qui prépare le HTML pour le bandeau défilant
 */
function prepareScrollContent(htmlContent){ 
    // 1. Remplace les <br> par un espace pour le défilement
    let cleanContent = htmlContent.replace(/<br>/gi, ' ');

    // 2. Supprime les éléments de bloc (div/p) ajoutés par l'éditeur contenteditable
    cleanContent = cleanContent.replace(/<div>/gi, ' ').replace(/<\/div>/gi, '');
    cleanContent = cleanContent.replace(/<p>/gi, ' ').replace(/<\/p>/gi, '');
    
    // 3. Normalise les espaces multiples
    cleanContent = cleanContent.replace(/\s+/g, ' ');

    // 4. Utilise un séparateur visuel entre les messages
    const separator = '<span style="margin: 0 50px;">***</span>'; 
    return cleanContent.trim().replace(/\s\s+/g, separator); 
}

/**
 * Met à jour le contenu défilant depuis le HTML de l'éditeur
 */
function updateScrollFromHtml(htmlContent){ 
    let rawContent = prepareScrollContent(htmlContent);
    
    // Duplication du contenu (2 FOIS) pour un défilement continu
    let duplicatedContent = rawContent + rawContent;

    document.getElementById('scrollContent').innerHTML = duplicatedContent;
}

/**
 * Définit la durée de l'animation de défilement
 */
function setScrollDuration(seconds){ 
    document.getElementById('scroll').style.animationDuration = seconds + 's'; 
}

/**
 * Définit la couleur principale du texte défilant
 */
function setScrollColor(color){
    root.style.setProperty('--scroll-text-color', color);
}

/**
 * Vérifie si le panneau d'édition est visible
 */
function isPanelVisible(panel){
  return !panel.classList.contains('editor-hidden');
}

/**
 * Affiche/masque le panneau d'éditeur avec authentification
 */
async function toggleEditorPanel(){
  const panel = document.querySelector('.editor-panel');
  const btn = document.getElementById('togglePanel');
  const currentlyVisible = isPanelVisible(panel); 

  if (!currentlyVisible) {
    // Demander le code d'accès
    const userCode = prompt('Entrez le code pour accéder à l\'éditeur :');
    if (!userCode) {
      return;
    }
    
    // Stocker le code d'accès pour les sauvegardes
    currentAccessCode = userCode;
    
    panel.classList.remove('editor-hidden');
    btn.textContent = 'Cacher l\'éditeur';
  } else {
    panel.classList.add('editor-hidden');
    btn.textContent = 'Afficher l\'éditeur';
    // Optionnel : réinitialiser le code d'accès pour plus de sécurité
    // currentAccessCode = null;
  }
}

let isInPseudoFullscreen = false;

/**
 * Active le mode pseudo plein écran
 */
function enterPseudoFullscreen(){ 
    document.documentElement.classList.add('pseudo-fullscreen'); 
    isInPseudoFullscreen = true; 
    document.getElementById('fullscreenBtn').textContent = 'Quitter mode Bando'; 
}

/**
 * Désactive le mode pseudo plein écran
 */
function exitPseudoFullscreen(){ 
    document.documentElement.classList.remove('pseudo-fullscreen'); 
    isInPseudoFullscreen = false; 
    document.getElementById('fullscreenBtn').textContent = 'Mode Affichage Bando'; 
}

/**
 * Bascule le mode pseudo plein écran
 */
function toggleFullscreen(){ 
    if (isInPseudoFullscreen) {
        exitPseudoFullscreen();
    } else {
        enterPseudoFullscreen(); 
    }
}

// Initialisation de l'interface au chargement
document.querySelector('.editor-panel').classList.add('editor-hidden');
document.getElementById('togglePanel').textContent = 'Afficher l\'éditeur';

/**
 * Initialisation de l'application au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', async ()=>{
  const panel = document.querySelector('.editor-panel');
  const toggleBtn = document.getElementById('togglePanel');
  const editor = document.getElementById('editor');
  const colorInput = document.getElementById('color'); 
  const redBtn = document.getElementById('redBtn');
  const yellowBtn = document.getElementById('yellowBtn');
  const blueBtn = document.getElementById('blueBtn');
  const whiteBtn = document.getElementById('whiteBtn'); 

  // CHARGEMENT DES DONNÉES DEPUIS L'API
  let data;
  try {
    data = await loadBandeauData();
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    data = {
      html: defaultMessagesHTML,
      speed: 5,
      color: DEFAULT_COLOR
    };
  }

  let htmlToLoad = data.html || '';
  
  // Heuristique de migration pour les anciens formats (texte brut ou tags personnalisés)
  if (htmlToLoad && !htmlToLoad.includes('span')) {
      htmlToLoad = htmlToLoad.replace(/✅/g, CHECKMARK_BLUE_SVG_HTML).replace(/\n\n/g, '<br><br>');
      htmlToLoad = htmlToLoad.replace(/<c-red>(.*?)<\/c-red>/g, '<span class="status-red">$1</span>');
      htmlToLoad = htmlToLoad.replace(/<c-yellow>(.*?)<\/c-yellow>/g, '<span class="status-yellow">$1</span>');
      htmlToLoad = htmlToLoad.replace(/<c-blue>(.*?)<\/c-blue>/g, '<span class="status-blue">$1</span>');
  } else if (!htmlToLoad) {
      htmlToLoad = defaultMessagesHTML;
  }
  
  editor.innerHTML = htmlToLoad;
  updateScrollFromHtml(editor.innerHTML);

  // CHARGEMENT DE LA VITESSE
  const initialSpeed = data.speed || 5;
  document.getElementById('speed').value = initialSpeed;
  document.getElementById('speedValue').textContent = initialSpeed;
  setScrollDuration(initialSpeed);

  // CHARGEMENT DE LA COULEUR PRINCIPALE
  const initialColor = data.color || DEFAULT_COLOR;
  colorInput.value = initialColor;
  setScrollColor(initialColor);
  
  if (!isPanelVisible(panel)) {
    panel.classList.add('editor-hidden');
    toggleBtn.textContent = 'Afficher l\'éditeur';
  } else {
    toggleBtn.textContent = 'Cacher l\'éditeur';
  }

  // Bouton de mise à jour
  document.getElementById('updateBtn').addEventListener('click', async ()=>{ 
      const html = editor.innerHTML; 
      const speed = parseInt(document.getElementById('speed').value, 10);
      const color = colorInput.value; 
      
      updateScrollFromHtml(html); 
      setScrollColor(color); 
      
      // Afficher un message de chargement
      showNotification('Sauvegarde en cours...', 'info', 2000);
      
      // Sauvegarde via API avec le code d'accès
      const result = await saveBandeauData(html, speed, color, currentAccessCode);
      
      if (result.success) {
        showNotification(result.message, 'success', 5000);
      } else {
        if (result.localOnly) {
          showNotification(result.message, 'warning', 6000);
        } else {
          showNotification(result.message, 'error', 6000);
        }
      }
  });
  
  // Bouton de réinitialisation
  document.getElementById('resetBtn').addEventListener('click', async ()=>{ 
      const initialHtml = defaultMessagesHTML; 
      const initialSpeed = 5;
      const initialColor = DEFAULT_COLOR;

      editor.innerHTML = initialHtml; 
      document.getElementById('speed').value = initialSpeed; 
      document.getElementById('speedValue').textContent = initialSpeed; 
      colorInput.value = initialColor;

      updateScrollFromHtml(initialHtml); 
      setScrollDuration(initialSpeed); 
      setScrollColor(initialColor);
      
      // Afficher un message de chargement
      showNotification('Réinitialisation en cours...', 'info', 2000);
      
      // Sauvegarde via API avec le code d'accès
      const result = await saveBandeauData(initialHtml, initialSpeed, initialColor, currentAccessCode);
      
      if (result.success) {
        showNotification('Réinitialisation sauvegardée avec succès dans la base de données', 'success', 5000);
      } else {
        if (result.localOnly) {
          showNotification(result.message, 'warning', 6000);
        } else {
          showNotification(result.message, 'error', 6000);
        }
      }
  });

  document.getElementById('togglePanel').addEventListener('click', toggleEditorPanel);
  
  // Écouteurs pour les boutons de couleur (Mode Word)
  redBtn.addEventListener('click', (e) => { e.preventDefault(); applyColorClassToSelection('status-red'); });
  yellowBtn.addEventListener('click', (e) => { e.preventDefault(); applyColorClassToSelection('status-yellow'); });
  blueBtn.addEventListener('click', (e) => { e.preventDefault(); applyColorClassToSelection('status-blue'); });
  
  // Écouteur pour le bouton Blanc
  whiteBtn.addEventListener('click', (e) => { e.preventDefault(); applyColorClassToSelection('status-white'); }); 

  // GESTION DE LA VITESSE
  let speedSaveTimeout = null;
  document.getElementById('speed').addEventListener('input', async (e)=>{ 
      const val = parseInt(e.target.value, 10); 
      document.getElementById('speedValue').textContent = val; 
      setScrollDuration(val); 
      
      // Sauvegarde automatique de la vitesse (seulement si l'éditeur est ouvert)
      // Debounce pour éviter trop de requêtes
      if (currentAccessCode) {
        clearTimeout(speedSaveTimeout);
        speedSaveTimeout = setTimeout(async () => {
          const html = editor.innerHTML;
          const color = colorInput.value;
          const result = await saveBandeauData(html, val, color, currentAccessCode);
          if (result.success) {
            showNotification('Vitesse sauvegardée', 'success', 3000);
          } else if (!result.localOnly) {
            showNotification('Erreur lors de la sauvegarde de la vitesse', 'error', 4000);
          }
        }, 1000); // Attendre 1 seconde après le dernier changement
      }
  });

  // GESTION DE LA COULEUR PRINCIPALE
  let colorSaveTimeout = null;
  colorInput.addEventListener('input', async (e)=>{ 
      const val = e.target.value; 
      setScrollColor(val); 
      
      // Sauvegarde automatique de la couleur (seulement si l'éditeur est ouvert)
      // Debounce pour éviter trop de requêtes
      if (currentAccessCode) {
        clearTimeout(colorSaveTimeout);
        colorSaveTimeout = setTimeout(async () => {
          const html = editor.innerHTML;
          const speed = parseInt(document.getElementById('speed').value, 10);
          const result = await saveBandeauData(html, speed, val, currentAccessCode);
          if (result.success) {
            showNotification('Couleur sauvegardée', 'success', 3000);
          } else if (!result.localOnly) {
            showNotification('Erreur lors de la sauvegarde de la couleur', 'error', 4000);
          }
        }, 1000); // Attendre 1 seconde après le dernier changement
      }
  });

  // RACCOURCI CLAVIER
  document.addEventListener('keydown', async (e)=>{ 
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { 
          const html = editor.innerHTML; 
          const speed = parseInt(document.getElementById('speed').value, 10);
          const color = colorInput.value;
          
          updateScrollFromHtml(html); 
          setScrollColor(color);
          
          // Afficher un message de chargement
          showNotification('Sauvegarde en cours...', 'info', 2000);
          
          const result = await saveBandeauData(html, speed, color, currentAccessCode);
          
          if (result.success) {
            showNotification(result.message, 'success', 5000);
          } else {
            if (result.localOnly) {
              showNotification(result.message, 'warning', 6000);
            } else {
              showNotification(result.message, 'error', 6000);
            }
          }
          
          editor.blur(); 
      } 
  });

  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen); 

  // Écouteur pour la touche Échap
  document.addEventListener('keydown', (e)=>{ 
    if (e.key === 'Escape' && isInPseudoFullscreen) {
      exitPseudoFullscreen(); 
    }
  });
});

