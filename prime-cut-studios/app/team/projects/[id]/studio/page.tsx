import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import {redirect,notFound} from 'next/navigation';
import {adminAuthenticated} from '@/lib/auth';
import {getProject} from '@/lib/db';
import {requireCapability} from '@/lib/operations-db';
import {bookBlocks,bookResponses} from '@/lib/project-book-db';
import {projectBookEnabled} from '@/lib/project-book-policy';
import {uuid} from '@/lib/workspace-policy';
import {ProductionStudio} from '@/components/workspace/ProductionStudio';
import type {ToolKind} from '@/lib/project-book-policy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata={title:'Editor de producción | Prime Cut Studios',robots:{index:false,follow:false}};
export default async function Studio({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{saved?:string;uploaded?:string}>}){
 const {id}=await params;
 if(!uuid(id)||!projectBookEnabled())notFound();
 const staff=await requireCapability('projects.read',id);
 if(!staff)redirect('/client/login');
 const project=await getProject(id);if(!project)notFound();
 const canEdit=!!await requireCapability('projects.write',id);
 const [blocks,flash]=await Promise.all([bookBlocks(id,false),searchParams]);
 const notes=await bookResponses(id,blocks.map(b=>b.id));
 const toolKinds:ToolKind[]=['storyboard','shots','schedule','call_sheet','crew','budget','review'];
 const newToolIds=Object.fromEntries(toolKinds.map(k=>[k,randomUUID()])) as Record<ToolKind,string>;
 return <main className="shell" style={{maxWidth:1440,paddingTop:26,paddingBottom:70}}>
  <p style={{marginBottom:15}}><Link className="inline-link" href={'/team/projects/'+id+'?tab=production'}>← Vista general del proyecto</Link></p>
  <ProductionStudio projectId={id} title={project.title} status={project.status} canEdit={canEdit} canInvite={await adminAuthenticated()} initialBlocks={blocks} initialResponses={notes} flash={!!flash.saved||!!flash.uploaded} newBlockId={randomUUID()} newToolIds={newToolIds}/>
 </main>;
}
