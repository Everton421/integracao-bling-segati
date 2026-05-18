import { conn_api,database_api } from "../../database/databaseConfig";
import { DateService } from "../../shared/utils/date-service";
export class ApiTokenRepository{

    public token?:any;


async insereToken(json:any, database:any){
    return new Promise(async (resolve, reject) => {
      const {
          access_token,
          refresh_token,
          expires_in,
      } = json;

      const dataInsercao = DateService.obterDataHoraAtual();

      const sql = `INSERT INTO ${database}.tokens (id, token, refresh_token, expires_in, ult_atualizacao) VALUES (1, '${access_token}', '${refresh_token}','${expires_in}','${dataInsercao}') 
                   ON DUPLICATE KEY UPDATE token = VALUES(token), refresh_token = VALUES(refresh_token), expires_in = VALUES(expires_in),  ult_atualizacao = VALUES(ult_atualizacao);`;

      await conn_api.query(sql, (err, response) => {
          if (err) {
              reject(err);
          } else {
              resolve(response.insertID);
          }
      });
  });
    }


    async  buscaToken2(){
        const sql = `SELECT  
            CAST(t.token  AS CHAR(1000)  CHARACTER SET latin1) as token , 
            t.Id,
            t.expires_in,
            t.ult_atualizacao
             FROM ${database_api}.tokens t  WHERE t.Id = 1`;
        return new Promise( async (resolve, reject)=>{
            await conn_api.query(sql, (err, result) => {
                if(err){
                    reject(err);
                }else{
                    resolve(result);
                }
        })
    })
    }
  async  buscaToken(){
        const sql = `SELECT   *
             FROM ${database_api}.tokens t  WHERE t.Id = 1`;
        return new Promise( async (resolve, reject)=>{
            await conn_api.query(sql, (err, result) => {
                if(err){
                    reject(err);
                }else{
                    resolve(result);
                }
        })
    })
    }

    
      // valida se o token esta valido com base na data de criação e no tempo de expiração
    // retornando true para token valido
    // e false para token invalido
    verificaExpiracao(token: any) {
        const now = new Date();
        const dataAtual = now.getTime(); // Obtém o timestamp atual em milissegundos
    
        const dataToken = new Date(token.ult_atualizacao).getTime(); // Obtém o timestamp da última atualização do token em milissegundos
    
        const expires_in = token.expires_in * 1000; // Converte o tempo de expiração em segundos para milissegundos
    
        // Calcula o timestamp do momento em que o token expirará
        const dataExpiracao = dataToken + expires_in;
    
        // Verifica se a data atual é menor que a data de expiração do token
        const tokenValido = dataAtual < dataExpiracao;

        return tokenValido;
        //console.log
    }   

}