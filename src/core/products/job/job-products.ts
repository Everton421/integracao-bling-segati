import { JobProduto } from "../../../jobs/job-produto";
import { ProdutoRepository } from "../data/produto-repository";
import { SyncProduct } from "../services/sync-product";

export class JobProducts{
 
    static   async jobPostOrUpdateAllProducts(){
        const allProducts = await ProdutoRepository.buscaProdutos();
        
        const syncproductService = new SyncProduct();

        if(allProducts.length > 0 ){
            for(const product of allProducts){
                const resultService = await syncproductService.postOrPutProductBling( product.CODIGO, false) 
                    console.log(resultService)
            }
        }
    }

    static async   jobGetVinculoProduct(){
     const jobProduto = new JobProduto();
        await jobProduto.jobSyncAllProductsFromBling();
    }

}
