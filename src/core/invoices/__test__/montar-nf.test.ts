import { MontarNf } from '../services/montar-nf';
import test from 'node:test';

test.it("", async  ()=>{
try{

const dadosNfMapped = await    MontarNf.exec(8895319);
    console.log(JSON.stringify(dadosNfMapped));
    
console.log(dadosNfMapped);


}catch( e ){
    console.log(e);
}


})

