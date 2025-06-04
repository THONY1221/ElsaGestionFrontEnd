import React from "react";
import "./HomePage.css"; // We'll create this too
import { Link } from "react-router-dom"; // For navigation links
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Alert,
  Space,
  Tooltip,
} from "antd"; // Ant Design components
import {
  RocketOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  SolutionOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  DropboxOutlined,
  HomeOutlined,
  InteractionOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  ShopFilled,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
  FacebookFilled,
  LinkedinFilled,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const HomePage = () => {
  // Placeholder for announcements - this could come from an API or be hardcoded
  const announcements = [
    {
      id: 1,
      type: "info",
      message:
        "Bienvenue sur la nouvelle page d'accueil d'ELSA GESTION ! Explorez les nouvelles sections.",
      date: "2024-07-26",
    },
    {
      id: 2,
      type: "success",
      message:
        "Nouvelle fonctionnalité : Gestion des stocks améliorée disponible !",
      date: "2025-05-25",
    },
    {
      id: 3,
      type: "warning",
      message: "Maintenance prévue le 30 Juillet de 02:00 à 04:00 UTC.",
      date: "2024-07-23",
    },
  ];

  // Key modules (derived from App.js and existing HomePage)
  // Icons are examples, can be refined
  const modules = [
    {
      key: "commerciale",
      title: "Gestion Commerciale",
      description:
        "Pilotez vos ventes, achats, produits, clients, fournisseurs et bien plus.",
      icon: <RocketOutlined style={{ fontSize: "32px", color: "#1890ff" }} />,
      link: "/tableau-de-bord",
      subModules: [
        {
          name: "Tableau de Bord",
          path: "/tableau-de-bord",
          icon: <DashboardOutlined />,
        },
        {
          name: "Clients & Fournisseurs",
          path: "/gestion-entites/clients",
          icon: <TeamOutlined />,
        },
        {
          name: "Produits & Services",
          path: "/gestion-produits",
          icon: <ShopOutlined />,
        },
        {
          name: "Achats",
          path: "/gestion-achat",
          icon: <ShoppingCartOutlined />,
        },
        { name: "Ventes", path: "/gestion-vente", icon: <ShoppingOutlined /> },
        { name: "Stock", path: "/gestion-stock", icon: <DropboxOutlined /> },
      ],
    },
    {
      key: "production",
      title: "Gestion de Production",
      description:
        "Organisez et suivez vos processus de fabrication et vos unités de production.",
      icon: (
        <ExperimentOutlined style={{ fontSize: "32px", color: "#faad14" }} />
      ),
      link: "/production/process",
      subModules: [
        {
          name: "Unités de Production",
          path: "/production/units",
          icon: <HomeOutlined />,
        },
        {
          name: "Gérer la Production",
          path: "/production/process",
          icon: <InteractionOutlined />,
        },
        {
          name: "Historique",
          path: "/production/history",
          icon: <BarChartOutlined />,
        },
      ],
    },
    {
      key: "admin",
      title: "Administration",
      description:
        "Configurez la plateforme, gérez utilisateurs, rôles, et paramètres globaux.",
      icon: <SettingOutlined style={{ fontSize: "32px", color: "#52c41a" }} />,
      link: "/gestion-entreprises",
      subModules: [
        {
          name: "Entreprises",
          path: "/gestion-entreprises",
          icon: <GlobalOutlined />,
        },
        {
          name: "Utilisateurs",
          path: "/gestion-personnel",
          icon: <UserOutlined />,
        },
        { name: "Magasins", path: "/gestion-magasin", icon: <ShopFilled /> },
        {
          name: "Rôles & Permissions",
          path: "/gestion-roles-permissions",
          icon: <SolutionOutlined />,
        },
      ],
    },
  ];

  return (
    <div
      className="home-page-container"
      style={{ padding: "24px", background: "#fff" }}
    >
      {/* Hero Section */}
      <Row
        gutter={[16, 48]}
        justify="center"
        style={{
          marginBottom: "48px",
          textAlign: "center",
          padding: "40px 20px",
          background: "linear-gradient(135deg, #003366 0%, #0055a4 100%)",
          borderRadius: "8px",
        }}
      >
        <Col span={24}>
          <img
            src="/images/LOGO ELSA GESTION.png"
            alt="ELSA GESTION"
            style={{
              maxHeight: "120px",
              marginBottom: "20px",
              filter: "brightness(0) invert(1)",
            }}
          />
          <Title level={1} style={{ color: "#ffffff", marginBottom: "16px" }}>
            Bienvenue sur ELSA GESTION
          </Title>
          <Paragraph
            style={{
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.85)",
              maxWidth: "700px",
              margin: "0 auto 24px auto",
            }}
          >
            Votre solution intégrée pour une gestion d'entreprise simplifiée,
            efficace et performante. Découvrez comment ELSA peut transformer
            votre quotidien professionnel.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            style={{ background: "#ffa500", borderColor: "#ffa500" }}
          >
            <Link to="/tableau-de-bord" style={{ color: "#fff" }}>
              Commencer l'exploration
            </Link>
          </Button>
        </Col>
      </Row>

      {/* Platform Overview / Key Modules Section */}
      <section style={{ marginBottom: "48px" }}>
        <Title
          level={2}
          style={{
            textAlign: "center",
            marginBottom: "40px",
            color: "#003366",
          }}
        >
          Explorez les Capacités d'ELSA GESTION
        </Title>
        <Row gutter={[24, 24]} justify="center">
          {modules.map((module) => (
            <Col key={module.key} xs={24} sm={24} md={12} lg={8}>
              <Card
                hoverable
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
                bodyStyle={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  {module.icon}
                </div>
                <Title
                  level={4}
                  style={{ textAlign: "center", color: "#003366" }}
                >
                  {module.title}
                </Title>
                <Paragraph
                  style={{ textAlign: "center", flexGrow: 1, color: "#555" }}
                >
                  {module.description}
                </Paragraph>
                {module.subModules && module.subModules.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <Text
                      strong
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#003366",
                      }}
                    >
                      Points d'entrée rapides :
                    </Text>
                    <Row gutter={[8, 8]}>
                      {module.subModules.slice(0, 4).map((sm) => (
                        <Col span={12} key={sm.name}>
                          <Link
                            to={sm.path}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              color: "#1890ff",
                            }}
                          >
                            {sm.icon &&
                              React.cloneElement(sm.icon, {
                                style: { marginRight: "6px" },
                              })}
                            {sm.name}
                          </Link>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
                <Button type="default" block>
                  <Link to={module.link || "#"}>Explorer {module.title}</Link>
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* What's New / Announcements Section */}
      {announcements.length > 0 && (
        <section
          style={{
            marginBottom: "48px",
            background: "#f0f5ff",
            padding: "32px",
            borderRadius: "8px",
          }}
        >
          <Title
            level={2}
            style={{
              textAlign: "center",
              marginBottom: "32px",
              color: "#003366",
            }}
          >
            Dernières Nouvelles et Mises à Jour
          </Title>
          {announcements.map((ann) => (
            <Alert
              key={ann.id}
              message={<Text strong>{ann.message}</Text>}
              description={<Text type="secondary">Publié le: {ann.date}</Text>}
              type={ann.type}
              showIcon
              style={{ marginBottom: "16px", borderRadius: "6px" }}
              icon={
                ann.type === "info" ? (
                  <InfoCircleOutlined />
                ) : ann.type === "success" ? (
                  <BulbOutlined />
                ) : (
                  <ExperimentOutlined />
                )
              }
            />
          ))}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Button>
              <Link to="/annonces">Voir toutes les annonces</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Getting Started / Support Section */}
      <section
        style={{
          padding: "40px 20px",
          backgroundColor: "#003366",
          borderRadius: "8px",
          color: "#fff",
        }}
      >
        <Title
          level={2}
          style={{ textAlign: "center", marginBottom: "32px", color: "#fff" }}
        >
          Prêt à Démarrer ou Besoin d'Aide ?
        </Title>
        <Row gutter={[24, 24]} justify="center" align="stretch">
          <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                textAlign: "center",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              bordered={false}
            >
              <div>
                <BookOutlined
                  style={{
                    fontSize: "32px",
                    color: "#ffa500",
                    marginBottom: "16px",
                  }}
                />
                <Title level={4} style={{ color: "#fff" }}>
                  Guides & Tutoriels
                </Title>
                <Paragraph
                  style={{ color: "rgba(255,255,255,0.85)", minHeight: "70px" }}
                >
                  Consultez notre documentation pour maîtriser chaque
                  fonctionnalité.
                </Paragraph>
              </div>
              <Button
                type="primary"
                style={{ background: "#ffa500", borderColor: "#ffa500" }}
              >
                <Link to="/guides" style={{ color: "#fff" }}>
                  Voir les guides
                </Link>
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                textAlign: "center",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              bordered={false}
            >
              <div>
                <QuestionCircleOutlined
                  style={{
                    fontSize: "32px",
                    color: "#ffa500",
                    marginBottom: "16px",
                  }}
                />
                <Title level={4} style={{ color: "#fff" }}>
                  FAQ
                </Title>
                <Paragraph
                  style={{ color: "rgba(255,255,255,0.85)", minHeight: "70px" }}
                >
                  Trouvez des réponses rapides à vos questions les plus
                  fréquentes.
                </Paragraph>
              </div>
              <Button
                type="primary"
                style={{ background: "#ffa500", borderColor: "#ffa500" }}
              >
                <Link to="/faq" style={{ color: "#fff" }}>
                  Consulter la FAQ
                </Link>
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                textAlign: "center",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              bordered={false}
            >
              <div>
                <SolutionOutlined
                  style={{
                    fontSize: "32px",
                    color: "#ffa500",
                    marginBottom: "16px",
                  }}
                />
                <Title level={4} style={{ color: "#fff" }}>
                  Support Technique
                </Title>
                <Paragraph
                  style={{ color: "rgba(255,255,255,0.85)", minHeight: "70px" }}
                >
                  Notre équipe est là pour vous assister en cas de besoin
                  technique.
                </Paragraph>
              </div>
              <Button
                type="primary"
                style={{ background: "#ffa500", borderColor: "#ffa500" }}
              >
                <Link to="/support" style={{ color: "#fff" }}>
                  Contacter le Support
                </Link>
              </Button>
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default HomePage;
