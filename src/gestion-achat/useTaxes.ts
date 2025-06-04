import { useState, useEffect } from "react";

interface Tax {
  id: number;
  code: string;
  name: string;
  rate: number;
  description?: string;
  status: string;
  company_id: number;
  parent_id?: number;
  effective_date?: string;
  created_at: string;
  updated_at: string;
  company_name?: string;
  parent_tax_name?: string;
}

interface UseTaxesOptions {
  companyId?: number | null;
}

export const useTaxes = (api: any, options: UseTaxesOptions = {}) => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { companyId } = options;

  useEffect(() => {
    const loadTaxes = async () => {
      // Si aucune entreprise n'est sélectionnée, ne pas charger les taxes
      if (!companyId) {
        console.log(
          "Aucune entreprise sélectionnée, aucun chargement de taxes"
        );
        setTaxes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log(`Chargement des taxes pour l'entreprise ${companyId}`);
        const response = await api.fetchTaxes(companyId);
        setTaxes(response); // La réponse est déjà le tableau de taxes
        console.log(
          `${response.length} taxes chargées pour l'entreprise ${companyId}`
        );
      } catch (err) {
        setError("Erreur lors du chargement des taxes");
        console.error("Erreur taxes:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTaxes();
  }, [api, companyId]); // Ajouter companyId aux dépendances

  return { taxes, loading, error };
};

export default useTaxes;
