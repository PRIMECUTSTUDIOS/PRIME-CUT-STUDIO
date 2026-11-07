import 'server-only';
import {serverHeaders} from '@/lib/db';
import {restResponse} from '@/lib/rest-response';

const base=()=>process.env.SUPABASE_URL||'';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CleanupInquiry={
 id:string;name:string;email:string;service:string;status:string;details:string|null;
 created_at:string;is_spam:boolean;spam_marked_at:string|null;deleted_at:string|null;
};
export type CleanupProject={
 id:string;title:string;client_name:string;client_email:string;status:string;
 event_date:string|null;updated_at:string;deleted_at:string|null;
};

async function request<T>(relative:string,init:RequestInit={}):Promise<T>{
 const response=await fetch(base()+'/rest/v1/'+relative,{
  ...init,cache:'no-store',headers:serverHeaders({'Content-Type':'application/json',...(init.headers as Record<string,string>||{})})
 });
 if(!response.ok)throw new Error('Cleanup database operation failed: '+response.status);
 return response.status===204?([] as T):restResponse<T>(response);
}
const path=(table:string,filter:Record<string,string>)=>table+'?'+new URLSearchParams(filter);

export async function cleanupItems(){
 const [inquiries,projects]=await Promise.all([
  request<CleanupInquiry[]>(path('pc_inquiries',{select:'id,name,email,service,status,details,created_at,is_spam,spam_marked_at,deleted_at',order:'created_at.desc',limit:'500'})),
  request<CleanupProject[]>(path('pc_projects',{select:'id,title,client_name,client_email,status,event_date,updated_at,deleted_at',order:'updated_at.desc',limit:'500'})),
 ]);
 return {inquiries,projects};
}
async function getInquiry(id:string){
 return (await request<CleanupInquiry[]>(path('pc_inquiries',{id:'eq.'+id,select:'id,name,email,service,status,details,created_at,is_spam,spam_marked_at,deleted_at',limit:'1'})))[0]||null;
}
async function getProject(id:string){
 return (await request<CleanupProject[]>(path('pc_projects',{id:'eq.'+id,select:'id,title,client_name,client_email,status,event_date,updated_at,deleted_at',limit:'1'})))[0]||null;
}
async function linkedProjects(inquiryId:string){
 return request<{id:string}[]>(path('pc_projects',{inquiry_id:'eq.'+inquiryId,select:'id',limit:'1'}));
}
async function patch(table:'pc_inquiries'|'pc_projects',id:string,values:Record<string,unknown>){
 const rows=await request<{id:string}[]>(path(table,{id:'eq.'+id,select:'id'}),{
  method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(values)
 });
 return rows.length===1;
}

export type CleanupTarget='inquiry'|'project';
export type CleanupAction='spam'|'not-spam'|'trash'|'restore'|'archive'|'delete-forever';
export async function changeCleanupRecord(target:CleanupTarget,action:CleanupAction,id:string):Promise<{ok:boolean;message:string}>{
 if(!uuid.test(id))return {ok:false,message:'Invalid record ID'};
 if(target==='inquiry'){
  const inquiry=await getInquiry(id);
  if(!inquiry)return {ok:false,message:'Request not found'};
  if(['spam','not-spam','trash','delete-forever'].includes(action)){
   const linked=await linkedProjects(id);
   if(linked.length)return {ok:false,message:'This request belongs to a project. Manage the linked project first.'};
  }
  if(action==='spam'){
   if(inquiry.deleted_at)return {ok:false,message:'Restore this request before changing its spam status'};
   if(inquiry.status!=='new')return {ok:false,message:'Only unconverted requests can be marked as spam'};
   return {ok:await patch('pc_inquiries',id,{is_spam:true,spam_marked_at:new Date().toISOString()}),message:'Request marked as spam'};
  }
  if(action==='not-spam'){
   if(inquiry.deleted_at)return {ok:false,message:'Restore this request first'};
   return {ok:await patch('pc_inquiries',id,{is_spam:false,spam_marked_at:null}),message:'Request restored to inbox'};
  }
  if(action==='trash'){
   if(inquiry.deleted_at)return {ok:false,message:'Request is already in trash'};
   return {ok:await patch('pc_inquiries',id,{deleted_at:new Date().toISOString()}),message:'Request moved to trash'};
  }
  if(action==='restore'){
   if(!inquiry.deleted_at)return {ok:false,message:'Request is not in trash'};
   return {ok:await patch('pc_inquiries',id,{deleted_at:null}),message:'Request restored'};
  }
  if(action==='delete-forever'){
   if(!inquiry.deleted_at)return {ok:false,message:'Move the request to trash before permanent deletion'};
   const rows=await request<{id:string}[]>(path('pc_inquiries',{id:'eq.'+id,deleted_at:'not.is.null',select:'id'}),{method:'DELETE',headers:{Prefer:'return=representation'}});
   return {ok:rows.length===1,message:'Request permanently deleted'};
  }
  return {ok:false,message:'Unsupported request action'};
 }
 const project=await getProject(id);
 if(!project)return {ok:false,message:'Project not found'};
 if(action==='archive'){
  if(project.deleted_at)return {ok:false,message:'Restore the project before archiving it'};
  return {ok:await patch('pc_projects',id,{status:'archived',updated_at:new Date().toISOString()}),message:'Project archived'};
 }
 if(action==='trash'){
  if(project.deleted_at)return {ok:false,message:'Project already in trash'};
  return {ok:await patch('pc_projects',id,{deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}),message:'Project moved to trash; related production data was preserved'};
 }
 if(action==='restore'){
  if(!project.deleted_at)return {ok:false,message:'Project is not in trash'};
  return {ok:await patch('pc_projects',id,{deleted_at:null,updated_at:new Date().toISOString()}),message:'Project restored'};
 }
 return {ok:false,message:'Permanent project deletion is disabled to protect contracts, media, and dependent records'};
}
