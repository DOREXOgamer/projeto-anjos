const bcrypt = require('bcryptjs'); 
const hash = '$2a$10$ADfs6MwkIWM4E/qAEHQR9OYsX8wBw88cSDgWa7rBomE74t6GoXzo6';
['123456', 'password', 'diretora', 'admin', '12345678'].forEach(p => console.log(p, bcrypt.compareSync(p, hash)));
