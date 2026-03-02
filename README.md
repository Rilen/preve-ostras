# Preve-Ostras – Monitoramento de Resiliência Urbana em Rio das Ostras

## Visão Geral

Plataforma de inteligência preditiva que cruza dados demográficos (IBGE SIDRA),
meteorológicos (Open-Meteo) e maré simulada para gerar análises de resiliência
urbana e score turístico em tempo quase real.

---

## Estrutura do Projeto

```
preve-ostras/
├── functions/              # Cloud Functions (Python)
│   ├── main.py             # fetch_sidra_data | fetch_weather_data
│   └── requirements.txt    # Dependências Python
│
├── src/                    # Frontend React + TypeScript
│   ├── lib/
│   │   └── firebase.ts     # Inicialização Firebase + emuladores
│   ├── types/
│   │   └── index.ts        # Interfaces compartilhadas (SidraData, ResilienceAnalysis…)
│   ├── services/
│   │   └── dataService.ts  # Leitura Firestore + chamadas às Functions
│   ├── components/
│   │   ├── Dashboard.tsx       # Painel principal
│   │   ├── ResilienceMap.tsx   # Mapa interativo de resiliência (D3.js)
│   │   ├── TourismScore.tsx    # Score climático turístico
│   │   ├── RiskBulletin.tsx    # Boletim formal imprimível
│   │   └── charts/
│   │       └── SidraChart.tsx  # Gráfico D3 de crescimento populacional
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Design system (Tailwind + tokens CSS)
│
├── firebase.json           # Configuração Firebase + emuladores
├── .firebaserc             # Projeto ativo
├── .env.example            # Template de variáveis de ambiente
├── package.json
└── vite.config.ts
```

---

## Pré-requisitos

- Node.js ≥ 18
- Python ≥ 3.11
- Firebase CLI (`npm i -g firebase-tools`)
- Java (para o emulador do Firestore)

---

## Configuração Local

```bash
# 1. Instalar dependências do frontend
npm install

# 2. Criar o ambiente virtual e instalar dependências Python
cd functions
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cd ..

# 3. Copiar e preencher variáveis de ambiente
copy .env.example .env

# 4. Iniciar os emuladores do Firebase (em terminal separado)
firebase emulators:start

# 5. Iniciar o servidor de desenvolvimento
npm run dev
```

---

## Fontes de Dados

| Fonte | Dado | Coleção Firestore |
|---|---|---|
| IBGE SIDRA (Tabela 6579) | População estimada 2001–atual | `ibge_populacao` |
| Open-Meteo | Temperatura, precipitação, vento (30 dias) | `clima_historico` |
| Maré simulada | Algoritmo semi-diurno local | *(calculado em tempo real)* |

---

## Cloud Functions

| Função | Gatilho | Descrição |
|---|---|---|
| `fetch_sidra_data` | HTTPS Callable | Busca série histórica de população no IBGE |
| `fetch_weather_data` | HTTPS Callable | Busca dados meteorológicos no Open-Meteo |

---

## Tecnologias

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + D3.js
- **Backend**: Python 3.11 + firebase-functions + pandas
- **Banco**: Cloud Firestore (emulador local)
- **Infra**: Firebase Hosting + Cloud Functions
