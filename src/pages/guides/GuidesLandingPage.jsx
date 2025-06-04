import React from "react";
import { Link } from "react-router-dom";
import { Card, Row, Col, Typography, Breadcrumb, Button } from "antd";
import {
  PlayCircleOutlined,
  BookOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ExperimentOutlined,
  ToolOutlined,
  HomeOutlined,
  ReadOutlined,
  WalletOutlined,
  ShopOutlined,
  AuditOutlined,
  DollarCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import "./GuidesPage.css"; // We will create this CSS file later

const { Title, Paragraph } = Typography;

const guideCategories = [
  {
    key: "premiers-pas",
    title: "Premiers Pas avec ELSA GESTION",
    description:
      "Configurez votre compte, découvrez l'interface et les fonctionnalités de base.",
    icon: <PlayCircleOutlined style={{ fontSize: "32px", color: "#0055a4" }} />,
    link: "/guides/premiers-pas",
  },
  {
    key: "gestion-commerciale",
    title: "Maîtriser la Gestion Commerciale",
    description:
      "Gérez clients, fournisseurs, produits, achats, ventes, stocks et plus encore.",
    icon: (
      <ShoppingCartOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
    ),
    link: "/guides/gestion-commerciale",
  },
  {
    key: "gestion-production",
    title: "Gestion de Production Industrielle",
    description:
      "Définissez vos unités de production, transformez vos matières premières et suivez votre historique.",
    icon: <ExperimentOutlined style={{ fontSize: "32px", color: "#faad14" }} />,
    link: "/guides/gestion-production",
  },
  {
    key: "gestion-financiere",
    title: "Gestion Financière et Paiements",
    description:
      "Suivez vos flux de trésorerie, gérez les paiements clients et fournisseurs.",
    icon: <WalletOutlined style={{ fontSize: "32px", color: "#faad14" }} />,
    link: "/guides/gestion-financiere",
  },
  {
    key: "gestion-operationnelle",
    title: "Gestion Opérationnelle & Caisse",
    description: "Point de Vente, Trésorerie détaillée et suivi des Dépenses.",
    icon: <AuditOutlined style={{ fontSize: "32px", color: "#722ed1" }} />,
    subGuides: [
      {
        key: "point-de-vente",
        title: "Point de Vente (POS)",
        description:
          "Réalisez vos ventes en magasin rapidement et efficacement.",
        icon: <ShopOutlined style={{ fontSize: "24px", color: "#13c2c2" }} />,
        link: "/guides/point-de-vente",
      },
      {
        key: "gestion-tresorerie",
        title: "Gestion de la Trésorerie",
        description:
          "Suivez vos flux de caisse, banque et mobile money en détail.",
        icon: <WalletOutlined style={{ fontSize: "24px", color: "#faad14" }} />,
        link: "/guides/gestion-tresorerie",
      },
      {
        key: "gestion-depenses",
        title: "Suivi des Dépenses",
        description:
          "Enregistrez et catégorisez toutes les dépenses de votre entreprise.",
        icon: (
          <DollarCircleOutlined
            style={{ fontSize: "24px", color: "#eb2f96" }}
          />
        ),
        link: "/guides/gestion-depenses",
      },
    ],
  },
  {
    key: "administration",
    title: "Administration de la Plateforme",
    description:
      "Gérez les utilisateurs, les entreprises, les rôles, permissions et autres paramètres globaux.",
    icon: <SettingOutlined style={{ fontSize: "32px", color: "#52c41a" }} />,
    link: "/guides/administration",
  },
  {
    key: "ecommerce-et-futur",
    title: "E-commerce & Modules Futurs",
    description:
      "Découvrez notre futur module E-commerce (en développement) et d'autres fonctionnalités à venir.",
    icon: <GlobalOutlined style={{ fontSize: "32px", color: "#eb2f96" }} />,
    link: "/guides/ecommerce-futur",
  },
  {
    key: "trucs-astuces",
    title: "Trucs et Astuces",
    description:
      "Conseils pratiques pour gagner du temps et utiliser ELSA GESTION comme un pro.",
    icon: <ReadOutlined style={{ fontSize: "32px", color: "#722ed1" }} />,
    link: "/guides/trucs-astuces",
  },
];

const GuidesLandingPage = () => {
  return (
    <div
      className="guides-landing-page"
      style={{ padding: "24px", background: "#fff" }}
    >
      <Breadcrumb style={{ marginBottom: "24px" }}>
        <Breadcrumb.Item>
          <Link to="/">
            <HomeOutlined />
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Guides & Tutoriels</Breadcrumb.Item>
      </Breadcrumb>

      <Title
        level={2}
        style={{ textAlign: "center", marginBottom: "16px", color: "#003366" }}
      >
        Bienvenue dans les Guides & Tutoriels ELSA GESTION
      </Title>
      <Paragraph
        style={{
          textAlign: "center",
          fontSize: "16px",
          marginBottom: "40px",
          maxWidth: "800px",
          margin: "0 auto 40px auto",
        }}
      >
        Trouvez ici toutes les informations pour maîtriser chaque aspect de
        notre plateforme. Que vous soyez débutant ou utilisateur avancé, ces
        guides sont conçus pour vous.
      </Paragraph>

      <Row gutter={[24, 24]} justify="center">
        {guideCategories.map((category) => {
          if (category.subGuides && category.subGuides.length > 0) {
            return (
              <Col
                span={24}
                key={category.key}
                style={{ marginBottom: "20px" }}
              >
                <Card
                  style={{
                    background: "#fff",
                    borderRadius: "8px",
                    padding: "10px 0",
                  }}
                  bordered={false}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "20px",
                      paddingLeft: "24px",
                    }}
                  >
                    {category.icon}
                    <Title
                      level={3}
                      style={{ marginLeft: "16px", marginBottom: "0" }}
                    >
                      {category.title}
                    </Title>
                  </div>
                  <Paragraph
                    style={{
                      marginLeft: "60px",
                      marginRight: "24px",
                      marginTop: "-15px",
                      marginBottom: "25px",
                    }}
                  >
                    {category.description}
                  </Paragraph>
                  <Row gutter={[16, 16]} style={{ padding: "0 24px" }}>
                    {category.subGuides.map((subGuide) => (
                      <Col xs={24} sm={12} md={8} key={subGuide.key}>
                        <Link to={subGuide.link}>
                          <Card hoverable className="guide-category-card">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "12px",
                              }}
                            >
                              {subGuide.icon}
                              <Title
                                level={5}
                                style={{
                                  marginLeft: "10px",
                                  marginBottom: "0",
                                }}
                              >
                                {subGuide.title}
                              </Title>
                            </div>
                            <Paragraph
                              style={{
                                fontSize: "14px",
                                color: "#595959",
                                minHeight: "40px",
                              }}
                            >
                              {subGuide.description}
                            </Paragraph>
                            <Button
                              type="primary"
                              ghost
                              style={{ marginTop: "auto" }}
                            >
                              Consulter le guide
                            </Button>
                          </Card>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            );
          } else {
            return (
              <Col xs={24} sm={12} md={8} key={category.key}>
                <Link to={category.link}>
                  <Card hoverable className="guide-category-card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      {category.icon}
                      <Title
                        level={4}
                        style={{ marginLeft: "10px", marginBottom: "0" }}
                      >
                        {category.title}
                      </Title>
                    </div>
                    <Paragraph
                      style={{
                        fontSize: "14px",
                        color: "#595959",
                        minHeight: "60px",
                      }}
                    >
                      {category.description}
                    </Paragraph>
                    <Button type="primary" style={{ marginTop: "auto" }}>
                      Consulter le guide
                    </Button>
                  </Card>
                </Link>
              </Col>
            );
          }
        })}
      </Row>
    </div>
  );
};

export default GuidesLandingPage;
