/*
import { google } from 'googleapis';

async function downloadDriveFile(fileId: string) {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'caminho-da-sua-chave-json.json', // Service Account
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
}
*/