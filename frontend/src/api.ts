export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'staff' | 'rider';
  account_status?: 'active' | 'banned' | 'deactivated' | 'deleted';
  availability?: number | string;
};
export type ManagedUser = User & {
  created_at: string;
  order_count?: number;
  address_count?: number;
  address_summary?: string;
};
export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number | null;
  category_name?: string;
  image_path?: string | null;
  is_available: number;
};
export type Category = { id: number; name: string; description: string };
export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  contact_number: string;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  rider_id?: number | null;
  rider_name?: string;
  rider_phone?: string;
  rider_availability?: number | string;
  assigned_at?: string | null;
  delivered_by_name?: string | null;
  delivered_at?: string | null;
  items?: string;
  rating_id?: number | null;
  is_rated?: number | string;
  rating?: number | null;
  review?: string | null;
  rating_created_at?: string | null;
};
export type Address = {
  id: number;
  user_id: number;
  label: 'Home' | 'Work' | 'Other';
  recipient_name: string;
  contact_number: string;
  delivery_address: string;
  is_default: number | string;
  created_at: string;
  updated_at: string;
};
const request = async (path: string, options: RequestInit = {}): Promise<any> => {
  const r = await fetch(`/api/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const j = await r.json();
  if (!j.success) throw new Error(j.message);
  return j.data;
};
export const api = {
  me: () => request('auth.php?action=me'),
  login: (d: object) =>
    request('auth.php?action=login', { method: 'POST', body: JSON.stringify(d) }),
  register: (d: object) =>
    request('auth.php?action=register', { method: 'POST', body: JSON.stringify(d) }),
  logout: () => request('auth.php?action=logout'),
  products: (q = '') => request(`products.php?action=list&q=${encodeURIComponent(q)}`),
  categories: () => request('categories.php?action=list'),
  saveProduct: (d: object) =>
    request('products.php?action=save', { method: 'POST', body: JSON.stringify(d) }),
  deleteProduct: (id: number) =>
    request('products.php?action=delete', { method: 'POST', body: JSON.stringify({ id }) }),
  saveCategory: (d: object) =>
    request('categories.php?action=save', { method: 'POST', body: JSON.stringify(d) }),
  deleteCategory: (id: number) =>
    request('categories.php?action=delete', { method: 'POST', body: JSON.stringify({ id }) }),
  createOrder: (d: object) =>
    request('orders.php?action=create', { method: 'POST', body: JSON.stringify(d) }),
  myOrders: () => request('orders.php?action=mine'),
  allOrders: () => request('orders.php?action=all'),
  updateStatus: (id: number, status: string) =>
    request('orders.php?action=status', { method: 'POST', body: JSON.stringify({ id, status }) }),
  stats: () => request('stats.php'),
  createTeamUser: (d: object) =>
    request('auth.php?action=create_user', { method: 'POST', body: JSON.stringify(d) }),
  riders: () => request('auth.php?action=riders'),
  staffDashboard: () => request('orders.php?action=staff_dashboard'),
  staffHistory: (q = '', status = '') =>
    request(
      `orders.php?action=staff_history&q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`,
    ),
  staffCustomers: () => request('orders.php?action=staff_customers'),
  customerDetails: (user_id: number) =>
    request(`orders.php?action=customer_details&user_id=${user_id}`),
  staffNotifications: () => request('orders.php?action=staff_notifications'),
  activeOrders: () => request('orders.php?action=active'),
  assignRider: (id: number, rider_id: number) =>
    request('orders.php?action=assign', { method: 'POST', body: JSON.stringify({ id, rider_id }) }),
  unassignRider: (id: number) =>
    request('orders.php?action=unassign', { method: 'POST', body: JSON.stringify({ id }) }),
  staffStatus: (id: number, status: string, reason?: string) =>
    request('orders.php?action=staff_status', {
      method: 'POST',
      body: JSON.stringify({ id, status, reason }),
    }),
  cancelOrder: (id: number, reason: string) =>
    request('orders.php?action=cancel', { method: 'POST', body: JSON.stringify({ id, reason }) }),
  cancellationAlerts: () => request('orders.php?action=cancellation_alerts'),
  riderOrders: () => request('orders.php?action=rider'),
  riderStatus: (id: number, status: string) =>
    request('orders.php?action=rider_status', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    }),
  riderAvailability: (available: number) =>
    request('auth.php?action=rider_availability', {
      method: 'POST',
      body: JSON.stringify({ available }),
    }),
  assignmentHistory: (q = '') =>
    request(`orders.php?action=assignment_history&q=${encodeURIComponent(q)}`),
  adminUsers: () => request('auth.php?action=admin_users'),
  moderateUser: (id: number, moderation: string) =>
    request('auth.php?action=moderate_user', {
      method: 'POST',
      body: JSON.stringify({ id, moderation }),
    }),
  notifications: () => request('get_notifications.php'),
  deleteNotification: (id: number) =>
    request('get_notifications.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  userNotifications: () => request('get_user_notifications.php'),
  addresses: () => request('addresses.php?action=list'),
  saveAddress: (d: object) =>
    request('addresses.php?action=save', { method: 'POST', body: JSON.stringify(d) }),
  deleteAddress: (id: number) =>
    request('addresses.php?action=delete', { method: 'POST', body: JSON.stringify({ id }) }),
  submitRating: (order_id: number, rating: number, review: string) =>
    request('ratings.php?action=submit', {
      method: 'POST',
      body: JSON.stringify({ order_id, rating, review }),
    }),
  getRating: (order_id: number) => request(`ratings.php?action=get&order_id=${order_id}`),
};
