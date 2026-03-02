/**
 * firebase.ts – Inicialização e Configuração do Firebase
 *
 * Responsável por:
 * - Inicializar o app Firebase com a configuração do projeto.
 * - Conectar automaticamente aos emuladores em ambiente de desenvolvimento.
 * - Exportar a instância `db` (Firestore).
 */

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ─── Configuração Real do Projeto ───────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDX-UY4tACQ2DMoFEWNVGcoJ_UZXVHJ-rQ",
    authDomain: "preve-ostras.firebaseapp.com",
    projectId: "preve-ostras",
    storageBucket: "preve-ostras.firebasestorage.app",
    messagingSenderId: "432968529278",
    appId: "1:432968529278:web:b9bdf3239ba2ed2651ef2f",
    measurementId: "G-X3QGN7RTEC",
};

// ─── Inicialização ──────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Analytics só funciona em prod (browser real, não emulador)
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
