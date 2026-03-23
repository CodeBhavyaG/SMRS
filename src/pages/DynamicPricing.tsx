import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { getApiBaseUrl } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend,
} from "recharts";
 
const revenueImpact = [
  { week: "W1", without: 82000, with: 82000 },
  { week: "W2", without: 85000, with: 89000 },
  { week: "W3", without: 81000, with: 92000 },
  { week: "W4", without: 87000, with: 98000 },
  { week: "W5", without: 84000, with: 101000 },
  { week: "W6", without: 86000, with: 108000 },
];
 
type PricingRule = {
  product: string;
  base_price: number;
  current_price: number;
  change_pct: number;
  reason: string;
  status: string;
};
type DynamicPricingStats = { active_rules?: number; pending_rules?: number; avg_change_pct?: number };
 
export default function DynamicPricing() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [stats, setStats] = useState<DynamicPricingStats | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
 
  const API = getApiBaseUrl();
 
  useEffect(() => {
    fetch(`${API}/api/pricing/rules`)
      .then(r => r.json())
      .then(data => {
        setPricingRules(data);
        // Default select first product
        if (data.length > 0) setSelectedProduct(data[0].product);
      });
 
    fetch(`${API}/api/pricing/stats`)
      .then(r => r.json()).then(setStats);
  }, [API]);
 
  // FIX: Build price comparison chart data from ALL pricing rules (DB-driven),
  // not a hardcoded static array for just "Earbuds Pro".
  // Shows base price vs current price for every product with an active rule.
  const priceComparisonData = pricingRules.map(rule => ({
    product: rule.product.length > 15 ? rule.product.slice(0, 14) + "…" : rule.product,
    "Base Price":    Number(rule.base_price),
    "Current Price": Number(rule.current_price),
    change_pct:      Number(rule.change_pct),
  }));
 
  // Single-product line chart data for selected product (shows base vs current vs % change context)
  const selectedRule = pricingRules.find(r => r.product === selectedProduct);
  const singleProductData = selectedRule
    ? [
        { label: "Base",    price: Number(selectedRule.base_price) },
        { label: "Current", price: Number(selectedRule.current_price) },
        { label: "Target",  price: Number(selectedRule.current_price) * (1 + selectedRule.change_pct / 200) },
      ]
    : [];
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Dynamic Pricing Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-based automatic price optimization</p>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue Lift"        value="+18.2%"                                             change="vs. static pricing"   changeType="positive" icon={TrendingUp} index={0} />
        <StatCard label="Active Rules"        value={stats?.active_rules?.toString() ?? "—"}             change={`${stats?.pending_rules ?? 0} pending approval`} changeType="neutral" icon={Zap} index={1} />
        <StatCard label="Avg. Price Change"   value={stats?.avg_change_pct ? `±${stats.avg_change_pct}%` : "—"} change="Within optimal range" changeType="positive" icon={DollarSign} index={2} />
        <StatCard label="Competitor Tracking" value="12"                                                 change="Competitors monitored" changeType="positive" icon={BarChart3} index={3} />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* FIX: Now shows ALL products from DB side-by-side as a bar chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Price Optimization — All Products</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Base price vs current price across catalog</p>
          {pricingRules.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading pricing data...</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priceComparisonData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis
                  dataKey="product"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(215, 16%, 47%)"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                <Tooltip
                  contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(v: number) => `₹${Number(v).toLocaleString("en-IN")}`}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="Base Price"    fill="hsl(215, 16%, 67%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current Price" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
 
        {/* Per-product detail with dropdown selector */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product Price Detail</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Base → Current → Projected</p>
            </div>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="bg-muted text-xs rounded-lg px-2 py-1.5 outline-none text-foreground max-w-[160px]"
            >
              {pricingRules.map(r => (
                <option key={r.product} value={r.product}>{r.product}</option>
              ))}
            </select>
          </div>
          {selectedRule ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={singleProductData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(v: number) => `₹${Number(v).toLocaleString("en-IN")}`}
                  />
                  <Line type="monotone" dataKey="price" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 5 }} name="Price" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                <p className="text-muted-foreground">Reason: <span className="text-foreground font-medium">{selectedRule.reason}</span></p>
                <p className="text-muted-foreground">Change:
                  <span className={`font-mono font-medium ml-1 ${selectedRule.change_pct > 0 ? "text-success" : "text-destructive"}`}>
                    {selectedRule.change_pct > 0 ? `+${selectedRule.change_pct}%` : `${selectedRule.change_pct}%`}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No product selected</p>
          )}
        </motion.div>
      </div>
 
      {/* Revenue Impact */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Revenue Impact</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-4">With vs without dynamic pricing</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueImpact}>
            <defs>
              <linearGradient id="withGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
            <Tooltip
              contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              formatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Area type="monotone" dataKey="with"    stroke="hsl(142, 71%, 45%)" fill="url(#withGrad)" strokeWidth={2} name="With AI Pricing" />
            <Line type="monotone" dataKey="without" stroke="hsl(215, 16%, 47%)" strokeWidth={1.5} strokeDasharray="5 5" name="Static Pricing" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
 
      {/* Active Pricing Rules table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Active Pricing Rules</h3>
          <p className="text-xs text-muted-foreground mt-0.5">AI-generated price adjustments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="table-header">Product</th>
                <th className="table-header">Base Price</th>
                <th className="table-header">Current</th>
                <th className="table-header">Change</th>
                <th className="table-header">Reason</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {pricingRules.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center text-muted-foreground">No pricing rules found</td></tr>
              ) : (
                pricingRules.map((rule) => (
                  <tr key={rule.product} className="table-row">
                    <td className="table-cell font-medium">{rule.product}</td>
                    <td className="table-cell font-mono">₹{Number(rule.base_price).toLocaleString("en-IN")}</td>
                    <td className="table-cell font-mono font-medium">₹{Number(rule.current_price).toLocaleString("en-IN")}</td>
                    <td className="table-cell">
                      <span className={`flex items-center gap-1 text-sm font-mono ${rule.change_pct > 0 ? "text-success" : "text-destructive"}`}>
                        {rule.change_pct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {rule.change_pct > 0 ? `+${rule.change_pct}%` : `${rule.change_pct}%`}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-muted-foreground">{rule.reason}</td>
                    <td className="table-cell">
                      <span className={rule.status === "Active" ? "badge-success" : "badge-warning"}>{rule.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
 