'use client'

import { Suspense } from 'react'
import Link from 'next/link'

function PrivacyPolicyContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Politique de Confidentialité
          </h1>
          <p className="text-lg text-gray-600">
            NutriCoach - Protection de vos données personnelles et de santé
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <p className="text-sm text-gray-600 mb-2">Navigation rapide :</p>
          <div className="flex flex-wrap gap-2">
            <a href="#collecte" className="text-blue-600 hover:underline text-sm">#Collecte des données</a>
            <a href="#finalites" className="text-blue-600 hover:underline text-sm">#Finalités</a>
            <a href="#base-legale" className="text-blue-600 hover:underline text-sm">#Base légale</a>
            <a href="#conservation" className="text-blue-600 hover:underline text-sm">#Conservation</a>
            <a href="#droits" className="text-blue-600 hover:underline text-sm">#Vos droits</a>
            <a href="#transferts" className="text-blue-600 hover:underline text-sm">#Transferts</a>
            <a href="#contact" className="text-blue-600 hover:underline text-sm">#Contact</a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Introduction</h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                NutriCoach (ci-après "nous", "notre service") s'engage à protéger et respecter votre vie privée. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et 
                protégeons vos informations personnelles et données de santé.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                <p className="text-red-800 font-semibold">⚠️ Données de santé - Catégorie spéciale</p>
                <p className="text-red-700 text-sm mt-1">
                  NutriCoach traite des données de santé considérées comme des données sensibles selon le RGPD. 
                  Un consentement explicite est requis pour leur traitement.
                </p>
              </div>
            </div>
          </section>

          {/* Collecte des données */}
          <section id="collecte">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Données collectées</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.1 Données d'identification</h3>
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
              <li>Adresse e-mail (obligatoire pour la création de compte)</li>
              <li>Nom et prénom (optionnel)</li>
              <li>Date de naissance (pour calculs nutritionnels)</li>
              <li>Identifiant unique généré automatiquement</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.2 Données de santé et nutrition</h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-orange-800 font-medium">🏥 Catégorie spéciale de données (Article 9 RGPD)</p>
            </div>
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
              <li>Poids, taille, indice de masse corporelle</li>
              <li>Allergies alimentaires et intolérances</li>
              <li>Pathologies inflammatoires déclarées</li>
              <li>Restrictions alimentaires et préférences</li>
              <li>Objectifs nutritionnels et de santé</li>
              <li>Historique des menus générés et préférences</li>
              <li>Données de suivi alimentaire et bien-être</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.3 Données techniques</h3>
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
              <li>Adresse IP et données de connexion</li>
              <li>Informations sur votre navigateur et appareil</li>
              <li>Cookies et technologies similaires</li>
              <li>Logs de sécurité et d'utilisation</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.4 Données de facturation</h3>
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
              <li>Informations de paiement (traitées par Stripe)</li>
              <li>Historique des abonnements et factures</li>
              <li>Statut d'abonnement (actif, suspendu, annulé)</li>
            </ul>
          </section>

          {/* Finalités */}
          <section id="finalites">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Finalités du traitement</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🍽️ Personnalisation nutritionnelle</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Génération de menus et recettes adaptés à vos besoins de santé, restrictions et préférences alimentaires.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🧠 Intelligence artificielle adaptive</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Amélioration continue des recommandations basée sur vos retours et évolution de vos préférences.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">💳 Gestion des abonnements</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Traitement des paiements, facturation, gestion des comptes et support client.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🔒 Sécurité et prévention de la fraude</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Protection des comptes utilisateurs, détection d'activités suspectes et conformité légale.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">📊 Amélioration du service</h4>
                <p className="text-gray-700 text-sm mt-1">
                  Analyses statistiques anonymisées pour améliorer nos algorithmes et fonctionnalités.
                </p>
              </div>
            </div>
          </section>

          {/* Base légale */}
          <section id="base-legale">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Base légale du traitement</h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800">✅ Consentement explicite (Art. 6.1.a & 9.2.a RGPD)</h4>
                <p className="text-green-700 text-sm mt-1">
                  Pour le traitement de vos données de santé et la personnalisation nutritionnelle. 
                  Vous pouvez retirer votre consentement à tout moment.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800">📝 Exécution du contrat (Art. 6.1.b RGPD)</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Pour la fourniture du service NutriCoach, la gestion de votre compte et l'accès aux fonctionnalités premium.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800">⚖️ Intérêt légitime (Art. 6.1.f RGPD)</h4>
                <p className="text-purple-700 text-sm mt-1">
                  Pour la sécurité du service, la prévention de la fraude et l'amélioration de nos algorithmes.
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800">📋 Obligations légales (Art. 6.1.c RGPD)</h4>
                <p className="text-orange-700 text-sm mt-1">
                  Pour la conservation des données de facturation et le respect des obligations comptables.
                </p>
              </div>
            </div>
          </section>

          {/* Conservation */}
          <section id="conservation">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Durée de conservation</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-semibold">Type de données</th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">Durée de conservation</th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">Justification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Données de santé et profil nutritionnel</td>
                    <td className="border border-gray-300 p-3">Pendant la durée d'abonnement + 3 ans</td>
                    <td className="border border-gray-300 p-3">Réactivation possible du compte</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3">Données de facturation</td>
                    <td className="border border-gray-300 p-3">10 ans après la dernière transaction</td>
                    <td className="border border-gray-300 p-3">Obligations comptables et fiscales</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Logs de connexion et sécurité</td>
                    <td className="border border-gray-300 p-3">12 mois maximum</td>
                    <td className="border border-gray-300 p-3">Sécurité et prévention des intrusions</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3">Données techniques (cookies)</td>
                    <td className="border border-gray-300 p-3">13 mois maximum</td>
                    <td className="border border-gray-300 p-3">Recommandations CNIL</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Comptes supprimés</td>
                    <td className="border border-gray-300 p-3">Suppression immédiate</td>
                    <td className="border border-gray-300 p-3">Droit à l'effacement RGPD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Droits */}
          <section id="droits">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Vos droits RGPD</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                ℹ️ Vous disposez de droits étendus sur vos données personnelles. 
                Ces droits peuvent être exercés gratuitement et sans justification.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔍 Droit d'accès</h4>
                <p className="text-gray-700 text-sm">
                  Obtenir une copie de toutes vos données personnelles que nous détenons.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">✏️ Droit de rectification</h4>
                <p className="text-gray-700 text-sm">
                  Corriger ou mettre à jour vos informations personnelles inexactes.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🗑️ Droit à l'effacement</h4>
                <p className="text-gray-700 text-sm">
                  Demander la suppression définitive de toutes vos données.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⏸️ Droit à la limitation</h4>
                <p className="text-gray-700 text-sm">
                  Suspendre temporairement l'utilisation de vos données.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📦 Droit à la portabilité</h4>
                <p className="text-gray-700 text-sm">
                  Récupérer vos données dans un format structuré et lisible.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Droit d'opposition</h4>
                <p className="text-gray-700 text-sm">
                  Vous opposer au traitement de vos données pour des raisons légitimes.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🚀 Exercer vos droits facilement</h4>
              <p className="text-green-700 text-sm mb-3">
                Accédez directement à vos outils RGPD depuis votre tableau de bord :
              </p>
              <div className="space-y-2">
                <Link href="/dashboard?tab=privacy" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  📊 Exporter mes données
                </Link>
                <br />
                <Link href="/dashboard?tab=privacy" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  🗑️ Supprimer mon compte
                </Link>
              </div>
            </div>
          </section>

          {/* Transferts */}
          <section id="transferts">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Transferts internationaux</h2>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-orange-800 font-medium">
                ⚠️ Certains de nos prestataires sont situés hors de l'Union Européenne
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">💳 Stripe (Paiements) - États-Unis</h4>
                <p className="text-gray-700 text-sm mt-1">
                  <strong>Garanties :</strong> Clauses contractuelles types UE, certification PCI DSS niveau 1
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Données transférées :</strong> Informations de paiement et facturation uniquement
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🗄️ Supabase (Base de données) - Région UE</h4>
                <p className="text-gray-700 text-sm mt-1">
                  <strong>Localisation :</strong> Serveurs situés en Europe (Allemagne/Irlande)
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Données transférées :</strong> Toutes vos données personnelles et de santé
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">🚂 Railway (Hébergement) - États-Unis</h4>
                <p className="text-gray-700 text-sm mt-1">
                  <strong>Garanties :</strong> Clauses contractuelles types, chiffrement en transit et au repos
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Données transférées :</strong> Logs techniques et données de fonctionnement
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Vos droits :</strong> Vous pouvez vous opposer à ces transferts, mais cela peut limiter 
                certaines fonctionnalités du service (notamment les paiements).
              </p>
            </div>
          </section>

          {/* Sécurité */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Sécurité des données</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔐 Chiffrement</h4>
                <p className="text-gray-700 text-sm">
                  AES-256 au repos, TLS 1.3 en transit, chiffrement niveau bancaire
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔑 Authentification</h4>
                <p className="text-gray-700 text-sm">
                  Authentification sécurisée, sessions chiffrées, protection contre le brute force
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🏥 Conformité médicale</h4>
                <p className="text-gray-700 text-sm">
                  Standards de sécurité adaptés aux données de santé (niveau HIPAA)
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">👥 Accès restreint</h4>
                <p className="text-gray-700 text-sm">
                  Principe du moindre privilège, logs d'audit, accès sur besoin uniquement
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="contact">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Contact et réclamations</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📧 Délégué à la Protection des Données (DPO)</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Email :</strong> dpo@nutricoach.app<br />
                  <strong>Réponse :</strong> Sous 72 heures maximum<br />
                  <strong>Objet du mail :</strong> [RGPD] suivi de votre demande
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🏢 Responsable de traitement</h4>
                <p className="text-gray-700 text-sm">
                  NutriCoach SAS<br />
                  Email : legal@nutricoach.app<br />
                  Adresse : [À compléter selon votre situation juridique]
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚖️ Autorité de contrôle - CNIL</h4>
                <p className="text-yellow-700 text-sm">
                  Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire 
                  une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  <strong>Site web :</strong> <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline">www.cnil.fr</a><br />
                  <strong>Téléphone :</strong> 01 53 73 22 22
                </p>
              </div>
            </div>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">10. Modifications de cette politique</h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les modifications importantes vous seront notifiées par email et/ou via notre application.
              </p>
              <p className="mb-4">
                La version en vigueur est toujours disponible à l'adresse : 
                <Link href="/privacy" className="text-blue-600 hover:underline ml-1">
                  https://nutricoach.app/privacy
                </Link>
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  <strong>Historique des versions :</strong> Nous conservons un historique des versions 
                  précédentes disponible sur demande à dpo@nutricoach.app
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/terms" className="text-blue-600 hover:underline">
              Conditions générales
            </Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">
              Politique cookies
            </Link>
            <Link href="/legal" className="text-blue-600 hover:underline">
              Mentions légales
            </Link>
            <Link href="/dashboard" className="text-green-600 hover:underline font-semibold">
              Retour au Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la politique de confidentialité...</p>
        </div>
      </div>
    }>
      <PrivacyPolicyContent />
    </Suspense>
  )
}