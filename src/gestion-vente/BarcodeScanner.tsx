import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Modal, Button, message } from "antd";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  visible?: boolean;
  onClose?: () => void;
  onScan: (result: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader>();
  const [startScanning, setStartScanning] = useState(false);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  // Si le mode visible n'est pas défini, nous sommes en mode intégré (non modal)
  const isEmbedded = visible === undefined;

  // En mode intégré, nous commençons à scanner immédiatement
  useEffect(() => {
    if (isEmbedded) {
      setStartScanning(true);
    }
  }, [isEmbedded]);

  useEffect(() => {
    if ((visible || isEmbedded) && startScanning) {
      const scan = async () => {
        if (!codeReader.current || !webcamRef.current?.video) return;

        setIsScanning(true);
        try {
          await codeReader.current.decodeFromVideoDevice(
            "environment", // Spécifier 'environment' au lieu de undefined
            webcamRef.current.video,
            (result, error) => {
              if (result) {
                onScan(result.getText());
                message.success("Code-barres détecté avec succès !");
                setIsScanning(false);
                setStartScanning(false);
                onClose?.();
              }
              if (error && error?.message?.includes("NotFoundException")) {
                // Ignorer les erreurs de non-détection
                return;
              }
            }
          );
        } catch (error) {
          message.error("Erreur lors de l'accès à la caméra");
          console.error("Erreur scanner:", error);
          setIsScanning(false);
          setStartScanning(false);
        }
      };
      scan();
    }
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
        setIsScanning(false);
        setStartScanning(false);
      }
    };
  }, [visible, startScanning, onClose, onScan]);

  return isEmbedded ? (
    <div className="barcode-scanner-container">
      <div className="scanner-header">
        <h3>Scanner un code-barres</h3>
        {isScanning ? (
          <Button
            type="primary"
            danger
            icon={<X />}
            onClick={() => {
              setIsScanning(false);
              setStartScanning(false);
              if (onClose) onClose();
            }}
          >
            Arrêter
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<Camera />}
            onClick={() => setStartScanning(true)}
          >
            Activer la caméra
          </Button>
        )}
      </div>

      <div className="webcam-container">
        {startScanning && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
              width: { min: 640 },
              height: { min: 480 },
            }}
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "8px",
            }}
          />
        )}
      </div>
    </div>
  ) : (
    <Modal
      title="Scanner un code-barres"
      open={visible}
      onCancel={() => onClose?.()}
      footer={[
        <Button key="back" onClick={() => onClose?.()}>
          Fermer
        </Button>,
        <Button
          key="scan"
          type="primary"
          onClick={() => setStartScanning(true)}
          disabled={startScanning}
        >
          Scanner
        </Button>,
      ]}
    >
      <div className="webcam-container">
        {startScanning && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
              width: { min: 640 },
              height: { min: 480 },
            }}
            style={{
              width: "100%",
              borderRadius: "8px",
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default BarcodeScanner;
