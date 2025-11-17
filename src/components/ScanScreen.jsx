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
  const [activeTab, setActiveTab] = useState('sortant') // 'sortant' ou 'entrant'

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

  const handleManualAdd = () => {
    const type = activeTab
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

  const handleManualInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualAdd()
    }
  }

  const removeCode = (code) => {
    if (activeTab === 'sortant') {
      setSortants(sortants.filter(c => c !== code))
    } else {
      setEntrants(entrants.filter(c => c !== code))
    }
  }

  const getCurrentCodes = () => {
    return activeTab === 'sortant' ? sortants : entrants
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

  const currentCodes = getCurrentCodes()
  const currentInput = manualInput[activeTab]

  return (
    <div className="scan-screen">
      <div className="scan-section">
        <div className="type-tabs">
          <button
            className={`type-tab ${activeTab === 'sortant' ? 'active' : ''} sortant`}
            onClick={() => setActiveTab('sortant')}
          >
            Écrans Sortants ({sortants.length})
          </button>
          <button
            className={`type-tab ${activeTab === 'entrant' ? 'active' : ''} entrant`}
            onClick={() => setActiveTab('entrant')}
          >
            Écrans Entrants ({entrants.length})
          </button>
        </div>

        <div className="codes-list">
          {currentCodes.length === 0 ? (
            <div className="codes-empty">
              <p>Aucun écran {activeTab === 'sortant' ? 'sortant' : 'entrant'} ajouté</p>
            </div>
          ) : (
            currentCodes.map((code, index) => (
              <div key={index} className="code-item">
                <span>{code}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeCode(code)}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="manual-input-group">
          <input
            type="text"
            className="manual-input"
            placeholder="Saisir un identifiant (ex: 1234567)"
            value={currentInput}
            onChange={(e) => setManualInput({ ...manualInput, [activeTab]: e.target.value })}
            onKeyPress={handleManualInputKeyPress}
            maxLength="10"
          />
          <button
            className="add-manual-btn"
            onClick={handleManualAdd}
          >
            Ajouter
          </button>
        </div>

        <div className="scan-buttons-group">
          <button
            className={`scan-btn ${activeTab}`}
            onClick={() => setScanningType(activeTab)}
          >
            Scanner un écran {activeTab === 'sortant' ? 'sortant' : 'entrant'}
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

