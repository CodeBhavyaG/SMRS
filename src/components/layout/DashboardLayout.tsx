import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Package,
  Users,
  DollarSign,
  ShoppingBag,
  MessageCircle,
  Heart,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Users, label: "Consumer Analytics", path: "/analytics" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: DollarSign, label: "Dynamic Pricing", path: "/pricing" },
  { icon: ShoppingBag, label: "Recommendations", path: "/recommendations" },
  { icon: Heart, label: "Loyalty", path: "/loyalty" },
  { icon: MessageCircle, label: "AI Chatbot", path: "/chatbot" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">
              RetailIQ
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="sidebar-item cursor-pointer">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-card flex items-center justify-between px-4 lg:px-8 glass-card rounded-none border-b border-border/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search products, analytics..."
                className="bg-transparent text-sm outline-none w-48 lg:w-64 placeholder:text-muted-foreground"
              />
              <kbd className="hidden lg:inline text-[10px] font-mono bg-background px-1.5 py-0.5 rounded text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              BG
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
