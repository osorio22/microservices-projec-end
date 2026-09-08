const { FormateData } = require('../../src/utils');

describe('Utils', () => {

    test('FormateData debe envolver los datos en un objeto con data', () => {

        const products = [
            {
                _id: '123',
                name: 'Teclado',
                price: 25000
            }
        ];

        const result = FormateData(products);

        expect(result).toEqual({ data: products });
    });

});