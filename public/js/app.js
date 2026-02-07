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

// Variable globale pour stocker le timestamp de dernière modification
let lastKnownModified = null;

// Variable pour stocker l'intervalle de polling
let pollingInterval = null;

// Variable globale pour stocker la direction actuelle
let currentDirection = 'horizontal';

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
    // En mode vertical, on garde les <br> pour les sauts de ligne
    if (currentDirection === 'vertical') {
        // Pour le mode vertical, formater le contenu en divs séparés
        let cleanContent = htmlContent;
        cleanContent = cleanContent.replace(/<div>/gi, '').replace(/<\/div>/gi, '');
        cleanContent = cleanContent.replace(/<p>/gi, '').replace(/<\/p>/gi, '');
        // Remplacer les <br> par des divs pour meilleur défilement vertical
        cleanContent = cleanContent.replace(/<br\s*\/?>/gi, '</div><div style="padding: 25px 15px; text-align: center; white-space: normal; word-wrap: break-word; line-height: 1.4;">');
        return '<div style="padding: 25px 15px; text-align: center; white-space: normal; word-wrap: break-word; line-height: 1.4;">' + cleanContent.trim() + '</div>';
    }
    
    // Mode horizontal (par défaut)
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
    
    // Duplication du contenu (2 FOIS) pour un défilement continu en boucle
    // Important : la duplication doit être faite de manière à créer une boucle infinie
    let duplicatedContent = rawContent + rawContent;

    const scrollContent = document.getElementById('scrollContent');
    if (scrollContent) {
        scrollContent.innerHTML = duplicatedContent;
        
        // En mode vertical, s'assurer que le contenu est bien structuré pour la boucle
        if (currentDirection === 'vertical') {
            scrollContent.style.display = 'flex';
            scrollContent.style.flexDirection = 'column';
            scrollContent.style.height = 'max-content';
        } else {
            scrollContent.style.display = 'flex';
            scrollContent.style.flexDirection = 'row';
            scrollContent.style.width = 'max-content';
        }
    }
}


/**
 * Définit la durée de l'animation de défilement
 */
function setScrollDuration(seconds){ 
    const scroll = document.getElementById('scroll');
    if (scroll) {
        scroll.style.animationDuration = seconds + 's';
    }
}

/**
 * Définit la couleur principale du texte défilant
 */
function setScrollColor(color){
    root.style.setProperty('--scroll-text-color', color);
}

/**
 * Définit la direction du défilement (horizontal ou vertical)
 */
function setScrollDirection(direction) {
    const container = document.querySelector('.container');
    const scroll = document.getElementById('scroll');
    const directionBtn = document.getElementById('directionBtn');
    const gyrophareWrapper = document.querySelector('.gyrophare-wrapper');
    
    if (!container || !scroll || !directionBtn) return;
    
    // IMPORTANT : Mettre à jour currentDirection AVANT tout le reste
    currentDirection = direction;
    
    // Retirer toutes les classes de direction
    container.classList.remove('container-horizontal', 'container-vertical');
    scroll.classList.remove('scroll-horizontal', 'scroll-vertical');
    
    if (direction === 'vertical') {
        container.classList.add('container-vertical');
        scroll.classList.add('scroll-vertical');
        directionBtn.textContent = '↕ Vertical';
        directionBtn.title = 'Changer en mode horizontal';
        
        // Adapter les gyrophares pour le mode vertical (haut et bas)
        if (gyrophareWrapper) {
            gyrophareWrapper.style.flexDirection = 'column';
            gyrophareWrapper.style.justifyContent = 'space-between';
            gyrophareWrapper.style.alignItems = 'center';
            gyrophareWrapper.style.padding = '20px 0';
        }
    } else {
        container.classList.add('container-horizontal');
        scroll.classList.add('scroll-horizontal');
        directionBtn.textContent = '↔ Horizontal';
        directionBtn.title = 'Changer en mode vertical';
        
        // Remettre les gyrophares en mode horizontal (gauche et droite)
        if (gyrophareWrapper) {
            gyrophareWrapper.style.flexDirection = 'row';
            gyrophareWrapper.style.justifyContent = 'space-between';
            gyrophareWrapper.style.alignItems = 'center';
            gyrophareWrapper.style.padding = '0 20px';
        }
    }
    
    // Recharger et REFORMATER le contenu avec la nouvelle direction
    // prepareScrollContent() va utiliser currentDirection pour formater correctement
    const editor = document.getElementById('editor');
    if (editor) {
        updateScrollFromHtml(editor.innerHTML);
    }
    
    // Réappliquer la vitesse actuelle pour s'assurer qu'elle fonctionne avec la nouvelle direction
    const speedInput = document.getElementById('speed');
    if (speedInput) {
        const currentSpeed = parseInt(speedInput.value, 10) || 5;
        setScrollDuration(currentSpeed);
    }
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
    
    // Passer en mode édition (sortir du mode bando)
    exitPseudoFullscreen();
    panel.classList.remove('editor-hidden');
    btn.textContent = 'Cacher l\'éditeur';
  } else {
    // Retourner en mode bando - recharger la page pour garantir l'affichage correct
    // Cela permet de recharger le contenu avec le bon formatage selon la direction
    location.reload();
  }
}

let isInPseudoFullscreen = false;

/**
 * Active le mode pseudo plein écran (mode bando)
 */
function enterPseudoFullscreen(){ 
    document.documentElement.classList.add('pseudo-fullscreen'); 
    isInPseudoFullscreen = true; 
}

/**
 * Désactive le mode pseudo plein écran (mode édition)
 */
function exitPseudoFullscreen(){ 
    document.documentElement.classList.remove('pseudo-fullscreen'); 
    isInPseudoFullscreen = false; 
}

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
    // Stocker le timestamp de dernière modification
    lastKnownModified = data.lastModified || new Date().toISOString();
    localStorage.setItem('bandeau_last_modified', lastKnownModified);
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    data = {
      html: defaultMessagesHTML,
      speed: 5,
      color: DEFAULT_COLOR,
      lastModified: new Date().toISOString()
    };
    lastKnownModified = data.lastModified;
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
  
  // CHARGEMENT DE LA DIRECTION (avant le HTML pour que prepareScrollContent utilise la bonne direction)
  const initialDirection = data.direction || 'horizontal';
  currentDirection = initialDirection;
  setScrollDirection(initialDirection);

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
  
  // Initialiser l'interface en mode bando (éditeur caché par défaut)
  panel.classList.add('editor-hidden');
  toggleBtn.textContent = 'Afficher l\'éditeur';
  
  // Activer le mode bando par défaut APRÈS avoir configuré la direction et le contenu
  enterPseudoFullscreen();

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
      const result = await saveBandeauData(html, speed, color, currentDirection, currentAccessCode);
      
      if (result.success) {
        showNotification(result.message, 'success', 5000);
        // Mettre à jour le timestamp local après sauvegarde réussie
        // Le polling détectera la mise à jour sur les autres navigateurs
        setTimeout(async () => {
          const updateCheck = await checkForUpdates();
          if (updateCheck.lastModified) {
            lastKnownModified = updateCheck.lastModified;
            localStorage.setItem('bandeau_last_modified', lastKnownModified);
            console.log('💾 [SAVE] Timestamp mis à jour:', lastKnownModified);
          }
        }, 500);
        // Burst de vérifications pour synchronisation rapide des autres appareils
        console.log('⚡ [BURST] Programmation de 2 checks rapides (10s et 20s)');
        setTimeout(() => {
          console.log('⚡ [BURST] Check rapide #1 (10s après sauvegarde)');
          checkAndApplyUpdates();
        }, 10000);
        setTimeout(() => {
          console.log('⚡ [BURST] Check rapide #2 (20s après sauvegarde)');
          checkAndApplyUpdates();
        }, 20000);
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
      const result = await saveBandeauData(initialHtml, initialSpeed, initialColor, currentDirection, currentAccessCode);
      
      if (result.success) {
        showNotification('Réinitialisation sauvegardée avec succès dans la base de données', 'success', 5000);
        // Mettre à jour le timestamp local après sauvegarde réussie
        setTimeout(async () => {
          const updateCheck = await checkForUpdates();
          if (updateCheck.lastModified) {
            lastKnownModified = updateCheck.lastModified;
            localStorage.setItem('bandeau_last_modified', lastKnownModified);
          }
        }, 500);
        // Burst de vérifications pour synchronisation rapide des autres appareils
        setTimeout(checkAndApplyUpdates, 10000);  // Check à 10s
        setTimeout(checkAndApplyUpdates, 20000);  // Check à 20s
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

  // GESTION DE LA DIRECTION
  const directionBtn = document.getElementById('directionBtn');
  let directionSaveTimeout = null;
  
  directionBtn.addEventListener('click', async () => {
    if (!currentAccessCode) {
      showNotification('Veuillez d\'abord ouvrir l\'éditeur avec le code d\'accès', 'warning', 4000);
      return;
    }
    
    // Basculer la direction
    const newDirection = currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
    setScrollDirection(newDirection);
    
    // Sauvegarder automatiquement avec debounce
    clearTimeout(directionSaveTimeout);
    directionSaveTimeout = setTimeout(async () => {
      const html = editor.innerHTML;
      const speed = parseInt(document.getElementById('speed').value, 10);
      const color = colorInput.value;
      
      const result = await saveBandeauData(html, speed, color, newDirection, currentAccessCode);
      if (result.success) {
        showNotification('Direction sauvegardée', 'success', 3000);
        // Mettre à jour le timestamp local
        setTimeout(async () => {
          const updateCheck = await checkForUpdates();
          if (updateCheck.lastModified) {
            lastKnownModified = updateCheck.lastModified;
            localStorage.setItem('bandeau_last_modified', lastKnownModified);
          }
        }, 500);
        // Burst de vérifications pour synchronisation rapide des autres appareils
        setTimeout(checkAndApplyUpdates, 10000);  // Check à 10s
        setTimeout(checkAndApplyUpdates, 20000);  // Check à 20s
      } else if (!result.localOnly) {
        showNotification('Erreur lors de la sauvegarde de la direction', 'error', 4000);
      }
    }, 500);
  });

  // GESTION DE L'INSERTION D'IMAGES
  const insertImageBtn = document.getElementById('insertImageBtn');
  const imageInput = document.getElementById('imageInput');

  insertImageBtn.addEventListener('click', () => {
    if (!currentAccessCode) {
      showNotification('Veuillez d\'abord ouvrir l\'éditeur avec le code d\'accès', 'warning', 4000);
      return;
    }
    imageInput.click();
  });

  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Afficher un message de chargement
    showNotification('Upload de l\'image en cours...', 'info', 5000);

    // Uploader l'image
    const result = await uploadImage(file, currentAccessCode);

    if (result.success && result.url) {
      // Insérer l'image dans l'éditeur
      const img = document.createElement('img');
      img.src = result.url;
      img.alt = file.name;

      // Insérer à la position du curseur ou à la fin
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
      } else {
        editor.appendChild(img);
      }

      // Ajouter un espace après l'image
      const space = document.createTextNode(' ');
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.setStartAfter(img);
        range.insertNode(space);
      } else {
        editor.appendChild(space);
      }

      showNotification('Image insérée avec succès', 'success', 3000);
      
      // Sauvegarder automatiquement après insertion
      const html = editor.innerHTML;
      const speed = parseInt(document.getElementById('speed').value, 10);
      const color = colorInput.value;
      
      updateScrollFromHtml(html);
      
      const saveResult = await saveBandeauData(html, speed, color, currentDirection, currentAccessCode);
      if (saveResult.success) {
        showNotification('Image sauvegardée', 'success', 2000);
        // Mettre à jour le timestamp local
        setTimeout(async () => {
          const updateCheck = await checkForUpdates();
          if (updateCheck.lastModified) {
            lastKnownModified = updateCheck.lastModified;
            localStorage.setItem('bandeau_last_modified', lastKnownModified);
          }
        }, 500);
        // Burst de vérifications pour synchronisation rapide des autres appareils
        setTimeout(checkAndApplyUpdates, 10000);  // Check à 10s
        setTimeout(checkAndApplyUpdates, 20000);  // Check à 20s
      }
    } else {
      showNotification(result.error || 'Erreur lors de l\'upload de l\'image', 'error', 5000);
    }

    // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
    imageInput.value = '';
  }); 

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
          const result = await saveBandeauData(html, val, color, currentDirection, currentAccessCode);
          if (result.success) {
            showNotification('Vitesse sauvegardée', 'success', 3000);
            // Mettre à jour le timestamp local
            setTimeout(async () => {
              const updateCheck = await checkForUpdates();
              if (updateCheck.lastModified) {
                lastKnownModified = updateCheck.lastModified;
                localStorage.setItem('bandeau_last_modified', lastKnownModified);
              }
            }, 500);
            // Burst de vérifications pour synchronisation rapide des autres appareils
            setTimeout(checkAndApplyUpdates, 10000);  // Check à 10s
            setTimeout(checkAndApplyUpdates, 20000);  // Check à 20s
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
          const result = await saveBandeauData(html, speed, val, currentDirection, currentAccessCode);
          if (result.success) {
            showNotification('Couleur sauvegardée', 'success', 3000);
            // Mettre à jour le timestamp local
            setTimeout(async () => {
              const updateCheck = await checkForUpdates();
              if (updateCheck.lastModified) {
                lastKnownModified = updateCheck.lastModified;
                localStorage.setItem('bandeau_last_modified', lastKnownModified);
              }
            }, 500);
            // Burst de vérifications pour synchronisation rapide des autres appareils
            setTimeout(checkAndApplyUpdates, 10000);  // Check à 10s
            setTimeout(checkAndApplyUpdates, 20000);  // Check à 20s
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
          
          const result = await saveBandeauData(html, speed, color, currentDirection, currentAccessCode);
          
          if (result.success) {
            showNotification(result.message, 'success', 5000);
            // Mettre à jour le timestamp local
            setTimeout(async () => {
              const updateCheck = await checkForUpdates();
              if (updateCheck.lastModified) {
                lastKnownModified = updateCheck.lastModified;
                localStorage.setItem('bandeau_last_modified', lastKnownModified);
              }
            }, 500);
            // Burst de vérifications pour synchronisation rapide des autres appareils
            setTimeout(checkAndApplyUpdates, 10000);  // Check à 10s
            setTimeout(checkAndApplyUpdates, 20000);  // Check à 20s
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

  // Écouteur pour la touche Échap : fermer l'éditeur et retourner en mode bando
  document.addEventListener('keydown', (e)=>{ 
    if (e.key === 'Escape' && isPanelVisible(panel)) {
      // Recharger la page pour garantir l'affichage correct en mode bando
      location.reload();
    }
  });

  // Fonction pour mettre à jour l'indicateur de synchronisation
  function updateSyncIndicator(state) {
    const indicator = document.getElementById('syncIndicator');
    if (!indicator) return;
    
    indicator.classList.remove('syncing', 'error');
    
    switch(state) {
      case 'syncing':
        indicator.classList.add('syncing');
        indicator.title = 'Vérification des mises à jour...';
        break;
      case 'error':
        indicator.classList.add('error');
        indicator.title = 'Erreur de synchronisation';
        break;
      case 'synced':
      default:
        indicator.title = 'Synchronisé';
        break;
    }
  }

  // Fonction pour appliquer les données chargées au bandeau
  async function applyBandeauData(data) {
    if (!data) return;
    
    const editor = document.getElementById('editor');
    const colorInput = document.getElementById('color');
    
    // Mettre à jour le HTML
    if (data.html !== undefined) {
      let htmlToLoad = data.html || '';
      
      // Heuristique de migration pour les anciens formats
      if (htmlToLoad && !htmlToLoad.includes('span')) {
        htmlToLoad = htmlToLoad.replace(/✅/g, CHECKMARK_BLUE_SVG_HTML).replace(/\n\n/g, '<br><br>');
        htmlToLoad = htmlToLoad.replace(/<c-red>(.*?)<\/c-red>/g, '<span class="status-red">$1</span>');
        htmlToLoad = htmlToLoad.replace(/<c-yellow>(.*?)<\/c-yellow>/g, '<span class="status-yellow">$1</span>');
        htmlToLoad = htmlToLoad.replace(/<c-blue>(.*?)<\/c-blue>/g, '<span class="status-blue">$1</span>');
      } else if (!htmlToLoad) {
        htmlToLoad = defaultMessagesHTML;
      }
      
      editor.innerHTML = htmlToLoad;
      updateScrollFromHtml(htmlToLoad);
    }
    
    // Mettre à jour la vitesse
    if (data.speed !== undefined) {
      const speed = data.speed || 5;
      document.getElementById('speed').value = speed;
      document.getElementById('speedValue').textContent = speed;
      setScrollDuration(speed);
    }
    
    // Mettre à jour la couleur
    if (data.color !== undefined) {
      const color = data.color || DEFAULT_COLOR;
      colorInput.value = color;
      setScrollColor(color);
    }
    
    // Mettre à jour la direction
    if (data.direction !== undefined) {
      const direction = data.direction || 'horizontal';
      currentDirection = direction;
      setScrollDirection(direction);
    }
    
    // Mettre à jour le timestamp
    if (data.lastModified) {
      lastKnownModified = data.lastModified;
      localStorage.setItem('bandeau_last_modified', lastKnownModified);
    }
  }

  // Fonction pour vérifier et appliquer les mises à jour
  async function checkAndApplyUpdates() {
    console.log('🔄 [SYNC] Vérification des mises à jour...', new Date().toLocaleTimeString());
    updateSyncIndicator('syncing');
    
    try {
      const updateCheck = await checkForUpdates();
      console.log('📡 [SYNC] Réponse API:', updateCheck);
      
      if (updateCheck.error) {
        console.warn('⚠️ [SYNC] Erreur API:', updateCheck.error);
        updateSyncIndicator('error');
        return;
      }
      
      // Comparer les timestamps
      console.log('🕐 [SYNC] Comparaison timestamps:', {
        distant: updateCheck.lastModified,
        local: lastKnownModified,
        different: updateCheck.lastModified !== lastKnownModified
      });
      
      if (updateCheck.lastModified && updateCheck.lastModified !== lastKnownModified) {
        console.log('✅ [SYNC] Mise à jour détectée ! Rechargement des données...');
        // Il y a une mise à jour, charger les données complètes
        const freshData = await loadBandeauData();
        await applyBandeauData(freshData);
        console.log('🎉 [SYNC] Données mises à jour avec succès !');
        updateSyncIndicator('synced');
      } else {
        console.log('✓ [SYNC] Aucune mise à jour nécessaire');
        updateSyncIndicator('synced');
      }
    } catch (error) {
      console.error('❌ [SYNC] Erreur lors de la vérification des mises à jour:', error);
      updateSyncIndicator('error');
    }
  }

  // Démarrer le polling toutes les 120 secondes (2 minutes)
  console.log('🚀 [INIT] Démarrage du polling automatique (intervalle: 120s)');
  pollingInterval = setInterval(checkAndApplyUpdates, 120000);
  
  // Vérifier immédiatement au chargement (après un court délai pour éviter les conflits)
  console.log('⏱️ [INIT] Première vérification programmée dans 2 secondes...');
  setTimeout(checkAndApplyUpdates, 2000);
});

