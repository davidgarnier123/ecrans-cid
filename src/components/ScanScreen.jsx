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
  const [manualInput, setManualInput] = useState({ sortant: '', entrant: '' })

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

  const handleManualAdd = (type) => {
    const input = manualInput[type].trim()
    if (!input) return

    // Validation flexible : généralement 7 chiffres mais accepte d'autres formats
    const isValid = /^[0-9]{4,10}$/.test(input) // Entre 4 et 10 chiffres
    
    if (!isValid) {
      alert('Veuillez entrer un identifiant valide (généralement 7 chiffres)')
      return
    }

    if (type === 'sortant') {
      if (!sortants.includes(input)) {
        setSortants([...sortants, input])
        setManualInput({ ...manualInput, sortant: '' })
      } else {
        alert('Cet écran est déjà dans la liste des sortants')
      }
    } else {
      if (!entrants.includes(input)) {
        setEntrants([...entrants, input])
        setManualInput({ ...manualInput, entrant: '' })
      } else {
        alert('Cet écran est déjà dans la liste des entrants')
      }
    }
  }

  const handleManualInputKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      handleManualAdd(type)
    }
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

  const handleSave = (agent, service, comment) => {
    const change = {
      id: Date.now(),
      date: new Date().toISOString(),
      sortants,
      entrants,
      agent,
      service,
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
          <div className="manual-input-group">
            <input
              type="text"
              className="manual-input"
              placeholder="Saisir un identifiant (ex: 1234567)"
              value={manualInput.sortant}
              onChange={(e) => setManualInput({ ...manualInput, sortant: e.target.value })}
              onKeyPress={(e) => handleManualInputKeyPress(e, 'sortant')}
              maxLength="10"
            />
            <button
              className="add-manual-btn"
              onClick={() => handleManualAdd('sortant')}
            >
              Ajouter
            </button>
          </div>
          <div className="scan-buttons-group">
            <button
              className="scan-btn sortant"
              onClick={() => setScanningType('sortant')}
            >
              Scanner un écran sortant
            </button>
          </div>
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
          <div className="manual-input-group">
            <input
              type="text"
              className="manual-input"
              placeholder="Saisir un identifiant (ex: 1234567)"
              value={manualInput.entrant}
              onChange={(e) => setManualInput({ ...manualInput, entrant: e.target.value })}
              onKeyPress={(e) => handleManualInputKeyPress(e, 'entrant')}
              maxLength="10"
            />
            <button
              className="add-manual-btn"
              onClick={() => handleManualAdd('entrant')}
            >
              Ajouter
            </button>
          </div>
          <div className="scan-buttons-group">
            <button
              className="scan-btn entrant"
              onClick={() => setScanningType('entrant')}
            >
              Scanner un écran entrant
            </button>
          </div>
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

