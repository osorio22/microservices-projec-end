require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 8004,
    DB_URL: process.env.DB_URL,
    APP_SECRET: process.env.APP_SECRET,
};
