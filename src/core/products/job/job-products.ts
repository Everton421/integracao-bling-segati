import { JobProduto } from "../../../jobs/job-produto";
import { ApiConfigRepository } from "../../company/data/api-config-repository";
import { ProdutoRepository } from "../data/produto-repository";
import { SyncProduct } from "../services/sync-product";

export class JobProducts{
 
    static   async jobPostOrUpdateAllProducts(){
        const allProducts = await ProdutoRepository.buscaProdutos();
                let dadosConfig = await ApiConfigRepository.buscaConfig();
        if (dadosConfig[0].enviar_produtos === 'E') {

        const syncproductService = new SyncProduct();

            if(allProducts.length > 0 ){
                for(const product of allProducts){
                    const resultService = await syncproductService.postOrPutProductBling( product.CODIGO, false) 
                        console.log(resultService)
                }
            }
        }else{
            return console.log("[X] A integração nao esta habilitada para envio de produtos.")
        } 

    }

    static async   jobGetVinculoProduct(){
            
        let dadosConfig = await ApiConfigRepository.buscaConfig();

            const jobProduto = new JobProduto();
                await jobProduto.jobSyncAllProductsFromBling();
            }

}
