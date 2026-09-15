import Link from "next/link";
import { ReactNode } from "react";

export function AppShell({ children, active }: { children: ReactNode; active?: string }) {
  const nav = [
    ["/", "Dashboard", "dashboard"],
    ["/brands", "Brand Brain", "brands"],
    ["/products", "Products", "products"],
    ["/assets", "Assets", "assets"],
    ["/pipeline", "Pipeline", "pipeline"],
    ["/production", "Production", "production"],
    ["/runs", "Run History", "runs"],
  ];
  return <div className="shell">
    <aside className="sidebar">
      <div className="brandmark">Creative OS</div>
      <div className="workspaceTag">Internal creative system</div>
      <nav className="nav">
        {nav.map(([href,label,key]) => <Link key={href} className={active===key ? "active" : ""} href={href}>{label}</Link>)}
      </nav>
      <div className="sidebarFoot">Browser V6<br/>Strategy → Production → Learning</div>
    </aside>
    <main className="main">{children}</main>
  </div>
}
