// Tạo js/config.js từ biến môi trường SUPABASE_CONFIG (JSON: {"url":"...","key":"..."})
const fs=require('fs');let c={};
try{c=JSON.parse(process.env.SUPABASE_CONFIG||'{}')}catch(e){console.error('SUPABASE_CONFIG không phải JSON hợp lệ');process.exit(1)}
if(!c.url||!c.key){console.error('Thiếu biến SUPABASE_CONFIG');process.exit(1)}
fs.writeFileSync('js/config.js','window.SUPABASE_CONFIG='+JSON.stringify(c)+';\n');
console.log('Đã tạo js/config.js');
