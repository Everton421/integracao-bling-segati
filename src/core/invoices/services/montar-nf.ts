import { ApiConfigNfeRepository } from "../data/api-config-nfe";
import { NfRepository } from "../data/nf-data-acess";
import { NfMapper } from "../mapping/nf-mapper";



export class montarNf{
    static async exec (codigo_pedido_sistema:number){
        const nfRepository = new NfRepository();
        const apiConfigNfeRepository = new ApiConfigNfeRepository();

        const nfMapper = new NfMapper();
        
        const dadosNota = await nfRepository.findNotasByPedido(codigo_pedido_sistema);
            const codigoTransacaoSistema =  dadosNota[0].TRANSACAO;
            const codigoNf = dadosNota[0].CODIGO;
            const codigoCliente = dadosNota[0].CODIGO_CLI_FOR;

         const itensNota = await nfRepository.findItensNota(codigoNf);
         
          const dadosMvtTributos = await  nfRepository.findTributosItem(codigoNf);

          const dadosParcelas = await nfRepository.findInstallments(codigoNf);

        const dadosTransacao = await apiConfigNfeRepository.findConfigNfe({ codigo_transacao_sistema:String(codigoTransacaoSistema), });

        const dadosCliente = await nfRepository.findCliente(codigoCliente);


    const nfMapped  = await nfMapper.mapToBlingFormat(
            dadosNota[0],
            itensNota,
            dadosCliente[0],
            dadosMvtTributos,
            dadosParcelas,
            dadosTransacao[0]
        )

        return nfMapped;
    }
}