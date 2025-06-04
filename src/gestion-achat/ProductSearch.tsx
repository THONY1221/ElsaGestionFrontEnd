import React, { useState, useCallback } from "react";
import { Input, Spin, AutoComplete } from "antd";
import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useSelection } from "../SelectionContext";

interface Product {
  id: number;
  name: string;
  purchase_price?: number;
  current_stock?: number;
  code_barre?: string;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  api: {
    fetchProduits: (params: any) => Promise<any>;
  };
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onSelect, api }) => {
  const { selectedWarehouse } = useSelection();
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setOptions([]);
        return;
      }
      // Seul le magasin sélectionné doit être pris en compte
      if (!selectedWarehouse) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await api.fetchProduits({
          search: value,
          warehouse: selectedWarehouse,
        });
        const productsArray: Product[] = response.data || [];
        const formattedOptions = productsArray.map((product: Product) => ({
          value: product.id,
          label: (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{product.name}</span>
              <span style={{ color: "#6b7280" }}>
                Stock:{" "}
                {product.current_stock !== undefined
                  ? product.current_stock
                  : "0"}{" "}
                - Achat:{" "}
                {product.purchase_price !== undefined
                  ? product.purchase_price.toLocaleString()
                  : "0"}{" "}
                CFA
              </span>
            </div>
          ),
          product,
        }));
        setOptions(formattedOptions);
      } catch (error) {
        console.error("Erreur recherche produits:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [api, selectedWarehouse]
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
      style={{ width: "100%" }}
      notFoundContent={loading ? <Spin size="small" /> : "Aucun produit trouvé"}
    >
      <Input
        placeholder="Rechercher un produit..."
        prefix={<Search className="h-4 w-4 text-gray-400" />}
        suffix={loading && <Spin size="small" />}
      />
    </AutoComplete>
  );
};

export default ProductSearch;
