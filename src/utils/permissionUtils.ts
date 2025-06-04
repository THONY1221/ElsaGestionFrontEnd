/**
 * Utilitaires pour la gestion des permissions
 */
import { useAuth } from "../context/AuthContext";

/**
 * Hook personnalisé qui retourne une fonction de vérification de permission.
 * À utiliser dans les composants fonctionnels React.
 *
 * @returns Une fonction qui prend une permission et retourne un booléen
 */
export function usePermission() {
  // @ts-ignore - Ignorer les vérifications de type pour useAuth
  const auth = useAuth();

  return (permission: string): boolean => {
    if (!auth) return false;

    // @ts-ignore - Ignorer les vérifications de type
    if (typeof auth.hasPermission !== "function") return false;

    // @ts-ignore - Ignorer les vérifications de type
    return auth.hasPermission(permission);
  };
}

/**
 * Fonction utilitaire pour vérifier une permission en dehors d'un composant React.
 * Elle prend directement l'objet auth en paramètre.
 *
 * @param auth - L'objet d'authentification obtenu via useAuth()
 * @param permission - La clé de permission à vérifier
 * @returns boolean - true si l'utilisateur a la permission, false sinon
 */
export function isPermissionAllowed(auth: any, permission: string): boolean {
  if (!auth) return false;

  if (typeof auth.hasPermission !== "function") return false;

  return auth.hasPermission(permission);
}
