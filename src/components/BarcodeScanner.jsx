import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import './BarcodeScanner.css'

function BarcodeScanner({ type, onScan, onClose }) {
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const isScanningRef = useRef(false)
  const [error, setError] = useState(null)

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
  }, [])

  useEffect(() => {
    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerRef.current.id)
        html5QrCodeRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            onScan(decodedText)
            stopScanning()
          },
          (errorMessage) => {
            // Ignorer les erreurs de scan continu
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
  }, [type, onScan, stopScanning])

  const handleClose = async () => {
    await stopScanning()
    onClose()
  }

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
            <div id="scanner" ref={scannerRef} className="scanner-view" />
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

