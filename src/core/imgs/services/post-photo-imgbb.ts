import axios from "axios";
import { validateBase64 } from "../utils/validate-base64";
import { DowloadImage } from "./dowload-photo-service";

export class PostPhotoImgBB{

  static async postIMGBB(foto: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const dowloadImage = new DowloadImage();
            let base64Input = foto;
           if (foto.startsWith('http://') || foto.startsWith('https://')) {
              const imgDowload =  await  dowloadImage.dowload(foto);
                if(imgDowload){
                 base64Input = imgDowload;
                }
          }

            const result = validateBase64(base64Input);
            if (!result.imageDetection.isImage) {
                console.log(`Não é uma imagem. Formato detectado: ${result.imageDetection.format}`);
                return
            }

            let base64Clean = String(base64Input);
            if (base64Clean.includes('base64,')) {
                base64Clean = base64Clean.split('base64,')[1];
            }
            if (!process.env.API_KEY_IMGBB) {
                console.log(" API_KEY_IMGBB não foi configurada.")
                return;
            }

            const apiKey = process.env.API_KEY_IMGBB

            const form = new FormData();
            form.append('image', base64Clean);

            try {
                const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form);
                resolve(response.data.data.url);
            } catch (error: any) {
                reject(error);
            }


        })

    }
}