import { useState, useEffect, useRef } from 'react'
import { searchAgents } from '../utils/agentDB'
import './ValidationModal.css'

const SERVICE_STORAGE_KEY = 'lastService'
const AGENT_STORAGE_KEY = 'lastAgent'

function ValidationModal({ onSave, onClose }) {
  const [agentName, setAgentName] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [comment, setComment] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const suggestionsRef = useRef(null)
  const inputRef = useRef(null)

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

  // Recherche d'agents avec autocomplétion
  useEffect(() => {
    const searchAgentsAsync = async () => {
      if (agentName.trim().length >= 2 && !isManualEntry) {
        const results = await searchAgents(agentName)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(searchAgentsAsync, 300)
    return () => clearTimeout(timeoutId)
  }, [agentName, isManualEntry])

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAgentSelect = (agent) => {
    setAgentName(agent.nom)
    setSelectedService(agent.service)
    setShowSuggestions(false)
    setIsManualEntry(false)
  }

  const handleAgentInputChange = (e) => {
    setAgentName(e.target.value)
    setIsManualEntry(false)
    setShowSuggestions(true)
  }

  const handleAgentInputFocus = () => {
    if (suggestions.length > 0 && agentName.trim().length >= 2) {
      setShowSuggestions(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

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
          <div className="form-group autocomplete-group">
            <label htmlFor="agent">Nom Prénom *</label>
            <div className="autocomplete-wrapper">
              <input
                ref={inputRef}
                type="text"
                id="agent"
                value={agentName}
                onChange={handleAgentInputChange}
                onFocus={handleAgentInputFocus}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher un agent ou saisir manuellement"
                required
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionsRef} className="autocomplete-suggestions">
                  {suggestions.map((agent, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleAgentSelect(agent)}
                    >
                      <div className="suggestion-name">{agent.nom}</div>
                      <div className="suggestion-service">{agent.service}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="form-hint">
              Tapez au moins 2 caractères pour rechercher, ou saisissez manuellement
            </p>
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

