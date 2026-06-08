import test from 'node:test'
import { MontarNf } from '../services/montar-nf';
import { SyncNf } from '../services/http-request-nf';

test.it("",async ()=>{

    try{
    const dadosNfMapped = await    MontarNf.exec(8895319);
        console.log(dadosNfMapped)

     //   const syncNf = new SyncNf();
//
     //  const result = await syncNf.postNf(dadosNfMapped)
     //   console.log(result)
    }catch(e){
        console.log(e)
    }

})