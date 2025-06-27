# 🚀 Configuration Variables d'Environnement Railway

## 🔧 Variables Requises pour l'Authentification

### Dans le Dashboard Railway (Settings > Environment)

```bash
# ✅ Supabase Configuration (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://sgombrccebqutpompbjj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4Mzk5NTUsImV4cCI6MjA2NjQxNTk1NX0.jsOfUsgNVWiRIdm8GJGoGAPYzZNRne3LladfTvdQnkA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgzOTk1NSwiZXhwIjoyMDY2NDE1OTU1fQ.C96QktQzrTbZ4lm1gQPT6sJ9doSaIpXrHakxiyw2MXU

# ✅ Application Configuration
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://nutricoach-production.up.railway.app

# ✅ Security (générer de nouvelles clés)
NEXTAUTH_SECRET=votre_secret_nextauth_32_chars_minimum
ENCRYPTION_KEY=votre_cle_chiffrement_32_chars
JWT_SECRET=votre_jwt_secret_securise
```

## 📋 Étapes de Configuration

### 1. Accéder au Dashboard Railway
1. Aller sur [railway.app](https://railway.app)
2. Ouvrir le projet `nutricoach`
3. Aller dans **Settings** > **Environment**

### 2. Ajouter les Variables
Pour chaque variable, cliquer **"+ New Variable"** et entrer :
- **Name** : Nom de la variable (ex: `NEXT_PUBLIC_SUPABASE_URL`)
- **Value** : Valeur correspondante

### 3. Redéploiement Automatique
- Railway redéploiera automatiquement après ajout des variables
- Attendre 2-3 minutes pour le déploiement

## 🔍 Vérification de la Configuration

### Test de Santé API
```bash
curl https://nutricoach-production.up.railway.app/api/health
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "environment": {
    "supabase_url": true,
    "supabase_anon_key": true,
    "supabase_service_key": true
  },
  "supabase": {
    "status": "connected"
  }
}
```

### Test Signup
1. Aller sur https://nutricoach-production.up.railway.app/signup
2. Créer un compte test
3. Vérifier l'absence d'erreur "Failed to fetch"

## 🚨 Troubleshooting

### Erreur "Failed to fetch"
**Cause :** Variables d'environnement manquantes
**Solution :** Vérifier que toutes les variables Supabase sont configurées

### Erreur "Invalid JWT"
**Cause :** Clé Supabase incorrecte
**Solution :** Vérifier les clés dans le dashboard Supabase

### Erreur de Redirection Auth
**Cause :** URL de base incorrecte
**Solution :** Vérifier `NEXT_PUBLIC_BASE_URL`

## ✅ Checklist Déploiement

- [ ] Variables Supabase configurées
- [ ] Variables sécurité générées 
- [ ] URL de base correcte
- [ ] API Health répond correctement
- [ ] Signup fonctionne sans erreur
- [ ] Login fonctionne
- [ ] Dashboard accessible après auth

## 🔗 URLs Importantes

- **Site :** https://nutricoach-production.up.railway.app
- **Health Check :** https://nutricoach-production.up.railway.app/api/health
- **Supabase Dashboard :** https://supabase.com/dashboard/project/sgombrccebqutpompbjj
- **Railway Dashboard :** https://railway.app/dashboard

---

**Une fois les variables configurées, l'authentification devrait fonctionner parfaitement !** 🎉