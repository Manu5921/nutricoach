'use client'

import { Suspense } from 'react'
import Link from 'next/link'

function TermsOfServiceContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-lg text-gray-600">
            NutriCoach - Service de nutrition personnalisée par IA
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <p className="text-sm text-gray-600 mb-2">Navigation rapide :</p>
          <div className="flex flex-wrap gap-2">
            <a href="#definitions" className="text-blue-600 hover:underline text-sm">#Définitions</a>
            <a href="#service" className="text-blue-600 hover:underline text-sm">#Service</a>
            <a href="#tarification" className="text-blue-600 hover:underline text-sm">#Tarification</a>
            <a href="#resiliation" className="text-blue-600 hover:underline text-sm">#Résiliation</a>
            <a href="#responsabilites" className="text-blue-600 hover:underline text-sm">#Responsabilités</a>
            <a href="#propriete" className="text-blue-600 hover:underline text-sm">#Propriété intellectuelle</a>
            <a href="#loi-applicable" className="text-blue-600 hover:underline text-sm">#Loi applicable</a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Introduction</h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation du service 
                NutriCoach, plateforme de nutrition anti-inflammatoire personnalisée par intelligence artificielle.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                <p className="text-blue-800 font-semibold">📋 Acceptation des conditions</p>
                <p className="text-blue-700 text-sm mt-1">
                  L'utilisation de NutriCoach implique l'acceptation pleine et entière des présentes CGU. 
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
                </p>
              </div>
            </div>
          </section>

          {/* Définitions */}
          <section id="definitions">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Définitions</h2>
            
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4">
                <p><strong>"Service" ou "NutriCoach" :</strong> Plateforme SaaS de nutrition personnalisée accessible via https://nutricoach.app</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p><strong>"Utilisateur" ou "Vous" :</strong> Toute personne physique utilisant le service NutriCoach</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p><strong>"Abonnement Premium" :</strong> Accès payant aux fonctionnalités complètes pour 6,99€/mois</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <p><strong>"IA Nutritionnelle" :</strong> Algorithmes d'intelligence artificielle générant des recommandations alimentaires personnalisées</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p><strong>"Données de Santé" :</strong> Informations relatives à votre état de santé, allergies, pathologies et objectifs nutritionnels</p>
              </div>
            </div>
          </section>

          {/* Description du service */}
          <section id="service">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Description du service</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.1 Service fourni</h3>
            <p className="mb-4">
              NutriCoach fournit un service de nutrition anti-inflammatoire personnalisée comprenant :
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">🍽️ Génération de menus</h4>
                <p className="text-gray-700 text-sm">
                  Menus personnalisés basés sur vos restrictions alimentaires, allergies et objectifs de santé
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">📚 Base de recettes</h4>
                <p className="text-gray-700 text-sm">
                  Plus de 500 recettes anti-inflammatoires validées par des nutritionnistes
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">🧠 IA adaptive</h4>
                <p className="text-gray-700 text-sm">
                  Apprentissage automatique de vos préférences pour des recommandations de plus en plus précises
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">📄 Export PDF</h4>
                <p className="text-gray-700 text-sm">
                  Listes de courses et plannings de repas exportables et imprimables
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.2 Limites du service</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">⚠️ Avertissement médical important</p>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• NutriCoach ne remplace pas un suivi médical professionnel</li>
                <li>• Les recommandations sont à titre informatif uniquement</li>
                <li>• Consultez un professionnel de santé avant tout changement alimentaire majeur</li>
                <li>• En cas de pathologie grave, l'avis médical reste prioritaire</li>
              </ul>
            </div>
          </section>

          {/* Tarification */}
          <section id="tarification">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Tarification et paiement</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Prix de l'abonnement</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-bold text-lg">Abonnement Premium NutriCoach</p>
                  <p className="text-green-700 text-sm">Accès complet à toutes les fonctionnalités</p>
                </div>
                <div className="text-right">
                  <p className="text-green-800 font-bold text-2xl">6,99€</p>
                  <p className="text-green-700 text-sm">par mois TTC</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Modalités de paiement</h3>
            <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">
              <li>Paiement mensuel par carte bancaire via Stripe (sécurisé)</li>
              <li>Prélèvement automatique le même jour chaque mois</li>
              <li>Prix TTC incluant la TVA française (20%)</li>
              <li>Aucun frais caché ou commission supplémentaire</li>
              <li>Facture disponible en téléchargement dans votre espace client</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.3 Défaut de paiement</h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm">
                <strong>En cas d'échec de paiement :</strong>
              </p>
              <ul className="text-orange-700 text-sm mt-2 space-y-1">
                <li>• Notification par email sous 24h</li>
                <li>• Suspension de l'accès après 7 jours</li>
                <li>• Résiliation automatique après 30 jours</li>
                <li>• Possibilité de régularisation à tout moment</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.4 Modification des prix</h3>
            <p className="text-gray-700 mb-2">
              Nous nous réservons le droit de modifier nos tarifs avec un préavis de 30 jours minimum.
            </p>
            <p className="text-gray-700">
              Les abonnements en cours continuent au tarif initial jusqu'à leur renouvellement.
            </p>
          </section>

          {/* Résiliation */}
          <section id="resiliation">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Résiliation et remboursement</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Résiliation par l'utilisateur</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold mb-2">✅ Résiliation libre et gratuite</p>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Résiliation possible à tout moment sans préavis</li>
                <li>• Aucun frais de résiliation</li>
                <li>• Accès maintenu jusqu'à la fin de la période payée</li>
                <li>• Résiliation directe depuis votre dashboard</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Politique de remboursement</h3>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">💰 Remboursement intégral (14 jours)</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Droit de rétractation de 14 jours calendaires à compter de la souscription 
                  (conformément au Code de la consommation français).
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🔄 Remboursement partiel</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Au-delà de 14 jours, remboursement au prorata de la période non utilisée 
                  en cas de dysfonctionnement majeur du service.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">❌ Pas de remboursement</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Aucun remboursement en cas de violation des présentes CGU ou d'utilisation frauduleuse.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 Résiliation par NutriCoach</h3>
            <p className="text-gray-700 mb-2">
              Nous pouvons résilier votre abonnement avec un préavis de 30 jours en cas de :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
              <li>Violation répétée des présentes CGU</li>
              <li>Utilisation frauduleuse ou abusive du service</li>
              <li>Cessation définitive du service (remboursement intégral)</li>
              <li>Défaut de paiement persistant après mise en demeure</li>
            </ul>
          </section>

          {/* Responsabilités */}
          <section id="responsabilites">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Responsabilités et limitations</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.1 Obligations de NutriCoach</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>✅ Nous nous engageons à :</strong> Fournir un service conforme à la description, 
                  assurer la sécurité de vos données, maintenir une disponibilité de 99% minimum.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.2 Obligations de l'utilisateur</h3>
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
              <li>Fournir des informations exactes et à jour</li>
              <li>Utiliser le service conformément à sa destination</li>
              <li>Ne pas tenter de contourner les mesures de sécurité</li>
              <li>Ne pas partager vos identifiants de connexion</li>
              <li>Signaler tout dysfonctionnement ou problème de sécurité</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.3 Limitations de responsabilité</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">⚠️ Important - Limites de notre responsabilité</p>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• NutriCoach est un outil d'aide à la décision, pas un dispositif médical</li>
                <li>• Nous ne garantissons pas de résultats de santé spécifiques</li>
                <li>• Notre responsabilité est limitée au montant de votre abonnement</li>
                <li>• Nous ne sommes pas responsables des décisions alimentaires prises</li>
                <li>• En cas de problème de santé, consultez un professionnel médical</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.4 Force majeure</h3>
            <p className="text-gray-700">
              NutriCoach ne peut être tenu responsable de l'inexécution de ses obligations en cas 
              de force majeure (événements imprévisibles, irrésistibles et extérieurs : catastrophes naturelles, 
              cyberattaques, pannes généralisées d'internet, etc.).
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section id="propriete">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Propriété intellectuelle</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.1 Propriété de NutriCoach</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-purple-800 font-semibold mb-2">© Droits réservés NutriCoach</p>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Base de données des recettes et leurs compositions nutritionnelles</li>
                <li>• Algorithmes d'intelligence artificielle et modèles prédictifs</li>
                <li>• Interface utilisateur, design et expérience utilisateur</li>
                <li>• Marque "NutriCoach" et éléments graphiques associés</li>
                <li>• Code source de l'application et API</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.2 Licence d'utilisation</h3>
            <p className="text-gray-700 mb-4">
              Votre abonnement vous octroie un droit d'usage personnel, non-exclusif et non-transférable 
              du service NutriCoach. Cette licence est révocable en cas de résiliation.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.3 Utilisation interdite</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">🚫 Strictement interdit</p>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Copier, reproduire ou redistribuer nos recettes à titre commercial</li>
                <li>• Extraire massivement la base de données (scraping)</li>
                <li>• Reverse engineering des algorithmes IA</li>
                <li>• Utiliser la marque NutriCoach sans autorisation écrite</li>
                <li>• Créer un service concurrent basé sur nos contenus</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.4 Vos contenus générés</h3>
            <p className="text-gray-700">
              Les menus et plannings générés spécifiquement pour vous restent votre propriété. 
              Vous pouvez les utiliser librement pour votre usage personnel et familial.
            </p>
          </section>

          {/* Protection des données */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Protection des données personnelles</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-semibold mb-2">🔒 Conformité RGPD stricte</p>
              <p className="text-blue-700 text-sm">
                La collecte et le traitement de vos données personnelles et de santé sont régis par notre 
                <Link href="/privacy" className="underline font-medium">Politique de Confidentialité</Link>, 
                conforme au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </div>
          </section>

          {/* Loi applicable */}
          <section id="loi-applicable">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Loi applicable et juridictions</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">9.1 Droit français</h3>
            <p className="text-gray-700 mb-4">
              Les présentes CGU sont soumises au droit français. En cas de contradiction entre une 
              version traduite et la version française, cette dernière fait foi.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">9.2 Résolution des litiges</h3>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🤝 Résolution amiable</h4>
                <p className="text-gray-700 text-sm mt-1">
                  En cas de différend, nous privilégions la résolution amiable. 
                  Contactez-nous à legal@nutricoach.app pour toute réclamation.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🏛️ Médiation de la consommation</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Pour les consommateurs : possibilité de recours gratuit à un médiateur de la consommation 
                  (coordonnées disponibles sur demande).
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">⚖️ Tribunaux compétents</h4>
                <p className="text-gray-700 text-sm mt-1">
                  En dernier recours, les tribunaux français sont seuls compétents. 
                  Pour les consommateurs : tribunal de leur domicile ou du siège de NutriCoach.
                </p>
              </div>
            </div>
          </section>

          {/* Évolution des CGU */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">10. Évolution des conditions</h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                Nous nous réservons le droit de modifier les présentes CGU à tout moment. 
                Les modifications importantes vous seront notifiées par email avec un préavis de 30 jours.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  <strong>Acceptation :</strong> La poursuite de l'utilisation du service après notification 
                  vaut acceptation des nouvelles conditions. En cas de refus, vous pouvez résilier votre abonnement.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">11. Contact</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📧 Service juridique NutriCoach</h4>
              <div className="text-gray-700 text-sm space-y-1">
                <p><strong>Email :</strong> legal@nutricoach.app</p>
                <p><strong>Support client :</strong> support@nutricoach.app</p>
                <p><strong>Adresse :</strong> [À compléter selon votre situation juridique]</p>
                <p><strong>Réponse :</strong> Sous 48 heures ouvrées maximum</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Politique de confidentialité
            </Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">
              Politique cookies
            </Link>
            <Link href="/legal" className="text-blue-600 hover:underline">
              Mentions légales
            </Link>
            <Link href="/pricing" className="text-green-600 hover:underline font-semibold">
              Voir les tarifs
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Ces conditions sont régies par le droit français et conformes au Code de la consommation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des conditions générales...</p>
        </div>
      </div>
    }>
      <TermsOfServiceContent />
    </Suspense>
  )
}