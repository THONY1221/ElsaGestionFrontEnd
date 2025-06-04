import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Modal, Button, message } from "antd";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
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

  useEffect(() => {
    if (visible && webcamRef.current?.video && startScanning) {
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
                onClose();
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

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title="Scanner de code-barres"
      width={640}
    >
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={600}
          height={400}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 600,
            height: 400,
            facingMode: "environment",
          }}
        />
        <div className="absolute top-4 right-4 space-x-2">
          <Button
            icon={<Camera className="h-4 w-4" />}
            onClick={() => setStartScanning(true)}
            disabled={isScanning}
          >
            Scanner
          </Button>
          <Button
            icon={<X className="h-4 w-4" />}
            onClick={() => {
              setStartScanning(false);
              setIsScanning(false);
              if (codeReader.current) {
                codeReader.current.reset();
              }
            }}
            disabled={!isScanning}
          >
            Arrêter
          </Button>
        </div>
      </div>
      <p className="mt-4 text-center text-gray-600">
        Placez le code-barres dans le champ de vision de la caméra
      </p>
    </Modal>
  );
};

export default BarcodeScanner;
