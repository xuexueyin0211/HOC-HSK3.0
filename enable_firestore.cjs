const fs = require('fs');
let content = fs.readFileSync('firebase-auth.js', 'utf8');

const target = `        let db = null;
        // Firestore initialization safely disabled when default database does not exist on Firebase project
        // LocalStorage is used for seamless offline-first state persistence
        window.db = null;`;

const replacement = `        let db = null;
        try {
            db = getFirestore(app);
            window.db = db;
        } catch (e) {
            console.warn("Firestore init failed:", e);
            window.db = null;
        }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('firebase-auth.js', content);
    console.log("Firestore enabled");
} else {
    console.log("Target string not found");
}
