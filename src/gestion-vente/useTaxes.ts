import { useState, useEffect } from "react";

interface Tax {
  ID: number;
  name: string;
  taux: number;
}

export const useTaxes = (api: any) => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaxes = async () => {
      setLoading(true);
      try {
        const response = await api.fetchTaxes();
        setTaxes(response); // La réponse est déjà le tableau de taxes
      } catch (err) {
        setError("Erreur lors du chargement des taxes");
        console.error("Erreur taxes:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTaxes();
  }, [api]);

  return { taxes, loading, error };
};

export default useTaxes;
