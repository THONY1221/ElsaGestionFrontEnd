import React from "react";
import { useAuth } from "./context/AuthContext";
import { Typography, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

const LeftSideNav = () => {
  const { user } = useAuth();

  if (!user) {
    // Shouldn't happen within ProtectedRoute, but good practice
    return null;
  }

  // Determine the display name (adjust if user object structure differs)
  const displayName = user.name || "Utilisateur";
  // Determine the role name (adjust if user object structure differs - e.g., user.role_name)
  const roleName = user.role || "Rôle inconnu";

  const displayText = `${displayName} - [${roleName}]`;

  return (
    <div
      className="left-nav flex items-center justify-start gap-2 border border-gray-300 rounded-md bg-white p-2 h-auto min-h-[40px] 
                 text-sm sm:text-sm w-full sm:w-auto"
    >
      <Avatar size="small" icon={<UserOutlined />} className="flex-shrink-0" />
      <Text ellipsis title={displayText} className="font-medium text-gray-700">
        {displayText}
      </Text>
    </div>
  );
};

export default LeftSideNav;
