// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const dbPath = path.join(__dirname, 'db.json');

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (db.users.find(user => user.username === username)) {
        return res.json({ message: 'User already exists' });
    }
    db.users.push({ username, password });
    fs.writeFileSync(dbPath, JSON.stringify(db));
    res.json({ message: 'Signup successful' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const user = db.users.find(user => user.username === username && user.password === password);
    if (user) {
        res.json({ message: 'Login successful' });
    } else {
        res.json({ message: 'Invalid credentials' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});