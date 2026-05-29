import { conn_api, database_api } from "../../../database/databaseConfig";
import { fotos_produtos } from "../../../interfaces/fotos_produtos";


export class ApiFotosProdutosRepository {

    static async insert(data: {
        codigo_produto_sistema: number
        referencia: string
        cod_barras: string
        link: string
        hash_sha256: string
        nome_foto: string
    }) {
        return new Promise(async (resolve, reject) => {
            const { cod_barras, codigo_produto_sistema,
                hash_sha256, link, nome_foto, referencia
            } = data;
            let sql = ` 
                       INSERT INTO ${database_api}.fotos_produtos  SET  
                        codigo_produto_sistema = ? ,
                        referencia = ? ,
                        cod_barras = ?,
                        link =  ? ,
                        hash_sha256 = ?,
                        nome_foto = ?  
                            ON DUPLICATE KEY UPDATE 
                                nome_foto = (nome_foto),
                                link = (link)
;
                    `;
            const values = [
                codigo_produto_sistema,
                referencia,
                cod_barras,
                link,
                hash_sha256,
                nome_foto
            ];
            await conn_api.query(sql, values, (err: any, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }


    static async getByParams(query: { codigo_produto_sistema?: number, referencia?: string, nome_foto?: string }):Promise<fotos_produtos[]>{
        return new Promise(async (resolve, reject) => {

            const { codigo_produto_sistema, nome_foto, referencia } = query;

            let baseSql = `
            SELECT * FROM ${database_api}.fotos_produtos 
            `
            const wherClause = ' WHERE  ';
            const conditions = []
            const values = []

            if (codigo_produto_sistema) {
                conditions.push(' codigo_produto_sistema = ? ');
                values.push(codigo_produto_sistema);
            }
            if (nome_foto) {
                conditions.push(' nome_foto = ? ');
                values.push(nome_foto);
            }
            if (referencia) {
                conditions.push(' referencia = ? ');
                values.push(referencia);
            }

            const finalSql = baseSql+ wherClause  + conditions.join(" AND ")  + " order by codigo_produto_sistema;";
            await conn_api.query(finalSql, values, (err: any, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

    }

}