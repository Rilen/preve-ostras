<div align="center">

# 🌊 PREVE-OSTRAS
### Sistema de Inteligência Territorial para Resiliência Urbana

**Monitoramento Preditivo · Rio das Ostras / RJ**

[![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-Online-FF6F00?style=flat-square&logo=firebase&logoColor=white)](https://preve-ostras.web.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)

<br/>

> **"Da maré astronômica ao índice de risco — Inteligência de alta densidade em uma única tela."**

<br/>

**[🌐 Acessar App em Produção →](https://preve-ostras.web.app)**

</div>

---

## 📸 Interface Cockpit (Multi-Screen)

O **Preve-Ostras** utiliza um design de **"Cockpit de Alta Densidade"**, inspirado em centros de controle tático. A interface foi reformulada para ser:
- **Visualmente Confortável em TVs de 42"** (Modo Horizontal): Layout de 3 colunas simultâneas.
- **Responsiva em Dispositivos Móveis** (Modo Vertical): Empilhamento inteligente com ícones e labels compactos.
- **Informação Densa**: Texto, ícones e figuras otimizados para máxima visibilidade sem poluição visual.

---

## 📌 O que é o Preve-Ostras?

Plataforma de **análise territorial preditiva** para o município de Rio das Ostras (RJ). O sistema integra dados de **maré astronômica**, **precipitação**, **população (IBGE)** e **topografia** para antecipar impactos urbanos:

| Indicador | Propósito |
|:---|:---|
| 🔴 **Índice de Risco Global** | Score consolidado (0–100) baseado em saturação do solo e adensamento. |
| 🌿 **Score de Turismo** | Avaliação de aptidão climática para atividades ao ar livre. |
| 🚗 **Mobilidade Viária** | Previsão de retenção nas vias principais (Amaral Peixoto, etc). |

---

## ✨ Funcionalidades Principais

- **🗺️ Mapa Tático Interativo**: 15 setores georreferenciados com heatmap dinâmico (D3.js).
- **🌊 Monitor de Maré**: Cálculo em tempo real da altura e tendência (Enchendo/Vazante).
- **📊 Saturação do Solo**: Modelo de decaimento de 7 dias para risco de alagamento.
- **📈 Histórico de 10 Anos**: Análise comparativa de precipitação (2015–2024).
- **⚡ Sincronização em Tempo Real**: Busca de APIs externas (IBGE/Weather) direto no browser.
- **🏥 Monitoramento de Saúde**: Risco epidemiológico baseado em fatores climáticos.
- **📋 Boletim de Risco**: Relatório técnico pronto para exportação.

---

## 🌐 Origem dos Dados

O sistema prioriza transparência e dados abertos:

| Fonte | Tipo de Dado | Método |
|:---|:---|:---|
| **IBGE SIDRA** | População estimada por ano | API Pública (Tabela 6579) |
| **Open-Meteo** | Clima (Temp, Chuva, Vento) | API Pública (Sem Chave) |
| **Harmônicas Locais** | Ciclo de Maré | Modelo Matemático Local |
| **Topografia Local** | Elevação por Setor | Dataset Interno de Monitoramento |

---

## 🏗️ Arquitetura (Serverless / Spark Plan)

O projeto é otimizado para o plano **Firebase Spark (Gratuito)**:
- **Client-Side Sync**: O navegador realiza a busca nas APIs (IBGE/Open-Meteo) e persiste no Firestore.
- **Firestore Cache**: Atua como banco de dados NoSQL para evitar chamadas de API desnecessárias.
- **Hosting**: CDN global para entrega rápida dos assets minificados.

---

## 🛠️ Stack Técnica

- **Framework**: React 19 (Hooks, Context, Memo).
- **Linguagem**: TypeScript (Tipagem estricta para segurança de dados).
- **Estilização**: Tailwind CSS v4 (Design system atômico).
- **Visualização**: D3.js (Cálculos de escala e interpolação de cores).
- **Infra**: Firebase (Firestore & Hosting).

---

## 🚀 Como Rodar Localmente

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Configure o Firebase** (opcional para dev local):
   ```bash
   firebase login
   firebase init
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Build e Deploy**:
   ```bash
   npm run build
   npm run deploy
   ```

---

## 👤 Autor

**Rilen Tavares Lima**  
*Especialista em TI · Governança de Dados · Rio das Ostras/RJ*

---

<div align="center">

*Esta plataforma é uma ferramenta de apoio à decisão experimental — não substitui protocolos oficiais da Defesa Civil.*

</div>
