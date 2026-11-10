import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { api, type Address, type Product } from './api';

type CartItem = { product: Product; quantity: number; imageUrl: string };
const peso = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const Empty = ({ text }: { text: string }) => (
  <div className="empty">
    <h3>{text}</h3>
  </div>
);
const PageTitle = ({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: ReactNode;
}) => (
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

const blankAddress = {
  label: 'Home' as Address['label'],
  recipient_name: '',
  contact_number: '',
  delivery_address: '',
  is_default: 0,
};

export default function Cart({
  cart,
  save,
  setToast,
}: {
  cart: CartItem[];
  save: (c: CartItem[]) => void;
  setToast: (s: string) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({ customer_name: '', contact_number: '', delivery_address: '' });
  const [newAddress, setNewAddress] = useState<typeof blankAddress | null>(null);
  const [busy, setBusy] = useState(false);
  const subtotal = cart.reduce((n, x) => n + x.product.price * x.quantity, 0);

  const loadAddresses = () =>
    api
      .addresses()
      .then((items: Address[]) => {
        setAddresses(items);
        const selected = items.find((x) => Number(x.is_default) === 1) || items[0];
        if (selected)
          setForm({
            customer_name: selected.recipient_name,
            contact_number: selected.contact_number,
            delivery_address: selected.delivery_address,
          });
      })
      .catch((error) => setToast((error as Error).message));

  useEffect(() => {
    void loadAddresses();
  }, []);

  const choose = (id: number) => {
    const selected = addresses.find((x) => x.id === id);
    if (selected)
      setForm({
        customer_name: selected.recipient_name,
        contact_number: selected.contact_number,
        delivery_address: selected.delivery_address,
      });
  };

  const addAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!newAddress) return;
    try {
      const saved = await api.saveAddress({
        ...newAddress,
        is_default: addresses.length === 0 ? 1 : newAddress.is_default,
      });
      setNewAddress(null);
      await loadAddresses();
      setForm({
        customer_name: saved.recipient_name,
        contact_number: saved.contact_number,
        delivery_address: saved.delivery_address,
      });
      setToast('Saved address added.');
    } catch (error) {
      setToast((error as Error).message);
    }
  };

  const checkout = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.createOrder({
        ...form,
        items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
      });
      save([]);
      setToast(`Order ${result.order_number} placed successfully.`);
    } catch (error) {
      setToast((error as Error).message);
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
          {cart.map((item) => (
            <div className="cart-row" key={item.product.id}>
              <div className="food-thumb">
                <img src={item.imageUrl} alt={item.product.name} />
              </div>
              <div className="grow">
                <strong>{item.product.name}</strong>
                <small>{peso(item.product.price)} each</small>
              </div>
              <div className="quantity">
                <button
                  aria-label="Decrease quantity"
                  onClick={() =>
                    save(
                      cart.map((x) =>
                        x.product.id === item.product.id
                          ? { ...x, quantity: Math.max(1, x.quantity - 1) }
                          : x,
                      ),
                    )
                  }
                >
                  <Minus />
                </button>
                <span>{item.quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() =>
                    save(
                      cart.map((x) =>
                        x.product.id === item.product.id ? { ...x, quantity: x.quantity + 1 } : x,
                      ),
                    )
                  }
                >
                  <Plus />
                </button>
              </div>
              <strong>{peso(item.product.price * item.quantity)}</strong>
              <button
                className="icon-btn"
                aria-label="Remove item"
                onClick={() => save(cart.filter((x) => x.product.id !== item.product.id))}
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Delivery details</h2>
          {addresses.length > 0 && (
            <label>
              Saved address
              <select
                value={(addresses.find((x) => Number(x.is_default) === 1) || addresses[0]).id}
                onChange={(event) => choose(Number(event.target.value))}
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} - {address.recipient_name}
                    {Number(address.is_default) === 1 ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          {addresses.length < 3 && (
            <button
              className="secondary touch-button"
              type="button"
              onClick={() =>
                setNewAddress({ ...blankAddress, is_default: addresses.length === 0 ? 1 : 0 })
              }
            >
              + Add saved address
            </button>
          )}
          <p className="form-hint">
            Saved addresses can also be edited in{' '}
            <a className="inline-link" href="/account">
              My Account
            </a>
            .
          </p>
          {newAddress && (
            <form className="saved-address-form" onSubmit={addAddress}>
              <h3>Add saved address</h3>
              <label>
                Label
                <select
                  value={newAddress.label}
                  onChange={(event) =>
                    setNewAddress({ ...newAddress, label: event.target.value as Address['label'] })
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
                  required
                  value={newAddress.recipient_name}
                  onChange={(event) =>
                    setNewAddress({ ...newAddress, recipient_name: event.target.value })
                  }
                />
              </label>
              <label>
                Contact number
                <input
                  required
                  value={newAddress.contact_number}
                  onChange={(event) =>
                    setNewAddress({ ...newAddress, contact_number: event.target.value })
                  }
                />
              </label>
              <label>
                Complete delivery address
                <textarea
                  required
                  rows={3}
                  value={newAddress.delivery_address}
                  onChange={(event) =>
                    setNewAddress({ ...newAddress, delivery_address: event.target.value })
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(newAddress.is_default)}
                  onChange={(event) =>
                    setNewAddress({ ...newAddress, is_default: event.target.checked ? 1 : 0 })
                  }
                />{' '}
                Set as default
              </label>
              <div className="form-actions">
                <button className="primary" type="submit">
                  Save address
                </button>
                <button className="secondary" type="button" onClick={() => setNewAddress(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          <form onSubmit={checkout}>
            <label>
              Name
              <input
                required
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              Contact number
              <input
                required
                value={form.contact_number}
                onChange={(event) => setForm({ ...form, contact_number: event.target.value })}
              />
            </label>
            <label>
              Delivery address
              <textarea
                required
                rows={3}
                value={form.delivery_address}
                onChange={(event) => setForm({ ...form, delivery_address: event.target.value })}
              />
            </label>
            <div className="summary">
              <span>
                Subtotal <b>{peso(subtotal)}</b>
              </span>
              <span>
                Delivery fee <b>{peso(50)}</b>
              </span>
              <strong>
                Total <b>{peso(subtotal + 50)}</b>
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
