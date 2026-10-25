import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const dataFile=path.join(root,'data','places.json');
const publicDir=path.join(root,'dist');
const port=Number(process.env.PORT||4173);
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS'};
async function readPlaces(){try{return JSON.parse(await fs.readFile(dataFile,'utf8'))}catch{return[]}}
async function writePlaces(places){await fs.mkdir(path.dirname(dataFile),{recursive:true});await fs.writeFile(dataFile,JSON.stringify(places,null,2)+'\n','utf8')}
function send(res,status,body,type='application/json'){res.writeHead(status,{...headers,'Content-Type':type});res.end(type==='application/json'?JSON.stringify(body):body)}
async function body(req){let s='';for await(const chunk of req)s+=chunk;return s?JSON.parse(s):{}}
const server=http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,headers);return res.end()}
  try{
    if(req.url==='/api/places'&&req.method==='GET')return send(res,200,{places:await readPlaces()});
    if(req.url==='/api/places'&&req.method==='POST'){
      const item=await body(req);if(!item.name||!item.coords?.length)return send(res,400,{error:'Nama dan koordinat diperlukan'});
      const places=await readPlaces();const saved={...item,id:item.id||crypto.randomUUID(),updatedAt:new Date().toISOString()};places.push(saved);await writePlaces(places);return send(res,201,saved);
    }
    if(req.url.startsWith('/api/places/')&&req.method==='DELETE'){
      const id=decodeURIComponent(req.url.split('/').pop());const places=await readPlaces();const next=places.filter(p=>p.id!==id);await writePlaces(next);return send(res,200,{ok:true,places:next});
    }
    let file=req.url==='/'?'/index.html':req.url.split('?')[0];file=path.normalize(file).replace(/^\.\.(\/|\\)/,'');const full=path.join(publicDir,file);
    if(!full.startsWith(publicDir))return send(res,403,{error:'Forbidden'});
    const content=await fs.readFile(full);const ext=path.extname(full);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png'};res.writeHead(200,{...headers,'Cache-Control':'no-store, no-cache, must-revalidate','Pragma':'no-cache','Content-Type':types[ext]||'application/octet-stream'});res.end(content);
  }catch(e){console.error(e);send(res,500,{error:'Server error'})}
});
server.listen(port,()=>console.log('MeruVerse localhost: http://localhost:'+port));

