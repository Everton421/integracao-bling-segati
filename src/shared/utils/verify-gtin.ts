export class VerifyGtin{
    static isValidGtin(gtin:string){
          gtin = gtin.toString().replace(/\s/g, "");

        // Verifica se tem apenas números e se o tamanho é válido (8, 12, 13 ou 14)
        if (!/^\d+$/.test(gtin) || ![8, 12, 13, 14].includes(gtin.length)) {
            return false;
        }

        const digits = gtin.split('').map(Number);
        const lastDigit = digits.pop(); // Remove e guarda o dígito verificador

        // O cálculo começa da direita para a esquerda
        // Posições ímpares (contando da direita) peso 3, pares peso 1
        const sum = digits
            .reverse()
            .reduce((acc, digit, index) => {
                const weight = (index % 2 === 0) ? 3 : 1;
                return acc + (digit * weight);
            }, 0);

        const calculatedCheckDigit = (10 - (sum % 10)) % 10;

        return lastDigit === calculatedCheckDigit;
    }
}