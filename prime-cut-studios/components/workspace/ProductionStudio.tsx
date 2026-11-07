'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import type {BookBlock,BookResponse} from '@/lib/project-book-db';
import {BookEditor} from '@/components/workspace/BookEditor';
import {BookUpload} from '@/components/workspace/BookUpload';
import {WorkspaceForm} from '@/components/workspace/WorkspaceForm';

type Group='shots'|'storyboard'|'wardrobe'|'palette'|'locations'|'cast'|'schedule'|'notes'|'files';
const menu:{key:Group;label:string;desc:string}[]=[
 {key:'shots',label:'Shotlist · escenas',desc:'Edita cada toma con su tiempo, lente, movimiento y continuidad.'},
 {key:'storyboard',label:'Storyboard',desc:'Edita la narrativa visual y sube los frames para cada escena.'},
 {key:'wardrobe',label:'Vestuario y arte',desc:'Looks, utilería, accesorios y decisiones de arte.'},
 {key:'palette',label:'Paleta de colores',desc:'Actualiza los colores y su uso en la fotografía.'},
 {key:'locations',label:'Locaciones',desc:'Fotos de la casa, permisos, accesos y notas del scouting.'},
 {key:'cast',label:'Talento y crew',desc:'Actores, extras, vestuario y equipo de producción.'},
 {key:'schedule',label:'Plan de rodaje',desc:'Horarios, llamados, logística y entregables.'},
 {key:'notes',label:'Notas y aprobaciones',desc:'Cambios, decisiones del equipo y estado de aprobación.'},
 {key:'files',label:'Archivos y referencias',desc:'Sube fotos, bocetos, documentos y referencias desde aquí.'}
];
const classify=(b:BookBlock):Group=>{
 if(b.kind==='shot_list')return 'shots';
 if(b.kind==='palette')return 'palette';
 if(b.kind==='location')return 'locations';
 if(b.kind==='cast')return 'cast';
 if(b.kind==='schedule'||b.kind==='deliverables')return 'schedule';
 if(b.kind==='document'||b.kind==='reference')return 'files';
 const title=b.title.toLowerCase();
 if(title.includes('storyboard'))return 'storyboard';
 if(title.includes('vestuario')||title.includes('utilería'))return 'wardrobe';
 if(title.includes('notas')||title.includes('aprobacion'))return 'notes';
 return 'storyboard';
};
function sceneTime(b:BookBlock){const match=b.body.match(/\b\d{2}:\d{2}[–-]\d{2}:\d{2}\b/);return match?match[0]:'';}
export function ProductionStudio({projectId,title,status,canEdit,canInvite,initialBlocks,initialResponses,flash}:{projectId:string,title:string,status:string,canEdit:boolean,canInvite:boolean,initialBlocks:BookBlock[],initialResponses:BookResponse[],flash:boolean}){
 const [tab,setTab]=useState<Group>('shots');
 const [selected,setSelected]=useState(initialBlocks.find(b=>b.kind==='shot_list')?.id||initialBlocks[0]?.id||'');
 const [adding,setAdding]=useState(false);
 const [showInvite,setShowInvite]=useState(false);
 const [uploadOpen,setUploadOpen]=useState(false);
 const groups=useMemo(()=>menu.map(m=>({...m,blocks:initialBlocks.filter(b=>classify(b)===m.key)})),[initialBlocks]);
 const activeGroup=groups.find(x=>x.key===tab)!;
 const block=initialBlocks.find(b=>b.id===selected&&classify(b)===tab)||activeGroup.blocks[0]||null;
 const matchingImages=initialBlocks.filter(b=>b.storage_path&&b.file_mime?.startsWith('image/')&&(tab==='files'||(block&&b.title.includes(block.title))));
 const allImages=initialBlocks.filter(b=>b.storage_path&&b.file_mime?.startsWith('image/'));
 const notes=initialResponses.filter(r=>r.block_id===block?.id);
 const pick=(key:Group)=>{setTab(key);setSelected(groups.find(g=>g.key===key)?.blocks[0]?.id||'');setAdding(false);setUploadOpen(false);};
 return <>
 <header className="panel" style={{padding:'25px 28px',borderColor:'#a47938',background:'linear-gradient(115deg,#24201a,#14191e)'}}>
  <p className="eyebrow" style={{color:'#eac07d'}}>PRIME CUT STUDIOS · SALA DE PREPRODUCCIÓN ONLINE</p>
  <h1 style={{margin:'8px 0',fontSize:'clamp(26px,4vw,43px)'}}>{title}</h1>
  <p className="muted" style={{marginBottom:15}}>Good Demon · {status==='planning'?'Grabación aprobada · planificación activa':status} · Los cambios se guardan en el proyecto y los ve el equipo autorizado.</p>
  <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
   {canInvite&&<button type="button" className="btn" onClick={()=>setShowInvite(v=>!v)}>{showInvite?'Cerrar invitaciones':'+ Invitar personas a editar'}</button>}
   <Link className="btn secondary" href={'/team/projects/'+projectId+'?tab=details'}>Timeline y tareas</Link>
   <Link className="btn secondary" href={'/team/projects/'+projectId+'?tab=client&section=home'}>Vista de revisión del cliente</Link>
  </div>
  {flash&&<p className="note" role="status" style={{marginTop:15}}>El servidor recibió el cambio. Abre la sección para revisar la versión guardada.</p>}
  {!canEdit&&<p className="note">Tu usuario tiene permiso de lectura. Un administrador debe asignarte el rol Editor o Producer para poder modificar este proyecto.</p>}
 </header>
 {showInvite&&canInvite&&<div className="panel" style={{margin:'14px 0',padding:20}}>
 <h2>Dar acceso a otro colaborador</h2><p className="muted">Cada persona tendrá su propia cuenta y acceso limitado a este proyecto. No se comparte tu contraseña de administrador.</p>
 <form method="post" action="/api/team/staff/invite" className="form" style={{maxWidth:700}}>
  <input type="hidden" name="projectId" value={projectId}/>
  <label>Correo de la persona<input name="email" type="email" required maxLength={254} placeholder="colaborador@correo.com"/></label>
  <label>Permiso<select name="role" defaultValue="editor"><option value="editor">Editor — escenas, notas, colores, vestuario y archivos</option><option value="producer">Productor — además administración de producción</option><option value="crew">Crew — consulta de escenas y documentos</option></select></label>
  <button className="btn" type="submit">Generar invitación privada</button>
 </form>
 <p className="small muted">La invitación se genera en esta web. Después podrás copiar el enlace desde la sección Staff.</p></div>}
 <div className="cards4" style={{margin:'22px 0'}}>
  <div className="dashmetric"><span>Escenas del shotlist</span><b>{groups.find(g=>g.key==='shots')?.blocks.length||0}</b></div>
  <div className="dashmetric"><span>Secciones editables</span><b>{initialBlocks.length}</b></div>
  <div className="dashmetric"><span>Imágenes en proyecto</span><b>{allImages.length}</b></div>
  <div className="dashmetric"><span>Notas registradas</span><b>{initialResponses.filter(x=>x.kind==='comment').length}</b></div>
 </div>
 <nav aria-label="Herramientas de preproducción" style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:16}}>
  {groups.map(g=><button key={g.key} type="button" onClick={()=>pick(g.key)} aria-pressed={tab===g.key} className={'btn '+(tab===g.key?'':'secondary')} style={{fontSize:13,padding:'10px 13px'}}>{g.label} ({g.blocks.length})</button>)}
 </nav>
 <p className="muted">{activeGroup.desc}</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,270px),1fr))',gap:16,alignItems:'start'}}>
 <aside className="panel" style={{minWidth:0,padding:14,maxHeight:630,overflowY:'auto'}}>
  <h2 style={{fontSize:18,margin:'8px 0 16px'}}>Selecciona qué editar</h2>
  {activeGroup.blocks.map(b=><button type="button" key={b.id} onClick={()=>{setSelected(b.id);setAdding(false);setUploadOpen(false);}} style={{display:'block',width:'100%',background:block?.id===b.id?'#59401f':'transparent',border:block?.id===b.id?'1px solid #c3944b':'1px solid #40392f',borderRadius:9,padding:'12px 11px',marginBottom:8,textAlign:'left',color:'#f4ecdf',cursor:'pointer'}}>
   <strong style={{display:'block',fontSize:14}}>{b.title}</strong><span style={{fontSize:12,color:'#e7c28a'}}>{sceneTime(b)} · Versión {b.revision}</span>
  </button>)}
  {!activeGroup.blocks.length&&<p className="muted">No hay fichas todavía en esta sección.</p>}
  {canEdit&&<button type="button" className="btn secondary btn-small" onClick={()=>setAdding(v=>!v)}>+ Añadir nueva sección</button>}
 </aside>
 <section className="panel" style={{minWidth:0,padding:'22px',gridColumn:'span 2'}}>
  {adding&&canEdit?<><h2>Nueva ficha de producción</h2><BookEditor projectId={projectId} blockId={randomUUID()} returnTo="studio"/></>:block?<div>
   <div className="project-head"><div><div className="eyebrow">EDITAR EN LA WEB · {tab.toUpperCase()}</div><h2 style={{margin:'5px 0 10px'}}>{block.title}</h2></div><span className="pill">Versión {block.revision}</span></div>
   {canEdit?<BookEditor key={block.id+':'+block.revision} projectId={projectId} blockId={block.id} block={block} returnTo="studio"/>:<div className="book-content">{block.body}</div>}
   <hr style={{margin:'25px 0',border:'none',borderTop:'1px solid #4a4339'}}/>
   <h3>Fotografías y referencias</h3>
   <p className="small muted">Adjunta una imagen directamente desde la web. Quedará guardada en el proyecto con el nombre de esta escena.</p>
   {!!matchingImages.length&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12,margin:'14px 0'}}>
   {matchingImages.map(image=><a key={image.id} target="_blank" rel="noopener noreferrer" href={'/api/project-documents/'+image.id} style={{display:'block',background:'#211f1e',padding:8,borderRadius:9}}>
    <img src={'/api/project-documents/'+image.id} alt={image.title} style={{width:'100%',height:132,objectFit:'cover',borderRadius:7}} loading="lazy"/>
    <span style={{color:'#efc788',fontSize:12,display:'block',overflowWrap:'anywhere'}}>{image.title}</span></a>)}
   </div>}
   {canEdit&&<><button type="button" className="btn secondary btn-small" onClick={()=>setUploadOpen(v=>!v)}>{uploadOpen?'Cerrar':'Subir foto o documento aquí'}</button>
   {uploadOpen&&<div style={{marginTop:12}}><BookUpload projectId={projectId} placement="reference" titleDefault={'Referencia · '+block.title} descriptionDefault={'Vinculado a '+block.title} sharedByDefault returnTo="studio"/></div>}</>}
   <hr style={{margin:'24px 0',border:'none',borderTop:'1px solid #4a4339'}}/>
   <h3>Notas del equipo y cambios</h3>
   {!notes.length&&<p className="muted">No hay notas todavía. Cada comentario queda asociado a esta escena y su versión.</p>}
   {notes.map(note=><article key={note.id} style={{borderLeft:'3px solid #a7834b',margin:'12px 0',padding:'6px 12px'}}>
    <small className="muted">{note.author||'Colaborador'} · versión {note.revision} · {new Date(note.created_at).toLocaleDateString('es-US',{timeZone:'America/Chicago'})}</small>
    <p style={{whiteSpace:'pre-wrap',margin:'6px 0'}}>{note.body}</p>
   </article>)}
   {canEdit&&<WorkspaceForm method="post" action="/api/team/project-book" className="form">
    <input type="hidden" name="projectId" value={projectId}/><input type="hidden" name="blockId" value={block.id}/>
    <input type="hidden" name="action" value="comment"/><input type="hidden" name="returnTo" value="studio"/>
    <label>Agregar nota o sugerencia<textarea name="body" required maxLength={3000} rows={3} placeholder="Propuesta de cambio, vestuario, movimiento, comentario del director..."/></label>
    <button type="submit" className="btn secondary">Guardar nota en esta escena</button>
   </WorkspaceForm>}
  </div>:<p>Selecciona una ficha para comenzar.</p>}
 </section></div>
 <section className="panel" style={{marginTop:18}}>
  <h3>Archivos generales y referencias del proyecto</h3><p className="muted">Todas las imágenes y documentos adjuntos están en la web. Puedes añadir tantas referencias como necesite la producción, una por archivo.</p>
  {allImages.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>
   {allImages.map(img=><a key={img.id} href={'/api/project-documents/'+img.id} target="_blank" rel="noopener noreferrer" style={{color:'#dfb57e'}}>
    <img loading="lazy" src={'/api/project-documents/'+img.id} alt={img.title} style={{width:'100%',height:135,objectFit:'cover',borderRadius:8}}/>
    <small>{img.title}</small></a>)}</div>}
  {canEdit&&<details style={{marginTop:18}}><summary style={{cursor:'pointer',fontWeight:700}}>+ Subir archivo general</summary><BookUpload projectId={projectId} returnTo="studio" sharedByDefault/></details>}
 </section>
 </>;
}
