# Deploy su Server con App Python Esistente

## 📋 Informazioni necessarie prima del deploy

Prima di procedere, raccogli queste informazioni sulla tua app Python esistente:

1. **Porta utilizzata**: `netstat -tlnp | grep python` o `ss -tlnp | grep python`
2. **Configurazione Nginx esistente**: `sudo nginx -T` o `ls -la /etc/nginx/sites-enabled/`
3. **Processo manager**: PM2, systemd, screen, etc.

## 🚀 Opzioni di configurazione

### **Opzione 1: App Angular principale + Python API**

- **Angular**: `http://your-ip/`
- **Python**: `http://your-ip/api/`
- **File da usare**: `nginx-multi-app.conf`

### **Opzione 2: Porte separate**

- **Angular**: `http://your-ip:80`
- **Python**: `http://your-ip:8080` (proxy alla 8501)
- **File da usare**: `nginx-separate-ports.conf`

### **Opzione 3: Sottodomini** (solo se hai un dominio)

- **Angular**: `http://finance.your-domain.com`
- **Python**: `http://app.your-domain.com`
- **File da usare**: `nginx-subdomain.conf`

### **Opzione 4: Ottimale per app su porta 8501** (Raccomandato per il tuo caso)

- **Angular**: `http://your-ip/` (porta 80)
- **Python**: `http://your-ip:8501` (rimane come ora)
- **File da usare**: `nginx-optimal.conf`

## ⚙️ Configurazione manuale (se preferisci non usare lo script automatico)

### 1. **Verifica configurazione esistente**

```bash
# Controlla porte in uso
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Controlla configurazione Nginx
sudo nginx -T
ls -la /etc/nginx/sites-enabled/
```

### 2. **Backup configurazione esistente**

```bash
sudo cp -r /etc/nginx/sites-available /etc/nginx/sites-available.backup
sudo cp -r /etc/nginx/sites-enabled /etc/nginx/sites-enabled.backup
```

### 3. **Deploy applicazione Angular**

```bash
# Crea directory per l'app Angular
sudo mkdir -p /var/www/smart-amortizer
sudo chown -R $USER:$USER /var/www/smart-amortizer

# Copia files e installa dipendenze
cd /var/www/smart-amortizer
npm install --production
npm run build:prod

# Avvia con PM2 sulla porta 4001
pm2 start ecosystem.config.js --env production
pm2 save
```

### 4. **Configura Nginx per entrambe le app**

#### **Per la configurazione multi-app** (Opzione 1):

```bash
# Modifica la configurazione per integrare l'app Angular
sudo nano /etc/nginx/sites-available/smart-amortizer

# Aggiungi le location per Angular mantenendo quelle per Python
# Usa nginx-multi-app.conf come riferimento

# Testa e ricarica
sudo nginx -t
sudo systemctl reload nginx
```

#### **Per porte separate** (Opzione 2):

```bash
# Crea nuova configurazione
sudo cp nginx-separate-ports.conf /etc/nginx/sites-available/smart-amortizer
sudo ln -s /etc/nginx/sites-available/smart-amortizer /etc/nginx/sites-enabled/

# Testa e ricarica
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Esempio di integrazione con app Python esistente

### Se la tua app Python è su Streamlit (porta 8501):

```nginx
# In nginx-multi-app.conf, assicurati che ci sia:
upstream python_app {
    server 127.0.0.1:8501;  # Porta della tua app Streamlit
}

location /api/ {
    proxy_pass http://python_app/;
    # ... resto della configurazione
}
```

### Se preferisci mantenere l'app Python sulla sua porta originale:

```nginx
# Usa nginx-optimal.conf
# Angular su porta 80, Python rimane su 8501
# Nessuna interferenza tra le app
```

## 🛠️ Troubleshooting

### **Conflitto di porte**

```bash
# Trova processi su porta 80
sudo lsof -i :80

# Se necessario, cambia porta dell'app Angular
# Modifica ecosystem.config.js -> PORT: 4002 (o altra porta libera)
```

### **Nginx non parte**

```bash
# Controlla errori
sudo nginx -t
sudo journalctl -u nginx -f

# Rimuovi configurazioni problematiche temporaneamente
sudo rm /etc/nginx/sites-enabled/conflicting-site
sudo systemctl reload nginx
```

### **App Angular non risponde**

```bash
# Controlla PM2
pm2 status
pm2 logs smart-amortizer

# Controlla se la porta è libera
sudo netstat -tlnp | grep 4001
```

## 📝 Checklist finale

- [ ] App Python esistente funziona ancora
- [ ] App Angular risponde su porta configurata
- [ ] Nginx route correttamente le richieste
- [ ] Firewall consente le porte necessarie
- [ ] PM2 configurato per restart automatico
- [ ] Backup della configurazione esistente fatto

## 🎯 URL finali

Dopo la configurazione:

- **Opzione 1**: `http://your-ip/` (Angular), `http://your-ip/api/` (Python)
- **Opzione 2**: `http://your-ip/` (Angular), `http://your-ip:8080/` (Python)
- **Opzione 3**: `http://finance.your-domain.com/` (Angular), `http://app.your-domain.com/` (Python)
- **Opzione 4**: `http://your-ip/` (Angular), `http://your-ip:8501/` (Python - come ora)
