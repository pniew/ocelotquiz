import crypto from 'crypto';

export const createCryptoString = (length: number) => {
    const bytes = crypto.randomBytes(length);
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const result = [];
    let cursor = 0;
    for (let i = 0; i < length; i++) {
        cursor += bytes[i];
        result[i] = chars[cursor % chars.length];
    }
    return result.join('');
};
