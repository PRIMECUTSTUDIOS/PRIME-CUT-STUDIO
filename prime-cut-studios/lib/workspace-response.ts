import {NextResponse} from 'next/server';
import {sameOriginRedirect} from '@/lib/auth';

/** Confirm committed writes before the browser attempts to render another page. */
export function workspaceSaved(request:Request,path:string){
 if(!path.startsWith('/')||path.startsWith('//')||path.includes('\\'))throw new Error('INVALID_WORKSPACE_DESTINATION');
 return request.headers.get('accept')?.includes('application/json')
  ?NextResponse.json({ok:true,redirect:path})
  :NextResponse.redirect(sameOriginRedirect(request,path),303);
}
