const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

const IMAGE_SIGNATURES: { format: string; hex: string; base64: string }[] = [
    { format: 'png', hex: '89504e47', base64: 'iVBORw' },
    { format: 'jpeg', hex: 'ffd8ff', base64: '/9j/4' },
    { format: 'gif', hex: '47494638', base64: 'R0lGOD' },
    { format: 'webp', hex: '52494646', base64: 'UklGRl' },
];

export interface ImageDetectionResult {
    isImage: boolean;
    format: string | null;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    cleanBase64: string | null;
    isDataUri: boolean;
    mimeType: string | null;
    imageDetection: ImageDetectionResult;
}

export function detectImageFormat(base64: string): ImageDetectionResult {
    if (!base64 || base64.length < 10) {
        return { isImage: false, format: null };
    }

    const prefix = base64.substring(0, 20);

    for (const sig of IMAGE_SIGNATURES) {
        if (prefix.startsWith(sig.base64)) {
            return { isImage: true, format: sig.format };
        }
    }

    return { isImage: false, format: null };
}

export function validateBase64(input: string | null | undefined): ValidationResult {
    const errors: string[] = [];

    if (!input) {
        errors.push('Input é nulo ou indefinido');
        return { isValid: false, errors, cleanBase64: null, isDataUri: false, mimeType: null, imageDetection: { isImage: false, format: null } };
    }

    if (typeof input !== 'string') {
        errors.push('Input não é uma string');
        return { isValid: false, errors, cleanBase64: null, isDataUri: false, mimeType: null, imageDetection: { isImage: false, format: null } };
    }

    if (input.trim().length === 0) {
        errors.push('Input está vazio ou contém apenas espaços');
        return { isValid: false, errors, cleanBase64: null, isDataUri: false, mimeType: null, imageDetection: { isImage: false, format: null } };
    }

    let cleanBase64 = input.trim();
    let isDataUri = false;
    let mimeType: string | null = null;

    if (cleanBase64.includes('base64,')) {
        isDataUri = true;
        const parts = cleanBase64.split('base64,');
        if (parts.length !== 2) {
            errors.push('Formato data URI inválido (múltiplas ocorrências de "base64,")');
            return { isValid: false, errors, cleanBase64: null, isDataUri: true, mimeType: null, imageDetection: { isImage: false, format: null } };
        }

        const header = parts[0];
        cleanBase64 = parts[1];

        const mimeMatch = header.match(/^data:image\/([a-zA-Z+.-]+);/);
        if (mimeMatch) {
            mimeType = `image/${mimeMatch[1]}`;
        } else {
            errors.push(`Tipo MIME não reconhecido no header: ${header}`);
        }
    }

    if (cleanBase64.length > MAX_BASE64_LENGTH) {
        errors.push(`Tamanho excessivo: ${cleanBase64.length} caracteres (máximo: ${MAX_BASE64_LENGTH})`);
    }

    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
        const invalidChars = cleanBase64.replace(/[A-Za-z0-9+/]*={0,2}/g, '');
        if (invalidChars.length > 0) {
            errors.push(`Caracteres inválidos encontrados: "${invalidChars.substring(0, 50)}${invalidChars.length > 50 ? '...' : ''}"`);
        }
    }

    const padding = cleanBase64.length % 4;
    if (padding !== 0 && padding !== 2) {
        if (!cleanBase64.endsWith('=') && !cleanBase64.endsWith('==')) {
            const expectedPadding = 4 - padding;
            const padded = cleanBase64 + '='.repeat(expectedPadding);
            const removedPadding = padded.replace(/=+$/, '');
            if (removedPadding === cleanBase64) {
                errors.push('Padding inválido (base64 deve terminar com = ou == ou nenhum padding se tamanho correto)');
            }
        }
    }

    if (cleanBase64.length % 4 !== 0 && !cleanBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        errors.push('Comprimento do base64 não é múltiplo de 4 (necessário para decodificação válida)');
    }

    const isValid = errors.length === 0;
    const imageDetection = detectImageFormat(cleanBase64);

    return {
        isValid,
        errors,
        cleanBase64: isValid ? cleanBase64 : null,
        isDataUri,
        mimeType,
        imageDetection
    };
}
