import { Request, Response } from "express";
import { ApiConfigRepository } from "../../company/data/api-config-repository";
import { SyncCategory } from "../../categories/services/sync-category";
import { ProdutoRepository } from "../../products/data/produto-repository";
import { VerifyGtin } from "../../../shared/utils/verify-gtin";
import { ProdutoMapper } from "../../products/mapping/produto-mapper";
import { ProdutoApiRepository } from "../../products/data/produto-api-repository";
import { SyncProduct } from "../../products/services/sync-product";
import ConfigApi from "../../../shared/api";

export class ProductGridController{

    async allGrids( req:Request, res:Response){

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



     /**        const arrEstoque = await ProdutoRepository.buscaEstoqueReal(Number(codigo));

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


            */

             res.render('products_grid', {  });
 
    }

    async newGrid( req:Request, res:Response){
                const arrProduto  = await ProdutoRepository.buscaProdutos( );

             res.render('products_grid/new-grid', { productsReference: arrProduto  });

    }

    async getVariants( req:Request, res:Response){
        try {
            const reference = req.query.reference as string;
            const search = req.query.search as string || '';

            const allProducts = await ProdutoRepository.buscaProdutos();

          
            let variants = allProducts;

            if (reference && reference !== 'todos') {
                variants = variants.filter(p => String(p.CODIGO) !== reference);
            }

            if (search) {
                const term = search.toLowerCase();
                variants = variants.filter(p =>
                    String(p.CODIGO).includes(term) || p.DESCRICAO.toLowerCase().includes(term)
                );
            }

            res.json({ success: true, data: variants });
        } catch (error: any) {
            console.error('[getVariants] Erro:', error);
            res.status(500).json({ success: false, error: error.message || 'Erro ao buscar variantes' });
        }
    }

    async getProductDetail( req:Request, res:Response){
        try {
            const codigo = Number(req.query.codigo);
            if (!codigo) {
                res.status(400).json({ success: false, error: 'Código do produto não informado' });
                return;
            }

            const arrProduto = await ProdutoRepository.buscaProduto(codigo);
            if (!arrProduto || arrProduto.length === 0) {
                res.status(404).json({ success: false, error: 'Produto não encontrado' });
                return;
            }

            const produto = arrProduto[0];

            let preco = 0;
            try {
                const dadosConfig = await ApiConfigRepository.buscaConfig();
                const tabelaPreco = Number(dadosConfig[0]?.tabela_preco);
                if (tabelaPreco) {
                    const arrPreco = await ProdutoRepository.buscaPreco(codigo, tabelaPreco);
                    if (arrPreco.length > 0) preco = arrPreco[0].PRECO;
                }
            } catch (e) { /* usa preco padrao */ }

            let marca = '';
            try {
                const arrMarca = await ProdutoRepository.buscaMarcaProduto(produto.MARCA);
                if (arrMarca.length > 0) marca = arrMarca[0].DESCRICAO;
            } catch (e) { /* usa vazio */ }

            let unidade = 'UND';
            try {
                const arrUnidades = await ProdutoRepository.buscaUnidades(codigo);
                if (arrUnidades.length > 0 && arrUnidades[0].SIGLA) unidade = arrUnidades[0].SIGLA;
            } catch (e) { /* usa padrao */ }

            let ncm = '';
            try {
                const arrNcm = await ProdutoRepository.buscaNcm(codigo);
                if (arrNcm.length > 0) ncm = arrNcm[0].NCM;
            } catch (e) { /* usa vazio */ }

            const isValidGtin = VerifyGtin.isValidGtin(produto.NUM_FABRICANTE);
            const gtin = isValidGtin ? produto.NUM_FABRICANTE : '';

            const result = {
                codigo: produto.CODIGO,
                nome: produto.TITULO_MKTPLACE || produto.DESCRICAO,
                descricao: produto.DESCRICAO,
                descricaoCurta: produto.DESCR_CURTA_MKTPLACE || produto.APLICACAO || '',
                descricaoComplementar: produto.DESCR_LONGA_MKTPLACE || '',
                situacao: 'A',
                tipo: 'P',
                unidade,
                preco,
                pesoBruto: produto.PESO || 0,
                formato: 'V',
                largura: produto.LARGURA || 0,
                altura: produto.ALTURA || 0,
                profundidade: produto.COMPRIMENTO || 0,
                marca,
                volumes: produto.QTDE_VOL || 0,
                tipoProducao: 'T',
                gtin,
                ncm,
            };

            res.json({ success: true, data: result });
        } catch (error: any) {
            console.error('[getProductDetail] Erro:', error);
            res.status(500).json({ success: false, error: error.message || 'Erro ao buscar detalhes do produto' });
        }
    }


    async postGrid( req:Request, res:Response){
        const api = new ConfigApi();
            await  api.configurarApi();


                 let dadosConfig = await ApiConfigRepository.buscaConfig();
                        const syncCategory = new SyncCategory();
    
                        // contem o valor do parametro de envio de estoque ( 0: nao enviar estoque, 1: enviar o estoque) 
                        const envEstoque = Number(dadosConfig[0].enviar_estoque);
    
                        // contem o valor do parametro de envio de preco ( 0: nao enviar preco, 1: enviar o preco) 
                        const envPreco = Number( dadosConfig[0].enviar_precos)
                        // tabela onde é feita a consulta dos precos a serem enviados
                        const tabela_preco = Number( dadosConfig[0].tabela_preco);
                        const caminhoFotos = dadosConfig[0].caminho_fotos;

                    const syncProduct= new SyncProduct();

        const variants =[]

            const resultadosIntegracao: any[] = [];

            for(const variant of req.body.variants){

                          // busca o item no banco de dados do sistema
                    const arrProdSelected = await   ProdutoRepository.buscaProduto(Number(variant));

                     const arrProdutoSincronizado = await ProdutoApiRepository.findByCodeSystem(Number(variant));
                    
                        if (!arrProdSelected || arrProdSelected.length === 0) {
                     //   resultadoOperacao = { codigo: codigoSelecionado, success: false, msg: `Produto ${Number(variant)} não encontrado no sistema de origem.` };
                     //   console.log(resultadoOperacao.msg);

                  //      resultadosIntegracao.push(resultadoOperacao.msg);
                        return resultadosIntegracao;
                    }

                    // extrai o produto do array 
                    let prodSelected = arrProdSelected[0];

                    // verifica a categoria do produto
                    let categoryId = 0;
                    const resultVerifyCategoryBling  = await syncCategory.verifyCategory(prodSelected.GRUPO);
                        if( !resultVerifyCategoryBling.success ){
                           resultadosIntegracao.push(resultVerifyCategoryBling.message);
                          return resultadosIntegracao;
                        }else{
                            categoryId = resultVerifyCategoryBling.data?.id_bling || 0;
                        }
                        
                        
                    // verifica se o produto já possui fotos no Bling (apenas para produtos existentes)
                    let skipPhotos = false;
                    if (arrProdutoSincronizado.length > 0) {
                        skipPhotos = await syncProduct.checkProductHasPhotosInBling(arrProdutoSincronizado[0].Id_bling);
                    }


                    let variantMapped = await ProdutoMapper.postProdutoMapper(prodSelected,envPreco, categoryId, caminhoFotos, tabela_preco, skipPhotos )
                    variantMapped.codigo = 'V-'+arrProdSelected[0].CODIGO as any; 

                    variants.push(variantMapped);

            }

        let product = req.body.parentData;
            product.codigo = 'G-'+product.codigo
          product.variacoes = variants


             try{
                  const response = await  api.config.post('/produtos', product);
                 console.log(response);
             }catch(e:any){
                     console.log(JSON.stringify(e.response.data.error))
                     console.log( e.response.data.error  )
 
             }
        return res.status(200).json({ ok:true})
    }
}