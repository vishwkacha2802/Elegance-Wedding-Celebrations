import { Loader2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin">
        <Loader2 className="w-10 h-10" />
      </div>
    </div>
  );
}


// import { Loader2 } from 'lucide-react'

// export default function Home() {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen water-gradient">

//       <div className="glass-card p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">

//         <div className="animate-spin text-rose-400">
//           <Loader2 className="w-10 h-10" />
//         </div>

//         <p className="text-sm text-gray-500 tracking-wide">
//           Loading Elegance Dashboard...
//         </p>

//       </div>

//     </div>
//   );
// }
