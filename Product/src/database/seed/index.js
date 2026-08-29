require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 8002,
    DB_URL: process.env.DB_URL,
};
