import {boundedForm} from '@/lib/form-request';
import {NextResponse} from 'next/server';
import {createSession,isAdminConfigured,safeIp,setAdminSession,verifyPassword,sameOriginRedirect} from '@/lib/auth';
import {adminLoginThrottled,identifyIp,recordAdminAttempt} from '@/lib/db';
export const runtime='nodejs';
export async function POST(request:Request){
  // Admin login is password-verified and IP-throttled. Do not reject a correct
  // password just because iOS/Safari or a Vercel edge omits/mangles Origin.
  // A cross-site page cannot read the resulting httpOnly SameSite=Strict session.
  const fetchSite=request.headers.get('sec-fetch-site');
  if(fetchSite==='cross-site')return new Response('Cross-site sign-in blocked',{status:403});
  if(Number(request.headers.get('content-length')||0)>4096)return new Response('Too large',{status:413});
  if(!isAdminConfigured())return NextResponse.redirect(sameOriginRedirect(request,'/admin/login?error=setup'),303);
  const ip=identifyIp(safeIp(request));
  if(await adminLoginThrottled(ip))return NextResponse.redirect(sameOriginRedirect(request,'/admin/login?error=limit'),303);
  const form=await boundedForm(request);if(form instanceof Response)return form;
  const email=String(form.get('email')||'').trim().toLowerCase();
  const password=String(form.get('password')||'');
  if(email!==process.env.ADMIN_EMAIL!.trim().toLowerCase() || !verifyPassword(password)){
    await recordAdminAttempt(ip);return NextResponse.redirect(sameOriginRedirect(request,'/admin/login?error=invalid'),303);
  }
  await setAdminSession(createSession());
  return NextResponse.redirect(sameOriginRedirect(request,'/admin'),303);
}
