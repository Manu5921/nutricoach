# 🤖 CLAUDE CODE AI ECOSYSTEM INTEGRATION TEMPLATE

## Usage: Copiez-collez ce template au début de vos sessions Claude Code

---

## 📋 CONTEXTE SESSION & AI ECOSYSTEM INTEGRATION

**Project:** [NOM_DU_PROJET]  
**Session Type:** [Development/Debug/Optimization/Review]  
**AI Ecosystem Integration:** ✅ Activé  

### 🔗 Communication AI Ecosystem
```bash
# Commandes disponibles dans cette session:
ai-feedback "Message de feedback de cette session" --quality=[1-10]
ai-request --agent=[seo/design/deploy/modules/jules] --project="[PROJET]"
ai-log --duration=[temps] --notes="Notes session"
ai-status  # Vérifier AI ecosystem
```

### 📊 Métriques Session
- **Objectif:** [Décrire l'objectif principal]
- **Complexité:** [Low/Medium/High]  
- **Technologies:** [Liste des technos]
- **Agent Recommandé:** [Si spécifique]

### 🎯 Instructions Spéciales
```
Pendant cette session:
1. 🔄 Utiliser ai-feedback pour envoyer retours qualité
2. 🤖 Utiliser ai-request si besoin aide agent spécialisé  
3. 📝 Logger session avec ai-log à la fin
4. 📈 Contribuer à l'apprentissage AI ecosystem
```

---

## 🚀 TEMPLATES RAPIDES

### **Pour Session Développement**
```bash
# Début de session
ai-context  # Charger contexte projet

# En cours si problème spécifique
ai-request --agent=modules --project="$(basename $PWD)"

# Fin de session
ai-log --duration=45min --notes="Développement feature X réussi"
ai-feedback "Excellente assistance sur React components" --quality=9
```

### **Pour Session SEO/Performance**
```bash
# Demander agent SEO spécialisé
ai-request --agent=seo --project="$(basename $PWD)"

# Feedback fin session
ai-feedback "Optimisation SEO très efficace" --quality=9
ai-log --duration=30min --notes="SEO optimization - Core Web Vitals improved"
```

### **Pour Session Debugging**
```bash
# Si besoin review de code
ai-request --agent=jules --project="$(basename $PWD)"

# Log session debug
ai-log --duration=60min --notes="Debug session - issue résolu avec Jules"
ai-feedback "Agent Jules excellent pour debugging" --quality=9
```

---

## 💡 BEST PRACTICES INTEGRATION

### **1. Feedback Continu**
- ✅ Donner feedback qualité chaque session (1-10)
- ✅ Être spécifique dans les commentaires
- ✅ Mentionner les agents qui ont le mieux aidé

### **2. Utilisation Agents Spécialisés**
- 🎨 **claude-design** → UI/UX, responsive, Tailwind
- 🔧 **claude-modules** → React, API, backend dev
- 🔍 **claude-seo** → SEO, performance, analytics
- 🚀 **claude-deploy** → Deployment, DevOps, CI/CD
- 👨‍💻 **jules** → Code review, security, best practices

### **3. Session Logging**
- 📝 Logger systématiquement durée et résultats
- 📊 Aider AI ecosystem à apprendre patterns
- 🎯 Contribuer aux métriques de performance

---

## 🔧 TROUBLESHOOTING

### **Si ai-bridge pas disponible:**
```bash
# Installation rapide
bash /Users/manu/Documents/DEV/ai-ecosystem/core/install-bridge.sh

# Ou manuel
chmod +x /Users/manu/Documents/DEV/ai-ecosystem/core/cli-tools/ai-bridge.sh
ln -s /Users/manu/Documents/DEV/ai-ecosystem/core/cli-tools/ai-bridge.sh /usr/local/bin/ai-bridge
```

### **Si AI ecosystem pas démarré:**
```bash
# Démarrer AI ecosystem
cd /Users/manu/Documents/DEV/ai-ecosystem/core
npm start

# Vérifier status
ai-status
```

---

## 📈 CONTRIBUTION LEARNING ENGINE

Cette session contribue automatiquement au **Learning Engine AI Ecosystem** pour:
- 🧠 Améliorer les recommendations d'agents
- 📊 Optimiser les patterns de développement  
- 🎯 Personnaliser l'assistance future
- 🚀 Développer l'intelligence collective

**Merci de contribuer à l'évolution de l'AI Ecosystem !** 🤖✨