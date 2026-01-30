# Test Blob Storage

## Configuration actuelle

Votre fichier `.env.local` contient déjà le token Blob Storage :
```
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_5YELoMIemkg16qxy_6qJ9vm1JjmXmU97eNh4ReNQu5BWuJp"
```

## Test en local

### 1. Vérifier que le serveur charge bien les variables d'environnement

Redémarrez le serveur de développement :
```bash
npm run dev
```

### 2. Tester l'upload d'image

1. Ouvrez http://localhost:3000
2. Cliquez sur "Afficher l'éditeur"
3. Entrez le code d'accès : `7702`
4. Cliquez sur "📷 Insérer une image"
5. Sélectionnez une image (max 2MB, formats: JPG, PNG, GIF, WEBP)

### 3. Erreurs possibles et solutions

#### Erreur : "VERCEL_TOKEN ou VERCEL_API_TOKEN requis pour l'écriture"

**Solution** : Le code d'écriture dans `api/upload-image.js` utilise `@vercel/blob` qui nécessite le token. En développement local, ajoutez dans `.env.local` :

```bash
VERCEL_API_TOKEN="votre_token_ici"
```

Pour obtenir le token :
1. Allez sur https://vercel.com/account/tokens
2. Créez un nouveau token
3. Copiez-le dans `.env.local`

**OU** utilisez la configuration actuelle qui devrait fonctionner car `VERCEL_TOKEN` est déjà défini dans `.env.local`.

#### Erreur : "Blob Store non configuré"

**Solution** : Vérifiez que le Blob Store existe sur Vercel :
1. Allez sur https://vercel.com/votre-team/votre-projet
2. Onglet "Storage"
3. Vérifiez qu'un Blob Store existe
4. Si non, créez-en un (voir instructions dans la conversation précédente)

#### Erreur : "Failed to fetch" ou problème de connexion

**Vérification** : Ouvrez la console du navigateur (F12) et regardez l'erreur exacte dans l'onglet "Console" et "Network".

## Test de l'API directement

Pour tester si l'API fonctionne, créez un fichier de test :

```bash
curl -X POST http://localhost:3000/api/upload-image \
  -H "Content-Type: multipart/form-data" \
  -F "accessCode=7702" \
  -F "file=@/chemin/vers/votre/image.jpg"
```

## Vérification du token

Pour vérifier que le token Blob Storage est valide, vous pouvez tester avec ce script Node.js :

```javascript
// test-blob.js
import { put } from '@vercel/blob';

const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

try {
  const result = await put('test-' + Date.now() + '.txt', testFile, {
    access: 'public',
  });
  console.log('✅ Blob Storage fonctionne !');
  console.log('URL:', result.url);
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
```

Exécutez-le avec :
```bash
node test-blob.js
```
