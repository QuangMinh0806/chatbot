FROM nginx:alpine

COPY assets /usr/share/nginx/html/
COPY index.html /usr/share/nginx/html/
COPY vite.svg /usr/share/nginx/html/


COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
