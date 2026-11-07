import type {BookBlock} from '@/lib/project-book-db';
import {DrivePhotoReference} from '@/components/workspace/DrivePhotoReference';
import styles from './ProductionVisuals.module.css';
const shell={margin:'14px 0',display:'grid',gap:12} as const;
const card={border:'1px solid #5e5549',borderRadius:10,padding:14,minWidth:0} as const;
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12} as const;
const money=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function ProductionBlockPreview({block,staff=false}:{block:BookBlock;staff?:boolean}){
 const m=block.metadata;
 if(!m?.tool)return null;
 if(m.tool==='storyboard')return <div className={styles.boardGrid} aria-label="Storyboard del proyecto">
  {(m.frames||[]).map((frame,i)=><article key={i} className={styles.boardCard}>
   <div className={styles.boardMedia}>
    {frame.imageBlockId&&/^[a-f\d-]{36}$/i.test(frame.imageBlockId)
      ?<a href={'/api/project-documents/'+frame.imageBlockId} target="_blank" rel="noopener noreferrer" style={{display:'block',width:'100%',height:'100%'}}>
        <img src={'/api/project-documents/'+frame.imageBlockId} alt={'Storyboard '+(frame.shot||String(i+1))} loading="lazy"/>
       </a>
      :frame.imageUrl
       ?<DrivePhotoReference url={frame.imageUrl} title={'Storyboard '+(frame.shot||String(i+1))} variant="cover"/>
       :<div className={styles.boardEmpty}>Referencia visual pendiente</div>}
    <span className={styles.boardBadge}>FRAME {String(i+1).padStart(2,'0')}</span>
    <span className={styles.boardScene}>{frame.scene||'Escena por definir'}</span>
   </div>
   <div className={styles.boardBody}>
    <div className={styles.boardHeader}>
     <h4>{frame.shot||'Plano '+(i+1)}</h4>
     {frame.duration&&<span className={styles.boardDuration}>{frame.duration} segundos</span>}
    </div>
    <p className={styles.boardDescription}>{frame.description||'Descripción pendiente'}</p>
    {frame.notes&&<details className={styles.boardEdit}><summary>Notas de cámara y continuidad</summary>
      <p style={{fontSize:13,color:'#d3c7b7',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{frame.notes}</p>
     </details>}
   </div>
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
