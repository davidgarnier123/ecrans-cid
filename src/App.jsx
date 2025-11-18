import { useState, useEffect } from 'react'
import ScanScreen from './components/ScanScreen'
import HistoryScreen from './components/HistoryScreen'
import SettingsScreen from './components/SettingsScreen'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('scan')
  const [changes, setChanges] = useState([])

  useEffect(() => {
    // Charger les changements depuis le localStorage
    const savedChanges = localStorage.getItem('screenChanges')
    if (savedChanges) {
      setChanges(JSON.parse(savedChanges))
    }
  }, [])

  const handleChangeSaved = (newChange) => {
    const updatedChanges = [newChange, ...changes]
    setChanges(updatedChanges)
    localStorage.setItem('screenChanges', JSON.stringify(updatedChanges))
  }

  return (
    <div className="app">
      <header className="app-header">
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            Scanner
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historique ({changes.length})
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Paramètres
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'scan' ? (
          <ScanScreen onSave={handleChangeSaved} />
        ) : activeTab === 'history' ? (
          <HistoryScreen 
            changes={changes} 
            onClearHistory={() => {
              setChanges([])
              localStorage.removeItem('screenChanges')
            }}
          />
        ) : (
          <SettingsScreen />
        )}
      </main>
    </div>
  )
}

export default App

