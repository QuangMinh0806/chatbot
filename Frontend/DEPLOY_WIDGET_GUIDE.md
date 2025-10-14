# 🚀 Hướng dẫn Deploy Widget lên Production

## 📋 Checklist trước khi deploy

- ✅ File `widget.js` đã có trong thư mục `public/`
- ✅ Nginx config đã được cập nhật với CORS headers
- ✅ Backend đã chạy ở `https://chatbotbe.a2alab.vn`

## 🔧 Các bước Deploy Frontend

### Bước 1: Build Frontend

```bash
cd Frontend
npm run build
```

Sau khi build xong, file `widget.js` sẽ được copy vào thư mục `dist/`.

### Bước 2: Kiểm tra file trong dist

```bash
ls dist/
```

Đảm bảo có các file:
- `index.html`
- `widget.js` ← Quan trọng!
- `assets/`
- Các file khác...

### Bước 3: Deploy lên Server

#### Option 1: Dùng Docker (Khuyến nghị)

```bash
# Build Docker image
docker build -t chatbot-frontend .

# Run container
docker run -d -p 80:80 --name chatbot-fe chatbot-frontend

# Hoặc dùng docker-compose
docker-compose up -d frontend
```

#### Option 2: Deploy thủ công

```bash
# Copy dist folder lên server
scp -r dist/* user@server:/usr/share/nginx/html/

# Copy nginx config
scp nginx.conf user@server:/etc/nginx/sites-available/chatbot

# Restart nginx
ssh user@server "sudo systemctl restart nginx"
```

### Bước 4: Kiểm tra Deploy thành công

#### 1. Kiểm tra widget.js có tồn tại không:

Mở trình duyệt và truy cập:
```
https://chatbotfe.a2alab.vn/widget.js
```

**Kết quả mong đợi:**
- Thấy code JavaScript của widget
- **KHÔNG** thấy lỗi 404

#### 2. Kiểm tra CORS headers:

Mở Developer Tools (F12) → Network tab, reload trang và click vào `widget.js`:

**Response Headers phải có:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Content-Type: application/javascript
```

#### 3. Test nhúng vào website khác:

Tạo file HTML test:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Widget</title>
</head>
<body>
    <h1>Test Chatbot Widget</h1>
    
    <script 
        src="https://chatbotfe.a2alab.vn/widget.js"
        data-api-url="https://chatbotbe.a2alab.vn"
        data-ws-url="wss://chatbotbe.a2alab.vn"
    ></script>
</body>
</html>
```

Mở file này → Nút chat 💬 phải xuất hiện!

## 🐛 Troubleshooting

### Lỗi 1: 404 Not Found cho widget.js

**Nguyên nhân:**
- File không được copy vào dist khi build
- Nginx không serve file từ đúng thư mục

**Giải pháp:**

1. Kiểm tra file có trong dist không:
```bash
ls dist/widget.js
```

2. Nếu không có, copy thủ công:
```bash
cp public/widget.js dist/
```

3. Kiểm tra Vite config:

File `vite.config.js` phải có:
```javascript
export default defineConfig({
  // ... other config
  publicDir: 'public', // Đảm bảo public folder được copy
})
```

4. Rebuild:
```bash
npm run build
```

### Lỗi 2: CORS Error khi nhúng vào website khác

**Lỗi hiển thị:**
```
Access to script at 'https://chatbotfe.a2alab.vn/widget.js' from origin 'https://other-website.com' 
has been blocked by CORS policy
```

**Giải pháp:**

1. Đảm bảo nginx.conf đã có:
```nginx
location /widget.js {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

2. Restart nginx:
```bash
sudo systemctl restart nginx
```

3. Clear cache trình duyệt và thử lại

### Lỗi 3: Widget hiện nhưng không kết nối được

**Kiểm tra:**

1. Backend có chạy không:
```bash
curl https://chatbotbe.a2alab.vn/docs
```

2. WebSocket có hoạt động không:
```bash
# Dùng tool wscat
wscat -c wss://chatbotbe.a2alab.vn/chat/ws/customer?sessionId=1
```

3. Mở Console (F12) xem log:
```
✅ Connected to chat server  ← Thành công
❌ WebSocket error          ← Có lỗi
```

## 📦 Cấu trúc thư mục sau khi deploy

```
/usr/share/nginx/html/
├── index.html
├── widget.js          ← File này PHẢI có!
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
└── ...
```

## 🔄 Quy trình Update Widget

Khi sửa widget.js:

1. Sửa file `public/widget.js`
2. Build lại: `npm run build`
3. Deploy lên server
4. Clear CDN cache (nếu có)
5. Test lại trên website đã nhúng

## ✅ Checklist sau khi deploy xong

- [ ] `https://chatbotfe.a2alab.vn/widget.js` trả về code JavaScript
- [ ] Response headers có `Access-Control-Allow-Origin: *`
- [ ] Tạo file HTML test, nhúng widget → nút chat xuất hiện
- [ ] Gửi tin nhắn test → nhận được phản hồi từ bot
- [ ] Test trên nhiều browsers: Chrome, Firefox, Safari, Edge
- [ ] Test trên mobile

## 📝 Script tự động deploy (Optional)

Tạo file `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Bắt đầu deploy Frontend..."

# Build
echo "📦 Building..."
npm run build

# Kiểm tra widget.js
if [ ! -f "dist/widget.js" ]; then
    echo "❌ Lỗi: widget.js không có trong dist!"
    echo "📋 Copying widget.js..."
    cp public/widget.js dist/
fi

# Deploy với Docker
echo "🐳 Building Docker image..."
docker build -t chatbot-frontend .

echo "🔄 Stopping old container..."
docker stop chatbot-fe || true
docker rm chatbot-fe || true

echo "▶️ Starting new container..."
docker run -d -p 80:80 --name chatbot-fe chatbot-frontend

echo "✅ Deploy hoàn tất!"
echo "🔍 Kiểm tra: https://chatbotfe.a2alab.vn/widget.js"
```

Chạy:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🌐 CDN (Optional - Nâng cao)

Để tăng tốc độ load widget, có thể dùng CDN:

1. Upload `widget.js` lên CDN (Cloudflare, AWS CloudFront...)
2. Nhúng từ CDN:
```html
<script 
    src="https://cdn.example.com/widget.js"
    data-api-url="https://chatbotbe.a2alab.vn"
    data-ws-url="wss://chatbotbe.a2alab.vn"
></script>
```

## 📞 Support

Nếu gặp vấn đề khi deploy, cung cấp thông tin:
- Output của `npm run build`
- Log của nginx: `sudo tail -f /var/log/nginx/error.log`
- Screenshot lỗi trong Console (F12)
