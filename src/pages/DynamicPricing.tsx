import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { getApiBaseUrl } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
 
const priceHistory = [
  { time: "9AM",  optimal: 1500, current: 1500, competitor: 1600 },
  { time: "10AM", optimal: 1480, current: 1500, competitor: 1580 },
  { time: "11AM", optimal: 1520, current: 1500, competitor: 1550 },
  { time: "12PM", optimal: 1550, current: 1520, competitor: 1540 },
  { time: "1PM",  optimal: 1580, current: 1550, competitor: 1560 },
  { time: "2PM",  optimal: 1540, current: 1540, competitor: 1570 },
  { time: "3PM",  optimal: 1600, current: 1560, competitor: 1590 },
  { time: "4PM",  optimal: 1620, current: 1580, competitor: 1610 },
];
 
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
 
  const API = getApiBaseUrl();
 
  useEffect(() => {
    fetch(`${API}/api/pricing/rules`)
      .then(r => r.json()).then(setPricingRules);
 
    fetch(`${API}/api/pricing/stats`)
      .then(r => r.json()).then(setStats);
  }, [API]);
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Dynamic Pricing Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-based automatic price optimization</p>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue Lift" value="+18.2%" change="vs. static pricing" changeType="positive" icon={TrendingUp} index={0} />
        <StatCard label="Active Rules" value={stats?.active_rules?.toString() ?? "—"} change={`${stats?.pending_rules ?? 0} pending approval`} changeType="neutral" icon={Zap} index={1} />
        <StatCard label="Avg. Price Change" value={stats?.avg_change_pct ? `±${stats.avg_change_pct}%` : "—"} change="Within optimal range" changeType="positive" icon={DollarSign} index={2} />
        <StatCard label="Competitor Tracking" value="12" change="Competitors monitored" changeType="positive" icon={BarChart3} index={3} />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Price Optimization - Earbuds Pro</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Optimal vs current vs competitor</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" domain={[1400, 1700]} />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Line type="monotone" dataKey="optimal" stroke="hsl(142, 71%, 45%)" strokeWidth={2} strokeDasharray="5 5" name="AI Optimal" />
              <Line type="monotone" dataKey="current" stroke="hsl(221, 83%, 53%)" strokeWidth={2} name="Current" />
              <Line type="monotone" dataKey="competitor" stroke="hsl(0, 84%, 60%)" strokeWidth={1.5} opacity={0.5} name="Competitor" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
 
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Revenue Impact</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">With vs without dynamic pricing</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueImpact}>
              <defs>
                <linearGradient id="withGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
              <Area type="monotone" dataKey="with" stroke="hsl(142, 71%, 45%)" fill="url(#withGrad)" strokeWidth={2} name="With AI Pricing" />
              <Line type="monotone" dataKey="without" stroke="hsl(215, 16%, 47%)" strokeWidth={1.5} strokeDasharray="5 5" name="Static Pricing" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
 
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
              {pricingRules.map((rule) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}