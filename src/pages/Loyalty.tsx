import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Gift, Users, TrendingUp, Award } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { getApiBaseUrl } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
 
type RetentionDataPoint = { month: string; returning: number; new: number };
type LoyalCustomer = { name: string; visits: number; total_spend: number; loyalty_tier: string; points: number; last_visit?: string };
type ActiveOffer = { title: string; target_tier: string; expiry: string; redemptions: number };
type LoyaltyStats = { total_members?: number; new_this_month?: number };

export default function Loyalty() {
  const [retentionData, setRetentionData] = useState<RetentionDataPoint[]>([]);
  const [loyalCustomers, setLoyalCustomers] = useState<LoyalCustomer[]>([]);
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
 
  const API = getApiBaseUrl();
 
  useEffect(() => {
    fetch(`${API}/api/customers/retention`)
      .then(r => r.json()).then(setRetentionData);
 
    fetch(`${API}/api/customers?tier=Platinum&tier=Gold&tier=Silver`)
      .then(r => r.json()).then(setLoyalCustomers);
 
    fetch(`${API}/api/customers/loyalty/offers`)
      .then(r => r.json()).then(setActiveOffers);
 
    fetch(`${API}/api/customers/stats`)
      .then(r => r.json()).then(setStats);
  }, [API]);
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Customer Loyalty Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Retention analytics & personalized offer management</p>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Loyalty Members" value={stats?.total_members?.toLocaleString() ?? "—"} change={`+${stats?.new_this_month ?? 0} this month`} changeType="positive" icon={Heart} index={0} />
        <StatCard label="Retention Rate" value="78%" change="+4.2% improved" changeType="positive" icon={Users} index={1} />
        <StatCard label="Points Redeemed" value="48.2K" change="₹4.8L value" changeType="positive" icon={Gift} index={2} />
        <StatCard label="Offer Redemption" value="34%" change="+8% this month" changeType="positive" icon={TrendingUp} index={3} />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Customer Retention</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">New vs returning customers</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="returning" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Returning" />
              <Bar dataKey="new" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="New" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
 
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Active Offers & Discounts</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Personalized promotions</p>
          <div className="space-y-3">
            {activeOffers.map((offer) => (
              <div key={offer.title} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{offer.title}</p>
                  <p className="text-xs text-muted-foreground">{offer.target_tier} · Expires {offer.expiry}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium text-foreground">{offer.redemptions}</p>
                  <p className="text-xs text-muted-foreground">redeemed</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
 
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Top Loyal Customers</h3>
          <p className="text-xs text-muted-foreground mt-0.5">High-value repeat customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="table-header">Customer</th>
                <th className="table-header">Visits</th>
                <th className="table-header">Total Spend</th>
                <th className="table-header">Tier</th>
                <th className="table-header">Points</th>
                <th className="table-header">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {loyalCustomers.map((c) => (
                <tr key={c.name} className="table-row">
                  <td className="table-cell font-medium flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {c.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    {c.name}
                  </td>
                  <td className="table-cell font-mono">{c.visits}</td>
                  <td className="table-cell font-mono font-medium">
                    ₹{Number(c.total_spend).toLocaleString("en-IN")}
                  </td>
                  <td className="table-cell">
                    <span className={
                      c.loyalty_tier === "Platinum" ? "badge-primary" :
                      c.loyalty_tier === "Gold" ? "badge-warning" : "badge-success"
                    }>
                      <Award className="w-3 h-3 mr-1" />{c.loyalty_tier}
                    </span>
                  </td>
                  <td className="table-cell font-mono">{Number(c.points).toLocaleString()}</td>
                  <td className="table-cell text-muted-foreground">
                    {c.last_visit ? new Date(c.last_visit).toLocaleDateString("en-IN") : "—"}
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