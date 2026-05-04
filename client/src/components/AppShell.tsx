import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Navbar />
      <main className="relative flex flex-1 flex-col">
        <div className="ethara-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
        <div className="relative z-10 flex flex-1 flex-col">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
