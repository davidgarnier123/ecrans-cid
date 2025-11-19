const SCAN_SETTINGS_KEY = 'barcodeScannerSettings'

// Valeurs par défaut
const DEFAULT_SETTINGS = {
  fps: 30,
  qrboxPercentage: 80,
  scanDelay: 150,
  aspectRatio: 1.0
  // disableFlip est toujours true (caméra arrière uniquement)
}

export const getScanSettings = () => {
  try {
    const saved = localStorage.getItem(SCAN_SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Retirer disableFlip s'il existe (n'est plus utilisé)
      delete parsed.disableFlip
      // Fusionner avec les valeurs par défaut pour gérer les nouvelles propriétés
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

