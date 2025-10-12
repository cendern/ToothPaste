const DB_NAME = "ToothPasteDB";
const STORE_NAME = "deviceKeys";
const DB_VERSION = 1;

// Open or create a new DB store and set the primary key to clientID
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "clientID" }); // Create a new store if it doesn't exist (assume new user) and set 'clientID' as the primary key
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Persistent browser-tied encryption key management
const KEY_DB_NAME = "ToothPasteKeyDB";
const KEY_STORE_NAME = "keys";
const KEY_ID = "deviceKey";

function openKeyDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(KEY_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
                db.createObjectStore(KEY_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getOrCreateCryptoKey() {
    const db = await openKeyDB();
    const tx = db.transaction(KEY_STORE_NAME, "readwrite");
    const store = tx.objectStore(KEY_STORE_NAME);
    const keyData = await new Promise((resolve, reject) => {
        const req = store.get(KEY_ID);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    if (!keyData) {
        const key = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        await new Promise((resolve, reject) => {
            const req = store.put(exported, KEY_ID);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
        return key;
    } else {
        return await window.crypto.subtle.importKey(
            "jwk",
            keyData,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );
    }
}

// Save base64 shared secret under a given key in the store for a specific client, encrypted
export async function saveBase64(clientID, key, value) {
    const cryptoKey = await getOrCreateCryptoKey();
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        enc.encode(value)
    );
    // Open the database
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    // Get existing
    const existing = await new Promise((resolve, reject) => {
        const request = store.get(clientID);
        request.onsuccess = () =>
            resolve(request.result ?? { clientID, data: {} });
        request.onerror = () => reject(request.error);
    });
    // Store encrypted value and IV
    existing.data[key] = {
        iv: Array.from(iv),
        encrypted: Array.from(new Uint8Array(encrypted))
    };
    await new Promise((resolve, reject) => {
        const request = store.put(existing);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

// Load the base64 shared secret for a given client and key, decrypting
export async function loadBase64(clientID, key) {
    const cryptoKey = await getOrCreateCryptoKey();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(clientID);
    return new Promise((resolve, reject) => {
        req.onsuccess = async () => {
            const entry = req.result?.data?.[key] ?? null;
            if (!entry || !entry.iv || !entry.encrypted) {
                resolve(null);
                return;
            }
            try {
                const iv = new Uint8Array(entry.iv);
                const encrypted = new Uint8Array(entry.encrypted);
                const decrypted = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv },
                    cryptoKey,
                    encrypted
                );
                const dec = new TextDecoder();
                resolve(dec.decode(decrypted));
            } catch (e) {
                reject(e);
            }
        };
        req.onerror = () => reject(req.error);
    });
}

// Load the stored base64 keys into the ECDH context if they exist
export async function keyExists(clientID) {
    try {
        const selfPublicKey = await loadBase64(clientID, "SelfPublicKey");
        const selfPrivateKey = await loadBase64(clientID, "SelfPrivateKey");
        const peerPublicKey = await loadBase64(clientID, "PeerPublicKey");

        return !!(selfPublicKey && selfPrivateKey && peerPublicKey);
    } catch (error) {
        console.error("Error retreiving keys in ECDH context", error);
        return false;
    }
}
