import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:8787';
const data={problem:'outro',location:'Local fictício',property:'empresa',urgency:'planejar',access:'Acesso de teste',region:'Região de teste',cep:'',name:'Teste de anexos',phone:'11999999999',email:'test@example.com',notes:'Registro sintético local',marketing:false,privacy:true,reviewAcknowledged:true,website:''};
const r=await fetch(origin+'/api/check',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(data)});
assert.equal(r.status,201,await r.clone().text());const lead=await r.json();
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=','base64');
const upload=(body,type='image/png')=>fetch(origin+'/api/uploads',{method:'POST',headers:{Origin:origin,'Content-Type':type,'X-Lead-Id':lead.id,'X-Upload-Token':lead.uploadToken},body});
assert.equal((await upload(Buffer.from('<html>invalid image</html>'))).status,415);
for(let i=0;i<3;i++){const response=await upload(png);assert.equal(response.status,201,await response.clone().text());assert.ok((await response.json()).id)}
assert.equal((await upload(png)).status,409);
console.log('PASS: private R2 uploads, invalid signature rejection, three-file cap');
