// Run only against an isolated DIIP_DEMO server on port 3001 with DIIP_DATA_DIR pointing to a disposable test directory.
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
const base = process.env.DIIP_TEST_URL || 'http://127.0.0.1:3001';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('QA requires a local test server.');
const checks = [], suffix = Date.now().toString(), image = 'data:image/jpeg;base64,/9j/AA==';
async function request(path, method='GET', body, cookie='', origin=base) { const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})}); return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers}; }
async function login(email,password) {const r=await request('/api/session','POST',{email,password}); assert.equal(r.status,200,JSON.stringify(r.body)); return r.cookie;}
async function state(cookie) {const r=await request('/api/data','GET',null,cookie); assert.equal(r.status,200); return r.body;}
async function action(cookie, action, version) { const s=version??(await state(cookie)).version; return request('/api/action','POST',{action,version:s},cookie); }
function pass(label){checks.push(label);}
assert.equal((await request('/api/data')).status,401); pass('Lectura sin sesión rechazada');
assert.equal((await request('/api/session','POST',{email:'admin@diip.mx',password:'demo123'},'','https://foreign.invalid')).status,401); pass('Origen ajeno rechazado');
const admin=await login('admin@diip.mx','demo123'), worker=await login('colaborador@diip.mx','demo123'), analyst=await login('analista@diip.mx','demo123'), supervisor=await login('supervisor@diip.mx','demo123');
const own=await state(worker); assert(own.data.employees.every(e=>e.id==='e1')); assert(own.data.attendance.every(r=>r.employeeId==='e1')); assert(!own.data.users?.length); pass('Respuesta de colaborador limitada a sus datos');
assert.equal((await action(worker,{type:'policy',maxDailyRecords:2,maxMonthlyRecords:40})).status,400); pass('Permisos verificados en servidor');
let r=await action(admin,{type:'employee',employee:{id:'qa-'+suffix,employeeNumber:'QA-'+suffix,name:'Prueba API',email:`qa-${suffix}@example.test`,projectId:'metro',shiftId:'matutino',active:true,startDate:'2026-09-01'}}); assert.equal(r.status,200,JSON.stringify(r.body));
const id='qa-'+suffix, email=`user-${suffix}@example.test`, user={id:'qa-user-'+suffix,name:'Usuario prueba',email,role:'Colaborador',employeeId:id,active:true};
r=await action(admin,{type:'user',user,password:'Qa-password-12345'}); assert.equal(r.status,200,JSON.stringify(r.body));
const newWorker=await login(email,'Qa-password-12345'); pass('Alta de colaborador y usuario con autenticación real');
r=await action(newWorker,{type:'clock',employeeId:id,direction:'in',photo:image}); assert.equal(r.status,200,JSON.stringify(r.body)); assert.equal(r.body.data.attendance[0].checkInPhoto,image);
assert.equal((await action(newWorker,{type:'clock',employeeId:id,direction:'in',photo:image})).status,400);
r=await action(newWorker,{type:'clock',employeeId:id,direction:'out',photo:image}); assert.equal(r.status,200,JSON.stringify(r.body)); assert.equal(r.body.data.attendance[0].checkOutPhoto,image); pass('Entrada, salida, fotos y prevención de doble entrada');
const stale=(await state(admin)).version;
r=await action(admin,{type:'policy',maxDailyRecords:2,maxMonthlyRecords:31},stale); assert.equal(r.status,200);
r=await action(admin,{type:'policy',maxDailyRecords:3,maxMonthlyRecords:31},stale); assert.equal(r.status,400); assert.match(r.body.error,/otra sesión/); pass('Conflicto concurrente rechazado sin sobrescribir');
const rows=[['numero','fecha','entrada','salida'],['QA-'+suffix,'2026-09-01','08:00',null],['QA-'+suffix,'2026-09-01','08:00',null],['UNKNOWN','2026-09-01','08:00','16:00']];
r=await action(analyst,{type:'import',name:'qa-'+suffix+'.csv',rows}); assert.equal(r.status,200,JSON.stringify(r.body)); const imported=r.body.data.attendance.find(x=>x.employeeId===id && x.date==='2026-09-01'); assert(imported); assert(r.body.data.imports[0].errors.length===1); pass('Importación con originales, duplicados y filas rechazadas conservadas');
r=await action(newWorker,{type:'incident',incident:{employeeId:id,attendanceId:imported.id,type:'Corrección de horario',date:'2026-09-01',description:'Aclaración de prueba',proposedCheckOut:'16:00'},photo:image}); assert.equal(r.status,200); const incidentId=r.body.data.incidents.find(i=>i.description==='Aclaración de prueba').id;
assert.equal((await action(analyst,{type:'decision',id:incidentId,status:'Autorizada',comment:'No autorizado',deduction:false})).status,400);
r=await action(supervisor,{type:'decision',id:incidentId,status:'Información requerida',comment:'Adjunta evidencia',deduction:false}); assert.equal(r.status,200);
r=await action(newWorker,{type:'reply',id:incidentId,comment:'Evidencia adicional',photo:image}); assert.equal(r.status,200);
r=await action(supervisor,{type:'decision',id:incidentId,status:'Autorizada',comment:'Revisada y autorizada',deduction:false}); assert.equal(r.status,200);
const updated=r.body.data.attendance.find(x=>x.id===imported.id); assert.equal(updated.checkOut,'16:00'); assert.equal(updated.original.checkOut,null); assert(updated.history.length>0); pass('Flujo pedir información, responder y autorizar con historial y originales');
const persisted=await state(await login(email,'Qa-password-12345')); assert(persisted.data.attendance.some(x=>x.checkInPhoto===image)); pass('Datos y fotos disponibles en nueva sesión');
r=await action(admin,{type:'user',user:{...user,active:false}}); assert.equal(r.status,200); assert.equal((await request('/api/data','GET',null,newWorker)).status,401); pass('Desactivación revoca acceso');
await request('/api/session','DELETE',null,admin); assert.equal((await request('/api/data','GET',null,admin)).status,401); pass('Cierre de sesión revocado en servidor');
await mkdir('.qa/revision',{recursive:true}); await writeFile('.qa/revision/api-results.json',JSON.stringify({passed:checks.length,checks},null,2)); console.log(JSON.stringify({passed:checks.length,checks},null,2));
