// Service IndexedDB pour stocker les agents de manière sécurisée
const DB_NAME = 'ScreenScanDB'
const DB_VERSION = 1
const STORE_NAME = 'agents'

// Ouvrir la base de données
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        objectStore.createIndex('nom', 'nom', { unique: false })
        objectStore.createIndex('service', 'service', { unique: false })
      }
    }
  })
}

// Parser le CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Détecter le séparateur (virgule ou point-virgule)
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','
  
  // Extraire les en-têtes
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase())
  const serviceIndex = headers.findIndex(h => h === 'service')
  const nomIndex = headers.findIndex(h => h === 'nom')

  if (serviceIndex === -1 || nomIndex === -1) {
    throw new Error('Le CSV doit contenir les colonnes "service" et "nom"')
  }

  // Parser les lignes
  const agents = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim())
    const service = values[serviceIndex]?.trim()
    const nom = values[nomIndex]?.trim()

    if (service && nom) {
      agents.push({ service, nom })
    }
  }

  return agents
}

// Sauvegarder les agents depuis un CSV
export async function saveAgentsFromCSV(csvText) {
  try {
    const agents = parseCSV(csvText)
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // Supprimer tous les agents existants
      const clearRequest = store.clear()
      clearRequest.onsuccess = () => {
        // Ajouter les nouveaux agents
        let completed = 0
        let errors = 0

        if (agents.length === 0) {
          transaction.oncomplete = () => resolve({ count: 0 })
          return
        }

        agents.forEach((agent) => {
          const addRequest = store.add(agent)
          addRequest.onsuccess = () => {
            completed++
            if (completed + errors === agents.length) {
              resolve({ count: completed })
            }
          }
          addRequest.onerror = () => {
            errors++
            if (completed + errors === agents.length) {
              if (errors > 0) {
                reject(new Error(`Erreur lors de l'ajout de ${errors} agent(s)`))
              } else {
                resolve({ count: completed })
              }
            }
          }
        })
      }

      clearRequest.onerror = () => reject(clearRequest.error)
    })
  } catch (error) {
    throw error
  }
}

// Rechercher des agents par nom (avec autocomplétion)
export async function searchAgents(searchTerm) {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const allAgents = request.result
        const term = searchTerm.toLowerCase().trim()

        if (!term) {
          resolve([])
          return
        }

        // Filtrer les agents qui correspondent à la recherche
        const matches = allAgents.filter(agent => {
          const nom = agent.nom?.toLowerCase() || ''
          const service = agent.service?.toLowerCase() || ''
          return nom.includes(term) || service.includes(term)
        })

        // Limiter à 10 résultats pour les performances
        resolve(matches.slice(0, 10))
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    return []
  }
}

// Obtenir tous les agents
export async function getAllAgents() {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error)
    return []
  }
}

// Obtenir le nombre d'agents
export async function getAgentCount() {
  try {
    const agents = await getAllAgents()
    return agents.length
  } catch (error) {
    return 0
  }
}

