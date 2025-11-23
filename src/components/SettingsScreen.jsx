import { useState, useEffect } from 'react'
import { saveAgentsFromCSV, getAgentCount } from '../utils/agentDB'
import { getScanSettings, saveScanSettings, resetScanSettings } from '../utils/scanSettings'
import './SettingsScreen.css'

function SettingsScreen() {
  const [agentCount, setAgentCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [fileName, setFileName] = useState('')
  const [scanSettings, setScanSettings] = useState(getScanSettings())
  const [scanSettingsMessage, setScanSettingsMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadAgentCount()
    // Charger les paramètres de scan
    setScanSettings(getScanSettings())
  }, [])

  const loadAgentCount = async () => {
    const count = await getAgentCount()
    setAgentCount(count)
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier que c'est un fichier CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier CSV' })
      return
    }

    setFileName(file.name)
    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const text = await file.text()
      const result = await saveAgentsFromCSV(text)
      setMessage({
        type: 'success',
        text: `${result.count} agent(s) importé(s) avec succès. L'ancienne liste a été remplacée.`
      })
      await loadAgentCount()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Erreur lors de l\'import du CSV'
      })
    } finally {
      setUploading(false)
      // Réinitialiser l'input pour permettre de ré-uploader le même fichier
      event.target.value = ''
    }
  }

  const handleScanSettingChange = (key, value) => {
    const newSettings = { ...scanSettings, [key]: value }
    setScanSettings(newSettings)
    saveScanSettings(newSettings)
    setScanSettingsMessage({ type: 'success', text: 'Paramètres sauvegardés' })
    setTimeout(() => setScanSettingsMessage({ type: '', text: '' }), 2000)
  }

  const handleResetScanSettings = () => {
    const defaultSettings = resetScanSettings()
    setScanSettings(defaultSettings)
    setScanSettingsMessage({ type: 'success', text: 'Paramètres réinitialisés aux valeurs par défaut' })
    setTimeout(() => setScanSettingsMessage({ type: '', text: '' }), 2000)
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <h2>Paramètres</h2>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>Gestion des agents</h3>
          <p className="settings-description">
            Importez un fichier CSV contenant les agents avec les colonnes "service" et "nom".
            L'import remplacera complètement la liste existante.
          </p>

          <div className="agent-info">
            <div className="info-item">
              <span className="info-label">Agents enregistrés :</span>
              <span className="info-value">{agentCount}</span>
            </div>
          </div>

          <div className="upload-section">
            <label htmlFor="csv-upload" className="upload-label">
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <div className="upload-button">
                {uploading ? (
                  <>
                    <span className="upload-spinner">⏳</span>
                    <span>Import en cours...</span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">📁</span>
                    <span>{fileName || 'Choisir un fichier CSV'}</span>
                  </>
                )}
              </div>
            </label>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.type === 'success' ? '✓' : '✗'} {message.text}
              </div>
            )}
          </div>

          <div className="csv-format-info">
            <h4>Format du CSV attendu :</h4>
            <div className="csv-example">
              <code>
                service,nom<br />
                IT,Jean Dupont<br />
                RH,Marie Martin<br />
                Comptabilité,Pierre Durand
              </code>
            </div>
            <p className="csv-note">
              Le séparateur peut être une virgule (,) ou un point-virgule (;).
              La première ligne doit contenir les en-têtes "service" et "nom".
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Paramètres de scan</h3>
          <p className="settings-description">
            Ajustez les paramètres de détection des codes-barres pour améliorer les performances selon votre environnement.
          </p>

          {scanSettingsMessage.text && (
            <div className={`message ${scanSettingsMessage.type}`}>
              {scanSettingsMessage.type === 'success' ? '✓' : '✗'} {scanSettingsMessage.text}
            </div>
          )}

          <div className="scan-settings-grid">

            <div className="setting-item">
              <label className="setting-label checkbox-label">
                <span>Forcer le moteur ZBar (Debug)</span>
                <input
                  type="checkbox"
                  checked={scanSettings.forceZBar || false}
                  onChange={(e) => handleScanSettingChange('forceZBar', e.target.checked)}
                  className="setting-checkbox"
                />
              </label>
              <p className="setting-hint">
                Activez ceci pour utiliser le moteur ZBar (WebAssembly) même si le détecteur natif Android est disponible.
                Utile pour tester le comportement iOS sur Android.
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label checkbox-label">
                <span>Afficher les zones de détection</span>
                <input
                  type="checkbox"
                  checked={scanSettings.showBoundingBox !== false}
                  onChange={(e) => handleScanSettingChange('showBoundingBox', e.target.checked)}
                  className="setting-checkbox"
                />
              </label>
              <p className="setting-hint">
                Affiche un cadre coloré autour des codes-barres détectés (Vert = Natif, Rouge = ZBar).
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label checkbox-label">
                <span>Double validation</span>
                <input
                  type="checkbox"
                  checked={scanSettings.doubleValidation !== false}
                  onChange={(e) => handleScanSettingChange('doubleValidation', e.target.checked)}
                  className="setting-checkbox"
                />
              </label>
              <p className="setting-hint">
                Si activé, le scanner doit détecter le même code 2 fois de suite pour le valider.
                Désactivez pour une validation instantanée (plus rapide mais risque d'erreurs).
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span>Délai entre scans (ms)</span>
                <span className="setting-value">{scanSettings.scanDelay}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={scanSettings.scanDelay}
                onChange={(e) => handleScanSettingChange('scanDelay', parseInt(e.target.value))}
                className="setting-slider"
              />
              <div className="setting-range">
                <span>100ms</span>
                <span>1000ms</span>
              </div>
              <p className="setting-hint">Augmentez ce délai si vous scannez accidentellement le même code plusieurs fois.</p>
            </div>

          </div>

          <div className="settings-actions">
            <button onClick={handleResetScanSettings} className="reset-settings-btn">
              Réinitialiser aux valeurs par défaut
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsScreen

