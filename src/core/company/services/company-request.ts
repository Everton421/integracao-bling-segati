import { AxiosError } from "axios";
import ConfigApi from "../../../shared/api";



 
 interface dataCompanyBling   { 
     id: string,
     nome: string,
     cnpj: string,
     email: string,
     dataContrato: string
 }

  interface responseCompanyRequest   { 
    data:  dataCompanyBling
 }


export class SyncCompany{
        private api = new ConfigApi();

  async getBasicDataCompany() {
                 
             await this.api.configurarApi();
 
                try{

                   const resultRequestDataCompany = await   this.api.config.get('/empresas/me/dados-basicos');
                   const dataCompany = resultRequestDataCompany.data as responseCompanyRequest;
                    return dataCompany;
                }catch(e){  
                    if(e instanceof AxiosError){
                        console.log(`Erro ao tentar consultar os dados da empresa no bling ` , e.response?.data);
                    }
                  return;
                }
             
        }
    

}