import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contigo el tiempo vuela | Prueba 2 — Vista previa privada',
  description: 'Vista previa de revisión para Tony Rivé, presentada por Prime Cut Studios.',
  robots: { index: false, follow: false, nocache: true },
};

const driveId = '1uSUJ2RPBJlOWk_11_LpN10SKfGRZr61P';
const viewUrl = 'https://drive.google.com/file/d/' + driveId + '/view';

export default function TonyPreviewPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f8f6f2', fontFamily: 'Arial, sans-serif' }}>
      <div style={{maxWidth: 1080, margin:'0 auto', padding:'32px 20px 70px'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',borderBottom:'1px solid #343137',paddingBottom:24}}>
          <Link href="/" style={{textDecoration:'none',color:'#e2b774',fontSize:18,fontWeight:800,letterSpacing:2}}>PRIME CUT STUDIOS</Link>
          <span style={{fontSize:12,letterSpacing:2,color:'#bdb5aa',textTransform:'uppercase'}}>Private client screening</span>
        </header>
        <section style={{textAlign:'center',padding:'52px 0 28px'}}>
          <p style={{textTransform:'uppercase',color:'#d6ae73',letterSpacing:3,fontSize:12,marginBottom:12}}>Music video · Revision 02</p>
          <h1 style={{fontSize:'clamp(30px, 5vw, 54px)',fontWeight:700,margin:'0 0 12px'}}>Contigo el tiempo vuela</h1>
          <p style={{color:'#e3c798',fontSize:20,margin:'0 0 16px'}}>TONY RIVÉ</p>
          <p style={{color:'#aba6a0',fontSize:14}}>Prueba 2 — Copia de revisión. No es la versión final.</p>
        </section>
        <div style={{width:'100%',aspectRatio:'16 / 9',background:'#050505',border:'1px solid #383335',borderRadius:12,overflow:'hidden'}}>
          <iframe title="Contigo el tiempo vuela — Prueba 2" src={`https://drive.google.com/file/d/${driveId}/preview`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{border:0,width:'100%',height:'100%'}} />
        </div>
        <div style={{textAlign:'center',paddingTop:24}}>
          <a href={viewUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',background:'#d5aa6e',color:'#0a0a0c',padding:'13px 24px',borderRadius:6,fontWeight:700,textDecoration:'none'}}>Abrir video en Google Drive</a>
          <p style={{fontSize:13,color:'#9d9791',lineHeight:1.7,marginTop:20}}>Si el reproductor no carga, abre el video con el botón. La reproducción depende de los permisos de acceso del archivo en Google Drive.</p>
        </div>
        <footer style={{marginTop:60,borderTop:'1px solid #343137',paddingTop:24,textAlign:'center',color:'#9d9791',fontSize:12}}>© Prime Cut Studios · Killeen, Texas · Vista previa para revisión del cliente</footer>
      </div>
    </main>
  );
}
