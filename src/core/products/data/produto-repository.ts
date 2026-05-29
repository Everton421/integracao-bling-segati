import { conn,    db_estoque, db_publico, db_vendas } from "../../../database/databaseConfig" ;
import { IProductSystem } from "../../../interfaces/IProductSystem";

type prodPreco = {
  PRECO:number, PRODUTO:number, TABELA:number, DATA_RECAD:string  
}

export class ProdutoRepository{

    /***
     * consulta os produtos disponiveis para vinculo com o Bling.
     */
    static async buscaProdutos():Promise<IProductSystem[]>{

        return new Promise( async (resolve, reject)=>{
          
            let sql = ` 
                            SELECT * FROM ${db_publico}.cad_prod WHERE NO_SITE = 'S' AND ATIVO = 'S';
                            `;
            await conn.query(sql, (err:any,result:any)=>{
              if(err){
                reject(err);
              }else{
                resolve(result);
              }
            });
        });
  
     }

    static async buscaProduto(codigo:number):Promise<IProductSystem[]>{
      return new Promise( async (resolve, reject)=>{
          let sql = `SELECT 
          
            *,
             coalesce(DATE_FORMAT( DATA_RECAD, '%Y-%m-%d %H:%i:%s') ,'0000-00-00 00:00:00') AS DATA_RECAD,
             coalesce(DATE_FORMAT( DATA_CADASTRO, '%Y-%m-%d') ,'0000-00-00 00:00:00') AS DATA_CADASTRO,

                CAST( APLICACAO AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO 

           FROM ${db_publico}.cad_prod WHERE NO_SITE = 'S' AND CODIGO = ${codigo} AND ATIVO = 'S' ;`;
          
           await conn.query(sql, async (err:any,result:IProductSystem[])=>{
            if(err){
              return reject(err);
            }else{
//              resolve(result);
              resolve(result)
            }
          });
      });
 
   }
   static async buscaEstoqueReal(codigo?:number, setor?:number ):Promise<[{CODIGO:number, ESTOQUE:number, DATA_RECAD:string }]>{
      return new Promise( async (resolve, reject)=>{
                            
      const baseSql = `
                  SELECT  
                        est.CODIGO,
                        IF(est.estoque < 0, 0, est.estoque) AS ESTOQUE,
                        est.DATA_RECAD
                      FROM 
                        (SELECT
                          P.CODIGO,
                          PS.DATA_RECAD,
                          (SUM(PS.ESTOQUE) - 
                            (SELECT COALESCE(SUM((IF(PO.QTDE_SEPARADA > (PO.QUANTIDADE - PO.QTDE_MOV), PO.QTDE_SEPARADA, (PO.QUANTIDADE - PO.QTDE_MOV)) * PO.FATOR_QTDE) * IF(CO.TIPO = '5', -1, 1)), 0)
                              FROM ${db_vendas}.cad_orca AS CO
                              LEFT OUTER JOIN ${db_vendas}.pro_orca AS PO ON PO.ORCAMENTO = CO.CODIGO
                              WHERE CO.SITUACAO IN ('AI', 'AP', 'FP')
                              AND PO.PRODUTO = P.CODIGO)) AS estoque
                        FROM ${db_estoque}.prod_setor AS PS
                        LEFT JOIN ${db_publico}.cad_prod AS P ON P.CODIGO = PS.PRODUTO
                        INNER JOIN ${db_publico}.cad_pgru AS G ON P.GRUPO = G.CODIGO
                        LEFT JOIN ${db_estoque}.setores AS S ON PS.SETOR = S.CODIGO
                       
                  `

                  let whereClause = ` WHERE `

                if(codigo){
                    whereClause += `  P.CODIGO = ${codigo} ` 
                  }

                  if(setor){
                    whereClause += ` AND PS.SETOR = ${setor} ` 
                  }

                  const groupBy = ` GROUP BY P.CODIGO) AS est; `; 

        const finalSql = baseSql + whereClause + groupBy;

    await conn.query( finalSql ,(err:any , result:any)=>{
        if(err){
          reject(err)
          console.log('erro ao obter o saldo de estoque')
        }else{
            resolve(result);
        }
      })
      })
    }


  static  async buscaTabelaDePreco( ):Promise<[ { CODIGO:number, FILIAL:number, DESCRICAO:String, PADRAO: 'S'| 'N'} ]>{
      return new Promise( async (resolve, reject)=>{
        
      const sql=` SELECT * FROM ${db_publico}.tab_precos ORDER BY CODIGO DESC ;
                          `
      await conn.query( sql ,(err:any , result:any)=>{
        if(err){
          reject(err)
          console.log('erro ao obter o tabela de preco',err)
        }else{
            resolve(result);
        }
      })
      })
    }


static  async buscaPreco( produto:any, tabela:any ):Promise<prodPreco[]>{
    const sql =  ` SELECT pp.PRECO, pp.PRODUTO, pp.TABELA, pp.DATA_RECAD   from ${db_publico}.prod_tabprecos pp
                  join ${db_publico}.tab_precos tp on tp.codigo = pp.tabela 
                  where pp.PRODUTO = ${produto} and tp.CODIGO = ${tabela}   
                ; ` 
    return new Promise( async ( resolve, reject )=>{
      await conn.query(sql, ( err, result )=>{
          if(err){
            reject(err);
          }else{
            resolve(result);
          }
      })
    })
  }

 static async buscaFotos(produto:any){
    const sql =  `  
        SELECT  CAST(FOTO  AS CHAR(1000)  CHARACTER SET latin1)  FOTO  from ${db_publico}.fotos_prod where  PRODUTO = ${produto};    
                ; ` 

    return new Promise( async ( resolve, reject )=>{
      await conn.query(sql, ( err, result )=>{
          if(err){
            reject(err);
          }else{
            resolve(result);
          }
      })
    })

  }

  static  async buscaCaminhoFotos(){
      const sql =  `  
      SELECT  CAST(FOTOS AS CHAR(1000)  CHARACTER SET utf8)  FOTOS from ${db_vendas}.parametros;   
                ; ` 

    return new Promise( async ( resolve, reject )=>{
      await conn.query(sql, ( err, result )=>{
          if(err){
            reject(err);
          }else{
            resolve(result);
          }
      })
    })

  }

 static   async buscaNcm( codigo:any):Promise< [ { CODIGO:number, NCM:string, COD_CEST: string } ] >{
    return new Promise( async (resolve, reject)=>{
        const sql = `SELECT CODIGO  , NCM  , COD_CEST   FROM ${db_publico}.class_fiscal where CODIGO=${codigo};` 
      await conn.query(sql,(err, result)=>{
        if(err){
          reject(err);
        }else{  
          resolve(result);
        }
      })
    })
  }


    /**
     * 
     * @param codigo codigo da marca
     * @returns 
     */
 static    async buscaMarcaProduto( codigo:any):Promise< [ { CODIGO:number, DESCRICAO:string  } ] >{
    return new Promise( async (resolve, reject)=>{
        const sql = `SELECT CODIGO  ,DESCRICAO   FROM ${db_publico}.cad_pmar where CODIGO=${codigo};` 
      await conn.query(sql,(err, result)=>{
        if(err){
          reject(err);
        }else{  
          resolve(result);
        }
      })
    })
  }

  static    async buscaMarcas( ):Promise< [ { CODIGO:number, DESCRICAO:string  } ] >{
    return new Promise( async (resolve, reject)=>{
        const sql = `SELECT CODIGO  ,DESCRICAO   FROM ${db_publico}.cad_pmar ;` 
      await conn.query(sql,(err, result)=>{
        if(err){
          reject(err);
        }else{  
          resolve(result);
        }
      })
    })
  }
  

  static async buscaGrupos():Promise< [ { CODIGO:number, NOME:string  } ] >{
      return new Promise( async (resolve, reject)=>{
        const sql = `SELECT CODIGO  ,NOME   FROM ${db_publico}.cad_pgru WHERE ATIVO = 'S';` 
      await conn.query(sql,(err, result)=>{
        if(err){
          reject(err);
        }else{  
          resolve(result);
        }
      })
    })
  }

static  async buscaUnidades ( codigo:any):Promise< [ { PRODUTO:number, DESCRICAO:string, SIGLA: string } ] >{
    return new Promise( async (resolve, reject)=>{
        const sql = `SELECT  PRODUTO, DESCRICAO, SIGLA  FROM ${db_publico}.unid_prod where PRODUTO = ${codigo} AND item = 1 ;` 
      await conn.query(sql,(err, result)=>{
        if(err){
          console.log(`Ocorreu um erro ao tentar consultar as unidade de medido do produto: ${codigo}` , err)
          reject(err);
        }else{  
          resolve(result);
        }
      })
    })
  }

  static async buscaParaexportaçãoexcel(){
    const sql = `
    SELECT
               
                p.CODIGO as Código,
                p.DESCRICAO as Descrição,
                
                  un.SIGLA as Unidade,
                  cf.NCM,
                p.ORIGEM Origem,
                tp.PRECO Preço,
            p.LARGURA 'Largura do Produto',
                p.PESO 'Peso líquido (Kg)',
               p.NUM_FABRICANTE as 'GTIN/EAN' ,
                p.ALTURA 'Altura do Produto',
                  p.COMPRIMENTO 'Profundidade do produto',
                  p.qtde_vol 'Itens p/ caixa',
                  
                CAST(p.APLICACAO AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO,
                
              m.descricao AS Marca,
                p.DESCRICAO as 'Descrição Curta',
               concat(p.GARANTIA, ' MESES') as 'Meses Garantia no Fornecedor' 
              
      
            FROM  cad_prod p
              JOIN  cad_pgru cg ON cg.CODIGO = p.GRUPO
            LEFT JOIN  cad_pmar m ON m.codigo = p.marca
            LEFT JOIN   class_fiscal cf ON cf.CODIGO = p.CLASS_FISCAL
            LEFT JOIN  subgrupos sg ON sg.CODIGO = p.SUBGRUPO AND cg.CODIGO = sg.COD_GRUPO
            left join unid_prod un on un.produto = p.codigo
       
           LEFT JOIN  prod_tabprecos tp ON p.CODIGO = tp.PRODUTO and tp.tabela =1
           where p.ativo  ='S'
        
    ` 
  }

}
