#!/bin/sh

echo "$EVANUPIO_SSL_CRT" | sed 's/\\n/\n/g' > evanup.io.crt
echo "$EVANUPIO_SSL_KEY" | sed 's/\\n/\n/g' > evanup.io.key
echo "$SDFPARTY_SSL_CRT" | sed 's/\\n/\n/g' > sdf.party.crt
echo "$SDFPARTY_SSL_KEY" | sed 's/\\n/\n/g' > sdf.party.key
 
cat > nginx.conf <<EOF
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include            mime.types;
    default_type       application/octet-stream;
	gzip               on;
	gzip_comp_level    5;
	gzip_min_length    256;
	gzip_proxied	   any;
	gzip_vary          on;
	gzip_types
	  application/atom+xml
	  application/javascript
	  application/json
	  application/rss+xml
	  application/vnd.ms-fontobject
	  application/x-font-ttf
	  application/x-web-app-manifest+json
	  application/xhtml+xml
	  application/xml
	  application/octet-stream
	  font/opentype
	  image/svg+xml
	  image/x-icon
	  text/css
	  text/plain
	  text/x-component;

	upstream signalhub {
	  server 127.0.0.1:8080;
	}

    server {
        listen       80;
        server_name  sdf.party;
		return       301 https://\$host\$request_uri;
    }

	server {
		listen       443 ssl;
		server_name  sdf.party;
		keepalive_timeout  0;
		ssl_certificate      sdf.party.crt;
		ssl_certificate_key  sdf.party.key;
		location / {
            proxy_pass                http://signalhub;
            proxy_set_header          X-Forwarded-For \$remote_addr;
            proxy_http_version        1.1;
			proxy_buffering off;
			proxy_request_buffering   off;
			client_max_body_size 0;
		}
	}

    server {
        listen       80 default_server;
        server_name  evanup.io;
		sendfile             on;
		keepalive_timeout    65;
        location / {
            root   /usr/share/nginx/html;
            index  index.html;
        }
    }

    server {
        listen               443 default ssl;
        server_name          evanup.io;
		sendfile             on;
		keepalive_timeout    65;
		ssl_certificate      evanup.io.crt;
		ssl_certificate_key  evanup.io.key;
        location / {
            root   /usr/share/nginx/html;
            index  index.html;
        }
    }
}
EOF
