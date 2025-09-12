# Sử dụng Nginx để serve file build
FROM nginx:alpine

# Copy file build vào thư mục web root của Nginx
COPY dist /usr/share/nginx/html

# Copy file cấu hình nginx tuỳ chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]