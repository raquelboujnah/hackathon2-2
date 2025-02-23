//main file
const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const db = require('./setupDB');
dotenv.config();

const app = express();

//fix not finding views folder
app.set('views', path.join(__dirname, '..', 'views'));

//connect 2DB
// db = new sqlite3.Database('task_manager.db', (err)=>{
//     if (err){
//         console.log("error opening db");
//     } else{
//         console.log('connected to db');
        
//     }
// });

//middleware
app.use(express.json()); //parses json
app.use(express.urlencoded({extended: true})); //parse url encoded bodies like form submissions
app.use(express.static('public')); //serve static files like our css

//ejs as view engine
app.set('view engine', 'ejs');


//session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false} //if https set to true
}));

//routes

    //home

app.get('/', (req, res)=>{
    res.render('index');
});

    //registration get

app.get('/register', (req, res)=>{
    res.render('register'); //renders registeration ejs
});
    //registration
app.post('/register', (req, res)=>{
    const {username, password, email}= req.body;
    
    if (!username || !password){
        return res.send("wrong username or password please try again")
    }
    bcrypt.hash(password, 10, (err, hashedPassword)=>{
        if (err){
            res.send("error password hashing please try again");
            return;
        }

        const insertQuery = `
        INSERT INTO users (username, password, email) VALUES (?,?,?)
        `;

        db.run(insertQuery, [username, hashedPassword, email], function (err) {
            if (err) {
                console.error("Error inserting user into database:", err);
                res.send("Error registering user. Please try again.");
                return;
            }

            console.log('User registered successfully with ID:', this.lastID); // Logs inserted userID
            res.redirect('/login');
        })
    })
})


    //login (get)
app.get('/login', (req, res)=>{
    res.render('login');
})

    //login(post)
app.post('/login', (req, res)=>{
    const {username, password} = req.body;

    //query db for user
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user)=>{
        if (err){
            res.send(err, 'cannot login');
            return;
        } if (!user){
            res.send('no user by that name');
            return
        } 
        //compare password with hashed
        bcrypt.compare(password, user.password, (err, isMatch)=>{
            if(err){
                res.send('problem comparing pw');
                return;
            }
            if (!isMatch){
                res.send('wrong password, try again');
                return;
            }

                req.session.userId = user.id;
                res.redirect('/dashboard');
        });
    });
});

    //dashboard route

app.get('/dashboard', (req,res)=>{
    const userId = req.session.userId; //temp num to be replaced with req.user.id

    const todoquery = 'SELECT * FROM tasks WHERE user_id = ? AND is_completed = 0';

    const finishedQuery = `
        SELECT * FROM tasks WHERE user_id = ? AND is_completed = 1`;

    db.all(todoquery, [userId], (err, tasks)=>{
        if (err){
            console.log(err.message);
            res.send('error getting  tasks');
            return;
        }

        
        db.all(finishedQuery, [userId], (err, finishedTasks)=>{
            if (err){
                console.log(err.message);
                res.send("error with task finish");
                return;
            }
            console.log('Finished tasks:', finishedTasks);
            res.render('dashboard', {tasks, finishedTasks}); //renders tasks onto dashboard page
        });

    });
});

//add task route with post
app.post('/add-task', (req, res)=>{
    const {title, description, github_link} = req.body;
    const userId = req.session.userId; //temp num to be replaced see above

    const insertQuery = `
        INSERT INTO tasks (user_id, title, description, github_link, is_completed)
        VALUES (?,?,?,?, FALSE)
    `;

    db.run(insertQuery, [userId, title, description, github_link], (err)=>{
        if (err){
            res.send("couldn't add task please contact support");
            return;
        }
        console.log('Task added with ID:', this.lastID); // Debugging
        res.redirect('/dashboard'); //returns to dashboard after adding assignment
    })
})


//delete tasks
app.post('/delete-task/:id', (req, res) => {
    const taskId = req.params.id;

    const updateQuery = 'UPDATE tasks SET is_completed = 1 WHERE id = ?';

    db.run(updateQuery, [taskId], function(err) {
        if (err) {
            console.error("error: ", err);
            res.send("couldnt UPDATE please try again.");
            return;
        }

        console.log(`Task ${taskId} finisehd`);
        res.redirect('/dashboard'); // Redirect to dashboard after deletion
    });
});
//serverstarter

const PORT = process.env.PORT || 3000
app.listen(3000, ()=>{
    console.log('Running on 3000');
});

