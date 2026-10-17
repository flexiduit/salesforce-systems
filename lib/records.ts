import { z } from 'zod';
export const statuses=['Pending','Approved','Active','Paid','Overdue','Rejected'] as const;
export const recordSchema=z.object({fullName:z.string().trim().min(2).max(120),mykad:z.string().regex(/^\d{12}$/, 'MyKad must contain 12 digits'),phone:z.string().regex(/^\+?[0-9 ()-]{8,20}$/, 'Enter a valid phone number'),account:z.string().trim().min(3).max(80),appId:z.string().trim().min(3).max(50),status:z.enum(statuses),amount:z.number().positive().max(10000000).refine(n=>Math.abs(n*100-Math.round(n*100))<0.00001,'Use at most two decimal places'),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v,'Invalid date'),refNo:z.string().trim().max(80).default(''),email:z.union([z.literal(''),z.string().email()]).default(''),bankName:z.string().trim().max(80).default(''),notes:z.string().max(2000).default('')});
export type RecordData=z.infer<typeof recordSchema>;
export type Loan=RecordData & {id:string;version:number;created:string;updated:string};
export type Event={id:string;recordId:string;action:string;payload:string;at:string};
export function money(n:number){return new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR',maximumFractionDigits:2}).format(n)}
export function date(v:string){return new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'})}
export function stamp(v:string){return new Date(v).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kuala_Lumpur'})}
export function effectiveStatus(r:RecordData){return r.status==='Active' && r.dueDate < new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) ? 'Overdue' : r.status}
