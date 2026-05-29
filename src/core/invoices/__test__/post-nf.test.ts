import test from 'node:test'
import { montarNf } from '../services/montar-nf';
import { SyncNf } from '../services/http-request-nf';

test.it("",async ()=>{

    try{
    const dadosNfMapped = await    montarNf.exec(8895319);

        const syncNf = new SyncNf();

       const result = await syncNf.postNf(dadosNfMapped)
        console.log(result)
    }catch(e){
        console.log(e)
    }

})