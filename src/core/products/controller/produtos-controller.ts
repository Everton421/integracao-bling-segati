import { Request, Response } from "express";
import { ApiConfigRepository } from "../../company/data/api-config-repository";
import { ProdutoApiRepository } from "../data/produto-api-repository";
import { ProdutoRepository } from "../data/produto-repository";
import { SyncPrice } from "../../prices/services/sync-price";
import { SyncProduct } from "../../products/services/sync-product";
import { SyncStock } from "../../inventory/services/sync-stock";

export class ProdutoController {


    private delay(ms: number) {
        console.log(`Aguardando ${ms / 1000} segundos...`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private syncProduct = new SyncProduct();
    private syncPrice = new SyncPrice();
   
    private syncStock = new SyncStock();


    /**  controlador responsavel por gerar o vinculo do produto e enviar o estoque
     *função ideal para clientes que ja possuem produtos cadastrados no bling   
    */
    async geraVinculo(req: Request, res: Response) {

        const produtoSelecionados: string[] = req.body.produtos;

        // configurações para envio das informações
        let dadosConfig = await ApiConfigRepository.buscaConfig();

        // contem o valor do parametro de envio de estoque ( 0: nao enviar estoque, 1: enviar o estoque) 
        const envEstoque = Number(dadosConfig[0].enviar_estoque);

        // contem o valor do parametro de envio de preco ( 0: nao enviar preco, 1: enviar o preco) 
        const envPreco = Number(dadosConfig[0].enviar_precos)
        // tabela onde é feita a consulta dos precos a serem enviados
        const tabela_preco = Number(dadosConfig[0].tabela_preco);

        let responseIntegracao

        if (Array.isArray(produtoSelecionados)) {

            for (const i of produtoSelecionados) {

                const codigoSistema: number = parseInt(i);
                const produtoSincronizado = await ProdutoApiRepository.findByCodeSystem(parseInt(i));

                const resultSaldoProduto = await  ProdutoRepository.buscaEstoqueReal(codigoSistema, 1)
                const saldoProduto = resultSaldoProduto[0].ESTOQUE;
                const data_estoque = resultSaldoProduto[0].DATA_RECAD;

                const arrProductSystem = await ProdutoRepository.buscaProduto(codigoSistema)
                const productSystem = arrProductSystem[0];

                const data_recad_sistema = productSystem.DATA_RECAD

                const resultDeposito = await ProdutoApiRepository.findDefaultDeposit();
                let idDepositoBling;
                if (resultDeposito.length > 0) {
                    idDepositoBling = resultDeposito[0].Id_bling;
                } else {
                    idDepositoBling = await this.syncStock.getDeposit();
                }

                //verifica se ja foi enviado, consultando o banco da integração
                if (produtoSincronizado.length > 0) {
                    let resultPostEstoque
                    await this.delay(1000);
                    let msgRetorno;

                    if (envEstoque > 0) {
                        resultPostEstoque = await this.syncStock.postEstoque(produtoSincronizado[0].Id_bling, saldoProduto, idDepositoBling, produtoSincronizado[0].codigo_sistema, data_estoque)
                        if (resultPostEstoque && resultPostEstoque.msg) {
                            msgRetorno = resultPostEstoque.msg;
                        }
                    }
                    if (envPreco > 0) {

                        let arrPreco = await ProdutoRepository.buscaPreco(codigoSistema, tabela_preco)
                        let resultEnvPreco = await this.syncPrice.postPrice(produtoSincronizado[0].Id_bling, produtoSincronizado[0].codigo_sistema, tabela_preco);
                        if (resultEnvPreco && resultEnvPreco.msg) {
                            msgRetorno = resultEnvPreco.msg;
                        }
                    }

                    responseIntegracao = msgRetorno;

                } else {
                    // verifica se o produto/variação existe no bling
                    await this.delay(1000);

                    let resultVinculo = await this.syncProduct.getVinculoProduto({ codigo: codigoSistema, data_recad_sistema })
                    //     console.log('Resultado do vinculo : ', resultVinculo)
                    if (resultVinculo) {

                        if (resultVinculo?.ok) {
                            await this.delay(1000);

                            let prodVinculo;
                            let resultEstoque;
                            let msgRetorno;
                            if (envEstoque > 0) {
                                if (resultVinculo?.produto !== null) {
                                    prodVinculo = resultVinculo?.produto
                                    resultEstoque = await this.syncStock.postEstoque(prodVinculo.id_bling, saldoProduto, idDepositoBling, prodVinculo?.codigo_sistema, data_estoque)
                                    if (resultEstoque && resultEstoque.msg) {
                                        msgRetorno = resultEstoque.msg;
                                    }
                                }
                            }

                            if (envPreco > 0) {
                                if (resultVinculo?.produto !== null) {
                                    let arrPreco = await ProdutoRepository.buscaPreco(codigoSistema, tabela_preco)
                                    let resultEnvPreco = await this.syncPrice.postPrice(produtoSincronizado[0].Id_bling, produtoSincronizado[0].codigo_sistema, tabela_preco);

                                    if (resultEnvPreco && resultEnvPreco.msg) {
                                        msgRetorno = resultEnvPreco.msg;
                                    }
                                }
                            }

                            responseIntegracao = msgRetorno
                        } else {
                            responseIntegracao = resultVinculo.msg;
                        }
                    }

                }
            }

        } else {
            console.log(" é necessario que seja informado um array com os codigos dos produtos")
        }
        return res.status(200).json({ msg: responseIntegracao })
    }





    async enviaProduto(req: Request, res: Response) {
        const produtoSelecionados: string[] = req.body.produtos;
        let arrResult = []
        for (const i of produtoSelecionados) {
            
            let result: any = await this.syncProduct.postOrPutProductBling(Number(i), false);
            if (result.resultados) {
                arrResult.push(result.resultados)
            }

        }

        res.status(200).json({ resultados: arrResult.toString() })
    }


    async viewProducts(req: Request, res: Response){
    const produtos = await ProdutoApiRepository.buscaTodos();
    const tabelas = await ProdutoRepository.buscaTabelaDePreco();
    const grupos = await ProdutoRepository.buscaGrupos();
    const marcas = await ProdutoRepository.buscaMarcas();

    res.render('produtos', { 'produtos': produtos, 'tabelas': tabelas , 'grupos':grupos , 'marcas':marcas});

    }

}
