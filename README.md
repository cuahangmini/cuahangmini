# Quản lý cửa hàng điện thoại & linh kiện

Web app bán hàng kiểu KiotViet: bán hàng (POS), hàng hóa + IMEI, nhập kho, khách hàng + công nợ, hóa đơn, báo cáo, sao lưu. Cài được như app (PWA).

## Chạy thử trên máy
```bash
npx serve .
```
Mở http://localhost:3000

## Đưa lên GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/shop-manager.git
git push -u origin main
```

## Deploy lên Vercel
1. Vào https://vercel.com/new, chọn repo `shop-manager`.
2. Framework Preset: **Other**. Build Command và Output Directory: để trống.
3. Bấm **Deploy**. Mỗi lần `git push`, Vercel tự cập nhật.

## Cấu trúc
```
index.html      giao diện chính
css/style.css   giao diện
js/app.js       toàn bộ logic + dữ liệu
sw.js           chạy offline
manifest.json   cài như app
vercel.json     cấu hình Vercel
```

## Lưu ý dữ liệu
Dữ liệu lưu trong trình duyệt (localStorage) của từng máy. Vào mục **Dữ liệu** để tải bản sao lưu JSON định kỳ. Muốn nhiều máy dùng chung cần nối database (Supabase/Firebase).

## Đăng nhập + đồng bộ Supabase
1. Supabase > SQL Editor: chạy file `supabase/schema.sql`.
2. Supabase > Authentication > Users > Add user: nhập email + mật khẩu, tích Auto Confirm User.
3. Supabase > Authentication > Sign In / Providers > Email: tắt "Allow new users to sign up".
4. Vercel > Settings > Environment Variables: thêm `SUPABASE_CONFIG` = `{"url":"https://<ma-project>.supabase.co","key":"<anon key>"}` rồi Redeploy.
5. Chạy local: `SUPABASE_CONFIG='{"url":"...","key":"..."}' node build.js && npx serve .`

Không ghi mật khẩu vào code. Mật khẩu chỉ nằm trong Supabase.
