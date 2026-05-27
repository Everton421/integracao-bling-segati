import { conn_api, database_api,    db_publico,  } from "../../../database/databaseConfig"
import { DateService } from "../../../shared/utils/date-service"
import { FormatString } from "../../../shared/utils/format-string"

/**
 *   representa os dados vindos da tabela de produtos da integração.
 */
type IProdutoApi={ 
    Id_bling: string
    descricao:string
    codigo_sistema:number
    data_envio:string
    saldo_enviado:number
    variacao: 'S' | 'N'
    data_recad_sistema:string
    data_estoque:string
    com_variacao: 'S' | 'N'
    data_preco:string
    
}



type OkPacket = {
  fieldCount:number
  affectedRows:number
  insertId:number
  serverStatus:number
  warningCount:number
  message: string
  protocol41: true,
  changedRows:number
}
 
type IProdutoApiSystem= { // 
    Id_bling: string
    descricao:string
    codigo_sistema:number
    data_envio:string
    saldo_enviado:number
    variacao: 'S' | 'N'
    data_recad_sistema:string
    data_estoque:string

    CODIGO:number
    DESCRICAO:string
    GRUPO: number
    MARCA: number
    /**  descricao vinda da tabela do sistema */
}

/**
 *   representa os dados necessarios para inserir um item na tabela de produtos da integração.
 */
type inputProdApi = {
  id_bling:string 
  codigo_sistema:number
  descricao:string
  saldo:number,
  variacao:'S'| 'N' | string
  data_recad_sistema:string
  data_estoque:string
  data_envio:string
  com_variacao:'S'| 'N' | string
   data_preco:string
} 

/**
 *   representa os dados do deposito cadastrado na tabela depositos da integração.
 */
type IDeposito  = {
     Id_bling:string 
    descricao:string
    situacao:number
    padrao: 'S' | 'N'
}
type IProductSinc = IProdutoApi & { CODIGO :number}

/**
 *   representa os dados necessarios para cadastrar na tabela depositos da integração.
 */
type InputDeposito  = {
    id_bling:string 
    descricao:string
    situacao:number
    padrao: 'S' | 'N'
}
 

export class ProdutoApiRepository{

         dateService = new DateService();
 

    static    async inserir( value:inputProdApi ){
          
            
            return new Promise( async (resolve, reject)=>{

                const { id_bling, data_envio, codigo_sistema , descricao, saldo, variacao, data_recad_sistema, data_estoque, com_variacao, data_preco} = value;
                let descricaoSemAspas =   FormatString.formatDescricao(descricao);

                const sql = ` INSERT INTO ${database_api}.produtos VALUES
                 (
                '${id_bling}',
                '${descricaoSemAspas}',
                '${codigo_sistema}',
                '${data_envio}', 
                '${saldo}',
                '${variacao}',
                '${data_recad_sistema}',
                '${ data_estoque }',
                '${com_variacao}',
                '${data_preco}' 
                 )` 

                await conn_api.query(sql, (err, result)=>{
                    if(err){
                        console.log("Erro ao tentar inserir produto na banco de dados da integracao   ", err)
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }



    static async buscaTodosPaginado(
        page: number,
        limit: number,
        filters?: { search?: string; status?: string; grupo?: string; marca?: string }
    ): Promise<IProdutoApiSystem[]> {
        return new Promise(async (resolve, reject) => {
            const conditions: string[] = ["P.NO_SITE = 'S'", "P.ATIVO = 'S'"];
            const params: any[] = [];

            if (filters?.search) {
                conditions.push('(P.CODIGO LIKE ? OR P.DESCRICAO LIKE ?)');
                const term = `%${filters.search}%`;
                params.push(term, term);
            }
            if (filters?.status === 'enviados') {
                conditions.push('itp.Id_bling IS NOT NULL');
            } else if (filters?.status === 'pendentes') {
                conditions.push('itp.Id_bling IS NULL');
            }
            if (filters?.grupo && filters.grupo !== 'todos') {
                conditions.push('P.GRUPO = ?');
                params.push(Number(filters.grupo));
            }
            if (filters?.marca && filters.marca !== 'todos') {
                conditions.push('P.MARCA = ?');
                params.push(Number(filters.marca));
            }

            const offset = (page - 1) * limit;
            params.push(limit, offset);

            const sql = `
                SELECT
                    itp.*,
                    P.CODIGO,
                    P.DESCRICAO,
                    P.GRUPO,
                    P.MARCA
                FROM ${db_publico}.cad_prod P
                    LEFT JOIN ${database_api}.produtos AS itp ON itp.codigo_sistema = P.CODIGO
                WHERE ${conditions.join(' AND ')}
                ORDER BY P.CODIGO
                LIMIT ? OFFSET ?
            `;

            await conn_api.query(sql, params, (err, result: IProdutoApiSystem[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    static async contaTotal(filters?: { search?: string; status?: string; grupo?: string; marca?: string }): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const conditions: string[] = ["P.NO_SITE = 'S'", "P.ATIVO = 'S'"];
            const params: any[] = [];

            if (filters?.search) {
                conditions.push('(P.CODIGO LIKE ? OR P.DESCRICAO LIKE ?)');
                const term = `%${filters.search}%`;
                params.push(term, term);
            }
            if (filters?.status === 'enviados') {
                conditions.push('itp.Id_bling IS NOT NULL');
            } else if (filters?.status === 'pendentes') {
                conditions.push('itp.Id_bling IS NULL');
            }
            if (filters?.grupo && filters.grupo !== 'todos') {
                conditions.push('P.GRUPO = ?');
                params.push(Number(filters.grupo));
            }
            if (filters?.marca && filters.marca !== 'todos') {
                conditions.push('P.MARCA = ?');
                params.push(Number(filters.marca));
            }

            const sql = `
                SELECT COUNT(*) as total
                FROM ${db_publico}.cad_prod P
                    LEFT JOIN ${database_api}.produtos AS itp ON itp.codigo_sistema = P.CODIGO
                WHERE ${conditions.join(' AND ')}
            `;

            await conn_api.query(sql, params, (err, result: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0].total);
                }
            });
        });
    }

       static  async buscaSincronizados():Promise<IProdutoApi[]>{
            return new Promise( async ( resolve, reject )=>{
               const sql    = `  SELECT * FROM ${database_api}.produtos ;`
            
                await conn_api.query(sql, (err, result:IProdutoApi[])=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }

            static  async buscaNaoSincronizados():Promise< [ {CODIGO:number, DATA_RECAD:string} ]>{
            return new Promise( async ( resolve, reject )=>{
               const sql  = `   
                    select 
                        cp.CODIGO,
                        cp.DATA_RECAD
                        from ${db_publico}.cad_prod cp 
                        left join ${database_api}.produtos p on p.codigo_sistema = cp.codigo
                        where 
                            p.Id_bling is null and 
                            cp.ativo = 'S'
                ;`
            
                await conn_api.query(sql, (err, result)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }

        /**
         *  obtem os produtos enviados após a data informada
         * @param data 
         * @returns 
         */
     static     async findChagedAfter(data:string):Promise<IProductSinc[]>{
            return new Promise( async ( resolve, reject )=>{

                    const sql = `
                        select
                            pb.*,
                            cp.CODIGO
                            from ${db_publico}.cad_prod cp 
                            left join ${database_api}.produtos as pb on cp.CODIGO = pb.codigo_sistema 
                            where cp.NO_SITE = 'S' AND cp.data_recad > ?
                `;


                await conn_api.query(sql,data,  (err, result )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }

  static    async findByIdBling( id:string ):Promise <IProdutoApi[]> {
            return new Promise( async ( resolve, reject )=>{
                const sql = ` SELECT * FROM ${database_api}.produtos WHERE  Id_bling = '${id}' ;`
                await conn_api.query(sql, (err, result:IProdutoApi[] )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        } 
       

     static   async findByCodeSystem( codigo:number ):Promise <IProdutoApi[]> {
            return new Promise( async ( resolve, reject )=>{
                const sql = ` SELECT * FROM ${database_api}.produtos WHERE  codigo_sistema = ${codigo} ;`
                await conn_api.query(sql, (err, result:IProdutoApi[] )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        } 

  static      async atualizaSaldoEnviado( id:any, saldo:any, data_estoque:string ){
            return new Promise( async ( resolve, reject )=>{
                const sql = ` UPDATE ${database_api}.produtos set saldo_enviado = ${saldo}, data_estoque = '${data_estoque}'  WHERE  Id_bling = ${id} ;`
                await conn_api.query(sql, (err, result )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }
        
        
     static   async updateByParama( param:Partial< inputProdApi> ):Promise<OkPacket | undefined>{
            if(!param.id_bling){
                    console.log("É necessario informar o id do produto para atualizar o produto no banco de dados ")
                return;
            }
            return new Promise( async ( resolve, reject )=>{
                const sql = ` UPDATE ${database_api}.produtos set  `

                let conditions =[]
                let values= []

                if( param.descricao){
                    conditions.push(' descricao = ? ')
                    values.push( param.descricao);
                }

                if( param.codigo_sistema){
                    conditions.push(' codigo_sistema = ? ')
                    values.push( param.codigo_sistema);
                }
             
                if( param.data_envio){
                    conditions.push(' data_envio = ? ')
                    values.push(   DateService.formatarDataHora(param.data_envio));
                }
                if(param.saldo){
                     conditions.push(' saldo_enviado = ? ')
                     values.push(param.saldo)
                }

                if( param.variacao){
                    conditions.push(' variacao = ? ')
                    values.push( param.variacao )
                }
                if( param.com_variacao){
                    conditions.push(' com_variacao = ? ')
                    values.push( param.com_variacao )
                }

                if( param.data_recad_sistema){
                    conditions.push(' data_recad_sistema = ? ')
                    values.push( DateService.formatarDataHora(param.data_recad_sistema))
                }

                if( param.data_preco){
                    conditions.push(' data_preco = ? ')
                    values.push( DateService.formatarDataHora(param.data_preco))
                }

                 if( param.data_estoque){
                    conditions.push(' data_estoque = ? ')
                    values.push( DateService.formatarDataHora(param.data_estoque))
                }

                let finalSql = sql + conditions.join(' , ') + ` WHERE Id_bling = ${param.id_bling}`
                await conn_api.query(finalSql, values, (err, result )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }
 static async findDeAllDeposit() :Promise<IDeposito[]>{
               return new Promise( async ( resolve, reject )=>{
                const sql = ` SELECT * FROM ${database_api}.depositos  ;`
                await conn_api.query(sql, (err, result:IDeposito[] )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }

     static   async findDefaultDeposit() :Promise<IDeposito[]>{
               return new Promise( async ( resolve, reject )=>{
                const sql = ` SELECT * FROM ${database_api}.depositos WHERE  padrao = 'S' ;`
                await conn_api.query(sql, (err, result:IDeposito[] )=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }

   static      async insertDeposit( value:InputDeposito ){
          
            const dateService = new DateService();
            return new Promise( async (resolve, reject)=>{

                const { id_bling, descricao, padrao, situacao} = value;
                let descricaoSemAspas =  FormatString.formatDescricao(descricao);

                const sql = ` INSERT INTO ${database_api}.depositos VALUES ('${id_bling}','${descricao}','${situacao}', '${padrao }')` 

                await conn_api.query(sql, (err, result)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        }

}
