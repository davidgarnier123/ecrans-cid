import './HistoryScreen.css'

function HistoryScreen({ changes }) {
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

  return (
    <div className="history-screen">
      <div className="history-grid">
        {changes.map((change) => (
          <div key={change.id} className="change-card">
            <div className="card-header">
              <h3>{change.agent}</h3>
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

