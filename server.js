// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Path to the database file
const dbPath = path.join(__dirname, 'db.json');

// Middleware to verify admin role
function verifyAdmin(req, res, next) {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required for admin actions' });
    }

    let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const user = db.users.find(user => user.username === username);
    if (user && user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
}

// Login Route with Password Verification
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const user = db.users.find(user => user.username === username);
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log(`User logged in: ${username}`);
                res.json({ 
                    message: 'Login successful', 
                    redirect: user.role === 'admin' ? 'admin.html' : 'home.html', 
                    username,
                    role: user.role // Include role in the response
                });
                return;
            }
        }
        console.log(`Invalid login attempt for username: ${username}`);
        res.json({ message: 'Invalid credentials' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Signup Route with Password Hashing
app.post('/signup', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const existingUser = db.users.find(user => user.username === username);
        if (existingUser) {
            return res.json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, points: 1000, role: role || 'user' };
        db.users.push(newUser);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Signup successful' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Admin Route to Allocate Points Manually
app.post('/admin/allocatePoints', verifyAdmin, (req, res) => {
    try {
        const { username, allocateUsername, points } = req.body;
        
        // Validate required fields
        if (!username || !allocateUsername || points === undefined) {
            return res.status(400).json({ message: 'Missing required fields: username, allocateUsername, points' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Find the target user to allocate points
        const targetUser = db.users.find(user => user.username === allocateUsername);
        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }

        // Allocate points
        targetUser.points += Number(points);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log(`Admin (${username}) allocated ${points} points to user (${allocateUsername}).`);
        res.json({ message: `Allocated ${points} points to ${allocateUsername}` });
    } catch (error) {
        console.error('Error allocating points:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create Prediction Route
app.post('/createPrediction', (req, res) => {
    try {
        const { description, outcomes, expiresInMinutes } = req.body;
        console.log('Received /createPrediction request:', req.body);
        
        // Validate input
        if (!description || !Array.isArray(outcomes) || outcomes.length < 2 || !expiresInMinutes) {
            console.log('Invalid prediction data');
            return res.status(400).json({ message: 'Invalid prediction data' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const newPrediction = {
            id: Date.now(),
            description,
            outcomes: outcomes.map((name, index) => ({
                id: index + 1,
                name,
                votes: 0,
                points: 0
            })),
            createdAt: Date.now(),
            expiresAt: Date.now() + expiresInMinutes * 60000,
            allocations: [], // Initialize empty allocations
            resolved: false  // Added resolved flag
        };
        db.predictions.push(newPrediction);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log('Created new prediction:', newPrediction);
        res.json({ message: 'Prediction created successfully' });
    } catch (error) {
        console.error('Error during prediction creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Active Predictions Route
app.get('/activePredictions', (req, res) => {
    try {
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const currentTime = Date.now();
        const activePredictions = db.predictions.filter(prediction => prediction.expiresAt > currentTime);
        console.log(`Fetching active predictions, count: ${activePredictions.length}`);
        res.json(activePredictions);
    } catch (error) {
        console.error('Error retrieving active predictions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Expired Predictions Route
app.get('/expiredPredictions', (req, res) => {
    try {
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const currentTime = Date.now();
        const expiredPredictions = db.predictions.filter(prediction => prediction.expiresAt <= currentTime);
        res.json(expiredPredictions);
    } catch (error) {
        console.error('Error retrieving expired predictions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Vote on Prediction Outcome Route with Points
app.post('/vote', (req, res) => {
    try {
        const { predictionId, outcomeId, username, points } = req.body;
        if (!predictionId || !outcomeId || !username || !points) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

        const user = db.users.find(user => user.username === username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.points < points) {
            return res.status(400).json({ message: 'Insufficient points' });
        }

        const prediction = db.predictions.find(p => p.id === Number(predictionId));
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found' });
        }

        const outcome = prediction.outcomes.find(o => o.id === Number(outcomeId));
        if (!outcome) {
            return res.status(404).json({ message: 'Outcome not found' });
        }

        // Deduct points from user
        user.points -= points;

        // Update outcome votes and points
        outcome.votes += 1;
        outcome.points += points;

        // Record the allocation
        prediction.allocations.push({
            username,
            outcomeId: Number(outcomeId),
            points: Number(points)
        });

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log(`User ${username} voted on Prediction ${predictionId}, Outcome ${outcomeId} with ${points} points`);
        res.json({ message: 'Vote counted successfully' });
    } catch (error) {
        console.error('Error during voting:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to Resolve Prediction and Distribute Points
app.post('/resolvePrediction', (req, res) => {
    try {
        const { predictionId, winningOutcomeId } = req.body;
        if (!predictionId || !winningOutcomeId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const prediction = db.predictions.find(p => p.id === Number(predictionId));
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found' });
        }

        const winningOutcome = prediction.outcomes.find(o => o.id === Number(winningOutcomeId));
        if (!winningOutcome) {
            return res.status(404).json({ message: 'Winning outcome not found' });
        }

        const losingOutcomes = prediction.outcomes.filter(o => o.id !== Number(winningOutcomeId));
        const totalLosingPoints = losingOutcomes.reduce((sum, o) => sum + o.points, 0);

        if (totalLosingPoints === 0) {
            return res.status(400).json({ message: 'No points to distribute' });
        }

        const totalWinningPoints = winningOutcome.points;

        if (totalWinningPoints === 0) {
            return res.status(400).json({ message: 'No points were allocated to the winning outcome' });
        }

        // Calculate payout multiplier
        const multiplier = totalLosingPoints / totalWinningPoints;

        // Iterate through allocations to distribute points
        prediction.allocations.forEach(allocation => {
            if (allocation.outcomeId === Number(winningOutcomeId)) {
                const user = db.users.find(user => user.username === allocation.username);
                if (user) {
                    const winnings = allocation.points * multiplier;
                    user.points += Math.floor(winnings); // Use floor to convert to integer
                }
            }
        });

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log(`Prediction ${predictionId} resolved. Distributed points to winners.`);
        res.json({ message: 'Prediction resolved and points distributed' });
    } catch (error) {
        console.error('Error resolving prediction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get User Points Route
app.post('/getUserPoints', (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const user = db.users.find(user => user.username === username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ points: user.points });
    } catch (error) {
        console.error('Error retrieving user points:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Admin Route to Resolve Prediction
app.post('/admin/resolvePrediction', verifyAdmin, (req, res) => {
    try {
        const { username, predictionId, winningOutcomeId } = req.body;
        if (!predictionId || !winningOutcomeId) {
            return res.status(400).json({ message: 'Missing required fields: predictionId, winningOutcomeId' });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const prediction = db.predictions.find(p => p.id === Number(predictionId));
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found' });
        }

        if (prediction.resolved) {
            return res.status(400).json({ message: 'Prediction already resolved' });
        }

        const winningOutcome = prediction.outcomes.find(o => o.id === Number(winningOutcomeId));
        if (!winningOutcome) {
            return res.status(404).json({ message: 'Winning outcome not found' });
        }

        // Calculate total points across all outcomes
        const totalPoints = prediction.outcomes.reduce((sum, o) => sum + o.points, 0);

        // Extract unique usernames who voted for the winning outcome
        const winningAllocations = prediction.allocations.filter(allocation => allocation.outcomeId === Number(winningOutcomeId));
        const uniqueWinners = [...new Set(winningAllocations.map(allocation => allocation.username))];

        const numberOfWinners = uniqueWinners.length;

        if (numberOfWinners === 0) {
            return res.status(400).json({ message: 'No voters for the winning outcome' });
        }

        // Calculate payout per winner
        const payoutPerWinner = Math.floor(totalPoints / numberOfWinners);

        // Distribute points to each winner
        uniqueWinners.forEach(winnerUsername => {
            const user = db.users.find(u => u.username === winnerUsername);
            if (user) {
                user.points += payoutPerWinner;
            }
        });

        // Mark prediction as resolved
        prediction.resolved = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log(`Prediction ${predictionId} resolved by admin ${username}. Distributed ${payoutPerWinner} points to each of ${numberOfWinners} winners.`);
        res.json({ message: 'Prediction resolved and points distributed' });
    } catch (error) {
        console.error('Error resolving prediction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Server Listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});