"use client";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Brand = {
  id:string; name:string; category:string; positioning:string; brand_promise:string; differentiator:string; tone:string;
  visual_identity:any; guardrails:any;
};

const fallback: Brand = {
  id:"PF", name:"Pur’ Ferme Project", category:"Functional foods", positioning:"", brand_promise:"", differentiator:"", tone:"",
  visual_identity:{primary:"#36013F",secondary:"#FBF3E3",heading_font:"EB Garamond",body_font:"Inter"}, guardrails:{avoid:[]}
};

export default function Brands(){
  const [brand,setBrand]=useState<Brand>(fallback); const [loading,setLoading]=useState(true); const [editing,setEditing]=useState(false); const [msg,setMsg]=useState(""); const [busy,setBusy]=useState(false);
  async function load(){ setLoading(true); const r=await fetch("/api/brands/PF"); const j=await r.json(); if(r.ok)setBrand(j); else setMsg(j.error||"Could not load brand."); setLoading(false); }
  useEffect(()=>{load()},[]);
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true); setMsg("");
    const fd=new FormData(e.currentTarget);
    const avoid=String(fd.get("avoid")||"").split("\n").map(x=>x.trim()).filter(Boolean);
    const payload={
      name:fd.get("name"), category:fd.get("category"), positioning:fd.get("positioning"), brand_promise:fd.get("brand_promise"), differentiator:fd.get("differentiator"), tone:fd.get("tone"),
      visual_identity:{primary:fd.get("primary"),secondary:fd.get("secondary"),heading_font:fd.get("heading_font"),body_font:fd.get("body_font")}, guardrails:{...(brand.guardrails||{}),avoid}
    };
    const r=await fetch("/api/brands/PF",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(payload)}); const j=await r.json();
    if(r.ok){setBrand(j);setEditing(false);setMsg("Brand Brain saved. All future AI runs inherit these values.");} else setMsg(j.error||"Save failed"); setBusy(false);
  }
  const vi=brand.visual_identity||{}; const avoid=Array.isArray(brand.guardrails?.avoid)?brand.guardrails.avoid:[];
  return <AppShell active="brands"><div className="topbar"><div><div className="eyebrow">Brand Brain</div><h1>{loading?"Loading…":brand.name}</h1><p className="sub">The strategic source-of-truth inherited by every AI module. Edit it here instead of changing prompts one by one.</p></div><div className="heroActions"><span className="badge ready">ACTIVE</span><button className="btn btnPrimary" onClick={()=>setEditing(v=>!v)}>{editing?"Cancel edit":"Edit Brand Brain"}</button></div></div>
  {msg&&<div className={`alert ${msg.includes("saved")?"ok":"warn"}`} style={{marginBottom:16}}>{msg}</div>}
  {!editing ? <>
    <section className="grid grid2"><div className="card"><h2>Positioning</h2><dl className="facts"><dt>Category</dt><dd>{brand.category||"—"}</dd><dt>Positioning</dt><dd>{brand.positioning||"—"}</dd><dt>Brand promise</dt><dd>{brand.brand_promise||"—"}</dd><dt>Differentiator</dt><dd>{brand.differentiator||"—"}</dd><dt>Tone</dt><dd>{brand.tone||"—"}</dd></dl></div><div className="card"><h2>Identity</h2><div className="swatches"><div className="swatch" style={{background:vi.primary||"#36013F"}}><span>{vi.primary||"#36013F"}</span></div><div className="swatch light" style={{background:vi.secondary||"#FBF3E3"}}><span>{vi.secondary||"#FBF3E3"}</span></div></div><p className="muted">Heading: {vi.heading_font||"EB Garamond"} · Body: {vi.body_font||"Inter"}</p></div></section>
    <section className="card wideCard"><h2>Communication guardrails</h2><div className="chips">{avoid.length?avoid.map((x:string)=><span className="chip" key={x}>{x}</span>):<span className="muted">No guardrails saved yet.</span>}</div></section>
  </> : <form className="card editorCard" onSubmit={save}><div className="formGrid"><label>Name<input name="name" defaultValue={brand.name} required/></label><label>Category<input name="category" defaultValue={brand.category||""}/></label></div><label>Positioning<textarea name="positioning" defaultValue={brand.positioning||""}/></label><div className="formGrid"><label>Brand promise<input name="brand_promise" defaultValue={brand.brand_promise||""}/></label><label>Differentiator<input name="differentiator" defaultValue={brand.differentiator||""}/></label></div><label>Tone<textarea name="tone" defaultValue={brand.tone||""}/></label><div className="formGrid"><label>Primary colour<input name="primary" defaultValue={vi.primary||"#36013F"}/></label><label>Secondary colour<input name="secondary" defaultValue={vi.secondary||"#FBF3E3"}/></label><label>Heading font<input name="heading_font" defaultValue={vi.heading_font||"EB Garamond"}/></label><label>Body font<input name="body_font" defaultValue={vi.body_font||"Inter"}/></label></div><label>Words / claims / behaviours to avoid <span className="muted small">One per line</span><textarea name="avoid" defaultValue={avoid.join("\n")}/></label><div className="heroActions"><button className="btn btnPrimary" disabled={busy}>{busy?"Saving…":"Save Brand Brain"}</button><button type="button" className="btn btnGhost" onClick={()=>setEditing(false)}>Cancel</button></div></form>}
  </AppShell>
}
