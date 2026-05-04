import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Outlet />
    </div>
  );
}
