# Bandeau Défilant - Pompiers d'Échirolles

Application web pour afficher un bandeau d'information défilant (5cm de hauteur) avec édition en ligne et stockage cloud via Vercel KV.

## 🚀 Fonctionnalités

- **Bandeau défilant** : Animation horizontale continue avec texte personnalisable
- **Édition en ligne** : Interface d'édition protégée par code d'accès
- **Coloration sélective** : Application de couleurs (Rouge, Jaune, Bleu, Blanc) sur des mots sélectionnés
- **Mode plein écran** : Affichage dédié pour diffusion sur écran
- **Stockage cloud** : Données synchronisées via Vercel KV Edge
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

3. **Configurer les variables d'environnement**

   Créez un fichier `.env.local` à la racine du projet :
   ```env
   ACCESS_CODE=CODE
   KV_REST_API_URL=https://your-kv-instance.upstash.io
   KV_REST_API_TOKEN=your_kv_token_here
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur `http://localhost:3000`

## 🌐 Déploiement sur Vercel

### 1. Créer un projet Vercel KV

1. Connectez-vous au [Dashboard Vercel](https://vercel.com/dashboard)
2. Allez dans **Storage** > **Create Database**
3. Sélectionnez **KV** (Redis)
4. Créez une nouvelle base de données KV
5. Notez les credentials générés :
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 2. Configurer les variables d'environnement

Dans le Dashboard Vercel :

1. Allez dans votre projet > **Settings** > **Environment Variables**
2. Ajoutez les variables suivantes :

   | Variable | Valeur | Description |
   |----------|--------|-------------|
   | `ACCESS_CODE` | `CODE` (ou votre code) | Code d'accès pour l'édition |
   | `KV_REST_API_URL` | URL de votre KV | URL de l'API Vercel KV |
   | `KV_REST_API_TOKEN` | Token généré | Token d'authentification KV |

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

### 4. Vérifier le déploiement

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

- Vérifiez que les variables d'environnement KV sont correctement configurées dans Vercel
- Vérifiez les logs dans Vercel Dashboard > Deployments > [votre déploiement] > Functions

### Erreur "Code d'accès incorrect"

- Vérifiez que la variable `ACCESS_CODE` est bien définie dans Vercel
- Assurez-vous d'utiliser le même code que celui configuré

### Le bandeau ne s'affiche pas

- Vérifiez la console du navigateur pour les erreurs JavaScript
- Assurez-vous que les fichiers CSS et JS sont bien chargés
- Vérifiez que l'API `/api/get-bandeau` répond correctement

## 📝 Notes techniques

- **Runtime** : Edge Functions (Vercel Edge Runtime)
- **Stockage** : Vercel KV (Redis compatible)
- **Fallback** : localStorage utilisé en cas d'échec de l'API
- **Migration automatique** : Les données localStorage sont migrées vers l'API au premier chargement

## 📄 Licence

Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
