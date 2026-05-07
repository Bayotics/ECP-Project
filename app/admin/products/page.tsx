"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/context/ProductsContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider, EmptyState,
} from "@/components/admin/AdminUI";
import type { Product } from "@/lib/models/product";

const CATEGORIES = ["all", "apparel", "accessories", "stationery", "publications", "digital", "other"];
const STATUSES = ["all", "active", "out-of-stock", "discontinued", "draft"];

export default function AdminProductsPage() {
  const { products, update, adjustStock, remove } = useProducts();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", category: "", status: "",
    price: "", compareAtPrice: "", stock: "",
    description: "", shortDescription: "",
    isFeatured: false, isMemberOnly: false,
  });
  const [stockDelta, setStockDelta] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (catFilter !== "all") list = list.filter(p => p.category === catFilter);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, catFilter, statusFilter]);

  function openModal(product: Product) {
    setSelected(product);
    setStockDelta("");
    setForm({
      name: product.name,
      category: product.category,
      status: product.status,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : "",
      stock: String(product.stock ?? 0),
      description: product.description ?? "",
      shortDescription: product.shortDescription ?? "",
      isFeatured: product.isFeatured ?? false,
      isMemberOnly: product.isMemberOnly ?? false,
    });
  }

  function closeModal() { setSelected(null); }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    update(selected.id, {
      name: form.name,
      category: form.category as Product["category"],
      status: form.status as Product["status"],
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      description: form.description || undefined,
      shortDescription: form.shortDescription || undefined,
      isFeatured: form.isFeatured,
      isMemberOnly: form.isMemberOnly,
    });
    setSaving(false);
    closeModal();
  }

  function applyStockAdjust() {
    if (!selected || !stockDelta.trim()) return;
    const delta = parseInt(stockDelta, 10);
    if (isNaN(delta)) return;
    adjustStock(selected.id, delta);
    setSelected(prev => prev ? { ...prev, stock: (prev.stock ?? 0) + delta } : prev);
    setForm(p => ({ ...p, stock: String(Number(p.stock) + delta) }));
    setStockDelta("");
  }

  function handleRemove() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.name}"? This cannot be undone.`)) return;
    remove(selected.id);
    closeModal();
  }

  const headers = ["Name", "Category", "Price", "Stock", "Status", "Featured", "Member Only"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Products" count={filtered.length} subtitle="Manage all products in the store." />

      <AdminFilters search={search} onSearchChange={setSearch} filters={
        <>
          <FilterSelect value={catFilter} onChange={setCatFilter} options={CATEGORIES.map(c => ({ value: c, label: c === "all" ? "All categories" : c.replace(/\b\w/g, x => x.toUpperCase()) }))} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase()) }))} />
        </>
      } />

      <AdminTable headers={headers} empty="No products match your search.">
        {filtered.map(product => (
          <TR key={product.id} onClick={() => openModal(product)}>
            <TD className="font-medium text-(--color-neutral-900)">{product.name}</TD>
            <TD><Badge value={product.category} /></TD>
            <TD className="font-bold text-(--color-green-700)">₦{product.price.toLocaleString("en-NG")}</TD>
            <TD className={product.stock === 0 ? "text-red-600 font-bold" : ""}>{product.stock ?? 0}</TD>
            <TD><Badge value={product.status} /></TD>
            <TD>{product.isFeatured ? <span className="text-(--color-green-600) text-xs font-bold">Yes</span> : <span className="text-(--color-neutral-400) text-xs">No</span>}</TD>
            <TD>{product.isMemberOnly ? <span className="text-purple-600 text-xs font-bold">Yes</span> : <span className="text-(--color-neutral-400) text-xs">No</span>}</TD>
          </TR>
        ))}
      </AdminTable>

      {selected && (
        <AdminModal title={selected.name} open={!!selected} onClose={closeModal}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><FormField label="Name">
                <FormInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </FormField></div>
              <FormField label="Category">
                <FormSelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "all").map(c => (
                    <option key={c} value={c}>{c.replace(/\b\w/g, x => x.toUpperCase())}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Status">
                <FormSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {["active", "out-of-stock", "discontinued", "draft"].map(s => (
                    <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase())}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Price (₦)">
                <FormInput type="number" min="0" step="1" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </FormField>
              <FormField label="Compare Price (₦)">
                <FormInput type="number" min="0" step="1" value={form.compareAtPrice} onChange={e => setForm(p => ({ ...p, compareAtPrice: e.target.value }))} />
              </FormField>
            </div>

            {/* Stock adjustment */}
            <div>
              <SectionDivider label="Stock Adjustment" />
              <p className="text-sm text-(--color-neutral-600) mt-1">Current stock: <strong className="text-(--color-neutral-900)">{form.stock}</strong></p>
              <div className="flex items-center gap-2 mt-2">
                <FormInput
                  className="w-28"
                  type="number"
                  placeholder="e.g. +10 or -5"
                  value={stockDelta}
                  onChange={e => setStockDelta(e.target.value)}
                />
                <Btn size="sm" variant="secondary" onClick={applyStockAdjust} disabled={!stockDelta.trim()}>Apply</Btn>
              </div>
            </div>

            <FormField label="Short Description">
              <FormTextarea rows={2} value={form.shortDescription} onChange={e => setForm(p => ({ ...p, shortDescription: e.target.value }))} />
            </FormField>

            <FormField label="Full Description">
              <FormTextarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </FormField>

            <div className="flex gap-5 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="accent-(--color-green-600)" />
                <span className="font-medium text-(--color-neutral-700)">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isMemberOnly} onChange={e => setForm(p => ({ ...p, isMemberOnly: e.target.checked }))} className="accent-purple-600" />
                <span className="font-medium text-(--color-neutral-700)">Member Only</span>
              </label>
            </div>

            <div>
              <SectionDivider label="Danger Zone" />
              <div className="mt-2">
                <Btn size="sm" variant="danger" onClick={handleRemove}>Delete Product</Btn>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
              <Btn variant="primary" onClick={saveChanges} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
