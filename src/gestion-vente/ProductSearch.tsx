import React, { useState, useCallback } from "react";
import { Input, Spin, AutoComplete } from "antd";
import { debounce } from "lodash";
import { Search } from "lucide-react";

interface Product {
  id_produit: number;
  nom_produit: string;
  prix_vente: number;
  code_barre?: string;
  quantite_stock?: number;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  api: {
    fetchProduits: (params: any) => Promise<any>;
  };
  warehouse?: number | null;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onSelect,
  api,
  warehouse,
}) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const params: any = { search: value };
        if (warehouse) {
          params.warehouse = warehouse;
          console.log(`Recherche de produits pour le magasin ${warehouse}`);
        }
        const response = await api.fetchProduits(params);

        // Logs détaillés pour le débogage
        console.log("Réponse brute de l'API produits:", response);
        console.log(
          "Structure de response.data:",
          response.data ? typeof response.data : "undefined"
        );

        if (response.data) {
          console.log("Nombre de produits récupérés:", response.data.length);
          if (response.data.length > 0) {
            console.log("Exemple de produit:", response.data[0]);
          } else {
            console.log(
              "Aucun produit trouvé pour ce magasin et cette recherche"
            );
          }

          const formattedOptions = response.data.map((item: any) => {
            // Normalisation des attributs du produit pour s'adapter à diverses structures de données
            const product: Product = {
              id_produit: item.id_produit || item.id || item.product_id,
              nom_produit:
                item.nom_produit ||
                item.name ||
                item.product_name ||
                "Produit inconnu",
              prix_vente:
                typeof item.prix_vente === "number"
                  ? item.prix_vente
                  : typeof item.sales_price === "number"
                  ? item.sales_price
                  : typeof item.unit_price === "number"
                  ? item.unit_price
                  : 0,
              quantite_stock:
                typeof item.quantite_stock === "number"
                  ? item.quantite_stock
                  : typeof item.current_stock === "number"
                  ? item.current_stock
                  : typeof item.quantity === "number"
                  ? item.quantity
                  : undefined,
              code_barre: item.code_barre || item.barcode || item.item_code,
            };

            // Log pour voir le produit normalisé
            console.log("Produit normalisé:", product);

            return {
              value: product.id_produit,
              label: (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{product.nom_produit}</div>
                    {product.quantite_stock !== undefined && (
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        Stock: {product.quantite_stock}
                      </div>
                    )}
                  </div>
                  <div style={{ color: "#52c41a", fontWeight: 500 }}>
                    {product.prix_vente.toLocaleString()} CFA
                  </div>
                </div>
              ),
              product,
            };
          });

          console.log("Options formatées:", formattedOptions);
          setOptions(formattedOptions);
        }
      } catch (error) {
        console.error("Erreur recherche produits:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [api, warehouse]
  );

  const handleSearch = (value: string) => {
    searchProducts(value);
  };

  const handleSelect = (_: string, option: any) => {
    onSelect(option.product);
  };

  return (
    <AutoComplete
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      notFoundContent={
        loading ? (
          <Spin size="small" />
        ) : (
          "Aucun produit trouvé. Essayez un autre terme."
        )
      }
      style={{ width: "100%" }}
    >
      <Input
        placeholder="Rechercher un produit par nom ou code-barres..."
        suffix={loading ? <Spin size="small" /> : <Search />}
        onPressEnter={(e) => {
          const value = (e.target as HTMLInputElement).value;
          if (value.trim()) {
            searchProducts(value);
          }
        }}
      />
    </AutoComplete>
  );
};

export default ProductSearch;
