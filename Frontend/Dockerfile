FROM nginx:alpine

# Copy toàn bộ file React build vào container
COPY index.html /usr/share/nginx/html/
COPY vite.svg /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/

# Copy config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
