import { supabase } from "../supabaseClient";

// API pour les entreprises/companies
export const companiesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("status", "active");
    if (error) throw error;
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (company) => {
    const { data, error } = await supabase
      .from("companies")
      .insert([company])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
  },
};

// API pour les entrepôts/warehouses
export const warehousesApi = {
  getByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true);
    if (error) throw error;
    return data;
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;
    return data;
  },
};

// API pour les produits
export const productsApi = {
  getByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (id, name),
        brands (id, name),
        product_details (*)
      `
      )
      .eq("company_id", companyId)
      .eq("status", "active");
    if (error) throw error;
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (id, name),
        brands (id, name),
        product_details (*)
      `
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (product) => {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  search: async (companyId, searchTerm) => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (id, name),
        brands (id, name),
        product_details (*)
      `
      )
      .eq("company_id", companyId)
      .eq("status", "active")
      .or(`name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%`);
    if (error) throw error;
    return data;
  },
};

// API pour les catégories
export const categoriesApi = {
  getByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  },

  create: async (category) => {
    const { data, error } = await supabase
      .from("categories")
      .insert([category])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

// API pour les utilisateurs (clients/fournisseurs)
export const usersApi = {
  getByCompanyAndType: async (companyId, userType) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("company_id", companyId)
      .eq("user_type", userType)
      .eq("status", "active");
    if (error) throw error;
    return data;
  },

  create: async (user) => {
    const { data, error } = await supabase
      .from("users")
      .insert([user])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },
};

// API pour les commandes/ventes
export const ordersApi = {
  getByCompany: async (companyId, orderType = "sales") => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        users (id, name),
        warehouses (id, name),
        order_items (
          *,
          products (id, name)
        )
      `
      )
      .eq("company_id", companyId)
      .eq("order_type", orderType)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  create: async (order) => {
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select();
    if (error) throw error;
    return data[0];
  },

  addItems: async (orderItems) => {
    const { data, error } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();
    if (error) throw error;
    return data;
  },
};

// API pour les modes de paiement
export const paymentModesApi = {
  getByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from("payment_modes")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  },
};

// API pour les devises
export const currenciesApi = {
  getByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  },
};
