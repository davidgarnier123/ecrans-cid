# Scan Écran PWA

Application Progressive Web App (PWA) pour la gestion des changements d'écrans avec scan de codes-barres.

## Fonctionnalités

- 📱 Scan de codes-barres pour les écrans sortants et entrants
- 👥 Attribution à un agent (liste configurable)
- 💬 Ajout de commentaires lors de la validation
- 📋 Historique des changements d'écrans avec affichage en cards
- 💾 Stockage local des données (localStorage)
- 📱 Interface responsive et moderne

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Prévisualisation

```bash
npm run preview
```

## Utilisation

1. **Scanner les écrans** : Cliquez sur "Scanner un écran sortant" ou "Scanner un écran entrant" pour ouvrir le scanner de codes-barres
2. **Valider** : Une fois au moins un écran sortant et un écran entrant scannés, cliquez sur "Valider"
3. **Attribuer** : Sélectionnez un agent et ajoutez éventuellement un commentaire
4. **Consulter l'historique** : Accédez à l'onglet "Historique" pour voir tous les changements d'écrans enregistrés

## Technologies

- React 18
- Vite
- html5-qrcode
- vite-plugin-pwa

