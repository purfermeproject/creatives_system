import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

function cls(status: string) {
  if (status === "complete") return "ready";
  if (status === "blocked") return "blocked";
  return "draft";
}

export default async function Home() {
  const ws = await getWorkspace();
  const completed = ws.stages.filter((s:any) => s.status === "complete").length;
  const blocked = ws.stages.filter((s:any) => s.status === "blocked").length;
  const canonical = (ws.assets || []).filter((a:any) => a.is_canonical).length;
  return <AppShell active="dashboard">
    <div className="topbar">
      <div><div className="eyebrow">Workspace · {ws.mode.toUpperCase()}</div><h1>{ws.brand.name}</h1><p className="sub">{ws.brand.positioning}. Focus product: <b>{ws.product.name}</b>.</p></div>
      <div className="heroActions"><Link className="btn btnGhost" href="/assets">Upload assets</Link><Link className="btn btnPrimary" href="/pipeline">Open pipeline</Link></div>
    </div>

    <section className="grid grid4">
      <div className="card"><div className="kicker">Approved stages</div><div className="metric">{completed}/11</div><div className="muted">pipeline state</div></div>
      <div className="card"><div className="kicker">Blocked stages</div><div className="metric">{blocked}</div><div className="muted">need evidence/assets</div></div>
      <div className="card"><div className="kicker">Canonical assets</div><div className="metric">{canonical}</div><div className="muted">source-of-truth files</div></div>
      <div className="card"><div className="kicker">Run mode</div><div className="metric smallMetric">{ws.mode}</div><div className="muted">{ws.mode === "live" ? "PostgreSQL connected" : "demo fallback"}</div></div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><h2>Creative pipeline</h2><div className="muted">Human-approved gates between strategy, production and learning.</div></div><Link className="btn btnGhost" href="/pipeline">Manage pipeline</Link></div>
      <div className="pipeline">
        {ws.stages.map((s:any) => <div className="stage" key={s.key}>
          <div className="stageNum">{s.id}</div>
          <div><div className="stageTitle">{s.title}</div><div className="stageMeta">{s.description}</div></div>
          <span className={`badge ${cls(s.status)}`}>{s.status.toUpperCase()}</span>
          <Link className="btn btnGhost" href={`/pipeline?stage=${s.key}`}>Open</Link>
        </div>)}
      </div>
    </section>

    <section className="section grid grid2">
      <div className="card"><h2>Product fidelity gate</h2><p className="muted">Image production is allowed only when canonical source assets exist.</p><div className="checkList"><div>Front pack <b>{(ws.assets||[]).some((a:any)=>a.is_canonical&&a.asset_type==="front_pack")?"✓":"—"}</b></div><div>Real cookie reference <b>{(ws.assets||[]).some((a:any)=>a.is_canonical&&a.asset_type==="cookie_reference")?"✓":"—"}</b></div><div>Back pack <b>{(ws.assets||[]).some((a:any)=>a.is_canonical&&a.asset_type==="back_pack")?"✓":"optional"}</b></div></div></div>
      <div className="card"><h2>What happens next</h2><p className="muted">Run a stage, inspect structured output, approve it, and only then unlock the next stage. The system stores lineage in local PostgreSQL when connected.</p><Link className="btn btnPrimary" href="/pipeline">Continue workflow</Link></div>
    </section>
  </AppShell>
}
