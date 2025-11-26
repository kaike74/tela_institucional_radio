# 🔧 CONFIGURAÇÃO DO CLOUDFLARE KV - PASSO A PASSO

## 📋 O QUE É KV?

Cloudflare KV (Key-Value) é um armazenamento global distribuído que permite:
- **Cache persistente** de dados entre requests
- **Resposta ultra-rápida** (<1s vs 8-30s sem cache)
- **Redução de custos** (menos chamadas à API Audiency)
- **Expiração automática** de dados antigos

## 🚀 CONFIGURAÇÃO INICIAL

### 1. Criar KV Namespace no Cloudflare Dashboard

1. Acesse: https://dash.cloudflare.com/
2. Clique em **Workers & Pages** no menu lateral
3. Clique na aba **KV**
4. Clique em **Create a namespace**
5. Nome sugerido: `dashboard-institucional-cache`
6. Copie o **Namespace ID** que será gerado

### 2. Vincular KV ao Worker

**Opção A: Via Dashboard (mais fácil)**
1. Vá em **Workers & Pages** > Seu worker
2. Clique em **Settings** > **Variables**
3. Na seção **KV Namespace Bindings**, clique em **Add binding**
4. Variable name: `DASHBOARD_KV`
5. KV namespace: Selecione `dashboard-institucional-cache`
6. Clique em **Save**

**Opção B: Via wrangler.toml**
1. Edite o arquivo `wrangler.toml`
2. Substitua `SEU_KV_NAMESPACE_ID_AQUI` pelo ID copiado
3. Faça deploy: `wrangler deploy`

```toml
[[kv_namespaces]]
binding = "DASHBOARD_KV"
id = "abc123def456..."  # Seu ID aqui
```

### 3. Verificar Configuração

Após configurar, o worker vai:
- ✅ Salvar dados no KV automaticamente
- ✅ Retornar dados do cache se disponíveis
- ✅ Logar no console: `💾 Cache encontrado!` ou `📭 Nenhum cache encontrado`

## 📊 COMO FUNCIONA O CACHE

### Chaves Usadas
```
insercoes-2025-11-26    # Inserções do dia 26/11/2025
insercoes-2025-11-27    # Inserções do dia 27/11/2025
```

### Fluxo de Cache

```
1ª Requisição (CACHE MISS):
  → Buscar campanhas API ✓ (30s)
  → Buscar inserções API ✓ (30s)
  → Buscar coordenadas ✓ (20s)
  → SALVAR no KV ✓
  → Retornar dados (TOTAL: ~8-30s)
  → Header: X-Cache-Status: MISS

2ª Requisição em diante (CACHE HIT):
  → Ler do KV ✓
  → Retornar dados (TOTAL: <1s) ⚡
  → Header: X-Cache-Status: HIT
```

### Expiração do Cache
- **Automática**: 24 horas (expirationTtl: 86400)
- **Reset diário**: À meia-noite o cache do dia anterior expira
- **Força refresh**: Se cache tem >2 minutos, worker refaz busca

## 🎯 BENEFÍCIOS

| Métrica | Sem Cache | Com Cache KV |
|---------|-----------|--------------|
| Tempo resposta | 8-30s | <1s |
| Requests API | Toda hora | 1x por 2min |
| Custo API | Alto | Baixo |
| Experiência TV | Lenta ❌ | Instantânea ✅ |

## 🔍 MONITORAMENTO

### Ver dados no KV (via Dashboard)
1. **Workers & Pages** > **KV**
2. Clique no namespace `dashboard-institucional-cache`
3. Veja todas as chaves armazenadas
4. Clique em uma chave para ver o JSON completo

### Ver dados no KV (via wrangler CLI)
```bash
# Listar todas as chaves
wrangler kv:key list --namespace-id=SEU_ID

# Ver valor de uma chave
wrangler kv:key get "insercoes-2025-11-26" --namespace-id=SEU_ID

# Deletar uma chave (forçar refresh)
wrangler kv:key delete "insercoes-2025-11-26" --namespace-id=SEU_ID
```

### Logs do Worker
```bash
# Ver logs em tempo real
wrangler tail

# Buscar por mensagens de cache
# Você verá:
# ✅ "💾 Cache encontrado! Idade: 45s"
# ✅ "💾 Dados salvos no cache KV: insercoes-2025-11-26"
# ⚠️ "📭 Nenhum cache encontrado"
```

## 🛠️ TROUBLESHOOTING

### Cache não está funcionando?

**1. Verificar se KV está vinculado**
```javascript
// No worker, verifica:
if (env.DASHBOARD_KV) {
    console.log("✅ KV disponível");
} else {
    console.log("❌ KV NÃO configurado");
}
```

**2. Verificar logs**
- Se aparece `⚠️ KV namespace não configurado` → KV não está vinculado
- Se aparece `📭 Nenhum cache encontrado` → É a primeira execução
- Se aparece `💾 Cache encontrado!` → Tudo funcionando ✅

**3. Forçar refresh do cache**
```bash
# Deletar cache manualmente
wrangler kv:key delete "insercoes-2025-11-26" --namespace-id=SEU_ID
```

**4. Verificar quota**
- KV Free Tier: 100k operações/dia
- Armazena até 1GB de dados
- Se exceder, worker vai continuar funcionando mas sem cache

## 📈 PRÓXIMOS PASSOS (OPCIONAL)

### Cache Avançado
- ✅ Cache incremental (append-only)
- ✅ Cache de coordenadas separado
- ✅ Invalidação inteligente

### Monitoramento
- Analytics de hit rate
- Dashboard de métricas KV
- Alertas de quota

---

**Status:** 🟢 Implementado e pronto para uso
**Última atualização:** 2025-11-26
