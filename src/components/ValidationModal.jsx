import { useState, useEffect } from 'react'
import './ValidationModal.css'

const SERVICE_STORAGE_KEY = 'lastService'
const AGENT_STORAGE_KEY = 'lastAgent'

function ValidationModal({ onSave, onClose }) {
  const [agentName, setAgentName] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [comment, setComment] = useState('')

  // Charger le dernier service et agent utilisés depuis le localStorage
  useEffect(() => {
    const lastService = localStorage.getItem(SERVICE_STORAGE_KEY)
    if (lastService) {
      setSelectedService(lastService)
    }
    const lastAgent = localStorage.getItem(AGENT_STORAGE_KEY)
    if (lastAgent) {
      setAgentName(lastAgent)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (agentName.trim() && selectedService.trim()) {
      // Sauvegarder le service et l'agent pour la prochaine fois
      localStorage.setItem(SERVICE_STORAGE_KEY, selectedService.trim())
      localStorage.setItem(AGENT_STORAGE_KEY, agentName.trim())
      onSave(agentName.trim(), selectedService.trim(), comment)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Valider le changement d'écran</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="agent">Nom Prénom *</label>
            <input
              type="text"
              id="agent"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Entrer le nom et prénom"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="service">Service *</label>
            <input
              type="text"
              id="service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              placeholder="Entrer le nom du service"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment">Commentaire (optionnel)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              placeholder="Ajouter un commentaire..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="submit-btn" disabled={!agentName.trim() || !selectedService.trim()}>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ValidationModal

