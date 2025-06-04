// Fonction pour formater les nombres
export const formatNumber = (value: number): string =>
  Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
