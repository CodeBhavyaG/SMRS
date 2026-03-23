import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle,  Search, Plus } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";


type InventoryItem = {
  id: string;
  productId: number;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: "In Stock" | "Low Stock" | "Critical";
  demand: "High" | "Medium" | "Low";
};
type DemandForecastItem = { product: string; current: number; predicted: number };
type InventoryStats = { total_products?: number; low_stock?: number; critical_stock?: number };

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [demandForecast, setDemandForecast] = useState<DemandForecastItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data: inventoryRows, error: inventoryError } = await supabase
          .from("inventory")
          .select("id, product_id, stock, reorder_point, demand_level");

        if (inventoryError || !inventoryRows) {
          console.error("Failed to fetch inventory", inventoryError);
          return;
        }

        const productIds = Array.from(new Set(inventoryRows.map((item) => item.product_id).filter(Boolean)));
        let productsMap = new Map<number, {id: number; sku: string; name: string; category: string; base_price: number}>();

        if (productIds.length) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("id, sku, name, category, base_price")
            .in("id", productIds);

          if (productsError) {
            console.error("Failed to fetch products", productsError);
          } else if (productsData) {
            productsMap = new Map(productsData.map((p) => [p.id, p]));
          }
        }

        const transformedInventory: InventoryItem[] = inventoryRows.map((item) => {
          const product = productsMap.get(item.product_id);
          const stock = item.stock ?? 0;
          const reorder = item.reorder_point ?? 0;

          return {
            id: item.id.toString(),
            productId: item.product_id,
            sku: product?.sku || `INV-${item.id}`,
            name: product?.name || "Unknown product",
            category: product?.category || "Unspecified",
            stock,
            price: product?.base_price ?? 0,
            status:
              stock <= 10 ? "Critical" : stock < reorder ? "Low Stock" : "In Stock",
            demand: item.demand_level || "Medium",
          };
        });

        setInventory(transformedInventory);

        setStats({
          total_products: transformedInventory.length,
          low_stock: transformedInventory.filter((i) => i.status === "Low Stock").length,
          critical_stock: transformedInventory.filter((i) => i.status === "Critical").length,
        });

        const { data: forecastData, error: forecastError } = await supabase
          .from("demand_forecast")
          .select("product_id, current_qty, predicted_qty");

        if (forecastError) {
          console.error("Failed to fetch demand forecast", forecastError);
          setDemandForecast([]);
        } else {
          const forecastByProduct = new Map((forecastData ?? []).map((r) => [r.product_id, r]));
          const demandForecastRows = transformedInventory.map((item) => {
            const raw = forecastByProduct.get(item.productId);
            return {
              product: item.name,
              current: raw?.current_qty ?? 0,
              predicted: raw?.predicted_qty ?? 0,
            };
          });
          setDemandForecast(demandForecastRows);
        }
      } catch (err) {
        console.error("Inventory load failed", err);
      }
    };

    fetchInventory();
  }, []);

  const filtered = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "All" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Smart Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered demand prediction & stock management</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats?.total_products?.toString() ?? "—"} change="12 added this week" changeType="positive" icon={Package} index={0} />
        <StatCard label="Low Stock" value={stats?.low_stock?.toString() ?? "—"} change="Needs attention" changeType="negative" icon={AlertTriangle} index={1} />
        <StatCard label="Critical Stock" value={stats?.critical_stock?.toString() ?? "—"} change="Reorder immediately" changeType="negative" icon={AlertTriangle} index={2} />
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
            <Bar dataKey="current" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Current" />
            <Bar dataKey="predicted" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Predicted" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card overflow-hidden">
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h3 className="text-sm font-semibold text-foreground">Inventory Items</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-36 placeholder:text-muted-foreground" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-muted text-sm rounded-lg px-3 py-1.5 outline-none text-foreground">
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
              {filtered.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="table-cell font-mono text-xs">{item.sku}</td>
                  <td className="table-cell font-medium">{item.name}</td>
                  <td className="table-cell">{item.category}</td>
                  <td className="table-cell font-mono">{item.stock}</td>
                  <td className="table-cell font-mono">₹{Number(item.price).toLocaleString("en-IN")}</td>
                  <td className="table-cell">
                    <span className={
                      item.status === "In Stock" ? "badge-success" :
                      item.status === "Low Stock" ? "badge-warning" : "badge-destructive"
                    }>{item.status}</span>
                  </td>
                  <td className="table-cell">
                    <span className={
                      item.demand === "High" ? "badge-destructive" :
                      item.demand === "Medium" ? "badge-warning" : "badge-success"
                    }>{item.demand}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
