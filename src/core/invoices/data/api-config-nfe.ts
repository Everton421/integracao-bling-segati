import { conn, database_api } from "../../../database/databaseConfig"
import { config_nfe } from "../../../interfaces/config_nfe"

type queryConfigNfe = {
 id?:string ,
  id_natureza_operacao?:string,
  transacao_sistema?: string,
  codigo_transacao_sistema?:string
}


 type dataPartialUpdateConfigNfe = Omit< Partial<config_nfe>, 'id' > & { id :number} 

export class ApiConfigNfeRepository{


    async findConfigNfe({ id, id_natureza_operacao, transacao_sistema, codigo_transacao_sistema}:queryConfigNfe ): Promise<config_nfe[]>{

         return new Promise(   (resolve, reject)=>{
                         let sql =
                            ` SELECT 
                               * 
                             FROM ${database_api}.config_nfe   `

                                const whereClause = " WHERE "
                            const paramsQuery = []
                            const valuesQuery =[]


                                if( id ){
                                    paramsQuery.push(' id = ? ')
                                    valuesQuery.push(id);
                                }
                                if( id_natureza_operacao ){
                                    paramsQuery.push(' id_natureza_operacao = ? ')
                                    valuesQuery.push(id_natureza_operacao);
                                }
                                if( transacao_sistema ){
                                    paramsQuery.push(' transacao_sistema = ? ')
                                    valuesQuery.push(transacao_sistema);
                                }
                                if( codigo_transacao_sistema ){
                                    paramsQuery.push(' codigo_transacao_sistema = ? ')
                                    valuesQuery.push(codigo_transacao_sistema);
                                }
                                const finalSql = sql + whereClause + paramsQuery.join(' AND ');

                              conn.query( finalSql, valuesQuery ,( err, result )=>{
                                if(err){
                                    reject(err)
                                }else{
                                    resolve(result)
                                
                                }
                            })
                        })

    }

    async insertConfigNfe(dataConfigNfe: Omit<config_nfe, 'id'> ){
         return new Promise(   (resolve, reject)=>{
        
            const sql = ` INSERT INTO ${database_api}.confi_nfe set
                            id_natureza_operacao = ?,
                            natureza_operacao = ?,
                            transacao_sistema = ?,
                            codigo_transacao_sistema = ? 
                `
                const { codigo_transacao_sistema, id_natureza_operacao, natureza_operacao, transacao_sistema} = dataConfigNfe;
                    const valuesinsert =[id_natureza_operacao , natureza_operacao, transacao_sistema,codigo_transacao_sistema ]

        conn.query( sql, valuesinsert ,( err, result )=>{
                                if(err){
                                    reject(err)
                                }else{
                                    resolve(result)
                                
                                }
                            })
                        })
    }


    async partialUpdateConfigNfe(dataConfigNfe: dataPartialUpdateConfigNfe ){
        const  { codigo_transacao_sistema, id, id_natureza_operacao, natureza_operacao, transacao_sistema} = dataConfigNfe;
         return new Promise(   (resolve, reject)=>{
                         let sql =
                            ` 
                             UPDATE ${database_api}.config_nfe  ;`

                            const paramsQuery = []
                            const valuesQuery =[]

                               
                                if( id_natureza_operacao ){
                                    paramsQuery.push(' id_natureza_operacao = ? ')
                                    valuesQuery.push(id_natureza_operacao);
                                }
                                if( transacao_sistema ){
                                    paramsQuery.push(' transacao_sistema = ? ')
                                    valuesQuery.push(transacao_sistema);
                                }
                                if( codigo_transacao_sistema ){
                                    paramsQuery.push(' codigo_transacao_sistema = ? ')
                                    valuesQuery.push(codigo_transacao_sistema);
                                }

                                const whereClause =   ` WHERE id = ? ` 
                                    valuesQuery.push(id);

                                const finalSql = sql  + paramsQuery.join(' , ') + whereClause;

                              conn.query( finalSql, valuesQuery ,( err, result )=>{
                                if(err){
                                    reject(err)
                                }else{
                                    resolve(result)
                                
                                }
                            })
                        })

    }
}
