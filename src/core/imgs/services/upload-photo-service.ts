import { ApiFotosProdutosRepository } from "../data/api-fotos-produtos-repository";
import { getPhotosFolder } from "./get-photos-folder";
import { PostPhotoImgBB } from "./post-photo-imgbb";
import fs from 'node:fs/promises';
import path from "node:path";


 /**
  * Faz o upload ad foto e insere no banco de dados, é feita uma validação para nao enviar a foto para o rosto duas ou mais vezes.
  */
export class UploadAndInsertPhotoService {

    static async exec (diretorioFotos:string, referenciaProduto:string, codigoProdutoSistema:number){

        const photos = await getPhotosFolder.listImages(referenciaProduto, diretorioFotos);

        const imgsFinal = [];

        if (photos && photos.length > 0) {
            for (const photoName of photos) {
                // 2. AQUI ESTAVA O ERRO: Precisa juntar o diretório com o nome do arquivo
                const imagePath = path.join(diretorioFotos, photoName);
                
                try {

                            const arrImagesVerify  = await ApiFotosProdutosRepository.getByParams({referencia:referenciaProduto, nome_foto: photoName });
                            if(arrImagesVerify.length > 0 && arrImagesVerify[0].link != null  ){
                                imgsFinal.push(arrImagesVerify[0].link);

                                console.log(`[X] A foto ${photoName} já foi enviada, pulando para a proxima imagen.`)
                            continue;
                            }

                    const imageBase64 = await fs.readFile(imagePath, { encoding: 'base64' });

                      console.log(`Sucesso ao ler ${photoName}:`, imageBase64.substring(0, 50) + "..."); 

                        const link = await   PostPhotoImgBB.postIMGBB(imageBase64);
    
                        if(link){
                            await ApiFotosProdutosRepository.insert({ cod_barras:'', codigo_produto_sistema: codigoProdutoSistema, hash_sha256:'', link:link, nome_foto:photoName, referencia:referenciaProduto}); 
                        imgsFinal.push(link)
                        }else{
                            continue
                        }


                } catch (err) {
                    console.error(`Erro ao ler o arquivo ${photoName}:`, err);
                }
            }
        } else {
            console.log("Nenhuma foto encontrada com essa referência.");
        }
        return imgsFinal;
     }
}