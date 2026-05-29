import { type IProdutoBling } from "./IProdutoBling"

export interface IProductGridBling{
    codigo:number,
    nome:string,
    situacao: "A" | "I"
    descricaoCurta:string,
    descricaoComplementar:string,
    tipo:string,
    unidade:string,
    preco:number,
    pesoBruto:number,
    formato:string,
    largura:number,
    altura:number,
    profundidade:number,
    marca:string
    dimensoes:dimensoes,
    tributacao:tributacao,
    categoria?:categoria
    midia?:midia
    volumes:number
    tipoProducao:string
    gtin:string | null,
    variacoes: IProdutoBling[]
}
interface categoria{
    id:any
}

interface midia{
     imagens :{
         imagensURL :[
            { 
                link:string
            }
         ]  | null
    }
}
interface dimensoes{
    largura:number,
    altura:number,
    profundidade:number,
    unidadeMedida:number
}
interface tributacao{
    ncm?:string | null,
    cest?:string | null
}
interface categoria{

}