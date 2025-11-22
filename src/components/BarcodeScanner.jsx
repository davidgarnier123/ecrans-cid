import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library'
import { getScanSettings } from '../utils/scanSettings'
import './BarcodeScanner.css'

const REQUIRED_SCANS = 2 // Nombre de scans consécutifs requis pour valider

function BarcodeScanner({ type, onScan, onClose }) {
  const scannerRef = useRef(null)
  const codeReaderRef = useRef(null)
  const isScanningRef = useRef(false)
  const [error, setError] = useState(null)
  const [currentCode, setCurrentCode] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [manualCode, setManualCode] = useState(null) // Code proposé pour validation manuelle
  const lastScanTimeRef = useRef(0)
  const scanTimeoutRef = useRef(null)
  const currentCodeRef = useRef(null)
  const scanCountRef = useRef(0)
  const scanSettingsRef = useRef(getScanSettings())

  // Fonction pour vibrer le téléphone
  const vibrate = useCallback((pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
      isScanningRef.current = false
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
  }, [])

  const handleCodeScanned = useCallback((decodedText) => {
    // Recharger les paramètres au cas où ils ont changé
    scanSettingsRef.current = getScanSettings()
    const settings = scanSettingsRef.current
    const now = Date.now()

    // Ignorer les scans trop rapides selon le délai configuré
    if (now - lastScanTimeRef.current < settings.scanDelay) {
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
        // Si pas de nouveau scan dans les 3 secondes, réinitialiser
        scanTimeoutRef.current = setTimeout(() => {
          currentCodeRef.current = null
          scanCountRef.current = 0
          setCurrentCode(null)
          setScanCount(0)
          setManualCode(null)
        }, 3000)
      }
    } else {
      // Nouveau code détecté, réinitialiser
      currentCodeRef.current = decodedText
      scanCountRef.current = 1
      setCurrentCode(decodedText)
      setScanCount(1)
      // Afficher le code pour validation manuelle dès le premier scan
      setManualCode(decodedText)
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
        setManualCode(null)
      }, 3000)
    }
  }, [onScan, stopScanning, vibrate])

  const handleManualValidation = useCallback(() => {
    if (manualCode) {
      onScan(manualCode)
      stopScanning()
    }
  }, [manualCode, onScan, stopScanning])

  useEffect(() => {
    const startScanning = async () => {
      try {
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128])
        hints.set(DecodeHintType.TRY_HARDER, true)

        const codeReader = new BrowserMultiFormatReader(hints)
        codeReaderRef.current = codeReader

        // Vibration au démarrage du scanner
        vibrate([50, 50, 50])

        const videoInputDevices = await codeReader.listVideoInputDevices()
        // Prefer environment facing camera
        const selectedDeviceId = videoInputDevices.find(device => device.label.toLowerCase().includes('back'))?.deviceId
          || videoInputDevices[0].deviceId

        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          scannerRef.current,
          (result, err) => {
            if (result) {
              handleCodeScanned(result.getText())
            }
            if (err && !(err instanceof NotFoundException)) {
              console.warn('Scan error:', err)
            }
          }
        )

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
  }, [handleCodeScanned, stopScanning, vibrate])

  const handleClose = async () => {
    stopScanning()
    // Réinitialiser les états
    currentCodeRef.current = null
    scanCountRef.current = 0
    setCurrentCode(null)
    setScanCount(0)
    setIsValidating(false)
    setManualCode(null)
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
              <div className="scanner-view-container">
                <video
                  id="scanner-video"
                  ref={scannerRef}
                  className="scanner-view"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
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
                {manualCode && !isValidating && (
                  <div
                    className="manual-validation-code"
                    onClick={handleManualValidation}
                    title="Appuyez pour valider ce code"
                  >
                    {manualCode}
                  </div>
                )}
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

