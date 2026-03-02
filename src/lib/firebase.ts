/**
 * firebase.ts – Inicialização e Configuração do Firebase
 *
 * A configuração é lida de variáveis de ambiente (import.meta.env.VITE_*).
 * Copie .env.example → .env e preencha com os valores do Console Firebase.
 *
 * ⚠️  NUNCA coloque valores reais neste arquivo — ele vai para o repositório.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ─── Configuração via Variáveis de Ambiente ──────────────────────────────────
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// ─── Validação em desenvolvimento ───────────────────────────────────────────
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
        "[Firebase] ⚠️  Variáveis de ambiente não encontradas!\n" +
        "Crie um arquivo .env na raiz do projeto com base no .env.example"
    );
}

// ─── Inicialização ──────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Analytics só funciona em produção (browser real)
const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

if (!isLocalhost) {
    getAnalytics(app);
}

// ─── Emuladores (apenas em desenvolvimento local) ───────────────────────────
if (isLocalhost) {
    console.info("[Firebase] Conectando ao emulador do Firestore...");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
