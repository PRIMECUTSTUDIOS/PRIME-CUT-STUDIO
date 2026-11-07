'use client';
import {useEffect,useState} from 'react';
import type {BookBlock} from '@/lib/project-book-db';
import styles from './ProductionVisuals.module.css';

/** Accept Drive file links only. Files keep their original Google access permissions. */
export function drivePhotoId(url:string):string|null{
 const match=/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{15,})\/(?:view|preview)(?:[?#].*)?$/.exec(url);
 return match?.[1]||null;
}

/** A real thumbnail, never an embedded Drive player with zoom and toolbar controls. */
export function DrivePhotoReference({url,title,height=180,variant='standard'}:{
 url:string;title:string;height?:number;variant?:'standard'|'cover'
}){
 const id=drivePhotoId(url);
 // First-party photo assets are served by Prime Cut Studios; do not depend on Drive cookies.
 const hosted=/^https:\/\/(?:www\.)?primecutstudiostx\.com\/production\/lo-hicimos\/[a-z0-9-]+\.jpg$/.test(url);
 const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>setUnavailable(false),[url]);
 const imageSrc=hosted?url:id?'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1200':null;
 const photo=imageSrc&&!unavailable
  ?<img src={imageSrc}
    alt={title} loading="lazy" decoding="async" referrerPolicy={hosted?'strict-origin-when-cross-origin':'no-referrer'}
    onError={()=>setUnavailable(true)}/>
  :<div className={styles.photoFallback} role="img" aria-label={title}>Vista previa no disponible. Abre la fotografía original.</div>;
 if(variant==='cover')return <a href={url} target="_blank" rel="noopener noreferrer"
  className={styles.photoFrame} aria-label={'Abrir foto original: '+title} style={{display:'block',height:'100%'}}>
   {photo}
  </a>;
 return <div className={styles.photoPreview} style={{height:height+32}}>
  <div className={styles.photoFrame} style={{height,flex:'0 0 auto'}}>{photo}</div>
  <a className={styles.photoOpen} href={url} target="_blank" rel="noopener noreferrer">Ver foto original · {title}</a>
 </div>;
}

export function ProductionPhotoGallery({blocks}:{blocks:BookBlock[]}){
 const entries=blocks.filter(b=>b.kind==='reference'&&b.title.startsWith('Fotos scouting Airbnb Juncos'))
  .flatMap(b=>b.metadata?.links||[])
  .filter((item,i,all)=>all.findIndex(other=>other.url===item.url)===i);
 if(!entries.length)return null;
 return <section className={styles.gallerySection} aria-label="Fotografías de scouting de la locación">
  <details>
   <summary>Galería de locación <span style={{color:'#b4a38a',fontSize:13,fontWeight:500}}>{entries.length} fotos · Juncos</span></summary>
   <p className={styles.galleryIntro}>Referencias de la propiedad para producción. Las fotos conservan sus permisos de Google Drive; si una vista previa no carga, puedes abrir el archivo original.</p>
   <div className={styles.galleryGrid}>
    {entries.map(item=><article key={item.url} className={styles.galleryCard}>
     <DrivePhotoReference url={item.url} title={item.label} height={190}/>
    </article>)}
   </div>
  </details>
 </section>;
}
