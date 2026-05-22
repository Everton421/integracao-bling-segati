import { IProductSystem } from "../../../interfaces/IProductSystem";
import { PostFreeImgHost } from "../../imgs/services/post-img-service";
import { IProdutoBling } from "../../../interfaces/IProdutoBling";
import { ProdutoRepository } from "../data/produto-repository";
import { CategoriaApiRepository } from "../../categories/data/categoria-api-repository";
import { VerifyGtin } from "../../../shared/utils/verify-gtin";

export type IProdutoBlingSemPreco = Omit<IProdutoBling, 'preco'>

export class ProdutoMapper {


  /**
   * 
   * @param produto 
   * @param  sendPrice parametro  de envio de preco ( 0: nao enviar preco, 1: enviar o preco) 
   * @param categoryIdBling id da categoria no bling
   * @param tabela codigo da tabela de preço a ser enviada 
   * @returns 
   */
 static async postProdutoMapper(produto: IProductSystem, sendPrice: number, categoryIdBling: number, tabela?: number): Promise<IProdutoBlingSemPreco> {
    return new Promise(async (resolve, reject) => {

      const freeImgHost = new PostFreeImgHost();
      let preco: number = 0;

      if (sendPrice === 1) {
        const arrPreco = await ProdutoRepository.buscaPreco(produto.CODIGO, tabela)
        preco = arrPreco[0].PRECO;
      }

          const arrMarca = await ProdutoRepository.buscaMarcaProduto(produto.MARCA)

      const marca = arrMarca && arrMarca.length > 0 ?  arrMarca[0].DESCRICAO : '';

      const arrNcm = await ProdutoRepository.buscaNcm(produto.CODIGO);
       

       let tributacaoBling =  { };

      let ncm = null;
      let  cod_cest = null;

      if(arrNcm.length > 0){
            const  { COD_CEST, NCM } =arrNcm[0];

            if(COD_CEST)  tributacaoBling = { ...tributacaoBling,  cod_cest : COD_CEST  } ;
            if(NCM )  tributacaoBling = { ...tributacaoBling,  ncm : NCM   } ;
              
        }


 
        
      
      const arrUnidades = await ProdutoRepository.buscaUnidades(produto.CODIGO);
      const unidade = arrUnidades[0].SIGLA

    
        const isValidGtin =  VerifyGtin.isValidGtin(produto.NUM_FABRICANTE);

      const  gtin = isValidGtin ?  produto.NUM_FABRICANTE : null;
      
    
    //envio de imagen
      //let links = await imgController.postFoto( produto ) ;
       const resultFotos = await freeImgHost.postFoto(produto) as [{ link: string }];
      
       let links = resultFotos && resultFotos.length ? resultFotos  : null 
       //


      const post: IProdutoBling = {
        codigo: produto.CODIGO,
        nome: produto.DESCRICAO,
        descricaoCurta: produto.APLICACAO,
        descricaoComplementar: produto.DESCR_LONGA_MKTPLACE || '',
        tipo: 'P',
        marca: marca,
        situacao: 'A',
        gtin: gtin ,
        unidade: unidade,
        tipoProducao:'T',
        volumes: produto.QTDE_VOL,
        preco: preco,
        pesoBruto: produto.PESO,
        formato: 'S',
        largura: produto.LARGURA,
        altura: produto.ALTURA,
        profundidade: produto.COMPRIMENTO,

        dimensoes: { 
          altura: produto.ALTURA,
           largura: produto.LARGURA,
            profundidade: produto.COMPRIMENTO  
            ,unidadeMedida :1
          },

        tributacao: tributacaoBling,
        midia: {
          imagens: {
            imagensURL: links,
          }
        },
        categoria: {
          id: categoryIdBling
        }
      };
      console.log(post)
      resolve(post)
    })
  }

          


}