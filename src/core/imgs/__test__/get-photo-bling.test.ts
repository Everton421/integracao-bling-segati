import test from 'node:test';
import { UploadAndInsertPhotoService } from '../services/upload-photo-service';
import { SyncProduct } from '../../products/services/sync-product';




// No Teste:
test.it("Deve listar as fotos do diretório", async () => {

const syncProduct = new SyncProduct();

  await syncProduct.checkProductHasPhotosInBling('16655306786');

});