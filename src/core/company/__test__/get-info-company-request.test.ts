import { SyncCompany } from "../services/company-request";
import test from 'node:test'


test.it("",async ()=>{
const syncCompany = new SyncCompany();

const resultCompany = await syncCompany.getBasicDataCompany();
console.log(resultCompany);

})