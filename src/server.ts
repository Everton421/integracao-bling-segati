import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import "express-async-errors";
import path from 'path';

import { router } from './web/routes';
import { Job } from './jobs/main';
import { ApiConfigRepository } from './core/company/data/api-config-repository';

        const app = express();

        app.set('view engine', 'ejs')
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(bodyParser.json())
        app.set('views', path.join(__dirname, 'web/Views'));
        app.use(express.static(path.join(__dirname, 'web', 'public')));
        app.use(express.json());    
        app.use(router)
        app.use(cors());
        app.use(
                (err:Error, req:Request, res:Response, next:NextFunction)=>{
                    if(err instanceof Error){
                        return res.status(400).json({
                            error: err.message,
                        })
                    }
                    res.status(500).json({
                        status:'error ',
                        messsage: 'internal server error.'
                    })
                })

                    
                async function tarefas(){ 
                    
                    const dataApiConfig = await ApiConfigRepository.buscaConfig();
                    if(dataApiConfig.length > 0     ){
                            if(dataApiConfig[0].tarefas_cron > 0){
                                    const mainJob = new Job();
                                  await mainJob.main();
                            } else{
                                console.log("[X] tarefas cron inativa")
                          }
                         
                    }
         
                    }

            tarefas();

                const PORT_API = process.env.PORT_API; // Porta padrão para HTTPS



   app.listen(PORT_API, async ()=>{ 

    console.log(`app rodando porta ${PORT_API}  `)
    
})
   

