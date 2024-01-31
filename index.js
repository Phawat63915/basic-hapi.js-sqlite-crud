const Hapi = require('@hapi/hapi');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('mydb.sqlite');

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users(id INT, name TEXT)');
});

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/users',
        handler: (request, h) => {
            return new Promise((resolve, reject) => {
                db.all('SELECT id, name FROM users', (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/users',
        handler: (request, h) => {
            let stmt = db.prepare('INSERT INTO users VALUES (?, ?)');
            stmt.run(request.payload.id, request.payload.name);
            stmt.finalize();
            return 'User added';
        }
    });

    server.route({
        method: 'PUT',
        path: '/users/{id}',
        handler: (request, h) => {
            let stmt = db.prepare('UPDATE users SET name = ? WHERE id = ?');
            stmt.run(request.payload.name, request.params.id);
            stmt.finalize();
            return 'User updated';
        }
    });

    server.route({
        method: 'DELETE',
        path: '/users/{id}',
        handler: (request, h) => {
            let stmt = db.prepare('DELETE FROM users WHERE id = ?');
            stmt.run(request.params.id);
            stmt.finalize();
            return 'User deleted';
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();