FROM nginx:alpine

# Copy game files to nginx html directory (.dockerignore excludes repo
# scaffolding and the particles prototype)
COPY . /usr/share/nginx/html

# Copy custom nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
