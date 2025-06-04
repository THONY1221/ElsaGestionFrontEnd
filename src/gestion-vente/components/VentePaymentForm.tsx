import React from "react";
import VentePaymentModal from "./VentePaymentModal";

// Composant de redirection pour la compatibilité
interface PaymentFormProps {
  visible: boolean;
  onClose: () => void;
  order: any;
  onPaymentAdded: () => Promise<void>;
}

const VentePaymentForm: React.FC<PaymentFormProps> = (props) => {
  // Rediriger vers le nouveau composant
  return <VentePaymentModal {...props} />;
};

export default VentePaymentForm;
