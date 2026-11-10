import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  ClipboardList,
  UserRound,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Package,
  Tags,
  Plus,
  Minus,
  Trash2,
  Search,
  ChefHat,
  Users,
  Truck,
  Check,
  AlertTriangle,
  Bell,
  Star,
  Heart,
  Sparkles,
  History as HistoryIcon,
} from 'lucide-react';
import { api, Address, Category, ManagedUser, Order, Product, User } from './api';
import CartView from './Cart';
import { createPortal } from 'react-dom';

const peso = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
type CartItem = { product: Product; quantity: number; imageUrl: string };
const isAuthenticatedUser = (value: unknown): value is User =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'number' &&
  'name' in value &&
  typeof value.name === 'string' &&
  'role' in value &&
  ['customer', 'admin', 'staff', 'rider'].includes(String(value.role));
const PRODUCT_FALLBACK = '/assets/foods/knk-food-fallback.svg';
const isOrderRated = (order: Order) =>
  Number(order.is_rated) === 1 ||
  Boolean(order.rating_id) ||
  (order.rating !== null && order.rating !== undefined);
const productImageUrl = (product: Product) => {
  const path = String(product.image_path || '').trim();
  return path ? (path.startsWith('/') ? path : `/assets/foods/${path}`) : PRODUCT_FALLBACK;
};
function ProductImage({
  product,
  className = 'food-image',
}: {
  product: Product;
  className?: string;
}) {
  const [src, setSrc] = useState(productImageUrl(product));
  useEffect(() => setSrc(productImageUrl(product)), [product.image_path]);
  return (
    <img
      className={className}
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => {
        if (src !== PRODUCT_FALLBACK) setSrc(PRODUCT_FALLBACK);
      }}
    />
  );
}
function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [message, setMessage] = useState('');
  const load = () =>
    api
      .addresses()
      .then(setAddresses)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    if (!editing) return;
    try {
      const saved = await api.saveAddress(editing);
      setMessage('Address saved.');
      setEditing(null);
      load();
      void saved;
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const remove = async (id: number) => {
    try {
      await api.deleteAddress(id);
      setMessage('Address deleted.');
      load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <section className="panel address-book">
      <div className="panel-title">
        <h2>Saved delivery addresses</h2>
        <span>{addresses.length}/3</span>
      </div>
      {message && <p className="notice">{message}</p>}
      <div className="address-list">
        {addresses.map((a) => (
          <div className="address-card" key={a.id}>
            <div>
              <strong>
                {a.label}
                {Number(a.is_default) === 1 ? ' · Default' : ''}
              </strong>
              <p>
                {a.recipient_name} · {a.contact_number}
              </p>
              <small>{a.delivery_address}</small>
            </div>
            <div>
              <button className="text-button" onClick={() => setEditing(a)}>
                Edit
              </button>
              <button className="text-button danger" onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {addresses.length < 3 && (
        <button
          className="secondary touch-button"
          onClick={() => setEditing({ label: 'Home', is_default: addresses.length === 0 ? 1 : 0 })}
        >
          Add address
        </button>
      )}
      {editing && (
        <Sheet onClose={() => setEditing(null)}>
          <h2>{editing.id ? 'Edit saved address' : 'Add saved address'}</h2>
          <label>
            Label
            <select
              value={editing.label || 'Home'}
              onChange={(e) =>
                setEditing({ ...editing, label: e.target.value as Address['label'] })
              }
            >
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Recipient name
            <input
              value={editing.recipient_name || ''}
              onChange={(e) => setEditing({ ...editing, recipient_name: e.target.value })}
            />
          </label>
          <label>
            Contact number
            <input
              value={editing.contact_number || ''}
              onChange={(e) => setEditing({ ...editing, contact_number: e.target.value })}
            />
          </label>
          <label>
            Complete delivery address
            <textarea
              rows={3}
              value={editing.delivery_address || ''}
              onChange={(e) => setEditing({ ...editing, delivery_address: e.target.value })}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(editing.is_default)}
              onChange={(e) => setEditing({ ...editing, is_default: e.target.checked ? 1 : 0 })}
            />
            <span>Set as default</span>
          </label>
          <button className="primary full" onClick={save}>
            Save address
          </button>
        </Sheet>
      )}
    </section>
  );
}
const adminGreetings = ["What's good,", "What's the word,", 'Wassup,', "What's poppin',"];
const randomAdminGreeting = () => adminGreetings[Math.floor(Math.random() * adminGreetings.length)];
function Brand() {
  return (
    <div className="brand">
      <img src="/assets/KnK_Vector_Green.svg" />
      <div>
        <strong>Kusina ni Kayi</strong>
        <small>Local flavors, made with care.</small>
      </div>
    </div>
  );
}
function AuthenticatedLoadingScreen() {
  return (
    <div
      className="app-loading-screen authenticated-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading your KnK account"
    >
      <DashboardDecorations />
      <img
        className="app-loading-logo"
        src="/assets/KnK_Vector_Logo.svg"
        alt="Kusina ni Kayi logo"
      />
      <span className="app-loading-indicator" aria-hidden="true" />
    </div>
  );
}
function LoginLoadingScreen() {
  return (
    <div
      className="login-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Signing in to Kusina ni Kayi"
    >
      <img src="/assets/KnK_Vector_Logo.svg" alt="Kusina ni Kayi logo" />
      <span aria-hidden="true" />
    </div>
  );
}
function LoginDecorations() {
  const icons = [
    ['chef', 5, 12, 42],
    ['clock', 25, 8, 36],
    ['carrot', 43, 15, 44],
    ['truck', 82, 11, 54],
    ['package', 94, 29, 38],
    ['pin', 86, 48, 38],
    ['pepper', 93, 69, 44],
    ['route', 74, 88, 50],
    ['fork', 56, 92, 42],
    ['vegetables', 33, 86, 48],
    ['carrot', 6, 78, 40],
    ['truck', 2, 49, 48],
    ['speed', 16, 35, 52],
    ['package', 28, 64, 40],
    ['pin', 68, 24, 34],
    ['pepper', 49, 5, 36],
    ['clock', 89, 89, 42],
    ['vegetables', 14, 94, 34],
  ] as const;
  return (
    <div className="login-decorations" aria-hidden="true">
      <svg className="login-icon-defs" xmlns="http://www.w3.org/2000/svg">
        <symbol id="knk-login-chef" viewBox="0 0 48 48">
          <path d="M12 25a8 8 0 0 1 1-15 9 9 0 0 1 17-1 8 8 0 0 1 6 14v14H12z" />
          <path d="M12 30h24M18 37v4h12v-4" />
        </symbol>
        <symbol id="knk-login-fork" viewBox="0 0 48 48">
          <path d="M14 5v11m5-11v11m5-11v11a7 7 0 0 1-7 7v20M35 5c-5 5-6 13-6 19h6v19M35 24V5" />
        </symbol>
        <symbol id="knk-login-clock" viewBox="0 0 48 48">
          <circle cx="24" cy="25" r="16" />
          <path d="M24 15v11l8 5M19 5h10M24 5v4" />
        </symbol>
        <symbol id="knk-login-carrot" viewBox="0 0 48 48">
          <path d="M13 18c5-7 16-8 22-2-2 12-10 21-23 23-3-7-2-15 1-21Z" />
          <path d="m13 39-4 5m9-14 3 3m2-10 3 3M21 16c-1-5 0-9 4-12m2 12c2-5 5-7 9-7" />
        </symbol>
        <symbol id="knk-login-pepper" viewBox="0 0 48 48">
          <path d="M23 13c-1-5 1-8 6-10m-3 10c10-4 17 2 15 11-2 10-10 18-21 18-9 0-15-6-14-14 1-7 7-11 17-15Z" />
          <path d="M14 21c-3 7-2 14 2 19m9-27c-2 8-1 17 2 27" />
        </symbol>
        <symbol id="knk-login-vegetables" viewBox="0 0 48 48">
          <path d="M9 35c1-10 8-17 18-18 2 10-5 19-16 21zm14-13c4-8 12-11 20-8 0 9-7 15-17 15M18 17c-2-6 0-10 4-13m4 12c1-6 5-9 10-10" />
        </symbol>
        <symbol id="knk-login-truck" viewBox="0 0 48 48">
          <path d="M4 13h24v22H4zM28 21h9l7 8v6H28z" />
          <circle cx="14" cy="37" r="4" />
          <circle cx="36" cy="37" r="4" />
          <path d="M33 21v8h11" />
        </symbol>
        <symbol id="knk-login-package" viewBox="0 0 48 48">
          <path d="m6 15 18-9 18 9v20l-18 9-18-9zM6 15l18 10 18-10M24 25v19M16 10l18 10" />
        </symbol>
        <symbol id="knk-login-pin" viewBox="0 0 48 48">
          <path d="M39 20c0 11-15 25-15 25S9 31 9 20a15 15 0 1 1 30 0Z" />
          <circle cx="24" cy="20" r="5" />
        </symbol>
        <symbol id="knk-login-route" viewBox="0 0 48 48">
          <circle cx="10" cy="35" r="4" />
          <circle cx="38" cy="11" r="4" />
          <path d="M14 35h8a7 7 0 0 0 7-7v-4a7 7 0 0 1 7-7h2M31 11h3m-4-4 4 4-4 4" />
        </symbol>
        <symbol id="knk-login-speed" viewBox="0 0 48 48">
          <path d="M5 15h21M2 24h18M8 33h18m2 5 14-14-14-14" />
        </symbol>
      </svg>
      {icons.map(([kind, left, top, size], index) => (
        <span
          className={`login-decor-icon login-icon-${kind}`}
          key={`${kind}-${index}`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${Math.round(size * 1.5)}px`,
            height: `${Math.round(size * 1.5)}px`,
          }}
        >
          <svg viewBox="0 0 48 48" focusable="false">
            <use href={`#knk-login-${kind === 'fork' ? 'fork' : kind}`} />
          </svg>
        </span>
      ))}
    </div>
  );
}
function DashboardDecorations() {
  const icons = [
    ['apple', 28, 7, 48],
    ['orange', 91, 13, 44],
    ['banana', 97, 39, 58],
    ['strawberry', 30, 88, 44],
    ['grapes', 96, 78, 50],
    ['carrot', 27, 53, 48],
    ['tomato', 86, 94, 46],
    ['broccoli', 39, 4, 50],
    ['pepper', 77, 7, 42],
    ['leafy', 98, 57, 54],
    ['orange', 34, 97, 42],
    ['apple', 72, 91, 40],
  ] as const;
  return (
    <div className="dashboard-decorations" aria-hidden="true">
      <svg className="dashboard-icon-defs" xmlns="http://www.w3.org/2000/svg">
        <symbol id="knk-dashboard-apple" viewBox="0 0 48 48">
          <path
            d="M24 15c-8-7-17-1-17 10 0 11 7 19 15 19 3 0 4-2 7-2s4 2 7 2c8 0 15-9 15-19 0-10-9-17-17-11-3 2-6 2-10 1Z"
            transform="translate(-2 -2) scale(.96)"
          />
          <path d="M24 15c-1-7 2-11 8-13m-4 9c4-5 8-5 13-4-1 6-5 9-11 9" />
        </symbol>
        <symbol id="knk-dashboard-orange" viewBox="0 0 48 48">
          <circle cx="24" cy="25" r="18" />
          <path d="M24 7v4m-13 1 3 3m20-3-3 3M6 25h5m26 0h5M11 38l4-4m22 4-4-4m-9-23c2-5 6-7 11-7-1 5-4 8-10 9" />
        </symbol>
        <symbol id="knk-dashboard-banana" viewBox="0 0 48 48">
          <path d="M7 11c3 17 14 27 31 29 3 0 5-2 6-5C27 34 16 24 11 7 9 7 7 8 7 11Z" />
          <path d="m7 11 4-4m27 33 4-5" />
        </symbol>
        <symbol id="knk-dashboard-strawberry" viewBox="0 0 48 48">
          <path d="M8 16c7-7 25-7 32 0-1 12-8 22-16 28C16 38 9 28 8 16Z" />
          <path d="M19 11c0-5 3-8 5-10 2 3 5 5 5 10m-15 1c-4-3-7-3-10-2 2 4 5 5 9 5m21-3c4-3 7-3 10-2-2 4-5 5-9 5M17 20l1 2m9 0 1 2m-7 5 1 2m8 2 1 2" />
        </symbol>
        <symbol id="knk-dashboard-grapes" viewBox="0 0 48 48">
          <path d="M24 8c0-4 3-6 7-6m-7 6c5-1 9 1 11 5" />
          <circle cx="18" cy="16" r="6" />
          <circle cx="30" cy="16" r="6" />
          <circle cx="12" cy="27" r="6" />
          <circle cx="24" cy="27" r="6" />
          <circle cx="36" cy="27" r="6" />
          <circle cx="18" cy="38" r="6" />
          <circle cx="30" cy="38" r="6" />
        </symbol>
        <symbol id="knk-dashboard-carrot" viewBox="0 0 48 48">
          <path d="M12 17c6-7 17-8 23-2-2 12-10 21-23 23-4-7-3-15 0-21Z" />
          <path d="m12 38-4 6m11-14 3 3m2-10 3 3M20 15c-1-5 0-9 4-12m3 12c2-5 5-7 9-7" />
        </symbol>
        <symbol id="knk-dashboard-tomato" viewBox="0 0 48 48">
          <path d="M24 12c-10-7-21 1-19 13 1 10 9 19 19 19s18-9 19-19c2-12-9-20-19-13Z" />
          <path d="m24 13-4-8 7 5 7-6-2 9 9 1-8 5m-9-6-8 5-9-3" />
        </symbol>
        <symbol id="knk-dashboard-broccoli" viewBox="0 0 48 48">
          <path d="M15 27c-7 0-11-5-9-11 1-4 5-6 9-5 1-6 7-9 12-6 3 1 5 4 5 7 6-2 12 2 12 8 0 4-3 7-7 8l-3 13H16l-1-14Z" />
          <path d="M19 41h12m-9-13v8m8-10-2 10" />
        </symbol>
        <symbol id="knk-dashboard-pepper" viewBox="0 0 48 48">
          <path d="M22 13c-1-5 1-8 6-10m-3 10c10-4 17 2 15 11-2 10-10 18-21 18-9 0-15-6-14-14 1-7 7-11 17-15Z" />
          <path d="M13 21c-3 7-2 14 2 19m9-27c-2 8-1 17 2 27" />
        </symbol>
        <symbol id="knk-dashboard-leafy" viewBox="0 0 48 48">
          <path d="M42 6C20 6 8 14 7 29c0 8 6 13 13 12C35 39 42 25 42 6Z" />
          <path d="M8 42c8-11 16-19 29-31M18 29l-1-9m9 2 7-1" />
        </symbol>
      </svg>
      {icons.map(([kind, left, top, size], index) => (
        <span
          className={`dashboard-decor-icon dashboard-icon-${kind}`}
          key={`${kind}-${index}`}
          style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px` }}
        >
          <svg viewBox="0 0 48 48" focusable="false">
            <use href={`#knk-dashboard-${kind}`} />
          </svg>
        </span>
      ))}
    </div>
  );
}
function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(t);
  }, [onClose]);
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{text}</span>
      <button
        type="button"
        className="toast-close touch-button"
        aria-label="Close notification"
        onClick={onClose}
      >
        <X />
      </button>
    </div>
  );
}
function AdminNotifications() {
  const [items, setItems] = useState<
    Array<{
      id: number;
      order_number: string;
      customer_name: string;
      cancellation_reason: string;
      updated_at: string;
    }>
  >([]);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const load = () =>
    api
      .notifications()
      .then(setItems)
      .catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);
  const unread = items.filter((item) => !seen.includes(item.id)).length;
  const toggle = () => {
    if (open) {
      setClosing(true);
      window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 220);
    } else setOpen(true);
  };
  const remove = async () => {
    if (deleting === null) return;
    try {
      await api.deleteNotification(deleting);
      setItems((current) => current.filter((item) => item.id !== deleting));
      setSeen((current) => current.filter((id) => id !== deleting));
      setDeleting(null);
    } catch (e) {
      setDeleting(null);
    }
  };
  return (
    <div className="admin-notifications">
      <button
        className="notification-trigger touch-button"
        aria-label={`${unread} notifications`}
        onClick={() => {
          toggle();
          if (!open) setSeen(items.map((item) => item.id));
        }}
      >
        <Bell />
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>
      {open && (
        <div className={`notification-panel${closing ? ' closing' : ''}`}>
          <div className="notification-header">
            <strong>Notifications</strong>
            <small>
              {items.length} cancellation alert{items.length === 1 ? '' : 's'}
            </small>
          </div>
          {items.length ? (
            items.map((item) => (
              <div className="notification-item" key={item.id}>
                <div className="notification-item-heading">
                  <strong>Order {item.order_number} cancelled</strong>
                  <button
                    className="notification-delete touch-button"
                    aria-label={`Delete notification for order ${item.order_number}`}
                    onClick={() => setDeleting(item.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
                <small>
                  {item.customer_name} · {new Date(item.updated_at).toLocaleString()}
                </small>
                <p>Reason: {item.cancellation_reason}</p>
              </div>
            ))
          ) : (
            <div className="notification-empty">No recent notifications.</div>
          )}
        </div>
      )}
      {deleting !== null && (
        <Modal
          danger
          title="Delete notification"
          message="Remove this cancellation alert? The order will remain cancelled."
          confirmLabel="Delete"
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
function UserNotifications() {
  const [items, setItems] = useState<
    Array<{ id: number; order_number: string; status: string; updated_at: string }>
  >([]);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [seen, setSeen] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem('knk-seen-notifications') || '[]'),
  );
  const load = () =>
    api
      .userNotifications()
      .then(setItems)
      .catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, []);
  const key = (item: { id: number; status: string }) => `${item.id}:${item.status}`;
  const unread = items.filter((item) => !seen.includes(key(item))).length;
  const markSeen = () => {
    const keys = items.map(key);
    setSeen(keys);
    localStorage.setItem('knk-seen-notifications', JSON.stringify(keys));
  };
  const toggle = () => {
    if (open) {
      setClosing(true);
      window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 220);
    } else setOpen(true);
  };
  return (
    <div className="admin-notifications">
      <button
        className="notification-trigger touch-button"
        aria-label={`${unread} order notifications`}
        onClick={() => {
          toggle();
          if (!open) markSeen();
        }}
      >
        <Bell />
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>
      {open && (
        <div className={`notification-panel${closing ? ' closing' : ''}`}>
          <div className="notification-header">
            <strong>Order updates</strong>
            <small>
              {items.length} active order{items.length === 1 ? '' : 's'}
            </small>
          </div>
          {items.length ? (
            items.map((item) => (
              <div className="notification-item" key={item.id}>
                <strong>
                  {item.order_number}: {item.status}
                </strong>
                <small>{new Date(item.updated_at).toLocaleString()}</small>
                <p>Your order status has been updated.</p>
              </div>
            ))
          ) : (
            <div className="notification-empty">No active order updates.</div>
          )}
        </div>
      )}
    </div>
  );
}
function RiderNotifications() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const load = () =>
    api
      .riderOrders()
      .then(setOrders)
      .catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);
  const active = orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status));
  return (
    <div className="admin-notifications">
      <button
        type="button"
        className="notification-trigger touch-button"
        aria-label={`${active.length} rider notifications`}
        onClick={() => setOpen(!open)}
      >
        <Bell />
        {active.length > 0 && <span className="notification-badge">{active.length}</span>}
      </button>
      {open && (
        <div className="notification-panel">
          <div className="notification-header">
            <strong>Delivery updates</strong>
            <small>
              {active.length} active assignment{active.length === 1 ? '' : 's'}
            </small>
          </div>
          {active.length ? (
            active.map((order) => (
              <div className="notification-item" key={order.id}>
                <strong>
                  {order.order_number}: {order.status}
                </strong>
                <small>
                  {order.customer_name} · {order.contact_number}
                </small>
                <p>{order.delivery_address}</p>
              </div>
            ))
          ) : (
            <div className="notification-empty">No active delivery assignments.</div>
          )}
        </div>
      )}
    </div>
  );
}
function Shell({
  user,
  onLogout,
  cartCount,
  children,
}: {
  user: User;
  onLogout: () => void;
  cartCount: number;
  children: ReactNode;
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [cartPop, setCartPop] = useState(false);
  const [availability, setAvailability] = useState(Number(user.availability ?? 1) === 1);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [bubble, setBubble] = useState({
    transform: 'translateY(0px)',
    width: '0px',
    height: '0px',
  });
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const admin = user.role === 'admin';
  const team = user.role === 'staff' || user.role === 'rider';
  const links = admin
    ? [
        ['/admin', <LayoutDashboard />, 'Dashboard'],
        ['/admin/orders', <ClipboardList />, 'Orders'],
        ['/admin/products', <Package />, 'Products'],
        ['/admin/categories', <Tags />, 'Categories'],
        ['/admin/team', <Users />, 'Staff & Riders'],
      ]
    : team
      ? user.role === 'staff'
        ? [
            ['/staff', <LayoutDashboard />, 'Dashboard'],
            ['/staff/orders', <ClipboardList />, 'Active Orders'],
            ['/staff/history', <HistoryIcon />, 'Order History'],
            ['/staff/customers', <Users />, 'Customers'],
            ['/staff/notifications', <Bell />, 'Notifications'],
          ]
        : [
            ['/rider', <LayoutDashboard />, 'Dashboard'],
            ['/rider/deliveries', <Truck />, 'My Deliveries'],
            ['/rider/history', <HistoryIcon />, 'Delivery History'],
          ]
      : [
          ['/menu', <Home />, 'Home / Menu'],
          ['/cart', <ShoppingBag />, 'My Cart'],
          ['/orders', <ClipboardList />, 'My Orders'],
          ['/account', <UserRound />, 'My Account'],
        ];
  useLayoutEffect(() => {
    const updateBubble = () => {
      const container = navRef.current;
      const active = linkRefs.current[loc.pathname];
      if (!container || !active) return;
      const containerBox = container.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      setBubble({
        transform: `translateY(${activeBox.top - containerBox.top}px)`,
        width: `${activeBox.width}px`,
        height: `${activeBox.height}px`,
      });
    };
    updateBubble();
    const observer = new ResizeObserver(updateBubble);
    if (navRef.current) observer.observe(navRef.current);
    window.addEventListener('resize', updateBubble);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBubble);
    };
  }, [loc.pathname, admin, open]);
  useEffect(() => {
    const onCartArrival = () => {
      if (loc.pathname === '/cart') return;
      setCartPop(true);
      window.setTimeout(() => setCartPop(false), 900);
    };
    window.addEventListener('knk-cart-arrival', onCartArrival);
    return () => window.removeEventListener('knk-cart-arrival', onCartArrival);
  }, [loc.pathname]);
  const toggleAvailability = async () => {
    if (availabilityBusy) return;
    const next = availability ? 0 : 1;
    setAvailabilityBusy(true);
    setAvailabilityMessage('');
    try {
      await api.riderAvailability(next);
      setAvailability(Boolean(next));
      setAvailabilityMessage(
        next ? 'You are available for new deliveries.' : 'You are unavailable for new deliveries.',
      );
    } catch (e) {
      setAvailabilityMessage((e as Error).message);
    } finally {
      setAvailabilityBusy(false);
    }
  };
  return (
    <div className={`app-shell${open ? ' drawer-open' : ''}`}>
      <DashboardDecorations />
      <button
        className="mobile-menu"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <button
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Brand />
        <nav ref={navRef} className="sidebar-nav">
          <span className="nav-bubble" aria-hidden="true" style={bubble} />
          {links.map(([to, icon, label]) => (
            <button
              key={to as string}
              ref={(element) => {
                linkRefs.current[to as string] = element;
              }}
              className={loc.pathname === to ? 'active' : ''}
              onClick={() => {
                nav(to as string);
                setOpen(false);
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="user-chip">
            <div className="avatar">{user.name[0]}</div>
            <span>
              {user.name}
              <small>
                {admin ? 'Administrator' : user.role[0].toUpperCase() + user.role.slice(1)}
              </small>
            </span>
          </div>
          <button onClick={onLogout}>
            <LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main">
        {admin && (
          <div className="admin-topbar">
            <AdminNotifications />
          </div>
        )}
        {user.role === 'rider' && (
          <div className="rider-topbar">
            <button
              type="button"
              className={`rider-availability-toggle${availability ? ' is-available' : ''}`}
              onClick={toggleAvailability}
              disabled={availabilityBusy}
              aria-pressed={availability}
            >
              <span className="availability-indicator" />
              {availabilityBusy ? 'Updating…' : availability ? 'Available' : 'Unavailable'}
            </button>
            <RiderNotifications />
          </div>
        )}
        {availabilityMessage && user.role === 'rider' && (
          <div className="rider-topbar-message" role="status">
            {availabilityMessage}
            <button
              type="button"
              onClick={() => setAvailabilityMessage('')}
              aria-label="Dismiss message"
            >
              <X />
            </button>
          </div>
        )}
        {!admin && !team && (
          <div className="customer-topbar">
            <UserNotifications />
            <button
              className={`top-cart${cartPop ? ' cart-pop' : ''}`}
              aria-label="Open shopping cart"
              onClick={() => nav('/cart')}
            >
              <ShoppingBag />
              {loc.pathname !== '/cart' && cartCount > 0 && (
                <span className="cart-notice" aria-label={`${cartCount} items in cart`}>
                  +{cartCount}
                </span>
              )}
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
function Auth({ onLogin }: { onLogin: (u: User) => void }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const user = register
        ? await api.register(form).then(() => api.login(form))
        : await api.login(form);
      if (!isAuthenticatedUser(user))
        throw new Error('Your account role could not be verified. Please try again.');
      onLogin(user);
    } catch (x) {
      setError((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`auth-page${busy ? ' login-submitting' : ''}`}>
      <div className="auth-page-content">
        <LoginDecorations />
        <div className="auth-card">
          <Brand />
          <div className="auth-copy">
            <span className="eyebrow">WELCOME TO KNK</span>
            <h1 className="take-coffee-heading">
              {register ? '<Bring KnK home>' : '<Good food, good mood>'}
            </h1>
            <p>
              {register
                ? 'Create an account to order comforting local favorites.'
                : 'A warm table of Filipino favorites, ready when you are.'}
            </p>
          </div>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            {register && (
              <label>
                Contact number
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            )}
            <label>
              Password
              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}
            </button>
          </form>
          <button
            className="link-button"
            disabled={busy}
            onClick={() => {
              setRegister(!register);
              setError('');
            }}
          >
            {register ? 'Already have an account? Log in' : 'New to KnK? Create an account'}
          </button>
        </div>
      </div>
      {busy && <LoginLoadingScreen />}
    </div>
  );
}
function MenuPage({ add }: { add: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.products(), api.categories()])
      .then(([p, c]) => {
        setProducts(p);
        setCats(c);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    api
      .products(q)
      .then(setProducts)
      .catch((e) => setError(e.message));
  }, [q]);
  const priority = ['Chicken Adobo', 'Pancit Canton', 'Lumpia', 'Iced Tea', 'Halo-Halo'];
  const shown = products
    .filter((p) => !cat || p.category_id === cat)
    .sort((a, b) => {
      const aIndex = priority.indexOf(a.name);
      const bIndex = priority.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  return (
    <PageTitle
      title="What are you craving?"
      sub="Comforting Filipino favorites, prepared fresh for your table."
    >
      <div className="toolbar">
        <div className="search">
          <Search />
          <input placeholder="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="pills">
          <button className={!cat ? 'selected' : ''} onClick={() => setCat(0)}>
            All
          </button>
          {cats.map((c) => (
            <button
              className={cat === c.id ? 'selected' : ''}
              key={c.id}
              onClick={() => setCat(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="product-grid">
        {shown.map((p) => {
          const imageName =
            p.image_path
              ?.split('/')
              .pop()
              ?.replace(/\.[^.]+$/, '') || 'fallback';
          return (
            <article className="product-card" key={p.id}>
              <div className={`food-art art-${p.id % 4}`}>
                <ProductImage product={p} className={`food-image food-${imageName}`} />
                <ChefHat />
              </div>
              <div className="product-info">
                <div>
                  <span className="category-label">{p.category_name}</span>
                  <h3>{p.name}</h3>
                </div>
                <strong>{peso(p.price)}</strong>
                <p>{p.description}</p>
                <div className="product-action">
                  <button
                    className="primary"
                    disabled={!p.is_available}
                    onClick={(e) => {
                      add(p);
                      flyToCart(e);
                    }}
                  >
                    {Boolean(p.is_available) && (
                      <ShoppingBag className="add-cart-icon" aria-hidden="true" />
                    )}
                    <span>{p.is_available ? 'Add to cart' : 'Unavailable'}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!shown.length && <Empty text="No dishes match your search." />}
    </PageTitle>
  );
}
function PageTitle({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">KUSINA NI KAYI</span>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
function Modal({
  title,
  message,
  danger = false,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-icon${danger ? ' danger' : ''}`}>
          {danger ? <AlertTriangle /> : <Check />}
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary touch-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`${danger ? 'danger-button' : 'primary'} touch-button`}
            onClick={onConfirm}
          >
            {confirmLabel || (danger ? 'Confirm' : 'Continue')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
function RatingModal({
  order,
  onCancel,
  onSuccess,
}: {
  order: Order;
  onCancel: () => void;
  onSuccess: (rating: number, review: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [starPulse, setStarPulse] = useState(0);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => onSuccess(rating, review), 1200);
    return () => window.clearTimeout(timer);
  }, [success, rating, review, onSuccess]);
  const submit = async () => {
    if (busy || success) return;
    if (!rating) return setError('Please choose a star rating.');
    setBusy(true);
    setError('');
    try {
      await api.submitRating(order.id, rating, review);
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const disabled = busy || success;
  return (
    <div
      className="modal-backdrop rating-backdrop"
      role="presentation"
      onClick={() => {
        if (!disabled) onCancel();
      }}
    >
      <div
        className="confirm-modal rating-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-icon rating-modal-icon${success ? ' rating-success-icon' : ''}`}>
          {success ? (
            <>
              <Heart />
              <Sparkles />
            </>
          ) : (
            <Star />
          )}
        </div>
        <h2 id="rating-title">{success ? 'Thanks for sharing!' : `Rate ${order.order_number}`}</h2>
        <p>
          {success
            ? 'Your kind words make our kitchen smile.'
            : 'Delivered order · Share your KnK experience.'}
        </p>
        {success && (
          <div className="rating-success-message" role="status">
            <span className="rating-success-hearts" aria-hidden="true">
              <Heart />
              <Heart />
              <Sparkles />
            </span>
            <strong>Review saved with love!</strong>
          </div>
        )}
        <div
          className={`star-picker${success ? ' rating-stars-success' : ''}`}
          role="radiogroup"
          aria-label="Order rating"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={`${value}-${value === rating ? starPulse : 0}`}
              className={value <= (hover || rating) ? 'selected' : ''}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              aria-checked={rating === value}
              role="radio"
              disabled={disabled}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(value)}
              onBlur={() => setHover(0)}
              onClick={() => {
                setRating(value);
                setStarPulse((pulse) => pulse + 1);
              }}
            >
              <Star fill="currentColor" />
            </button>
          ))}
        </div>
        <label className="review-label">
          Written review{' '}
          <textarea
            disabled={disabled}
            spellCheck={false}
            maxLength={1000}
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Optional review"
          />
        </label>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button className="secondary touch-button" disabled={disabled} onClick={onCancel}>
            Cancel
          </button>
          <button className="primary touch-button" disabled={disabled} onClick={submit}>
            {busy ? 'Submitting…' : success ? 'Saved!' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const start = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 260);
  };
  return (
    <div className={`sheet-backdrop${closing ? ' closing' : ''}`} onClick={close}>
      <div
        className="bottom-sheet"
        style={{ transform: `translateY(${offset}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          start.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (start.current !== null) setOffset(Math.max(0, e.touches[0].clientY - start.current));
        }}
        onTouchEnd={() => {
          if (offset > 90) close();
          else setOffset(0);
          start.current = null;
        }}
      >
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}
function SuccessOverlay({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1500);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="success-overlay">
      <div className="success-card">
        <div className="success-check">
          <Check />
        </div>
        <strong>{message}</strong>
        <small>Returning to the account list…</small>
      </div>
    </div>
  );
}
function flyToCart(event: MouseEvent<HTMLButtonElement>) {
  const source = event.currentTarget
    .closest<HTMLElement>('.product-card')
    ?.querySelector<HTMLElement>('.food-art');
  const target = document.querySelector<HTMLElement>('.top-cart');
  if (!source || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = source.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  const size = Math.min(start.width, start.height, 110);
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${start.left + (start.width - size) / 2}px`,
    top: `${start.top + (start.height - size) / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    overflow: 'hidden',
    borderRadius: '12px',
    zIndex: '10001',
    pointerEvents: 'none',
    boxShadow: '0 8px 18px rgba(40,89,67,.25)',
  });
  document.body.appendChild(clone);
  window.dispatchEvent(new CustomEvent('knk-cart-arrival', { detail: { increment: 1 } }));
  const x = end.left + end.width / 2 - size / 2 - (start.left + (start.width - size) / 2);
  const y = end.top + end.height / 2 - size / 2 - (start.top + (start.height - size) / 2);
  const animation = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      {
        transform: `translate(${x * 0.45}px,${y * 0.35 - 70}px) scale(.72) rotate(-8deg)`,
        opacity: 0.95,
        offset: 0.55,
      },
      { transform: `translate(${x}px,${y}px) scale(.18) rotate(8deg)`, opacity: 0.35 },
    ],
    { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' },
  );
  animation.finished
    .then(() => {
      clone.remove();
    })
    .catch(() => clone.remove());
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <ChefHat />
      <h3>{text}</h3>
      <p>Try another section or check back soon.</p>
    </div>
  );
}
function Customer({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = JSON.parse(localStorage.getItem('knk-cart') || '[]') as Array<Partial<CartItem>>;
    return saved.map(
      (item) =>
        ({
          ...item,
          imageUrl: item.imageUrl || productImageUrl(item.product as Product),
        }) as CartItem,
    );
  });
  const [toast, setToast] = useState('');
  const save = (c: CartItem[]) => {
    setCart(c);
    localStorage.setItem('knk-cart', JSON.stringify(c));
  };
  const add = (p: Product) => {
    const imageUrl = productImageUrl(p);
    save(
      cart.some((x) => x.product.id === p.id)
        ? cart.map((x) =>
            x.product.id === p.id ? { ...x, quantity: x.quantity + 1, imageUrl } : x,
          )
        : [...cart, { product: p, quantity: 1, imageUrl }],
    );
    setToast(`${p.name} added to cart.`);
  };
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      onLogout();
    }
  };
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  return (
    <Shell user={user} onLogout={logout} cartCount={cartCount}>
      {toast && <Toast text={toast} onClose={() => setToast('')} />}
      <Routes>
        <Route path="/menu" element={<MenuPage add={add} />} />
        <Route path="/cart" element={<CartView cart={cart} save={save} setToast={setToast} />} />
        <Route path="/orders" element={<Orders />} />
        <Route
          path="/account"
          element={
            <PageTitle title="My account" sub="Your KnK account details.">
              <div className="account-card">
                <div className="avatar large">{user.name[0]}</div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <p>{user.phone}</p>
              </div>
              <AddressBook />
            </PageTitle>
          }
        />
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </Shell>
  );
}
function LegacyCart({
  cart,
  save,
  setToast,
}: {
  cart: CartItem[];
  save: (c: CartItem[]) => void;
  setToast: (s: string) => void;
}) {
  const [form, setForm] = useState({ customer_name: '', contact_number: '', delivery_address: '' });
  const [busy, setBusy] = useState(false);
  const sub = cart.reduce((n, x) => n + x.product.price * x.quantity, 0);
  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.createOrder({
        ...form,
        items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
      });
      save([]);
      setToast(`Order ${r.order_number} placed successfully.`);
      setForm({ customer_name: '', contact_number: '', delivery_address: '' });
    } catch (x) {
      setToast((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!cart.length)
    return (
      <PageTitle title="Your cart is empty" sub="Add something delicious from the menu.">
        <Empty text="Nothing here yet." />
        <button className="primary" onClick={() => (location.href = '/menu')}>
          Browse menu
        </button>
      </PageTitle>
    );
  return (
    <PageTitle title="Ready to order?" sub="Review your items and tell us where to deliver.">
      <div className="checkout-grid">
        <section className="panel">
          {cart.map((x) => (
            <div className="cart-row" key={x.product.id}>
              <div className="food-thumb">
                <img src={x.imageUrl} alt={x.product.name} />
              </div>
              <div className="grow">
                <strong>{x.product.name}</strong>
                <small>{peso(x.product.price)} each</small>
              </div>
              <div className="quantity">
                <button
                  onClick={() =>
                    save(
                      cart.map((i) =>
                        i.product.id === x.product.id
                          ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                          : i,
                      ),
                    )
                  }
                >
                  <Minus />
                </button>
                <span>{x.quantity}</span>
                <button
                  onClick={() =>
                    save(
                      cart.map((i) =>
                        i.product.id === x.product.id ? { ...i, quantity: i.quantity + 1 } : i,
                      ),
                    )
                  }
                >
                  <Plus />
                </button>
              </div>
              <strong>{peso(x.product.price * x.quantity)}</strong>
              <button
                className="icon-btn"
                onClick={() => save(cart.filter((i) => i.product.id !== x.product.id))}
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Delivery details</h2>
          <form onSubmit={checkout}>
            <label>
              Name
              <input
                required
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </label>
            <label>
              Contact number
              <input
                required
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              />
            </label>
            <label>
              Delivery address
              <textarea
                required
                rows={3}
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
              />
            </label>
            <div className="summary">
              <span>
                Subtotal <b>{peso(sub)}</b>
              </span>
              <span>
                Delivery fee <b>{peso(50)}</b>
              </span>
              <strong>
                Total <b>{peso(sub + 50)}</b>
              </strong>
            </div>
            <button className="primary full" disabled={busy}>
              {busy ? 'Placing order…' : 'Place COD order'}
            </button>
          </form>
        </section>
      </div>
    </PageTitle>
  );
}
function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState('');
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () =>
    api
      .myOrders()
      .then(setOrders)
      .catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, []);
  const cancel = async () => {
    if (!cancelling || !reason.trim()) return;
    setBusy(true);
    try {
      await api.cancelOrder(cancelling.id, reason.trim());
      setToast(cancelling.order_number + ' was cancelled.');
      setCancelling(null);
      setReason('');
      load();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <PageTitle title="My orders" sub="KnK order history.">
      {toast && <Toast text={toast} onClose={() => setToast('')} />}{' '}
      {orders.length ? (
        <div className="order-list">
          {orders.map((o) => {
            const canCancel = ['Pending', 'Confirmed', 'Accepted'].includes(o.status);
            return (
              <div className="order-card" key={o.id}>
                <div>
                  <strong>{o.order_number}</strong>
                  <small>{new Date(o.created_at).toLocaleString()}</small>
                  <p>{o.items}</p>
                  {o.rider_name ? (
                    <p>
                      <strong>Your Rider:</strong> {o.rider_name} · {o.rider_phone} · {o.status}
                    </p>
                  ) : (
                    <p className="muted">Waiting for rider assignment.</p>
                  )}
                </div>
                <div className="order-right">
                  <span className="status">{o.status}</span>
                  <strong>{peso(o.total_amount)}</strong>
                  {canCancel && (
                    <button
                      className="cancel-order-button touch-button"
                      title="Cancel this order"
                      onClick={() => {
                        setCancelling(o);
                        setReason('');
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                  {o.status === 'Delivered' &&
                    (isOrderRated(o) ? (
                      <span className="rated-indicator touch-button">
                        <Star fill="currentColor" /> Rated
                      </span>
                    ) : (
                      <button
                        className="rate-order-button touch-button"
                        onClick={() => setRatingOrder(o)}
                      >
                        <Star /> Rate Order
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty text="No orders yet." />
      )}
      {cancelling && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-modal cancel-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">
              <AlertTriangle />
            </div>
            <h2>Cancel {cancelling.order_number}?</h2>
            <p>Please tell us why you want to cancel this order.</p>
            <textarea
              required
              autoFocus
              rows={3}
              placeholder="Reason for cancellation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="secondary touch-button" onClick={() => setCancelling(null)}>
                Go back
              </button>
              <button
                className="danger-button touch-button"
                disabled={busy || !reason.trim()}
                onClick={cancel}
              >
                {busy ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
      {ratingOrder && (
        <RatingModal
          order={ratingOrder}
          onCancel={() => setRatingOrder(null)}
          onSuccess={(rating, review) => {
            setOrders((current) =>
              current.map((order) =>
                order.id === ratingOrder.id
                  ? { ...order, rating_id: order.id, rating, review }
                  : order,
              ),
            );
            setRatingOrder(null);
            setToast('Thank you for rating your order!');
          }}
        />
      )}
    </PageTitle>
  );
}
function StaffDashboard() {
  const [data, setData] = useState<any>({ counts: {}, recent: [] });
  const load = () =>
    api
      .staffDashboard()
      .then(setData)
      .catch(() => {});
  useEffect(() => {
    load();
    const t = window.setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <PageTitle title="Staff dashboard" sub="Keep today's orders moving smoothly.">
      {data.available_riders === 0 && (
        <p className="notice">
          No available riders at the moment. Confirm and prepare orders, then assign an available
          rider before dispatching.
        </p>
      )}
      <div className="stats-grid">
        {['Pending', 'Preparing', 'Out for Delivery', 'Completed Today'].map((k) => (
          <div className="stat-card" key={k}>
            <span>{k}</span>
            <strong>{data.counts?.[k] || 0}</strong>
          </div>
        ))}
      </div>
      <section className="panel table-panel">
        <h2>Recent orders</h2>
        <OrderTable orders={data.recent || []} />
      </section>
    </PageTitle>
  );
}
function RiderAssignmentSheet({
  order,
  riders,
  onClose,
  onAssign,
  onUnassign,
}: {
  order: Order;
  riders: Array<{ id: number; name: string }>;
  onClose: () => void;
  onAssign: (riderId: number) => Promise<void>;
  onUnassign: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [busy, setBusy] = useState(false);
  const available = riders.filter((r) => r.id !== order.rider_id);
  const assign = async () => {
    if (selected === null) return;
    setBusy(true);
    try {
      await onAssign(selected);
    } finally {
      setBusy(false);
    }
  };
  const unassign = async () => {
    setBusy(true);
    try {
      await onUnassign();
      setConfirmUnassign(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <div className="rider-assignment-sheet">
        <header className="rider-sheet-header">
          <span className="eyebrow">RIDER ASSIGNMENT</span>
          <h2>Manage rider</h2>
          <div className="rider-order-reference">
            <span>Order</span>
            <strong>{order.order_number}</strong>
          </div>
          <p>Assign a different available rider or remove the current assignment.</p>
        </header>
        {order.rider_name && (
          <section className="current-rider-card">
            <div className="current-rider-heading">
              <span>Currently assigned</span>
              <span className="status status-active">Assigned</span>
            </div>
            <strong>{order.rider_name}</strong>
            <p>
              {order.rider_phone || 'No contact number'} ·{' '}
              {order.rider_availability ? 'Available' : 'Unavailable'}
            </p>
            {order.assigned_at && (
              <small>Assigned {new Date(order.assigned_at).toLocaleString()}</small>
            )}
            <button
              className="unassign-rider-button"
              disabled={busy}
              onClick={() => setConfirmUnassign(true)}
            >
              Unassign rider
            </button>
          </section>
        )}
        <section className="available-riders-section">
          <div className="rider-section-heading">
            <h3>Available riders</h3>
            <span>{available.length}</span>
          </div>
          {available.length ? (
            <div className="rider-picker">
              {available.map((r) => (
                <button
                  type="button"
                  className={`rider-card${selected === r.id ? ' selected' : ''}`}
                  key={r.id}
                  aria-pressed={selected === r.id}
                  onClick={() => setSelected(r.id)}
                >
                  <div className="avatar">{r.name[0]}</div>
                  <span>
                    <strong>{r.name}</strong>
                    <small>Available for assignment</small>
                  </span>
                  <span className="rider-select-mark">
                    {selected === r.id ? <Check /> : 'Select'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rider-empty-state">No other available riders right now.</div>
          )}
        </section>
        <footer className="rider-sheet-actions">
          <button className="secondary touch-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary touch-button"
            disabled={selected === null || busy}
            onClick={assign}
          >
            {busy ? 'Saving…' : 'Assign selected rider'}
          </button>
        </footer>
      </div>
      {confirmUnassign && (
        <Modal
          danger
          title="Unassign this rider?"
          message={`${order.rider_name} will no longer be assigned to ${order.order_number}. The assignment will remain in delivery history.`}
          confirmLabel={busy ? 'Unassigning…' : 'Unassign rider'}
          onCancel={() => setConfirmUnassign(false)}
          onConfirm={unassign}
        />
      )}
    </Sheet>
  );
}
function StaffOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [pickerOrder, setPickerOrder] = useState<Order | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [riders, setRiders] = useState<Array<{ id: number; name: string }>>([]);
  const load = () =>
    Promise.all([api.activeOrders(), api.riders()])
      .then(([o, r]) => {
        setOrders(o);
        setRiders(r);
      })
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
    const t = window.setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);
  const update = async (id: number, status: string) => {
    if (status === 'Cancelled') {
      const order = orders.find((item) => item.id === id);
      if (order) {
        setCancelOrder(order);
        setCancelReason('');
      }
      return;
    }
    try {
      await api.staffStatus(id, status);
      setOrders((current) => current.map((o) => (o.id === id ? { ...o, status } : o)));
      setMessage('Order status updated.');
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const confirmCancellation = async () => {
    if (!cancelOrder || !cancelReason.trim()) return;
    setCancelBusy(true);
    try {
      await api.staffStatus(cancelOrder.id, 'Cancelled', cancelReason.trim());
      setOrders((current) =>
        current.map((o) => (o.id === cancelOrder.id ? { ...o, status: 'Cancelled' } : o)),
      );
      setMessage(`${cancelOrder.order_number} was cancelled.`);
      setCancelOrder(null);
      setCancelReason('');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  };
  const assign = async (riderId: number) => {
    if (!pickerOrder || pickerOrder.rider_id === riderId) return;
    try {
      await api.assignRider(pickerOrder.id, riderId);
      setMessage('Rider assignment updated.');
      setPickerOrder(null);
      load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const unassign = async () => {
    if (!pickerOrder) return;
    try {
      await api.unassignRider(pickerOrder.id);
      setMessage('Rider unassigned.');
      setPickerOrder(null);
      load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <PageTitle title="Active orders" sub="Update customer orders and assign available riders.">
      {!riders.length && (
        <p className="notice">
          No available riders at the moment. Please register a rider or wait until an existing rider
          becomes available before dispatching an order.
        </p>
      )}
      {message && <p className="notice">{message}</p>}
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Rider</th>
                <th>Delivery record</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.order_number}</strong>
                  </td>
                  <td>{o.customer_name}</td>
                  <td>
                    {['Cancelled', 'Delivered'].includes(o.status) ? (
                      <span
                        className={`status ${o.status === 'Cancelled' ? 'status-cancelled' : 'status-active'}`}
                      >
                        {o.status}
                      </span>
                    ) : (
                      <select value={o.status} onChange={(e) => update(o.id, e.target.value)}>
                        {[
                          'Pending',
                          'Confirmed',
                          'Preparing',
                          'Out for Delivery',
                          'Delivered',
                          'Cancelled',
                        ].map((x) => (
                          <option
                            key={x}
                            disabled={
                              (x === 'Out for Delivery' &&
                                (!o.rider_id || Number(o.rider_availability) !== 1)) ||
                              x === 'Delivered'
                            }
                          >
                            {x}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="rider-assignment-cell">
                      <button className="secondary touch-button" onClick={() => setPickerOrder(o)}>
                        {o.rider_name ? 'Change rider' : 'Assign rider'}
                      </button>
                      {o.rider_name ? (
                        <div className="assigned-rider-summary">
                          <strong>{o.rider_name}</strong>
                          <span>{o.rider_phone || 'No contact number'}</span>
                          <span>
                            {o.rider_availability ? 'Available' : 'Unavailable'}
                            {o.assigned_at ? ' · ' + new Date(o.assigned_at).toLocaleString() : ''}
                          </span>
                        </div>
                      ) : (
                        <small className="unassigned-label">Waiting for rider assignment</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <small>
                      {o.delivered_by_name
                        ? 'Delivered by ' + o.delivered_by_name
                        : 'Not delivered'}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && <Empty text="No active orders." />}
        </div>
      </section>
      {pickerOrder && (
        <RiderAssignmentSheet
          order={pickerOrder}
          riders={riders}
          onClose={() => setPickerOrder(null)}
          onAssign={assign}
          onUnassign={unassign}
        />
      )}
      {cancelOrder && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-cancel-title"
          >
            <div className="confirm-icon danger">
              <AlertTriangle />
            </div>
            <h2 id="staff-cancel-title">Cancel {cancelOrder.order_number}?</h2>
            <p>Please provide a reason for cancelling this order.</p>
            <textarea
              required
              autoFocus
              rows={3}
              placeholder="Reason for cancellation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="secondary touch-button"
                disabled={cancelBusy}
                onClick={() => setCancelOrder(null)}
              >
                Go back
              </button>
              <button
                className="danger-button touch-button"
                disabled={cancelBusy || !cancelReason.trim()}
                onClick={confirmCancellation}
              >
                {cancelBusy ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTitle>
  );
}
function StaffHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    api
      .staffHistory(q, status)
      .then(setOrders)
      .catch(() => {});
  }, [q, status]);
  return (
    <PageTitle title="Order history" sub="Review completed and cancelled orders.">
      <div className="history-filters">
        <label className="history-search">
          <Search />
          <input
            aria-label="Search order or customer"
            placeholder="Search order or customer"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="history-status">
          <span>Filter by status</span>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </label>
      </div>
      <section className="panel table-panel">
        <OrderTable orders={orders} />
      </section>
    </PageTitle>
  );
}
function CustomerDetails({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [data, setData] = useState<any | null>(null);
  useEffect(() => {
    api
      .customerDetails(userId)
      .then(setData)
      .catch(() => {});
  }, [userId]);
  return (
    <Sheet onClose={onClose}>
      <div className="customer-details">
        {data ? (
          <>
            <div className="panel-title">
              <div>
                <span className="eyebrow">CUSTOMER DETAILS</span>
                <h2>{data.customer.name}</h2>
                <p>
                  {data.customer.email} · {data.customer.phone}
                </p>
              </div>
              <button className="secondary touch-button" onClick={onClose}>
                Close
              </button>
            </div>
            <section>
              <h3>Saved delivery addresses</h3>
              {data.addresses.length ? (
                data.addresses.map((a: any) => (
                  <div className="detail-card" key={a.id}>
                    <strong>
                      {a.label}
                      {Number(a.is_default) === 1 ? ' · Default' : ''}
                    </strong>
                    <p>
                      {a.recipient_name} · {a.contact_number}
                    </p>
                    <small>{a.delivery_address}</small>
                  </div>
                ))
              ) : (
                <p className="muted">No saved addresses.</p>
              )}
            </section>
            <section>
              <h3>Order history</h3>
              {data.orders.length ? (
                <div className="detail-order-list">
                  {data.orders.map((o: any) => (
                    <div className="detail-order" key={o.id}>
                      <div>
                        <strong>{o.order_number}</strong>
                        <small>{new Date(o.created_at).toLocaleString()}</small>
                        <p>{o.items}</p>
                      </div>
                      <div>
                        <span className="status">{o.status}</span>
                        <strong>{peso(o.total_amount)}</strong>
                        <button
                          className="text-button touch-button"
                          onClick={() =>
                            alert(
                              o.order_number + ' | ' + o.delivery_address + ' | ' + (o.items || ''),
                            )
                          }
                        >
                          View Order Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No orders yet.</p>
              )}
            </section>
          </>
        ) : (
          <div className="loading">Loading customer details…</div>
        )}
      </div>
    </Sheet>
  );
}
function StaffCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    api
      .staffCustomers()
      .then(setCustomers)
      .catch(() => {});
  }, []);
  return (
    <PageTitle title="Customers" sub="Customer accounts and order totals.">
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Total orders</th>
                <th>Saved addresses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.user_id}>
                  <td>
                    <strong>{c.customer_name || c.name}</strong>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.contact_number || c.phone}</td>
                  <td>{c.order_count}</td>
                  <td>{c.address_count || 0}</td>
                  <td>
                    <button
                      className="secondary touch-button"
                      onClick={() => setSelected(c.user_id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!customers.length && <Empty text="No customers found." />}
        </div>
      </section>
      {selected && <CustomerDetails userId={selected} onClose={() => setSelected(null)} />}
    </PageTitle>
  );
}
function StaffNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const known = useRef<Set<number> | null>(null);
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .staffNotifications()
        .then((next: any[]) => {
          if (!active) return;
          if (known.current) {
            const newest = next.find((n) => !known.current!.has(Number(n.id)));
            if (newest)
              setMessage(
                newest.type === 'order_cancelled'
                  ? `${newest.order_number} was cancelled.`
                  : `New order ${newest.order_number} was placed.`,
              );
          }
          known.current = new Set(next.map((n) => Number(n.id)));
          setItems(next);
        })
        .catch((e) => {
          if (active) setMessage((e as Error).message);
        });
    void load();
    const timer = window.setInterval(load, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);
  return (
    <PageTitle title="Notifications" sub="New orders and cancellations appear here automatically.">
      <section className="notification-panel staff-notifications">
        {message && <p className="notice">{message}</p>}
        {items.length ? (
          items.map((n) => (
            <div className="notification-item" key={n.id}>
              <div>
                <strong>
                  {n.type === 'order_cancelled' ? 'Order cancelled' : 'New order received'}
                </strong>
                <p>
                  {n.order_number} · {n.customer_name}
                </p>
                {n.type === 'order_cancelled' && n.cancellation_reason && (
                  <small>{n.cancellation_reason}</small>
                )}
                {n.type === 'order_created' && (
                  <small>
                    {n.status} · {peso(n.total_amount)}
                  </small>
                )}
              </div>
              <time>{new Date(n.created_at).toLocaleString()}</time>
            </div>
          ))
        ) : (
          <div className="notification-empty">
            <strong>No notifications yet</strong>
            <p>
              New customer orders and cancellations will show here automatically. This page checks
              for updates every few seconds.
            </p>
          </div>
        )}
      </section>
    </PageTitle>
  );
}
function RiderDashboard({ user: initialUser }: { user?: User }) {
  const [user] = useState<User>(
    initialUser || { id: 0, name: 'Rider', email: '', phone: '', role: 'rider' },
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [deliveryConfirmation, setDeliveryConfirmation] = useState<Order | null>(null);
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isHistory = path === '/rider/history';
  const isDeliveries = path === '/rider/deliveries';
  const load = () =>
    api
      .riderOrders()
      .then(setOrders)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);
  const active = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status));
  const completed = orders.filter((o) => o.status === 'Delivered');
  const today = new Date().toLocaleDateString('en-CA');
  const completedToday = completed.filter(
    (o) => (o.delivered_at || '').slice(0, 10) === today,
  ).length;
  const nextDelivery = [...active].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const history = orders
    .filter((o) => o.status === 'Delivered' || o.status === 'Cancelled')
    .filter((o) => o.order_number.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.delivered_at || b.created_at).localeCompare(a.delivered_at || a.created_at));
  const updateStatus = async (order: Order, status: string) => {
    try {
      await api.riderStatus(order.id, status);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const confirmDelivery = async () => {
    if (!deliveryConfirmation || deliveryBusy) return;
    setDeliveryBusy(true);
    setMessage('');
    try {
      await api.riderStatus(deliveryConfirmation.id, 'Delivered');
      setDeliveryConfirmation(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setDeliveryBusy(false);
    }
  };
  const statusClass = (status: string) =>
    status === 'Delivered'
      ? 'status-active'
      : status === 'Cancelled'
        ? 'status-cancelled'
        : 'status';
  return isHistory ? (
    <PageTitle title="Delivery history" sub="Completed and cancelled deliveries assigned to you.">
      {message && <p className="notice">{message}</p>}
      <section className="rider-history-tools">
        <label className="search">
          <Search />
          <input
            aria-label="Search order number"
            placeholder="Search order number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </section>
      <section className="rider-history-list">
        {history.length ? (
          history.map((o) => (
            <article className="rider-history-row" key={o.id}>
              <div>
                <strong>{o.order_number}</strong>
                <small>{o.customer_name}</small>
              </div>
              <span className={`status ${statusClass(o.status)}`}>{o.status}</span>
              <time>
                {o.delivered_at
                  ? new Date(o.delivered_at).toLocaleString()
                  : new Date(o.created_at).toLocaleDateString()}
              </time>
            </article>
          ))
        ) : (
          <Empty text="No matching delivery history" />
        )}
      </section>
    </PageTitle>
  ) : isDeliveries ? (
    <PageTitle
      title="My deliveries"
      sub="Your active assignments and the details needed to complete each drop-off."
    >
      {message && <p className="notice">{message}</p>}
      <section className="rider-delivery-list">
        {active.length ? (
          active.map((o) => (
            <article className="rider-delivery-card" key={o.id}>
              <header className="rider-delivery-heading">
                <div>
                  <span className="eyebrow">DELIVERY</span>
                  <h2>{o.order_number}</h2>
                </div>
                <span className={`status ${statusClass(o.status)}`}>{o.status}</span>
              </header>
              <div className="rider-delivery-customer">
                <strong>{o.customer_name}</strong>
                <a href={`tel:${o.contact_number}`}>{o.contact_number}</a>
              </div>
              <div className="rider-delivery-address">
                <span>Delivery address</span>
                <p>{o.delivery_address}</p>
              </div>
              <div className="rider-delivery-items">
                <span>Order details</span>
                <p>{o.items || 'Order items unavailable'}</p>
                <small>
                  {o.payment_method} · {peso(o.total_amount)}
                </small>
              </div>
              <footer className="rider-delivery-actions">
                {o.status !== 'Out for Delivery' && (
                  <button
                    className="primary touch-button"
                    onClick={() => updateStatus(o, 'Out for Delivery')}
                  >
                    Start delivery
                  </button>
                )}
                {o.status === 'Out for Delivery' && (
                  <button
                    className="primary touch-button rider-mark-delivered"
                    onClick={() => setDeliveryConfirmation(o)}
                  >
                    Mark delivered
                  </button>
                )}
              </footer>
            </article>
          ))
        ) : (
          <Empty text="No active deliveries assigned" />
        )}
      </section>
      {deliveryConfirmation &&
        createPortal(
          <div
            className="modal-backdrop"
            role="presentation"
            onClick={() => {
              if (!deliveryBusy) setDeliveryConfirmation(null);
            }}
          >
            <div
              className="confirm-modal rider-delivery-confirmation"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delivery-confirm-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon">
                <Check />
              </div>
              <h2 id="delivery-confirm-title">Confirm delivery?</h2>
              <p>
                Mark order <strong>{deliveryConfirmation.order_number}</strong> as delivered?
              </p>
              <div className="modal-actions">
                <button
                  className="secondary touch-button"
                  disabled={deliveryBusy}
                  onClick={() => setDeliveryConfirmation(null)}
                >
                  Not yet
                </button>
                <button
                  className="primary touch-button rider-confirm-delivery"
                  disabled={deliveryBusy}
                  onClick={confirmDelivery}
                >
                  {deliveryBusy ? 'Confirming…' : 'Yes, mark delivered'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </PageTitle>
  ) : (
    <PageTitle
      title={`Welcome, ${user.name.split(' ')[0]}`}
      sub="Here’s your delivery overview for today."
    >
      {message && <p className="notice">{message}</p>}
      <section className="rider-overview-stats">
        <article>
          <span>Active deliveries</span>
          <strong>{active.length}</strong>
        </article>
        <article>
          <span>Completed today</span>
          <strong>{completedToday}</strong>
        </article>
      </section>
      <section className="rider-next-delivery">
        <div className="rider-next-heading">
          <div>
            <span className="eyebrow">UP NEXT</span>
            <h2>{nextDelivery ? nextDelivery.order_number : 'You’re all caught up'}</h2>
          </div>
          {nextDelivery && (
            <span className={`status ${statusClass(nextDelivery.status)}`}>
              {nextDelivery.status}
            </span>
          )}
        </div>
        {nextDelivery ? (
          <>
            <p className="rider-next-customer">
              {nextDelivery.customer_name} · {nextDelivery.contact_number}
            </p>
            <p className="rider-next-address">{nextDelivery.delivery_address}</p>
            <button className="primary touch-button" onClick={() => navigate('/rider/deliveries')}>
              View delivery details
            </button>
          </>
        ) : (
          <p className="rider-next-empty">New assignments will appear in My Deliveries.</p>
        )}
      </section>
      <section className="rider-recent-activity">
        <div className="rider-section-heading">
          <h2>Recent activity</h2>
          <button className="text-button" onClick={() => navigate('/rider/history')}>
            View history
          </button>
        </div>
        {orders.length ? (
          [...orders]
            .sort((a, b) =>
              (b.delivered_at || b.created_at).localeCompare(a.delivered_at || a.created_at),
            )
            .slice(0, 3)
            .map((o) => (
              <div className="rider-activity-row" key={o.id}>
                <span className="rider-activity-dot" />
                <div>
                  <strong>{o.order_number}</strong>
                  <small>
                    {o.status} · {new Date(o.delivered_at || o.created_at).toLocaleString()}
                  </small>
                </div>
              </div>
            ))
        ) : (
          <p className="rider-next-empty">Your delivery activity will appear here.</p>
        )}
      </section>
    </PageTitle>
  );
}
function TeamManagement() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'staff' });
  const [message, setMessage] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createTeamUser(form);
      window.dispatchEvent(new CustomEvent('knk-team-user-created', { detail: created }));
      setMessage(`${form.role === 'staff' ? 'Staff' : 'Rider'} account created.`);
      setForm({ ...form, name: '', email: '', phone: '', password: '' });
    } catch (x) {
      setMessage((x as Error).message);
    }
  };
  return (
    <PageTitle title="Staff & riders" sub="Create team accounts.">
      <section className="panel">
        <h2>Add team member</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Contact
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="rider">Rider</option>
            </select>
          </label>
          <button className="primary touch-button">Create account</button>
        </form>
        {message && <p className="notice">{message}</p>}
      </section>
    </PageTitle>
  );
}
function Admin({ user, onLogout }: { user: User; onLogout: () => void }) {
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      onLogout();
    }
  };
  return (
    <Shell user={user} onLogout={logout} cartCount={0}>
      <Routes>
        <Route path="/admin" element={<Dashboard user={user} />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/team" element={<TeamManagement />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Shell>
  );
}
function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('customer');
  const [pending, setPending] = useState<{ user: ManagedUser; action: string } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const load = () =>
    api
      .adminUsers()
      .then((data) =>
        setUsers(
          data.map((u: ManagedUser) => ({
            ...u,
            role: u.role.toLowerCase() as ManagedUser['role'],
          })),
        ),
      )
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
    const refresh = () => load();
    const created = () => load();
    window.addEventListener('focus', refresh);
    window.addEventListener('knk-team-user-created', created);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('knk-team-user-created', created);
    };
  }, []);
  const moderate = async () => {
    if (!pending) return;
    try {
      await api.moderateUser(pending.user.id, pending.action);
      setMessage(`${pending.user.name} updated.`);
      setPending(null);
      load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const group = users.filter((u) => u.role === tab);
  const title = tab === 'customer' ? 'Customers' : tab === 'staff' ? 'Staff' : 'Riders';
  return (
    <div className="user-management">
      {message && <p className="notice">{message}</p>}
      <div className="role-tabs">
        {[
          ['customer', 'Customers'],
          ['staff', 'Staff'],
          ['rider', 'Riders'],
        ].map(([value, label]) => (
          <button
            className={`touch-button ${tab === value ? 'selected' : ''}`}
            key={value}
            onClick={() => setTab(value)}
          >
            {label} <span>{users.filter((u) => u.role === value).length}</span>
          </button>
        ))}
        <button className="secondary touch-button" onClick={load}>
          Refresh accounts
        </button>
      </div>
      <section className="panel table-panel">
        <div className="panel-title">
          <h2>{title}</h2>
          <span>{group.length} account(s)</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Total orders</th>
                <th>Saved addresses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {group.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">{u.name[0]}</div>
                      <span>
                        <strong>{u.name}</strong>
                        <small>{u.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>{u.phone}</td>
                  <td>{u.order_count || 0}</td>
                  <td>
                    <small>{u.address_summary || 'None saved'}</small>
                  </td>
                  <td>
                    <span className={`status status-${u.account_status}`}>{u.account_status}</span>
                  </td>
                  <td className="user-management-actions">
                    {tab === 'customer' && (
                      <button
                        className="management-action details-action touch-button"
                        onClick={() => setSelectedCustomer(u.id)}
                      >
                        View details
                      </button>
                    )}
                    {tab === 'rider' ? (
                      <>
                        <button
                          className="management-action touch-button"
                          disabled={u.account_status !== 'active'}
                          onClick={() => setPending({ user: u, action: 'deactivate' })}
                        >
                          Deactivate
                        </button>
                        <button
                          className="management-action danger-action touch-button"
                          disabled={u.account_status === 'deleted'}
                          onClick={() => setPending({ user: u, action: 'delete' })}
                        >
                          Delete account
                        </button>
                      </>
                    ) : (
                      <button
                        className="management-action danger-action touch-button"
                        disabled={u.account_status === 'banned'}
                        onClick={() => setPending({ user: u, action: 'ban' })}
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!group.length && <Empty text={`No ${title.toLowerCase()} found.`} />}
        </div>
      </section>
      {selectedCustomer && (
        <CustomerDetails userId={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
      {pending && (
        <Modal
          danger={pending.action !== 'deactivate'}
          title={
            pending.action === 'ban'
              ? 'Ban User'
              : pending.action === 'delete'
                ? 'Delete Rider Account'
                : 'Deactivate Rider'
          }
          message={`This will change ${pending.user.name}'s access immediately. Continue?`}
          onCancel={() => setPending(null)}
          onConfirm={moderate}
        />
      )}
    </div>
  );
}
function Dashboard({ user }: { user: User }) {
  const [greeting] = useState(randomAdminGreeting);
  const [stats, setStats] = useState<any>({});
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    Promise.all([api.stats(), api.allOrders()]).then(([s, o]) => {
      setStats(s);
      setOrders(o.slice(0, 5));
    });
  }, []);
  return (
    <PageTitle title={`${greeting} ${user.name}.`} sub="Here is the pulse of Kusina ni Kayi today.">
      <div className="stat-grid">
        {[
          ['Orders today', stats.orders_today || 0],
          ['Pending orders', stats.pending || 0],
          ['Available products', stats.products_available || 0],
          ['Sales today', peso(stats.sales_today || 0)],
        ].map(([l, v]) => (
          <div className="stat-card" key={l as string}>
            <small>{l}</small>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="panel-title">
          <h2>Recent orders</h2>
          <a href="/admin/orders">View all</a>
        </div>
        <OrderTable orders={orders} />
      </section>
      <h2 className="section-heading">User moderation</h2>
      <UserManagement />
    </PageTitle>
  );
}
function OrderTable({
  orders,
  onStatus,
  onAssign,
  riders = [],
}: {
  orders: Order[];
  onStatus?: (id: number, s: string) => void;
  onAssign?: (id: number, rider_id: number) => void;
  riders?: Array<{ id: number; name: string }>;
}) {
  return (
    <div className="table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            {onAssign && <th>Assigned rider</th>}
            <th>Delivery record</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const deliveryComplete = o.status === 'Delivered' || Boolean(o.delivered_at);
            const status = deliveryComplete ? 'Delivered' : o.status;
            return (
              <tr key={o.id}>
                <td>
                  <strong>{o.order_number}</strong>
                </td>
                <td>{o.customer_name}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{peso(o.total_amount)}</td>
                <td className="order-status-cell">
                  {onStatus && !deliveryComplete && status !== 'Cancelled' ? (
                    <select
                      value={status}
                      onChange={(e) => onStatus(o.id, e.target.value)}
                      aria-label={`Update status for ${o.order_number}`}
                    >
                      {[
                        'Pending',
                        'Confirmed',
                        'Preparing',
                        'Out for Delivery',
                        'Delivered',
                        'Cancelled',
                      ].map((s) => (
                        <option
                          key={s}
                          value={s}
                          disabled={
                            s === 'Delivered' ||
                            (s === 'Out for Delivery' &&
                              (!o.rider_id || Number(o.rider_availability) !== 1))
                          }
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`status ${status === 'Delivered' ? 'status-active' : status === 'Cancelled' ? 'status-cancelled' : ''}`}
                    >
                      {status}
                    </span>
                  )}
                </td>
                {onAssign && (
                  <td>
                    {o.rider_name ? (
                      <small>
                        <strong>{o.rider_name}</strong>
                        <br />
                        {o.rider_phone}
                        <br />
                        {o.assigned_at ? new Date(o.assigned_at).toLocaleString() : ''}
                      </small>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => e.target.value && onAssign(o.id, Number(e.target.value))}
                      >
                        <option value="">Assign available rider</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                )}
                <td>
                  <small>
                    {o.delivered_by_name
                      ? 'Delivered by ' +
                        o.delivered_by_name +
                        (o.delivered_at ? ' · ' + new Date(o.delivered_at).toLocaleString() : '')
                      : status === 'Delivered'
                        ? `Delivered${o.rider_name ? ' by ' + o.rider_name : ' · Rider not recorded'}`
                        : status === 'Cancelled'
                          ? o.rider_name
                            ? 'Cancelled · Assigned to ' + o.rider_name
                            : 'Order cancelled'
                          : o.rider_name
                            ? 'Assigned to ' + o.rider_name
                            : 'Waiting for rider assignment.'}
                  </small>
                </td>
                <td>
                  {isOrderRated(o) ? (
                    <div className="admin-rating">
                      {Number(o.rating) > 0 && <strong>{'★'.repeat(Number(o.rating))}</strong>}
                      {o.review && <small>{o.review}</small>}
                      {!Number(o.rating) && <small>Rated</small>}
                    </div>
                  ) : (
                    <span className="muted">Not rated</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!orders.length && <Empty text="No orders to show." />}
    </div>
  );
}
function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [riders, setRiders] = useState<Array<{ id: number; name: string }>>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const load = () =>
    Promise.all([api.allOrders(), api.cancellationAlerts(), api.riders(), api.assignmentHistory(q)])
      .then(([o, a, r, h]) => {
        setOrders(o);
        setAlerts(a);
        setRiders(r);
        setHistory(h);
      })
      .catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, [q]);
  const update = async (id: number, status: string) => {
    try {
      await api.updateStatus(id, status);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const assign = async (id: number, rider_id: number) => {
    try {
      await api.assignRider(id, rider_id);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const filtered = orders.filter((o) =>
    (o.order_number + ' ' + o.customer_name).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <PageTitle title="Orders" sub="Review incoming orders and keep the kitchen moving.">
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            placeholder="Search order or customer"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {alerts.length > 0 && (
        <div className="notice">
          Cancellation alerts: {alerts.length} recent order cancellation(s).
        </div>
      )}
      <section className="panel table-panel">
        <OrderTable orders={filtered} onStatus={update} onAssign={assign} riders={riders} />
      </section>
      <section className="panel table-panel">
        <h2>Rider assignment history</h2>
        <div className="search">
          <Search />
          <input
            placeholder="Search rider or order"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Rider</th>
                <th>Assigned by</th>
                <th>Assigned at</th>
                <th>Ended</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.order_number}</td>
                  <td>
                    {h.rider_name}
                    <small>{h.rider_phone}</small>
                  </td>
                  <td>{h.assigned_by_name}</td>
                  <td>{new Date(h.assigned_at).toLocaleString()}</td>
                  <td>
                    {h.ended_at ? new Date(h.ended_at).toLocaleString() : 'Current assignment'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageTitle>
  );
}
function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const load = () =>
    Promise.all([api.products(), api.categories()]).then(([p, c]) => {
      setProducts(p);
      setCats(c);
    });
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    if (editing) await api.saveProduct(editing);
    setEditing(null);
    load();
  };
  const remove = async () => {
    if (deleting) {
      await api.deleteProduct(deleting.id);
      setDeleting(null);
      load();
    }
  };
  return (
    <PageTitle title="Products" sub="Keep the KnK menu fresh and available.">
      <div className="page-actions">
        <button
          className="primary touch-button"
          onClick={() => setEditing({ is_available: 1, price: 0 })}
        >
          <Plus /> Add product
        </button>
      </div>
      {editing && (
        <Sheet onClose={() => setEditing(null)}>
          <EditProduct
            value={editing}
            cats={cats}
            onChange={setEditing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </Sheet>
      )}
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong className="food-name">{p.name}</strong>
                  <small>{p.description}</small>
                </td>
                <td>{p.category_name || 'Uncategorized'}</td>
                <td>{peso(p.price)}</td>
                <td>{p.is_available ? 'Yes' : 'No'}</td>
                <td>
                  <button className="text-button touch-button" onClick={() => setEditing(p)}>
                    Edit
                  </button>
                  <button
                    className="text-button danger touch-button"
                    onClick={() => setDeleting(p)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {deleting && (
        <Modal
          danger
          title="Delete Product"
          message={`Delete ${deleting.name}? This action cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </PageTitle>
  );
}
function EditProduct({
  value,
  cats,
  onChange,
  onSave,
  onCancel,
}: {
  value: Partial<Product>;
  cats: Category[];
  onChange: (v: Partial<Product>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="form-panel">
      <h2>{value.id ? 'Edit product' : 'New product'}</h2>
      <div className="form-grid">
        <label>
          Name
          <input
            value={value.name || ''}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
        <label>
          Price
          <input
            type="number"
            step=".01"
            value={value.price || 0}
            onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
          />
        </label>
        <label>
          Category
          <select
            value={value.category_id || ''}
            onChange={(e) => onChange({ ...value, category_id: Number(e.target.value) || null })}
          >
            <option value="">Uncategorized</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Availability
          <select
            value={value.is_available ?? 1}
            onChange={(e) => onChange({ ...value, is_available: Number(e.target.value) })}
          >
            <option value="1">Available</option>
            <option value="0">Unavailable</option>
          </select>
        </label>
      </div>
      <label>
        Image path (optional)
        <input
          value={value.image_path || ''}
          onChange={(e) => onChange({ ...value, image_path: e.target.value })}
          placeholder="/assets/foods/new-filipino-dish.webp"
        />
        <small className="field-hint">
          Place images in frontend/public/assets/foods/ first, then enter the local asset path.
        </small>
      </label>
      <label>
        Description
        <textarea
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </label>
      <button className="primary" onClick={onSave}>
        Save product
      </button>{' '}
      <button className="secondary" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const load = () => api.categories().then(setCats);
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    if (edit) await api.saveCategory(edit);
    setEdit(null);
    load();
  };
  const remove = async () => {
    if (deleting) {
      try {
        await api.deleteCategory(deleting.id);
        setDeleting(null);
        load();
      } catch (e) {
        alert((e as Error).message);
      }
    }
  };
  return (
    <PageTitle title="Categories" sub="Organize the menu into simple, helpful groups.">
      <div className="page-actions">
        <button className="primary touch-button" onClick={() => setEdit({})}>
          <Plus /> Add category
        </button>
      </div>
      {edit && (
        <Sheet onClose={() => setEdit(null)}>
          <div className="form-panel">
            <h2>{edit.id ? 'Edit category' : 'New category'}</h2>
            <label>
              Name
              <input
                value={edit.name || ''}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                value={edit.description || ''}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
            </label>
            <button className="primary touch-button" onClick={save}>
              Save category
            </button>{' '}
            <button className="secondary touch-button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </Sheet>
      )}
      <div className="category-list">
        {cats.map((c) => (
          <div className="panel category-row" key={c.id}>
            <div>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
            </div>
            <div>
              <button className="text-button touch-button" onClick={() => setEdit(c)}>
                Edit
              </button>
              <button className="text-button danger touch-button" onClick={() => setDeleting(c)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {deleting && (
        <Modal
          danger
          title="Delete Category"
          message={`Delete ${deleting.name}? This action cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </PageTitle>
  );
}
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [phase, setPhase] = useState<
    'restoring' | 'login' | 'authenticated-loading' | 'authenticated'
  >('restoring');
  const sessionRequest = useRef<Promise<unknown> | null>(null);
  const loginDestination = useRef<string | null>(null);
  const requestedLocation = useRef<{ pathname: string; search: string; hash: string } | null>(
    location.pathname === '/'
      ? null
      : { pathname: location.pathname, search: location.search, hash: location.hash },
  );

  useLayoutEffect(() => {
    document.getElementById('startup-loading')?.remove();
  }, []);
  useEffect(() => {
    let active = true;
    sessionRequest.current ??= api.me().catch(() => null);
    sessionRequest.current.then((restored: unknown) => {
      if (!active) return;
      if (isAuthenticatedUser(restored)) {
        setUser(restored);
        setPhase('authenticated-loading');
      } else setPhase('login');
    });
    return () => {
      active = false;
    };
  }, []);
  useLayoutEffect(() => {
    if (phase !== 'authenticated-loading' || !user) return;
    if (loginDestination.current) {
      navigate(loginDestination.current, { replace: true, state: null });
      loginDestination.current = null;
    }
    const frame = window.requestAnimationFrame(() => setPhase('authenticated'));
    return () => window.cancelAnimationFrame(frame);
  }, [phase, user, navigate]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setPhase('authenticated-loading');
    const from =
      requestedLocation.current ||
      (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)
        ?.from;
    const requestedPath = from?.pathname || '';
    const authorizedPaths: Record<User['role'], string[]> = {
      admin: ['/admin', '/admin/orders', '/admin/products', '/admin/categories', '/admin/team'],
      staff: [
        '/staff',
        '/staff/orders',
        '/staff/history',
        '/staff/customers',
        '/staff/notifications',
      ],
      rider: ['/rider', '/rider/deliveries', '/rider/history'],
      customer: ['/menu', '/cart', '/orders', '/account'],
    };
    const dashboard: Record<User['role'], string> = {
      admin: '/admin',
      staff: '/staff',
      rider: '/rider',
      customer: '/menu',
    };
    const destination = authorizedPaths[loggedInUser.role].includes(requestedPath)
      ? `${requestedPath}${from?.search || ''}${from?.hash || ''}`
      : dashboard[loggedInUser.role];
    loginDestination.current = destination;
    requestedLocation.current = null;
  };
  const handleLogout = () => {
    setUser(null);
    setPhase('login');
    loginDestination.current = null;
    requestedLocation.current = null;
    navigate('/', { replace: true, state: null });
  };

  if (phase === 'restoring') return <AuthenticatedLoadingScreen />;
  if (phase === 'login') {
    if (location.pathname !== '/')
      requestedLocation.current = {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      };
    return (
      <Routes>
        <Route path="/" element={<Auth onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
      </Routes>
    );
  }
  if (!user) return <AuthenticatedLoadingScreen />;
  if (phase === 'authenticated-loading' && loginDestination.current)
    return <AuthenticatedLoadingScreen />;
  return (
    <>
      {user.role === 'admin' ? (
        <Admin user={user} onLogout={handleLogout} />
      ) : user.role === 'staff' ? (
        <Shell
          user={user}
          onLogout={async () => {
            try {
              await api.logout();
            } finally {
              handleLogout();
            }
          }}
          cartCount={0}
        >
          <Routes>
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
            <Route path="/staff/history" element={<StaffHistory />} />
            <Route path="/staff/customers" element={<StaffCustomers />} />
            <Route path="/staff/notifications" element={<StaffNotifications />} />
            <Route path="*" element={<Navigate to="/staff" replace />} />
          </Routes>
        </Shell>
      ) : user.role === 'rider' ? (
        <Shell
          user={user}
          onLogout={async () => {
            try {
              await api.logout();
            } finally {
              handleLogout();
            }
          }}
          cartCount={0}
        >
          <Routes>
            <Route path="/rider" element={<RiderDashboard user={user} />} />
            <Route path="/rider/deliveries" element={<RiderDashboard user={user} />} />
            <Route path="/rider/history" element={<RiderDashboard user={user} />} />
            <Route path="*" element={<Navigate to="/rider" replace />} />
          </Routes>
        </Shell>
      ) : (
        <Customer user={user} onLogout={handleLogout} />
      )}
      {phase === 'authenticated-loading' && <AuthenticatedLoadingScreen />}
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
