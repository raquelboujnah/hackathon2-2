//my database had to use sqlite because pgadmin and postgres wasted over 7+ hours of time and i didn't have the time to continue fighting with it xD
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'task_manager.db'), (err)=>{
    if (err) {
        console.error("db problem:", err);
    } else {
        console.log('Connected to db');
        db.run("PRAGMA foreign_keys = ON;");  // Enable foreign key support
    }
}); //creates or opens file called task_manager.db


db.serialize(()=>{
    //users
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `);

    //tasks
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE, 
        github_link TEXT,
        productivity_meter INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) on DELETE CASCADE
        )
        `);
});

console.log("complete db setup")


module.exports = db;