// =============================================
// FIREBASE CONFIGURATION
// =============================================
// Remplace les valeurs ci-dessous par celles de ton projet Firebase.
// Pour les obtenir :
//   1. Va sur https://console.firebase.google.com/
//   2. Crée un projet (ou ouvre un existant)
//   3. Ajoute une "Web app"
//   4. Copie les valeurs du firebaseConfig
//
const firebaseConfig = {
    apiKey: "AIzaSyClKUtDzi4jdxu6uhbcW0W7OfHrpzgBqvY",
    authDomain: "the-stand-kanban.firebaseapp.com",
    databaseURL: "https://the-stand-kanban-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "the-stand-kanban",
    storageBucket: "the-stand-kanban.firebasestorage.app",
    messagingSenderId: "435586834541",
    appId: "1:435586834541:web:0b16773f9f43ab4fec5f64"
};

// Initialise Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
