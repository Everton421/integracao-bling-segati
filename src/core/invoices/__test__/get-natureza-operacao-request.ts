
import test from 'node:test'
import { SyncWiretappingOperations } from '../services/sync-wire-tapping-operations'

test.it("", async  ()=>{
    const syncWiretappingOperations = new SyncWiretappingOperations();

    const result = await syncWiretappingOperations.getWiretappingOperations();
    console.log(result);
})