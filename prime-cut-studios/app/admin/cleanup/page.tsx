import Link from 'next/link';
import {redirect} from 'next/navigation';
import {adminAuthenticated} from '@/lib/auth';
import {cleanupItems,type CleanupInquiry,type CleanupProject} from '@/lib/admin-cleanup-db';
import {AdminCleanupAction} from '@/components/AdminCleanupAction';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata={title:'Spam, papelera y proyectos | Prime Cut Studios',robots:{index:false,follow:false}};

function date(value:string){return new Intl.DateTimeFormat('es-US',{timeZone:'America/Chicago',year:'numeric',month:'short',day:'numeric'}).format(new Date(value));}
function InquiryCard({item,area}:{item:CleanupInquiry;area:'inbox'|'spam'|'trash'}){
 return <article className="panel" style={{marginBottom:12}}>
  <div className="project-head"><div><div className="eyebrow">{date(item.created_at)} · {item.service}</div><h3 style={{margin:'8px 0'}}>{item.name}</h3><p className="muted">{item.email}</p></div><span className="pill">{area==='spam'?'Spam':area==='trash'?'Papelera':item.status}</span></div>
  {item.details&&<details><summary>Ver mensaje</summary><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.details}</p></details>}
  <div style={{marginTop:12}}>
   {area==='inbox'&&<><AdminCleanupAction id={item.id} target="inquiry" action="spam" label="Marcar spam" name={item.name}/><AdminCleanupAction id={item.id} target="inquiry" action="trash" label="Mover a papelera" name={item.name}/></>}
   {area==='spam'&&<><AdminCleanupAction id={item.id} target="inquiry" action="not-spam" label="No es spam" name={item.name}/><AdminCleanupAction id={item.id} target="inquiry" action="trash" label="Enviar a papelera" name={item.name}/></>}
   {area==='trash'&&<><AdminCleanupAction id={item.id} target="inquiry" action="restore" label="Restaurar solicitud" name={item.name}/><AdminCleanupAction id={item.id} target="inquiry" action="delete-forever" label="Borrar definitivamente" name={item.name}/></>}
  </div>
 </article>;
}
function ProjectCard({item,trashed}:{item:CleanupProject;trashed:boolean}){
 return <article className="panel" style={{marginBottom:12}}>
  <div className="project-head"><div><div className="eyebrow">{date(item.updated_at)} · {item.client_name}</div><h3 style={{margin:'8px 0'}}>{item.title}</h3><p className="muted">{item.client_email}</p></div><span className="pill">{trashed?'Papelera':item.status}</span></div>
  <div style={{marginTop:12}}>
   {!trashed&&<><Link className="btn secondary btn-small" href={'/team/projects/'+item.id}>Abrir ficha</Link> <AdminCleanupAction id={item.id} target="project" action="archive" label="Archivar" name={item.title}/><AdminCleanupAction id={item.id} target="project" action="trash" label="Mover a papelera" name={item.title}/></>}
   {trashed&&<AdminCleanupAction id={item.id} target="project" action="restore" label="Restaurar proyecto" name={item.title}/>}
  </div>
 </article>;
}
export default async function Cleanup({searchParams}:{searchParams:Promise<{done?:string;error?:string}>}){
 if(!await adminAuthenticated())redirect('/admin/login');
 const {done,error}=await searchParams;
 const {inquiries,projects}=await cleanupItems();
 const inbox=inquiries.filter(i=>!i.deleted_at&&!i.is_spam);
 const spam=inquiries.filter(i=>!i.deleted_at&&i.is_spam);
 const requestTrash=inquiries.filter(i=>!!i.deleted_at);
 const activeProjects=projects.filter(p=>!p.deleted_at);
 const projectTrash=projects.filter(p=>!!p.deleted_at);
 return <main className="shell" style={{maxWidth:1100,paddingTop:40,paddingBottom:80}}>
 <Link href="/admin" className="inline-link">← Volver a administración</Link>
 <div className="eyebrow" style={{marginTop:20}}>Prime Cut Studios · Gestión privada</div>
 <h1>Solicitudes, spam y papelera</h1>
 <p className="muted">Marca solicitudes sospechosas como spam, archiva proyectos finalizados o mueve registros viejos a la papelera. Nada se borra definitivamente sin una segunda confirmación.</p>
 {done&&<div className="note" role="status">Operación guardada: {done.replaceAll('-',' ')}</div>}
 {error&&<div className="alert" role="alert">No se pudo completar la operación ({error}). Si una solicitud ya tiene proyecto, administra primero ese proyecto.</div>}
 <div className="cards4" style={{margin:'24px 0'}}><div className="dashmetric"><span>Solicitudes recibidas</span><b>{inbox.length}</b></div><div className="dashmetric"><span>Spam</span><b>{spam.length}</b></div><div className="dashmetric"><span>Solicitudes en papelera</span><b>{requestTrash.length}</b></div><div className="dashmetric"><span>Proyectos en papelera</span><b>{projectTrash.length}</b></div></div>
 <section className="admin-section" id="inbox"><h2>Solicitudes activas ({inbox.length})</h2>{inbox.map(i=><InquiryCard key={i.id} item={i} area="inbox"/>)}{!inbox.length&&<p className="muted">No hay solicitudes activas.</p>}</section>
 <section className="admin-section" id="spam"><h2>Solicitudes marcadas como spam ({spam.length})</h2>{spam.map(i=><InquiryCard key={i.id} item={i} area="spam"/>)}{!spam.length&&<p className="muted">No hay solicitudes marcadas como spam.</p>}</section>
 <section className="admin-section" id="projects"><h2>Proyectos activos y archivados ({activeProjects.length})</h2><p className="muted">Archivar conserva el expediente. Mover a papelera lo oculta del panel y desactiva su ficha mientras permanezca allí.</p>{activeProjects.map(p=><ProjectCard key={p.id} item={p} trashed={false}/>)}{!activeProjects.length&&<p className="muted">No hay proyectos.</p>}</section>
 <section className="admin-section" id="trash"><h2>Papelera</h2><p className="muted">Puedes restaurar proyectos y solicitudes. Solo se permite borrar definitivamente una solicitud que no esté vinculada a un proyecto y que ya esté en la papelera. Los proyectos no se borran de forma irreversible desde aquí para proteger archivos, contratos y trabajos.</p>
 <h3>Solicitudes ({requestTrash.length})</h3>{requestTrash.map(i=><InquiryCard key={i.id} item={i} area="trash"/>)}{!requestTrash.length&&<p className="muted">La papelera de solicitudes está vacía.</p>}
 <h3>Proyectos ({projectTrash.length})</h3>{projectTrash.map(p=><ProjectCard key={p.id} item={p} trashed/>)}{!projectTrash.length&&<p className="muted">La papelera de proyectos está vacía.</p>}
 </section></main>;
}
