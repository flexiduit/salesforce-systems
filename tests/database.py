import sqlite3, pathlib, re, json
root=pathlib.Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
for p in sorted((root/'drizzle').glob('*.sql')): db.executescript(p.read_text())
queries=re.findall(r"db\.prepare\('([^']+)'\)",(root/'app/api/records/route.ts').read_text())
def q(prefix): return next(s for s in queries if s.startswith(prefix))
insert=q('INSERT INTO records'); update=q('UPDATE'); audit=q('INSERT INTO history')
payload=json.dumps({'fullName':'Fictional Customer','amount':100})
with db:
 db.execute(insert,('r1','owner-a','APP1',payload,'m1','2026-01-01','2026-01-01'))
 db.execute(audit,('m1','Record created','2026-01-01','r1','owner-a','m1'))
assert len(db.execute(q('SELECT *'),('owner-a',)).fetchall())==1
assert len(db.execute(q('SELECT *'),('owner-b',)).fetchall())==0
with db:
 assert db.execute(update,('APP1',payload,'m2','2026-02-01','r1','owner-a',1)).rowcount==1
 db.execute(audit,('m2','Record updated','2026-02-01','r1','owner-a','m2'))
with db:
 assert db.execute(update,('APP1',payload,'m3','2026-03-01','r1','owner-a',1)).rowcount==0
 assert db.execute(audit,('m3','Record updated','2026-03-01','r1','owner-a','m3')).rowcount==0
assert db.execute(update,('APP1',payload,'m4','2026-03-01','r1','owner-b',2)).rowcount==0
assert len(db.execute(q('SELECT id, record_id'),('owner-b','r1')).fetchall())==0
assert len(db.execute(q('SELECT id, record_id'),('owner-a','r1')).fetchall())==2
try:
 db.execute(insert,('r2','owner-a','APP1',payload,'m5','2026-01-01','2026-01-01'))
 raise AssertionError('Duplicate application accepted')
except sqlite3.IntegrityError: pass
print('PASS: migrations, persistence, tenant isolation, audit history, stale updates, unique application IDs')
