FROM nginx:alpine

# copy toàn bộ React build
COPY . /usr/share/nginx/html/

# copy config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
