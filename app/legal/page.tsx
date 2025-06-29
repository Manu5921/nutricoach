'use client'

import { Suspense } from 'react'
import Link from 'next/link'

function LegalNoticeContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Mentions Légales
          </h1>
          <p className="text-lg text-gray-600">
            NutriCoach - Informations légales et réglementaires
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-10">
          {/* Éditeur du site */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Éditeur du site</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Raison sociale</h3>
                  <p className="text-green-700">NutriCoach SAS</p>
                  
                  <h3 className="font-semibold text-green-800 mb-2 mt-4">Statut juridique</h3>
                  <p className="text-green-700">Société par Actions Simplifiée (SAS)</p>
                  
                  <h3 className="font-semibold text-green-800 mb-2 mt-4">Capital social</h3>
                  <p className="text-green-700">[À compléter selon votre situation]</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Siège social</h3>
                  <p className="text-green-700">
                    [Adresse complète du siège social]<br />
                    [Code postal] [Ville]<br />
                    France
                  </p>
                  
                  <h3 className="font-semibold text-green-800 mb-2 mt-4">Identifiants</h3>
                  <p className="text-green-700">
                    <strong>SIRET :</strong> [À compléter]<br />
                    <strong>RCS :</strong> [À compléter]<br />
                    <strong>N° TVA :</strong> [À compléter]
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Contact</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📧 Contact général</h3>
                <p className="text-gray-700 text-sm">
                  <strong>Email :</strong> contact@nutricoach.app<br />
                  <strong>Support :</strong> support@nutricoach.app<br />
                  <strong>Réponse :</strong> Sous 48h ouvrées
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚖️ Contact juridique</h3>
                <p className="text-gray-700 text-sm">
                  <strong>Juridique :</strong> legal@nutricoach.app<br />
                  <strong>DPO :</strong> dpo@nutricoach.app<br />
                  <strong>Réponse :</strong> Sous 72h maximum
                </p>
              </div>
            </div>
          </section>

          {/* Directeur de publication */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Directeur de publication</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Nom :</strong> [Nom du représentant légal]<br />
                <strong>Qualité :</strong> Président de NutriCoach SAS<br />
                <strong>Contact :</strong> direction@nutricoach.app
              </p>
            </div>
          </section>

          {/* Hébergement */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Hébergement</h2>
            
            <div className="space-y-4">
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-purple-800 mb-2">🚂 Railway</h3>
                <p className="text-purple-700 text-sm">
                  <strong>Société :</strong> Railway Corp.<br />
                  <strong>Adresse :</strong> 548 Market St PMB 62933, San Francisco, CA 94104, États-Unis<br />
                  <strong>Site web :</strong> <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="underline">railway.app</a><br />
                  <strong>Rôle :</strong> Hébergement de l'application web
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🗄️ Supabase</h3>
                <p className="text-gray-700 text-sm">
                  <strong>Société :</strong> Supabase Inc.<br />
                  <strong>Adresse :</strong> 970 Toa Payoh North #07-04, Singapore 318992<br />
                  <strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a><br />
                  <strong>Rôle :</strong> Base de données et authentification<br />
                  <strong>Localisation données :</strong> Europe (Allemagne/Irlande)
                </p>
              </div>

              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-2">💳 Stripe</h3>
                <p className="text-blue-700 text-sm">
                  <strong>Société :</strong> Stripe, Inc.<br />
                  <strong>Adresse :</strong> 510 Townsend Street, San Francisco, CA 94103, États-Unis<br />
                  <strong>Site web :</strong> <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a><br />
                  <strong>Rôle :</strong> Traitement des paiements sécurisés<br />
                  <strong>Certification :</strong> PCI DSS niveau 1
                </p>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Propriété intellectuelle</h2>
            
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">© Éléments protégés</h3>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>• Marque "NutriCoach" et logos associés</li>
                  <li>• Base de données des recettes et compositions nutritionnelles</li>
                  <li>• Algorithmes d'intelligence artificielle</li>
                  <li>• Interface utilisateur et design</li>
                  <li>• Contenus éditoriaux et conseils nutritionnels</li>
                  <li>• Code source de l'application</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚖️ Droits d'usage</h3>
                <p className="text-gray-700 text-sm">
                  L'ensemble des éléments du site NutriCoach est protégé par le droit d'auteur, 
                  le droit des marques et/ou le droit des bases de données. Toute reproduction, 
                  représentation, modification, publication, adaptation, même partielle, est 
                  strictement interdite sans autorisation écrite préalable.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">🚫 Utilisations interdites</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Extraction ou réutilisation de la base de données</li>
                  <li>• Reverse engineering des algorithmes</li>
                  <li>• Création de services concurrents</li>
                  <li>• Usage commercial sans licence</li>
                  <li>• Reproduction des contenus pédagogiques</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Réglementation applicable */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Réglementation applicable</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-2">🇫🇷 Droit français</h3>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Code de la consommation</li>
                  <li>• Loi pour la confiance dans l'économie numérique (LCEN)</li>
                  <li>• Code de la santé publique</li>
                  <li>• Loi Informatique et Libertés</li>
                </ul>
              </div>

              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-2">🇪🇺 Droit européen</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Règlement Général sur la Protection des Données (RGPD)</li>
                  <li>• Directive e-Commerce</li>
                  <li>• Directive Services</li>
                  <li>• Règlement sur les denrées alimentaires</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Limitation de responsabilité</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Avertissements importants</h3>
              <div className="text-yellow-700 text-sm space-y-2">
                <p>
                  <strong>Service d'information nutritionnelle :</strong> NutriCoach fournit des 
                  informations à caractère général sur la nutrition anti-inflammatoire. Ces informations 
                  ne constituent pas des conseils médicaux personnalisés.
                </p>
                <p>
                  <strong>Consultation médicale :</strong> En cas de pathologie, d'allergie grave ou 
                  de traitement médical, consultez impérativement un professionnel de santé avant 
                  de modifier votre alimentation.
                </p>
                <p>
                  <strong>Limitation de responsabilité :</strong> NutriCoach ne peut être tenu responsable 
                  des conséquences de l'utilisation des informations fournies sur la plateforme.
                </p>
              </div>
            </div>
          </section>

          {/* Médiateur de la consommation */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Médiation de la consommation</h2>
            
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <p className="text-purple-800 text-sm mb-3">
                Conformément à l'article L.616-1 du Code de la consommation, nous proposons 
                un dispositif de médiation de la consommation.
              </p>
              
              <div className="text-purple-700 text-sm">
                <p><strong>Médiateur :</strong> [Nom du médiateur agréé]</p>
                <p><strong>Site web :</strong> [URL du médiateur]</p>
                <p><strong>Contact :</strong> [Contact du médiateur]</p>
                <p className="mt-2">
                  <em>Le recours à la médiation est gratuit et peut être exercé avant toute action judiciaire.</em>
                </p>
              </div>
            </div>
          </section>

          {/* Juridictions compétentes */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Juridictions compétentes</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">👤 Pour les consommateurs</h3>
                <p className="text-gray-700 text-sm">
                  En cas de litige, les tribunaux français sont compétents. Le consommateur peut 
                  saisir au choix le tribunal de son domicile ou celui du siège social de NutriCoach.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🏢 Pour les professionnels</h3>
                <p className="text-gray-700 text-sm">
                  Tout litige sera soumis aux tribunaux compétents du ressort du siège social 
                  de NutriCoach, sauf dispositions d'ordre public contraires.
                </p>
              </div>
            </div>
          </section>

          {/* Informations complémentaires */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">10. Informations complémentaires</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Données et statistiques</h3>
                <p className="text-gray-700 text-sm">
                  Les informations nutritionnelles sont basées sur des données scientifiques 
                  reconnues et des bases de données alimentaires officielles (CIQUAL, USDA).
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🔒 Sécurité des données</h3>
                <p className="text-gray-700 text-sm">
                  Toutes les mesures techniques et organisationnelles appropriées sont mises 
                  en œuvre pour protéger vos données personnelles et de santé.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🌱 Engagement qualité</h3>
                <p className="text-gray-700 text-sm">
                  NutriCoach s'engage à fournir un service de qualité et à améliorer 
                  continuellement sa plateforme selon les retours utilisateurs.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📞 Support utilisateur</h3>
                <p className="text-gray-700 text-sm">
                  Notre équipe support est disponible pour répondre à vos questions 
                  techniques et vous accompagner dans l'utilisation de la plateforme.
                </p>
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
            <Link href="/terms" className="text-blue-600 hover:underline">
              Conditions générales
            </Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">
              Politique cookies
            </Link>
            <Link href="/dashboard" className="text-green-600 hover:underline font-semibold">
              Retour au Dashboard
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            NutriCoach - Service français de nutrition personnalisée conforme aux réglementations en vigueur
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LegalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des mentions légales...</p>
        </div>
      </div>
    }>
      <LegalNoticeContent />
    </Suspense>
  )
}