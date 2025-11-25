# Dashboard Institucional - Rádio 📻

Dashboard em tempo real otimizado para exibição em TV (1920x1080), exibindo métricas de campanhas de rádio com visualização geográfica no mapa do Brasil.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 🎯 Visão Geral

Sistema completo de dashboard institucional para monitoramento 24/7 de campanhas de rádio, com:

- **Frontend TV**: Dashboard otimizado para displays 1920x1080
- **Backend API**: Cloudflare Worker (não incluído neste repo)
- **Visualização Geográfica**: Mapa do Brasil com pings animados
- **Métricas em Tempo Real**: Auto-atualização a cada 2 minutos

## ✨ Características Principais

- ✅ **Zero Dependências**: HTML5 + CSS3 + JavaScript vanilla
- ✅ **Otimizado para TV**: Fontes grandes (24px+), alto contraste
- ✅ **Performance**: Hardware acceleration, <3s primeiro load
- ✅ **Inteligente**: Cache, retry automático, fallback robusto
- ✅ **Responsivo**: Layout adaptável para diferentes resoluções
- ✅ **Acessível**: ARIA labels, keyboard shortcuts

## 🚀 Quick Start

### 1. Configure o Endpoint da API

Edite `js/api.js` linha 11:

```javascript
API_BASE_URL: 'https://dashboard-institucional.SEU_USERNAME.workers.dev',
```

### 2. Teste Localmente

```bash
# Usando Python 3
python3 -m http.server 8080

# Ou Node.js
npx http-server -p 8080 -c-1

# Acesse: http://localhost:8080
```

### 3. Deploy no Cloudflare Pages

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy . --project-name=dashboard-tv

# Ou conecte seu repositório GitHub nas configurações do Cloudflare Pages
```

## 📊 Estrutura do Projeto

```
tela_institucional_radio/
├── index.html              # Dashboard principal
├── css/
│   ├── dashboard.css       # Layout base 1920x1080
│   ├── animations.css      # Pings e transições
│   └── tv-optimizations.css # Otimizações TV
├── js/
│   ├── api.js             # Client API (retry + cache)
│   ├── metrics.js         # Métricas em tempo real
│   ├── map.js             # Mapa Brasil + coordenadas
│   └── dashboard.js       # Controller principal
├── assets/
│   └── brasil.svg         # Mapa SVG otimizado
├── config.example.js      # Template configuração
├── README.md              # Este arquivo
└── README-FRONTEND.md     # Documentação detalhada
```

## 🎨 Layout Visual

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD INSTITUCIONAL          Última atualização    │
├────────────────────────────┬────────────────────────────┤
│                            │  📊 Campanhas do Mês: 48   │
│                            │  📻 Campanhas Ativas: 34   │
│      MAPA DO BRASIL        │  📡 Emissoras Ativas: 67   │
│                            │  🎯 Inserções Hoje: 554    │
│    • São Paulo ⚡          │  🏙️ Cidades Ativas: 33    │
│    • Rio de Janeiro ⚡     │                            │
│    • Brasília ⚡           │  📍 CIDADES ATIVAS         │
│    • Belo Horizonte ⚡     │   ├─ São Paulo             │
│                            │   ├─ Rio de Janeiro        │
│         60% WIDTH          │   ├─ Brasília              │
│                            │   └─ ...                   │
│                            │                            │
│                            │       40% WIDTH            │
└────────────────────────────┴────────────────────────────┘
```

## 📖 Documentação Completa

Para documentação detalhada sobre instalação, configuração e deploy, consulte:

📘 **[README-FRONTEND.md](./README-FRONTEND.md)**

Inclui:
- ⚙️ Configuração avançada (intervalos, timeouts, etc)
- 🖥️ Deploy em diversos ambientes (Nginx, Apache, Vercel, etc)
- 📺 Configuração TV Box/Smart TV/Raspberry Pi
- 🐛 Troubleshooting comum
- 🎨 Personalização de cores e layout
- 📊 Estrutura da API esperada

## 🔧 Configuração Rápida

### Intervalos de Atualização

Edite `js/dashboard.js`:

```javascript
const INTERVALS = {
    METRICS: 120000,      // 2 minutos - Métricas completas
    PINGS: 30000,         // 30 segundos - Pings no mapa
    TIMESTAMP: 1000,      // 1 segundo - Relógio
    HEALTH_CHECK: 300000, // 5 minutos - Health check API
};
```

### Cores do Dashboard

Edite `css/dashboard.css`:

```css
:root {
    --color-bg-primary: #0a0e27;
    --color-accent-primary: #00d4ff;
    --font-size-base: 24px;
    /* ... outras variáveis */
}
```

## 🎯 API Esperada

O dashboard espera o seguinte formato JSON do backend:

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
    }
  ]
}
```

## ⌨️ Atalhos de Teclado

- `F5` ou `Ctrl+R`: Refresh manual dos dados
- `Ctrl+Shift+C`: Limpar cache + refresh
- `Ctrl+Shift+D`: Debug info no console

## 🌐 Opções de Deploy

| Plataforma | Complexidade | Custo | Recomendado |
|------------|--------------|-------|-------------|
| **Cloudflare Pages** | Fácil | Gratuito | ⭐⭐⭐⭐⭐ |
| **GitHub Pages** | Fácil | Gratuito | ⭐⭐⭐⭐ |
| **Vercel** | Fácil | Gratuito | ⭐⭐⭐⭐ |
| **Nginx** | Médio | Variável | ⭐⭐⭐⭐⭐ |
| **Apache** | Médio | Variável | ⭐⭐⭐⭐ |

## 🐛 Problemas Comuns

### Dashboard não carrega métricas

```bash
# 1. Verifique o endpoint no console do browser (F12)
# 2. Teste o endpoint diretamente:
curl https://seu-worker.workers.dev/metricas

# 3. Verifique CORS no Cloudflare Worker
```

### Pings não aparecem

- Verifique se as coordenadas estão no formato correto (lat/lng)
- Confirme que estão dentro dos limites do Brasil
- Veja o console para warnings sobre coordenadas inválidas

## 📱 Compatibilidade

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ TV Boxes (Android com Chrome WebView)
- ✅ Smart TVs (WebOS, Tizen com browser moderno)

## 🏗️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapa**: SVG com gradientes e filtros
- **Animações**: CSS3 transforms + keyframes
- **API Client**: Fetch API com retry logic
- **Performance**: Hardware acceleration, GPU compositing

## 📈 Performance

- **Primeiro Load**: <3 segundos
- **Refresh Subsequente**: <1 segundo
- **Tamanho Total**: ~150KB (sem compressão)
- **SVG Map**: <50KB otimizado
- **API Cache**: 2 minutos (configurável)

## 🤝 Contribuindo

Este é um projeto interno. Para sugestões ou problemas:

1. Abra uma issue descrevendo o problema
2. Inclua logs do console do browser (F12)
3. Especifique ambiente (TV Box, browser, resolução)

## 📄 Licença

[Especifique a licença do projeto]

## 👥 Autores

Desenvolvido por [Seu Nome/Equipe]

---

**🚀 Pronto para exibição 24/7 em TV - Otimizado para confiabilidade e performance**

Para mais detalhes técnicos, consulte [README-FRONTEND.md](./README-FRONTEND.md)
