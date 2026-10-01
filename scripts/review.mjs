import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output = new URL('../.qa/revision/', import.meta.url); await mkdir(output,{recursive:true});
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const results=[];
for (const [name, viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
 const context=await browser.newContext({viewport,reducedMotion:"reduce",permissions:['camera']}); const page=await context.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:2560',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Entrar al sistema'}).click();
 await page.getByRole('heading',{name:/Hola,/}).waitFor();
 const navigate=async(label)=>{ if(viewport.width<760) await page.getByRole('button',{name:'Abrir menú'}).click(); await page.getByRole('navigation').getByRole('button',{name:label,exact:true}).click(); };
 const shot=async(label)=>{await page.screenshot({path:fileURLToPath(new URL(`${name}-${label}.png`,output)),fullPage:true,animations:"disabled"}); const width=await page.evaluate(()=>document.documentElement.scrollWidth); if(width>viewport.width) errors.push(`${label}: overflow ${width}/${viewport.width}`);};
 await shot('inicio');
 await navigate('Registros'); await shot('registros');
 await page.getByRole('button',{name:'Tomar foto',exact:true}).click();
 await page.getByRole('button',{name:'Capturar foto',exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
 await page.getByRole('button',{name:'Capturar foto',exact:true}).click();
 await page.getByAltText('Foto de entrada').or(page.getByAltText('Foto de salida')).waitFor();
 await shot('foto');
 await page.getByRole('button',{name:'Cambiar foto'}).click();
 for(const label of ['Incidencias','Colaboradores','Proyectos y turnos','Importar','Reportes','Usuarios y permisos','Configuración']) { await navigate(label); await shot(label.replaceAll(' ','-')); }
 await navigate('Incidencias'); await page.getByRole('button',{name:'Nueva solicitud'}).click(); await shot('solicitud');
 await page.getByRole('button',{name:'Cerrar ventana'}).click();
 results.push({name,errors}); await context.close();
}
await browser.close(); await writeFile(new URL('results.json',output),JSON.stringify(results,null,2)); console.log(JSON.stringify(results,null,2));
