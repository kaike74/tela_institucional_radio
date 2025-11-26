# 🔍 INVESTIGAÇÃO: DELAY DE 1H NA API AUDIENCY

## 🎯 PROBLEMA RELATADO

**Sintoma:** Dashboard mostra inserções com 1 hora de atraso
- Às 17:00h → Dashboard só mostra inserções até 16:00h
- Às 18:00h → Dashboard só mostra inserções até 17:00h

## 📊 ENDPOINT ATUAL

```
GET https://api.audiency.io/advertiser-rest/reports/common/advertiser-execution
```

### Parâmetros Atuais (worker.js:69)
```javascript
page=1
limit=1000
countryId=1
campaignId=${campanha.id}
stationDate=${dataHoje}  // Exemplo: 2025-11-26
stationDate=${dataHoje}  // Repetido (range de datas)
```

## 🔎 ANÁLISE DO PROBLEMA

### Hipótese Principal
A API pode estar:
1. **Processando dados em lotes** (batches horários)
2. **Retornando apenas dados "finalizados"** da hora anterior
3. **Usando timezone diferente** (UTC vs America/Sao_Paulo)
4. **Tendo delay de processamento** interno de ~1h

### Código Atual Problemático
```javascript
const dataHoje = hoje.toISOString().split('T')[0]; // "2025-11-26"
const execUrl = `...&stationDate=${dataHoje}&stationDate=${dataHoje}`;
```

❌ **Problema:** Não inclui hora/minuto, pode estar retornando apenas dados "fechados"

## 🧪 TESTES PROPOSTOS

### Teste 1: Incluir Hora no stationDate
```javascript
// Opção A: ISO com hora
const dataHoraAtual = hoje.toISOString(); // "2025-11-26T17:30:00.000Z"

// Opção B: Data + Hora formatada
const dataHoraFormatada = `${dataHoje} ${hora}:${minuto}:00`;

// Opção C: Timestamp Unix
const timestamp = Math.floor(hoje.getTime() / 1000);
```

### Teste 2: Ajustar Timezone
```javascript
// Converter para timezone Brasil (UTC-3)
const brasilTime = new Date(hoje.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
}));
```

### Teste 3: Buscar Dados "Futuros"
```javascript
// Adicionar 2 horas ao range para compensar delay
const dataFutura = new Date();
dataFutura.setHours(dataFutura.getHours() + 2);
```

### Teste 4: Verificar Parâmetros Alternativos
Testar se existem outros parâmetros:
- `executionTime` ou `insertionTime`
- `realtime=true` ou `includePending=true`
- `fromDate` e `toDate` separados com hora

## 📝 POSSÍVEIS SOLUÇÕES

### Solução 1: Modificar Parâmetros de Data
```javascript
// worker.js - linha 69
const agora = new Date();
const dataInicio = agora.toISOString().split('T')[0]; // Hoje 00:00
const horaAtual = agora.toISOString(); // Agora com hora

const execUrl = `https://api.audiency.io/advertiser-rest/reports/common/advertiser-execution?page=1&limit=1000&countryId=1&campaignId=${campanha.id}&stationDate=${dataInicio}&executionTime=${horaAtual}`;
```

### Solução 2: Buscar Range Mais Amplo
```javascript
// Buscar das últimas 2 horas até agora
const duasHorasAtras = new Date();
duasHorasAtras.setHours(duasHorasAtras.getHours() - 2);

const dataInicio = duasHorasAtras.toISOString();
const dataFim = new Date().toISOString();
```

### Solução 3: Polling Mais Frequente + Cache Incremental
```javascript
// Fazer requests a cada 5-10 minutos
// Cachear inserções já vistas
// Apenas adicionar novas ao cache
```

## ⚠️ LIMITAÇÕES CONHECIDAS

1. **Documentação da API não disponível** - Não sabemos todos os parâmetros suportados
2. **Rate limiting** - Muito requests podem causar bloqueio
3. **Processamento da API** - Delay pode ser intencional/estrutural

## 🎬 PRÓXIMOS PASSOS

### Fase 1: Testes Manuais (15 min)
1. Fazer request direto via Postman/curl com diferentes formatos de data
2. Testar com hora incluída
3. Testar com timezone Brasil
4. Documentar comportamento real

### Fase 2: Implementação (30 min)
1. Aplicar melhor solução encontrada no worker.js
2. Adicionar logging detalhado de timestamps
3. Testar em produção

### Fase 3: Monitoramento (Contínuo)
1. Comparar timestamp de inserção vs timestamp de exibição
2. Medir delay real médio
3. Ajustar estratégia se necessário

## 🔧 COMANDO DE TESTE MANUAL

```bash
# Teste 1: Com data simples (atual)
curl "https://api.audiency.io/advertiser-rest/reports/common/advertiser-execution?page=1&limit=10&countryId=1&campaignId=XXXXX&stationDate=2025-11-26&stationDate=2025-11-26" \
  -H "apiKey: 9620cf74-856d-40c2-a091-248e4f322caa"

# Teste 2: Com datetime ISO
curl "https://api.audiency.io/advertiser-rest/reports/common/advertiser-execution?page=1&limit=10&countryId=1&campaignId=XXXXX&stationDate=2025-11-26T17:30:00&stationDate=2025-11-26T17:30:00" \
  -H "apiKey: 9620cf74-856d-40c2-a091-248e4f322caa"

# Teste 3: Com timezone
curl "https://api.audiency.io/advertiser-rest/reports/common/advertiser-execution?page=1&limit=10&countryId=1&campaignId=XXXXX&stationDate=2025-11-26T17:30:00-03:00&stationDate=2025-11-26T17:30:00-03:00" \
  -H "apiKey: 9620cf74-856d-40c2-a091-248e4f322caa"
```

## 📌 CONCLUSÕES PRELIMINARES

Sem acesso à documentação oficial da API Audiency, as opções são:

1. **Aceitar o delay de 1h** como limitação da API
2. **Testar diferentes formatos** de parâmetros para ver se há algum que retorna dados mais recentes
3. **Implementar cache incremental** para minimizar impacto do delay
4. **Adicionar disclaimer** no dashboard: "Dados com até 1h de delay"

---

**Status:** 🟡 Investigação em andamento
**Prioridade:** ALTA
**Responsável:** Sistema (aguardando testes manuais do cliente)
