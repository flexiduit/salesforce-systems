import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { recordSchema } from '../../../lib/records';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'Please sign in to access records.'},401);
 try{const db=env.DB!;const id=new URL(req.url).searchParams.get('history');
 if(id){const result=await db.prepare('SELECT id, record_id AS recordId, action, payload, at FROM history WHERE owner=? AND record_id=? ORDER BY at DESC').bind(user.userId,id).all();return reply({history:result.results});}
 const result=await db.prepare('SELECT * FROM records WHERE owner=? ORDER BY created DESC').bind(user.userId).all();
 return reply({records:result.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id,version:r.version,created:r.created,updated:r.updated}))});
 }catch{return reply({error:'Unable to load records. Please try again.'},500)}
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'Please sign in to save records.'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON required.'},415);
 try{
 const raw=await req.text();if(raw.length>12000)return reply({error:'Record too large.'},413);
 const body=JSON.parse(raw);const parsed=recordSchema.safeParse(body.data);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
 const d=parsed.data, now=new Date().toISOString(), mutation=crypto.randomUUID(), payload=JSON.stringify(d), db=env.DB!;
 const edit=typeof body.id==='string';const id=edit?body.id:crypto.randomUUID();
 if(edit && (!Number.isInteger(body.version)||body.version<1))return reply({error:'Invalid record version.'},400);
 const write=edit?db.prepare('UPDATE records SET app_id=?,payload=?,version=version+1,mutation=?,updated=? WHERE id=? AND owner=? AND version=?').bind(d.appId,payload,mutation,now,id,user.userId,body.version):db.prepare('INSERT INTO records (id,owner,app_id,payload,version,mutation,created,updated) VALUES (?,?,?,?,1,?,?,?)').bind(id,user.userId,d.appId,payload,mutation,now,now);
 const results=await db.batch([write,db.prepare('INSERT INTO history (id,record_id,owner,action,payload,at) SELECT ?,id,owner,?,payload,? FROM records WHERE id=? AND owner=? AND mutation=?').bind(mutation,edit?'Record updated':'Record created',now,id,user.userId,mutation)]);
 if(!results[0].meta.changes)return reply({error:'This record changed in another session. Close the form, refresh and try again.'},409);
 return reply({id},edit?200:201);
 }catch(e){const msg=String(e);return reply({error:msg.includes('UNIQUE')?'Application ID already exists. Use a unique ID.':'Unable to save. Check your entries and try again.'},msg.includes('UNIQUE')?409:400)}
}
