# Bandeau Défilant - Pompiers d'Échirolles

Application web pour afficher un bandeau d'information défilant (5cm de hauteur) avec édition en ligne et stockage cloud via Edge Config.

## 🚀 Fonctionnalités

- **Bandeau défilant** : Animation horizontale continue avec texte personnalisable
- **Édition en ligne** : Interface d'édition protégée par code d'accès
- **Coloration sélective** : Application de couleurs (Rouge, Jaune, Bleu, Blanc) sur des mots sélectionnés
- **Mode plein écran** : Affichage dédié pour diffusion sur écran
- **Stockage cloud** : Données synchronisées via Edge Config (latence ultra-faible)
- **Sécurisé** : Authentification, validation et sanitization des données

## 📁 Structure du projet

```
Bandeau-PompierEchirolles/
├── public/
│   ├── index.html          # Page principale
│   ├── css/
│   │   └── styles.css      # Styles CSS
│   └── js/
│       ├── app.js          # Logique principale
│       └── api.js          # Communication API
├── api/
│   ├── get-bandeau.js      # GET - Récupère les données
│   └── update-bandeau.js   # POST - Met à jour les données
├── vercel.json             # Configuration Vercel
├── package.json            # Dépendances Node.js
└── README.md               # Documentation
```

## 🛠️ Installation et développement local

### Prérequis

- Node.js 18.x ou supérieur
- Compte Vercel
- Vercel CLI installé : `npm i -g vercel`

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone <repository-url>
   cd Bandeau-PompierEchirolles
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Installer Vercel CLI** (si ce n'est pas déjà fait)
   ```bash
   npm install -g vercel
   ```

4. **Se connecter à Vercel**
   ```bash
   vercel login
   ```

5. **Lier le projet à Vercel** (si pas déjà fait)
   ```bash
   vercel link
   ```

6. **Configurer les variables d'environnement locales**

   Créez un fichier `.env.local` à la racine du projet :
   ```env
   ACCESS_CODE=CODE
   EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx
   VERCEL_TOKEN=your_vercel_token_here
   ```
   
   **Variables d'environnement** :
   - `ACCESS_CODE` : Code d'accès pour modifier le bandeau
   - `EDGE_CONFIG` : Connection string Edge Config (format : `https://edge-config.vercel.com/ecfg_xxx` ou juste `ecfg_xxx`)
   - `VERCEL_TOKEN` : Token Vercel pour l'écriture (optionnel en production, Vercel l'injecte automatiquement)
   
   **Ou utilisez** `vercel env pull .env.local` pour récupérer automatiquement les variables depuis Vercel.

7. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   
   Ou directement :
   ```bash
   vercel dev
   ```

   L'application sera accessible sur `http://localhost:3000`

8. **Tester la connexion Edge Config en local**
   
   Ouvrez dans votre navigateur : `http://localhost:3000/api/health-edge-config`
   
   Vous devriez voir un JSON avec le statut de la connexion. Si `edge_config_connected: false`, vérifiez vos variables d'environnement dans `.env.local`.

## 🌐 Déploiement sur Vercel

### 1. Créer un Edge Config Store

**✅ Créez un Edge Config Store**

1. Connectez-vous au [Dashboard Vercel](https://vercel.com/dashboard)
2. Allez dans **Storage** > **Create Database**
3. **Sélectionnez "Edge Config"** (avec l'icône violette `{}`)
4. Créez un nouveau Edge Config Store avec un nom (ex: "bandeau-config")
5. **Important** : Une fois créé, allez dans les **Settings** de l'Edge Config Store
6. **Liez le store au projet** : Dans l'onglet "Linked Projects", ajoutez votre projet
7. **Récupérez la connection string** : Dans l'onglet "Settings", vous verrez :
   - **Connection String** → C'est votre `EDGE_CONFIG` (format : `https://edge-config.vercel.com/ecfg_xxx` ou juste `ecfg_xxx`)
   
   **Note** : Edge Config est parfait pour ce cas d'usage car il offre une latence ultra-faible et une configuration simple (une seule variable d'environnement).

### 2. Configurer les variables d'environnement

Dans le Dashboard Vercel :

1. Allez dans votre projet > **Settings** > **Environment Variables**
2. Ajoutez les variables suivantes :

   | Variable | Valeur | Description |
   |----------|--------|-------------|
   | `ACCESS_CODE` | `CODE` (ou votre code) | Code d'accès pour l'édition |
   | `EDGE_CONFIG` | Connection string | Connection string Edge Config (ex: `https://edge-config.vercel.com/ecfg_xxx`) |
   | `VERCEL_TOKEN` | Token Vercel | Token Vercel pour l'écriture (optionnel en production) |
   
   **Note** : En production sur Vercel, `VERCEL_TOKEN` est automatiquement injecté. Vous pouvez l'omettre ou le laisser vide.

3. Appliquez ces variables à tous les environnements (Production, Preview, Development)

### 3. Déployer le projet

**Option A : Via Vercel CLI**
```bash
vercel
```

**Option B : Via GitHub (recommandé)**
1. Poussez votre code sur GitHub
2. Dans Vercel Dashboard, cliquez sur **Add New Project**
3. Importez votre dépôt GitHub
4. Vercel détectera automatiquement la configuration et déploiera

### 4. Vérifier la connexion Edge Config

Après avoir configuré les variables d'environnement, testez la connexion à Edge Config :

1. Accédez à : `https://votre-projet.vercel.app/api/health-edge-config`
2. Vous devriez voir un JSON avec le statut de la connexion :
   ```json
   {
     "timestamp": "2024-01-01T00:00:00.000Z",
     "edge_config_configured": true,
     "edge_config_connected": true,
     "env_vars": {
       "EDGE_CONFIG": "https://edge-config.vercel.com/ecfg_xxx...",
       "EDGE_CONFIG_ID": "ecfg_xxx",
       "has_edge_config": true,
       "has_id": true
     },
     "test_result": {
       "read": "OK",
       "main_key_exists": false
     }
   }
   ```

**Si vous voyez `edge_config_configured: false` ou `edge_config_connected: false`** :
- Vérifiez que la variable `EDGE_CONFIG` est bien configurée dans Vercel Dashboard
- Assurez-vous que l'Edge Config Store est bien créé et lié au projet
- Redéployez l'application après avoir ajouté les variables

### 5. Vérifier le déploiement

Une fois déployé, votre application sera accessible à l'URL fournie par Vercel (ex: `https://votre-projet.vercel.app`)

## 🔐 Sécurité

### Authentification

- Le code d'accès est stocké dans les variables d'environnement Vercel
- La validation se fait côté serveur dans `api/update-bandeau.js`
- Ne jamais commiter le code d'accès dans le dépôt Git

### Protection XSS

- Sanitization HTML automatique des données entrantes
- Validation stricte des formats (couleur hex, vitesse, etc.)
- Headers de sécurité HTTP configurés

### Headers de sécurité

Les headers suivants sont configurés automatiquement :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📖 Utilisation

### Modifier le bandeau

1. Cliquez sur le bouton **"Afficher l'éditeur"** (en haut à droite)
2. Entrez le code d'accès
3. Modifiez le texte dans la zone d'édition
4. Utilisez les boutons de couleur pour colorer des mots sélectionnés
5. Ajustez la vitesse de défilement avec le slider
6. Cliquez sur **"Mettre à jour"** ou utilisez `Ctrl/Cmd + Enter`

### Mode plein écran

1. Cliquez sur **"Mode Affichage Bando"**
2. Le bandeau passe en haut de l'écran
3. Tout le reste est masqué
4. Appuyez sur `Échap` ou recliquez sur le bouton pour quitter

## 🔧 Configuration

### Modifier le code d'accès

1. Allez dans Vercel Dashboard > Settings > Environment Variables
2. Modifiez la variable `ACCESS_CODE`
3. Redéployez l'application

### Personnaliser les couleurs

Les couleurs sont définies dans `public/css/styles.css` via les variables CSS :
- `--status-red` : Rouge pour les alertes
- `--status-yellow` : Jaune pour les avertissements
- `--status-blue` : Bleu pour les informations
- `--accent` : Couleur principale de l'interface

## 🐛 Dépannage

### Les données ne se sauvegardent pas

1. **Testez la connexion Edge Config** : Accédez à `/api/health-edge-config` pour voir l'état de la connexion
2. **Vérifiez les variables d'environnement** :
   - Allez dans Vercel Dashboard > Settings > Environment Variables
   - Assurez-vous que `EDGE_CONFIG` est présente
   - Vérifiez qu'elle est appliquée à tous les environnements (Production, Preview, Development)
3. **Vérifiez que l'Edge Config Store est lié au projet** :
   - Vercel Dashboard > Storage > [votre Edge Config Store] > Settings
   - Vérifiez que le projet est bien lié dans l'onglet "Linked Projects"
4. **Vérifiez les logs** : Vercel Dashboard > Deployments > [votre déploiement] > Functions > Logs
5. **Pour l'écriture** : Assurez-vous que `VERCEL_TOKEN` est configuré (ou laissez Vercel l'injecter automatiquement en production)
6. **Redéployez** après avoir modifié les variables d'environnement

### Erreur "Code d'accès incorrect"

- Vérifiez que la variable `ACCESS_CODE` est bien définie dans Vercel
- Assurez-vous d'utiliser le même code que celui configuré

### Le bandeau ne s'affiche pas

- Vérifiez la console du navigateur pour les erreurs JavaScript
- Assurez-vous que les fichiers CSS et JS sont bien chargés
- Vérifiez que l'API `/api/get-bandeau` répond correctement
- Testez la connexion Edge Config avec `/api/health-edge-config`

### Erreur "Edge Config non configuré"

- Vérifiez que la variable `EDGE_CONFIG` est bien définie dans Vercel
- Le format doit être : `https://edge-config.vercel.com/ecfg_xxx` ou juste `ecfg_xxx`
- Assurez-vous que l'Edge Config Store est bien créé et lié au projet

## 📝 Notes techniques

- **Runtime** : Edge Functions (Vercel Edge Runtime)
- **Stockage** : Edge Config (latence ultra-faible, parfait pour la configuration)
- **Écriture** : Via API REST Vercel (nécessite VERCEL_TOKEN)
- **Fallback** : localStorage utilisé en cas d'échec de l'API
- **Migration automatique** : Les données localStorage sont migrées vers Edge Config au premier chargement
- **Limite Edge Config** : 8 KB par store (largement suffisant pour le bandeau)

## 📄 Licence

Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

