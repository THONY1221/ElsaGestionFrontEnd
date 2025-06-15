import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import apiClient, { API_BASE_URL } from "../config/api";

// 1. Créer le contexte
const AuthContext = createContext(null);

// 2. Créer le Provider
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Stockera l'objet utilisateur complet (incl. assigned_warehouses)
  const [token, setToken] = useState(localStorage.getItem("authToken")); // Initialiser depuis localStorage
  const [isLoading, setIsLoading] = useState(true); // Pour gérer le chargement initial
  // Use a ref to store last refresh timestamp to avoid effect dependency loops
  const lastRefreshTimestampRef = useRef(0);

  // Fonction de déconnexion (déplacée ici pour être accessible par les hooks ci-dessous)
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log("AuthContext: User logged out");
    // La redirection sera gérée par le composant qui appelle logout ou par ProtectedRoute
  }, []); // Ajout des dépendances vides car elle ne dépend de rien dans ce scope

  // Log user state on every render to track changes
  useEffect(() => {
    console.log("[AuthContext Render] User state:", user);
    console.log(
      "[AuthContext Render] Assigned Warehouses:",
      user?.assigned_warehouses
    );
  }, [user]);

  // Fonction pour rafraîchir les permissions de l'utilisateur
  const refreshUserPermissions = useCallback(
    async (force = false) => {
      console.log("[refreshUserPermissions] Called with force =", force);
      if (!token || !user || !user.id) {
        console.log(
          "[refreshUserPermissions] Aborting: Missing token, user, or user.id"
        );
        return;
      }

      const now = Date.now();
      if (!force && now - lastRefreshTimestampRef.current < 60000) {
        console.debug(
          "Skipping permission refresh - too soon since last refresh"
        );
        return;
      }

      console.log(
        "[refreshUserPermissions] Fetching permissions for user:",
        user.id
      );

      try {
        const response = await apiClient.get(
          `/api/users/${user.id}/permissions`
        );

        const data = response.data;
        const updatedPermissions = data.permissions || data;

        console.log(
          "[refreshUserPermissions] Fetched permissions:",
          updatedPermissions
        );

        const currentPermissionsArray = Array.isArray(user.permissions)
          ? [...user.permissions].sort()
          : [];
        const updatedPermissionsArray = Array.isArray(updatedPermissions)
          ? [...updatedPermissions].sort()
          : [];

        const currentPermissionsString = JSON.stringify(
          currentPermissionsArray
        );
        const updatedPermissionsString = JSON.stringify(
          updatedPermissionsArray
        );

        if (updatedPermissionsString !== currentPermissionsString) {
          console.log(
            "[refreshUserPermissions] Permissions differ! Updating state."
          );
          const updatedUser = {
            ...user,
            permissions: updatedPermissionsArray,
          };
          setUser(updatedUser);
          localStorage.setItem("userData", JSON.stringify(updatedUser));
          console.log(
            "[refreshUserPermissions] setUser called with:",
            updatedUser
          );
        } else {
          console.log(
            "[refreshUserPermissions] Permissions are the same. No update needed."
          );
        }

        lastRefreshTimestampRef.current = now;
      } catch (error) {
        console.error(
          "[refreshUserPermissions] Error fetching/processing permissions:",
          error
        );
        // If permissions fetch fails due to auth/not found, logout
        if (
          error.response &&
          (error.response.status === 401 ||
            error.response.status === 403 ||
            error.response.status === 404)
        ) {
          console.warn(
            "[refreshUserPermissions] Auth error or user not found, logging out."
          );
          logout();
        }
      }
    },
    [token, user, logout] // Ajout de logout aux dépendances
  );

  // **MODIFIED Fonction pour rafraîchir le statut ET les assignations de l'utilisateur**
  const refreshUserStatus = useCallback(async () => {
    // Capture the current user state at the beginning of the callback
    const currentUser = user;

    console.log("[refreshUserStatus] Called");
    if (!token || !currentUser || !currentUser.id) {
      console.log(
        "[refreshUserStatus] Aborting: Missing token or current user/ID in state at call time.",
        { hasToken: !!token, currentUser }
      );
      return;
    }

    const userIdToFetch = currentUser.id; // Use the ID from the captured state
    console.log(
      `[refreshUserStatus] Fetching status and assignments for user ID: ${userIdToFetch}`
    );

    try {
      const response = await apiClient.get(`/api/users/${userIdToFetch}`);

      const fetchedUserData = response.data;
      console.log(
        `[refreshUserStatus] Fetched user data for User ID ${userIdToFetch}:`,
        fetchedUserData
      );

      // **Crucial Check:** Verify the fetched ID matches the requested ID
      if (fetchedUserData.id !== userIdToFetch) {
        console.error(
          `[refreshUserStatus] Mismatched IDs! Requested ${userIdToFetch}, but received ${fetchedUserData.id}. Aborting state update.`
        );
        // Optionally logout here as this indicates a serious backend/request issue
        // logout();
        return;
      }

      // Vérifier si le statut est 'disabled'
      if (fetchedUserData && fetchedUserData.status === "disabled") {
        console.warn(
          `[refreshUserStatus] User status is 'disabled' for User ID ${userIdToFetch}. Logging out.`
        );
        logout(); // Déconnecter l'utilisateur si son compte est désactivé
        return; // Stop further processing if logging out
      }

      // --- Update User State with specific fields ---
      // Create a new user object based on the *captured* currentUser state
      // Only update specific fields from fetchedUserData that are expected to change
      const updatedUserObject = {
        ...currentUser, // Start with the state when the function was called
        status: fetchedUserData.status, // Update status
        role: fetchedUserData.role_name, // *** ADDED: Update role name ***
        assigned_warehouses: Array.isArray(fetchedUserData.assigned_warehouses) // Update assignments
          ? fetchedUserData.assigned_warehouses
          : [],
        // Add any other fields that *should* be refreshed from the /api/users/:id endpoint
        // For example: name, phone, address, if they can be changed elsewhere and need refreshing
        name: fetchedUserData.name,
        phone: fetchedUserData.phone,
        address: fetchedUserData.address,
        // DO NOT update: id, email (usually static)
        // DO NOT update: role_id (role_name is sufficient for display)
        // DO NOT update: permissions (handled by refreshUserPermissions)
        // Keep is_superadmin consistent with fetched data if available, fallback to current
        is_superadmin:
          fetchedUserData.is_superadmin !== undefined
            ? fetchedUserData.is_superadmin
            : currentUser.is_superadmin,
      };

      // Compare the *newly constructed* object with the *captured* state
      if (JSON.stringify(updatedUserObject) !== JSON.stringify(currentUser)) {
        console.log(
          `[refreshUserStatus] User data changed for User ID ${userIdToFetch}, updating state and localStorage.`
        );
        setUser(updatedUserObject); // Update state with the carefully constructed object
        localStorage.setItem("userData", JSON.stringify(updatedUserObject));
      } else {
        console.log(
          `[refreshUserStatus] User data is the same for User ID ${userIdToFetch}. No update needed.`
        );
      }
      // --- End Update User State ---
    } catch (error) {
      // Avoid logging out if the error is just an AbortError from fetch cancellation
      if (error.name !== "AbortError") {
        console.error(
          `[refreshUserStatus] Error fetching/processing status for User ID ${userIdToFetch}:`,
          error
        );
        // Optional: Consider logging out on persistent errors
        // logout();
      }
    }
  }, [token, user, logout]); // Keep dependencies: token, user (to get latest user state), logout

  // Effet pour vérifier le token au chargement initial
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUserData = localStorage.getItem("userData");

    if (storedToken && storedUserData) {
      try {
        const parsedUser = JSON.parse(storedUserData);
        // Ensure assigned_warehouses is an array, default to empty if missing/null
        parsedUser.assigned_warehouses = Array.isArray(
          parsedUser.assigned_warehouses
        )
          ? parsedUser.assigned_warehouses
          : [];
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("AuthContext: User loaded from localStorage", parsedUser);
      } catch (error) {
        console.error(
          "AuthContext: Error parsing user data from localStorage",
          error
        );
        logout(); // Nettoyer si erreur
      }
    }
    setIsLoading(false); // Fin du chargement initial
  }, [logout]); // Ajout de logout aux dépendances

  // Configurer un intervalle pour rafraîchir périodiquement les permissions ET le statut
  useEffect(() => {
    if (isAuthenticated && token && user?.id) {
      // Rafraîchir immédiatement au démarrage
      refreshUserPermissions(true);
      refreshUserStatus(); // Vérifier le statut au démarrage aussi

      // Puis mettre en place un intervalle de rafraîchissement (ex: toutes les 5 minutes)
      const interval = setInterval(() => {
        console.log("[Interval] Refreshing permissions and status...");
        refreshUserPermissions();
        refreshUserStatus();
      }, 300000); // 300000 ms = 5 minutes

      // Nettoyer l'intervalle lors du démontage ou de la déconnexion
      return () => clearInterval(interval);
    }
  }, [
    isAuthenticated,
    token,
    user?.id,
    refreshUserPermissions,
    refreshUserStatus,
  ]); // <- Ajout de refreshUserStatus

  // Fonction de connexion
  const login = (newToken, userData) => {
    // Ensure assigned_warehouses is an array, default to empty if missing/null
    const userDataWithDefaults = {
      ...userData,
      assigned_warehouses: Array.isArray(userData.assigned_warehouses)
        ? userData.assigned_warehouses
        : [],
    };
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("userData", JSON.stringify(userDataWithDefaults));
    setToken(newToken);
    setUser(userDataWithDefaults);
    setIsAuthenticated(true);
    console.log("AuthContext: User logged in", userDataWithDefaults);
  };

  // La fonction logout est maintenant définie plus haut avec useCallback

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permissionKey) => {
    if (!user || !user.permissions) return false;
    if (!Array.isArray(user.permissions)) {
      console.warn(
        "AuthContext: user.permissions is not an array",
        user.permissions
      );
      return false;
    }
    const hasExact = user.permissions.includes(permissionKey);
    console.debug(`Permission check for "${permissionKey}": ${hasExact}`);
    return hasExact;
  };

  // Valeur fournie par le contexte
  const value = {
    isAuthenticated,
    user, // user object now contains assigned_warehouses
    token,
    isLoading,
    login,
    logout,
    hasPermission,
    refreshUserPermissions,
    refreshUserStatus, // <- Exposer la nouvelle fonction (optionnel)
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// 3. Créer un hook custom pour utiliser le contexte facilement
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
