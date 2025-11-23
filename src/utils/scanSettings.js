const SCAN_SETTINGS_KEY = 'barcodeScannerSettings'

// Valeurs par défaut
const DEFAULT_SETTINGS = {
  forceZBar: false, // Force l'utilisation de ZBar même si BarcodeDetector est disponible
  scanDelay: 150,   // Délai entre les scans réussis (ms)
  showBoundingBox: true // Afficher ou non les boîtes de détection
}

export const getScanSettings = () => {
  try {
    const saved = localStorage.getItem(SCAN_SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Nettoyage des anciennes clés
      delete parsed.fps
      delete parsed.qrboxPercentage
      delete parsed.aspectRatio
      delete parsed.disableFlip

      // Fusionner avec les valeurs par défaut
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (err) {
    console.warn('Erreur lors de la lecture des paramètres de scan:', err)
  }
  return DEFAULT_SETTINGS
}

export const saveScanSettings = (settings) => {
  try {
    localStorage.setItem(SCAN_SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des paramètres de scan:', err)
  }
}

export const resetScanSettings = () => {
  try {
    localStorage.removeItem(SCAN_SETTINGS_KEY)
    return DEFAULT_SETTINGS
  } catch (err) {
    console.error('Erreur lors de la réinitialisation des paramètres de scan:', err)
    return DEFAULT_SETTINGS
  }
}

