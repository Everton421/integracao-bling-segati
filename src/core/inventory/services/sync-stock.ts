import { verificaTokenTarefas } from "../../../shared/Middlewares/TokenMiddleware";
import { ProdutoRepository } from "../../products/data/produto-repository";
import { ProdutoApiRepository } from "../../products/data/produto-api-repository";
import ConfigApi from "../../../shared/api";
import { DateService } from "../../../shared/utils/date-service";
import { ApiConfigRepository } from "../../company/data/api-config-repository";


export class SyncStock{
     

 
              private api = new ConfigApi();

         private delay(ms: number) {    
            console.log(`Aguardando ${ms / 1000} segundos...`);
                return new Promise(resolve => setTimeout(resolve, ms));
        }


/**
 * 
 * @param idProdutobling :id do produto no bling
 * @param saldo saldo a ser enviado
 * @param idDeposito id do deposito no bling 
 * @param codigoProdutoSistema codigo do produto no sistema
 * @param data_estoque daa de envio do estoque
 * @returns 
 */
  async postEstoque(idProdutobling:string, saldo:number, idDeposito:any, codigoProdutoSistema:number, data_estoque:string) : Promise< { ok:boolean, erro:boolean, msg:string} | undefined > {
            await this.api.configurarApi();
                        let estoque=  {
                               "produto": {
                               "id": idProdutobling
                               },
                               "deposito": {
                               "id": idDeposito
                               },
                               "operacao": "B",
                               "preco": 0,
                               "custo": 0,
                               "quantidade": saldo,
                               "observacoes": ""
                           }
                           try{
                                   let status;
                                   let estoqueEnviado;
                                   const resultEstoqueEnviado = await this.api.config.post('/estoques', estoque);
                                   status = resultEstoqueEnviado.status
                                 if(status !== 201 || status !== 200 ){
                                   
                                   while(status !== 201 || status !== 200){
                                       await this.delay(1000);
                                      // console.log(` aguardando para enviar saldo para o produto ${idProdutobling}...`)
                                       estoqueEnviado =  await  this.api.config.post('/estoques', estoque);
                                       status = estoqueEnviado.status
                                       if(status === 201 || status ===200){
                                        
                                           await ProdutoApiRepository.atualizaSaldoEnviado(idProdutobling , saldo,  DateService.formatarDataHora(data_estoque) );
                                         //  console.log(estoqueEnviado.data);    
                                           //console.log(` enviado saldo para produto: ${ codigoProdutoSistema}   saldo: ${saldo}  idBling: ${ idProdutobling } `);
                                           return { ok: true, erro:false,  msg:   ` enviado saldo para produto: ${ codigoProdutoSistema}   saldo: ${saldo}  idBling: ${ idProdutobling } `    }
                                       }
                                   }
                                   }else{
                                       return { ok:false, erro: true, msg:   ` ocorreu um erro ao tentar enviar o  saldo para produto: ${ codigoProdutoSistema}   saldo: ${saldo}  idBling: ${ idProdutobling } `   }
                                   }
                       }catch( err ){
                                 console.log(` Ocorreu um erro ao tentar enviar o saldo para o produto ${codigoProdutoSistema}  `,err)
                         return { erro: true, ok:false, msg:   ` ocorreu um erro ao tentar enviar o  saldo para produto: ${ codigoProdutoSistema}   saldo: ${saldo}  idBling: ${ idProdutobling } `   }
                   }
      }


  /**
   *  obtem os depositos do bling
   * @returns 
   */
    async getDeposit() {
                
            await this.api.configurarApi();
                  type depositoBling = {
                          id : string,
                          descricao : string,
                          situacao : number,
                          padrao : boolean,
                          desconsiderarSaldo : boolean
                  }
                  const resultDeposito = await   this.api.config.get('/depositos');
                      if(!resultDeposito.data.data){
                          console.log("nao encontrado deposito no bling");
                      }
                  const produtoApi = new ProdutoApiRepository();
                      const arrDeposito:depositoBling[] = resultDeposito.data.data 
                          let  id_bling; 
                          
                          let objeDeposit:any ;
                          if(arrDeposito.length > 0 ){
                              arrDeposito.forEach((i)=>{
                                  id_bling = i.id
                                  if( i.padrao === true ){
                                      
                                  objeDeposit = { id_bling: i.id, descricao:i.descricao ,desconsiderarSaldo:i.padrao, situacao:i.situacao, padrao: 'S' };
                                  }
                              })
                              try{
                                  await ProdutoApiRepository.insertDeposit(objeDeposit)
                          }catch(e){
                              console.log(e)
                              return;
                          }
                          return id_bling;
                          }else{
                              return null;
                          }
       }
                 
    /** faz o envio automatico do saldo dos produtos  
   * @returns  
    */
    async enviaEstoque() {
        await verificaTokenTarefas();

        try {
            await    this.api.configurarApi(); // Aguarda a configuração da API

            const resultDeposito = await ProdutoApiRepository.findDefaultDeposit();

            const arrApiConfig = await ApiConfigRepository.buscaConfig();
                const configApi = arrApiConfig[0];
            let idDepositoBling;
            if (resultDeposito.length > 0) {
                idDepositoBling = resultDeposito[0].Id_bling;
            } else {
                idDepositoBling = await this.getDeposit();
                if (!idDepositoBling || isNaN(idDepositoBling)) {
                    console.log("ocoreu um erro ao tentar obter o deposito")
                    return;
                }
            }

            const produtosEnviados: any = await ProdutoApiRepository.buscaSincronizados();
            if (produtosEnviados.length > 0) {

                for (const data of produtosEnviados) {
                    const resultSaldo: any = await ProdutoRepository.buscaEstoqueReal(data.codigo_sistema, configApi.setor);

                    let saldo_enviado = data.saldo_enviado;


                    let saldoReal;
                    let data_estoque;
                    if (resultSaldo.length > 0) {
                        saldoReal = resultSaldo[0].ESTOQUE;
                        data_estoque = resultSaldo[0].DATA_RECAD
                    } else {
                        saldoReal = 0;
                        data_estoque =  DateService.obterDataHoraAtual()
                    }
                    //console.log( new Date(data_estoque) ,' > ', new Date(data.data_estoque))

                    if (   saldoReal != saldo_enviado ) {

                        let estoque = {
                            "produto": {
                                "id": data.Id_bling
                            },
                            "deposito": {
                                "id": idDepositoBling
                            },
                            "operacao": "B",
                            "preco": 0,
                            "custo": 0,
                            "quantidade": saldoReal,
                            "observacoes": ""
                        }

                        try {
                            let status;
                            let estoqueEnviado;
                            estoqueEnviado = await  this.api.config.post('/estoques', estoque);
                            status = estoqueEnviado.status
                            console.log(estoqueEnviado.status);

                            if (status !== 201) {
                                while (status !== 201 || status !== 200) {
                                    await this.delay(2000);
                                    console.log(`[V]  aguardando para enviar saldo para o produto ${data.codigo_sistema}...`)
                                    estoqueEnviado = await this.api.config.post('/estoques', estoque);

                                    status = estoqueEnviado.status

                                    if (status === 201 || status === 200) {
                                        await ProdutoApiRepository.atualizaSaldoEnviado(data.Id_bling, saldoReal, DateService.formatarDataHora(data_estoque));
                                        console.log(`[V]  enviado saldo para produto: ${data.codigo_sistema}   saldo: ${saldoReal}  idBling: ${data.Id_bling} `);
                                    }
                                }
                            } else {
                                console.log(` [V] enviado saldo para produto: ${data.codigo_sistema}   saldo: ${saldoReal}  idBling: ${data.Id_bling} `);
                                await ProdutoApiRepository.atualizaSaldoEnviado(data.Id_bling, saldoReal,  DateService.formatarDataHora(data_estoque));
                            }
                        } catch (err) {
                            console.log(err + ` erro ao enviar o estoque para o produto ${data.codigo_sistema} `);
                        }
                        await this.delay(2000);
                    } else {
                        console.log(`[X] Não ouve alteração no saldo do produto ${data.codigo_sistema}.`);
                    }
                }

            }

        } catch (error) {
            console.log(error)
        }
        await ApiConfigRepository.atualizaDados({ult_env_estoque:DateService.obterDataHoraAtual()})
    }
    
}