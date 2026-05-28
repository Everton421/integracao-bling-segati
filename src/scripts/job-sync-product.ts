import { JobProduto } from "../jobs/job-produto";



async function job(){
const jobProduto = new JobProduto();
    await jobProduto.jobSyncAllProductsFromBling();
}

job()