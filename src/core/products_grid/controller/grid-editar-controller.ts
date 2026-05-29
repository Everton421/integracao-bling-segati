import { Request, Response } from "express";
import { ApiConfigRepository } from "../../company/data/api-config-repository";
import { SyncCategory } from "../../categories/services/sync-category";

export class ProdutoEditarController{

    async execute( req:Request, res:Response){

          const codigo = req.params.codigo;

       
                        let dadosConfig = await ApiConfigRepository.buscaConfig();
                        const syncCategory = new SyncCategory();
    
                        // contem o valor do parametro de envio de estoque ( 0: nao enviar estoque, 1: enviar o estoque) 
                        const envEstoque = Number(dadosConfig[0].enviar_estoque);
    
                        // contem o valor do parametro de envio de preco ( 0: nao enviar preco, 1: enviar o preco) 
                        const envPreco = Number( dadosConfig[0].enviar_precos)
                        // tabela onde é feita a consulta dos precos a serem enviados
                        const tabela_preco = Number( dadosConfig[0].tabela_preco);

                            const { caminho_fotos } = dadosConfig[0];


    /**    const arrProduto  = await ProdutoRepository.buscaProduto(Number(codigo));

        const arrEstoque = await ProdutoRepository.buscaEstoqueReal(Number(codigo));

            let produto = arrProduto[0] as any;

            produto = { ...produto, 'ESTOQUE':arrEstoque[0].ESTOQUE };
    
            const arrProdSelected = await   ProdutoRepository.buscaProduto(Number(codigo));
                    const prodSelected = arrProdSelected[0];
    
               // verifica a categoria do produto
                    let categoryId = 0;
                    const resultVerifyCategoryBling  = await syncCategory.verifyCategory(prodSelected.GRUPO);
                        if( !resultVerifyCategoryBling.success ){
                    //       resultadosIntegracao.push(resultVerifyCategoryBling.message);
                    //      return resultadosIntegracao;
                        }else{
                            categoryId = resultVerifyCategoryBling.data?.id_bling || 0;
                        }


            

             res.render('produtos/produto-editar', {  produto : produto   });
 */
    }
}