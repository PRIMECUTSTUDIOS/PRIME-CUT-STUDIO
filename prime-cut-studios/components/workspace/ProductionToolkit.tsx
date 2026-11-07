'use client';
import {useState} from 'react';
import type {BookBlock} from '@/lib/project-book-db';
import type {BookMetadata,ToolKind,StoryboardFrame,Shot,ShootRow,CrewRow,BudgetRow,ReviewNote,CallSheet} from '@/lib/project-book-policy';
import {WorkspaceForm} from '@/components/workspace/WorkspaceForm';
import {BookUpload} from '@/components/workspace/BookUpload';
import {DrivePhotoReference} from '@/components/workspace/DrivePhotoReference';

type Props={projectId:string;blocks:BookBlock[];canEdit:boolean;newIds:Record<ToolKind,string>};
const descriptions:Record<ToolKind,{label:string;kind:BookBlock['kind'];title:string;desc:string}>={
 storyboard:{label:'Storyboard visual',kind:'custom',title:'Storyboard visual · proyecto',desc:'Ordena las imágenes, planos y momentos de la historia. Asocia cada frame a una foto subida al proyecto.'},
 shots:{label:'Shot list técnico',kind:'shot_list',title:'Shot list maestro',desc:'Define encuadres, lentes, movimientos, estado y prioridad de cada plano.'},
 schedule:{label:'Plan de rodaje',kind:'schedule',title:'Plan de rodaje detallado',desc:'Ordena escenas, horarios, locaciones, equipo responsable y progreso.'},
 call_sheet:{label:'Call sheet',kind:'schedule',title:'Call sheet del rodaje',desc:'Centraliza el llamado del equipo, dirección, instrucciones, seguridad y notas.'},
 crew:{label:'Casting y crew',kind:'cast',title:'Directorio de casting y crew',desc:'Participantes, roles, contactos y horarios de llamado. Información interna por defecto.'},
 budget:{label:'Presupuesto',kind:'custom',title:'Presupuesto de producción',desc:'Calcula gastos por partida, cantidades, pagos y total pendiente.'},
 review:{label:'Revisiones de video',kind:'custom',title:'Revisión de cortes y versiones',desc:'Guarda notas con timecode y estado. Adjunta el video como enlace o archivo de proyecto.'}
};
const keys=Object.keys(descriptions) as ToolKind[];
const textStyle={width:'100%'} as const;
const input=(label:string,value:string,onChange:(value:string)=>void,opts:{placeholder?:string;type?:string;max?:number}={})=><label style={{display:'block',minWidth:0}}>{label}<input style={textStyle} type={opts.type||'text'} placeholder={opts.placeholder||''} value={value} maxLength={opts.max||300} onChange={e=>onChange(e.target.value)}/></label>;
const area=(label:string,value:string,onChange:(value:string)=>void,max=600)=><label style={{display:'block'}}>{label}<textarea style={textStyle} rows={2} maxLength={max} value={value} onChange={e=>onChange(e.target.value)}/></label>;
const emptyFrame=():StoryboardFrame=>({scene:'',shot:'',description:'',imageBlockId:'',duration:'',notes:''});
const emptyShot=():Shot=>({scene:'',framing:'',action:'',movement:'',notes:'',lens:'',fps:'',duration:'',location:'',status:'Pendiente',priority:'Normal'});
const emptyShoot=():ShootRow=>({scene:'',start:'',end:'',location:'',task:'',crew:'',status:'Pendiente'});
const emptyCrew=():CrewRow=>({name:'',role:'',contact:'',callTime:'',notes:''});
const emptyBudget=():BudgetRow=>({item:'',category:'',quantity:1,unitCost:0,paid:false,notes:''});
const emptyReview=():ReviewNote=>({source:'',timecode:'',note:'',status:'Pendiente'});
const emptyCall=():CallSheet=>({shootDate:'',crewCall:'',address:'',parking:'',emergency:'',weather:'',notes:''});
const miniGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,170px),1fr))',gap:10} as const;
const frameGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:12} as const;
const status=['Pendiente','Confirmado','En progreso','Completado','Cancelado'];
function Choice({label,value,options,change}:{label:string;value:string;options:string[];change:(v:string)=>void}){
 return <label>{label}<select value={value} onChange={e=>change(e.target.value)}>{options.map(v=><option key={v} value={v}>{v}</option>)}</select></label>;
}
export function ProductionToolkit({projectId,blocks,canEdit,newIds}:Props){
 const [active,setActive]=useState<ToolKind>('storyboard');
 const saved=blocks.find(b=>b.metadata?.tool===active)||null;
 const images=blocks.filter(b=>b.storage_path&&b.file_mime?.startsWith('image/'));
 const driveReferences=blocks.filter(b=>b.kind==='reference'&&b.title.startsWith('Fotos scouting Airbnb Juncos')).flatMap(b=>b.metadata?.links||[]);
 return <section className="panel" style={{padding:22,margin:'20px 0',borderColor:'#906d3e'}} aria-label="Herramientas avanzadas de producción">
  <div className="eyebrow" style={{color:'#efc48e'}}>PRODUCTION SUITE · DENTRO DE PRIME CUT STUDIOS</div>
  <h2 style={{margin:'8px 0'}}>Herramientas de producción online</h2>
  <p className="muted">Cada módulo guarda sus datos en este proyecto, con versiones y permisos para el equipo. No es necesario utilizar otra plataforma.</p>
  <nav aria-label="Módulos de producción" style={{display:'flex',flexWrap:'wrap',gap:7,margin:'16px 0 18px'}}>
   {keys.map(k=><button key={k} type="button" className={'btn '+(active===k?'':'secondary')} aria-pressed={active===k} onClick={()=>setActive(k)} style={{fontSize:12,padding:'9px 11px'}}>{descriptions[k].label}{blocks.some(b=>b.metadata?.tool===k)?' · guardado':''}</button>)}
  </nav>
  <ToolkitEditor key={active+':'+(saved?.id||'new')+':'+(saved?.revision||0)} tool={active} projectId={projectId} block={saved} images={images} driveReferences={driveReferences} canEdit={canEdit} newId={newIds[active]}/>
 </section>;
}
function ToolkitEditor({tool,projectId,block,images,driveReferences,canEdit,newId}:{tool:ToolKind;projectId:string;block:BookBlock|null;images:BookBlock[];driveReferences:{label:string;url:string}[];canEdit:boolean;newId:string}){
 const config=descriptions[tool];
 const [title,setTitle]=useState(block?.title||config.title);
 const [body,setBody]=useState(block?.body||'');
 const [visible,setVisible]=useState(block?.client_visible||false);
 const [approval,setApproval]=useState(block?.requires_approval||false);
 const [data,setData]=useState<BookMetadata>({colors:[],links:[],...(block?.metadata||{}),tool});
 const frames=data.frames||[],shots=data.shots||[],shootRows=data.shootRows||[],crewRows=data.crewRows||[],budgetRows=data.budgetRows||[],reviews=data.reviewNotes||[];
 const call=data.callSheet||emptyCall();
 const setFrames=(a:StoryboardFrame[])=>setData(v=>({...v,frames:a}));
 const setShots=(a:Shot[])=>setData(v=>({...v,shots:a}));
 const setSchedule=(a:ShootRow[])=>setData(v=>({...v,shootRows:a}));
 const setCrew=(a:CrewRow[])=>setData(v=>({...v,crewRows:a}));
 const setBudget=(a:BudgetRow[])=>setData(v=>({...v,budgetRows:a}));
 const setReviews=(a:ReviewNote[])=>setData(v=>({...v,reviewNotes:a}));
 const updateFrame=(i:number,k:keyof StoryboardFrame,v:string)=>setFrames(frames.map((f,j)=>i===j?{...f,[k]:v}:f));
 const updateShot=(i:number,k:keyof Shot,v:string)=>setShots(shots.map((f,j)=>i===j?{...f,[k]:v}:f));
 const updateSchedule=(i:number,k:keyof ShootRow,v:string)=>setSchedule(shootRows.map((f,j)=>i===j?{...f,[k]:v}:f));
 const updateCrew=(i:number,k:keyof CrewRow,v:string)=>setCrew(crewRows.map((f,j)=>i===j?{...f,[k]:v}:f));
 const updateReview=(i:number,k:keyof ReviewNote,v:string)=>setReviews(reviews.map((f,j)=>i===j?{...f,[k]:v}:f));
 const setCall=(k:keyof CallSheet,v:string)=>setData(prev=>({...prev,callSheet:{...call,[k]:v}}));
 const updateBudget=(i:number,k:keyof BudgetRow,v:string|number|boolean)=>setBudget(budgetRows.map((f,j)=>i===j?{...f,[k]:v}:f));
 const total=budgetRows.reduce((n,b)=>n+(b.quantity||0)*(b.unitCost||0),0);
 const paid=budgetRows.filter(b=>b.paid).reduce((n,b)=>n+(b.quantity||0)*(b.unitCost||0),0);
 const blank=!block;
 const lock=(!canEdit);
 const buttonAdd=(label:string,fn:()=>void,disabled:boolean)=><button type="button" className="btn secondary btn-small" onClick={fn} disabled={disabled||lock}>+ {label}</button>;
 const remove=(fn:()=>void)=><button type="button" className="btn secondary btn-small" disabled={lock} onClick={fn}>Eliminar fila</button>;
 return <div>
  <h3>{config.label}</h3><p className="muted">{config.desc}</p>
  {blank&&<p className="small muted">Este módulo aún no tiene datos. Crea la primera versión para guardarlo en el proyecto.</p>}
  <fieldset disabled={lock} style={{border:0,padding:0,minWidth:0}}>
  <WorkspaceForm method="post" action="/api/team/project-book" className="form">
   <input type="hidden" name="returnTo" value="studio"/>
   <input type="hidden" name="projectId" value={projectId}/>
   <input type="hidden" name="blockId" value={block?.id||newId}/>
   <input type="hidden" name="revision" value={block?.revision||0}/>
   <input type="hidden" name="kind" value={config.kind}/>
   <input type="hidden" name="metadata" value={JSON.stringify({...data,tool})}/>
   {input('Nombre de esta sección',title,setTitle,{max:160})}
   <input type="hidden" name="title" value={title}/>
   {tool==='storyboard'&&<>
    <p className="small muted">Storyboard secuencial. Los archivos pueden subirse abajo y vincularse a cada frame.</p>
    <div style={frameGrid}>{frames.map((f,i)=><article key={i} className="panel" style={{padding:13,minWidth:0}}>
     <p className="eyebrow">FRAME {i+1}</p>
     <div style={{height:145,background:'#17191a',borderRadius:8,display:'grid',placeItems:'center',overflow:'hidden',marginBottom:12}}>
      {f.imageUrl?<DrivePhotoReference url={f.imageUrl} title={'Storyboard '+(i+1)} height={130}/>:f.imageBlockId&&images.some(img=>img.id===f.imageBlockId)?<img alt={'Storyboard frame '+(i+1)} src={'/api/project-documents/'+f.imageBlockId} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span className="small muted">Sin imagen asignada</span>}
     </div>
     <div style={miniGrid}>{input('Escena',f.scene,v=>updateFrame(i,'scene',v),{max:120})}{input('Plano',f.shot,v=>updateFrame(i,'shot',v),{max:120})}</div>
     <label>Foto de scouting (Drive)<select value={f.imageUrl||''} onChange={e=>updateFrame(i,'imageUrl',e.target.value)}><option value="">Sin foto externa</option>{driveReferences.map(photo=><option key={photo.url} value={photo.url}>{photo.label}</option>)}</select></label>
     <label>Imagen subida directamente al proyecto<select value={f.imageBlockId} onChange={e=>updateFrame(i,'imageBlockId',e.target.value)}><option value="">Sin archivo interno</option>{images.map(image=><option key={image.id} value={image.id}>{image.title}</option>)}</select></label>
     {area('Descripción visual',f.description,v=>updateFrame(i,'description',v))}
     {input('Duración estimada (segundos)',f.duration,v=>updateFrame(i,'duration',v),{max:30})}
     {area('Cámara, acción y continuidad',f.notes,v=>updateFrame(i,'notes',v),400)}
     <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {i>0&&<button type="button" className="btn secondary btn-small" onClick={()=>{const next=[...frames];[next[i-1],next[i]]=[next[i],next[i-1]];setFrames(next);}}>Subir</button>}
      {i<frames.length-1&&<button type="button" className="btn secondary btn-small" onClick={()=>{const next=[...frames];[next[i],next[i+1]]=[next[i+1],next[i]];setFrames(next);}}>Bajar</button>}
      {remove(()=>setFrames(frames.filter((_,j)=>j!==i)))}
     </div>
    </article>)}</div>
    {buttonAdd('Frame al storyboard',()=>setFrames([...frames,emptyFrame()]),frames.length>=30)}
   </>}
   {tool==='shots'&&<>
    <p className="small muted">{shots.length} planos planificados. Prioriza y confirma los planos antes del rodaje.</p>
    {shots.map((s,i)=><article key={i} className="panel" style={{padding:15,marginBottom:12}}>
     <h4>Plano {i+1}</h4>
     <div style={miniGrid}>
      {input('Escena',s.scene,v=>updateShot(i,'scene',v),{max:120})}
      {input('Encuadre',s.framing,v=>updateShot(i,'framing',v),{max:160})}
      {input('Lente (mm)',s.lens||'',v=>updateShot(i,'lens',v),{max:120})}
      {input('FPS',s.fps||'',v=>updateShot(i,'fps',v),{max:30})}
      {input('Duración',s.duration||'',v=>updateShot(i,'duration',v),{max:120})}
      {input('Locación',s.location||'',v=>updateShot(i,'location',v),{max:120})}
      <Choice label="Prioridad" value={s.priority||'Normal'} options={['Alta','Normal','Baja']} change={v=>updateShot(i,'priority',v)}/>
      <Choice label="Estado" value={s.status||'Pendiente'} options={status} change={v=>updateShot(i,'status',v)}/>
     </div>
     {area('Acción',s.action,v=>updateShot(i,'action',v),1000)}
     {area('Movimiento de cámara',s.movement,v=>updateShot(i,'movement',v),1000)}
     {area('Continuidad / notas',s.notes,v=>updateShot(i,'notes',v),1000)}
     {remove(()=>setShots(shots.filter((_,j)=>j!==i)))}
    </article>)}
    {buttonAdd('Plano',()=>setShots([...shots,emptyShot()]),shots.length>=60)}
   </>}
   {tool==='schedule'&&<>
    {shootRows.map((s,i)=><article key={i} className="panel" style={{padding:15,marginBottom:12}}>
     <h4>Bloque {i+1}</h4><div style={miniGrid}>
      {input('Escena / unidad',s.scene,v=>updateSchedule(i,'scene',v),{max:120})}
      {input('Inicio',s.start,v=>updateSchedule(i,'start',v),{type:'datetime-local',max:30})}
      {input('Fin',s.end,v=>updateSchedule(i,'end',v),{type:'datetime-local',max:30})}
      {input('Locación',s.location,v=>updateSchedule(i,'location',v),{max:160})}
      {input('Responsables',s.crew,v=>updateSchedule(i,'crew',v),{max:200})}
      <Choice label="Estado" value={s.status||'Pendiente'} options={status} change={v=>updateSchedule(i,'status',v)}/>
     </div>{area('Actividad / descripción',s.task,v=>updateSchedule(i,'task',v),400)}
     {remove(()=>setSchedule(shootRows.filter((_,j)=>j!==i)))}
    </article>)}
    {buttonAdd('Bloque de rodaje',()=>setSchedule([...shootRows,emptyShoot()]),shootRows.length>=50)}
   </>}
   {tool==='call_sheet'&&<>
    <div style={miniGrid}>
     {input('Fecha de rodaje',call.shootDate,v=>setCall('shootDate',v),{type:'date',max:30})}
     {input('Hora general de llamado',call.crewCall,v=>setCall('crewCall',v),{type:'time',max:30})}
     {input('Pronóstico / condiciones',call.weather,v=>setCall('weather',v),{max:160})}
    </div>
    {area('Dirección exacta de rodaje',call.address,v=>setCall('address',v),300)}
    {area('Acceso, estacionamiento y puntos de encuentro',call.parking,v=>setCall('parking',v),300)}
    {area('Emergencias / hospital / contacto de producción',call.emergency,v=>setCall('emergency',v),200)}
    {area('Equipo necesario, comida, seguridad y avisos',call.notes,v=>setCall('notes',v),1200)}
    <button type="button" className="btn secondary btn-small" onClick={()=>window.print()}>Imprimir call sheet</button>
   </>}
   {tool==='crew'&&<>
    <p className="small muted">Utiliza esta ficha para los llamados internos; no publiques teléfonos privados del personal al cliente.</p>
    {crewRows.map((c,i)=><article key={i} className="panel" style={{padding:15,marginBottom:12}}>
     <h4>Persona {i+1}</h4><div style={miniGrid}>
      {input('Nombre',c.name,v=>updateCrew(i,'name',v),{max:120})}
      {input('Papel / departamento',c.role,v=>updateCrew(i,'role',v),{max:120})}
      {input('Contacto',c.contact,v=>updateCrew(i,'contact',v),{max:160})}
      {input('Hora de llamado',c.callTime,v=>updateCrew(i,'callTime',v),{max:40})}
     </div>{area('Vestuario, disponibilidad, transporte',c.notes,v=>updateCrew(i,'notes',v),400)}
     {remove(()=>setCrew(crewRows.filter((_,j)=>j!==i)))}
    </article>)}
    {buttonAdd('Talento o crew',()=>setCrew([...crewRows,emptyCrew()]),crewRows.length>=60)}
   </>}
   {tool==='budget'&&<>
    <div style={{display:'flex',gap:18,flexWrap:'wrap',margin:'14px 0 18px'}}>
     <div className="dashmetric"><span>Presupuesto total</span><b>{total.toLocaleString('en-US',{style:'currency',currency:'USD'})}</b></div>
     <div className="dashmetric"><span>Marcado como pagado</span><b>{paid.toLocaleString('en-US',{style:'currency',currency:'USD'})}</b></div>
     <div className="dashmetric"><span>Pendiente</span><b>{(total-paid).toLocaleString('en-US',{style:'currency',currency:'USD'})}</b></div>
    </div>
    {budgetRows.map((b,i)=><article key={i} className="panel" style={{padding:15,marginBottom:12}}>
     <div style={miniGrid}>
      {input('Concepto',b.item,v=>updateBudget(i,'item',v),{max:160})}
      {input('Categoría',b.category,v=>updateBudget(i,'category',v),{max:100})}
      <label>Cantidad<input type="number" min="0" max="100000" step="0.01" value={b.quantity} onChange={e=>updateBudget(i,'quantity',Number(e.target.value))}/></label>
      <label>Costo unitario (USD)<input type="number" min="0" max="10000000" step="0.01" value={b.unitCost} onChange={e=>updateBudget(i,'unitCost',Number(e.target.value))}/></label>
     </div>{area('Notas / proveedor',b.notes,v=>updateBudget(i,'notes',v),300)}
     <p><strong>Subtotal: {(b.quantity*b.unitCost).toLocaleString('en-US',{style:'currency',currency:'USD'})}</strong></p>
     <label><input type="checkbox" checked={b.paid} onChange={e=>updateBudget(i,'paid',e.target.checked)}/> Pagado</label>
     {remove(()=>setBudget(budgetRows.filter((_,j)=>j!==i)))}
    </article>)}
    {buttonAdd('Partida de presupuesto',()=>setBudget([...budgetRows,emptyBudget()]),budgetRows.length>=60)}
   </>}
   {tool==='review'&&<>
    {reviews.map((r,i)=><article key={i} className="panel" style={{padding:15,marginBottom:12}}>
     <div style={miniGrid}>
      {input('Archivo / versión',r.source,v=>updateReview(i,'source',v),{max:160})}
      {input('Timecode HH:MM:SS:FF',r.timecode,v=>updateReview(i,'timecode',v),{max:30})}
      <Choice label="Estado" value={r.status||'Pendiente'} options={['Pendiente','En corrección','Resuelto','Aprobado']} change={v=>updateReview(i,'status',v)}/>
     </div>
     {area('Nota para el editor',r.note,v=>updateReview(i,'note',v),600)}
     {remove(()=>setReviews(reviews.filter((_,j)=>j!==i)))}
    </article>)}
    {buttonAdd('Comentario con timecode',()=>setReviews([...reviews,emptyReview()]),reviews.length>=60)}
   </>}
   {area('Notas generales y decisiones de producción',body,setBody,20000)}
   <input type="hidden" name="body" value={body}/>
   <label><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)} name="visible" value="yes"/> Compartir con el cliente</label>
   <label><input type="checkbox" checked={approval} onChange={e=>setApproval(e.target.checked)} name="approval" value="yes"/> Solicitar aprobación del cliente para esta versión</label>
   <p className="small muted">Guardado versionado. Si otra persona modifica esta sección primero, se te avisará para evitar sobreescribir su trabajo. No se guarda automáticamente: pulsa el botón para confirmar los cambios.</p>
   <button type="submit" className="btn" disabled={!canEdit||!title.trim()||JSON.stringify({...data,tool}).length>13500}>{block?'Guardar nueva versión':'Crear y guardar sección'}</button>
   {JSON.stringify({...data,tool}).length>13500&&<p role="alert" className="note">La ficha es demasiado grande; divídela en varias secciones para guardarla.</p>}
  </WorkspaceForm>
  </fieldset>
  {tool==='storyboard'&&canEdit&&<div style={{marginTop:16}}>
   <details><summary className="book-summary">+ Subir imagen para el storyboard</summary>
    <BookUpload projectId={projectId} placement="reference" titleDefault="Frame · storyboard" descriptionDefault="Imagen de referencia para el storyboard" returnTo="studio"/>
   </details>
   <p className="small muted">Después de subir la imagen, vuelve a este módulo y selecciónala en el frame correspondiente.</p>
  </div>}
  {tool==='review'&&<p className="small muted">Puedes adjuntar cortes en Archivos del proyecto y añadir sus comentarios aquí. Este módulo registra timecodes y aprobaciones, pero todavía no dibuja comentarios sobre el reproductor de video.</p>}
 </div>;
}
