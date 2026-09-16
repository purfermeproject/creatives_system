"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { STAGES } from "@/lib/stages";

type WS={mode:string;brand:any;product:any;stages:any[];assets:any[];latestRuns:any[]};
type ProductOption={id:string;name:string;status:string;[key:string]:any};
type BatchResult={status:"running"|"done"|"blocked"|"error";detail?:string};

export default function PipelinePage(){
  const [ws,setWs]=useState<WS|null>(null); const [health,setHealth]=useState<any>(null); const [busy,setBusy]=useState<string|null>(null); const [selected,setSelected]=useState("research"); const [output,setOutput]=useState<any>(null); const [error,setError]=useState("");
  const [products,setProducts]=useState<ProductOption[]>([]); const [productId,setProductId]=useState("");
  const [theme,setTheme]=useState("");
  const [batchIds,setBatchIds]=useState<Set<string>>(new Set());
  const [batchResults,setBatchResults]=useState<Record<string,BatchResult>>({});
  const [batchBusy,setBatchBusy]=useState(false);
  async function loadWorkspace(pid?:string){const url=pid?`/api/workspace?product=${encodeURIComponent(pid)}`:"/api/workspace"; const [wr,hr]=await Promise.all([fetch(url),fetch("/api/health")]); const j=await wr.json(); const h=await hr.json(); setWs(j); setHealth(h); setProductId(j.product.id);}
  async function loadProducts(){const r=await fetch("/api/products?brand=PF"); if(r.ok){setProducts(await r.json());}}
  useEffect(()=>{loadWorkspace();loadProducts()},[]);
  function switchProduct(id:string){if(id===productId)return; setOutput(null);setError("");loadWorkspace(id)}
  function toggleBatch(id:string){setBatchIds(prev=>{const next=new Set(prev); if(next.has(id))next.delete(id);else next.add(id); return next;})}
  function toggleAllBatch(){setBatchIds(prev=>prev.size===products.length?new Set():new Set(products.map(p=>p.id)))}
  const stage=useMemo(()=>STAGES.find(s=>s.key===selected)!,[selected]);
  const latest=ws?.latestRuns?.find((r:any)=>r.stage===selected);
  async function run(){ if(!ws)return; setBusy(selected);setError("");setOutput(null); const r=await fetch("/api/pipeline/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage:selected,brandId:ws.brand.id,productId:ws.product.id,input:{brand:ws.brand,product:ws.product,assets:ws.assets,latestApprovedRuns:ws.latestRuns.filter((x:any)=>x.approved).slice(0,12),theme:theme.trim()||undefined}})}); const j=await r.json(); if(!r.ok)setError(j.blocker||j.error||"Run failed"); else {setOutput(j);await loadWorkspace(productId);} setBusy(null); }
  async function approve(){const runId=output?.runId||latest?.id;if(!runId){setError("No persistent run ID. Local PostgreSQL is required for approvals.");return;} const r=await fetch("/api/pipeline/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runId,approved:true})});const j=await r.json();if(!r.ok)setError(j.error||"Approval failed");else {setOutput((x:any)=>({...x,approved:true}));await loadWorkspace(productId);}}
  async function runBatch(){
    if(batchIds.size===0||batchBusy)return;
    setBatchBusy(true);
    const ids=Array.from(batchIds);
    const results:Record<string,BatchResult>={...batchResults};
    for(const pid of ids){
      results[pid]={status:"running"}; setBatchResults({...results});
      try{
        const wr=await fetch(`/api/workspace?product=${encodeURIComponent(pid)}`);
        const wj=await wr.json();
        const r=await fetch("/api/pipeline/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage:selected,brandId:wj.brand.id,productId:pid,input:{brand:wj.brand,product:wj.product,assets:wj.assets,latestApprovedRuns:(wj.latestRuns||[]).filter((x:any)=>x.approved).slice(0,12),theme:theme.trim()||undefined}})});
        const j=await r.json();
        results[pid]=r.ok?{status:"done"}:{status:"blocked",detail:j.blocker||j.error};
      }catch(e:any){
        results[pid]={status:"error",detail:e?.message||"Request failed"};
      }
      setBatchResults({...results});
    }
    setBatchBusy(false);
    if(batchIds.has(productId))await loadWorkspace(productId);
  }
  if(!ws) return <AppShell active="pipeline"><div className="topbar"><h1>Loading pipeline…</h1></div></AppShell>;
  return <AppShell active="pipeline">
    <div className="topbar"><div><div className="eyebrow">{ws.brand.name} / {ws.product.name}</div><h1>Creative Pipeline</h1><p className="sub">Run → inspect → approve. The next stage stays locked until the latest upstream run is approved.</p></div><div style={{display:"flex",gap:8,alignItems:"center"}}>
      {products.length>0 && <select value={productId} onChange={e=>switchProduct(e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}</select>}
      <span className={`badge ${ws.mode==="live"?"ready":"draft"}`}>{ws.mode.toUpperCase()}</span><span className="badge draft">AI: {(health?.aiProvider||"unknown").toUpperCase()}</span></div></div>
    {products.length===0 && ws.mode!=="live" && <div className="alert warn" style={{marginBottom:16}}>Only the demo product is available in demo mode. Configure Postgres and add products in the Products page to switch between them here.</div>}
    {products.length>0 && <div className="card" style={{marginBottom:16,padding:16}}>
      <div className="sectionHead"><div><h3 style={{margin:0}}>Run "{stage.title}" for multiple products</h3><p className="muted small" style={{margin:0}}>Pick which products this campaign theme applies to, then run this stage for all of them at once. Each product still gates and approves independently.</p></div>
        <button className="btn btnPrimary" onClick={runBatch} disabled={batchBusy||batchIds.size===0}>{batchBusy?"Running…":`Run for ${batchIds.size} product${batchIds.size===1?"":"s"}`}</button>
      </div>
      <label style={{display:"block",margin:"8px 0"}}><input type="checkbox" checked={batchIds.size===products.length&&products.length>0} onChange={toggleAllBatch}/> Select all products</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
        {products.map(p=>{const res=batchResults[p.id]; return <label key={p.id} style={{display:"flex",alignItems:"center",gap:6,border:"1px solid #eee",borderRadius:8,padding:"6px 10px"}}>
          <input type="checkbox" checked={batchIds.has(p.id)} onChange={()=>toggleBatch(p.id)}/>
          <span>{p.name}</span>
          {res&&<span className={`badge ${res.status==="done"?"ready":res.status==="running"?"draft":"blocked"}`} title={res.detail||""}>{res.status.toUpperCase()}</span>}
        </label>})}
      </div>
    </div>}
    <div className="pipelineLayout">
      <div className="stageRail">{STAGES.map(s=>{const state=ws.stages.find((x:any)=>x.key===s.key);return <button key={s.key} className={`railItem ${selected===s.key?"selected":""}`} onClick={()=>{setSelected(s.key);setOutput(null);setError("")}}><span className="stageNum">{s.number}</span><span><b>{s.title}</b><small>{state?.status||"draft"}</small></span></button>})}</div>
      <div className="stagePanel card">
        <div className="sectionHead"><div><div className="eyebrow">Module {stage.number}</div><h2>{stage.title}</h2><div className="muted">Latest persistent state: {latest ? `${latest.status}${latest.approved?" · approved":" · awaiting approval"}` : "No run"}</div></div><div className="heroActions"><button className="btn btnPrimary" onClick={run} disabled={busy!==null || selected==="performance"}>{busy===selected?"Running…":selected==="performance"?"Import metrics":"Run module"}</button><button className="btn btnGhost" onClick={approve} disabled={!latest && !output?.runId}>Approve latest</button></div></div>
        <label style={{display:"block",marginBottom:16}}>Campaign theme / occasion <span className="muted small">(optional — e.g. "Diwali gifting", "New Year reset". Leave blank for evergreen output.)</span><input value={theme} onChange={e=>setTheme(e.target.value)} placeholder="e.g. Diwali gifting ritual" style={{width:"100%"}}/></label>
        {error&&<div className="alert danger"><b>Blocked:</b> {error}</div>}
        <div className="gateStrip"><span>Upstream approval gates</span><span>Canonical asset gates</span><span>JSON audit trail</span><span>Human approval</span></div>
        <h3>Latest output</h3><div className="codeLike">{output?JSON.stringify(output,null,2):latest?JSON.stringify(latest.output_json,null,2):"Run this module to produce structured output."}</div>
      </div>
    </div>
  </AppShell>
}
