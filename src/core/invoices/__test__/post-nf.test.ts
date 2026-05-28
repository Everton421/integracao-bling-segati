import test from 'node:test'
import { montarNf } from '../services/montar-nf';
import { SyncNf } from '../services/http-request-nf';

test.it("",async ()=>{

    try{
    const dadosNfMapped = await    montarNf.exec(8895227);

        const syncNf = new SyncNf();

        await syncNf.postNf(dadosNfMapped)
    }catch(e){
        console.log(e)
    }

})