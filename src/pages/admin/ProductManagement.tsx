import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { useStore, type NewProductInput } from '@/store/StoreContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAssistant } from '@/components/admin/AdminAssistant';
import { Badge, StockBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, type Product } from '@/types';
import { formatINR, getStockStatus } from '@/lib/inventory';

const EMPTY: NewProductInput = {
  name: '',
  category: 'Electronics',
  price: 0,
  stock: 0,
  reorderLevel: 5,
  description: '',
  rating: 4.0,
  image: '',
  specs: {},
};

export function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewProductInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      description: p.description,
      rating: p.rating,
      image: p.image,
      specs: p.specs,
      oldPrice: p.oldPrice,
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.price <= 0) e.price = 'Price must be positive';
    if (form.stock < 0) e.stock = 'Stock cannot be negative';
    if (form.reorderLevel < 0) e.reorderLevel = 'Reorder level cannot be negative';
    if (!form.image.trim()) e.image = 'Image URL is required';
    if (form.rating < 0 || form.rating > 5) e.rating = 'Rating must be 0-5';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (editing) {
      updateProduct(editing.id, form);
    } else {
      addProduct(form);
    }
    setShowForm(false);
  };

  const remove = (p: Product) => {
    if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
      deleteProduct(p.id);
    }
  };

  return (
    <>
      <AdminLayout
        title="Product Management"
        action={
          <button onClick={openAdd} className="btn-primary hidden sm:inline-flex">
            <Plus size={16} /> Add Product
          </button>
        }
      >
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input pl-10"
            />
          </div>
          <button onClick={openAdd} className="btn-primary sm:hidden">
            <Plus size={16} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Plus size={26} />}
            title="No products found"
            description="Add your first product to get started."
            action={<button onClick={openAdd} className="btn-primary">Add Product</button>}
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                          <span className="line-clamp-1 font-medium text-ink-800 max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge tone="neutral">{p.category}</Badge></td>
                      <td className="px-4 py-3 font-medium text-ink-800">{formatINR(p.price)}</td>
                      <td className="px-4 py-3 text-ink-700">{p.stock}</td>
                      <td className="px-4 py-3"><StockBadge status={getStockStatus(p)} /></td>
                      <td className="px-4 py-3 text-ink-700">{p.rating.toFixed(1)}★</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => remove(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminLayout>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setShowForm(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl animate-slide-up">
            <div className="sticky top-0 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="text-lg font-semibold text-ink-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-ink-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4 p-5">
              <div>
                <label className="label">Product Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Rating</label>
                  <input type="number" step="0.1" min="0" max="5" className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
                  {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                  {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
                </div>
                <div>
                  <label className="label">Reorder Lvl</label>
                  <input type="number" min="0" className="input" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
                  {errors.reorderLevel && <p className="mt-1 text-xs text-red-500">{errors.reorderLevel}</p>}
                </div>
              </div>
              <div>
                <label className="label">Image URL</label>
                <input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
                {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AdminAssistant />
    </>
  );
}
