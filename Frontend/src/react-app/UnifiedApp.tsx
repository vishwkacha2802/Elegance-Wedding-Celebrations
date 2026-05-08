import { lazy, Suspense, useEffect, useState } from "react";

const HomeApp = lazy(() => import("@/react-app/App"));
const UserApp = lazy(() => import("@user/react-app/App"));
const VendorApp = lazy(() => import("@vendor/react-app/App"));
const AdminApp = lazy(() => import("@admin/react-app/App"));

const LOCATION_CHANGE_EVENT = "elegance:locationchange";

function patchHistoryEvents() {
  const windowWithFlag = window as Window & { __eleganceHistoryPatched?: boolean };
  if (windowWithFlag.__eleganceHistoryPatched) return;

  const wrap = (method: "pushState" | "replaceState") => {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History["pushState"]>) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
      return result;
    } as typeof history.pushState;
  };

  wrap("pushState");
  wrap("replaceState");

  window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  });

  windowWithFlag.__eleganceHistoryPatched = true;
}

export default function UnifiedApp() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    patchHistoryEvents();

    const syncPath = () => setPathname(window.location.pathname);
    window.addEventListener(LOCATION_CHANGE_EVENT, syncPath);

    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, syncPath);
    };
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream text-sm font-medium text-mauve">
          Loading...
        </div>
      }
    >
      {pathname.startsWith("/user") ? (
        <UserApp basename="/user" />
      ) : pathname.startsWith("/vendor") ? (
        <VendorApp basename="/vendor" />
      ) : pathname.startsWith("/admin") ? (
        <AdminApp />
      ) : (
        <HomeApp />
      )}
    </Suspense>
  );
}
