import { Request, Response, Router } from "express";

import 'dotenv/config';
import { apiController } from "../core/company/controller/api-config-controller";
import { CategoriaController } from "../core/categories/controller/categoria-controller";
import { ProdutoController } from "../core/products/controller/produtos-controller";
import { TokenController } from "../core/authorization/controller/token-controller";
import { ClienteApiRepository } from "../core/client/data/cliente-api-repositoryi";
import { ApiConfigRepository } from "../core/company/data/api-config-repository";
import { PedidoApiRepository } from "../core/orders/data/pedido-api-repository";
import { ProdutoApiRepository } from "../core/products/data/produto-api-repository";
import { CategoriaRepository } from "../core/categories/data/categoria-repository";
import { ProdutoRepository } from "../core/products/data/produto-repository";
import { SetorRepository } from "../core/inventory/data/setor-repository";
import { verificaToken } from "../shared/Middlewares/TokenMiddleware";
import { SyncStock } from "../core/inventory/services/sync-stock";
import { SyncProduct } from "../core/products/services/sync-product";
// import { testeNf } from "../__test__/teste-nf";
// import { testeNaturezaOperacao } from "../__test__/teste-natureza-operacao";
import { SyncCompany } from "../core/company/services/sync-company";
import { ProdutoEditarController } from "../core/products/controller/produto-editar-controller";

const router = Router();


const configApi = new apiController();
const categoryRepository = new CategoriaRepository();
const syncEstock = new SyncStock();
const pedidoApiRepository = new PedidoApiRepository();
const clienteApiRepository = new ClienteApiRepository();
const setorRepository = new SetorRepository();

router.get('/', async (req, res) => {
  res.render('index');
})

router.get('/config', async (req, res) => {
  const data = await configApi.buscaConfig();
  const tabelas = await ProdutoRepository.buscaTabelaDePreco();
  res.render('config', { 'config': data, 'tabelas': tabelas });
})

router.get('/produtos', verificaToken, new ProdutoController().viewProducts);


router.get('/produtos/:codigo', verificaToken, new ProdutoEditarController().execute)

router.post('/api/produtos', verificaToken, async (req: Request, res: Response) => {
  const obj = new ProdutoController()

  let dadosConfig = await ApiConfigRepository.buscaConfig();
   
   if (dadosConfig[0].enviar_produtos === 'E') {
     await obj.enviaProduto(req, res);
   } 
   if (dadosConfig[0].enviar_produtos === 'S') {
      await obj.geraVinculo(req, res);
   }
})


router.get('/categorias', verificaToken, async (req, res) => {
  const data = await categoryRepository.buscaGrupoIndex()
  res.render('categorias', { 'categorias': data })
})

router.get('/clientes', verificaToken, async (req, res) => {
  const data = await clienteApiRepository.getClientIntegracao()
  console.log(data)
  res.render('clientes', { 'clientes': data })
})


router.get('/configuracoes', async (req, res) => {
  let dadosConfig = await ApiConfigRepository.buscaConfig();
  let tabelasDePreco = await ProdutoRepository.buscaTabelaDePreco();
  let setores = await setorRepository.buscaSetor()
  const client_id = process.env.CLIENT_ID;
  const secret = process.env.CLIENT_SECRET;

  const authorizationUrlApiBling = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${client_id}&state=5f8c227b11184e3a0ee2426406429fda`;
  
  res.render('configuracoes', { dados: dadosConfig[0], tabelas: tabelasDePreco, setores: setores , url_authorization: authorizationUrlApiBling})

})




router.post('/api/categorias', async (req, res) => {
  let obj = new CategoriaController()

  await obj.postCategory(req, res)

})

router.get('/callback', async (req, res, next) => {
  const apitokenController = new TokenController;
  const token = apitokenController.obterToken(req, res, next);
});


router.get('/pedidos', async (req, res) => {
  let dados = await pedidoApiRepository.findAll();
  res.render('pedidos', { pedidos: dados })
})


router.get('/estoque', verificaToken, async () => {
  let dadosConfig = await ApiConfigRepository.buscaConfig();
  if (dadosConfig[0].enviar_estoque > 0) {
    await syncEstock.enviaEstoque();
  }
})
router.get('/depositos', async (req, res) => {
    const depositos = await ProdutoApiRepository.findDeAllDeposit()
  res.render('depositos' ,{ depositos:depositos})
})
router.post('/ajusteConfig', verificaToken, new apiController().ajusteConfig)

//////////////////////////////////////////////////////////////////////////////////

// router.get("/testeNf",async  ( req, res )=>{
//     await testeNf();
// })

router.get("/testeCompany",async  ( req, res )=>{
 const syncCompany = new SyncCompany();
 
 async function teste(){
     await syncCompany.getBasicDataCompany(); 
 }
 
 teste()
})

// router.get("/testeNaturezaOperacao",async  ( req, res )=>{
//     await testeNaturezaOperacao();
// })

router.get("/teste1", new  SyncProduct().getProduct)

export { router };
