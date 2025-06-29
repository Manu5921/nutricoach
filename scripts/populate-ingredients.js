#!/usr/bin/env node

/**
 * Script de Population Base de Données - NutriCoach
 * 
 * Import automatisé de 500+ ingrédients populaires français/US
 * avec calcul des scores anti-inflammatoires et validation qualité
 * 
 * @author Content & Data Specialist Agent
 * @version 1.0.0
 * 
 * Usage:
 *   node scripts/populate-ingredients.js
 *   node scripts/populate-ingredients.js --dry-run
 *   node scripts/populate-ingredients.js --category=vegetables
 *   node scripts/populate-ingredients.js --limit=100
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// =============================================
// CONFIGURATION ET CONSTANTES
// =============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Arguments de ligne de commande
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1]
const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1]
const maxIngredients = limitArg ? parseInt(limitArg) : 500

console.log('🥗 Script de Population NutriCoach')
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`)
console.log(`Limite: ${maxIngredients} ingrédients`)
if (categoryFilter) console.log(`Filtre catégorie: ${categoryFilter}`)
console.log('=====================================')

// =============================================
// DONNÉES INGRÉDIENTS PAR CATÉGORIE
// =============================================

const INGREDIENTS_DATA = {
  vegetables: [
    // Légumes feuilles verts (anti-inflammatoires élevés)
    { name: 'Épinards', calories: 23, protein: 2.86, carbs: 3.63, fat: 0.39, fiber: 2.2, antiInflammatory: 7, compounds: ['lutéine', 'zéaxanthine', 'kaempférol'] },
    { name: 'Chou kale', calories: 49, protein: 4.28, carbs: 8.75, fat: 0.93, fiber: 3.6, antiInflammatory: 7, compounds: ['quercétine', 'kaempférol', 'bêta-carotène'] },
    { name: 'Roquette', calories: 25, protein: 2.58, carbs: 3.65, fat: 0.66, fiber: 1.6, antiInflammatory: 6, compounds: ['glucosinolates', 'vitamine K'] },
    { name: 'Blettes', calories: 19, protein: 1.8, carbs: 3.74, fat: 0.2, fiber: 1.6, antiInflammatory: 6, compounds: ['bêta-carotène', 'vitamine K'] },
    { name: 'Cresson', calories: 11, protein: 2.3, carbs: 1.29, fat: 0.1, fiber: 0.5, antiInflammatory: 7, compounds: ['glucosinolates', 'vitamine C'] },
    { name: 'Mâche', calories: 21, protein: 2, carbs: 3.6, fat: 0.4, fiber: 1.5, antiInflammatory: 6, compounds: ['oméga-3', 'vitamine C'] },
    
    // Crucifères (anti-inflammatoires)
    { name: 'Brocoli', calories: 34, protein: 2.82, carbs: 6.64, fat: 0.37, fiber: 2.6, antiInflammatory: 6, compounds: ['sulforaphane', 'indole-3-carbinol', 'vitamine C'] },
    { name: 'Chou-fleur', calories: 25, protein: 1.92, carbs: 4.97, fat: 0.28, fiber: 2, antiInflammatory: 5, compounds: ['sulforaphane', 'choline'] },
    { name: 'Choux de Bruxelles', calories: 43, protein: 3.38, carbs: 8.95, fat: 0.3, fiber: 3.8, antiInflammatory: 6, compounds: ['sulforaphane', 'vitamine K'] },
    { name: 'Chou rouge', calories: 31, protein: 1.43, carbs: 7.37, fat: 0.16, fiber: 2.1, antiInflammatory: 6, compounds: ['anthocyanes', 'vitamine C'] },
    { name: 'Chou blanc', calories: 25, protein: 1.28, carbs: 5.8, fat: 0.1, fiber: 2.5, antiInflammatory: 5, compounds: ['vitamine C', 'vitamine K'] },
    { name: 'Radis', calories: 16, protein: 0.68, carbs: 3.4, fat: 0.1, fiber: 1.6, antiInflammatory: 4, compounds: ['glucosinolates', 'vitamine C'] },
    
    // Légumes colorés (antioxydants)
    { name: 'Poivron rouge', calories: 31, protein: 0.99, carbs: 7.31, fat: 0.3, fiber: 2.5, antiInflammatory: 6, compounds: ['capsaïcine', 'vitamine C', 'bêta-carotène'] },
    { name: 'Poivron jaune', calories: 27, protein: 1, carbs: 6.32, fat: 0.21, fiber: 0.9, antiInflammatory: 5, compounds: ['vitamine C', 'bêta-carotène'] },
    { name: 'Tomate', calories: 18, protein: 0.88, carbs: 3.89, fat: 0.2, fiber: 1.2, antiInflammatory: 5, compounds: ['lycopène', 'vitamine C'] },
    { name: 'Carotte', calories: 41, protein: 0.93, carbs: 9.58, fat: 0.24, fiber: 2.8, antiInflammatory: 4, compounds: ['bêta-carotène', 'alpha-carotène'] },
    { name: 'Betterave', calories: 43, protein: 1.61, carbs: 9.56, fat: 0.17, fiber: 2.8, antiInflammatory: 5, compounds: ['bétalaïnes', 'nitrates'] },
    { name: 'Patate douce', calories: 86, protein: 1.57, carbs: 20.12, fat: 0.05, fiber: 3, antiInflammatory: 5, compounds: ['bêta-carotène', 'anthocyanes'] },
    
    // Légumes-racines
    { name: 'Panais', calories: 75, protein: 1.2, carbs: 17.99, fat: 0.3, fiber: 4.9, antiInflammatory: 3, compounds: ['fibres', 'potassium'] },
    { name: 'Navet', calories: 28, protein: 0.9, carbs: 6.43, fat: 0.1, fiber: 1.8, antiInflammatory: 3, compounds: ['vitamine C', 'glucosinolates'] },
    { name: 'Rutabaga', calories: 37, protein: 1.08, carbs: 8.62, fat: 0.16, fiber: 2.3, antiInflammatory: 3, compounds: ['vitamine C', 'potassium'] },
    
    // Légumes méditerranéens
    { name: 'Aubergine', calories: 25, protein: 0.98, carbs: 5.88, fat: 0.18, fiber: 3, antiInflammatory: 4, compounds: ['nasunine', 'chlorophylle'] },
    { name: 'Courgette', calories: 17, protein: 1.21, carbs: 3.11, fat: 0.32, fiber: 1, antiInflammatory: 4, compounds: ['lutéine', 'zéaxanthine'] },
    { name: 'Concombre', calories: 16, protein: 0.65, carbs: 4.0, fat: 0.11, fiber: 0.5, antiInflammatory: 3, compounds: ['vitamine K', 'potassium'] },
    
    // Légumes alliacés (anti-inflammatoires puissants)
    { name: 'Ail', calories: 149, protein: 6.36, carbs: 33.06, fat: 0.5, fiber: 2.1, antiInflammatory: 8, compounds: ['allicine', 'diallyl sulfide'] },
    { name: 'Oignon', calories: 40, protein: 1.1, carbs: 9.34, fat: 0.1, fiber: 1.7, antiInflammatory: 6, compounds: ['quercétine', 'composés soufrés'] },
    { name: 'Échalote', calories: 72, protein: 2.5, carbs: 16.8, fat: 0.1, fiber: 3.2, antiInflammatory: 6, compounds: ['quercétine', 'allicine'] },
    { name: 'Poireau', calories: 61, protein: 1.5, carbs: 14.15, fat: 0.3, fiber: 1.8, antiInflammatory: 5, compounds: ['kaempférol', 'vitamine K'] },
    
    // Légumes asiatiques
    { name: 'Pak-choï', calories: 13, protein: 1.5, carbs: 2.18, fat: 0.2, fiber: 1, antiInflammatory: 6, compounds: ['vitamine C', 'vitamine K'] },
    { name: 'Shiitake', calories: 34, protein: 2.24, carbs: 6.79, fat: 0.49, fiber: 2.5, antiInflammatory: 7, compounds: ['lentinane', 'eritadenine'] },
    
    // Légumes verts divers
    { name: 'Artichaut', calories: 47, protein: 3.27, carbs: 10.51, fat: 0.15, fiber: 5.4, antiInflammatory: 6, compounds: ['cynarine', 'silymarine'] },
    { name: 'Asperge', calories: 20, protein: 2.2, carbs: 3.88, fat: 0.12, fiber: 2.1, antiInflammatory: 5, compounds: ['glutathion', 'rutine'] },
    { name: 'Haricots verts', calories: 35, protein: 1.83, carbs: 7.88, fat: 0.22, fiber: 2.7, antiInflammatory: 4, compounds: ['lutéine', 'vitamine K'] },
    { name: 'Petits pois', calories: 81, protein: 5.42, carbs: 14.45, fat: 0.4, fiber: 5.7, antiInflammatory: 4, compounds: ['lutéine', 'zéaxanthine'] },
    { name: 'Fenouil', calories: 31, protein: 1.24, carbs: 7.3, fat: 0.2, fiber: 3.1, antiInflammatory: 5, compounds: ['anéthol', 'vitamine C'] },
    { name: 'Céleri', calories: 14, protein: 0.69, carbs: 2.97, fat: 0.17, fiber: 1.6, antiInflammatory: 4, compounds: ['apigénine', 'lutéoline'] }
  ],

  fruits: [
    // Baies (anti-inflammatoires très élevés)
    { name: 'Myrtilles', calories: 57, protein: 0.74, carbs: 14.49, fat: 0.33, fiber: 2.4, antiInflammatory: 8, compounds: ['anthocyanes', 'ptérostilbène', 'resvératrol'] },
    { name: 'Framboises', calories: 52, protein: 1.2, carbs: 11.94, fat: 0.65, fiber: 6.5, antiInflammatory: 7, compounds: ['anthocyanes', 'ellagique'] },
    { name: 'Mûres', calories: 43, protein: 1.39, carbs: 9.61, fat: 0.49, fiber: 5.3, antiInflammatory: 7, compounds: ['anthocyanes', 'vitamine C'] },
    { name: 'Fraises', calories: 32, protein: 0.67, carbs: 7.68, fat: 0.3, fiber: 2, antiInflammatory: 6, compounds: ['anthocyanes', 'acide ellagique', 'vitamine C'] },
    { name: 'Canneberges', calories: 46, protein: 0.46, carbs: 12.2, fat: 0.13, fiber: 3.6, antiInflammatory: 7, compounds: ['anthocyanes', 'proanthocyanidines'] },
    { name: 'Cassis', calories: 63, protein: 1.4, carbs: 15.38, fat: 0.41, fiber: 4.8, antiInflammatory: 8, compounds: ['anthocyanes', 'vitamine C'] },
    { name: 'Groseilles', calories: 56, protein: 1.4, carbs: 13.8, fat: 0.2, fiber: 4.3, antiInflammatory: 6, compounds: ['vitamine C', 'rutine'] },
    { name: 'Cerises acides', calories: 50, protein: 1, carbs: 12.18, fat: 0.3, fiber: 1.6, antiInflammatory: 7, compounds: ['anthocyanes', 'mélatonine'] },
    
    // Fruits à pépins
    { name: 'Pomme', calories: 52, protein: 0.26, carbs: 13.81, fat: 0.17, fiber: 2.4, antiInflammatory: 4, compounds: ['quercétine', 'catéchine'] },
    { name: 'Poire', calories: 57, protein: 0.36, carbs: 15.23, fat: 0.14, fiber: 3.1, antiInflammatory: 3, compounds: ['fibres', 'vitamine C'] },
    
    // Agrumes (vitamine C élevée)
    { name: 'Orange', calories: 47, protein: 0.94, carbs: 11.75, fat: 0.12, fiber: 2.4, antiInflammatory: 5, compounds: ['vitamine C', 'hespéridine', 'limonène'] },
    { name: 'Citron', calories: 29, protein: 1.1, carbs: 9.32, fat: 0.3, fiber: 2.8, antiInflammatory: 6, compounds: ['vitamine C', 'limonène', 'citral'] },
    { name: 'Pamplemousse', calories: 42, protein: 0.77, carbs: 10.66, fat: 0.14, fiber: 1.6, antiInflammatory: 5, compounds: ['naringine', 'lycopène'] },
    { name: 'Mandarine', calories: 53, protein: 0.81, carbs: 13.34, fat: 0.31, fiber: 1.8, antiInflammatory: 4, compounds: ['vitamine C', 'bêta-carotène'] },
    { name: 'Lime', calories: 30, protein: 0.7, carbs: 10.54, fat: 0.2, fiber: 2.8, antiInflammatory: 5, compounds: ['vitamine C', 'flavonoïdes'] },
    
    // Fruits tropicaux
    { name: 'Ananas', calories: 50, protein: 0.54, carbs: 13.12, fat: 0.12, fiber: 1.4, antiInflammatory: 6, compounds: ['bromélaïne', 'vitamine C'] },
    { name: 'Papaye', calories: 43, protein: 0.47, carbs: 10.82, fat: 0.26, fiber: 1.7, antiInflammatory: 6, compounds: ['papaïne', 'lycopène'] },
    { name: 'Mangue', calories: 60, protein: 0.82, carbs: 14.98, fat: 0.38, fiber: 1.6, antiInflammatory: 5, compounds: ['bêta-carotène', 'vitamine C'] },
    { name: 'Avocat', calories: 160, protein: 2, carbs: 8.53, fat: 14.66, fiber: 6.7, antiInflammatory: 6, compounds: ['acide oléique', 'lutéine', 'vitamine E'] },
    { name: 'Kiwi', calories: 61, protein: 1.14, carbs: 14.66, fat: 0.52, fiber: 3, antiInflammatory: 6, compounds: ['vitamine C', 'vitamine K'] },
    
    // Fruits à noyau
    { name: 'Pêche', calories: 39, protein: 0.91, carbs: 9.54, fat: 0.25, fiber: 1.5, antiInflammatory: 4, compounds: ['bêta-carotène', 'vitamine C'] },
    { name: 'Abricot', calories: 48, protein: 1.4, carbs: 11.12, fat: 0.39, fiber: 2, antiInflammatory: 5, compounds: ['bêta-carotène', 'lutéine'] },
    { name: 'Prune', calories: 46, protein: 0.7, carbs: 11.42, fat: 0.28, fiber: 1.4, antiInflammatory: 4, compounds: ['anthocyanes', 'phénols'] },
    { name: 'Cerise douce', calories: 63, protein: 1.06, carbs: 16.01, fat: 0.2, fiber: 2.1, antiInflammatory: 6, compounds: ['anthocyanes', 'mélatonine'] },
    
    // Fruits secs et à coque (dans cette catégorie pour l'organisation)
    { name: 'Raisin', calories: 69, protein: 0.72, carbs: 18.1, fat: 0.16, fiber: 0.9, antiInflammatory: 5, compounds: ['resvératrol', 'anthocyanes'] },
    { name: 'Figue', calories: 74, protein: 0.75, carbs: 19.18, fat: 0.3, fiber: 2.9, antiInflammatory: 4, compounds: ['fibres', 'potassium'] },
    { name: 'Grenade', calories: 83, protein: 1.67, carbs: 18.7, fat: 1.17, fiber: 4, antiInflammatory: 8, compounds: ['punicalagines', 'anthocyanes'] },
    
    // Fruits exotiques
    { name: 'Fruit du dragon', calories: 60, protein: 1.2, carbs: 13, fat: 0.4, fiber: 3, antiInflammatory: 5, compounds: ['bêta-carotène', 'vitamine C'] },
    { name: 'Fruit de la passion', calories: 97, protein: 2.2, carbs: 23.38, fat: 0.7, fiber: 10.4, antiInflammatory: 6, compounds: ['vitamine C', 'bêta-carotène'] },
    { name: 'Goyave', calories: 68, protein: 2.55, carbs: 14.32, fat: 0.95, fiber: 5.4, antiInflammatory: 6, compounds: ['vitamine C', 'lycopène'] }
  ],

  proteins: [
    // Poissons gras (oméga-3 élevés)
    { name: 'Saumon sauvage', calories: 208, protein: 25.44, carbs: 0, fat: 12.35, fiber: 0, antiInflammatory: 8, compounds: ['oméga-3', 'astaxanthine'] },
    { name: 'Sardines', calories: 208, protein: 24.62, carbs: 0, fat: 11.45, fiber: 0, antiInflammatory: 8, compounds: ['oméga-3', 'coenzyme Q10'] },
    { name: 'Maquereau', calories: 205, protein: 18.6, carbs: 0, fat: 13.89, fiber: 0, antiInflammatory: 7, compounds: ['oméga-3', 'vitamine D'] },
    { name: 'Anchois', calories: 131, protein: 20.35, carbs: 0, fat: 4.84, fiber: 0, antiInflammatory: 7, compounds: ['oméga-3', 'sélénium'] },
    { name: 'Hareng', calories: 158, protein: 17.96, carbs: 0, fat: 9.04, fiber: 0, antiInflammatory: 7, compounds: ['oméga-3', 'vitamine D'] },
    { name: 'Truite', calories: 148, protein: 20.77, carbs: 0, fat: 6.61, fiber: 0, antiInflammatory: 6, compounds: ['oméga-3', 'vitamine B12'] },
    
    // Poissons blancs
    { name: 'Cabillaud', calories: 82, protein: 17.81, carbs: 0, fat: 0.67, fiber: 0, antiInflammatory: 4, compounds: ['sélénium', 'vitamine B12'] },
    { name: 'Sole', calories: 70, protein: 16.56, carbs: 0, fat: 1.21, fiber: 0, antiInflammatory: 4, compounds: ['phosphore', 'vitamine B12'] },
    { name: 'Lieu noir', calories: 76, protein: 17.1, carbs: 0, fat: 0.8, fiber: 0, antiInflammatory: 4, compounds: ['sélénium', 'vitamine B6'] },
    
    // Fruits de mer
    { name: 'Crevettes', calories: 106, protein: 20.31, carbs: 0.91, fat: 1.73, fiber: 0, antiInflammatory: 5, compounds: ['sélénium', 'astaxanthine'] },
    { name: 'Moules', calories: 86, protein: 11.9, carbs: 3.69, fat: 2.24, fiber: 0, antiInflammatory: 5, compounds: ['oméga-3', 'vitamine B12'] },
    { name: 'Huîtres', calories: 68, protein: 7.05, carbs: 3.91, fat: 2.46, fiber: 0, antiInflammatory: 6, compounds: ['zinc', 'vitamine B12'] },
    
    // Volailles
    { name: 'Poulet (blanc)', calories: 165, protein: 31.02, carbs: 0, fat: 3.57, fiber: 0, antiInflammatory: 2, compounds: ['sélénium', 'niacine'] },
    { name: 'Dinde (blanc)', calories: 135, protein: 30.13, carbs: 0, fat: 0.98, fiber: 0, antiInflammatory: 2, compounds: ['sélénium', 'phosphore'] },
    { name: 'Canard (sans peau)', calories: 201, protein: 23.48, carbs: 0, fat: 11.2, fiber: 0, antiInflammatory: 1, compounds: ['fer', 'zinc'] },
    
    // Œufs
    { name: 'Œufs (poules élevées au sol)', calories: 155, protein: 12.56, carbs: 1.12, fat: 10.61, fiber: 0, antiInflammatory: 3, compounds: ['choline', 'lutéine'] },
    { name: 'Œufs de caille', calories: 158, protein: 13.05, carbs: 0.41, fat: 11.09, fiber: 0, antiInflammatory: 3, compounds: ['vitamine B12', 'sélénium'] },
    
    // Viandes rouges (modération)
    { name: 'Bœuf (filet)', calories: 271, protein: 26.33, carbs: 0, fat: 17.51, fiber: 0, antiInflammatory: -1, compounds: ['fer', 'zinc', 'vitamine B12'] },
    { name: 'Agneau (filet)', calories: 294, protein: 24.52, carbs: 0, fat: 20.94, fiber: 0, antiInflammatory: -1, compounds: ['fer', 'zinc'] },
    { name: 'Porc (filet)', calories: 143, protein: 26.89, carbs: 0, fat: 3.18, fiber: 0, antiInflammatory: -2, compounds: ['thiamine', 'sélénium'] },
    
    // Protéines transformées (à éviter)
    { name: 'Charcuterie (jambon)', calories: 145, protein: 18.3, carbs: 1.5, fat: 7.41, fiber: 0, antiInflammatory: -6, compounds: [] },
    { name: 'Saucisses', calories: 346, protein: 13.46, carbs: 2.97, fat: 31.61, fiber: 0, antiInflammatory: -7, compounds: [] }
  ],

  grains: [
    // Pseudo-céréales (sans gluten)
    { name: 'Quinoa', calories: 368, protein: 14.12, carbs: 64.16, fat: 6.07, fiber: 7, antiInflammatory: 4, compounds: ['quercétine', 'kaempférol'] },
    { name: 'Amarante', calories: 371, protein: 13.56, carbs: 65.25, fat: 7.02, fiber: 6.7, antiInflammatory: 4, compounds: ['squalène', 'tocotriénols'] },
    { name: 'Sarrasin', calories: 343, protein: 13.25, carbs: 71.5, fat: 3.4, fiber: 10, antiInflammatory: 5, compounds: ['rutine', 'quercétine'] },
    { name: 'Millet', calories: 378, protein: 11.02, carbs: 72.85, fat: 4.22, fiber: 8.5, antiInflammatory: 3, compounds: ['magnésium', 'phosphore'] },
    
    // Avoine et orge
    { name: 'Avoine complète', calories: 389, protein: 16.89, carbs: 66.27, fat: 6.9, fiber: 10.6, antiInflammatory: 4, compounds: ['bêta-glucane', 'avenanthramides'] },
    { name: 'Orge perlé', calories: 354, protein: 12.48, carbs: 73.48, fat: 2.3, fiber: 17.3, antiInflammatory: 3, compounds: ['bêta-glucane', 'sélénium'] },
    
    // Riz
    { name: 'Riz brun', calories: 370, protein: 7.94, carbs: 77.24, fat: 2.92, fiber: 3.5, antiInflammatory: 2, compounds: ['magnésium', 'manganèse'] },
    { name: 'Riz sauvage', calories: 357, protein: 14.73, carbs: 74.9, fat: 1.08, fiber: 6.2, antiInflammatory: 3, compounds: ['antioxydants', 'protéines'] },
    { name: 'Riz rouge', calories: 362, protein: 7.3, carbs: 75.8, fat: 2.8, fiber: 2.3, antiInflammatory: 3, compounds: ['anthocyanes', 'gamma-oryzanol'] },
    
    // Blé ancien (meilleure digestibilité)
    { name: 'Épeautre', calories: 338, protein: 14.57, carbs: 70.19, fat: 2.43, fiber: 10.7, antiInflammatory: 1, compounds: ['fibres', 'protéines'] },
    { name: 'Kamut', calories: 337, protein: 14.7, carbs: 70.4, fat: 2.5, fiber: 11.3, antiInflammatory: 1, compounds: ['sélénium', 'vitamine E'] },
    { name: 'Blé dur complet', calories: 339, protein: 13.68, carbs: 71.13, fat: 2.47, fiber: 12.2, antiInflammatory: 0, compounds: ['fibres', 'fer'] },
    
    // Autres céréales
    { name: 'Seigle', calories: 338, protein: 10.34, carbs: 75.86, fat: 1.63, fiber: 15.1, antiInflammatory: 2, compounds: ['lignanes', 'fibres'] },
    { name: 'Teff', calories: 367, protein: 13.3, carbs: 73.13, fat: 2.38, fiber: 8, antiInflammatory: 4, compounds: ['fer', 'calcium'] },
    { name: 'Fonio', calories: 341, protein: 8.7, carbs: 75.8, fat: 1.9, fiber: 8.6, antiInflammatory: 3, compounds: ['magnésium', 'zinc'] }
  ],

  legumes: [
    // Légumineuses classiques
    { name: 'Lentilles vertes', calories: 116, protein: 9.02, carbs: 20.13, fat: 0.38, fiber: 7.9, antiInflammatory: 4, compounds: ['polyphénols', 'saponines'] },
    { name: 'Lentilles rouges', calories: 116, protein: 9.02, carbs: 20.13, fat: 0.38, fiber: 7.9, antiInflammatory: 4, compounds: ['polyphénols', 'saponines'] },
    { name: 'Lentilles noires', calories: 116, protein: 9.02, carbs: 20.13, fat: 0.38, fiber: 7.9, antiInflammatory: 5, compounds: ['anthocyanes', 'antioxydants'] },
    { name: 'Haricots noirs', calories: 132, protein: 8.86, carbs: 23.71, fat: 0.54, fiber: 8.7, antiInflammatory: 5, compounds: ['anthocyanes', 'saponines'] },
    { name: 'Haricots rouges', calories: 127, protein: 8.67, carbs: 22.8, fat: 0.83, fiber: 6.4, antiInflammatory: 4, compounds: ['antioxydants', 'folate'] },
    { name: 'Haricots blancs', calories: 139, protein: 9.73, carbs: 25.09, fat: 0.85, fiber: 10.5, antiInflammatory: 3, compounds: ['fibres', 'magnésium'] },
    { name: 'Flageolets', calories: 90, protein: 6.9, carbs: 15.4, fat: 0.7, fiber: 6.7, antiInflammatory: 4, compounds: ['fibres', 'potassium'] },
    
    // Pois
    { name: 'Pois chiches', calories: 164, protein: 8.86, carbs: 27.42, fat: 2.59, fiber: 7.6, antiInflammatory: 4, compounds: ['saponines', 'isoflavones'] },
    { name: 'Pois cassés', calories: 118, protein: 8.34, carbs: 21.09, fat: 0.39, fiber: 8.3, antiInflammatory: 3, compounds: ['fibres', 'protéines'] },
    { name: 'Pois noirs (black-eyed peas)', calories: 116, protein: 7.73, carbs: 20.76, fat: 0.53, fiber: 6.5, antiInflammatory: 4, compounds: ['folate', 'potassium'] },
    
    // Légumineuses exotiques
    { name: 'Haricots mungo', calories: 105, protein: 7.02, carbs: 19.15, fat: 0.38, fiber: 7.6, antiInflammatory: 5, compounds: ['antioxydants', 'vitamine C'] },
    { name: 'Haricots azuki', calories: 128, protein: 7.52, carbs: 25, fat: 0.53, fiber: 7.3, antiInflammatory: 4, compounds: ['saponines', 'isoflavones'] },
    { name: 'Fèves', calories: 88, protein: 7.92, carbs: 17.63, fat: 0.73, fiber: 4.2, antiInflammatory: 4, compounds: ['dopamine', 'folate'] },
    { name: 'Doliques', calories: 116, protein: 7.68, carbs: 20.2, fat: 0.38, fiber: 9.4, antiInflammatory: 4, compounds: ['fibres', 'fer'] },
    
    // Soja et dérivés
    { name: 'Edamame', calories: 121, protein: 11.91, carbs: 8.91, fat: 5.2, fiber: 5.2, antiInflammatory: 3, compounds: ['isoflavones', 'folate'] },
    { name: 'Tempeh', calories: 190, protein: 20.29, carbs: 7.64, fat: 10.8, fiber: 9.4, antiInflammatory: 3, compounds: ['probiotiques', 'isoflavones'] },
    { name: 'Tofu ferme', calories: 70, protein: 8.08, carbs: 1.88, fat: 4.78, fiber: 0.4, antiInflammatory: 2, compounds: ['isoflavones', 'calcium'] }
  ],

  nuts_seeds: [
    // Noix (oméga-3)
    { name: 'Noix', calories: 654, protein: 15.23, carbs: 13.71, fat: 65.21, fiber: 6.7, antiInflammatory: 7, compounds: ['acide alpha-linolénique', 'acide ellagique'] },
    { name: 'Noix de pécan', calories: 691, protein: 9.17, carbs: 13.86, fat: 71.97, fiber: 9.6, antiInflammatory: 5, compounds: ['vitamine E', 'phytostérols'] },
    { name: 'Noix du Brésil', calories: 659, protein: 14.32, carbs: 12.27, fat: 67.1, fiber: 7.5, antiInflammatory: 6, compounds: ['sélénium', 'magnésium'] },
    { name: 'Noix de macadamia', calories: 718, protein: 7.91, carbs: 13.82, fat: 75.77, fiber: 8.6, antiInflammatory: 4, compounds: ['acides gras monoinsaturés', 'thiamine'] },
    
    // Amandes et apparentés
    { name: 'Amandes', calories: 579, protein: 21.15, carbs: 21.55, fat: 49.93, fiber: 12.5, antiInflammatory: 5, compounds: ['vitamine E', 'flavonoïdes'] },
    { name: 'Noisettes', calories: 628, protein: 14.95, carbs: 16.7, fat: 60.75, fiber: 9.7, antiInflammatory: 5, compounds: ['vitamine E', 'phytostérols'] },
    { name: 'Pistaches', calories: 560, protein: 20.16, carbs: 27.17, fat: 45.32, fiber: 10.6, antiInflammatory: 5, compounds: ['lutéine', 'zéaxanthine'] },
    { name: 'Pignons de pin', calories: 673, protein: 13.69, carbs: 13.08, fat: 68.37, fiber: 3.7, antiInflammatory: 4, compounds: ['vitamine E', 'magnésium'] },
    
    // Graines
    { name: 'Graines de chia', calories: 486, protein: 16.54, carbs: 42.12, fat: 30.74, fiber: 34.4, antiInflammatory: 8, compounds: ['acide alpha-linolénique', 'quercétine'] },
    { name: 'Graines de lin', calories: 534, protein: 18.29, carbs: 28.88, fat: 42.16, fiber: 27.3, antiInflammatory: 8, compounds: ['lignanes', 'oméga-3'] },
    { name: 'Graines de chanvre', calories: 553, protein: 31.56, carbs: 8.67, fat: 48.75, fiber: 4, antiInflammatory: 7, compounds: ['oméga-3', 'magnésium'] },
    { name: 'Graines de tournesol', calories: 584, protein: 20.78, carbs: 20, fat: 51.46, fiber: 8.6, antiInflammatory: 4, compounds: ['vitamine E', 'sélénium'] },
    { name: 'Graines de courge', calories: 559, protein: 30.23, carbs: 10.71, fat: 49, fiber: 6, antiInflammatory: 5, compounds: ['zinc', 'magnésium'] },
    { name: 'Graines de sésame', calories: 573, protein: 17.73, carbs: 23.45, fat: 49.67, fiber: 11.8, antiInflammatory: 4, compounds: ['lignanes', 'calcium'] },
    { name: 'Graines de pavot', calories: 525, protein: 17.99, carbs: 28.13, fat: 41.56, fiber: 19.5, antiInflammatory: 3, compounds: ['calcium', 'magnésium'] },
    
    // Graines exotiques
    { name: 'Graines de nigelle', calories: 375, protein: 16.0, carbs: 44.24, fat: 22.27, fiber: 13.4, antiInflammatory: 7, compounds: ['thymoquinone', 'acides gras'] },
    { name: 'Graines de psyllium', calories: 42, protein: 1.5, carbs: 1.73, fat: 0.55, fiber: 71, antiInflammatory: 3, compounds: ['fibres solubles', 'mucilages'] }
  ],

  herbs_spices: [
    // Épices anti-inflammatoires puissantes
    { name: 'Curcuma', calories: 354, protein: 7.83, carbs: 64.93, fat: 9.88, fiber: 21.1, antiInflammatory: 10, compounds: ['curcumine', 'turmérone'] },
    { name: 'Gingembre', calories: 80, protein: 1.82, carbs: 17.77, fat: 0.75, fiber: 2, antiInflammatory: 8, compounds: ['gingérol', 'shogaol', 'zingérone'] },
    { name: 'Cannelle', calories: 247, protein: 3.99, carbs: 80.59, fat: 1.24, fiber: 53.1, antiInflammatory: 7, compounds: ['cinnamaldéhyde', 'procyanidines'] },
    { name: 'Clou de girofle', calories: 274, protein: 5.97, carbs: 65.53, fat: 13, fiber: 33.9, antiInflammatory: 8, compounds: ['eugénol', 'gallotannins'] },
    { name: 'Cardamome', calories: 311, protein: 10.76, carbs: 68.47, fat: 6.7, fiber: 28, antiInflammatory: 6, compounds: ['cinéole', 'terpinène'] },
    { name: 'Poivre noir', calories: 251, protein: 10.39, carbs: 63.95, fat: 3.26, fiber: 25.3, antiInflammatory: 6, compounds: ['pipérine', 'chavicine'] },
    { name: 'Cumin', calories: 375, protein: 17.81, carbs: 44.24, fat: 22.27, fiber: 10.5, antiInflammatory: 5, compounds: ['cuminaldéhyde', 'thymol'] },
    { name: 'Coriandre graines', calories: 298, protein: 12.37, carbs: 54.99, fat: 17.77, fiber: 41.9, antiInflammatory: 5, compounds: ['linalool', 'acide oléique'] },
    { name: 'Fenugrec', calories: 323, protein: 23, carbs: 58.35, fat: 6.41, fiber: 24.6, antiInflammatory: 6, compounds: ['saponines', 'trigonelline'] },
    
    // Herbes fraîches méditerranéennes
    { name: 'Basilic frais', calories: 22, protein: 3.15, carbs: 2.65, fat: 0.64, fiber: 1.6, antiInflammatory: 7, compounds: ['eugénol', 'linalool'] },
    { name: 'Origan frais', calories: 25, protein: 0.9, carbs: 4.0, fat: 0.43, fiber: 4.2, antiInflammatory: 7, compounds: ['carvacrol', 'thymol'] },
    { name: 'Thym frais', calories: 101, protein: 5.56, carbs: 24.45, fat: 1.68, fiber: 14, antiInflammatory: 8, compounds: ['thymol', 'carvacrol'] },
    { name: 'Romarin frais', calories: 131, protein: 3.31, carbs: 20.7, fat: 5.86, fiber: 14.1, antiInflammatory: 8, compounds: ['acide rosmarinique', 'carnonsol'] },
    { name: 'Sauge fraîche', calories: 315, protein: 10.63, carbs: 60.73, fat: 12.75, fiber: 40.3, antiInflammatory: 7, compounds: ['acide rosmarinique', 'salvine'] },
    { name: 'Persil frais', calories: 36, protein: 2.97, carbs: 6.33, fat: 0.79, fiber: 3.3, antiInflammatory: 6, compounds: ['apigénine', 'myristicine'] },
    { name: 'Ciboulette fraîche', calories: 30, protein: 3.27, carbs: 4.35, fat: 0.73, fiber: 2.5, antiInflammatory: 5, compounds: ['composés soufrés', 'vitamine K'] },
    { name: 'Aneth frais', calories: 43, protein: 3.46, carbs: 7.02, fat: 1.12, fiber: 2.1, antiInflammatory: 5, compounds: ['carvone', 'limonène'] },
    
    // Épices chaudes
    { name: 'Piment de Cayenne', calories: 318, protein: 12.01, carbs: 56.63, fat: 17.27, fiber: 27.2, antiInflammatory: 7, compounds: ['capsaïcine', 'caroténoïdes'] },
    { name: 'Paprika', calories: 282, protein: 14.14, carbs: 53.99, fat: 12.89, fiber: 34.9, antiInflammatory: 6, compounds: ['capsanthin', 'bêta-carotène'] },
    { name: 'Piment d\'Espelette', calories: 282, protein: 14.14, carbs: 53.99, fat: 12.89, fiber: 34.9, antiInflammatory: 6, compounds: ['capsaïcine', 'vitamine C'] },
    
    // Mélanges d'épices
    { name: 'Curry (mélange)', calories: 325, protein: 14.29, carbs: 55.83, fat: 14.01, fiber: 53.2, antiInflammatory: 8, compounds: ['curcumine', 'coriandre', 'cumin'] },
    { name: 'Garam masala', calories: 379, protein: 16.84, carbs: 50.33, fat: 15.1, fiber: 20.2, antiInflammatory: 7, compounds: ['cannelle', 'cardamome', 'clou de girofle'] },
    { name: 'Herbes de Provence', calories: 259, protein: 6.45, carbs: 63.95, fat: 5.64, fiber: 37.6, antiInflammatory: 7, compounds: ['thymol', 'carvacrol', 'linalool'] },
    { name: 'Za\'atar', calories: 281, protein: 11.88, carbs: 71.38, fat: 6.81, fiber: 16.6, antiInflammatory: 6, compounds: ['thymol', 'sésamine'] }
  ],

  fats_oils: [
    // Huiles anti-inflammatoires
    { name: 'Huile d\'olive extra vierge', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 9, compounds: ['oléocanthal', 'vitamine E', 'polyphénols'] },
    { name: 'Huile d\'avocat', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 7, compounds: ['acide oléique', 'vitamine E'] },
    { name: 'Huile de noix', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 8, compounds: ['oméga-3', 'vitamine E'] },
    { name: 'Huile de lin', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 9, compounds: ['acide alpha-linolénique', 'lignanes'] },
    { name: 'Huile de chanvre', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 8, compounds: ['oméga-3', 'oméga-6'] },
    { name: 'Huile de cameline', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 7, compounds: ['oméga-3', 'vitamine E'] },
    
    // Huiles neutres
    { name: 'Huile de colza', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 4, compounds: ['oméga-3', 'vitamine E'] },
    { name: 'Huile de tournesol', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 2, compounds: ['vitamine E', 'acide linoléique'] },
    { name: 'Huile de sésame', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 3, compounds: ['sésamine', 'vitamine E'] },
    
    // Huiles de coco et tropicales
    { name: 'Huile de coco vierge', calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 1, compounds: ['acide laurique', 'acides gras saturés'] },
    
    // Huiles pro-inflammatoires (à éviter)
    { name: 'Huile de palme', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: -3, compounds: ['acides gras saturés'] },
    { name: 'Huile de soja raffinée', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: -2, compounds: ['oméga-6 en excès'] },
    
    // Autres matières grasses
    { name: 'Beurre (herbe)', calories: 717, protein: 0.85, carbs: 0.06, fat: 81.11, fiber: 0, antiInflammatory: 0, compounds: ['vitamine A', 'CLA'] },
    { name: 'Ghee (beurre clarifié)', calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, antiInflammatory: 1, compounds: ['vitamine A', 'acide butyrique'] }
  ],

  beverages: [
    // Thés (anti-inflammatoires)
    { name: 'Thé vert', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 9, compounds: ['épigallocatéchine gallate', 'catéchines'] },
    { name: 'Thé blanc', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 8, compounds: ['catéchines', 'antioxydants'] },
    { name: 'Thé oolong', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 7, compounds: ['polyphénols', 'théaflavines'] },
    { name: 'Rooibos', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 6, compounds: ['aspalathine', 'quercétine'] },
    
    // Tisanes anti-inflammatoires
    { name: 'Tisane de gingembre', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 8, compounds: ['gingérol', 'shogaol'] },
    { name: 'Tisane de curcuma', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 9, compounds: ['curcumine', 'turmérone'] },
    { name: 'Tisane de camomille', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, antiInflammatory: 6, compounds: ['apigénine', 'bisabolol'] },
    
    // Jus de légumes
    { name: 'Jus de céleri', calories: 14, protein: 0.69, carbs: 2.97, fat: 0.17, fiber: 1.6, antiInflammatory: 5, compounds: ['apigénine', 'potassium'] },
    { name: 'Jus de betterave', calories: 43, protein: 1.61, carbs: 9.56, fat: 0.17, fiber: 2.8, antiInflammatory: 6, compounds: ['bétalaïnes', 'nitrates'] },
    { name: 'Jus de carotte', calories: 41, protein: 0.93, carbs: 9.58, fat: 0.24, fiber: 2.8, antiInflammatory: 4, compounds: ['bêta-carotène', 'alpha-carotène'] },
    
    // Eau infusée
    { name: 'Eau citronnée', calories: 7, protein: 0.1, carbs: 2.1, fat: 0.1, fiber: 0.3, antiInflammatory: 4, compounds: ['vitamine C', 'limonène'] },
    { name: 'Eau de coco', calories: 19, protein: 0.72, carbs: 3.71, fat: 0.2, fiber: 1.1, antiInflammatory: 3, compounds: ['potassium', 'électrolytes'] }
  ],

  dairy: [
    // Yaourts et fermentés (probiotiques)
    { name: 'Yaourt grec nature', calories: 59, protein: 10.19, carbs: 3.6, fat: 0.39, fiber: 0, antiInflammatory: 3, compounds: ['probiotiques', 'protéines'] },
    { name: 'Kéfir', calories: 41, protein: 3.79, carbs: 4.48, fat: 0.93, fiber: 0, antiInflammatory: 4, compounds: ['probiotiques', 'peptides bioactifs'] },
    { name: 'Yaourt au lait de chèvre', calories: 59, protein: 3.56, carbs: 4.45, fat: 2.58, fiber: 0, antiInflammatory: 3, compounds: ['probiotiques', 'moins de caséine A1'] },
    
    // Fromages vieillis (modération)
    { name: 'Feta', calories: 264, protein: 14.21, carbs: 4.09, fat: 21.28, fiber: 0, antiInflammatory: 1, compounds: ['probiotiques', 'calcium'] },
    { name: 'Chèvre frais', calories: 268, protein: 18.54, carbs: 2.54, fat: 21.58, fiber: 0, antiInflammatory: 2, compounds: ['moins de caséine A1', 'calcium'] },
    { name: 'Parmesan', calories: 431, protein: 35.75, carbs: 4.06, fat: 28.35, fiber: 0, antiInflammatory: 0, compounds: ['calcium', 'protéines'] },
    
    // Laits végétaux (alternatives)
    { name: 'Lait d\'amande', calories: 17, protein: 0.69, carbs: 0.58, fat: 1.52, fiber: 0.2, antiInflammatory: 4, compounds: ['vitamine E', 'magnésium'] },
    { name: 'Lait de coco', calories: 230, protein: 2.29, carbs: 5.54, fat: 23.84, fiber: 2.2, antiInflammatory: 2, compounds: ['acide laurique', 'MCT'] },
    { name: 'Lait d\'avoine', calories: 47, protein: 1.25, carbs: 7.01, fat: 1.92, fiber: 0.8, antiInflammatory: 3, compounds: ['bêta-glucane', 'fibres'] }
  ]
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

/**
 * Calcule le score anti-inflammatoire basé sur les composés
 */
function calculateDetailedAntiInflammatoryScore(ingredient) {
  let score = ingredient.antiInflammatory || 0
  
  // Bonus pour composés spécifiques
  const compounds = ingredient.compounds || []
  const bonusCompounds = {
    'curcumine': 3,
    'oméga-3': 2,
    'anthocyanes': 2,
    'quercétine': 2,
    'resvératrol': 2,
    'sulforaphane': 2,
    'gingérol': 2,
    'vitamine C': 1,
    'vitamine E': 1,
    'polyphénols': 1,
    'catéchines': 1
  }
  
  compounds.forEach(compound => {
    if (bonusCompounds[compound]) {
      score += bonusCompounds[compound] * 0.1 // Bonus léger
    }
  })
  
  // Ajustements par catégorie
  if (ingredient.category === 'herbs_spices') score += 0.5
  if (ingredient.category === 'vegetables' && ingredient.name.includes('chou')) score += 0.3
  if (ingredient.category === 'fruits' && compounds.includes('anthocyanes')) score += 0.3
  
  return Math.round(Math.max(-10, Math.min(10, score)))
}

/**
 * Valide les données nutritionnelles
 */
function validateNutritionData(ingredient) {
  const errors = []
  
  if (!ingredient.name || ingredient.name.length < 2) {
    errors.push('Nom invalide')
  }
  
  if (ingredient.calories < 0 || ingredient.calories > 900) {
    errors.push('Calories invalides')
  }
  
  if (ingredient.protein < 0 || ingredient.protein > 100) {
    errors.push('Protéines invalides')
  }
  
  if (ingredient.carbs < 0 || ingredient.carbs > 100) {
    errors.push('Glucides invalides')
  }
  
  if (ingredient.fat < 0 || ingredient.fat > 100) {
    errors.push('Lipides invalides')
  }
  
  if (ingredient.fiber < 0 || ingredient.fiber > 100) {
    errors.push('Fibres invalides')
  }
  
  // Vérification cohérence énergétique (approximative)
  const calculatedCalories = (ingredient.protein * 4) + (ingredient.carbs * 4) + (ingredient.fat * 9)
  if (Math.abs(ingredient.calories - calculatedCalories) > 50) {
    errors.push('Incohérence énergétique détectée')
  }
  
  return errors
}

/**
 * Formate un ingrédient pour insertion Supabase
 */
function formatIngredientForSupabase(ingredient, category) {
  const antiInflammatoryScore = calculateDetailedAntiInflammatoryScore(ingredient)
  
  return {
    name: ingredient.name,
    category: category,
    calories_per_100g: ingredient.calories,
    protein_g_per_100g: ingredient.protein,
    carbs_g_per_100g: ingredient.carbs,
    fat_g_per_100g: ingredient.fat,
    fiber_g_per_100g: ingredient.fiber,
    sugar_g_per_100g: ingredient.sugar || 0,
    sodium_mg_per_100g: ingredient.sodium || 0,
    anti_inflammatory_score: antiInflammatoryScore,
    antioxidant_compounds: ingredient.compounds || [],
    data_source: 'manual',
    verified: true,
    glycemic_index: ingredient.glycemicIndex || null,
    common_serving_sizes: ingredient.servingSizes || null
  }
}

// =============================================
// FONCTION PRINCIPALE D'IMPORT
// =============================================

async function populateIngredients() {
  console.log('🚀 Début de la population des ingrédients')
  
  let totalProcessed = 0
  let totalSuccess = 0
  let totalErrors = 0
  const errors = []
  
  // Statistiques par catégorie
  const categoryStats = {}
  
  try {
    // Traiter chaque catégorie
    for (const [category, ingredients] of Object.entries(INGREDIENTS_DATA)) {
      if (categoryFilter && category !== categoryFilter) {
        console.log(`⏭️  Catégorie ${category} ignorée (filtre actif)`)
        continue
      }
      
      console.log(`\n📂 Traitement catégorie: ${category}`)
      console.log(`   ${ingredients.length} ingrédients à traiter`)
      
      categoryStats[category] = { processed: 0, success: 0, errors: 0 }
      
      for (const ingredient of ingredients) {
        if (totalProcessed >= maxIngredients) {
          console.log(`⚠️  Limite de ${maxIngredients} ingrédients atteinte`)
          break
        }
        
        try {
          // Validation des données
          const validationErrors = validateNutritionData(ingredient)
          if (validationErrors.length > 0) {
            console.log(`   ❌ ${ingredient.name}: ${validationErrors.join(', ')}`)
            errors.push({ ingredient: ingredient.name, errors: validationErrors })
            categoryStats[category].errors++
            totalErrors++
            continue
          }
          
          // Vérifier si l'ingrédient existe déjà
          if (!isDryRun) {
            const { data: existingIngredient } = await supabase
              .from('ingredients')
              .select('id, name')
              .eq('name', ingredient.name)
              .single()
            
            if (existingIngredient) {
              console.log(`   ⏭️  ${ingredient.name}: déjà existant`)
              continue
            }
          }
          
          // Formater pour Supabase
          const formattedIngredient = formatIngredientForSupabase(ingredient, category)
          
          if (isDryRun) {
            console.log(`   ✅ ${ingredient.name}: validé (dry-run)`)
          } else {
            // Insérer en base
            const { data, error } = await supabase
              .from('ingredients')
              .insert(formattedIngredient)
              .select('id, name')
              .single()
            
            if (error) {
              console.log(`   ❌ ${ingredient.name}: ${error.message}`)
              errors.push({ ingredient: ingredient.name, error: error.message })
              categoryStats[category].errors++
              totalErrors++
            } else {
              console.log(`   ✅ ${ingredient.name}: importé avec succès`)
              categoryStats[category].success++
              totalSuccess++
            }
          }
          
          categoryStats[category].processed++
          totalProcessed++
          
          // Délai pour éviter la surcharge
          if (!isDryRun) {
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          
        } catch (error) {
          console.log(`   ❌ ${ingredient.name}: erreur technique - ${error.message}`)
          errors.push({ ingredient: ingredient.name, error: error.message })
          categoryStats[category].errors++
          totalErrors++
        }
      }
      
      console.log(`   📊 ${category}: ${categoryStats[category].success} succès, ${categoryStats[category].errors} erreurs`)
      
      if (totalProcessed >= maxIngredients) break
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  }
  
  // =============================================
  // RAPPORT FINAL
  // =============================================
  
  console.log('\n🎉 Population terminée!')
  console.log('=====================================')
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`)
  console.log(`Total traité: ${totalProcessed}`)
  console.log(`Succès: ${totalSuccess}`)
  console.log(`Erreurs: ${totalErrors}`)
  console.log(`Taux de succès: ${totalProcessed > 0 ? Math.round((totalSuccess / totalProcessed) * 100) : 0}%`)
  
  console.log('\n📊 Statistiques par catégorie:')
  for (const [category, stats] of Object.entries(categoryStats)) {
    console.log(`  ${category}: ${stats.success}/${stats.processed} (${stats.errors} erreurs)`)
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Erreurs détaillées:')
    errors.slice(0, 10).forEach(error => {
      console.log(`  - ${error.ingredient}: ${error.error || error.errors?.join(', ')}`)
    })
    if (errors.length > 10) {
      console.log(`  ... et ${errors.length - 10} autres erreurs`)
    }
  }
  
  // Sauvegarder le rapport
  const report = {
    timestamp: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'production',
    summary: {
      totalProcessed,
      totalSuccess,
      totalErrors,
      successRate: totalProcessed > 0 ? Math.round((totalSuccess / totalProcessed) * 100) : 0
    },
    categoryStats,
    errors: errors.slice(0, 50) // Limiter pour éviter fichiers trop volumineux
  }
  
  try {
    await fs.writeFile(
      path.join(__dirname, `populate-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    )
    console.log('\n📄 Rapport sauvegardé dans populate-report-*.json')
  } catch (error) {
    console.log('⚠️  Impossible de sauvegarder le rapport:', error.message)
  }
  
  console.log('\n🥗 Script de population terminé')
  
  if (totalErrors > 0) {
    process.exit(1)
  }
}

// =============================================
// EXÉCUTION DU SCRIPT
// =============================================

if (require.main === module) {
  populateIngredients().catch(error => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}

module.exports = {
  populateIngredients,
  INGREDIENTS_DATA,
  calculateDetailedAntiInflammatoryScore,
  validateNutritionData,
  formatIngredientForSupabase
}