import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import axios from "axios";

// Version 5.0 - Chargement simple de tous les modes de paiement sans filtrage
console.log("[VentePaymentModal] Module chargé - Version 5.0");

// Version 6.0 - Filtrage des modes de paiement par entreprise (company) du magasin (warehouse)
console.log("[VentePaymentModal] Module chargé - Version 6.0");

// Version 6.1 - Récupération des modes de paiement spécifiques à l'entreprise + modes génériques
console.log("[VentePaymentModal] Module chargé - Version 6.1");

// Version 7.0 - Optimisation pour utiliser directement le company_id de la commande
console.log(
  "[VentePaymentModal] Module chargé - Version 7.0 - Filtrage direct par company_id de la commande"
);

interface VentePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  order: any;
  onPaymentAdded: () => Promise<void>;
}

// Interface pour le mode de paiement qui correspond à la structure de la table
interface PaymentMode {
  id: number;
  name: string;
  company_id?: number | null;
  mode_type?: string;
  credentials?: string;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
}

// Fonction pour générer une clé d'idempotence
const generateIdempotencyKey = (): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random}`;
};

const VentePaymentModal: React.FC<VentePaymentModalProps> = ({
  visible,
  onClose,
  order,
  onPaymentAdded,
}) => {
  console.log("[VentePaymentModal] Render - État visible:", visible);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingPaymentModes, setLoadingPaymentModes] = useState(false);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [requestId] = useState(generateIdempotencyKey());
  const submissionInProgress = useRef(false);
  const BASE_URL = "http://localhost:3000";

  // Calculer le statut de paiement en fonction du montant payé et du montant total
  const calculatePaymentStatus = (
    paidAmount: number,
    totalAmount: number
  ): string => {
    if (paidAmount >= totalAmount) {
      return "Payé";
    } else if (paidAmount > 0) {
      return "Partiellement payé";
    } else {
      return "Non payé";
    }
  };

  // Récupérer les modes de paiement filtrés par l'entreprise du magasin de la commande
  const fetchPaymentModes = async () => {
    try {
      setLoading(true);

      console.log(
        "[VentePaymentModal] Récupération des modes de paiement pour la commande",
        {
          orderId: order?.id,
          companyId: order?.company_id,
        }
      );

      // Vérifier si la commande a un company_id
      if (order?.company_id) {
        console.log(
          `[VentePaymentModal] Filtrage des modes de paiement pour l'entreprise ${order.company_id}`
        );
        await fetchCombinedPaymentModes(order.company_id);
      } else {
        console.warn(
          "[VentePaymentModal] Aucun company_id trouvé dans la commande, chargement de tous les modes de paiement"
        );
        const url = `${BASE_URL}/api/payment-modes`;
        await fetchAndProcessPaymentModes(url);
      }
    } catch (error) {
      console.error(
        "[VentePaymentModal] Erreur lors de la récupération des modes de paiement:",
        error
      );

      // Message à l'utilisateur
      message.error("Impossible de charger les modes de paiement du système");

      // En cas d'erreur, définir un tableau vide
      setPaymentModes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer à la fois les modes de paiement spécifiques à l'entreprise et les modes génériques
  const fetchCombinedPaymentModes = async (companyId: number) => {
    try {
      console.log(
        `[VentePaymentModal] Récupération des modes de paiement pour l'entreprise ${companyId} et des modes génériques`
      );

      // URL pour les modes de paiement spécifiques à l'entreprise
      const companyUrl = `${BASE_URL}/api/payment-modes?company_id=${companyId}`;
      console.log(
        `[VentePaymentModal] URL pour les modes spécifiques: ${companyUrl}`
      );

      // URL pour tous les modes de paiement (pour extraire les génériques)
      const allModesUrl = `${BASE_URL}/api/payment-modes`;
      console.log(
        `[VentePaymentModal] URL pour tous les modes: ${allModesUrl}`
      );

      // Récupérer les deux ensembles de modes de paiement en parallèle
      const [companyResponse, allModesResponse] = await Promise.all([
        fetch(companyUrl),
        fetch(allModesUrl),
      ]);

      // Traiter la réponse pour les modes spécifiques à l'entreprise
      let companyModes: PaymentMode[] = [];
      if (companyResponse.ok) {
        const companyText = await companyResponse.text();
        if (companyText && companyText.trim() !== "") {
          try {
            const companyData = JSON.parse(companyText);
            companyModes = processPaymentModesData(companyData);
            console.log(
              `[VentePaymentModal] ${companyModes.length} modes de paiement spécifiques récupérés`
            );
          } catch (error) {
            console.error(
              "[VentePaymentModal] Erreur lors du parsing des modes spécifiques:",
              error
            );
          }
        }
      } else {
        console.warn(
          `[VentePaymentModal] Erreur HTTP ${companyResponse.status} pour les modes spécifiques`
        );
      }

      // Traiter la réponse pour tous les modes et extraire les modes génériques
      let genericModes: PaymentMode[] = [];
      if (allModesResponse.ok) {
        const allModesText = await allModesResponse.text();
        if (allModesText && allModesText.trim() !== "") {
          try {
            const allModesData = JSON.parse(allModesText);
            const allModes = processPaymentModesData(allModesData);

            // Filtrer pour obtenir uniquement les modes génériques (sans company_id)
            genericModes = allModes.filter((mode) => !mode.company_id);
            console.log(
              `[VentePaymentModal] ${genericModes.length} modes de paiement génériques extraits de ${allModes.length} modes totaux`
            );
          } catch (error) {
            console.error(
              "[VentePaymentModal] Erreur lors du parsing de tous les modes:",
              error
            );
          }
        }
      } else {
        console.warn(
          `[VentePaymentModal] Erreur HTTP ${allModesResponse.status} pour tous les modes`
        );
      }

      // Combiner les deux types de modes de paiement
      const combinedModes = [...companyModes, ...genericModes];

      // Supprimer les doublons potentiels (en cas de problème de configuration)
      const uniqueModes = combinedModes.filter(
        (mode, index, self) => index === self.findIndex((m) => m.id === mode.id)
      );

      console.log(
        `[VentePaymentModal] Total: ${uniqueModes.length} modes de paiement uniques (${companyModes.length} spécifiques + ${genericModes.length} génériques)`
      );

      if (uniqueModes.length === 0) {
        console.warn("[VentePaymentModal] Aucun mode de paiement trouvé");
        message.warning("Aucun mode de paiement disponible dans le système");
      }

      setPaymentModes(uniqueModes);
    } catch (error) {
      console.error(
        "[VentePaymentModal] Erreur lors de la récupération des modes combinés:",
        error
      );
      message.error("Erreur lors du chargement des modes de paiement");

      // Fallback sur les modes de paiement standards
      const url = `${BASE_URL}/api/payment-modes`;
      await fetchAndProcessPaymentModes(url);
    }
  };

  // Fonction utilitaire pour récupérer et traiter les modes de paiement à partir d'une URL
  const fetchAndProcessPaymentModes = async (url: string) => {
    console.log(
      `[VentePaymentModal] URL de l'API pour les modes de paiement: ${url}`
    );

    // Tentative de récupération des modes de paiement
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `[VentePaymentModal] Erreur HTTP ${response.status} ${response.statusText} lors de la récupération des modes de paiement`
      );
      throw new Error(
        `Erreur HTTP ${response.status} lors de la récupération des modes de paiement`
      );
    }

    // Récupérer le texte brut de la réponse pour debug
    const text = await response.text();
    console.log("[VentePaymentModal] Réponse brute de l'API:", text);

    // Convertir en JSON si non vide
    if (!text || text.trim() === "") {
      console.warn("[VentePaymentModal] Réponse vide de l'API");
      setPaymentModes([]);
      return;
    }

    try {
      const data = JSON.parse(text);
      console.log(
        "[VentePaymentModal] Données JSON des modes de paiement:",
        data
      );

      // Extraire et traiter les modes de paiement
      const extractedModes = processPaymentModesData(data);
      console.log(
        "[VentePaymentModal] Modes de paiement extraits:",
        extractedModes
      );

      // Vérifier si des modes de paiement ont été trouvés
      if (extractedModes.length === 0) {
        console.warn(
          "[VentePaymentModal] Aucun mode de paiement trouvé dans la base de données"
        );
        message.warning("Aucun mode de paiement disponible dans le système");
        setPaymentModes([]);
      } else {
        console.log(
          `[VentePaymentModal] ${extractedModes.length} modes de paiement chargés avec succès`
        );
        setPaymentModes(extractedModes);
      }
    } catch (error) {
      console.error(
        "[VentePaymentModal] Erreur lors du parsing de la réponse JSON:",
        error
      );
      throw new Error("Format de réponse invalide");
    }
  };

  // Fonction pour traiter les données des modes de paiement
  const processPaymentModesData = (data: any): PaymentMode[] => {
    console.log(
      "[VentePaymentModal] Traitement des données de modes de paiement:",
      {
        dataType: typeof data,
        isArray: Array.isArray(data),
        hasDataProperty: data && typeof data === "object" && "data" in data,
        rawData: data,
      }
    );

    // Cas 1: Tableau direct de modes de paiement
    if (Array.isArray(data)) {
      console.log(
        `[VentePaymentModal] Traitement d'un tableau de ${data.length} modes de paiement`
      );

      if (data.length === 0) {
        console.warn("[VentePaymentModal] Tableau vide de modes de paiement");
        return [];
      }

      // Mapper tous les modes de paiement avec indication s'ils sont spécifiques à l'entreprise
      return data.map((item: any) => ({
        id: item.id || 0,
        name: item.name || "Mode inconnu",
        company_id: item.company_id,
        mode_type: item.mode_type || "bank",
        credentials: item.credentials,
        created_at: item.created_at,
        updated_at: item.updated_at,
        active: item.active !== false,
      }));
    }

    // Cas 2: L'API pourrait renvoyer un objet avec une propriété 'paymentModes'
    if (
      data &&
      typeof data === "object" &&
      data.paymentModes &&
      Array.isArray(data.paymentModes)
    ) {
      console.log(
        "[VentePaymentModal] Données trouvées dans la propriété 'paymentModes'"
      );
      return processPaymentModesData(data.paymentModes);
    }

    // Cas 3: L'API pourrait renvoyer un objet avec une propriété 'data'
    if (
      data &&
      typeof data === "object" &&
      data.data &&
      Array.isArray(data.data)
    ) {
      console.log(
        "[VentePaymentModal] Données trouvées dans la propriété 'data'"
      );
      return processPaymentModesData(data.data);
    }

    // Format non reconnu
    console.warn("[VentePaymentModal] Format de données non reconnu:", data);
    return [];
  };

  // Charger les modes de paiement à l'ouverture du modal
  useEffect(() => {
    console.log(
      "[VentePaymentModal] useEffect - visible:",
      visible,
      "order:",
      order?.id
    );
    if (visible) {
      fetchPaymentModes();

      // Initialiser les valeurs par défaut du formulaire
      form.setFieldsValue({
        date: dayjs(),
        amount: order ? (order.total || 0) - (order.paid_amount || 0) : 0,
      });
    }
  }, [visible, order, form]);

  // Soumettre le formulaire
  const onFinish = async (values: any) => {
    // Prevent multiple submissions of the same form
    if (submissionInProgress.current) {
      console.log(
        "[VentePaymentModal] Submission already in progress, ignoring duplicate submission"
      );
      return;
    }

    try {
      submissionInProgress.current = true;
      setSubmitting(true);
      console.log("[VentePaymentModal] Paiement à soumettre:", values);
      console.log("[VentePaymentModal] Idempotency key:", requestId);

      // Calculer le nouveau montant payé total
      const newPaidAmount =
        Number(order.paid_amount || 0) + Number(values.amount);

      // Calculer le nouveau statut de paiement
      const newPaymentStatus = calculatePaymentStatus(
        newPaidAmount,
        Number(order.total)
      );

      console.log("[VentePaymentModal] Nouveau statut de paiement:", {
        paidAmount: newPaidAmount,
        totalAmount: Number(order.total),
        status: newPaymentStatus,
      });

      // Vérifier si un paiement similaire existe déjà pour cette commande
      try {
        const checkResponse = await fetch(
          `${BASE_URL}/api/payments?order_id=${order.id}`
        );
        if (checkResponse.ok) {
          const existingPayments = await checkResponse.json();
          console.log(
            "[VentePaymentModal] Paiements existants:",
            existingPayments
          );

          // Vérifier si un paiement similaire existe déjà
          const similarPayment = existingPayments.find(
            (payment: any) =>
              payment.payment_mode_id === values.payment_mode_id &&
              Math.abs(payment.amount - values.amount) < 0.01 &&
              payment.date === dayjs(values.date).format("YYYY-MM-DD")
          );

          if (similarPayment) {
            console.warn(
              "[VentePaymentModal] Un paiement similaire existe déjà:",
              similarPayment
            );
            message.warning(
              "Attention : un paiement similaire semble déjà enregistré. Veuillez vérifier."
            );

            // Option: arrêter la soumission ou demander confirmation
            const confirmContinue = window.confirm(
              "Un paiement similaire existe déjà. Voulez-vous continuer ?"
            );
            if (!confirmContinue) {
              setSubmitting(false);
              return;
            }
          }
        }
      } catch (checkError) {
        console.error(
          "[VentePaymentModal] Erreur lors de la vérification des paiements existants:",
          checkError
        );
        // Continuer malgré l'erreur de vérification
      }

      // Au lieu de faire deux appels séparés, utiliser l'endpoint combiné
      const processPaymentData = {
        payment: {
          company_id: order.company_id || 1,
          warehouse_id: order.warehouse_id,
          payment_type: "in", // Paiement entrant (depuis un client) pour les ventes
          date: dayjs(values.date).format("YYYY-MM-DD"),
          amount: values.amount,
          payment_mode_id: values.payment_mode_id,
          user_id: order.user_id, // ID du client
          notes: values.notes || "",
          orders: [
            {
              order_id: order.id,
              amount: values.amount,
            },
          ],
        },
        order: {
          id: order.id,
          paid_amount: newPaidAmount,
          due_amount: Number(order.total) - newPaidAmount,
          payment_status: newPaymentStatus,
        },
      };

      console.log(
        "[VentePaymentModal] Payload pour process-order-payment:",
        processPaymentData
      );

      // Frontend Log: Detail data sent to backend
      console.log(
        "Frontend: Sending payment data to backend:",
        JSON.stringify(processPaymentData, null, 2)
      );
      // 1. Enregistrer le paiement via POST /api/payments
      const headers = {
        "Content-Type": "application/json",
        "X-Idempotency-Key": requestId,
      };

      console.log("[VentePaymentModal] Sending request with headers:", headers);

      // Appel à l'API unifiée qui traite à la fois le paiement et la mise à jour de la commande
      const response = await fetch(
        `${BASE_URL}/api/payments/process-order-payment`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(processPaymentData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[VentePaymentModal] Erreur de l'API process-order-payment:",
          {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          }
        );

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.error || "Erreur lors du traitement du paiement"
          );
        } catch (parseError) {
          throw new Error(
            `Erreur ${response.status}: ${errorText || response.statusText}`
          );
        }
      }

      const result = await response.json();
      console.log(
        "[VentePaymentModal] Réponse de l'API process-order-payment:",
        result
      );

      // Réinitialiser le formulaire et fermer le modal
      form.resetFields();
      message.success("Paiement ajouté avec succès");

      try {
        // Mettre à jour les données
        await onPaymentAdded();
      } catch (refreshError) {
        console.error(
          "Erreur lors du rafraîchissement des données:",
          refreshError
        );
        // Pas de message d'erreur ici pour éviter la confusion
      }

      onClose();
    } catch (error: any) {
      console.error(
        "[VentePaymentModal] Erreur lors de l'ajout du paiement:",
        error
      );

      // Afficher un message d'erreur plus détaillé
      let errorMessage = "Une erreur est survenue lors de l'ajout du paiement";

      if (error.message) {
        errorMessage = error.message;
      }

      // Afficher le message d'erreur à l'utilisateur
      message.error(`Erreur: ${errorMessage}`);
    } finally {
      setSubmitting(false);
      submissionInProgress.current = false;
    }
  };

  // Rendu des options du sélecteur de mode de paiement avec indication de l'entreprise
  const renderPaymentModeOptions = () => {
    console.log(
      `[VentePaymentModal] Rendu des options de modes de paiement (${paymentModes.length} modes disponibles)`,
      {
        orderCompanyId: order?.company_id,
        modesWithCompanyId: paymentModes.filter((mode) => mode.company_id)
          .length,
        modesWithoutCompanyId: paymentModes.filter((mode) => !mode.company_id)
          .length,
        allModes: paymentModes.map((mode) => ({
          id: mode.id,
          name: mode.name,
          company_id: mode.company_id,
        })),
      }
    );

    if (loading) {
      return <Select.Option value="">Chargement...</Select.Option>;
    }

    if (paymentModes.length === 0) {
      return (
        <Select.Option value="" disabled>
          Aucun mode de paiement disponible
        </Select.Option>
      );
    }

    // Trier les modes de paiement : d'abord les modes spécifiques à l'entreprise, puis les modes génériques
    const sortedModes = [...paymentModes].sort((a, b) => {
      // Priorité aux modes de l'entreprise
      if (a.company_id && !b.company_id) return -1;
      if (!a.company_id && b.company_id) return 1;

      // Ensuite par nom
      return a.name.localeCompare(b.name);
    });

    return sortedModes.map((mode) => (
      <Select.Option key={mode.id} value={mode.id.toString()}>
        {mode.name}
        {mode.company_id ? " [Spécifique]" : " [Général]"}
      </Select.Option>
    ));
  };

  return (
    <Modal visible={visible} onCancel={onClose} footer={null} width={800}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date"
              label="Date"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Montant"
              rules={[
                { required: true, message: "Veuillez saisir le montant" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0} // Toujours positif
                // La valeur max est le montant restant dû
                max={
                  order
                    ? (order.total || 0) - (order.paid_amount || 0)
                    : undefined
                }
                formatter={(value) =>
                  value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : ""
                }
                parser={(value: any) =>
                  value ? Number(value.replace(/\s/g, "")) : 0
                }
                onChange={(value) => {
                  const numericValue = Number(value);
                  const montantRestantDu = order
                    ? (order.total || 0) - (order.paid_amount || 0)
                    : 0;
                  if (!isNaN(numericValue) && numericValue > montantRestantDu) {
                    form.setFieldsValue({ amount: montantRestantDu });
                    message.info(
                      `Le montant du paiement a été ajusté pour ne pas dépasser le montant restant dû (${montantRestantDu.toLocaleString(
                        "fr-FR"
                      )} CFA).`
                    );
                  } else if (isNaN(numericValue)) {
                    form.setFieldsValue({ amount: 0 });
                  }
                  // Pas besoin de form.setFieldsValue({ amount: numericValue }) si la valeur est valide et dans les limites
                  // car InputNumber gère sa propre valeur interne. La mise à jour du formulaire interviendra au onFinish.
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="payment_mode_id"
              label="Mode de paiement"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner un mode de paiement",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const childrenContent = option?.children;
                  // Ensure childrenContent is a string and option exists
                  if (option && typeof childrenContent === "string") {
                    // Use the string value after type check
                    const childrenString: string = childrenContent;
                    return childrenString
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }
                  // If children is not a string or option is undefined, don't match
                  return false;
                }}
              >
                {renderPaymentModeOptions()}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Soumettre
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default VentePaymentModal;
