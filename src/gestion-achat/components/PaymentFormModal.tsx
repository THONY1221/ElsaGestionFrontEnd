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
  Alert,
  Space,
  Card,
  Descriptions,
  Progress,
} from "antd";
import dayjs from "dayjs";
import axios from "axios";
import { PaymentFormModalProps } from "../types";

const { Option } = Select;

// Base API URL
const BASE_URL = "http://localhost:3000";

// Format numbers for French locale
const formatNumber = (value: any): string => {
  if (value === null || value === undefined) return "0";
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/\s/g, ""))
      : Number(value);
  if (isNaN(num)) return "0";
  return num
    .toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    .replace(/ /g, "\u00A0"); // non-breaking space
};

// Generate a unique idempotency key
const generateIdempotencyKey = (): string => {
  return `payment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  visible,
  onClose,
  order,
  onPaymentAdded,
}) => {
  const [form] = Form.useForm();
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [loadingModes, setLoadingModes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate submissions
  const inFlight = useRef(false);
  const idemKeyRef = useRef<string | null>(null);

  // Calculate remaining amount
  const due = order
    ? Number(order.total || 0) - Number(order.paid_amount || 0)
    : 0;
  const remaining = Math.max(0, due);
  const formattedRemaining = formatNumber(remaining);
  const fullyPaid = remaining <= 0;
  // Calculate percentage of payment completed
  const percentagePaid =
    order && order.total > 0
      ? Math.round((Number(order.paid_amount) / Number(order.total)) * 100)
      : 0;

  // Helper to compute payment status based on paid vs total
  const calculatePaymentStatus = (paid: number, total: number): string => {
    if (paid <= 0) return "Non payé";
    if (paid < total) return "Partiellement payé";
    return "Payé";
  };

  // Load payment modes when modal opens
  useEffect(() => {
    if (visible && order) {
      setError(null);
      inFlight.current = false;
      idemKeyRef.current = null;
      form.resetFields();
      if (order.company_id) loadPaymentModes(order.company_id);
      form.setFieldsValue({
        montant: fullyPaid ? 0 : remaining,
        date_paiement: dayjs(),
        mode_paiement: undefined,
        remarques: "",
      });
    }
  }, [visible, order]);

  const loadPaymentModes = async (companyId: number | string) => {
    setLoadingModes(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/payment-modes`, {
        params: { company_id: companyId },
      });
      let modes = [];
      if (res.data && Array.isArray(res.data.paymentModes))
        modes = res.data.paymentModes;
      else if (Array.isArray(res.data)) modes = res.data;
      setPaymentModes(modes);
    } catch (e) {
      console.error("Error loading payment modes:", e);
      message.error("Impossible de charger les modes de paiement.");
      setPaymentModes([]);
    } finally {
      setLoadingModes(false);
    }
  };

  const onFinish = async (values: any) => {
    console.log("[PaymentFormModal] onFinish values:", values);
    if (!order || !order.id) {
      setError("Données de commande invalides.");
      return;
    }
    if (fullyPaid) {
      message.warning("Cette commande est déjà entièrement payée.");
      setError("Commande déjà soldée.");
      return;
    }
    if (inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    idemKeyRef.current = generateIdempotencyKey();

    try {
      // Compute new paid/due/status based on user input
      const prevPaid = Number(order.paid_amount || 0);
      const amountVal = Number(values.montant);
      const newPaidAmount = prevPaid + amountVal;
      const totalAmount = Number(order.total || 0);
      const newDueAmount = totalAmount - newPaidAmount;
      const newPaymentStatus = calculatePaymentStatus(
        newPaidAmount,
        totalAmount
      );

      // Prepare payload including order update data
      const payload = {
        payment: {
          company_id: order.company_id,
          warehouse_id: order.warehouse_id,
          payment_type: "out",
          date: dayjs(values.date_paiement).format("YYYY-MM-DD"),
          amount: amountVal,
          payment_mode_id: values.mode_paiement,
          user_id: order.user_id,
          notes: values.remarques || "",
        },
        order: {
          id: order.id,
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          payment_status: newPaymentStatus,
        },
      };
      console.log("[PaymentFormModal] submitting payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/payments/process-order-payment`,
        payload,
        {
          headers: { "X-Idempotency-Key": idemKeyRef.current! },
          timeout: 20000,
        }
      );

      if (res.status === 200 || res.status === 201) {
        if (res.data.is_duplicate) {
          message.warning(`Paiement (${res.data.payment_number}) déjà traité.`);
        } else {
          message.success("Paiement ajouté avec succès");
        }
        form.resetFields();
        onClose();
        if (onPaymentAdded) await onPaymentAdded(true);
      } else {
        throw new Error(`Réponse inattendue: ${res.status}`);
      }
    } catch (err: any) {
      console.error("Error submitting payment:", err);
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : err.message;
      setError(msg);
      message.error(msg);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Ajouter un paiement - ${order?.invoice_number || ""}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Spin spinning={submitting} tip="Enregistrement...">
        {/* Payment summary */}
        {order && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Total">
                {formatNumber(order.total)} XOF
              </Descriptions.Item>
              <Descriptions.Item label="Payé">
                {formatNumber(order.paid_amount)} XOF
              </Descriptions.Item>
              <Descriptions.Item label="Restant dû">
                {formattedRemaining} XOF
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                {calculatePaymentStatus(
                  Number(order.paid_amount),
                  Number(order.total)
                )}
              </Descriptions.Item>
            </Descriptions>
            <Progress
              percent={percentagePaid}
              showInfo
              strokeColor={percentagePaid === 100 ? "#52c41a" : undefined}
            />
          </Card>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={submitting}
        >
          {error && (
            <Alert
              message="Erreur"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="montant"
                label={`Montant à payer (Restant dû: ${formattedRemaining} XOF)`}
                rules={[
                  {
                    required: !fullyPaid,
                    message: "Veuillez entrer un montant",
                  },
                  {
                    validator(_, value) {
                      if (value <= 0) {
                        return Promise.reject(
                          new Error("Le montant doit être positif")
                        );
                      }
                      if (value > remaining) {
                        return Promise.reject(
                          new Error(`Max ${formattedRemaining} XOF`)
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.01}
                  max={remaining}
                  formatter={(val) =>
                    `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")
                  }
                  parser={(val) => (val ? Number(val.replace(/\s/g, "")) : 0)}
                  addonAfter="XOF"
                  disabled={fullyPaid}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date_paiement"
                label="Date de paiement"
                rules={[
                  { required: true, message: "Veuillez choisir une date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="mode_paiement"
            label="Mode de paiement"
            rules={[
              { required: true, message: "Veuillez sélectionner un mode" },
            ]}
          >
            <Select placeholder="Choisir un mode" loading={loadingModes}>
              {paymentModes.map((mode) => (
                <Option key={mode.id} value={mode.id}>
                  {mode.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remarques" label="Remarques (optionnel)">
            <Input.TextArea rows={3} placeholder="Note..." />
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={submitting || fullyPaid}
              >
                Enregistrer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PaymentFormModal;
