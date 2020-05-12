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

export const saveSession = (request: Express.Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        request.session.save((error) => {
            if (error) {
                console.error('Session saving error:', error);
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

export const shuffleArray = <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

export function getDistinctArray<T>(array: T[]): T[] {
    return [...new Set(array)];
}

export function getObjectDifferences(objA: Object, objB: Object) {
    const diffs: string[] = [];
    for (const key in objA) {
        if (Object.prototype.hasOwnProperty.call(objB, key) && objA[key] !== objB[key]) {
            diffs.push(key);
        }
    }
    return diffs;
}

export function createObjFromDiffs<T>(original: T, newObj: T) {
    const objWithDiffs: { [key: string]: string } = {};
    const keys = getObjectDifferences(original, newObj);
    for (const key of keys) {
        objWithDiffs[key] = newObj[key];
    }
    return objWithDiffs as unknown as T;
}

export function createObj<A, B>(objA: A, objB: B) {
    return Object.assign({}, objA, objB) as A & B;
}

export function toMSQLDate(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

export function mathClamp(x: number, min: number, max: number) {
    return Math.min(Math.max(x, min), max);
}
