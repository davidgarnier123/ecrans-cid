import { useState, useEffect } from 'react'
import { saveAgentsFromCSV, getAgentCount } from '../utils/agentDB'
import './SettingsScreen.css'

function SettingsScreen() {
  const [agentCount, setAgentCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    loadAgentCount()
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
      </div>
    </div>
  )
}

export default SettingsScreen

