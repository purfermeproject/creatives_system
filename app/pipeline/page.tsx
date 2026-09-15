"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { STAGES } from "@/lib/stages";

type WS={mode:string;brand:any;product:any;stages:any[];assets:any[];latestRuns:any[]};

export default function PipelinePage(){
  const [ws,setWs]=useState<WS|null>(null); const [health,setHealth]=useState<any>(null); const [busy,setBusy]=useState<string|null>(null); const [selected,setSelected]=useState("research"); const [output,setOutput]=useState<any>(null); const [error,setError]=useState("");
  async function load(){const [wr,hr]=await Promise.all([fetch("/api/workspace"),fetch("/api/health")]); const j=await wr.json(); const h=await hr.json(); setWs(j); setHealth(h);}
  useEffect(()=>{load()},[]);
  const stage=useMemo(()=>STAGES.find(s=>s.key===selected)!,[selected]);
  const latest=ws?.latestRuns?.find((r:any)=>r.stage===selected);
  async function run(){ if(!ws)return; setBusy(selected);setError("");setOutput(null); const r=await fetch("/api/pipeline/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage:selected,brandId:ws.brand.id,productId:ws.product.id,input:{brand:ws.brand,product:ws.product,assets:ws.assets,latestApprovedRuns:ws.latestRuns.filter((x:any)=>x.approved).slice(0,12)}})}); const j=await r.json(); if(!r.ok)setError(j.blocker||j.error||"Run failed"); else {setOutput(j);await load();} setBusy(null); }
  async function approve(){const runId=output?.runId||latest?.id;if(!runId){setError("No persistent run ID. Local PostgreSQL is required for approvals.");return;} const r=await fetch("/api/pipeline/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runId,approved:true})});const j=await r.json();if(!r.ok)setError(j.error||"Approval failed");else {setOutput((x:any)=>({...x,approved:true}));await load();}}
  if(!ws) return <AppShell active="pipeline"><div className="topbar"><h1>Loading pipeline…</h1></div></AppShell>;
  return <AppShell active="pipeline">
    <div className="topbar"><div><div className="eyebrow">{ws.brand.name} / {ws.product.name}</div><h1>Creative Pipeline</h1><p className="sub">Run → inspect → approve. The next stage stays locked until the latest upstream run is approved.</p></div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className={`badge ${ws.mode==="live"?"ready":"draft"}`}>{ws.mode.toUpperCase()}</span><span className="badge draft">AI: {(health?.aiProvider||"unknown").toUpperCase()}</span></div></div>
    <div className="pipelineLayout">
      <div className="stageRail">{STAGES.map(s=>{const state=ws.stages.find((x:any)=>x.key===s.key);return <button key={s.key} className={`railItem ${selected===s.key?"selected":""}`} onClick={()=>{setSelected(s.key);setOutput(null);setError("")}}><span className="stageNum">{s.number}</span><span><b>{s.title}</b><small>{state?.status||"draft"}</small></span></button>})}</div>
      <div className="stagePanel card">
        <div className="sectionHead"><div><div className="eyebrow">Module {stage.number}</div><h2>{stage.title}</h2><div className="muted">Latest persistent state: {latest ? `${latest.status}${latest.approved?" · approved":" · awaiting approval"}` : "No run"}</div></div><div className="heroActions"><button className="btn btnPrimary" onClick={run} disabled={busy!==null || selected==="performance"}>{busy===selected?"Running…":selected==="performance"?"Import metrics":"Run module"}</button><button className="btn btnGhost" onClick={approve} disabled={!latest && !output?.runId}>Approve latest</button></div></div>
        {error&&<div className="alert danger"><b>Blocked:</b> {error}</div>}
        <div className="gateStrip"><span>Upstream approval gates</span><span>Canonical asset gates</span><span>JSON audit trail</span><span>Human approval</span></div>
        <h3>Latest output</h3><div className="codeLike">{output?JSON.stringify(output,null,2):latest?JSON.stringify(latest.output_json,null,2):"Run this module to produce structured output."}</div>
      </div>
    </div>
  </AppShell>
}
