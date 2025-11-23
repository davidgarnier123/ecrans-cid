import { useEffect, useRef, useState, useCallback } from 'react'
import * as zbarWasm from '@undecaf/zbar-wasm'
import { getScanSettings } from '../utils/scanSettings'
import './BarcodeScanner.css'

// REQUIRED_SCANS est maintenant dynamique via les settings

function BarcodeScanner({ type, onScan, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const nativeDetectorRef = useRef(null)

  const [error, setError] = useState(null)
  const [usingNative, setUsingNative] = useState(false)

  // États de validation
  const [currentCode, setCurrentCode] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [manualCode, setManualCode] = useState(null)

  const scanCountRef = useRef(0)
  const currentCodeRef = useRef(null)
  const lastScanTimeRef = useRef(0)
  const scanTimeoutRef = useRef(null)
  const isScanningRef = useRef(false)
  const animationFrameRef = useRef(null)
  const scanSettingsRef = useRef(getScanSettings())

  // Fonction pour vibrer le téléphone
  const vibrate = useCallback((pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const stopScanning = useCallback(() => {
    isScanningRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Arrêter les tracks de la vidéo
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
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

    // Logique de validation
    if (decodedText !== currentCodeRef.current) {
      // Nouveau code détecté
      currentCodeRef.current = decodedText
      scanCountRef.current = 1
      setCurrentCode(decodedText)
      setScanCount(1)
      setManualCode(decodedText)
      vibrate(30)

      // Reset timeout
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = setTimeout(() => {
        currentCodeRef.current = null
        scanCountRef.current = 0
        setCurrentCode(null)
        setScanCount(0)
        setManualCode(null)
      }, 3000)

      // Validation immédiate si doubleValidation est false
      if (settings.doubleValidation === false) {
        setIsValidating(true)
        vibrate([100, 50, 100])
        setTimeout(() => {
          onScan(decodedText)
          stopScanning()
        }, 200)
      }

    } else {
      // Même code détecté
      const newCount = scanCountRef.current + 1
      scanCountRef.current = newCount
      setScanCount(newCount)
      vibrate(50)

      // Reset timeout
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = setTimeout(() => {
        currentCodeRef.current = null
        scanCountRef.current = 0
        setCurrentCode(null)
        setScanCount(0)
        setManualCode(null)
      }, 3000)

      const requiredScans = settings.doubleValidation === false ? 1 : 2

      if (newCount >= requiredScans) {
        setIsValidating(true)
        vibrate([100, 50, 100])
        setTimeout(() => {
          onScan(decodedText)
          stopScanning()
        }, 200)
      }
    }
  }, [onScan, stopScanning, vibrate])

  const handleManualValidation = useCallback(() => {
    if (manualCode) {
      onScan(manualCode)
      stopScanning()
    }
  }, [manualCode, onScan, stopScanning])

  // Boucle de scan
  const scanFrame = useCallback(async () => {
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const settings = scanSettingsRef.current

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Ajuster la taille du canvas à la vidéo
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Dessiner la frame vidéo
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // --- DETECTION ---
      try {
        // Si on utilise le détecteur natif ET qu'on n'est pas en mode debug (force ZBar)
        if (usingNative && nativeDetectorRef.current && !settings.forceZBar) {
          const barcodes = await nativeDetectorRef.current.detect(video)

          // Dessiner les bounding boxes si activé
          if (settings.showBoundingBox !== false) {
            barcodes.forEach(barcode => {
              ctx.strokeStyle = '#00ff00'
              ctx.lineWidth = 4
              const { x, y, width, height } = barcode.boundingBox
              ctx.strokeRect(x, y, width, height)
            })
          }

          if (barcodes.length > 0) {
            handleCodeScanned(barcodes[0].rawValue)
          }

        } else {
          // --- FALLBACK ZBAR ---
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const results = await zbarWasm.scanImageData(imageData)

          if (results.length > 0) {
            // Dessiner les points si activé
            if (settings.showBoundingBox !== false) {
              results.forEach(result => {
                if (result.points && result.points.length > 0) {
                  ctx.strokeStyle = '#ff0000' // Rouge pour ZBar pour différencier
                  ctx.lineWidth = 4
                  ctx.beginPath()
                  ctx.moveTo(result.points[0].x, result.points[0].y)
                  for (let i = 1; i < result.points.length; i++) {
                    ctx.lineTo(result.points[i].x, result.points[i].y)
                  }
                  ctx.closePath()
                  ctx.stroke()
                }
              })
            }

            // ZBar retourne le texte décodé via decode()
            const text = results[0].decode()
            handleCodeScanned(text)
          }
        }
      } catch (err) {
        console.warn("Scan error:", err)
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame)
  }, [usingNative, handleCodeScanned])

  // Initialisation
  useEffect(() => {
    const startScanning = async () => {
      try {
        // 1. Initialiser Native Detector si disponible
        if ('BarcodeDetector' in window) {
          try {
            const formats = await window.BarcodeDetector.getSupportedFormats()
            if (formats.includes('code_128') || formats.includes('code_39')) {
              nativeDetectorRef.current = new window.BarcodeDetector({
                formats: ['code_128', 'code_39']
              })
              setUsingNative(true)
              console.log("Native BarcodeDetector initialized")
            }
          } catch (e) {
            console.warn("Native fallback failed:", e)
          }
        }

        // 2. Démarrer la caméra
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // Attendre que la vidéo soit prête avant de lancer la boucle
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            isScanningRef.current = true
            scanFrame()
          }
        }

        // Vibration au démarrage
        vibrate([50, 50, 50])
        setError(null)

      } catch (err) {
        console.error('Erreur lors du démarrage du scanner:', err)
        setError('Impossible de démarrer la caméra. Vérifiez les permissions.')
        isScanningRef.current = false
      }
    }

    startScanning()

    return () => {
      stopScanning()
    }
  }, [scanFrame, stopScanning, vibrate])

  const handleClose = () => {
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

  const requiredScans = scanSettingsRef.current.doubleValidation === false ? 1 : 2
  const progressPercentage = (scanCount / requiredScans) * 100

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
                {/* Video cachée mais active pour le flux */}
                <video
                  ref={videoRef}
                  className="scanner-video-element"
                  playsInline
                  muted
                  style={{ display: 'none' }}
                />
                {/* Canvas qui affiche le flux + les overlays */}
                <canvas
                  ref={canvasRef}
                  className="scanner-canvas"
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
                  {scanCount} / {scanSettingsRef.current.doubleValidation === false ? 1 : 2} scans
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

              {/* Indicateur discret de moteur (Debug) */}
              <div style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.3)',
                pointerEvents: 'none'
              }}>
                {usingNative && !scanSettingsRef.current.forceZBar ? 'Native' : 'ZBar'}
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
    </div >
  )
}

export default BarcodeScanner

