import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  index?: number;
}

export default function StatCard({ label, value, change, changeType, icon: Icon, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className="stat-card"
    >
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="metric-value">{value}</div>
      <span
        className={
          changeType === "positive"
            ? "badge-success"
            : changeType === "negative"
            ? "badge-destructive"
            : "badge-warning"
        }
      >
        {change}
      </span>
    </motion.div>
  );
}
