import test from 'node:test';
import { UploadAndInsertPhotoService } from '../services/upload-photo-service';




// No Teste:
test.it("Deve listar as fotos do diretório", async () => {


    const diretorioFotos = "C:/Users/usuario/Desktop/apps/integracao-bling-segati/src/assets/imgs";
    const referenciaProduto = "23B857521A";
   
   const resultPhotos =  await UploadAndInsertPhotoService.exec(diretorioFotos, referenciaProduto);
    console.log(resultPhotos);

});