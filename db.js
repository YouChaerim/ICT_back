const mysql2 = require("mysql2/promise");
const pool = mysql2.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "0000",
    database: "ict",
});

module.exports = pool;