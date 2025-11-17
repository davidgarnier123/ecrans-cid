import { useState } from 'react'
import './ValidationModal.css'

function ValidationModal({ agents, onSave, onClose }) {
  const [selectedAgent, setSelectedAgent] = useState('')
  const [comment, setComment] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedAgent) {
      onSave(selectedAgent, comment)
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
            <label htmlFor="agent">Agent *</label>
            <select
              id="agent"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              required
            >
              <option value="">Sélectionner un agent</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
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
            <button type="submit" className="submit-btn" disabled={!selectedAgent}>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ValidationModal

