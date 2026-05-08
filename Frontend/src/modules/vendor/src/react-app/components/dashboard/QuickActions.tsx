// import { Plus, Calendar, MessageSquare, Settings } from "lucide-react";
// import { Button } from "@vendor/react-app/components/ui/button";

// const actions = [
//   {
//     label: "Add Service",
//     icon: Plus,
//     description: "Create a new service offering",
//   },
//   {
//     label: "Update Availability",
//     icon: Calendar,
//     description: "Manage your calendar",
//   },
//   {
//     label: "View Messages",
//     icon: MessageSquare,
//     description: "Check client inquiries",
//   },
//   {
//     label: "Account Settings",
//     icon: Settings,
//     description: "Update your profile",
//   },
// ];

// export default function QuickActions() {
//   return (
//     <div className="bg-white rounded-xl border border-[hsl(var(--gold))]/10 shadow-sm overflow-hidden">
//       <div className="p-6 border-b border-[hsl(var(--gold))]/10">
//         <h3 className="font-semibold text-foreground">Quick Actions</h3>
//         <p className="text-sm text-muted-foreground mt-0.5">Common tasks</p>
//       </div>

//       <div className="p-4 grid grid-cols-2 gap-3">
//         {actions.map((action, index) => (
//           <Button
//             key={action.label}
//             variant="outline"
//             className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-[hsl(var(--gold))]/5 hover:border-[hsl(var(--gold))]/30 transition-all group animate-in fade-in zoom-in-95"
//             style={{ animationDelay: `${index * 50}ms` }}
//           >
//             <div className="w-10 h-10 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center group-hover:bg-[hsl(var(--gold))]/20 transition-colors">
//               <action.icon className="w-5 h-5 text-[hsl(var(--gold))]" />
//             </div>
//             <span className="text-sm font-medium text-foreground">{action.label}</span>
//           </Button>
//         ))}
//       </div>
//     </div>
//   );
// }

