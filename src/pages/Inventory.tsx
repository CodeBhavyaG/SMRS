
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, Search, Plus, X } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getApiBaseUrl } from "@/lib/api";
 
type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: "In Stock" | "Low Stock" | "Critical";
  demand: "High" | "Medium" | "Low";
};
type DemandForecastItem = { product: string; current: number; predicted: number };
type InventoryStats = { total_products?: number; low_stock?: number; critical_stock?: number };
 
const CATEGORIES = ["Electronics", "Clothing", "Groceries", "Home"];
const DEMAND_LEVELS = ["High", "Medium", "Low"];
 
export default function Inventory() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
 
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [demandForecast, setDemandForecast] = useState<DemandForecastItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
 
  // Add Product modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "Electronics",
    base_price: "",
    stock: "",
    reorder_point: "50",
    demand_level: "Medium",
  });
 
  const API = getApiBaseUrl();
 
  const loadData = () => {
    fetch(`${API}/api/inventory`)
      .then(r => r.json()).then(setInventory);
    fetch(`${API}/api/inventory/demand-forecast`)
      .then(r => r.json()).then(setDemandForecast);
    fetch(`${API}/api/inventory/stats`)
      .then(r => r.json()).then(setStats);
  };
 
  useEffect(() => { loadData(); }, [API]);
 
  const filtered = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "All" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
 
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
 
  const handleAddProduct = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API}/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          category: form.category,
          base_price: parseFloat(form.base_price),
          stock: parseInt(form.stock),
          reorder_point: parseInt(form.reorder_point),
          demand_level: form.demand_level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      setSubmitSuccess(true);
      // Reset form and reload data
      setForm({ sku: "", name: "", category: "Electronics", base_price: "", stock: "", reorder_point: "50", demand_level: "Medium" });
      loadData();
      setTimeout(() => { setSubmitSuccess(false); setShowModal(false); }, 1500);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Smart Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered demand prediction & stock management</p>
        </div>
        {/* FIX: Button now opens the Add Product modal */}
        <button
          onClick={() => { setShowModal(true); setSubmitError(null); setSubmitSuccess(false); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>
 
      {/* Stat cards — values fetched from DB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products"  value={stats?.total_products?.toString() ?? "—"}  change="Items in catalog"      changeType="positive" icon={Package}       index={0} />
        <StatCard label="Low Stock"       value={stats?.low_stock?.toString() ?? "—"}        change="Needs attention"       changeType="negative" icon={AlertTriangle} index={1} />
        <StatCard label="Critical Stock"  value={stats?.critical_stock?.toString() ?? "—"}   change="Reorder immediately"   changeType="negative" icon={AlertTriangle} index={2} />
      </div>
 
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Demand Forecast</h3>
        <p className="text-xs text-muted-foreground mb-4">Current stock vs predicted demand</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={demandForecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="product" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <Bar dataKey="current"   fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Current" />
            <Bar dataKey="predicted" fill="hsl(38, 92%, 50%)"  radius={[4, 4, 0, 0]} name="Predicted" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
 
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card overflow-hidden">
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h3 className="text-sm font-semibold text-foreground">Inventory Items</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-36 placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-muted text-sm rounded-lg px-3 py-1.5 outline-none text-foreground"
            >
              <option>All</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Critical</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="table-header">SKU</th>
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Price</th>
                <th className="table-header">Status</th>
                <th className="table-header">Demand</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-muted-foreground py-6">No items found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell font-mono text-xs">{item.id}</td>
                    <td className="table-cell font-medium">{item.name}</td>
                    <td className="table-cell">{item.category}</td>
                    <td className="table-cell font-mono">{item.stock}</td>
                    <td className="table-cell font-mono">₹{Number(item.price).toLocaleString("en-IN")}</td>
                    <td className="table-cell">
                      <span className={
                        item.status === "In Stock"  ? "badge-success" :
                        item.status === "Low Stock" ? "badge-warning"  : "badge-destructive"
                      }>{item.status}</span>
                    </td>
                    <td className="table-cell">
                      <span className={
                        item.demand === "High"   ? "badge-destructive" :
                        item.demand === "Medium" ? "badge-warning"     : "badge-success"
                      }>{item.demand}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
 
      {/* ── Add Product Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Add New Product</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Fill in product details to add to inventory</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
 
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">SKU *</label>
                    <input name="sku" value={form.sku} onChange={handleFormChange} placeholder="SKU-009"
                      className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Category *</label>
                    <select name="category" value={form.category} onChange={handleFormChange}
                      className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
 
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Product Name *</label>
                  <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Smart Watch Series 5"
                    className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Base Price (₹) *</label>
                    <input name="base_price" value={form.base_price} onChange={handleFormChange} placeholder="1999" type="number" min="0"
                      className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Stock Quantity *</label>
                    <input name="stock" value={form.stock} onChange={handleFormChange} placeholder="100" type="number" min="0"
                      className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Reorder Point</label>
                    <input name="reorder_point" value={form.reorder_point} onChange={handleFormChange} placeholder="50" type="number" min="0"
                      className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Demand Level</label>
                    <select name="demand_level" value={form.demand_level} onChange={handleFormChange}
                      className="mt-1 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      {DEMAND_LEVELS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
 
              {submitError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="text-xs text-success bg-success/10 px-3 py-2 rounded-lg">✅ Product added successfully!</p>
              )}
 
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={submitting || !form.sku || !form.name || !form.base_price || !form.stock}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
