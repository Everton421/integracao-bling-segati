import path from 'node:path';
import fs from 'node:fs/promises';


/**
 * Consulta as fotos do produto de acordo com a referencia contida no inicio do nome da foto.
 * referencia produto = 'A123'
 * nome da foto = 'A123_photo.png'
 *  
 */
export class getPhotosFolder {

    static async listImages(referenciaProduto: string, diretorio: string) {
        try {
            // Verifica se o diretório existe antes de tentar ler
            // Se o caminho for relativo, ele tentará a partir de onde o script é executado
            const absolutePath = path.resolve(diretorio);
            
            const data = await fs.readdir(absolutePath);
            
            const extensõesValidas = ['.jpg', '.png', '.jpeg'];

            const photosName = [];

            for (const photo of data) {
                const extensao = path.extname(photo).toLowerCase();
                
                if (photo.startsWith(referenciaProduto) && extensõesValidas.includes(extensao)) {
                //    console.log(`Foto encontrada: ${photo}`);
                    photosName.push(photo);
                    // const imagePath = path.join(absolutePath, photo);
                    // const imageBase64 = await fs.readFile(imagePath, { encoding: 'base64' });
                }
            }

            return photosName
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                console.error(`Erro: O diretório não foi encontrado em: ${e.path}`);
            } else {
                console.error("Erro ao listar diretório:", e);
            }
            return []
        }
    }
}
