
export interface IProductSystem  {
    CODIGO:number,
    PRECO:number,
    PESO:number,
    ATIVO:'S'|'N'  ,
    IPI:number
    NCM:string,
    UNIDADE:string,
    DATA_RECAD:string,
    DESCR_REDUZ:string,
    DESCR_CURTA:string,
    DESCR_LONGA:string,
    DESCRICAO:string,
    COMPRIMENTO:number,
    LARGURA:number,
    ALTURA:number,
    INDEXADO:string,
    REF:string,
    MARCA:string,
    GRUPO:number
    TITULO_SITE:string,
     TITULO_MKTPLACE:string,
     APLICACAO:string
    DESCR_CURTA_SITE:string,
    DESCR_LONGA_SITE:string,
    DESCR_CURTA_MKTPLACE:string
    DESCR_LONGA_MKTPLACE:string
    NUM_FABRICANTE:string
    NUM_ORIGINAL:string
    QTDE_VOL:number
}   

 

export interface IEstoqueProduto {
       CODIGO: number,
       DESCRICAO: string,
       ESTOQUE: number  
}