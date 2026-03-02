from firebase_functions import https_fn, options as ff_options
from firebase_admin import initialize_app, firestore, credentials
import google.oauth2.credentials
import requests
import pandas as pd
import os
from typing import Any

# Forçar a variável de ambiente para testes locais do Firestore Emulator
os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8080"

class MockCred(credentials.Base):
    def __init__(self):
        self.project_id = 'preve-ostras'
    def get_credential(self):
        # Retorna um token dummy que o Firestore Emulator aceita sem validar
        return google.oauth2.credentials.Credentials('mock_token')

# Inicialização do Firebase Admin com permissões de emulador
try:
    # Evita erros de inicialização dupla no emulador
    initialize_app()
except Exception:
    cred = MockCred()
    firebase_options = {'projectId': 'preve-ostras'}
    initialize_app(cred, options=firebase_options)

db = firestore.client()

@https_fn.on_call(timeout_sec=300)
def fetch_sidra_data(req: https_fn.CallableRequest) -> Any:
    """Busca dados demográficos de Rio das Ostras (3304524) no IBGE SIDRA."""
    print("Iniciando fetch_sidra_data (Callable)...")
    try:
        # Tabela 6579: População residente estimada
        url = "https://apisidra.ibge.gov.br/values/t/6579/n6/3304524/v/9324/p/all"
        
        print(f"Buscando dados no SIDRA: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if not data or len(data) <= 1:
            print("Erro: Nenhum dado retornado do SIDRA")
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Nenhum dado encontrado no IBGE."
            )
            
        columns_data = data[0]
        records = data[1:]
        
        df = pd.DataFrame(records)
        
        # No SIDRA, o primeiro registro contém os nomes das dimensões
        # D2C costuma ser o código do período (ano) e V o valor
        # Vamos tentar localizar as colunas pelos labels se os códigos falharem
        
        # Procura coluna que contém 'Ano' no label (primeira linha do SIDRA)
        ano_col = 'D2C'
        if ano_col not in df.columns:
            # Fallback: procurar por padrão de ano nos dados ou usar posição
            ano_col = df.columns[0] # Geralmente a primeira ou segunda
            
        valor_col = 'V'
        if valor_col not in df.columns:
            valor_col = df.columns[-1]

        df_clean = pd.DataFrame({
            'ano': df[ano_col],
            'populacao': df[valor_col]
        })
        
        # Limpeza robusta: garantir que o ano seja string para usar isdigit()
        df_clean['ano'] = df_clean['ano'].astype(str)
        df_clean = df_clean[df_clean['ano'].str.isdigit()].copy()
        
        df_clean['ano'] = pd.to_numeric(df_clean['ano'])
        df_clean['populacao'] = pd.to_numeric(df_clean['populacao'], errors='coerce')
        
        # Remover registros sem população válida
        df_clean = df_clean.dropna(subset=['populacao'])
        
        batch = db.batch()
        collection_ref = db.collection('ibge_populacao')
        
        saved_records = 0
        for _, row in df_clean.iterrows():
            if pd.isna(row['populacao']):
                continue
            doc_ref = collection_ref.document(str(int(row['ano'])))
            batch.set(doc_ref, {
                'ano': int(row['ano']),
                'populacao': float(row['populacao'])
            })
            saved_records += 1
            
        batch.commit()
        print(f"Sucesso: {saved_records} registros de população salvos.")
        
        return {
            "success": True,
            "message": f"Dados do SIDRA processados! ({saved_records} registros)",
            "count": saved_records
        }

    except Exception as e:
        print(f"Erro ao buscar dados do SIDRA: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=str(e)
        )

@https_fn.on_call()
def fetch_weather_data(req: https_fn.CallableRequest) -> Any:
    """Busca dados meteorológicos recentes de Rio das Ostras usando Open-Meteo e salva no Firestore."""
    print("Iniciando fetch_weather_data (Callable)...")
    try:
        # Coordenadas de Rio das Ostras
        base_url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": -22.5269,
            "longitude": -41.945,
            "past_days": 30,
            "daily": "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
            "timezone": "America/Sao_Paulo"
        }
        
        print(f"Fazendo request para Open-Meteo...")
        response = requests.get(base_url, params=params, timeout=15)
        print(f"Response status: {response.status_code}")
        response.raise_for_status()
        
        data = response.json()
        daily = data.get("daily", {})
        
        if not daily:
            print("Aviso: Nenhum dado 'daily' retornado")
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Nenhum dado meteorológico retornado pela API."
            )
            
        times = daily.get("time", [])
        temps = daily.get("temperature_2m_max", [])
        preci = daily.get("precipitation_sum", [])
        winds = daily.get("wind_speed_10m_max", [])
        
        print(f"Processando {len(times)} registros meteorológicos.")
        
        batch = db.batch()
        collection_ref = db.collection('clima_historico')
        
        saved_records = 0
        for i, date_str in enumerate(times):
            if temps[i] is None:
                continue
                
            doc_ref = collection_ref.document(date_str)
            batch.set(doc_ref, {
                'data': date_str,
                'temp_max': float(temps[i]),
                'precipitacao': float(preci[i]) if preci[i] is not None else 0.0,
                'vento_max': float(winds[i]) if winds[i] is not None else 0.0
            })
            saved_records += 1
            
        batch.commit()
        print(f"Sucesso: {saved_records} registros de clima salvos.")
        
        return {
            "success": True,
            "message": f"Dados meteorológicos salvos! ({saved_records} dias)",
            "count": saved_records
        }

    except Exception as e:
        print(f"Erro em fetch_weather_data: {e}")
        if isinstance(e, https_fn.HttpsError):
            raise e
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=str(e)
        )


