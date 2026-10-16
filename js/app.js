const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>Math.round(n||0).toLocaleString('vi-VN')+'đ';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS=['Điện thoại','Linh kiện','Phụ kiện','Khác'];
const seed=()=>({seq:1,
 products:[
  {id:1,code:'IP15',name:'iPhone 15 128GB',cat:'Điện thoại',cost:17500000,price:19990000,stock:3,min:1,imei:true},
  {id:2,code:'SS-A55',name:'Samsung A55 5G',cat:'Điện thoại',cost:8200000,price:9490000,stock:5,min:2,imei:true},
  {id:3,code:'MH-IP11',name:'Màn hình iPhone 11',cat:'Linh kiện',cost:650000,price:1100000,stock:10,min:3,imei:false},
  {id:4,code:'PIN-SS',name:'Pin Samsung A series',cat:'Linh kiện',cost:120000,price:250000,stock:2,min:5,imei:false},
  {id:5,code:'OP-IP15',name:'Ốp lưng iPhone 15',cat:'Phụ kiện',cost:25000,price:79000,stock:30,min:10,imei:false},
  {id:6,code:'CS-20W',name:'Củ sạc 20W',cat:'Phụ kiện',cost:90000,price:180000,stock:15,min:5,imei:false}],
 customers:[{id:1,name:'Nguyễn Văn A',phone:'0901234567',debt:0}],
 invoices:[],imports:[]});
let db; try{db=JSON.parse(localStorage.getItem('qlbh'))}catch(e){} db=db||seed();
const CFG=window.SUPABASE_CONFIG||{};
let sb=null,uid=null,_t;
const saveLocal=()=>{try{localStorage.setItem('qlbh',JSON.stringify(db))}catch(e){}};
const save=()=>{saveLocal();clearTimeout(_t);_t=setTimeout(push,600)};
async function push(){if(!sb||!uid)return;const {error}=await sb.from('store').upsert({user_id:uid,data:db,updated_at:new Date().toISOString()});if(error)toast('Lỗi đồng bộ: '+error.message)}
const nid=()=>db.seq++;
const prod=id=>db.products.find(p=>p.id==id), cust=id=>db.customers.find(c=>c.id==id);
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2200)}
function modal(h){$('#mb').innerHTML=h;$('#modal').classList.add('on')}
function close_(){$('#modal').classList.remove('on')}
$('#modal').onclick=e=>{if(e.target.id=='modal')close_()};
const V=id=>$('#'+id).value, N=id=>+V(id)||0;

const VIEWS={dash:['Tổng quan',dash],pos:['Bán hàng',pos],products:['Hàng hóa',products],imp:['Nhập hàng',imp],cust:['Khách hàng',custs],inv:['Hóa đơn',invs],data:['Dữ liệu',data]};
let cur='dash';
function go(v){cur=v;$('#nav').innerHTML='<h1>📱 Quản lý cửa hàng</h1>'+Object.entries(VIEWS).map(([k,[t]])=>`<button class="${k==v?'on':''}" onclick="go('${k}')">${t}</button>`).join('')+'<button onclick="logout()">Đăng xuất</button>';VIEWS[v][1]()}

/* ---------- TỔNG QUAN ---------- */
function dash(){
 const day=d=>new Date(d).toDateString(), today=new Date().toDateString(), mon=new Date().getMonth()+'-'+new Date().getFullYear();
 const sum=(f)=>db.invoices.filter(f).reduce((a,i)=>({rev:a.rev+i.total,pf:a.pf+i.profit,n:a.n+1}),{rev:0,pf:0,n:0});
 const t=sum(i=>day(i.date)==today), m=sum(i=>{const d=new Date(i.date);return d.getMonth()+'-'+d.getFullYear()==mon});
 const stockVal=db.products.reduce((a,p)=>a+p.stock*p.cost,0), debt=db.customers.reduce((a,c)=>a+c.debt,0);
 const days=[...Array(7)].map((_,k)=>{const d=new Date();d.setDate(d.getDate()-6+k);return {l:d.getDate()+'/'+(d.getMonth()+1),v:db.invoices.filter(i=>day(i.date)==d.toDateString()).reduce((a,i)=>a+i.total,0)}});
 const mx=Math.max(1,...days.map(d=>d.v)), low=db.products.filter(p=>p.stock<=p.min);
 $('#app').innerHTML=`<h2>Tổng quan</h2><div class="grid">
 <div class="card stat"><span>Doanh thu hôm nay (${t.n} đơn)</span><b>${fmt(t.rev)}</b></div>
 <div class="card stat"><span>Lợi nhuận hôm nay</span><b class="ok">${fmt(t.pf)}</b></div>
 <div class="card stat"><span>Doanh thu tháng</span><b>${fmt(m.rev)}</b></div>
 <div class="card stat"><span>Lợi nhuận tháng</span><b class="ok">${fmt(m.pf)}</b></div>
 <div class="card stat"><span>Giá trị tồn kho (giá vốn)</span><b>${fmt(stockVal)}</b></div>
 <div class="card stat"><span>Khách đang nợ</span><b class="${debt?'low':''}">${fmt(debt)}</b></div></div>
 <div class="card"><b>Doanh thu 7 ngày</b><div class="bars" style="margin-top:12px">${days.map(d=>`<div><i style="height:${d.v/mx*90}px" title="${fmt(d.v)}"></i>${d.l}</div>`).join('')}</div></div>
 <div class="card"><b>Sắp hết hàng (${low.length})</b><div class="wrap"><table><tr><th>Sản phẩm</th><th class="r">Tồn</th><th class="r">Tối thiểu</th></tr>${low.map(p=>`<tr><td>${esc(p.name)}</td><td class="r low">${p.stock}</td><td class="r">${p.min}</td></tr>`).join('')||'<tr><td colspan=3>Tồn kho đều ổn.</td></tr>'}</table></div></div>`}

/* ---------- BÁN HÀNG ---------- */
let cart=[],pc={cust:0,disc:0,method:'cash',paid:''};
function pos(){
 $('#app').innerHTML=`<h2>Bán hàng</h2><div class="pos"><div><div class="row"><input id="q" placeholder="Tìm tên / mã hàng..." oninput="plist()" autofocus><select id="pcat" onchange="plist()"><option value="">Tất cả nhóm</option>${CATS.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="plist" id="pl"></div></div><div class="card" id="cartbox"></div></div>`;
 plist();cartRender()}
function plist(){
 const q=V('q').toLowerCase(),c=V('pcat');
 $('#pl').innerHTML=db.products.filter(p=>(!c||p.cat==c)&&(p.name+p.code).toLowerCase().includes(q)).map(p=>`<div class="p" onclick="addCart(${p.id})"><small>${esc(p.code)}</small><div>${esc(p.name)}</div><div class="pr">${fmt(p.price)}</div><small class="${p.stock<=p.min?'low':''}">Tồn: ${p.stock}</small></div>`).join('')||'<p>Không có hàng phù hợp.</p>'}
function addCart(id){
 const p=prod(id),l=cart.find(x=>x.id==id);
 if(p.stock<=(l?l.qty:0))return toast('Hết hàng trong kho');
 if(p.imei){const im=prompt('Nhập IMEI / Serial cho '+p.name+' (có thể để trống):','');if(im===null)return;cart.push({id,qty:1,price:p.price,imei:im.trim(),uniq:1});}
 else if(l)l.qty++;else cart.push({id,qty:1,price:p.price,imei:''});
 cartRender()}
function cartRender(){
 const sub=cart.reduce((a,l)=>a+l.qty*l.price,0),tot=Math.max(0,sub-pc.disc),paid=pc.paid===''?tot:+pc.paid;
 $('#cartbox').innerHTML=`<b>Giỏ hàng</b><div class="wrap"><table>${cart.map((l,i)=>`<tr><td>${esc(prod(l.id).name)}${l.imei?`<br><small>IMEI: ${esc(l.imei)}</small>`:''}</td>
 <td style="width:56px">${l.uniq?'1':`<input type="number" min="1" value="${l.qty}" onchange="cart[${i}].qty=Math.max(1,+this.value||1);cartRender()">`}</td>
 <td style="width:100px"><input type="number" value="${l.price}" onchange="cart[${i}].price=+this.value||0;cartRender()"></td>
 <td><button class="btn g s" onclick="cart.splice(${i},1);cartRender()">✕</button></td></tr>`).join('')||'<tr><td>Chọn sản phẩm bên trái.</td></tr>'}</table></div>
 <label>Khách hàng</label><select onchange="pc.cust=+this.value;cartRender()"><option value="0">Khách lẻ</option>${db.customers.map(c=>`<option value="${c.id}" ${pc.cust==c.id?'selected':''}>${esc(c.name)} ${esc(c.phone)}</option>`).join('')}</select>
 <label>Giảm giá (đ)</label><input type="number" value="${pc.disc}" onchange="pc.disc=+this.value||0;cartRender()">
 <label>Thanh toán</label><select onchange="pc.method=this.value"><option value="cash" ${pc.method=='cash'?'selected':''}>Tiền mặt</option><option value="bank" ${pc.method=='bank'?'selected':''}>Chuyển khoản</option></select>
 <label>Khách trả (bỏ trống = trả đủ)</label><input type="number" value="${pc.paid}" onchange="pc.paid=this.value;cartRender()">
 <div class="tot"><span>Tạm tính</span><span>${fmt(sub)}</span></div><div class="tot big"><span>Khách cần trả</span><span>${fmt(tot)}</span></div>
 <div class="tot"><span>${paid>=tot?'Tiền thừa':'Ghi nợ'}</span><span class="${paid<tot?'low':''}">${fmt(Math.abs(paid-tot))}</span></div>
 <button class="btn" style="width:100%;margin-top:8px" onclick="checkout()">Thanh toán</button>`}
function checkout(){
 if(!cart.length)return toast('Giỏ hàng trống');
 const sub=cart.reduce((a,l)=>a+l.qty*l.price,0),total=Math.max(0,sub-pc.disc),paid=Math.min(pc.paid===''?total:+pc.paid,total),debt=total-paid;
 if(debt>0&&!pc.cust)return toast('Muốn ghi nợ phải chọn khách hàng');
 const need={};cart.forEach(l=>need[l.id]=(need[l.id]||0)+l.qty);
 for(const id in need)if(prod(id).stock<need[id])return toast('Không đủ tồn: '+prod(id).name);
 const items=cart.map(l=>({pid:l.id,name:prod(l.id).name,qty:l.qty,price:l.price,cost:prod(l.id).cost,imei:l.imei}));
 const cost=items.reduce((a,i)=>a+i.qty*i.cost,0);
 const inv={id:'HD'+String(db.invoices.length+1).padStart(5,'0'),date:new Date().toISOString(),cust:pc.cust,items,discount:pc.disc,total,paid,method:pc.method,profit:total-cost};
 items.forEach(i=>prod(i.pid).stock-=i.qty);
 if(debt>0)cust(pc.cust).debt+=debt;
 db.invoices.unshift(inv);save();cart=[];pc={cust:0,disc:0,method:'cash',paid:''};
 toast('Đã lưu '+inv.id);receipt(inv.id);pos()}
function receipt(id){
 const i=db.invoices.find(x=>x.id==id),c=cust(i.cust),w=window.open('','_blank','width=380,height=600');if(!w)return toast('Trình duyệt chặn cửa sổ in');
 w.document.write(`<body style="font:13px monospace;width:300px"><h3 style="text-align:center">HÓA ĐƠN ${i.id}</h3><p>${new Date(i.date).toLocaleString('vi-VN')}<br>Khách: ${esc(c?c.name:'Khách lẻ')}</p><hr>${i.items.map(x=>`${esc(x.name)}${x.imei?'<br>IMEI: '+esc(x.imei):''}<br>${x.qty} x ${fmt(x.price)} = ${fmt(x.qty*x.price)}<br>`).join('')}<hr>Giảm giá: ${fmt(i.discount)}<br><b>Tổng: ${fmt(i.total)}</b><br>Đã trả: ${fmt(i.paid)}<br>Còn nợ: ${fmt(i.total-i.paid)}<p style="text-align:center">Cảm ơn quý khách!</p><script>print()<\/script>`);w.document.close()}

/* ---------- HÀNG HÓA ---------- */
let pf='';
function products(){
 $('#app').innerHTML=`<h2>Hàng hóa</h2><div class="row"><input id="pq" placeholder="Tìm hàng hóa..." value="${esc(pf)}" oninput="pf=this.value;prows()"><button class="btn" onclick="pform()">+ Thêm hàng</button></div><div class="card wrap"><table><thead><tr><th>Mã</th><th>Tên</th><th>Nhóm</th><th class="r">Giá vốn</th><th class="r">Giá bán</th><th class="r">Tồn</th><th></th></tr></thead><tbody id="pr"></tbody></table></div>`;prows()}
function prows(){
 $('#pr').innerHTML=db.products.filter(p=>(p.name+p.code).toLowerCase().includes(pf.toLowerCase())).map(p=>`<tr><td>${esc(p.code)}</td><td>${esc(p.name)}${p.imei?' <span class="tag">IMEI</span>':''}</td><td>${p.cat}</td><td class="r">${fmt(p.cost)}</td><td class="r">${fmt(p.price)}</td><td class="r ${p.stock<=p.min?'low':''}">${p.stock}</td><td class="r"><button class="btn g s" onclick="pform(${p.id})">Sửa</button> <button class="btn g s" onclick="pdel(${p.id})">Xóa</button></td></tr>`).join('')}
function pform(id){
 const p=id?prod(id):{code:'',name:'',cat:'Điện thoại',cost:0,price:0,stock:0,min:1,imei:false};
 modal(`<h3>${id?'Sửa':'Thêm'} hàng hóa</h3><label>Mã hàng</label><input id="f1" value="${esc(p.code)}"><label>Tên hàng</label><input id="f2" value="${esc(p.name)}"><label>Nhóm</label><select id="f3">${CATS.map(c=>`<option ${c==p.cat?'selected':''}>${c}</option>`).join('')}</select>
 <div class="row"><div><label>Giá vốn</label><input id="f4" type="number" value="${p.cost}"></div><div><label>Giá bán</label><input id="f5" type="number" value="${p.price}"></div></div>
 <div class="row"><div><label>Tồn kho</label><input id="f6" type="number" value="${p.stock}"></div><div><label>Cảnh báo khi tồn ≤</label><input id="f7" type="number" value="${p.min}"></div></div>
 <label><input id="f8" type="checkbox" style="width:auto" ${p.imei?'checked':''}> Quản lý theo IMEI / Serial (điện thoại)</label>
 <div class="row" style="margin-top:14px"><button class="btn g" onclick="close_()">Hủy</button><button class="btn" onclick="psave(${id||0})">Lưu</button></div>`)}
function psave(id){
 const o={code:V('f1').trim(),name:V('f2').trim(),cat:V('f3'),cost:N('f4'),price:N('f5'),stock:N('f6'),min:N('f7'),imei:$('#f8').checked};
 if(!o.name)return toast('Nhập tên hàng');
 if(!o.code)o.code='SP'+db.seq;
 if(id)Object.assign(prod(id),o);else db.products.push({id:nid(),...o});
 save();close_();products()}
function pdel(id){if(confirm('Xóa hàng hóa này?')){db.products=db.products.filter(p=>p.id!=id);save();products()}}

/* ---------- NHẬP HÀNG ---------- */
function imp(){
 $('#app').innerHTML=`<h2>Nhập hàng</h2><div class="card"><div class="row"><select id="i1">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} (tồn ${p.stock})</option>`).join('')}</select><input id="i2" type="number" min="1" placeholder="Số lượng"><input id="i3" type="number" placeholder="Giá nhập / cái"><input id="i4" placeholder="Nhà cung cấp"><button class="btn" onclick="idoit()">Nhập kho</button></div><small style="color:var(--mut)">Giá vốn được tính bình quân gia quyền sau mỗi lần nhập.</small></div>
 <div class="card wrap"><table><tr><th>Ngày</th><th>Hàng</th><th>NCC</th><th class="r">SL</th><th class="r">Giá nhập</th></tr>${db.imports.map(i=>`<tr><td>${new Date(i.date).toLocaleDateString('vi-VN')}</td><td>${esc(i.name)}</td><td>${esc(i.sup)}</td><td class="r">${i.qty}</td><td class="r">${fmt(i.cost)}</td></tr>`).join('')||'<tr><td colspan=5>Chưa có phiếu nhập.</td></tr>'}</table></div>`}
function idoit(){
 const p=prod(V('i1')),q=N('i2'),c=N('i3');
 if(!p||q<=0||c<=0)return toast('Nhập đủ số lượng và giá nhập');
 p.cost=(p.stock*p.cost+q*c)/(p.stock+q);p.stock+=q;
 db.imports.unshift({date:new Date().toISOString(),pid:p.id,name:p.name,qty:q,cost:c,sup:V('i4')});
 save();toast('Đã nhập kho');imp()}

/* ---------- KHÁCH HÀNG ---------- */
function custs(){
 $('#app').innerHTML=`<h2>Khách hàng</h2><div class="row"><button class="btn" onclick="cform()">+ Thêm khách</button></div><div class="card wrap"><table><tr><th>Tên</th><th>SĐT</th><th class="r">Công nợ</th><th></th></tr>${db.customers.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td class="r ${c.debt?'low':''}">${fmt(c.debt)}</td><td class="r">${c.debt?`<button class="btn s" onclick="pay(${c.id})">Thu nợ</button> `:''}<button class="btn g s" onclick="cform(${c.id})">Sửa</button></td></tr>`).join('')}</table></div>`}
function cform(id){
 const c=id?cust(id):{name:'',phone:''};
 modal(`<h3>${id?'Sửa':'Thêm'} khách hàng</h3><label>Tên</label><input id="c1" value="${esc(c.name)}"><label>Số điện thoại</label><input id="c2" value="${esc(c.phone)}"><div class="row" style="margin-top:14px"><button class="btn g" onclick="close_()">Hủy</button><button class="btn" onclick="csave(${id||0})">Lưu</button></div>`)}
function csave(id){
 if(!V('c1').trim())return toast('Nhập tên khách');
 if(id){cust(id).name=V('c1');cust(id).phone=V('c2')}else db.customers.push({id:nid(),name:V('c1'),phone:V('c2'),debt:0});
 save();close_();custs()}
function pay(id){
 const c=cust(id),a=+prompt('Số tiền khách trả (nợ hiện tại '+fmt(c.debt)+'):',c.debt);
 if(!a||a<=0)return;c.debt=Math.max(0,c.debt-a);save();toast('Đã thu '+fmt(a));custs()}

/* ---------- HÓA ĐƠN ---------- */
function invs(){
 $('#app').innerHTML=`<h2>Hóa đơn</h2><div class="card wrap"><table><tr><th>Mã</th><th>Thời gian</th><th>Khách</th><th class="r">Tổng</th><th class="r">Lợi nhuận</th><th class="r">Nợ</th><th></th></tr>${db.invoices.map(i=>`<tr><td>${i.id}</td><td>${new Date(i.date).toLocaleString('vi-VN')}</td><td>${esc(cust(i.cust)?.name||'Khách lẻ')}</td><td class="r">${fmt(i.total)}</td><td class="r ok">${fmt(i.profit)}</td><td class="r ${i.total>i.paid?'low':''}">${fmt(i.total-i.paid)}</td><td class="r"><button class="btn g s" onclick="receipt('${i.id}')">In</button></td></tr>`).join('')||'<tr><td colspan=7>Chưa có hóa đơn.</td></tr>'}</table></div>`}

/* ---------- DỮ LIỆU ---------- */
function data(){
 $('#app').innerHTML=`<h2>Sao lưu dữ liệu</h2><div class="card"><p>Dữ liệu lưu trong trình duyệt của máy này. Hãy tải bản sao lưu thường xuyên, và dùng file này để chuyển sang máy khác.</p><div class="row"><button class="btn" onclick="exp()">Tải bản sao lưu (.json)</button><input type="file" id="fi" accept=".json" onchange="impf(this)"><button class="btn d" onclick="if(confirm('Xóa toàn bộ dữ liệu và về dữ liệu mẫu?')){db=seed();save();go('dash')}">Đặt lại</button></div></div>`}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));a.download='sao-luu-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
function impf(el){const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.products)throw 0;db=d;save();toast('Đã khôi phục');go('dash')}catch(e){toast('File không hợp lệ')}};r.readAsText(f)}

/* ---------- ĐĂNG NHẬP (Supabase Auth) ---------- */
function loginUI(msg){
 $('#nav').style.display='none';
 $('#app').innerHTML=`<div class="card" style="max-width:360px;margin:12vh auto"><h2>Đăng nhập</h2><label>Email</label><input id="le" type="email" autocomplete="username"><label style="display:block;margin-top:8px">Mật khẩu</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key=='Enter')login()"><p class="low">${msg||''}</p><button class="btn" style="width:100%" onclick="login()">Đăng nhập</button></div>`}
async function login(){
 const {error}=await sb.auth.signInWithPassword({email:V('le').trim(),password:V('lp')});
 if(error)return loginUI('Sai email hoặc mật khẩu');
 start()}
async function start(){
 const {data:{session}}=await sb.auth.getSession();
 if(!session)return loginUI();
 uid=session.user.id;
 const r=await sb.from('store').select('data').eq('user_id',uid).maybeSingle();
 if(r.error)return loginUI('Không tải được dữ liệu: '+r.error.message);
 if(r.data&&r.data.data&&r.data.data.products){db=r.data.data;saveLocal()}else await push();
 $('#nav').style.display='';go('dash')}
async function logout(){await sb.auth.signOut();try{localStorage.removeItem('qlbh')}catch(e){}location.reload()}
function boot(){
 if(!CFG.url||!window.supabase)return loginUI('Chưa cấu hình Supabase (thiếu SUPABASE_CONFIG).');
 sb=window.supabase.createClient(CFG.url,CFG.key);start()}
boot();
