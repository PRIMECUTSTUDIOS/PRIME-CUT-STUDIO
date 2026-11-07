'use client';

export function AdminCleanupAction({
 id,target,action,label,name
}:{
 id:string;target:'inquiry'|'project';action:'spam'|'not-spam'|'trash'|'restore'|'archive'|'delete-forever';label:string;name:string
}){
 const destructive=action==='trash'||action==='delete-forever';
 const phrase='YES';
 const confirmAction=(event:React.FormEvent<HTMLFormElement>)=>{
  if(action==='delete-forever'){
   const answer=window.prompt('BORRADO DEFINITIVO de la solicitud de '+name+'. No se podrá recuperar. Escribe DELETE para confirmar:');
   if(answer!=='DELETE')event.preventDefault();
  }else if(action==='trash'){
   const answer=window.confirm('¿Mover a la papelera: '+name+'? Se ocultará del panel activo y podrás restaurarlo.');
   if(!answer)event.preventDefault();
  }
 };
 const buttonClass=destructive?'btn secondary btn-small':'btn secondary btn-small';
 return <form method="post" action="/api/admin/cleanup" onSubmit={confirmAction} style={{display:'inline-block',margin:'3px 5px 3px 0'}}>
  <input type="hidden" name="target" value={target}/>
  <input type="hidden" name="action" value={action}/>
  <input type="hidden" name="id" value={id}/>
  <input type="hidden" name="confirm" value={phrase}/>
  <button type="submit" className={buttonClass} style={destructive?{borderColor:'#aa6655',color:'#f1b2a8'}:{}}>{label}</button>
 </form>;
}
