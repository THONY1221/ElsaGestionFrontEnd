import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Spin,
  Space,
  Checkbox,
  Row,
  Col,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// import ElsaGestionLogo from '../assets/1743813894339-903182735.png'; // Supprimé : plus besoin d'importer si dans public
// Optional: import './auth.css'; // For custom styling

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    console.log("Login attempt with:", values);

    try {
      // --> Replace with your actual API endpoint <--
      const response = await axios.post("/api/login", {
        email: values.email,
        password: values.password,
      });

      console.log("Login successful:", response.data);

      // --- Store token and user data ---
      // Adjust keys ('token', 'user') and data structure based on your API response
      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);

        // --- Redirect to dashboard/home page ---
        navigate("/accueil"); // Or your desired route after login
      } else {
        // Handle cases where token or user data might be missing in the response
        console.error("Login response missing token or user data.");
        setError("Réponse invalide du serveur après la connexion.");
      }
    } catch (err) {
      console.error("Login error:", err.response || err.message);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Échec de la connexion. Vérifiez vos identifiants.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    // Optionally set a generic form error
    // setError('Veuillez remplir tous les champs requis.');
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        // background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Remplacé par l'image
        backgroundImage: `url(${
          process.env.PUBLIC_URL + "/images/Background_image.png"
        })`,
        backgroundSize: "cover", // Assure que l'image couvre tout le conteneur
        backgroundPosition: "center", // Centre l'image
        backgroundRepeat: "no-repeat", // Empêche la répétition de l'image
        padding: "2rem 0",
      }}
    >
      <Card
        className="w-full max-w-md p-6 sm:p-8 lg:p-10"
        style={{
          // width: 480, // Supprimé pour utiliser les classes Tailwind
          boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.37 )",
          borderRadius: "12px",
          // padding: "40px", // Supprimé pour utiliser les classes Tailwind
          background: "transparent", // Transparence à 100%
          backdropFilter: "blur(1px)", // Réduire le flou
          border: "1px solid rgba(255, 255, 255, 0.18)", // Maintenir la bordure subtile
        }}
      >
        <Spin spinning={loading} tip="Connexion...">
          <Form
            form={form}
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
            requiredMark={false}
          >
            {error && (
              <Form.Item>
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(null)}
                />
              </Form.Item>
            )}

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Veuillez entrer votre email!" },
                { type: "email", message: "Veuillez entrer un email valide!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: "Veuillez entrer votre mot de passe!",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mot de passe"
                size="large"
              />
            </Form.Item>

            {/* "Se souvenir de moi" et "Mot de passe oublié?" */}
            <Form.Item style={{ marginBottom: "24px" }}>
              <Row justify="space-between" align="middle" gutter={[0, 16]}>
                <Col
                  xs={{ span: 24, order: 1 }}
                  sm={{ span: 12, order: 1 }}
                  className="text-center sm:text-left"
                >
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox style={{ color: "#FFFFFF" }}>
                      Se souvenir de moi
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col
                  xs={{ span: 24, order: 2 }}
                  sm={{ span: 12, order: 2 }}
                  className="text-center sm:text-right"
                >
                  <a
                    href="/forgot-password"
                    style={{ color: "#FFFFFF", fontWeight: "500" }}
                  >
                    Mot de passe oublié ?
                  </a>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Se Connecter
              </Button>
            </Form.Item>
          </Form>

          {/* Lien "Pas de compte ? S'inscrire" */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <Text style={{ color: "#FFFFFF" }}>
              Pas de compte ?{" "}
              <a
                href="/register"
                style={{ color: "#FFFFFF", fontWeight: "bold" }}
              >
                S'inscrire
              </a>
            </Text>
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default Login;
