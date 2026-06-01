export interface Lead {
  id: number;
  client_name: string;
  phone: string;
  source: string;
  status: string;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  source: string;
  status: string;
  comment: string | null;
  lead_id: number | null;
  created_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_date: string | null;
  comment: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  client_id: number;
  product_type: string;
  technical_spec: string | null;
  price: number;
  paid_amount: number;
  status: string;
  delivery_date: string | null;
  installation_date: string | null;
  created_at: string;
  client_name?: string | null;
  remaining_balance: number;
  payment_status: string;
  payments: Payment[];
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  assigned_to: string;
  order_id: number | null;
  created_at: string;
  order_product_type?: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Material {
  id: number;
  name: string;
  sku: string | null;
  unit: string;
  price: number;
  created_at: string;
}

export interface SupplyRequest {
  id: number;
  order_id: number;
  material_id: number;
  quantity: number;
  actual_price: number;
  status: string;
  delivery_date: string | null;
  created_at: string;
  material_name?: string | null;
  order_product_type?: string | null;
  client_name?: string | null;
}

export interface FinancialSummary {
  total_revenue: number;
  total_paid: number;
  total_debt: number;
  total_expenses: number;
  net_profit: number;
}
