# 🚀 GUIDE DÉPLOIEMENT COOLIFY - NUTRICOACH

## 📋 Prérequis VPS
- **VPS** : OVH, Hetzner, DigitalOcean (5-15€/mois)
- **RAM** : 2GB minimum
- **OS** : Ubuntu 22.04 LTS
- **Docker** : Auto-installé par Coolify

## 🔧 Installation Coolify (15 minutes)

### 1. Connexion SSH au VPS
```bash
ssh root@votre-serveur.com
```

### 2. Installation Coolify
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 3. Accès Interface
- **URL** : http://votre-serveur.com:8000
- **Setup** : Compte admin + configuration

## 🎯 Configuration NutriCoach

### **MÉTHODE 1 : GitHub Repository (RECOMMANDÉE)**

1. **Nouveau Projet** → **Application** → **GitHub Repository**
2. **Repository** : `Manu5921/nutricoach`
3. **Branch** : `main`
4. **Build Pack** : `Auto-detect` (Coolify détectera Next.js)

#### **Variables d'Environnement à Configurer :**
```bash
# Production
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nutricoach-production.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://1308e4009f86d89c058926d210bd4706@o4509553369022464.ingest.de.sentry.io/4509583095234640

# Email (optionnel)
RESEND_API_KEY=votre_clé_resend
```

#### **Configuration Build :**
- **Port** : `3000`
- **Build Command** : `npm ci && npm run build` (auto-détecté)
- **Start Command** : `npm start` (auto-détecté)

#### **Avantages Méthode GitHub :**
- ✅ **Auto-deploy** sur push
- ✅ **Détection automatique** Next.js
- ✅ **Build transparent** - plus de cache mystérieux
- ✅ **Logs complets** 

---

### **MÉTHODE 2 : Docker Compose (Alternative)**

1. **Nouveau Projet** → **Application** → **Docker Compose**
2. **Coller cette configuration :**

```yaml
version: '3.8'

services:
  nutricoach:
    build:
      context: https://github.com/Manu5921/nutricoach.git#main
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      # Coolify auto-générera ces labels
      - "SERVICE_FQDN_NUTRICOACH_3000=/"
```

#### **Variables Coolify Automatiques :**
Coolify génère automatiquement :
- `SERVICE_FQDN_NUTRICOACH_3000` → URL publique
- SSL Let's Encrypt automatique
- Reverse proxy Traefik

---

## 🔗 Configuration Domaine & SSL

### **Option A : Sous-domaine Coolify**
- **URL automatique** : `https://nutricoach-abc123.votre-serveur.com`
- **SSL** : Automatique Let's Encrypt

### **Option B : Domaine personnalisé**
1. **DNS A Record** : `nutricoach.com` → `IP_VPS`
2. **Coolify** : Settings → FQDN → `nutricoach.com`
3. **SSL** : Auto-généré Let's Encrypt

## 📊 Monitoring & Logs

### **Dashboard Coolify :**
- **Logs en temps réel** : Plus de mystère !
- **Métriques** : CPU, RAM, réseau
- **Health checks** : Status application
- **Builds** : Historique complet

### **Sentry Integration :**
- Configuration automatique avec SENTRY_DSN
- Monitoring erreurs production
- Performance tracking

## 🔄 Workflow de Déploiement

### **Push to Deploy :**
```bash
# Development local
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# → Coolify détecte le push
# → Build automatique avec Dockerfile correct
# → Deploy en production
# → Logs transparents !
```

### **Rollback Facile :**
- Interface Coolify → Deployments
- Clic sur version précédente → Rollback

## 🚨 Résolution Problème Railway

### **Pourquoi Coolify > Railway :**
1. **Transparence** : Logs complets, pas de cache mystérieux
2. **Contrôle** : Self-hosted, configuration claire
3. **Flexibilité** : Docker natif, pas de limitations
4. **Performance** : Build plus rapides, moins de bugs

### **Migration Railway → Coolify :**
1. **Export variables** Railway → Coolify
2. **Import GitHub repo** → Configuration automatique
3. **Test déploiement** → Vérification
4. **DNS switch** → Migration production

## 💰 Coûts Comparaison

| Service | Coût/mois | Contrôle | Bugs |
|---------|-----------|----------|------|
| **Railway** | 5-20€ | ⭐⭐ | ❌ Cache mystérieux |
| **Coolify** | 5-15€ VPS | ⭐⭐⭐⭐⭐ | ✅ Transparent |
| **Vercel** | 20-100€ | ⭐⭐⭐ | ⚠️ Build limits |

## 🎯 Prochaines Étapes

1. **Setup VPS** (15 min)
2. **Install Coolify** (5 min)
3. **Deploy NutriCoach** (10 min)
4. **Configure domaine** (5 min)
5. **Test complet** (5 min)

**Total : 40 minutes → NutriCoach en production !**

---

## 📞 Support

- **Documentation Coolify** : https://coolify.io/docs
- **Discord Coolify** : Support réactif
- **GitHub Issues** : https://github.com/coollabsio/coolify

**Coolify = Railway sans les bugs + contrôle total !**