import axios from "axios";

/**
 * Génère un code-barres unique de 10 chiffres
 * Vérifie que le code n'existe pas déjà dans la base de données
 */
export async function generateBarcode(): Promise<string> {
  try {
    // Générer un nombre aléatoire de 10 chiffres
    const generateNumber = () => {
      const min = 1000000000; // 10 chiffres minimum
      const max = 9999999999; // 10 chiffres maximum
      return Math.floor(Math.random() * (max - min + 1) + min).toString();
    };

    let isUnique = false;
    let barcode = "";

    // Essayer jusqu'à trouver un code unique
    while (!isUnique) {
      barcode = generateNumber();

      // Vérifier si le code existe déjà dans la base de données
      const response = await axios.get(
        `http://localhost:3000/api/produits/check-barcode/${barcode}`
      );

      if (!response.data.exists) {
        isUnique = true;
      }
    }

    return barcode;
  } catch (error) {
    console.error("Erreur lors de la génération du code-barres:", error);
    throw new Error("Impossible de générer un code-barres unique");
  }
}

/**
 * Valide le format d'un code-barres
 * @param barcode Le code-barres à valider
 * @returns true si le format est valide
 */
export function validateBarcode(barcode: string): boolean {
  // Vérifier que le code fait exactement 10 chiffres
  return /^\d{10}$/.test(barcode);
}
