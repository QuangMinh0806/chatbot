FROM nginx:alpine

# Copy chỉ file build React/Vite
COPY index.html /usr/share/nginx/html/
COPY vite.svg /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/

# Copy config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
