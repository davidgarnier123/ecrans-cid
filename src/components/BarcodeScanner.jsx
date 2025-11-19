import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import './BarcodeScanner.css'

const REQUIRED_SCANS = 2 // Nombre de scans consécutifs requis pour valider

function BarcodeScanner({ type, onScan, onClose }) {
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const isScanningRef = useRef(false)
  const [error, setError] = useState(null)
  const [currentCode, setCurrentCode] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const lastScanTimeRef = useRef(0)
  const scanTimeoutRef = useRef(null)
  const currentCodeRef = useRef(null)
  const scanCountRef = useRef(0)

  // Fonction pour vibrer le téléphone
  const vibrate = useCallback((pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
        isScanningRef.current = false
      } catch (err) {
        console.error('Erreur lors de l\'arrêt du scanner:', err)
      }
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
  }, [])

  const applyCameraEnhancements = useCallback(async () => {
    if (!scannerRef.current) {
      return
    }

    try {
      // Obtenir le track vidéo actif depuis l'élément scanner
      const videoElement = scannerRef.current.querySelector('video')
      if (!videoElement) {
        return
      }

      const stream = videoElement.srcObject
      if (!stream) {
        return
      }

      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) {
        return
      }

      const capabilities = videoTrack.getCapabilities()
      if (!capabilities) {
        return
      }

      const desiredConstraints = {}

      // Configurer le focus
      if (capabilities.focusMode) {
        if (Array.isArray(capabilities.focusMode)) {
          if (capabilities.focusMode.includes('continuous')) {
            desiredConstraints.focusMode = 'continuous'
          } else if (capabilities.focusMode.includes('auto')) {
            desiredConstraints.focusMode = 'auto'
          }
        }
      }

      // Configurer le zoom si disponible
      if (capabilities.zoom) {
        const minZoom = capabilities.zoom.min ?? 1.0
        const maxZoom = capabilities.zoom.max ?? 2.0
        const preferredZoom = Math.min(Math.max(minZoom, 1.3), maxZoom)
        desiredConstraints.zoom = preferredZoom
      }

      // Appliquer les contraintes si on en a
      if (Object.keys(desiredConstraints).length > 0) {
        await videoTrack.applyConstraints({ advanced: [desiredConstraints] })
      }
    } catch (err) {
      console.warn('Impossible d\'appliquer les contraintes caméra:', err)
    }
  }, [])

  const handleCodeScanned = useCallback((decodedText) => {
    const now = Date.now()
    
    // Ignorer les scans trop rapides (moins de 200ms entre chaque scan)
    if (now - lastScanTimeRef.current < 200) {
      return
    }
    lastScanTimeRef.current = now

    // Si c'est le même code, incrémenter le compteur
    if (decodedText === currentCodeRef.current) {
      const newCount = scanCountRef.current + 1
      scanCountRef.current = newCount
      setScanCount(newCount)

      // Vibration courte pour chaque scan réussi
      vibrate(50)

      // Si on a atteint le nombre requis de scans
      if (newCount >= REQUIRED_SCANS) {
        setIsValidating(true)
        // Vibration longue pour la validation finale
        vibrate([100, 50, 100])
        
        // Attendre un peu pour montrer la validation, puis valider
        setTimeout(() => {
          onScan(decodedText)
          stopScanning()
        }, 500)
      } else {
        // Réinitialiser le timeout si un nouveau scan arrive
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current)
        }
        // Si pas de nouveau scan dans les 2 secondes, réinitialiser
        scanTimeoutRef.current = setTimeout(() => {
          currentCodeRef.current = null
          scanCountRef.current = 0
          setCurrentCode(null)
          setScanCount(0)
        }, 2000)
      }
    } else {
      // Nouveau code détecté, réinitialiser
      currentCodeRef.current = decodedText
      scanCountRef.current = 1
      setCurrentCode(decodedText)
      setScanCount(1)
      // Vibration courte pour indiquer qu'un nouveau code est détecté
      vibrate(30)

      // Réinitialiser le timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
      scanTimeoutRef.current = setTimeout(() => {
        currentCodeRef.current = null
        scanCountRef.current = 0
        setCurrentCode(null)
        setScanCount(0)
      }, 2000)
    }
  }, [onScan, stopScanning, vibrate])

  useEffect(() => {
    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerRef.current.id)
        html5QrCodeRef.current = html5QrCode

        // Vibration au démarrage du scanner
        vibrate([50, 50, 50])

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.333,
            disableFlip: true
          },
          handleCodeScanned,
          (errorMessage) => {
            // Ignorer les erreurs de scan continu
          }
        )
        // Appliquer les améliorations après le démarrage de la caméra
        setTimeout(async () => {
          await applyCameraEnhancements()
        }, 500)
        isScanningRef.current = true
        setError(null)
      } catch (err) {
        console.error('Erreur lors du démarrage du scanner:', err)
        setError('Impossible de démarrer la caméra. Vérifiez les permissions.')
        isScanningRef.current = false
      }
    }

    if (scannerRef.current) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [type, handleCodeScanned, stopScanning, vibrate, applyCameraEnhancements])

  const handleClose = async () => {
    await stopScanning()
    // Réinitialiser les états
    currentCodeRef.current = null
    scanCountRef.current = 0
    setCurrentCode(null)
    setScanCount(0)
    setIsValidating(false)
    onClose()
  }

  const progressPercentage = (scanCount / REQUIRED_SCANS) * 100

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>
            Scanner un écran {type === 'sortant' ? 'sortant' : 'entrant'}
          </h3>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="scanner-content">
          {error ? (
            <div className="scanner-error">
              <p>{error}</p>
              <button onClick={handleClose}>Fermer</button>
            </div>
          ) : (
            <>
              <div id="scanner" ref={scannerRef} className="scanner-view" />
              <div className="scanner-progress-container">
                <div className="scanner-progress-info">
                  {isValidating ? (
                    <span className="progress-message success">
                      ✓ Code validé !
                    </span>
                  ) : scanCount > 0 ? (
                    <span className="progress-message scanning">
                      Code détecté : {currentCode?.substring(0, 20)}
                      {currentCode && currentCode.length > 20 ? '...' : ''}
                    </span>
                  ) : (
                    <span className="progress-message waiting">
                      Pointez la caméra vers le code-barres
                    </span>
                  )}
                </div>
                <div className="scanner-progress-bar">
                  <div
                    className={`scanner-progress-fill ${isValidating ? 'validated' : ''}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="scanner-progress-text">
                  {scanCount} / {REQUIRED_SCANS} scans
                </div>
              </div>
            </>
          )}
        </div>
        <div className="scanner-footer">
          <button className="cancel-btn" onClick={handleClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner

