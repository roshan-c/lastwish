// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const dbPath = path.join(__dirname, 'db.json');

app.post('/signup', (req, res) => {
    try {
        const { username, password } = req.body;
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (db.users.find(user => user.username === username)) {
            return res.json({ message: 'User already exists' });
        }
        db.users.push({ username, password });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Signup successful' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const user = db.users.find(user => user.username === username && user.password === password);
        if (user) {
            res.json({ message: 'Login successful' });
        } else {
            res.json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});