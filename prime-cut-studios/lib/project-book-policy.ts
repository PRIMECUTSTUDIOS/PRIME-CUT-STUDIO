import {dateOnly,safeProfessionalUrl} from '@/lib/workspace-policy';
export const projectBookEnabled=()=>process.env.PRIMECUTS_PROJECT_BOOK_V2==='true';
export const bookKinds=['brief','location','cast','script','palette','shot_list','schedule','deliverables','document','reference','custom'] as const;
export type BookKind=(typeof bookKinds)[number];
export const bookLabels:Record<BookKind,string>={brief:'Resumen y concepto',location:'Locaciones',cast:'Actores y personajes',script:'Libreto',palette:'Paleta de colores',shot_list:'Plan de tomas',schedule:'Itinerario',deliverables:'Entregables',document:'Documento',reference:'Referencias / moodboard',custom:'Otros detalles'};
export type Shot={scene:string;framing:string;action:string;movement:string;notes:string;lens?:string;fps?:string;duration?:string;location?:string;status?:string;priority?:string};
export type StoryboardFrame={scene:string;shot:string;description:string;imageBlockId:string;duration:string;notes:string;imageUrl?:string};
export type ShootRow={scene:string;start:string;end:string;location:string;task:string;crew:string;status:string};
export type CrewRow={name:string;role:string;contact:string;callTime:string;notes:string};
export type BudgetRow={item:string;category:string;quantity:number;unitCost:number;paid:boolean;notes:string};
export type ReviewNote={source:string;timecode:string;note:string;status:string};
export type CallSheet={shootDate:string;crewCall:string;address:string;parking:string;emergency:string;weather:string;notes:string};
export type ToolKind='storyboard'|'shots'|'schedule'|'call_sheet'|'crew'|'budget'|'review';
export type BookMetadata={
 shots?:Shot[];colors:{name:string;hex:string}[];links:{label:string;url:string}[];
 clientTitle?:string;subtitle?:string;decisionType?:'location';shootDate?:string;datesConfirmed?:boolean;
 tool?:ToolKind;frames?:StoryboardFrame[];shootRows?:ShootRow[];crewRows?:CrewRow[];
 budgetRows?:BudgetRow[];reviewNotes?:ReviewNote[];callSheet?:CallSheet
};
const tools:ToolKind[]=['storyboard','shots','schedule','call_sheet','crew','budget','review'];
const stringField=(v:unknown,n:number)=>typeof v==='string'&&v.length<=n;
const optional=(v:unknown,n:number)=>v===undefined||stringField(v,n);
const rowsValid=(rows:unknown,limit:number,spec:Record<string,number>)=>rows===undefined||(Array.isArray(rows)&&rows.length<=limit&&rows.every((r:unknown)=>r!==null&&typeof r==='object'&&Object.entries(spec).every(([k,n])=>stringField((r as Record<string,unknown>)[k],n))));
const cleanRows=<T>(rows:unknown,fields:(keyof T)[]):T[]|undefined=>Array.isArray(rows)?rows.map((row:Record<string,unknown>)=>Object.fromEntries(fields.map(k=>[k,row[String(k)]])) as T):undefined;
export function validateBookMetadata(raw:string):BookMetadata|null{
 try{
 if(new TextEncoder().encode(raw).byteLength>14000)return null;
 const parsed=JSON.parse(raw||'{"colors":[],"links":[]}');
 if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.colors)||!Array.isArray(parsed.links)||parsed.colors.length>16||parsed.links.length>12)return null;
 if(parsed.colors.some((c:unknown)=>!c||typeof c!=='object'||!stringField((c as {name:unknown}).name,80)||!/^#[0-9a-f]{6}$/i.test((c as {hex:string}).hex)))return null;
 if(parsed.links.some((l:unknown)=>!l||typeof l!=='object'||!stringField((l as {label:unknown}).label,120)||!(l as {label:string}).label.trim()||!stringField((l as {url:unknown}).url,1000)||!safeProfessionalUrl((l as {url:string}).url)))return null;
 if(!optional(parsed.clientTitle,160)||!optional(parsed.subtitle,160)||(parsed.decisionType!==undefined&&parsed.decisionType!=='location')||(parsed.datesConfirmed!==undefined&&typeof parsed.datesConfirmed!=='boolean')||(parsed.shootDate!==undefined&&(!stringField(parsed.shootDate,10)||!dateOnly(parsed.shootDate))))return null;
 if(parsed.tool!==undefined&&!tools.includes(parsed.tool))return null;
 if(!rowsValid(parsed.shots,60,{scene:1000,framing:1000,action:1000,movement:1000,notes:1000}))return null;
 if(Array.isArray(parsed.shots)&&parsed.shots.some((s:Shot)=>!['lens','fps','duration','location','status','priority'].every(k=>optional(s[k as keyof Shot],120))))return null;
 if(!rowsValid(parsed.frames,30,{scene:120,shot:120,description:600,imageBlockId:50,duration:30,notes:400}))return null;
 if(Array.isArray(parsed.frames)&&parsed.frames.some((f:StoryboardFrame)=>(f.imageBlockId!==''&&!/^[a-f\d-]{36}$/i.test(f.imageBlockId))||(f.imageUrl!==undefined&&(!stringField(f.imageUrl,1000)||!safeProfessionalUrl(f.imageUrl)))))return null;
 if(!rowsValid(parsed.shootRows,50,{scene:120,start:30,end:30,location:160,task:400,crew:200,status:40}))return null;
 if(!rowsValid(parsed.crewRows,60,{name:120,role:120,contact:160,callTime:40,notes:400}))return null;
 if(parsed.budgetRows!==undefined&&(!Array.isArray(parsed.budgetRows)||parsed.budgetRows.length>60||parsed.budgetRows.some((b:BudgetRow)=>!stringField(b.item,160)||!stringField(b.category,100)||!stringField(b.notes,300)||typeof b.quantity!=='number'||!Number.isFinite(b.quantity)||b.quantity<0||b.quantity>100000||typeof b.unitCost!=='number'||!Number.isFinite(b.unitCost)||b.unitCost<0||b.unitCost>10000000||typeof b.paid!=='boolean')))return null;
 if(!rowsValid(parsed.reviewNotes,60,{source:160,timecode:30,note:600,status:40}))return null;
 if(parsed.callSheet!==undefined&&(!parsed.callSheet||typeof parsed.callSheet!=='object'||!Object.entries({shootDate:30,crewCall:30,address:300,parking:300,emergency:200,weather:160,notes:1200}).every(([k,n])=>stringField(parsed.callSheet[k],n))))return null;
 return {
  shots:Array.isArray(parsed.shots)?parsed.shots.map((s:Shot)=>({scene:s.scene,framing:s.framing,action:s.action,movement:s.movement,notes:s.notes,...Object.fromEntries(['lens','fps','duration','location','status','priority'].filter(k=>typeof s[k as keyof Shot]==='string').map(k=>[k,s[k as keyof Shot]]))})):undefined,
  clientTitle:parsed.clientTitle,subtitle:parsed.subtitle,decisionType:parsed.decisionType,shootDate:parsed.shootDate,datesConfirmed:parsed.datesConfirmed,
  colors:parsed.colors.map((c:{name:string;hex:string})=>({name:c.name,hex:c.hex})),
  links:parsed.links.map((l:{label:string;url:string})=>({label:l.label,url:l.url})),
  tool:parsed.tool,
  frames:cleanRows<StoryboardFrame>(parsed.frames,['scene','shot','description','imageBlockId','duration','notes','imageUrl']),
  shootRows:cleanRows<ShootRow>(parsed.shootRows,['scene','start','end','location','task','crew','status']),
  crewRows:cleanRows<CrewRow>(parsed.crewRows,['name','role','contact','callTime','notes']),
  budgetRows:Array.isArray(parsed.budgetRows)?parsed.budgetRows.map((b:BudgetRow)=>({item:b.item,category:b.category,quantity:b.quantity,unitCost:b.unitCost,paid:b.paid,notes:b.notes})):undefined,
  reviewNotes:cleanRows<ReviewNote>(parsed.reviewNotes,['source','timecode','note','status']),
  callSheet:parsed.callSheet?{shootDate:parsed.callSheet.shootDate,crewCall:parsed.callSheet.crewCall,address:parsed.callSheet.address,parking:parsed.callSheet.parking,emergency:parsed.callSheet.emergency,weather:parsed.callSheet.weather,notes:parsed.callSheet.notes}:undefined
 };
 }catch{return null;}
}
