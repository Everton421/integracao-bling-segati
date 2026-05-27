import { ApiConfigRepository } from "../core/company/data/api-config-repository";
import { ProdutoApiRepository } from "../core/products/data/produto-api-repository";
import { DateService } from "../shared/utils/date-service";
import { SyncProduct } from "../core/products/services/sync-product";

export class JobProduto{
    private syncProduct = new SyncProduct();

      async enviarProdutos( ) {
        const data = DateService.obterDataHoraAtual();
         const [ config ] =  await ApiConfigRepository.buscaConfig();

            if(!config.ult_env_produto){
                console.log("[X] Nenhum valor referente a data de ultimo envio de produto registrado no banco da integrção.")
                return
            }
                    const produtos = await ProdutoApiRepository.findChagedAfter(config.ult_env_produto!);

            let arrResult = []
            if(produtos.length > 0 ){
                console.log(`[V] enviando/atualizando ${produtos.length} produtos...`)
                    for (const i of produtos) {
                        let result: any = await this.syncProduct.postOrPutProductBling(Number(i.CODIGO), true );
                        if (result.resultados) {
                            arrResult.push(result.resultados)
                        }
                    }
            }
            await ApiConfigRepository.atualizaDados({ ult_env_produto: data})
        }


        async jobgetVinculoProduct(){
            const arrProdutos = await ProdutoApiRepository.buscaNaoSincronizados();
            console.log(`[V] ${arrProdutos.length} produtos pendentes de vinculo encontrados.`);

            for( const produto of arrProdutos ){
                try {
                    await this.syncProduct.getVinculoProduto({ codigo: Number(produto.CODIGO), data_recad_sistema: produto.DATA_RECAD });
                    await this.delay(1200);
                } catch (error: any) {
                    console.log(`[X] Erro ao processar vinculo do produto ${produto.CODIGO}: ${error.message || error}`);
                }
            }

            console.log('[V] Processo de vinculo de produtos finalizado.');
        }

        private delay(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
}