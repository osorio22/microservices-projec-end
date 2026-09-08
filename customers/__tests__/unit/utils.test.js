const jwt = require('jsonwebtoken');

const {
    FormateData,
    ValidateSignature
} = require('../../src/utils');

const { APP_SECRET } = require('../../src/config');

describe('Utils', () => {

    test('FormateData debe envolver los datos en un objeto con data', () => {

        const data = {
            id: '123',
            token: 'abc'
        };

        const result = FormateData(data);

        expect(result).toEqual({ data });
    });

    test('ValidateSignature debe devolver el payload para un token válido', async () => {

        const payload = {
            _id: '123',
            email: 'juan@gmail.com'
        };

        const token = jwt.sign(payload, APP_SECRET);

        const req = {
            get: jest.fn().mockReturnValue(`Bearer ${token}`)
        };

        const result = await ValidateSignature(req);

        expect(result).toBeDefined();
        expect(result._id).toBe(payload._id);
        expect(result.email).toBe(payload.email);
    });

    test('ValidateSignature debe devolver false sin encabezado Authorization', async () => {

        const req = {
            get: jest.fn().mockReturnValue(undefined)
        };

        const result = await ValidateSignature(req);

        expect(result).toBe(false);
    });

});