import type {BookBlock} from '@/lib/project-book-db';
/** Drive photos remain access controlled by their file owner; no public sharing is implied. */
export function drivePhotoId(url:string):string|null{
 const match=/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{15,})\/(?:view|preview)(?:[?#].*)?$/.exec(url);
 return match?.[1]||null;
}
export function DrivePhotoReference({url,title,height=180}:{url:string;title:string;height?:number}){
 const id=drivePhotoId(url);
 if(!id)return <a href={url} target="_blank" rel="noopener noreferrer">{title}</a>;
 return <div style={{display:'grid',gap:7,minWidth:0}}>
  <iframe title={title} src={'https://drive.google.com/file/d/'+id+'/preview'} loading="lazy" referrerPolicy="no-referrer"
    style={{width:'100%',height,border:'1px solid #4a4239',borderRadius:8,background:'#16191a'}}/>
  <a className="small inline-link" href={url} target="_blank" rel="noopener noreferrer">Abrir foto original · {title}</a>
 </div>;
}
export function ProductionPhotoGallery({blocks}:{blocks:BookBlock[]}){
 const entries=blocks.filter(b=>b.kind==='reference'&&b.title.startsWith('Fotos scouting Airbnb Juncos')).flatMap(b=>b.metadata?.links||[])
 .filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
 if(!entries.length)return null;
 return <section className="panel" style={{padding:20,margin:'18px 0'}} aria-label="Fotografías de scouting de la locación">
  <div className="eyebrow">SCOUTING VISUAL · LO HICIMOS</div>
  <h2>Fotografías de locación ({entries.length})</h2>
  <p className="muted">Imágenes compartidas por producción. Se muestran aquí como vistas previas privadas de Google Drive. Cada persona necesita acceso al archivo original si Google lo solicita.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,240px),1fr))',gap:13}}>
   {entries.map(item=><article key={item.url} style={{padding:10,border:'1px solid #4d4335',borderRadius:10,minWidth:0}}>
    <DrivePhotoReference url={item.url} title={item.label} height={190}/>
   </article>)}
  </div>
 </section>;
}
