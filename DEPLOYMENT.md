# 🚀 Guide de Déploiement Production - NutriCoach

## ✅ Validation Build Terminée

Le build a été validé avec succès. L'application est prête pour le déploiement production.

## 📋 Étapes de Déploiement Vercel

### 1. Connexion à Vercel
```bash
# Se connecter à Vercel CLI
vercel login

# Sélectionner "Continue with GitHub" ou votre méthode préférée
```

### 2. Configuration des Variables d'Environnement

Avant le déploiement, configurez ces variables dans le dashboard Vercel :

#### Variables Supabase (OBLIGATOIRES)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Variables Stripe (OBLIGATOIRES)
```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour tests)
STRIPE_PUBLISHABLE_KEY=pk_live_... (ou pk_test_... pour tests)
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Variables de Sécurité (OBLIGATOIRES)
```
NEXTAUTH_SECRET=générer_avec_openssl_rand_base64_32
ENCRYPTION_KEY=clé_32_bytes_pour_chiffrement_données_santé
```

#### Variables d'Application
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://nutricoach.vercel.app
```

### 3. Déploiement Initial
```bash
# Dans le dossier du projet
cd /Users/manu/Documents/DEV/nutricoach

# Déploiement Vercel
vercel

# Suivre les invites :
# - Set up and deploy? [Y/n] Y
# - Which scope? Select your account
# - Link to existing project? [y/N] N
# - Project name? nutricoach (ou nom désiré)
# - In which directory? ./ (current directory)
```

### 4. Configuration du Domaine (Optionnel)
```bash
# Ajouter un domaine personnalisé
vercel domains add nutricoach.app

# Configurer le domaine dans le dashboard Vercel
```

### 5. Configuration SSL/HTTPS
✅ **Automatique** - Vercel configure automatiquement SSL pour tous les domaines

## 🔐 Sécurité de Déploiement

### Variables Sensibles
- ✅ Toutes les clés sont dans les variables d'environnement Vercel
- ✅ Aucune clé hardcodée dans le code
- ✅ Séparation environnements dev/prod

### Headers de Sécurité
```javascript
// Configurés dans next.config.js et vercel.json :
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Strict-Transport-Security: max-age=31536000
```

## ⚡ Optimisations Production

### Build Configuration
- ✅ Standalone output pour réduction taille
- ✅ Images optimisées avec Sharp
- ✅ Source maps désactivées pour sécurité
- ✅ Webpack optimisé pour production

### Performance
- ✅ Région déploiement : Frankfurt (fra1) pour l'Europe
- ✅ Timeouts API configurés
- ✅ Cache headers pour routes publiques

## 🚨 Points de Vigilance

### 1. Webhook Stripe
Après déploiement, configurez l'endpoint webhook Stripe :
```
URL: https://your-domain.vercel.app/api/stripe/webhook
Events: checkout.session.completed, customer.subscription.updated
```

### 2. Base de Données Supabase
- ✅ Row Level Security (RLS) activée
- ✅ Politiques de sécurité configurées
- ✅ Chiffrement des données sensibles

### 3. Tests Post-Déploiement
```bash
# Tester les endpoints critiques
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/auth/session
```

## 📊 Monitoring

### Vercel Analytics
- Activez Vercel Analytics dans le dashboard
- Monitoring automatique des performances

### Logs
```bash
# Voir les logs en temps réel
vercel logs

# Logs d'une fonction spécifique
vercel logs --follow
```

## 🔄 Déploiements Futurs

### Déploiement Automatique
```bash
# Push vers la branche main déclenche un déploiement auto
git push origin main
```

### Déploiement Manuel
```bash
# Déploiement immédiat
vercel --prod

# Preview deployment
vercel
```

## ✅ Checklist Final

- [ ] Variables d'environnement configurées
- [ ] Build réussi localement
- [ ] Supabase connecté et testé
- [ ] Stripe configuré avec webhooks
- [ ] SSL/HTTPS vérifié
- [ ] Monitoring activé
- [ ] Tests post-déploiement effectués

## 🎯 Commande de Déploiement

```bash
# Commande finale pour déployer en production
vercel --prod
```

---

**🎉 L'application NutriCoach est prête pour la production !**

**Architecture déployée :**
- ✅ Next.js 15 avec App Router
- ✅ Supabase Auth + Database
- ✅ Stripe Subscriptions (6.99€/mois)
- ✅ Sécurité niveau médical
- ✅ Conformité RGPD