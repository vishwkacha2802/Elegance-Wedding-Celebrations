import { NavLink } from "react-router";
import {
  LayoutDashboard,
  User,
  Package,
  ClipboardList,
  IndianRupee,
  Heart,
  X
} from "lucide-react";

import { cn } from "@vendor/react-app/lib/utils";
import { Button } from "@vendor/react-app/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/profile", label: "My Profile", icon: User },
  { path: "/dashboard/services", label: "Services", icon: Package },
  { path: "/dashboard/bookings", label: "Bookings", icon: ClipboardList },
  { path: "/dashboard/earnings", label: "Earnings", icon: IndianRupee },
  // { path: "/dashboard/availability", label: "Availability", icon: Calendar },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-[min(18rem,85vw)] glass-card shadow-2xl transform transition-transform duration-300 ease-in-out lg:w-64 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">

          {/* HEADER */}
          <div className="p-6 border-b border-white/40">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold shadow-lg shadow-rose/20">
                  <Heart className="w-5 h-5 text-white" />
                </div>

                <div>
                  <h1 className="font-display font-semibold text-foreground">
                    Elegance
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Vendor Portal
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden hover:bg-white/60"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>

            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">

              {navItems.map((item) => (
                <li key={item.path}>

                  <NavLink
                    to={item.path}
                    end={item.path === "/dashboard"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-rose/15 to-gold/10 text-mauve-dark border-l-4 border-mauve -ml-1 pl-5 shadow-sm"
                          : "text-muted-foreground hover:bg-white/70 hover:text-mauve-dark"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>

                </li>
              ))}

            </ul>
          </nav>

          {/* FOOTER */}
          {/* <div className="p-4 border-t border-white/40">

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>

          </div> */}
        </div>

        {/* WATER + BALLOON ACCENT LINE */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-mauve/35 via-transparent to-magenta/35" />

      </aside>
    </>
  );
}


// import { NavLink } from "react-router";
// import { 
//   LayoutDashboard, 
//   User, 
//   Package, 
//   Calendar, 
//   ClipboardList, 
//   DollarSign, 
//   LogOut,
//   Heart,
//   X
// } from "lucide-react";
// import { cn } from "@vendor/react-app/lib/utils";
// import { Button } from "@vendor/react-app/components/ui/button";

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const navItems = [
//   { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//   { path: "/dashboard/profile", label: "My Profile", icon: User },
//   { path: "/dashboard/services", label: "Services", icon: Package },
//   { path: "/dashboard/bookings", label: "Bookings", icon: ClipboardList },
//   { path: "/dashboard/earnings", label: "Earnings", icon: DollarSign },
//   { path: "/dashboard/availability", label: "Availability", icon: Calendar },
// ];

// export default function Sidebar({ isOpen, onClose }: SidebarProps) {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("authToken");
//     localStorage.removeItem("vendor");
//     navigate("/login");
//   };

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div 
//           className="fixed inset-0 bg-black/50 z-40 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={cn(
//           "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-[hsl(var(--gold))]/10 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
//           isOpen ? "translate-x-0" : "-translate-x-full"
//         )}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="p-6 border-b border-[hsl(var(--gold))]/10">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold))]/80 flex items-center justify-center shadow-md">
//                   <Heart className="w-5 h-5 text-white fill-white" />
//                 </div>
//                 <div>
//                   <h1 className="font-serif font-semibold text-foreground">Elegance</h1>
//                   <p className="text-xs text-muted-foreground">Vendor Portal</p>
//                 </div>
//               </div>
//               <Button
//                 variant="ghost"
//                 size="icon-sm"
//                 className="lg:hidden"
//                 onClick={onClose}
//               >
//                 <X className="w-5 h-5" />
//               </Button>
//             </div>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 p-4 overflow-y-auto">
//             <ul className="space-y-1">
//               {navItems.map((item) => (
//                 <li key={item.path}>
//                   <NavLink
//                     to={item.path}
//                     end={item.path === "/dashboard"}
//                     onClick={onClose}
//                     className={({ isActive }) =>
//                       cn(
//                         "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
//                         isActive
//                           ? "bg-gradient-to-r from-[hsl(var(--gold))]/15 to-[hsl(var(--gold))]/5 text-[hsl(var(--gold))] border-l-4 border-[hsl(var(--gold))] -ml-1 pl-5"
//                           : "text-muted-foreground hover:bg-[hsl(var(--cream-dark))] hover:text-foreground"
//                       )
//                     }
//                   >
//                     <item.icon className="w-5 h-5" />
//                     {item.label}
//                   </NavLink>
//                 </li>
//               ))}
//             </ul>
//           </nav>

//           {/* Footer */}
//           <div className="p-4 border-t border-[hsl(var(--gold))]/10">
//             <Button
//               variant="ghost"
//               className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
//               onClick={handleLogout}
//             >
//               <LogOut className="w-5 h-5" />
//               Sign Out
//             </Button>
//           </div>
//         </div>

//         {/* Gold accent */}
//         <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[hsl(var(--gold))]/30 via-transparent to-[hsl(var(--gold))]/30" />
//       </aside>
//     </>
//   );
// }

