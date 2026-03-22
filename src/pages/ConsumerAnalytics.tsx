import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Clock, ShoppingBag, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { getApiBaseUrl } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
 
type PurchasePattern = { day: string; visits: number; purchases: number };
type CustomerSegment = { segment: string; count: number; avg_spend: number; retention: number };
type ConsumerStats = { repeat_customer_pct?: number; avg_basket_size?: number; conversion_rate?: number };

const behaviorMetrics = [
  { subject: "Frequency", A: 85 },
  { subject: "Basket Size", A: 72 },
  { subject: "Loyalty", A: 68 },
  { subject: "Online", A: 55 },
  { subject: "In-Store", A: 90 },
  { subject: "Referrals", A: 42 },
];
 
const segmentColorMap: Record<string, string> = {
  "High Value": "badge-success",
  "Regular":    "badge-primary",
  "Occasional": "badge-warning",
  "At Risk":    "badge-destructive",
};
 
export default function ConsumerAnalytics() {
  const [purchasePatterns, setPurchasePatterns] = useState<PurchasePattern[]>([]);
  const [seasonalTrends, setSeasonalTrends]     = useState<SeasonalTrend[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [stats, setStats]                       = useState<ConsumerStats | null>(null);
 
  const API = getApiBaseUrl();
 
  useEffect(() => {
    fetch(`${API}/api/analytics/weekly-patterns`)
      .then(r => r.json()).then(setPurchasePatterns);
 
    fetch(`${API}/api/analytics/seasonal-trends`)
      .then(r => r.json()).then(setSeasonalTrends);
 
    fetch(`${API}/api/analytics/segments`)
      .then(r => r.json()).then(setCustomerSegments);
 
    fetch(`${API}/api/analytics/stats`)
      .then(r => r.json()).then(setStats);
  }, [API]);
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Consumer Behavior Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-driven insights into customer purchase patterns</p>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg. Visit Duration" value="12.4 min" change="+3.2% from last week" changeType="positive" icon={Clock} index={0} />
        <StatCard label="Repeat Customers" value={stats?.repeat_customer_pct ? `${stats.repeat_customer_pct}%` : "—"} change="+5.1% this quarter" changeType="positive" icon={Users} index={1} />
        <StatCard label="Avg. Basket Size" value={stats?.avg_basket_size ? `₹${Number(stats.avg_basket_size).toLocaleString("en-IN")}` : "—"} change="+8.7% this month" changeType="positive" icon={ShoppingBag} index={2} />
        <StatCard label="Conversion Rate" value={stats?.conversion_rate ? `${stats.conversion_rate}%` : "—"} change="-1.3% from last week" changeType="negative" icon={TrendingUp} index={3} />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Weekly Purchase Patterns</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Visits vs Purchases by day</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={purchasePatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="visits" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} opacity={0.3} />
              <Bar dataKey="purchases" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
 
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Customer Behavior Profile</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Multi-dimensional analysis</p>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={behaviorMetrics}>
              <PolarGrid stroke="hsl(214, 32%, 91%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
              <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="hsl(215, 16%, 47%)" />
              <Radar name="Score" dataKey="A" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
 
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Seasonal Category Trends</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-4">Category demand over time</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={seasonalTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <Line type="monotone" dataKey="electronics" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="clothing" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="groceries" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
 
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card overflow-hidden">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Customer Segments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">AI-powered customer segmentation</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="table-header">Segment</th>
              <th className="table-header">Customers</th>
              <th className="table-header">Avg. Spend</th>
              <th className="table-header">Retention</th>
            </tr>
          </thead>
          <tbody>
            {customerSegments.map((seg) => (
              <tr key={seg.segment} className="table-row">
                <td className="table-cell">
                  <span className={segmentColorMap[seg.segment] ?? "badge-primary"}>{seg.segment}</span>
                </td>
                <td className="table-cell font-mono">{Number(seg.count).toLocaleString()}</td>
                <td className="table-cell font-mono font-medium">
                  ₹{Number(seg.avg_spend).toLocaleString("en-IN")}
                </td>
                <td className="table-cell font-mono">{seg.retention}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}