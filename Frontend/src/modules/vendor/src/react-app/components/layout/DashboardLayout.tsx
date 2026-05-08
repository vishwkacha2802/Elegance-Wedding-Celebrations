import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Menu, Search, ChevronDown, LogOut, MessageSquareQuote } from "lucide-react";
import { Button } from "@vendor/react-app/components/ui/button";
import { Input } from "@vendor/react-app/components/ui/input";
import { Avatar, AvatarFallback } from "@vendor/react-app/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vendor/react-app/components/ui/dropdown-menu";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const vendorData = sessionStorage.getItem("vendor");
    
    if (!token) {
      window.location.assign("/auth");
      return;
    }

    if (vendorData) {
      const data = JSON.parse(vendorData);
      setVendor({ name: data.businessName || data.name, email: data.email });
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("vendor");
    sessionStorage.removeItem("elegance_user_session");
    sessionStorage.removeItem("elegance_admin_user");
    sessionStorage.removeItem("elegance_admin_token");
    window.location.assign("/auth");
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--cream))]">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 min-h-screen lg:ml-64">
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[hsl(var(--gold))]/10">
            <div className="flex items-center justify-between px-4 lg:px-6 h-16">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="h-9 w-full bg-[hsl(var(--cream))] pl-9 sm:w-64 lg:w-72 border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                  />
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  className={`gap-2 rounded-full border px-3 text-sm ${
                    location.pathname === "/dashboard/reviews"
                      ? "border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/10 text-mauve-dark"
                      : "border-[hsl(var(--gold))]/15 text-muted-foreground hover:bg-white"
                  }`}
                  onClick={() => navigate("/dashboard/reviews")}
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  <span className="hidden sm:inline">Reviews</span>
                </Button>

                <div className="flex min-w-0 items-center gap-2 border-l border-[hsl(var(--gold))]/10 pl-2 sm:gap-3 sm:pl-3">
                  <div className="hidden min-w-0 sm:block text-right">
                    <p className="text-sm font-medium text-foreground">
                      {vendor?.name || "Vendor"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {vendor?.email || ""}
                    </p>
                  </div>
                  <Avatar className="w-9 h-9 border-2 border-[hsl(var(--gold))]/30">
                    <AvatarFallback className="bg-gradient-to-br from-mauve to-magenta text-white text-sm font-medium">
                      {vendor?.name ? getInitials(vendor.name) : "V"}
                    </AvatarFallback>
                  </Avatar>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-500 focus:text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          <main className="water-gradient p-4 sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
