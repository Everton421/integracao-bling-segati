import { IProductSystem } from "../../../interfaces/IProductSystem";
import { PostFreeImgHost } from "../../imgs/services/post-img-service";
import { IProdutoBling } from "../../../interfaces/IProdutoBling";
import { ProdutoRepository } from "../data/produto-repository";
import { CategoriaApiRepository } from "../../categories/data/categoria-api-repository";
import { VerifyGtin } from "../../../shared/utils/verify-gtin";
import { UploadAndInsertPhotoService } from "../../imgs/services/upload-photo-service";

export type IProdutoBlingSemPreco = Omit<IProdutoBling, 'preco'>

type linksPhotosBling = { link:string };

export class ProdutoMapper {


  /**
   * 
   * @param produto 
   * @param  sendPrice parametro  de envio de preco ( 0: nao enviar preco, 1: enviar o preco) 
   * @param categoryIdBling id da categoria no bling
   * @param tabela codigo da tabela de preço a ser enviada 
   * @returns 
   */
 static async postProdutoMapper(produto: IProductSystem, sendPrice: number, categoryIdBling: number, caminhoFotos:string,  tabela?: number, skipPhotos: boolean = false, existingUrls: string[] = []): Promise<IProdutoBlingSemPreco> {
    return new Promise(async (resolve, reject) => {

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
      const referencia = produto.NUM_ORIGINAL;

      let links:linksPhotosBling[] | null = null;

      if(referencia && !skipPhotos){
        links = [];
        const resultFotos  = await UploadAndInsertPhotoService.exec(caminhoFotos,referencia );
        for(const photo of resultFotos ){
          links.push({ link: photo } );
        }
      }
      const  nome = produto.TITULO_MKTPLACE ? produto.TITULO_MKTPLACE : produto.DESCRICAO;

      const descricaoCurta = produto.DESCR_CURTA_MKTPLACE ? produto.DESCR_CURTA_MKTPLACE : produto.APLICACAO;

      const post: IProdutoBling = {
        codigo: produto.CODIGO,
        nome: nome,
        descricaoCurta: descricaoCurta,
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
        categoria: {
          id: categoryIdBling
        }
      };

      if (links && links.length > 0) {
        post.midia = {
          imagens: {
            imagensURL: links as any,
          }
        };
      } else if (skipPhotos && existingUrls.length > 0) {
        post.midia = {
          imagens: {
            imagensURL: existingUrls.map(link => ({ link })) as any,
          }
        };
      }

      console.log(post)
      resolve(post)
    })
  }

          


}