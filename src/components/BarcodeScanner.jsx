import React, { useState } from 'react';
import Html5QrcodePlugin from './Html5QrcodePlugin';
import { Html5QrcodeSupportedFormats } from "html5-qrcode";
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, settings = {} }) => {
  const [isScanning, setIsScanning] = useState(false);

  const onNewScanResult = (decodedText, decodedResult) => {
    // Validation spécifique (ex: code à 7 chiffres)
    // Tu peux adapter cette regex selon tes besoins
    if (!/^\d{7}$/.test(decodedText)) {
      console.log("Code ignoré (format invalide):", decodedText);
      return;
    }

    // Feedback haptique
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    onScan(decodedText);
  };

  const onScanError = (errorMessage) => {
    if (!errorMessage.includes('NotFoundException')) {
      console.warn('Erreur scan:', errorMessage);
    }
  };

  return (
    <div className="scanner-container">
      {isScanning ? (
        <Html5QrcodePlugin
          fps={settings.fps || 10}
          qrbox={settings.qrbox || 250}
          aspectRatio={settings.aspectRatio || 1.0}
          cameraId={settings.cameraId}
          formatsToSupport={[Html5QrcodeSupportedFormats.CODE_128]} // Adapter le format si besoin
          qrCodeSuccessCallback={onNewScanResult}
          qrCodeErrorCallback={onScanError}
          verbose={false}
        />
      ) : (
        <div className="scanner-placeholder">
          <p>Scanner désactivé</p>
        </div>
      )}

      <button onClick={() => setIsScanning(!isScanning)} className="scanner-toggle-btn">
        {isScanning ? 'Arrêter le scan' : 'Démarrer le scan'}
      </button>
    </div>
  );
};

export default BarcodeScanner;
