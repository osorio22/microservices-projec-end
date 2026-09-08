const {
    APIError,
    BadRequestError,
    NotFoundError,
    UnauthorizedError
} = require('../../src/utils/app-errors');

describe('App Errors', () => {

    test('APIError debe crear un error con nombre, statusCode y mensaje', () => {

        const error = new APIError(
            'SignInError',
            500,
            'Something failed'
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('SignInError');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Something failed');
    });

    test('BadRequestError debe tener statusCode 400', () => {

        const error = new BadRequestError('Invalid credentials');

        expect(error).toBeInstanceOf(APIError);
        expect(error.name).toBe('BadRequestError');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid credentials');
    });

    test('NotFoundError debe tener statusCode 404', () => {

        const error = new NotFoundError('Customer not found');

        expect(error).toBeInstanceOf(APIError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Customer not found');
    });

    test('UnauthorizedError debe tener statusCode 401', () => {

        const error = new UnauthorizedError('Invalid or expired token');

        expect(error).toBeInstanceOf(APIError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid or expired token');
    });

});