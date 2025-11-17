import { useState } from 'react'
import './HistoryScreen.css'

function HistoryScreen({ changes, onClearHistory }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (changes.length === 0) {
    return (
      <div className="history-empty">
        <p>Aucun changement d'écran enregistré pour le moment.</p>
      </div>
    )
  }

  const handleClearClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmClear = () => {
    onClearHistory()
    setShowConfirmDialog(false)
  }

  const handleCancelClear = () => {
    setShowConfirmDialog(false)
  }

  return (
    <div className="history-screen">
      {changes.length > 0 && (
        <div className="history-actions">
          <button className="clear-btn" onClick={handleClearClick}>
            Vider la base de données
          </button>
        </div>
      )}

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir vider toute la base de données ? Cette action est irréversible.</p>
            <div className="confirm-dialog-actions">
              <button className="confirm-cancel-btn" onClick={handleCancelClear}>
                Annuler
              </button>
              <button className="confirm-delete-btn" onClick={handleConfirmClear}>
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="history-grid">
        {changes.map((change) => (
          <div key={change.id} className="change-card">
            <div className="card-header">
              <div>
                <h3>{change.agent}</h3>
                {change.service && (
                  <span className="card-service">{change.service}</span>
                )}
              </div>
              <span className="card-date">{formatDate(change.date)}</span>
            </div>
            
            <div className="card-content">
              <div className="card-section">
                <h4>Écrans Sortants ({change.sortants.length})</h4>
                <div className="codes-display">
                  {change.sortants.map((code, index) => (
                    <span key={index} className="code-badge sortant">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-section">
                <h4>Écrans Entrants ({change.entrants.length})</h4>
                <div className="codes-display">
                  {change.entrants.map((code, index) => (
                    <span key={index} className="code-badge entrant">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {change.comment && (
                <div className="card-section">
                  <h4>Commentaire</h4>
                  <p className="comment-text">{change.comment}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryScreen

