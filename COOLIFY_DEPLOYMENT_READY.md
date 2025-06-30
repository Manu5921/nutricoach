# 🚀 DÉPLOIEMENT COOLIFY - NUTRICOACH PRÊT

## 📊 CONFIGURATION VALIDÉE

**VPS :** 89.117.61.193  
**Repository :** https://github.com/Manu5921/nutricoach.git  
**Coolify API :** 1|V5eGAOMaZ6L8eAwE8xB9TQXqt0mAJDldIPbrYux6f8edc6f3  
**Mode :** Test (sans Stripe)  

---

## ⚡ DÉPLOIEMENT RAPIDE (15 MINUTES)

### **ÉTAPE 1 : Installation Coolify (5 min)**

```bash
# Connexion au VPS
ssh root@89.117.61.193

# Installation Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Attendre fin installation
# Interface disponible : http://89.117.61.193:8000
```

### **ÉTAPE 2 : Première Configuration Coolify (3 min)**

1. **Ouvrir** http://89.117.61.193:8000
2. **Créer compte admin** (email + mot de passe)
3. **Server Settings** → Valider configuration

### **ÉTAPE 3 : Déploiement NutriCoach (7 min)**

#### **A. Créer l'Application**
1. **+ New Project** → **Project Name:** `nutricoach`
2. **+ New Resource** → **Application**
3. **Public Repository** → Coller : `https://github.com/Manu5921/nutricoach.git`
4. **Branch:** `main`
5. **Build Pack:** `Auto-detect` (détectera Next.js)

#### **B. Variables d'Environnement**
Dans **Environment Variables**, ajouter :

```bash
# Production Core
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Base URL
NEXT_PUBLIC_BASE_URL=http://89.117.61.193:3000

# Supabase (PRODUCTION READY)
NEXT_PUBLIC_SUPABASE_URL=https://sgombrccebqutpompbjj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4Mzk5NTUsImV4cCI6MjA2NjQxNTk1NX0.jsOfUsgNVWiRIdm8GJGoGAPYzZNRne3LladfTvdQnkA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgzOTk1NSwiZXhwIjoyMDY2NDE1OTU1fQ.C96QktQzrTbZ4lm1gQPT6sJ9doSaIpXrHakxiyw2MXU

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://1308e4009f86d89c058926d210bd4706@o4509553369022464.ingest.de.sentry.io/4509583095234640
SENTRY_ORG=manucl
SENTRY_PROJECT=nutricoach-railway

# Security Keys (générer nouvelles)
NEXTAUTH_SECRET=nutricoach_test_secret_32_chars_min
ENCRYPTION_KEY=test_encryption_key_32_chars_min
JWT_SECRET=test_jwt_secret_for_nutricoach

# Stripe (MODE TEST - Optionnel)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_disabled_for_testing
STRIPE_SECRET_KEY=sk_test_disabled_for_testing
```

#### **C. Configuration Build**
1. **Port:** `3000`
2. **Build Command:** Auto-détecté (`npm ci && npm run build`)
3. **Start Command:** Auto-détecté (`npm start`)
4. **Dockerfile:** Le projet a déjà un Dockerfile optimisé

#### **D. Déploiement**
1. **Deploy** → Coolify lance le build
2. **Logs en temps réel** → Suivre le build (3-5 min)
3. **Success** → Application disponible

---

## 🎯 ACCÈS APPLICATION

### **URLs d'Accès**
- **Application :** http://89.117.61.193:3000
- **Interface Coolify :** http://89.117.61.193:8000
- **API Health :** http://89.117.61.193:3000/api/health

### **Test de Fonctionnement**
```bash
# Test API
curl http://89.117.61.193:3000/api/health

# Réponse attendue :
# {"status":"healthy","timestamp":"..."}
```

---

## 🔄 WORKFLOW AUTO-DEPLOY

### **Push to Deploy**
```bash
# Développement local
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# → Coolify détecte automatiquement
# → Build et deploy automatique
# → Mise à jour en production
```

### **Monitoring**
- **Logs temps réel** : Interface Coolify
- **Métriques** : CPU, RAM, réseau
- **Erreurs** : Sentry intégré
- **Health checks** : API automatique

---

## 🚨 FONCTIONNALITÉS DISPONIBLES EN TEST

### **✅ Fonctionnel**
- ✅ Interface utilisateur complète
- ✅ Authentification Supabase
- ✅ Base de données nutrition (8000+ aliments)
- ✅ Générateur de menus IA
- ✅ Tracking biomarqueurs
- ✅ PWA (mode offline)
- ✅ Analytics Sentry
- ✅ Performance monitoring

### **⚠️ Limité (Mode Test)**
- ⚠️ **Paiements Stripe** : Désactivés (pas de clés live)
- ⚠️ **Email Marketing** : Non configuré (pas de clé Resend)
- ⚠️ **Push Notifications** : Non configuré (pas de VAPID)
- ⚠️ **Google Analytics** : Non configuré (pas de GA_ID)

### **🔧 Pour Production Complète**
Quand vous serez prêt, ajoutez :
```bash
# Stripe Production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Email Marketing
RESEND_API_KEY=re_...

# Analytics
NEXT_PUBLIC_GA_ID=G-...

# Push Notifications
NEXT_PUBLIC_VAPID_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## 🎉 RÉSULTAT FINAL

**En 15 minutes vous aurez :**
- ✅ NutriCoach déployé sur http://89.117.61.193:3000
- ✅ Auto-deploy sur chaque push GitHub
- ✅ Monitoring complet avec logs transparents
- ✅ Architecture multi-agent opérationnelle
- ✅ Base de données nutrition complète
- ✅ Features IA nutrition fonctionnelles

**Prêt pour les tests utilisateur et démonstrations !**

---

## 💡 SUPPORT

- **Logs Build** : Interface Coolify → Deployments → Logs
- **Erreurs Runtime** : Sentry Dashboard intégré
- **Database** : Supabase Dashboard
- **Monitoring** : Coolify metrics en temps réel

**C'est parti ! 🚀**