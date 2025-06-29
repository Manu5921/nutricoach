'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RGPDManager() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeletionForm, setShowDeletionForm] = useState(false)
  const [deletionConfirmation, setDeletionConfirmation] = useState('')
  const [deletionReason, setDeletionReason] = useState('')

  const handleExportData = async () => {
    setIsExporting(true)
    
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'export')
      }

      const data = await response.json()
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nutricoach-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('✅ Vos données ont été exportées avec succès!')
      
    } catch (error) {
      console.error('Export error:', error)
      alert('❌ Erreur lors de l\'export. Veuillez contacter le support.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deletionConfirmation !== 'SUPPRIMER DÉFINITIVEMENT') {
      alert('Veuillez taper exactement "SUPPRIMER DÉFINITIVEMENT" pour confirmer')
      return
    }

    const finalConfirm = window.confirm(
      '⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\n' +
      'Toutes vos données seront supprimées définitivement:\n' +
      '• Profil utilisateur et données de santé\n' +
      '• Menus générés et préférences\n' +
      '• Historique d\'utilisation\n\n' +
      'Êtes-vous ABSOLUMENT sûr(e) de vouloir continuer?'
    )

    if (!finalConfirm) return

    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText: deletionConfirmation,
          reason: deletionReason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      if (data.success) {
        alert('✅ Votre compte a été supprimé définitivement. Vous allez être déconnecté.')
        
        // Redirect to home and clear local storage
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/'
      } else {
        throw new Error(data.error || 'Suppression incomplète')
      }
      
    } catch (error) {
      console.error('Deletion error:', error)
      alert('❌ Erreur lors de la suppression. Contactez dpo@nutricoach.app')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">🔒</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mes droits RGPD</h2>
          <p className="text-sm text-gray-600">Gestion de vos données personnelles</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Data Export Section */}
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="text-xl">📊</div>
              <div>
                <h3 className="font-semibold text-blue-900">Export de mes données</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Téléchargez toutes vos données personnelles dans un format structuré (JSON).
                  Comprend votre profil, données de santé, menus générés et préférences.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 border border-blue-300 rounded p-3 mb-4">
            <p className="text-blue-800 text-xs">
              <strong>Article 20 RGPD - Droit à la portabilité:</strong> Vous avez le droit de recevoir 
              vos données dans un format structuré et lisible par machine.
            </p>
          </div>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Export en cours...
              </span>
            ) : (
              '📦 Exporter mes données (JSON)'
            )}
          </button>
        </div>

        {/* Account Deletion Section */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="text-xl">🗑️</div>
              <div>
                <h3 className="font-semibold text-red-900">Suppression de mon compte</h3>
                <p className="text-sm text-red-700 mt-1">
                  Supprimez définitivement votre compte et toutes vos données personnelles.
                  Cette action est irréversible.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
            <p className="text-red-800 text-xs mb-2">
              <strong>Article 17 RGPD - Droit à l'effacement:</strong> Vous avez le droit de demander 
              la suppression de vos données personnelles.
            </p>
            <div className="text-red-700 text-xs">
              <p><strong>Sera supprimé immédiatement:</strong></p>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li>Profil utilisateur et données de santé</li>
                <li>Menus générés et préférences alimentaires</li>
                <li>Historique d'utilisation</li>
              </ul>
              <p className="mt-2"><strong>Conservé légalement:</strong></p>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li>Données de facturation (10 ans - obligations comptables)</li>
              </ul>
            </div>
          </div>

          {!showDeletionForm ? (
            <button
              onClick={() => setShowDeletionForm(true)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              🚨 Supprimer mon compte définitivement
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Attention: Cette action est irréversible!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la suppression (optionnel):
                </label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Sélectionnez une raison...</option>
                  <option value="no_longer_needed">Je n'ai plus besoin du service</option>
                  <option value="privacy_concerns">Préoccupations de confidentialité</option>
                  <option value="switching_service">Je change de service</option>
                  <option value="technical_issues">Problèmes techniques récurrents</option>
                  <option value="other">Autre raison</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez exactement: <strong>SUPPRIMER DÉFINITIVEMENT</strong>
                </label>
                <input
                  type="text"
                  value={deletionConfirmation}
                  onChange={(e) => setDeletionConfirmation(e.target.value)}
                  placeholder="SUPPRIMER DÉFINITIVEMENT"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeletionForm(false)
                    setDeletionConfirmation('')
                    setDeletionReason('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deletionConfirmation !== 'SUPPRIMER DÉFINITIVEMENT'}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Suppression...
                    </span>
                  ) : (
                    'Confirmer la suppression'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Other GDPR Rights */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">🔧 Autres droits RGPD</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <h4 className="font-medium text-gray-900">✏️ Droit de rectification</h4>
                <p className="text-sm text-gray-600">Modifier vos données inexactes</p>
              </div>
              <Link 
                href="/profile"
                className="text-blue-600 hover:underline text-sm"
              >
                Modifier mon profil
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <h4 className="font-medium text-gray-900">🍪 Gestion des cookies</h4>
                <p className="text-sm text-gray-600">Modifier vos préférences cookies</p>
              </div>
              <Link 
                href="/cookies"
                className="text-blue-600 hover:underline text-sm"
              >
                Gérer les cookies
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <h4 className="font-medium text-gray-900">📧 Contact DPO</h4>
                <p className="text-sm text-gray-600">Questions sur vos données</p>
              </div>
              <a 
                href="mailto:dpo@nutricoach.app"
                className="text-blue-600 hover:underline text-sm"
              >
                dpo@nutricoach.app
              </a>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-xs">
            <strong>Notice légale:</strong> Conformément au RGPD, vous disposez d'un droit d'accès, 
            de rectification, d'effacement, de limitation, de portabilité et d'opposition concernant 
            vos données personnelles. Pour exercer ces droits ou en cas de question, contactez notre 
            DPO à dpo@nutricoach.app. Vous pouvez également introduire une réclamation auprès de la 
            CNIL (www.cnil.fr).
          </p>
        </div>
      </div>
    </div>
  )
}