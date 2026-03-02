import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Configuração do Firebase para Desenvolvimento Local
// No ambiente de produção, estas credenciais viriam do console do Firebase
const firebaseConfig = {
    apiKey: "local-dev-key",
    authDomain: "preve-ostras.firebaseapp.com",
    projectId: "preve-ostras", // DEVE ser o mesmo do emulador
    storageBucket: "preve-ostras.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = getFirestore(app);

// Initialize Cloud Functions
const functions = getFunctions(app, 'us-central1');

// Conectar aos emuladores se estivermos em localhost
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("Conectando aos emuladores do Firebase...");
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export { db, functions };

