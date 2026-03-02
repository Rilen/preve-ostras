<div align="center">

<br/>

# 🌊 PREVE-OSTRAS

### Sistema de Inteligência Territorial para Resiliência Urbana

**Análise preditiva em tempo quase real — Rio das Ostras / RJ**

<br/>

[![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-Online-FF6F00?style=flat-square&logo=firebase&logoColor=white)](https://preve-ostras.web.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![D3.js](https://img.shields.io/badge/D3.js-7.x-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)

<br/>

---

**[🌐 Acessar Demo ao Vivo](https://preve-ostras.web.app)** &nbsp;·&nbsp;
**[📋 Console Firebase](https://console.firebase.google.com/project/preve-ostras)** &nbsp;·&nbsp;
**[📖 Documentação das APIs](#-fontes-de-dados)**

---

</div>

<br/>

## 📌 Visão Geral

O **Preve-Ostras** é uma **plataforma de análise territorial** que cruza dados
demográficos, meteorológicos e de maré astronômica para gerar, em tempo quase
real, um **Índice de Risco de Resiliência Urbana** (0–100) e um **Score
Preditivo de Turismo** para o município de Rio das Ostras, litoral norte do Rio
de Janeiro.

O painel é otimizado para **telas Full HD (1920×1080)** e foi concebido como
uma ferramenta de apoio à decisão para gestores de defesa civil, planejamento
urbano e turismo.

<br/>

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 🗺️ **Mapa Tático de Risco** | 15 setores georeferenciados de Rio das Ostras com heatmap preditivo interativo (zoom + pan + tooltip) |
| 🌊 **Monitor de Maré** | Altura e tendência em tempo real com modelo semi-diurno simulado (ciclo ~12.42h) |
| 📊 **Saturação Acumulada** | Histórico dos 7 dias com modelo de decaimento exponencial (80%), visualizado em barras coloridas |
| 📈 **Crescimento Populacional** | Série histórica IBGE SIDRA com cálculo de tendência e variação percentual |
| ⚡ **Alertas Preditivos** | Geração automática de alertas por nível (baixo / médio / alto / crítico) com estimativa temporal |
| 🚗 **Mobilidade Viária** | Status das vias principais e impacto estimado por precipitação acumulada |
| 🏥 **Risco Epidemiológico** | Índice baseado em saturação e adensamento com alertas de doenças de veiculação hídrica |
| ⚡ **Infraestrutura** | Estabilidade elétrica e carga da rede de drenagem |
| 🎯 **Score de Turismo** | Gauge circular calculado a partir do índice de risco geral |
| 📋 **Boletim Formal** | Relatório imprimível / exportável para PDF com ID único, métricas técnicas e diretrizes de campo |

<br/>

## 🏗️ Arquitetura

```
┌─────────────────────────────────── BROWSER ──────────────────────────────────┐
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  PREVE-OSTRAS  ·  React 19 + TypeScript + Vite + D3.js + Tailwind v4   │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌──────────────────────────┐  ┌────────────────────┐ │ │
│  │  │ SidebarLeft │  │     ResilienceMap (D3)    │  │   SidebarRight    │ │ │
│  │  │  Maré       │  │  Grade Tática · Zoom/Pan  │  │  Turismo · Alerts │ │ │
│  │  │  Saturação  │  │  15 Setores · Scan Line   │  │  Mobilidade · Pop │ │ │
│  │  │  Saúde/Infra│  │  Tooltip · Glow Filter    │  │  Setor Crítico    │ │ │
│  │  └─────────────┘  └──────────────────────────┘  └────────────────────┘ │ │
│  │                                                                         │ │
│  │  src/lib/firebase.ts ── src/services/dataService.ts ── src/types/      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                           │                   │                              │
│                      fetch() direto       writeBatch()                       │
│                           │                   │                              │
└───────────────────────────┼───────────────────┼──────────────────────────────┘
                            │                   │
          ┌─────────────────┘       ┌───────────┘
          ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  APIs Públicas      │   │  Firebase (Plano Spark)       │
│                     │   │                               │
│  🏛️ IBGE SIDRA      │   │  Cloud Firestore              │
│   Tabela 6579       │   │  ├── ibge_populacao/{ano}     │
│   Município 3304524 │   │  └── clima_historico/{data}   │
│                     │   │                               │
│  🌦️ Open-Meteo      │   │  Firebase Hosting             │
│   30 dias · CORS    │   │  preve-ostras.web.app         │
└─────────────────────┘   └──────────────────────────────┘
```

> **Sem Cloud Functions.** As APIs públicas (IBGE e Open-Meteo) permitem CORS
> irrestrito, então o browser faz o fetch diretamente. O Firestore funciona
> como cache persistente. Não é necessário o plano Blaze do Firebase.

<br/>

## 🗂️ Estrutura de Diretórios

```
preve-ostras/
│
├── src/                              # Frontend React + TypeScript
│   ├── lib/
│   │   └── firebase.ts               # Inicialização Firebase + emuladores
│   │
│   ├── types/
│   │   └── index.ts                  # Contratos de dados (interfaces globais)
│   │
│   ├── services/
│   │   └── dataService.ts            # Firestore + fetch APIs + lógica de análise
│   │
│   ├── components/
│   │   ├── Dashboard.tsx             # Shell Full HD: topbar + 3 colunas
│   │   ├── SidebarLeft.tsx           # Maré · Saturação · Saúde · Infra
│   │   ├── SidebarRight.tsx          # Score · Alertas · Mobilidade · Pop
│   │   ├── ResilienceMap.tsx         # Mapa D3: zoom/pan/glow/scan/tooltip
│   │   ├── RiskBulletin.tsx          # Modal de boletim formal imprimível
│   │   ├── TourismScore.tsx          # (legado, substituído pelo SidebarRight)
│   │   └── charts/
│   │       └── SidraChart.tsx        # Gráfico D3 de crescimento populacional
│   │
│   ├── App.tsx                       # Ponto de entrada
│   ├── main.tsx                      # ReactDOM.createRoot
│   └── index.css                     # Design system (Tailwind + tokens CSS)
│
├── functions/                        # Cloud Functions Python (reservado para uso futuro)
│   ├── main.py                       # fetch_sidra_data | fetch_weather_data
│   └── requirements.txt              # firebase-functions, firebase-admin, pandas, requests
│
├── firestore.rules                   # Regras de segurança do Firestore
├── firebase.json                     # Configuração Firebase (Hosting + Firestore)
├── .firebaserc                       # Projeto ativo: preve-ostras
├── .env.example                      # Template de variáveis de ambiente
├── .gitignore                        # node_modules, dist, .env, venv
├── vite.config.ts                    # Vite + React + Tailwind plugins
├── tsconfig.app.json                 # TypeScript strict mode
└── package.json                      # Scripts e dependências
```

<br/>

## 🔬 Modelo de Análise de Resiliência

O núcleo da plataforma implementa um modelo quantitativo de risco com três
eixos principais:

### 1. Saturação Acumulada do Solo
```
sat[i] = sat[i-1] × 0.80 + precipitacao[i]
risco_acumulado = min(100, (sat / 50) × 100)
```
Modelo de decaimento exponencial simula a capacidade de absorção e drenagem do
solo, com constante de decaimento de 20% ao dia.

### 2. Multiplicador Demográfico
```python
pop_multiplier = 1.25 if tendencia == "crescente" else 1.0
```
Municípios em crescimento acelerado ampliam o fator de risco pela pressão sobre
a infraestrutura de drenagem e serviços de emergência.

### 3. Fator de Maré (setores costeiros)
```python
tide_factor = 1.30  # se altura > 1.2m E setor está na zona costeira
tide_factor = 1.00  # caso contrário
```
Setores C, G, M, N e O têm escoamento diretamente impactado pela maré alta,
que obstrui as saídas dos canais pluviais.

### Risco Final por Setor
```
risco_setor = min(100, sat_acumulada/40 × 100 × topo_factor × pop_mult × tide_factor)
```

<br/>

## 🌐 Fontes de Dados

| Fonte | Dado | Endpoint | Cache Firestore |
|---|---|---|---|
| **IBGE SIDRA** · Tabela 6579 | População estimada 2001–atual (Rio das Ostras) | `apisidra.ibge.gov.br` | `ibge_populacao/{ano}` |
| **Open-Meteo** | Temperatura máx., precipitação, vento máx. (últimos 30 dias) | `api.open-meteo.com` | `clima_historico/{data}` |
| **Maré simulada** | Modelo semi-diurno (ciclo 12.42h, amplitude 0.1–1.5m) | *calculado localmente* | — |

> Ambas as APIs são **gratuitas, abertas e CORS-habilitadas** — não requerem
> autenticação nem chave de API.

<br/>

## 🚀 Setup Local

### Pré-requisitos
- **Node.js** ≥ 18
- **Python** ≥ 3.11 (opcional, apenas para Cloud Functions)
- **Firebase CLI** → `npm install -g firebase-tools`
- **Java** ≥ 11 (para o emulador do Firestore)

### Instalação

```bash
# 1. Clonar e instalar dependências
git clone https://github.com/SEU_USUARIO/preve-ostras.git
cd preve-ostras
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua API key do Firebase (opcional para dev local)

# 3. Iniciar o emulador do Firestore (terminal separado)
firebase emulators:start --only firestore

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no browser.

### Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Bundle de produção otimizado |
| `npm run preview` | Pré-visualização do build local |
| `npx tsc --noEmit` | Verificação de tipos TypeScript |
| `firebase emulators:start` | Emuladores locais do Firebase |

<br/>

## ☁️ Deploy em Produção

O projeto usa **Firebase Hosting** (CDN global) + **Firestore** (banco de dados).
Não requer Cloud Functions — o plano **Spark (gratuito)** é suficiente.

```bash
# Build de produção
npm run build

# Deploy de tudo (Hosting + Regras Firestore)
firebase deploy

# Deploy parcial
firebase deploy --only hosting        # só o frontend
firebase deploy --only firestore:rules # só as regras
```

### URLs de Produção

| Serviço | URL |
|---|---|
| 🌐 Aplicação | [https://preve-ostras.web.app](https://preve-ostras.web.app) |
| 🖥️ Console | [https://console.firebase.google.com/project/preve-ostras](https://console.firebase.google.com/project/preve-ostras) |

<br/>

## 🔐 Segurança do Firestore

As regras em `firestore.rules` permitem leitura e escrita pública apenas nas
coleções de **dados governamentais abertos**. Qualquer outra coleção é negada
por padrão.

```javascript
// ibge_populacao e clima_historico → leitura e escrita pública (dados abertos)
// Todas as demais coleções          → deny all
```

> Em uma versão futura com autenticação Firebase Auth, a escrita será
> restringida a usuários autenticados.

<br/>

## 🛠️ Stack Técnica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework de UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 7.x | Build tool + HMR |
| D3.js | 7.x | Visualizações e mapa tático |
| Tailwind CSS | v4 | Design system utilitário |
| Inter / JetBrains Mono | — | Tipografia (Google Fonts) |

### Backend / Infra
| Tecnologia | Versão | Uso |
|---|---|---|
| Firebase Hosting | — | CDN e servir o SPA |
| Cloud Firestore | — | Cache persistente de dados |
| Python | 3.11 | Cloud Functions (futuro) |
| firebase-functions | 0.4 | Decorators de Cloud Functions |
| pandas | 2.2 | Processamento de dados no backend |

<br/>

## 📡 Layout da Interface

```
┌──────────────────────────────────────────────── TOPBAR (64px) ──────────────────────────────────────────────┐
│ 🌊 PREVE-OSTRAS  RDO / RESILIÊNCIA / MAPA ATIVO         [● OPERAÇÃO NORMAL]   21:25:47  [⚡ Sincronizar]   │
└──────────────────┬─────────────────────────────────────────────────────────┬──────────────────────────────────┘
                   │                                                         │
│  SIDEBAR LEFT    │                  MAPA CENTRAL                          │    SIDEBAR RIGHT    │
│  320px           │              (área flexível 1fr)                       │    360px            │
│                  │                                                         │                     │
│  ● Maré 0.83m    │        ·   ·   ·   ·   ·   RIO DAS OSTRAS   ·   ·    │  ⊙ Score Turismo    │
│    enchendo      │       ·  [A]   ·   ·   ·   22°31'S  41°56'O ·   ·    │    85/100           │
│                  │      ·  ·  · [K]·   ·  [E]·   · [F] ·   ·   ·   ·   │                     │
│  ▊▊▊▊▊▊▊ Sat    │     · · · · · · · · · [B]· · · · · · · · · · · ·     │  🚨 Alertas (2)     │
│  7 dias hist.    │    · · [I]· · · · [A]· · [C]· · [G]· · · [N]· ·     │  ● Maré alta...     │
│                  │   · · · · · · · · · · · · · · · · · · · [O]· ·       │  ● Saturação...     │
│  115.2mm pico    │    · · · · · [J]· · · · · · · · · · · · · ·          │                     │
│  48.6mm/dia      │     · · · · · · · · · · [D]· · [H]· · [L]·           │  🚗 Mobilidade ALERTA│
│                  │      · · · · · · [M]· · · · · · · · · · ·             │  \/\/\/ barras      │
│  Risco Epidem.   │       · · · · · · · · · · · · · · · ·                 │                     │
│  32% ✓           │                                                         │  📈 178.3 mil hab.  │
│                  │           ┌──────────────────────────────┐              │  ▲ 2.4% vs. 2022    │
│  ⚡ Elétrica     │           │  Índice Global   45.2 / 100  │              │                     │
│  ████░░░ 88%     │           └──────────────────────────────┘              │  ⚠ Setor N  68%    │
└──────────────────┘ LAT 22°31′S  LON 41°56′O                               └─────────────────────┘
```

<br/>

## 🗺️ Setores de Monitoramento

| Setor | Bairros | Fator de Risco Primário |
|---|---|---|
| A | Bosque / Recanto | Adensamento |
| B | Operário / Casa Grande | Adensamento |
| C | Centro / Boca da Barra | Topografia Crítica + Maré |
| D | Nova Esperança | Topografia Crítica |
| E | Nova Cidade / Village | Topografia Crítica |
| F | Jardim Mariléa | Adensamento |
| G | Costazul / Colinas | Influência de Maré |
| H | Âncora / Village | Monitoramento |
| I | Rocha Leão | Monitoramento |
| J | Cantagalo | Monitoramento |
| K | Serramar / Palmital | Adensamento |
| L | Mar do Norte | Monitoramento |
| M | Costa Praiana / Beira Mar | Topografia Crítica + Maré |
| N | Ouro Verde / Recreio | **Topografia Crítica** (maior risco) |
| O | Enseada / Terra Firme | Influência de Maré |

<br/>

## 🔮 Roadmap

- [ ] **Autenticação Firebase Auth** para restringir escrita no Firestore
- [ ] **Histórico de eventos** — log de alertas passados com timeline
- [ ] **Integração com a Marinha do Brasil** para dados reais de maré (DIMH)
- [ ] **Notificações push** via Firebase Cloud Messaging ao cruzar limiares
- [ ] **Export em GeoJSON** dos setores para integração com ArcGIS / QGIS
- [ ] **API REST interna** via Cloud Functions (quando migrar para plano Blaze)
- [ ] **Comparativo histórico** entre eventos de chuva passados

<br/>

---

<div align="center">

**Preve-Ostras** · Desenvolvido para Gestão de Resiliência Urbana

Rio das Ostras · RJ · Brasil · © 2025

*Dados fornecidos por IBGE, Open-Meteo e Marinha do Brasil.*
*Este sistema é uma ferramenta de apoio à decisão — não substitui protocolos oficiais de defesa civil.*

</div>
