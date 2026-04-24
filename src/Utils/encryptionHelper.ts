import CryptoJS from "crypto-js";

// Helper to generate the shared key
const getKey = (token: string) => {
    const ENCRYPT_API = import.meta.env.VITE_ENCRYPTION_KEY;
    if (!ENCRYPT_API) {
        console.error("Missing VITE_ENCRYPTION_KEY in .env file");
    }
    // Static Key + Dynamic Token = Hybrid Secret
    const secret = ENCRYPT_API + token; 
    return CryptoJS.SHA256(secret);
};

export function encrypt(data: any, token: string) {
    const key = getKey(token); 
    const iv = CryptoJS.lib.WordArray.random(16);
    const plainText = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(
        plainText,
        key,
        { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    return [iv.toString(CryptoJS.enc.Hex), encrypted.ciphertext.toString(CryptoJS.enc.Hex)];
}

export function decrypt(encryptedData: any, token: string) {
    if (!Array.isArray(encryptedData) || encryptedData.length !== 2) {
        throw new Error('Invalid encrypted data format');
    }

    const key = getKey(token);
    const iv = CryptoJS.enc.Hex.parse(encryptedData[0]);
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedData[1]);

    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext
    });

    const decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        key,
        { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    try {
        return JSON.parse(plaintext);
    } catch {
        return plaintext;
    }
}