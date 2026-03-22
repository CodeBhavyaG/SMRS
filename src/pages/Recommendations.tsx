import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingUp, Users, ThumbsUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { getApiBaseUrl } from "@/lib/api";
 
type Recommendation = {
  customer: string;
  last_purchased?: string;
  recommended: { name: string; reason: string; confidence: number }[];
};
type PopularBundle = { name: string; items: string[] | string; sales: number; revenue: number };
type RecommendationStats = { active_profiles?: number };

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [popularBundles, setPopularBundles]   = useState<PopularBundle[]>([]);
  const [stats, setStats]                     = useState<RecommendationStats | null>(null);
 
  const API = getApiBaseUrl();
 
  useEffect(() => {
    fetch(`${API}/api/recommendations`)
      .then(r => r.json()).then(setRecommendations);
 
    fetch(`${API}/api/recommendations/bundles`)
      .then(r => r.json()).then(setPopularBundles);
 
    fetch(`${API}/api/recommendations/stats`)
      .then(r => r.json()).then(setStats);
  }, [API]);
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Personalized Recommendations</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered product suggestions using collaborative filtering</p>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recommendation CTR" value="34.8%" change="+6.2% this month" changeType="positive" icon={ThumbsUp} index={0} />
        <StatCard label="Conversion from Rec" value="12.4%" change="+3.1% improved" changeType="positive" icon={ShoppingBag} index={1} />
        <StatCard label="Revenue from Rec" value="₹4.2L" change="18% of total revenue" changeType="positive" icon={TrendingUp} index={2} />
        <StatCard label="Active Profiles" value={stats?.active_profiles?.toLocaleString() ?? "—"} change="Personalized feeds" changeType="positive" icon={Users} index={3} />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.customer}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {rec.customer.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{rec.customer}</h4>
                <p className="text-xs text-muted-foreground">Recently bought: {rec.last_purchased ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              {(rec.recommended ?? []).map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.confidence}%` }} />
                    </div>
                    <span className="text-xs font-mono font-medium text-foreground">{item.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
 
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card overflow-hidden"
        >
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Popular Bundles</h3>
            <p className="text-xs text-muted-foreground mt-0.5">AI-generated product bundles</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="table-header">Bundle</th>
                <th className="table-header">Items</th>
                <th className="table-header">Sales</th>
                <th className="table-header">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularBundles.map((b) => (
                <tr key={b.name} className="table-row">
                  <td className="table-cell font-medium">{b.name}</td>
                  <td className="table-cell text-xs text-muted-foreground">
                    {Array.isArray(b.items) ? b.items.join(", ") : b.items}
                  </td>
                  <td className="table-cell font-mono">{b.sales}</td>
                  <td className="table-cell font-mono font-medium">
                    ₹{Number(b.revenue).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}