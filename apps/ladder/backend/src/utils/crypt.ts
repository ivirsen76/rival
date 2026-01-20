import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = process.env.TL_SALT_KEY ? process.env.TL_SALT_KEY.padEnd(32, 'r').slice(0, 32) : 'r'.repeat(32);

export const encrypt = (text: string) => {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string) => {
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return '';
    }
};
