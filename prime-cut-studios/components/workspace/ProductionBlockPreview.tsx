import type {BookBlock} from '@/lib/project-book-db';
const shell={margin:'14px 0',display:'grid',gap:12} as const;
const card={border:'1px solid #5e5549',borderRadius:10,padding:14,minWidth:0} as const;
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12} as const;
const money=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function ProductionBlockPreview({block,staff=false}:{block:BookBlock;staff?:boolean}){
 const m=block.metadata;
 if(!m?.tool)return null;
 if(m.tool==='storyboard')return <div style={grid} aria-label="Storyboard del proyecto">
  {(m.frames||[]).map((f,i)=><article key={i} style={card}>
   <p className="eyebrow">FRAME {String(i+1).padStart(2,'0')} · {f.scene||'Escena por definir'}</p>
   {f.imageBlockId&&/^[a-f\d-]{36}$/i.test(f.imageBlockId)&&<img src={'/api/project-documents/'+f.imageBlockId} alt={'Storyboard '+(f.shot||String(i+1))} style={{width:'100%',height:185,objectFit:'contain',background:'#17191a',borderRadius:8}} loading="lazy"/>}
   <h4>{f.shot||'Plano pendiente'}</h4>
   <p style={{whiteSpace:'pre-wrap'}}>{f.description}</p>
   {f.duration&&<p className="small muted">Duración: {f.duration} s</p>}
   {f.notes&&<p className="small muted">Cámara y continuidad: {f.notes}</p>}
  </article>)}
 </div>;
 if(m.tool==='shots')return <div style={grid} aria-label="Plan de tomas">
  {(m.shots||[]).map((s,i)=><article key={i} style={card}>
   <p className="eyebrow">TOMA {i+1} · {s.scene}</p><h4>{s.framing||'Encuadre pendiente'}</h4>
   <p style={{whiteSpace:'pre-wrap'}}>{s.action}</p>
   <p className="small muted">Lente: {s.lens||'Por definir'} · FPS: {s.fps||'Por definir'} · Movimiento: {s.movement||'Por definir'}</p>
   <p className="small muted">Locación: {s.location||'Por definir'} · {s.status||'Pendiente'} · Prioridad: {s.priority||'Normal'}</p>
   {s.notes&&<p className="small muted">{s.notes}</p>}
  </article>)}
 </div>;
 if(m.tool==='schedule')return <div style={shell} aria-label="Plan de rodaje">
  {(m.shootRows||[]).map((s,i)=><article key={i} style={card}>
   <strong>{i+1}. {s.scene||'Bloque por definir'}</strong>
   <p>{s.start||'Inicio pendiente'} — {s.end||'Fin pendiente'} · {s.location||'Locación pendiente'}</p>
   <p>{s.task}</p><p className="small muted">Responsables: {s.crew||'Por asignar'} · {s.status||'Pendiente'}</p>
  </article>)}
 </div>;
 if(m.tool==='call_sheet')return <div style={shell} aria-label="Call sheet">
  {m.callSheet&&<div style={card}>
   <h4>Información de rodaje</h4><p>Fecha: {m.callSheet.shootDate||'Por confirmar'} · Llamado general: {m.callSheet.crewCall||'Por confirmar'}</p>
   <p>Dirección: {m.callSheet.address||'Por confirmar'}</p><p>Acceso / estacionamiento: {m.callSheet.parking||'Por confirmar'}</p>
   <p>Condiciones: {m.callSheet.weather||'Por confirmar'}</p>
   {staff&&m.callSheet.emergency&&<p>Contacto de emergencias: {m.callSheet.emergency}</p>}
   {m.callSheet.notes&&<p style={{whiteSpace:'pre-wrap'}}>{m.callSheet.notes}</p>}
  </div>}
 </div>;
 if(m.tool==='crew')return <div style={grid} aria-label="Casting y equipo">
  {(m.crewRows||[]).map((p,i)=><article key={i} style={card}>
   <h4>{p.name||'Persona pendiente'}</h4><p>{p.role||'Rol por definir'}</p>
   <p className="small muted">Llamado: {p.callTime||'Por confirmar'}</p>
   {staff&&p.contact&&<p className="small muted">Contacto interno: {p.contact}</p>}
   {p.notes&&<p style={{whiteSpace:'pre-wrap'}}>{p.notes}</p>}
  </article>)}
 </div>;
 if(m.tool==='budget'){
  const total=(m.budgetRows||[]).reduce((v,b)=>v+b.quantity*b.unitCost,0);
  const paid=(m.budgetRows||[]).filter(b=>b.paid).reduce((v,b)=>v+b.quantity*b.unitCost,0);
  return <div style={shell} aria-label="Presupuesto">
   <p><strong>Total: {money(total)}</strong> · Pagado: {money(paid)} · Pendiente: {money(total-paid)}</p>
   {(m.budgetRows||[]).map((b,i)=><article key={i} style={card}>
    <strong>{b.item||'Partida'} · {money(b.quantity*b.unitCost)}</strong>
    <p className="small muted">{b.category||'Sin categoría'} · {b.quantity} × {money(b.unitCost)} · {b.paid?'Pagado':'Pendiente'}</p>
    {b.notes&&<p>{b.notes}</p>}
   </article>)}
  </div>;
 }
 if(m.tool==='review')return <div style={shell} aria-label="Notas de revisión">
  {(m.reviewNotes||[]).map((r,i)=><article key={i} style={card}>
   <p className="eyebrow">{r.source||'Corte'} · {r.timecode||'Timecode pendiente'} · {r.status||'Pendiente'}</p>
   <p style={{whiteSpace:'pre-wrap'}}>{r.note}</p>
  </article>)}
 </div>;
 return null;
}
