const SUPABASE_URL='https://csypqcyfijhageacaqew.supabase.co';
const SUPABASE_KEY='sb_publishable_9pMUJg3aT0rv51i88v7hUg_DFsIujhH';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:'mona-admin-session'}});
const categories=['Helados','Cuchuflís','Café de grano'];
const money=v=>'$'+Number(v||0).toLocaleString('es-CL');
const el=(t,c,txt)=>{const x=document.createElement(t);if(c)x.className=c;if(txt!==undefined)x.textContent=txt;return x};
function notify(message){const n=document.getElementById('status');if(n)n.textContent=message}
async function getData(){const [p,s]=await Promise.all([sb.from('mona_products').select('*').order('sort_order').order('id'),sb.from('mona_settings').select('*').eq('id',1).maybeSingle()]);if(p.error)throw p.error;if(s.error)throw s.error;return {products:p.data,bank:s.data||{}}}
let publicBank={};
async function renderMenu(){
const root=document.getElementById('menu');if(!root)return;
root.textContent='Cargando carta...';
try{
const d=await getData();publicBank=d.bank;root.replaceChildren();
let shown=0;
for(const cat of categories){
const list=d.products.filter(p=>p.category===cat&&p.available);
if(!list.length)continue;
shown+=list.length;
const section=el('section','catalog-section');
const title=el('h2','catalog-title',cat);section.append(title);
const grid=el('div','catalog-grid');
for(const p of list){
const card=el('article','catalog-card');
const media=el('div','catalog-media');
if(p.image_url){
const img=el('img','catalog-image');img.src=p.image_url;img.alt=p.name;img.loading='lazy';
img.onerror=()=>{media.replaceChildren(Object.assign(el('img','catalog-fallback-logo'),{src:'mona-logo.webp',alt:'MO-NA'}))};
media.append(img);
}else media.append(Object.assign(el('img','catalog-fallback-logo'),{src:'mona-logo.webp',alt:'MO-NA'}));
card.append(media);
const info=el('div','catalog-info');info.append(el('h3','catalog-name',p.name));
const prices=el('div','catalog-prices');
if(cat==='Helados'){
for(const [label,value] of [['Simple',p.simple],['Doble',p.double]]){
const item=el('div','catalog-price-item');item.append(el('span','catalog-price-label',label),el('strong','catalog-price-value',money(value)));prices.append(item)
}
}else{const item=el('div','catalog-price-item');item.append(el('strong','catalog-price-value',money(p.price)));prices.append(item)}
info.append(prices);card.append(info);grid.append(card)
}
section.append(grid);root.append(section)
}
if(!shown)root.textContent='Pronto publicaremos nuestra carta 🍦';
}catch(e){root.textContent='No se pudo cargar la carta. Intenta actualizar la página.';console.error(e)}
}
async function copyBank(){const b=publicBank;const lines=[['Titular',b.bank_owner],['RUT',b.bank_rut],['Banco',b.bank_name],['Tipo de cuenta',b.bank_type],['Número de cuenta',b.bank_account],['Correo',b.bank_email]].filter(x=>x[1]).map(x=>x.join(': '));const msg=document.getElementById('message');if(!lines.length){msg.textContent='Datos bancarios aún no configurados';return}try{await navigator.clipboard.writeText(lines.join('\n'));msg.textContent='¡Datos copiados!'}catch{msg.textContent=lines.join(' · ')}}
async function initAdmin(){const login=document.getElementById('login'),workspace=document.getElementById('workspace');async function show(){const {data:{user}}=await sb.auth.getUser();if(!user){login.hidden=false;workspace.hidden=true;return}const {data,error}=await sb.from('mona_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(error||!data){notify('Esta cuenta no tiene permiso de administración.');await sb.auth.signOut();login.hidden=false;workspace.hidden=true;return}login.hidden=true;workspace.hidden=false;await renderAdmin()}const forgot=document.getElementById('forgotPassword'),recovery=document.getElementById('recoveryForm'),resetSection=document.getElementById('resetSection'),resetForm=document.getElementById('resetPasswordForm');
forgot.onclick=()=>{recovery.hidden=!recovery.hidden;notify('Ingresa tu correo para recibir un enlace de recuperación.')};
recovery.onsubmit=async e=>{e.preventDefault();const email=String(new FormData(e.target).get('email')).trim();notify('Solicitando enlace...');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/admin.html'});notify(error?'No se pudo enviar: '+error.message:'Si el correo está registrado, recibirás un enlace para cambiar tu contraseña. Revisa también spam.')};
let recovering=false;
sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){recovering=true;login.hidden=true;workspace.hidden=true;resetSection.hidden=false;notify('Ingresa tu nueva contraseña.')}});
const urlParams=new URLSearchParams(location.search);
if(urlParams.has('code')||location.hash.includes('type=recovery')){recovering=true;login.hidden=true;workspace.hidden=true;resetSection.hidden=false;notify('Ingresa tu nueva contraseña.')}
resetForm.onsubmit=async e=>{e.preventDefault();const password=String(new FormData(e.target).get('password'));notify('Actualizando contraseña...');const {error}=await sb.auth.updateUser({password});if(error){notify('No se pudo cambiar la contraseña: '+error.message);return}recovering=false;resetSection.hidden=true;recovery.hidden=true;await sb.auth.signOut();login.hidden=false;notify('Contraseña actualizada ✓. Ahora inicia sesión con tu nueva contraseña.');history.replaceState(null,'',location.pathname)};
document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();notify('Ingresando...');const f=new FormData(e.target);const {error}=await sb.auth.signInWithPassword({email:String(f.get('email')),password:String(f.get('password'))});if(error){notify('No se pudo iniciar sesión: '+error.message);return}notify('');await show()};document.getElementById('logout').onclick=async()=>{await sb.auth.signOut();notify('Sesión cerrada');await show()};if(!recovering)await show()}
async function renderAdmin(){const root=document.getElementById('admin');root.textContent='Cargando productos...';try{const d=await getData();root.replaceChildren();for(const cat of categories){const s=el('section','panel');s.append(el('h2','',cat));for(const p of d.products.filter(x=>x.category===cat)){const r=el('div','editrow');const name=el('input');name.value=p.name;name.setAttribute('aria-label','Nombre');r.append(name);const fields=el('div','fields');const inputs={};for(const [k,label] of (cat==='Helados'?[['simple','Simple'],['double','Doble']]:[['price','Precio']])){const l=el('label','',label),i=el('input');i.type='number';i.min='0';i.value=p[k]??0;inputs[k]=i;l.append(i);fields.append(l)}r.append(fields);const photo=el('label','','URL de foto (https://)'),photoInput=el('input');photoInput.type='url';photoInput.placeholder='https://...';photoInput.value=p.image_url||'';photo.append(photoInput);r.append(photo);
const uploadLabel=el('label','','📷 Subir fotografía desde el dispositivo');
const uploadInput=el('input');uploadInput.type='file';uploadInput.accept='image/jpeg,image/png,image/webp';
uploadInput.onchange=async()=>{
const file=uploadInput.files&&uploadInput.files[0];if(!file)return;
if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('Selecciona una imagen JPG, PNG o WEBP.');return}
if(file.size>5*1024*1024){notify('La fotografía debe pesar menos de 5 MB.');return}
uploadInput.disabled=true;notify('Subiendo fotografía...');
try{
const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
const path='productos/'+p.id+'/'+crypto.randomUUID()+'.'+ext;
const {error:uploadError}=await sb.storage.from('mona-fotos').upload(path,file,{contentType:file.type,upsert:false});
if(uploadError)throw uploadError;
const {data:publicUrl}=sb.storage.from('mona-fotos').getPublicUrl(path);
const {error:saveError}=await sb.from('mona_products').update({image_url:publicUrl.publicUrl}).eq('id',p.id);
if(saveError)throw saveError;
photoInput.value=publicUrl.publicUrl;notify('Fotografía subida y guardada ✓');
}catch(e){notify('Error al subir fotografía: '+e.message)}
finally{uploadInput.disabled=false;uploadInput.value=''}
};
uploadLabel.append(uploadInput);r.append(uploadLabel);const actions=el('div','editactions'),toggle=el('label','','Disponible '),check=el('input');check.type='checkbox';check.checked=p.available;toggle.append(check);actions.append(toggle);const save=el('button','','Guardar');save.onclick=async()=>{save.disabled=true;const values={name:name.value.trim(),available:check.checked,image_url:photoInput.value.trim()||null};for(const [k,i] of Object.entries(inputs))values[k]=Number(i.value);const {error}=await sb.from('mona_products').update(values).eq('id',p.id);notify(error?'Error: '+error.message:'Producto guardado ✓');window.alert(error?'No se pudo guardar: '+error.message:'Producto guardado correctamente ✓');save.disabled=false};actions.append(save);const del=el('button','del','Eliminar');del.onclick=async()=>{if(!confirm('¿Eliminar producto?'))return;const {error}=await sb.from('mona_products').delete().eq('id',p.id);if(error)notify('Error: '+error.message);else{notify('Producto eliminado');await renderAdmin()}};actions.append(del);r.append(actions);s.append(r)}root.append(s)}const bank=document.getElementById('bank');bank.replaceChildren();const bankInputs={};for(const [k,label] of Object.entries({bank_owner:'Titular',bank_rut:'RUT',bank_name:'Banco',bank_type:'Tipo de cuenta',bank_account:'Número de cuenta',bank_email:'Correo'})){const l=el('label','',label),i=el('input');i.value=d.bank[k]||'';bankInputs[k]=i;l.append(i);bank.append(l)}const saveBank=el('button','','Guardar datos bancarios');saveBank.onclick=async()=>{const values={id:1};for(const [k,i] of Object.entries(bankInputs))values[k]=i.value;const {error}=await sb.from('mona_settings').upsert(values);notify(error?'Error: '+error.message:'Datos bancarios guardados ✓')};bank.append(saveBank)}catch(e){notify('Error: '+e.message);root.textContent='No se pudieron cargar los productos.'}}
const newProductForm=document.getElementById('newProduct');
if(newProductForm){
 const categorySelect=document.getElementById('newCategory');
 const icePrices=document.getElementById('newIcePrices');
 const singlePrice=document.getElementById('newSinglePrice');
 const updatePriceFields=()=>{
  const cat=categorySelect.value;
  icePrices.hidden=cat!=='Helados';
  singlePrice.hidden=!cat||cat==='Helados';
  for(const input of icePrices.querySelectorAll('input'))input.required=cat==='Helados';
  for(const input of singlePrice.querySelectorAll('input'))input.required=!!cat&&cat!=='Helados';
 };
 categorySelect.onchange=updatePriceFields;updatePriceFields();
 const photoField=document.getElementById('newProductPhoto');
 const preview=document.getElementById('newPhotoPreview');
 const previewImage=document.getElementById('newPhotoPreviewImage');
 let previewUrl=null;
 const clearPreview=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;preview.hidden=true;previewImage.removeAttribute('src')};
 photoField.onchange=()=>{
  clearPreview();
  const file=photoField.files?.[0];
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('Selecciona una imagen JPG, PNG o WEBP.');photoField.value='';return}
  if(file.size>5*1024*1024){notify('La fotografía debe pesar menos de 5 MB.');photoField.value='';return}
  previewUrl=URL.createObjectURL(file);previewImage.src=previewUrl;preview.hidden=false;
 };
 newProductForm.onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(newProductForm),cat=String(f.get('category')||'');
  if(!categories.includes(cat)){notify('Selecciona una categoría.');return}
  const name=String(f.get('name')||'').trim();
  if(!name){notify('Ingresa el nombre del producto.');return}
  const item={category:cat,name,available:true,...(cat==='Helados'?{simple:Number(f.get('simple')),double:Number(f.get('double')),price:0}:{simple:0,double:0,price:Number(f.get('price'))})};
  const file=photoField.files?.[0];
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){notify('La fotografía debe ser JPG, PNG o WEBP y pesar menos de 5 MB.');return}
  const button=newProductForm.querySelector('button[type="submit"]');button.disabled=true;
  try{
   if(file){
    notify('Subiendo fotografía...');
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path='productos/nuevos/'+crypto.randomUUID()+'.'+ext;
    const {error:uploadError}=await sb.storage.from('mona-fotos').upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError)throw uploadError;
    item.image_url=sb.storage.from('mona-fotos').getPublicUrl(path).data.publicUrl;
   }
   notify('Guardando producto...');
   const {error}=await sb.from('mona_products').insert(item);
   if(error)throw error;
   notify('Producto agregado con fotografía y precios ✓');
   newProductForm.reset();categorySelect.value=cat;clearPreview();updatePriceFields();await renderAdmin();
   newProductForm.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){notify('No se pudo agregar: '+error.message)}
  finally{button.disabled=false}
 };
}

export {initAdmin,renderMenu,copyBank};
