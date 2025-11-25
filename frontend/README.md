# Dashboard Institucional - Frontend TV

Dashboard em tempo real otimizado para exibição em TV (1920x1080), exibindo métricas de campanhas de rádio com visualização geográfica no mapa do Brasil.

## 🎯 Características

- **Otimizado para TV**: Layout 1920x1080 com fontes grandes e alto contraste
- **Tempo Real**: Atualização automática a cada 2 minutos
- **Visualização Geográfica**: Mapa do Brasil com pings animados nas cidades ativas
- **Performance**: Vanilla JS (zero frameworks), otimizado para TV browsers
- **Auto-refresh Inteligente**: Sistema de cache e retry automático
- **Zero Dependências**: HTML5 + CSS3 + JavaScript puro

## 📋 Requisitos

- **Backend**: Cloudflare Worker funcionando (endpoint `/metricas`)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+ (ou TV Box com Chrome WebView)
- **Servidor Web**: Qualquer servidor HTTP estático (nginx, Apache, http-server, etc.)
- **Resolução**: 1920x1080 (Full HD)

## 🚀 Instalação Rápida

### 1. Clone/Download do Projeto

```bash
git clone <repository-url>
cd frontend/
```

### 2. Configure o Endpoint da API

Edite o arquivo `js/api.js` e atualize a URL do Cloudflare Worker:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://dashboard-institucional.SEU_USERNAME.workers.dev',
    // ... outras configurações
};
```

**IMPORTANTE**: Substitua `SEU_USERNAME` pelo seu username do Cloudflare Workers.

### 3. Servidor de Desenvolvimento Local

#### Opção A: Python (recomendado para testes rápidos)

```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

#### Opção B: Node.js (http-server)

```bash
# Instalar http-server globalmente
npm install -g http-server

# Executar servidor
http-server -p 8080 -c-1
```

#### Opção C: PHP

```bash
php -S localhost:8080
```

Acesse: `http://localhost:8080`

## 📦 Deploy em Produção

### Deploy em Nginx

```nginx
server {
    listen 80;
    server_name dashboard.example.com;

    root /var/www/dashboard-frontend;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # Cache static assets
    location ~* \.(css|js|svg)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # HTML not cached
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Deploy em Apache

Crie um arquivo `.htaccess`:

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 day"
    ExpiresByType application/javascript "access plus 1 day"
    ExpiresByType image/svg+xml "access plus 1 day"
</IfModule>

# Security headers
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
```

### Deploy em Cloudflare Pages

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler

# 2. Login no Cloudflare
wrangler login

# 3. Criar projeto Pages
wrangler pages project create dashboard-frontend

# 4. Deploy
wrangler pages publish . --project-name=dashboard-frontend
```

### Deploy em GitHub Pages

```bash
# 1. Criar branch gh-pages
git checkout -b gh-pages

# 2. Commit e push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# 3. Configurar no GitHub:
# Settings > Pages > Source: gh-pages branch
```

### Deploy em Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

## 🖥️ Configuração para TV Box

### 1. TV Box Android

1. Instale um browser moderno (Chrome, Firefox, Kiwi Browser)
2. Configure para abrir automaticamente no boot:
   - Instale app "Fully Kiosk Browser" ou similar
   - Configure URL: `http://seu-servidor:8080`
   - Ative modo kiosk (tela cheia sem controles)

3. Configurações recomendadas:
   - Desabilitar sleep/screen timeout
   - Desabilitar notificações
   - Configurar resolução para 1920x1080

### 2. Smart TV (WebOS, Tizen)

1. Use o browser nativo da TV
2. Adicione o URL aos favoritos
3. Configure como página inicial (se possível)

### 3. Raspberry Pi

```bash
# Instalar Chromium em modo kiosk
sudo apt-get update
sudo apt-get install chromium-browser unclutter

# Criar script de autostart
nano ~/start_dashboard.sh

# Adicionar:
#!/bin/bash
unclutter &
chromium-browser --kiosk --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  http://localhost:8080

# Tornar executável
chmod +x ~/start_dashboard.sh

# Adicionar ao autostart
nano ~/.config/lxsession/LXDE-pi/autostart
# Adicionar linha:
@/home/pi/start_dashboard.sh
```

## ⚙️ Configurações Avançadas

### Intervalos de Atualização

Edite `js/dashboard.js` para ajustar os intervalos:

```javascript
const INTERVALS = {
    METRICS: 120000,      // Métricas completas (2 minutos)
    PINGS: 30000,         // Pings no mapa (30 segundos)
    TIMESTAMP: 1000,      // Relógio (1 segundo)
    HEALTH_CHECK: 300000, // Health check (5 minutos)
};
```

### Timeout e Retry

Edite `js/api.js`:

```javascript
const CONFIG = {
    TIMEOUT: 10000,       // Timeout por requisição (10s)
    RETRY_ATTEMPTS: 3,    // Número de tentativas
    RETRY_DELAY: 2000,    // Delay entre tentativas (2s)
    CACHE_DURATION: 120000, // Duração do cache (2min)
};
```

### Modo Debug

Pressione `Ctrl+Shift+D` no dashboard para ver informações de debug no console.

### Atalhos de Teclado

- `F5` ou `Ctrl+R`: Refresh manual
- `Ctrl+Shift+C`: Limpar cache e refresh
- `Ctrl+Shift+D`: Mostrar debug info

## 🎨 Personalização

### Cores e Temas

Edite as variáveis CSS em `css/dashboard.css`:

```css
:root {
    --color-bg-primary: #0a0e27;
    --color-accent-primary: #00d4ff;
    /* ... outras cores */
}
```

### Tamanho das Fontes

```css
:root {
    --font-size-base: 24px;
    --font-size-xl: 48px;
    /* ... outros tamanhos */
}
```

### Layout (Proporções Mapa/Sidebar)

```css
:root {
    --map-width: 60%;
    --sidebar-width: 40%;
}
```

## 🐛 Troubleshooting

### Dashboard não carrega métricas

1. Verifique se o endpoint da API está correto em `js/api.js`
2. Abra o console do browser (F12) e verifique erros
3. Teste o endpoint diretamente: `curl https://seu-worker.workers.dev/metricas`
4. Verifique CORS no Cloudflare Worker

### Pings não aparecem no mapa

1. Verifique se as coordenadas estão no formato correto:
   ```json
   {
     "coordenadas": [
       {"cidade": "São Paulo", "lat": -23.5505, "lng": -46.6333}
     ]
   }
   ```
2. Verifique se as coordenadas estão dentro dos limites do Brasil
3. Abra console e procure por warnings sobre coordenadas inválidas

### Performance ruim na TV

1. Reduza os intervalos de atualização
2. Desabilite animações complexas em `css/animations.css`
3. Ative modo de performance no browser da TV
4. Verifique se a TV suporta hardware acceleration

### Mapa não carrega

1. Verifique se o arquivo `assets/brasil.svg` existe
2. O sistema tem fallback para mapa inline automático
3. Verifique permissões de leitura do arquivo SVG

## 📊 Estrutura da API Esperada

O dashboard espera que o endpoint retorne o seguinte formato JSON:

```json
{
  "metricas": {
    "campanhasDoMes": 48,
    "campanhasAtivasHoje": 34,
    "emissorasAtivasHoje": 67,
    "insercoesHoje": 554,
    "cidadesAtivasHoje": 33
  },
  "coordenadas": [
    {
      "cidade": "São Paulo",
      "lat": -23.5505,
      "lng": -46.6333
    },
    {
      "cidade": "Rio de Janeiro",
      "lat": -22.9068,
      "lng": -43.1729
    }
  ]
}
```

## 📁 Estrutura de Arquivos

```
frontend/
├── index.html              # HTML principal
├── css/
│   ├── dashboard.css       # Layout e estilos base
│   ├── animations.css      # Animações e transições
│   └── tv-optimizations.css # Otimizações TV
├── js/
│   ├── api.js             # Client HTTP para API
│   ├── metrics.js         # Gerenciador de métricas
│   ├── map.js             # Gerenciador do mapa
│   └── dashboard.js       # Controller principal
├── assets/
│   └── brasil.svg         # Mapa SVG do Brasil
└── README.md              # Esta documentação
```

## 🔧 Manutenção

### Logs

O dashboard registra logs detalhados no console do browser. Para monitorar:

```javascript
// No console do browser
Dashboard.getStats()  // Ver estatísticas
DashboardAPI.getCacheStatus()  // Ver status do cache
```

### Atualizações

Para atualizar o dashboard:

1. Faça backup dos arquivos de configuração (especialmente `js/api.js`)
2. Substitua os arquivos novos
3. Restaure suas configurações personalizadas
4. Teste em ambiente de desenvolvimento primeiro
5. Deploy em produção

## 📝 Licença

[Insira sua licença aqui]

## 🤝 Suporte

Para problemas ou dúvidas:
- Abra uma issue no repositório
- Consulte os logs do browser (F12)
- Verifique a documentação do Cloudflare Worker

---

**Desenvolvido para exibição 24/7 em TV - Otimizado para performance e confiabilidade** 🚀
