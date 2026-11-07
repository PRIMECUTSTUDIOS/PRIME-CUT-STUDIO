import {NextResponse} from 'next/server';
import {adminAuthenticated,sameOriginRedirect} from '@/lib/auth';
import {boundedForm} from '@/lib/form-request';
import {changeCleanupRecord,type CleanupAction,type CleanupTarget} from '@/lib/admin-cleanup-db';
import {audit,operationsSession} from '@/lib/operations-db';
export const runtime='nodejs';

const targets=new Set<CleanupTarget>(['inquiry','project']);
const actions=new Set<CleanupAction>(['spam','not-spam','trash','restore','archive','delete-forever']);
export async function POST(request:Request){
 const fetchSite=request.headers.get('sec-fetch-site');
 if(fetchSite==='cross-site')return new Response('Cross-site request blocked',{status:403});
 if(!await adminAuthenticated())return new Response('Unauthorized',{status:401});
 const form=await boundedForm(request);if(form instanceof Response)return form;
 const type=String(form.get('target')||'') as CleanupTarget;
 const action=String(form.get('action')||'') as CleanupAction;
 const id=String(form.get('id')||'');
 const confirm=String(form.get('confirm')||'');
 if(!targets.has(type)||!actions.has(action)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return new Response('Invalid cleanup action',{status:400});
 if(['trash','delete-forever'].includes(action)&&confirm!=='YES')return new Response('Confirmation required',{status:400});
 if(action==='delete-forever'&&type!=='inquiry')return new Response('Permanent deletion of projects is not allowed',{status:400});
 let outcome:{ok:boolean;message:string};
 try{outcome=await changeCleanupRecord(type,action,id);}
 catch(error){
  console.error('Admin cleanup failed',error instanceof Error?error.message:'unknown');
  return NextResponse.redirect(sameOriginRedirect(request,'/admin/cleanup?error=database'),303);
 }
 if(outcome.ok){
  try{const actor=await operationsSession();await audit('admin.cleanup.'+action,type,id,actor,type==='project'?id:null,{action});}
  catch(error){console.error('Admin cleanup audit failed',error instanceof Error?error.message:'unknown');}
 }
 const key=outcome.ok?'done':'error';
 const code=outcome.ok?action:outcome.message.toLowerCase().includes('belongs to a project')?'linked':outcome.message.toLowerCase().includes('not found')?'missing':'invalid';
 return NextResponse.redirect(sameOriginRedirect(request,'/admin/cleanup?'+key+'='+code),303);
}
