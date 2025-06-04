import React from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Breadcrumb,
  Button,
  Space,
  Tooltip,
} from "antd";
import {
  HomeOutlined,
  MailOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
  FacebookFilled,
  LinkedinFilled,
  GlobalOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./SupportPage.css"; // We will create this CSS file shortly

const { Title, Paragraph, Text } = Typography;

const SupportPage = () => {
  return (
    <div
      className="support-page-container"
      style={{
        padding: "24px",
        background: "#f0f2f5",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Breadcrumb style={{ marginBottom: "24px" }}>
        <Breadcrumb.Item>
          <Link to="/">
            <HomeOutlined />
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Support Technique</Breadcrumb.Item>
      </Breadcrumb>

      <Row justify="center">
        <Col xs={24} md={20} lg={16} xl={12}>
          <Card
            style={{
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <InfoCircleOutlined
                style={{
                  fontSize: "48px",
                  color: "#0055a4",
                  marginBottom: "16px",
                }}
              />
              <Title
                level={2}
                style={{ color: "#003366", marginBottom: "10px" }}
              >
                Contactez Notre Support Technique
              </Title>
              <Paragraph
                style={{
                  fontSize: "16px",
                  color: "#595959",
                  maxWidth: "700px",
                  margin: "0 auto",
                }}
              >
                Notre équipe d'experts est à votre disposition pour répondre à
                toutes vos questions, vous aider à résoudre les problèmes
                techniques, et recueillir vos précieuses suggestions pour
                améliorer continuellement ELSA GESTION.
              </Paragraph>
            </div>

            <Row
              gutter={[32, 32]}
              justify="center"
              style={{ marginBottom: "40px" }}
            >
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="contact-card"
                  style={{ textAlign: "center" }}
                >
                  <MailOutlined
                    style={{
                      fontSize: "32px",
                      color: "#0055a4",
                      marginBottom: "15px",
                    }}
                  />
                  <Title level={4} className="contact-card-title">
                    Par Email
                  </Title>
                  <Paragraph>
                    <a
                      href="mailto:info@elsa-technologies.com"
                      className="contact-link"
                    >
                      info@elsa-technologies.com
                    </a>
                  </Paragraph>
                  <Text type="secondary">
                    Réponse généralement sous 24h ouvrées.
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="contact-card"
                  style={{ textAlign: "center" }}
                >
                  <PhoneOutlined
                    style={{
                      fontSize: "32px",
                      color: "#0055a4",
                      marginBottom: "15px",
                    }}
                  />
                  <Title level={4} className="contact-card-title">
                    Par Téléphone
                  </Title>
                  <Paragraph>
                    <a href="tel:+22664989099" className="contact-link">
                      +226 64 98 90 99
                    </a>
                  </Paragraph>
                  <Text type="secondary">
                    Du Lundi au Vendredi, 08h-18h (GMT).
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="contact-card"
                  style={{ textAlign: "center" }}
                >
                  <WhatsAppOutlined
                    style={{
                      fontSize: "32px",
                      color: "#25D366",
                      marginBottom: "15px",
                    }}
                  />
                  <Title level={4} className="contact-card-title">
                    Via WhatsApp
                  </Title>
                  <Paragraph>
                    <a
                      href="https://wa.me/22664989099"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link"
                    >
                      +226 64 98 90 99
                    </a>
                  </Paragraph>
                  <Text type="secondary">Pour une assistance rapide.</Text>
                </Card>
              </Col>
            </Row>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <Title
                level={3}
                style={{ color: "#003366", marginBottom: "20px" }}
              >
                Suivez-nous et Restez Informé
              </Title>
              <Space size={40}>
                <Tooltip title="Facebook ELSA Technologies">
                  <a
                    href="https://web.facebook.com/ElsaTechno"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <FacebookFilled
                      style={{ fontSize: "40px", color: "#3b5998" }}
                    />
                  </a>
                </Tooltip>
                <Tooltip title="LinkedIn (Bientôt disponible)">
                  <LinkedinFilled style={{ fontSize: "40px", color: "#ccc" }} />
                </Tooltip>
                <Tooltip title="Notre Site Web ELSA GESTION">
                  <a
                    href="http://www.elsa-gestion.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <GlobalOutlined
                      style={{ fontSize: "40px", color: "#0077b5" }}
                    />
                  </a>
                </Tooltip>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupportPage;
