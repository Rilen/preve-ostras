"""
Preve-Ostras – Cloud Functions (Firebase / Python)
===================================================
Funções de backend para busca e sincronização de dados externos.

Funções disponíveis:
    - fetch_sidra_data:    Busca população de Rio das Ostras (IBGE SIDRA) → Firestore
    - fetch_weather_data:  Busca dados meteorológicos (Open-Meteo) → Firestore
"""

import os
from typing import Any

import requests
import pandas as pd
from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore, credentials
import google.oauth2.credentials

# ---------------------------------------------------------------------------
# Inicialização do Firebase Admin SDK
# ---------------------------------------------------------------------------
# O Firebase Functions Runner injeta FUNCTIONS_EMULATOR=true quando local.
# Em produção (Cloud Run) essa variável não existe e o SDK usa ADC automaticamente.

_IS_EMULATOR = os.environ.get("FUNCTIONS_EMULATOR") == "true"

if _IS_EMULATOR:
    # Emulador local: aponta para o Firestore emulado
    os.environ.setdefault("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080")

    class _MockCredential(credentials.Base):
        """Credencial dummy aceita pelo emulador (sem validação real)."""
        def __init__(self):
            self.project_id = "preve-ostras"
        def get_credential(self):
            return google.oauth2.credentials.Credentials("mock_token")

    try:
        initialize_app()
    except ValueError:
        pass  # App já inicializado
    except Exception:
        initialize_app(_MockCredential(), options={"projectId": "preve-ostras"})

else:
    # Produção: o Cloud Run fornece Application Default Credentials (ADC)
    try:
        initialize_app()
    except ValueError:
        pass  # App já inicializado

_db = firestore.client()

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
_IBGE_CODE_RIO_DAS_OSTRAS = "3304524"
_SIDRA_URL = (
    f"https://apisidra.ibge.gov.br/values"
    f"/t/6579/n6/{_IBGE_CODE_RIO_DAS_OSTRAS}/v/9324/p/all"
)
_OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
_RIO_DAS_OSTRAS_LAT = -22.5269
_RIO_DAS_OSTRAS_LON = -41.945


# ---------------------------------------------------------------------------
# Cloud Function: fetch_sidra_data
# ---------------------------------------------------------------------------
@https_fn.on_call(timeout_sec=300)
def fetch_sidra_data(req: https_fn.CallableRequest) -> Any:
    """
    Busca a série histórica de população de Rio das Ostras no IBGE SIDRA
    (Tabela 6579 – estimativas populacionais) e persiste no Firestore.

    Coleção destino: ibge_populacao/{ano}
    Campos: { ano: int, populacao: float }
    """
    print("[fetch_sidra_data] Iniciando busca no IBGE SIDRA...")

    try:
        response = requests.get(_SIDRA_URL, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data or len(data) <= 1:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Nenhum dado encontrado no IBGE SIDRA.",
            )

        # O SIDRA retorna o 1º item como metadados; os demais são registros.
        records = data[1:]
        df = pd.DataFrame(records)

        # Identificação de colunas: D2C = código do período, V = valor
        ano_col = "D2C" if "D2C" in df.columns else df.columns[0]
        val_col = "V" if "V" in df.columns else df.columns[-1]

        df_clean = pd.DataFrame({
            "ano": df[ano_col].astype(str),
            "populacao": pd.to_numeric(df[val_col], errors="coerce"),
        })

        # Filtra apenas linhas cujo 'ano' seja um número de 4 dígitos
        df_clean = df_clean[df_clean["ano"].str.match(r"^\d{4}$")].copy()
        df_clean["ano"] = pd.to_numeric(df_clean["ano"])
        df_clean = df_clean.dropna(subset=["populacao"])

        print(f"[fetch_sidra_data] {len(df_clean)} registros válidos encontrados.")

        batch = _db.batch()
        col_ref = _db.collection("ibge_populacao")
        count = 0

        for _, row in df_clean.iterrows():
            doc_ref = col_ref.document(str(int(row["ano"])))
            batch.set(doc_ref, {
                "ano": int(row["ano"]),
                "populacao": float(row["populacao"]),
            })
            count += 1

        batch.commit()
        print(f"[fetch_sidra_data] Sucesso: {count} registros salvos.")

        return {
            "success": True,
            "message": f"Dados do SIDRA processados! ({count} registros)",
            "count": count,
        }

    except https_fn.HttpsError:
        raise
    except Exception as exc:
        print(f"[fetch_sidra_data] ERRO: {exc}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=str(exc),
        )


# ---------------------------------------------------------------------------
# Cloud Function: fetch_weather_data
# ---------------------------------------------------------------------------
@https_fn.on_call(timeout_sec=60)
def fetch_weather_data(req: https_fn.CallableRequest) -> Any:
    """
    Busca os últimos 30 dias de dados meteorológicos de Rio das Ostras
    via API Open-Meteo e persiste no Firestore.

    Coleção destino: clima_historico/{YYYY-MM-DD}
    Campos: { data: str, temp_max: float, precipitacao: float, vento_max: float }
    """
    print("[fetch_weather_data] Iniciando busca na Open-Meteo...")

    params = {
        "latitude": _RIO_DAS_OSTRAS_LAT,
        "longitude": _RIO_DAS_OSTRAS_LON,
        "past_days": 30,
        "daily": "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
        "timezone": "America/Sao_Paulo",
    }

    try:
        response = requests.get(_OPEN_METEO_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        daily = data.get("daily", {})
        if not daily:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Nenhum dado meteorológico retornado pela API.",
            )

        times = daily.get("time", [])
        temps = daily.get("temperature_2m_max", [])
        preci = daily.get("precipitation_sum", [])
        winds = daily.get("wind_speed_10m_max", [])

        print(f"[fetch_weather_data] {len(times)} registros recebidos.")

        batch = _db.batch()
        col_ref = _db.collection("clima_historico")
        count = 0

        for i, date_str in enumerate(times):
            if temps[i] is None:
                continue
            doc_ref = col_ref.document(date_str)
            batch.set(doc_ref, {
                "data": date_str,
                "temp_max": float(temps[i]),
                "precipitacao": float(preci[i]) if preci[i] is not None else 0.0,
                "vento_max": float(winds[i]) if winds[i] is not None else 0.0,
            })
            count += 1

        batch.commit()
        print(f"[fetch_weather_data] Sucesso: {count} registros salvos.")

        return {
            "success": True,
            "message": f"Dados meteorológicos salvos! ({count} dias)",
            "count": count,
        }

    except https_fn.HttpsError:
        raise
    except Exception as exc:
        print(f"[fetch_weather_data] ERRO: {exc}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=str(exc),
        )
