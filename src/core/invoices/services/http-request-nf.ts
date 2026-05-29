import { AxiosError } from "axios";
import { BlingNotaFiscal } from "../mapping/nf-mapper";
import ConfigApi from "../../../shared/api";


export class SyncNf {
         private   api = new ConfigApi();

    async postNf( nfBling :BlingNotaFiscal){
        await this.api.configurarApi();

        console.log('=== DEBUG http-request-nf ===');
        console.log('Parcelas enviadas:', JSON.stringify(nfBling.parcelas, null, 2));
        console.log('Seguro:', nfBling.seguro);
        console.log('Despesas:', nfBling.despesas);
        console.log('Desconto:', nfBling.desconto);
        console.log('Transporte:', JSON.stringify(nfBling.transporte, null, 2));
        const sumItemVal = nfBling.itens.reduce((s, i) => s + (i.valor * i.quantidade), 0);
        console.log('Soma itens (valor * qtd):', sumItemVal);
        const sumParcelas = nfBling.parcelas?.reduce((s, p) => s + p.valor, 0) || 0;
        console.log('Soma parcelas:', sumParcelas);
        const totalCalculado = Number((
            sumItemVal
            + (nfBling.seguro || 0)
            + (nfBling.despesas || 0)
            - (nfBling.desconto || 0)
            + (nfBling.transporte?.freight || 0)
        ).toFixed(2));
        console.log('Total calculado (items+seguro+despesas-desconto+frete):', totalCalculado);
        console.log('==============================');

        try{

                  const response = await this.api.config.post('/nfe', nfBling);
                 console.log(response);
                    return response.data;

        }catch(e){
            let fieldsError 
            if(e instanceof AxiosError){
                fieldsError = e.response?.data.error.fields || e.response?.data.error.message;
                return { success:false, message: "Erro ao tentar enviar a nota.", data: e.response?.data.error.fields || e.response?.data.error.message}
            }
        }

    }
}