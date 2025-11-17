import { useState } from 'react'
import BarcodeScanner from './BarcodeScanner'
import ValidationModal from './ValidationModal'
import './ScanScreen.css'

const AGENTS = [
  'Agent 1',
  'Agent 2',
  'Agent 3',
  'Agent 4',
  'Agent 5',
  'Agent 6',
  'Agent 7',
  'Agent 8',
  'Agent 9',
  'Agent 10'
]

function ScanScreen({ onSave }) {
  const [sortants, setSortants] = useState([])
  const [entrants, setEntrants] = useState([])
  const [scanningType, setScanningType] = useState(null) // 'sortant' ou 'entrant'
  const [showValidation, setShowValidation] = useState(false)

  const handleScan = (code) => {
    if (scanningType === 'sortant') {
      if (!sortants.includes(code)) {
        setSortants([...sortants, code])
      }
    } else if (scanningType === 'entrant') {
      if (!entrants.includes(code)) {
        setEntrants([...entrants, code])
      }
    }
    setScanningType(null)
  }

  const removeCode = (code, type) => {
    if (type === 'sortant') {
      setSortants(sortants.filter(c => c !== code))
    } else {
      setEntrants(entrants.filter(c => c !== code))
    }
  }

  const canValidate = sortants.length > 0 && entrants.length > 0

  const handleValidate = () => {
    if (canValidate) {
      setShowValidation(true)
    }
  }

  const handleSave = (agent, comment) => {
    const change = {
      id: Date.now(),
      date: new Date().toISOString(),
      sortants,
      entrants,
      agent,
      comment
    }
    onSave(change)
    // Réinitialiser
    setSortants([])
    setEntrants([])
    setShowValidation(false)
  }

  const handleReset = () => {
    setSortants([])
    setEntrants([])
    setScanningType(null)
  }

  return (
    <div className="scan-screen">
      <div className="scan-sections">
        <div className="scan-section">
          <h2>Écrans Sortants</h2>
          <div className="codes-list">
            {sortants.map((code, index) => (
              <div key={index} className="code-item">
                <span>{code}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeCode(code, 'sortant')}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            className="scan-btn sortant"
            onClick={() => setScanningType('sortant')}
          >
            Scanner un écran sortant
          </button>
        </div>

        <div className="scan-section">
          <h2>Écrans Entrants</h2>
          <div className="codes-list">
            {entrants.map((code, index) => (
              <div key={index} className="code-item">
                <span>{code}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeCode(code, 'entrant')}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            className="scan-btn entrant"
            onClick={() => setScanningType('entrant')}
          >
            Scanner un écran entrant
          </button>
        </div>
      </div>

      <div className="actions">
        <button className="reset-btn" onClick={handleReset}>
          Réinitialiser
        </button>
        <button
          className="validate-btn"
          onClick={handleValidate}
          disabled={!canValidate}
        >
          Valider ({sortants.length} sortant{sortants.length > 1 ? 's' : ''}, {entrants.length} entrant{entrants.length > 1 ? 's' : ''})
        </button>
      </div>

      {scanningType && (
        <BarcodeScanner
          type={scanningType}
          onScan={handleScan}
          onClose={() => setScanningType(null)}
        />
      )}

      {showValidation && (
        <ValidationModal
          agents={AGENTS}
          onSave={handleSave}
          onClose={() => setShowValidation(false)}
        />
      )}
    </div>
  )
}

export default ScanScreen

