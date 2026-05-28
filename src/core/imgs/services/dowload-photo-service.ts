import axios, { isAxiosError } from "axios";

export class DowloadImage{
    
    /**
     *  faz o dowload e retorna o base64 da foto.
     * @param lnk 
     * @returns 
     */
   async dowload(lnk: string): Promise< string | null >{
        try{

            const response = await axios.get(lnk, { responseType: 'arraybuffer' });
            const base64Input = Buffer.from(response.data).toString('base64');
                return base64Input;
        }catch( e ) {
            if(  isAxiosError(e) ) {
                console.log(`[X] Erro ao tentar fazer o dowload da imagem. `, e.response?.data || e.response);
            }
            return null
        }
        }
}