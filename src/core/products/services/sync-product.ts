import { IResponseErrorApi } from "../../../interfaces/IResponseErrorApi";
import { IProdutoBlingSemPreco, ProdutoMapper } from "../mapping/produto-mapper";
import { IProductSystem } from "../../../interfaces/IProductSystem";
import ConfigApi from "../../../shared/api";
import { DateService } from "../../../shared/utils/date-service";
import { SyncPrice } from "../../prices/services/sync-price";
import { SyncStock } from "../../inventory/services/sync-stock";
import { ApiConfigRepository } from "../../company/data/api-config-repository";
import { SyncCategory } from "../../categories/services/sync-category";
import { ProdutoRepository } from "../data/produto-repository";
import { ProdutoApiRepository } from "../data/produto-api-repository";
import { CategoriaApiRepository } from "../../categories/data/categoria-api-repository";

type dados = {
    codigo:number,
    data_recad_sistema:string
}

export class  SyncProduct{
         
         private   api = new ConfigApi();
       
    
         
         private syncStock = new SyncStock();
         private syncPrice = new SyncPrice();
     
       
         
        constructor(){
            ProdutoRepository
        }
          
    private delay(ms: number) {
        console.log(`Aguardando ${ms / 1000} segundos para atualizar...`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     *  verifica se o produto existe no bling, consulta feita atravez do codigo do sistema, caso exista é feito o vinculo do produto
     * @param dados 
     * @returns 
     */     
    async getVinculoProduto(dados:  { codigo:number,data_recad_sistema:string }) {
        try {
            await this.api.configurarApi();

            const { data_recad_sistema } =dados;
            const data_recad = data_recad_sistema || DateService.obterDataHoraAtual();

            let tipoVariacao = 'N'
            let comVariacao = 'N'
            let dadosProdutoBling:any[]=[]

            const produtoSemVinculo = await this.api.config.get('/produtos', {
                params: {
                    pagina: 1,
                    limite: 100,
                    criterio: 2,
                    codigo: dados.codigo
                }
            })
            await this.delay(1000);

               if(produtoSemVinculo.data.data.length > 0){
                    dadosProdutoBling = produtoSemVinculo.data.data;
                    if( dadosProdutoBling[0].idProdutoPai && dadosProdutoBling[0].formato === 'S' ){
                        tipoVariacao = 'S'
                    }

                    if( !dadosProdutoBling[0].idProdutoPai && dadosProdutoBling[0].formato === 'V'){
                          comVariacao = 'S'
                    }
                }

            if (dadosProdutoBling.length > 0) {
                const produtoEnviado = {
                    id_bling: dadosProdutoBling[0].id,
                    codigo_sistema: dados.codigo,
                    descricao: dadosProdutoBling[0].nome,
                    saldo: 0,
                    variacao: tipoVariacao,
                    com_variacao: comVariacao,
                    data_recad_sistema: data_recad,
                    data_estoque: DateService.obterDataHoraAtual(),
                    data_envio: DateService.obterDataHoraAtual(),
                    data_preco:'2001-01-01 10:00:00'
                }
                try {
                    let prod: any = await ProdutoApiRepository.inserir(produtoEnviado);
                     if (prod.affectedRows === 1) {
                         console.log(`[V] Vinculo registrado: ${dados.codigo} -> ${dadosProdutoBling[0].id}`);
                         return { ok: true, erro:false, produto: produtoEnviado ,msg:   ` Registrado vinculo para o produto: ${ dados.codigo}     idBling: ${ dadosProdutoBling[0].id } `  }
                    }
                } catch (error) {
                    console.log(error)
                    return { ok: false, erro: true, produto:null , msg:   ` Ocorreu um erro ao tentar registrar vinculo para o produto: ${ dados.codigo}     idBling: ${ dadosProdutoBling[0].id } `  }
                }
            } else {
                 return { ok: false, erro: true, produto:null , msg:    `  Não foi encontrado produto: ${ dados.codigo} no bling `  }
            }
        } catch (error: any) {
            console.log(`[X] Erro em getVinculoProduto para o produto ${dados.codigo}: ${error.message || error}`);
            return { ok: false, erro: true, produto: null, msg: `Erro ao processar vinculo do produto ${dados.codigo}` };
        }
    }

    async syncAllProductsFromBling() {
        try {
            await this.api.configurarApi();

            const resultado = {
                totalProcessed: 0,
                vinculados: 0,
                jaVinculados: 0,
                naoEncontradosSistema: 0,
                erros: 0,
                detalhes: [] as string[]
            };

            let pagina = 1;
            const limite = 100;
            let hasMore = true;

            while (hasMore) {
                console.log(`[Buscando produtos do Bling] Página ${pagina}...`);

                const response = await this.api.config.get('/produtos', {
                    params: { pagina, limite }
                });

                await this.delay(1000);

                const produtos = response.data?.data;

                if (!produtos || produtos.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const produto of produtos) {
                    resultado.totalProcessed++;
                    const codigo = Number(produto.codigo);

                    if (!codigo) {
                        console.log(`[X] Produto ${produto.id} não possui código do sistema.`);
                        resultado.erros++;
                        resultado.detalhes.push(`Produto ${produto.id} (${produto.nome}) sem código do sistema`);
                        continue;
                    }

                    try {
                        const produtoSistema = await ProdutoRepository.buscaProduto(codigo);

                        if (!produtoSistema || produtoSistema.length === 0) {
                            console.log(`[-] Produto código ${codigo} (${produto.nome}) não encontrado no sistema.`);
                            resultado.naoEncontradosSistema++;
                            resultado.detalhes.push(`Código ${codigo} (${produto.nome}) não encontrado no sistema`);
                            continue;
                        }

                        const vinculoExistente = await ProdutoApiRepository.findByCodeSystem(codigo);

                        if (vinculoExistente && vinculoExistente.length > 0) {
                            console.log(`[~] Produto código ${codigo} já vinculado ao Bling ID ${vinculoExistente[0].Id_bling}`);
                            resultado.jaVinculados++;
                            continue;
                        }

                        let tipoVariacao = 'N';
                        let comVariacao = 'N';

                        if (produto.idProdutoPai && produto.formato === 'S') {
                            tipoVariacao = 'S';
                        }
                        if (!produto.idProdutoPai && produto.formato === 'V') {
                            comVariacao = 'S';
                        }

                        const produtoVinculo = {
                            id_bling: produto.id,
                            codigo_sistema: codigo,
                            descricao: produto.nome,
                            saldo: 0,
                            variacao: tipoVariacao,
                            com_variacao: comVariacao,
                            data_recad_sistema: DateService.obterDataHoraAtual(),
                            data_estoque: DateService.obterDataHoraAtual(),
                            data_envio: DateService.obterDataHoraAtual(),
                            data_preco: '2001-01-01 10:00:00'
                        };

                        const insertResult: any = await ProdutoApiRepository.inserir(produtoVinculo);
                        if (insertResult && insertResult.affectedRows === 1) {
                            resultado.vinculados++;
                            resultado.detalhes.push(`[V] Vinculado: código ${codigo} -> Bling ID ${produto.id}`);
                            console.log(`[V] Vinculo registrado: ${codigo} -> ${produto.id}`);
                        }
                    } catch (err: any) {
                        console.log(`[X] Erro ao processar produto código ${codigo}: ${err.message || err}`);
                        resultado.erros++;
                        resultado.detalhes.push(`Erro no código ${codigo}: ${err.message || err}`);
                    }
                }

                pagina++;
            }

            console.log('--- Resumo syncAllProductsFromBling ---');
            console.log(`Total processados: ${resultado.totalProcessed}`);
            console.log(`Vinculados: ${resultado.vinculados}`);
            console.log(`Já vinculados: ${resultado.jaVinculados}`);
            console.log(`Não encontrados no sistema: ${resultado.naoEncontradosSistema}`);
            console.log(`Erros: ${resultado.erros}`);

            return resultado;

        } catch (error: any) {
            console.log(`[X] Erro em syncAllProductsFromBling: ${error.message || error}`);
            return {
                totalProcessed: 0,
                vinculados: 0,
                jaVinculados: 0,
                naoEncontradosSistema: 0,
                erros: 0,
                detalhes: [`Erro crítico: ${error.message || error}`]
            };
        }
    }

 
    async checkProductHasPhotosInBling(idBling: string): Promise<boolean> {
        try {
            await this.api.configurarApi();
            const response = await this.api.config.get(`/produtos/${idBling}`);
            const data = response.data?.data;
            if (!data) return false;

            const internas = data.midia?.imagens?.internas;
            const externas = data.midia?.imagens?.externas;

            console.log(`internas `+  internas[0] )
            console.log(`externas   `+ externas)
            const hasPhotos = (
                (internas && internas.length > 0) ||  (externas && externas.length > 0)
            );

            console.log(`[checkProductHasPhotosInBling] Produto ${idBling} ${hasPhotos ? 'possui' : 'não possui'} fotos no Bling.`);
            return hasPhotos;
        } catch (error: any) {
            console.log(`[X] Erro ao verificar fotos do produto ${idBling} no Bling: ${error.message || error}`);
            return false;
        }
    }

    /**
     * envia o produto para o bling.
     * @param produtoBling dados do produto a ser enviado, dados estes que precisam ser tratados antes do envio
     * @param produtoSistema dados do produto vindos do banco de dados do sistema
     * @param enviEstoque parametro que informa se é necessario enviar o estoque ( 0: nao , 1:sim )
     * @returns 
     */
    async postProduto(produtoBling:IProdutoBlingSemPreco , produtoSistema:IProductSystem, enviEstoque:number){
        try {
        
                                    const response = await this.api.config.post('/produtos', produtoBling);
                                                     
                                           if(response.status ===200 || response.status ===201   ){
                                            let id_bling = response.data.data.id;
                                                let msgSucess =` produto ${produtoBling.codigo} enviado com sucesso  `
                                                let prod =  await ProdutoApiRepository.inserir(
                                                            {
                                                                codigo_sistema:produtoBling.codigo,
                                                                data_envio: DateService.obterDataHoraAtual(),
                                                                data_estoque: DateService.obterDataHoraAtual(),
                                                                data_recad_sistema:  DateService.formatarDataHora(produtoSistema.DATA_RECAD),
                                                                descricao:produtoBling.nome,
                                                                id_bling:response.data.data.id,
                                                                saldo:0,
                                                                variacao:'N',
                                                                com_variacao:'N',
                                                                data_preco: '2000-01-01 10:00:00'
                                                            }
                                                );
                                                        console.log(response.status, "produto enviado com sucesso!")
                                                        if( enviEstoque > 0 ){
                                                             console.log(response.status, "atualizando saldo !")
                                                              await this.delay(1000);  
                                                            const arrEstoque = await   ProdutoRepository.buscaEstoqueReal(produtoBling.codigo, 1 );
                                                            
                                                                let estoque = 0;
                                                                if(arrEstoque.length > 0 ){
                                                                    estoque = arrEstoque[0].ESTOQUE;
                                                                }

                                                            const arrDeposito = await ProdutoApiRepository.findDefaultDeposit();
                                                                  let deposito;
                                                                if(arrDeposito.length > 0){
                                                                    deposito = arrDeposito[0].Id_bling

                                                                }else{
                                                                        deposito = await this.syncStock.getDeposit();
                                                                }
                                                                await this.syncStock.postEstoque( id_bling, estoque,  deposito, produtoBling.codigo, DateService.obterDataHoraAtual() )
                                                                msgSucess = msgSucess + ` saldo: ${estoque} `
                                                            }
                                                
                                                            return   { status:response.status,  msg:  msgSucess } ;
                                                        
                                                    }   
                                } catch (err:IResponseErrorApi | any ) {
                                    console.log("Ocoreu um erro ao tentar cadastrar  o produto no bling ")
                                    console.log(produtoBling, "\n")
                                    console.log(err.response);
                                    const response = err.response.data
                                    const object = JSON.stringify(err.response.data.error.fields)
                                    return    {  status: err.response.status ,msg:  `${response.error.description} \n campos: ${object}` }  
                                }
    }

    /**
     * 
     * @param idProdutobling id do produto do bling 
     * @param produtoBling dados do produto a ser enviado, dados estes que precisam ser tratados antes do envio
     * @param enviEstoque parametro que informa se é necessario enviar o estoque ( 0: nao , 1:sim )
     * @param envPreco parametro que indica se é necessario enviar o preco do produto ( 0: nao , 1:sim )
     * @param tabela_preco tabela de preco para atualizar os precos
     * @returns 
     */
    async putProduto(idProdutobling:any, produtoBling:IProdutoBlingSemPreco, envEstoque:number, envPreco:number, tabela_preco:number, setor:number ){
                    let partialMsg = '';
              try {
                        const response = await this.api.config.put(`/produtos/${idProdutobling}`, produtoBling);

                        if (response.status === 200 || response.status === 201) {

                                            if( envEstoque > 0 ){

                                                     const arrEstoque = await   ProdutoRepository.buscaEstoqueReal(produtoBling.codigo , setor );

                                                     let estoque = 0;
                                                     if(arrEstoque.length > 0 ){
                                                        estoque = arrEstoque[0].ESTOQUE;
                                                     }

                                                    const arrDeposito = await ProdutoApiRepository.findDefaultDeposit();
                                                        let deposito;
                                                    if(arrDeposito.length > 0){
                                                          deposito = arrDeposito[0].Id_bling

                                                    }else{
                                                            deposito = await this.syncStock.getDeposit();
                                                    }
                                                        await this.syncStock.postEstoque( idProdutobling, estoque,  deposito, produtoBling.codigo, DateService.obterDataHoraAtual() )
                                                  }
                                              if( envPreco > 0 ){
                                                    await this.syncPrice.postPrice(idProdutobling, produtoBling.codigo, tabela_preco)
                                                  }

                            try {
                                let resultUpdate = await ProdutoApiRepository.updateByParama({
                                    id_bling:  idProdutobling,
                                    data_envio: DateService.obterDataHoraAtual(),
                                    descricao: produtoBling.nome
                                });
                                if(  resultUpdate && resultUpdate.affectedRows > 0 ){
                                        partialMsg = partialMsg + ` produto ${ produtoBling.nome} alterado com sucesso no bling `;
                                    return    {  status: response.status ,msg: partialMsg}  

                                }
                                

                            } catch (e: any) {
                                console.log("erro ao atualizar o produto no banco de dados da integração ", e);
                                        partialMsg = partialMsg + ` erro ao atualizar o produto no banco de dados da integração`;
                                return    {  status: 400 ,msg: partialMsg}  
                            }
                        } else {
                                        partialMsg = partialMsg +` Resposta inesperada (${response?.status}) ao tentar atualizar o produto no Bling. `;

                                    return    {  status: response ,msg:partialMsg  }  
                            }
                    } catch (err: IResponseErrorApi | any) {
                        const errorData = err.response?.data?.error.description;
                      console.log("Ocoreu um erro ao tentar atualizar  o produto no bling ",err)
                        console.log(err.response?.data?.error);
                                        partialMsg = partialMsg +` Resposta inesperada (${err?.status}) ao tentar atualizar o produto ${ produtoBling.nome} no Bling. `;
                      return    {  status: err.response?.status ,msg: partialMsg}  
                    
                    }

    }

    /**
     * 
     * @param idProdutobling id do produto do bling 
     * @param produtoBling dados do produto a ser enviado, dados estes que precisam ser tratados antes do envio
     * @param enviEstoque parametro que informa se é necessario enviar o estoque ( 0: nao , 1:sim )
     * @param envPreco parametro que indica se é necessario enviar o preco do produto ( 0: nao , 1:sim )
     * @param tabela_preco tabela de preco para atualizar os precos
     * @returns 
     */
    async patchProduto(idProdutobling:any, produtoBling:IProdutoBlingSemPreco, envEstoque:number, envPreco:number, tabela_preco:number, setor:number ){
                    let partialMsg = '';
              try {
                        const response = await this.api.config.put(`/produtos/${idProdutobling}`, produtoBling);

                        if (response.status === 200 || response.status === 201) {

                                            if( envEstoque > 0 ){

                                                     const arrEstoque = await   ProdutoRepository.buscaEstoqueReal(produtoBling.codigo , setor );

                                                     let estoque = 0;
                                                     if(arrEstoque.length > 0 ){
                                                        estoque = arrEstoque[0].ESTOQUE;
                                                     }

                                                    const arrDeposito = await ProdutoApiRepository.findDefaultDeposit();
                                                        let deposito;
                                                    if(arrDeposito.length > 0){
                                                          deposito = arrDeposito[0].Id_bling

                                                    }else{
                                                            deposito = await this.syncStock.getDeposit();
                                                    }
                                                        await this.syncStock.postEstoque( idProdutobling, estoque,  deposito, produtoBling.codigo, DateService.obterDataHoraAtual() )
                                                  }
                                              if( envPreco > 0 ){
                                                    await this.syncPrice.postPrice(idProdutobling, produtoBling.codigo, tabela_preco)
                                                  }

                            try {
                                let resultUpdate = await ProdutoApiRepository.updateByParama({
                                    id_bling:  idProdutobling,
                                    data_envio: DateService.obterDataHoraAtual(),
                                    descricao: produtoBling.nome
                                });
                                if(  resultUpdate && resultUpdate.affectedRows > 0 ){
                                        partialMsg = partialMsg + ` produto ${ produtoBling.nome} alterado com sucesso no bling `;
                                    return    {  status: response.status ,msg: partialMsg}  

                                }
                                

                            } catch (e: any) {
                                console.log("erro ao atualizar o produto no banco de dados da integração ", e);
                                        partialMsg = partialMsg + ` erro ao atualizar o produto no banco de dados da integração`;
                                return    {  status: 400 ,msg: partialMsg}  
                            }
                        } else {
                                        partialMsg = partialMsg +` Resposta inesperada (${response?.status}) ao tentar atualizar o produto no Bling. `;

                                    return    {  status: response ,msg:partialMsg  }  
                            }
                    } catch (err: IResponseErrorApi | any) {
                        const errorData = err.response?.data?.error.description;
                      console.log("Ocoreu um erro ao tentar atualizar  o produto no bling ",err)
                        console.log(err.response?.data?.error);
                                        partialMsg = partialMsg +` Resposta inesperada (${err?.status}) ao tentar atualizar o produto ${ produtoBling.nome} no Bling. `;
                      return    {  status: err.response?.status ,msg: partialMsg}  
                    
                    }

    }

    async postOrPutProductBling(codigoStr: number, validDateUpdate: boolean ){

            const resultadosIntegracao: any[] = [];
            
                        // configurações para envio das informações
                    let dadosConfig = await ApiConfigRepository.buscaConfig();
                    const syncCategory = new SyncCategory();

                    // contem o valor do parametro de envio de estoque ( 0: nao enviar estoque, 1: enviar o estoque) 
                    const envEstoque = Number(dadosConfig[0].enviar_estoque);
                    const caminhoFotos = dadosConfig[0].caminho_fotos;

                    // contem o valor do parametro de envio de preco ( 0: nao enviar preco, 1: enviar o preco) 
                    const envPreco = Number( dadosConfig[0].enviar_precos)
                    // tabela onde é feita a consulta dos precos a serem enviados
                    const tabela_preco = Number( dadosConfig[0].tabela_preco);

                // setor onde será buscado o saldo de estoque 
                    const setor = dadosConfig[0].setor    


                let resultadoOperacao: any = { codigo: codigoStr, success: false, msg: "Operação não concluída." };
                try {
                    const codigoSelecionado: number =  Number(codigoStr)   ;

                    console.log(`Processando envio/atualização do produto código: ${codigoSelecionado}`);
                    //  tenta buscar o produto selecionado pelo usuario na tabela da integração. 
                    const arrProdutoSincronizado = await ProdutoApiRepository.findByCodeSystem(codigoSelecionado);
                    // busca o item no banco de dados do sistema
                    const arrProdSelected = await   ProdutoRepository.buscaProduto(codigoSelecionado);

                    
                        if (!arrProdSelected || arrProdSelected.length === 0) {
                        resultadoOperacao = { codigo: codigoSelecionado, success: false, msg: `Produto ${codigoSelecionado} não encontrado no sistema de origem.` };
                        console.log(resultadoOperacao.msg);

                        resultadosIntegracao.push(resultadoOperacao.msg);
                        return resultadosIntegracao;
                    }

                    // extrai o produto do array 
                    const prodSelected = arrProdSelected[0];

                    // verifica a categoria do produto
                    let categoryId = 0;
                    const resultVerifyCategoryBling  = await syncCategory.verifyCategory(prodSelected.GRUPO);
                        if( !resultVerifyCategoryBling.success ){
                           resultadosIntegracao.push(resultVerifyCategoryBling.message);
                          return resultadosIntegracao;
                        }else{
                            categoryId = resultVerifyCategoryBling.data?.id_bling || 0;
                        }
                        
                        
                    // verifica se o produto já possui fotos no Bling (apenas para produtos existentes)
                    let skipPhotos = false;
                    if (arrProdutoSincronizado.length > 0) {
                        skipPhotos = await this.checkProductHasPhotosInBling(arrProdutoSincronizado[0].Id_bling);
                    }

                    // processa o produto retornando os dados do produto de acordo com o que a api do bling esta esperando.
                    const produtoBling = await  ProdutoMapper.postProdutoMapper(prodSelected,envPreco, categoryId, caminhoFotos, tabela_preco, skipPhotos );
                    
                    await this.delay(1000);  
                    // se o produto selecionado for encontrado, faz a atualização.
                    if (arrProdutoSincronizado.length > 0) {
                        const produtoSincronizado = arrProdutoSincronizado[0];
                        console.log(`Produto ${codigoSelecionado} já existe no Bling (ID: ${produtoSincronizado.Id_bling}). Atualizando...`);

                            /// verifica o parametro de validDateUpdate da função, onde é determinado 
                            //  se será necessario fazer a comparação das data de recadastro dos produtos 
                            if( validDateUpdate ){

                             if( new Date(prodSelected.DATA_RECAD) > new Date(produtoSincronizado.data_envio) ){
                                    await this.delay(1000);  
                                     const responsePutProduto = await this.patchProduto( produtoSincronizado.Id_bling  ,produtoBling, envEstoque,  envPreco, tabela_preco, setor);  
                                    resultadoOperacao = { codigo: codigoSelecionado, ...responsePutProduto }; 
                                }else{
                             resultadoOperacao = { codigo: codigoStr, success: false,
                                 msg: `O produto ${prodSelected.DESCRICAO} se encontra atualizado` };
                                console.log(`O produto ${prodSelected.DESCRICAO} se encontra atualizado`)
                                }
                            }else{
                                 await this.delay(1000);  
                                    const responsePutProduto = await this.patchProduto( produtoSincronizado.Id_bling  ,produtoBling, envEstoque,  envPreco, tabela_preco, setor);  
                                    resultadoOperacao = { codigo: codigoSelecionado, ...responsePutProduto }; 
                                    
                            }

                 
                    } else {
                    // produto nao foi enviado, será feito o envio    
                        console.log(`Produto ${codigoSelecionado} não encontrado no Bling. Enviando como novo...`);
                        await this.delay(1000); 

                        const responsePostProduto = await this.postProduto(produtoBling, prodSelected, envEstoque);  
                        resultadoOperacao = { codigo: codigoSelecionado, ...responsePostProduto }; 
                        console.log(`Resultado do envio do novo produto ${codigoSelecionado}: ${JSON.stringify(resultadoOperacao)}`);
                    }
                    resultadosIntegracao.push(resultadoOperacao.msg);

                } catch (error: any) {
                    console.error(`Erro crítico ao processar produto ${codigoStr} em enviaProduto:`, error);
                    resultadoOperacao = { codigo: codigoStr, success: false, msg: `Erro interno crítico ao processar produto ${codigoStr}: ${error.message || error}` };
                    resultadosIntegracao.push(resultadoOperacao.msg);
                }
            return  { resultados: resultadosIntegracao.toString()}   
       }
  
   

       async getProduct (){
        
      async function delay(ms: number) {
        console.log(`Aguardando ${ms / 1000} segundos para atualizar...`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

            const  api = new ConfigApi();
               await  api.configurarApi();
               const codigo = 'kit teste'
                try{
                    let dadosPedidos;
                    try{
                            dadosPedidos = await  api.config.get('/pedidos/vendas', {
                                params:{
                                //  pagina: pagina,
                                // limite:limite,
                                    dataAlteracaoInicial: "2026-03-27 14:16:00"
                                }
                            });
                        }catch(err) { 
                                //throw err
                                    console.log(` Erro ao buscar pedidos do bling`, err)
                        }

            const arr = dadosPedidos.data.data

                if(!arr || arr.length === 0 )   {
                    console.log(" Não há mais pedidos a serem importados!")
                }

                        for( const data of arr ){
                              let idPedidoBling = data.id; 
                        await   delay(1000); 

                    const response  = await  api.config.get(`/pedidos/vendas/${idPedidoBling}`);
                            console.log(response.data)

                        }
                        }catch(e:any){ console.log(" err ",e)}

       }


    }
     
