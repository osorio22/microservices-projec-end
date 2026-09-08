const errorHandler = require('../../src/utils/error-handler');
const { UnauthorizedError } = require('../../src/utils/app-errors');

describe('Error Handler', () => {

    test('debe responder 401 para un UnauthorizedError', () => {

        const error = new UnauthorizedError(
            'Invalid or expired token'
        );

        const req = {};

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const next = jest.fn();

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid or expired token'
        });
    });


    test('debe responder 500 para un error desconocido', () => {

        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const error = new Error('Error interno');

        const req = {};

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const next = jest.fn();

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            message: 'Internal server error'
        });

        spy.mockRestore();
    });

});