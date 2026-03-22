import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import ConsumerAnalytics from "@/pages/ConsumerAnalytics";
import Inventory from "@/pages/Inventory";
import DynamicPricing from "@/pages/DynamicPricing";
import Recommendations from "@/pages/Recommendations";
import Loyalty from "@/pages/Loyalty";
import Chatbot from "@/pages/Chatbot";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<ConsumerAnalytics />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pricing" element={<DynamicPricing />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/loyalty" element={<Loyalty />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
