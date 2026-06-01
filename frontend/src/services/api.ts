import {
  Lead,
  Client,
  Order,
  Task,
  Supplier,
  Material,
  SupplyRequest,
  Payment,
  FinancialSummary,
} from '@/types';

async function request<T>(url: string, config: RequestInit = {}): Promise<T> {
  const headers = new Headers(config.headers);
  if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...config,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Health / Environment check
  getHealth: () => request<{
    status: string;
    database: string;
    database_details: { postgres_version: string; pgvector_version: string; db_name: string };
    current_role: string;
    environment: { python_version: string; os: string };
    libraries: Record<string, string>;
  }>('/api/health'),

  // Leads
  getLeads: () => request<Lead[]>('/api/leads'),
  createLead: (data: Omit<Lead, 'id' | 'created_at'>) =>
    request<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteLead: (id: number) =>
    request<{ status: string }>(`/api/leads/${id}`, { method: 'DELETE' }),

  // Clients
  getClients: () => request<Client[]>('/api/clients'),
  createClientFromLead: (data: { lead_id: number; email?: string | null; address?: string | null; comment?: string | null }) =>
    request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteClient: (id: number) =>
    request<{ status: string }>(`/api/clients/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request<Order[]>('/api/orders'),
  createOrder: (data: {
    client_id: number;
    product_type: string;
    technical_spec?: string | null;
    price: number;
    status: string;
    delivery_date?: string | null;
    installation_date?: string | null;
  }) =>
    request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrderStatus: (id: number, status: string) =>
    request<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteOrder: (id: number) =>
    request<{ status: string }>(`/api/orders/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (orderId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (orderId) params.append('order_id', orderId.toString());
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Task[]>(`/api/tasks${query}`);
  },
  createTask: (data: {
    title: string;
    description?: string | null;
    due_date?: string | null;
    priority: string;
    status: string;
    assigned_to: string;
    order_id?: number | null;
  }) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id: number, status: string) =>
    request<Task>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id: number) =>
    request<{ status: string }>(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/api/suppliers'),
  createSupplier: (data: Omit<Supplier, 'id' | 'created_at'>) =>
    request<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Materials
  getMaterials: () => request<Material[]>('/api/materials'),
  createMaterial: (data: Omit<Material, 'id' | 'created_at'>) =>
    request<Material>('/api/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Supply Requests
  getSupplyRequests: () => request<SupplyRequest[]>('/api/supply-requests'),
  createSupplyRequest: (data: {
    order_id: number;
    material_id: number;
    quantity: number;
    actual_price: number;
    status: string;
    delivery_date?: string | null;
  }) =>
    request<SupplyRequest>('/api/supply-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplyRequestStatus: (id: number, status: string, deliveryDate?: string | null) =>
    request<SupplyRequest>(`/api/supply-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, delivery_date: deliveryDate }),
    }),
  deleteSupplyRequest: (id: number) =>
    request<{ status: string }>(`/api/supply-requests/${id}`, { method: 'DELETE' }),

  // Payments & Financials
  getFinancialSummary: () => request<FinancialSummary>('/api/financials/summary'),
  createPayment: (data: {
    order_id: number;
    amount: number;
    payment_date?: string | null;
    comment?: string | null;
  }) =>
    request<Payment>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePayment: (id: number) =>
    request<{ status: string }>(`/api/payments/${id}`, { method: 'DELETE' }),
};
