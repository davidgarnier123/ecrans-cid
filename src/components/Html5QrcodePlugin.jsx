import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef } from "react";

const qrcodeRegionId = "html5qr-code-reader";

const Html5QrcodePlugin = (props) => {
    const html5QrcodeRef = useRef(null);

    useEffect(() => {
        const config = {
            fps: props.fps || 10,
            qrbox: props.qrbox || 250,
            aspectRatio: props.aspectRatio || 1.0,
            formatsToSupport: props.formatsToSupport,
        };

        const verbose = props.verbose === true;

        if (!props.qrCodeSuccessCallback) {
            throw new Error("qrCodeSuccessCallback is required");
        }

        const html5Qrcode = new Html5Qrcode(qrcodeRegionId, { verbose });

        const startScanning = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length > 0) {
                    let selectedCamera;

                    // Priorité à la caméra passée en props
                    if (props.cameraId) {
                        selectedCamera = cameras.find(cam => cam.id === props.cameraId);
                    }

                    // Sinon, chercher la caméra arrière
                    if (!selectedCamera) {
                        selectedCamera = cameras.find(camera =>
                            camera.label.toLowerCase().includes('back') ||
                            camera.label.toLowerCase().includes('arrière') ||
                            camera.label.toLowerCase().includes('rear')
                        ) || cameras[cameras.length - 1];
                    }

                    await html5Qrcode.start(
                        selectedCamera.id,
                        config,
                        (decodedText, decodedResult) => {
                            props.qrCodeSuccessCallback(decodedText, decodedResult);
                        },
                        (errorMessage) => {
                            if (props.qrCodeErrorCallback && !errorMessage.includes('NotFoundException')) {
                                props.qrCodeErrorCallback(errorMessage);
                            }
                        }
                    );

                    html5QrcodeRef.current = html5Qrcode;
                }
            } catch (err) {
                console.error("Erreur démarrage scanner:", err);
            }
        };

        startScanning();

        return () => {
            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
                html5QrcodeRef.current.stop().catch(console.error);
            }
        };
    }, [props.fps, props.qrbox, props.aspectRatio, props.formatsToSupport, props.cameraId]);

    return <div id={qrcodeRegionId} />;
};

export default Html5QrcodePlugin;
