#!/bin/bash

# Script de déploiement VPS pour NutriCoach
# Usage: ./scripts/deploy-vps.sh your-server.com

if [ -z "$1" ]; then
    echo "Usage: $0 <server-hostname>"
    exit 1
fi

SERVER=$1
APP_NAME="nutricoach"
APP_DIR="/opt/$APP_NAME"

echo "🚀 Déploiement de NutriCoach sur $SERVER"

# 1. Upload des fichiers
echo "📦 Upload des fichiers..."
rsync -avz --exclude node_modules --exclude .git --exclude .next . root@$SERVER:$APP_DIR/

# 2. Connexion SSH et build
ssh root@$SERVER << EOF
    cd $APP_DIR
    
    # Install dependencies
    echo "📦 Installation des dépendances..."
    npm ci
    
    # Build application
    echo "🔨 Build de l'application..."
    npm run build
    
    # Create systemd service
    echo "⚙️ Configuration du service..."
    cat > /etc/systemd/system/$APP_NAME.service << EOL
[Unit]
Description=NutriCoach Next.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOL

    # Enable and start service
    systemctl daemon-reload
    systemctl enable $APP_NAME
    systemctl restart $APP_NAME
    
    # Setup nginx reverse proxy
    echo "🌐 Configuration Nginx..."
    cat > /etc/nginx/sites-available/$APP_NAME << EOL
server {
    listen 80;
    server_name $SERVER;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    echo "✅ Déploiement terminé!"
    echo "🌐 Application disponible sur: http://$SERVER"
    
EOF