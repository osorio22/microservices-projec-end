const {
    APIError,
    BadRequestError,
    NotFoundError,
    UnauthorizedError
} = require('../../src/utils/app-errors');

describe('App Errors', () => {

    test('APIError debe crear un error con nombre, statusCode y mensaje', () => {

        const error = new APIError(
            'GetProductsError',
            500,
            'Something failed'
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('GetProductsError');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Something failed');
    });

    test('BadRequestError debe tener statusCode 400', () => {

        const error = new BadRequestError('Bad request');

        expect(error).toBeInstanceOf(APIError);
        expect(error.name).toBe('BadRequestError');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad request');
    });

    test('NotFoundError debe tener statusCode 404', () => {

        const error = new NotFoundError('Product not found');

        expect(error).toBeInstanceOf(APIError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Product not found');
    });

    test('UnauthorizedError debe tener statusCode 401', () => {

        const error = new UnauthorizedError('Invalid or expired token');

        expect(error).toBeInstanceOf(APIError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid or expired token');
    });

});