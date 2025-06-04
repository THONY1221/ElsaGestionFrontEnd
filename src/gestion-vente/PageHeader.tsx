import React from "react";
import { Typography, Breadcrumb } from "antd";

const { Title } = Typography;

// Définition des props avec la propriété style ajoutée
export interface CustomPageHeaderProps {
  title: string;
  subTitle?: string;
  style?: React.CSSProperties; // Ajout de la prop style
}

const CustomPageHeader: React.FC<CustomPageHeaderProps> = ({
  title,
  subTitle,
  style,
}) => {
  return (
    <div style={style}>
      <Title level={2}>{title}</Title>
      {subTitle && (
        <Breadcrumb>
          <Breadcrumb.Item>{subTitle}</Breadcrumb.Item>
        </Breadcrumb>
      )}
    </div>
  );
};

export default CustomPageHeader;
