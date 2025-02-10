// script.js

// Page Management
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    
    // Show navbar elements based on login state
    const isLoggedIn = !!localStorage.getItem('username');
    const userRole = localStorage.getItem('role');
    
    document.getElementById('logoutBtn').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('username').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('userPoints').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('viewExpiredBtn').style.display = isLoggedIn ? 'block' : 'none';

    // Show appropriate page
    if (!isLoggedIn && ['home', 'admin', 'expired'].includes(pageName)) {
        pageName = 'welcome';
    }

    if (pageName === 'home' && userRole === 'admin') {
        pageName = 'admin';
    }

    const pageElement = document.getElementById(`${pageName}Page`);
    if (pageElement) {
        pageElement.style.display = 'block';
        if (isLoggedIn) {
            loadUserPoints(localStorage.getItem('username'));
            if (pageName === 'home') loadActivePredictions();
            if (pageName === 'admin' || pageName === 'expired') loadExpiredPredictions();
        }
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        
        if (result.message === 'Login successful') {
            showToast(result.message, 'success');
            localStorage.setItem('username', result.username);
            localStorage.setItem('role', result.role);
            showPage(result.role === 'admin' ? 'admin' : 'home');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showToast('Failed to login. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!username || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        
        if (result.message === 'Signup successful') {
            showToast(result.message, 'success');
            showPage('login');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showToast('Signup failed. Please try again.', 'error');
    }
}

// User Points Management
async function loadUserPoints(username) {
    try {
        const response = await fetch('/getUserPoints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const result = await response.json();
        if (result.points !== undefined) {
            document.getElementById('userPoints').textContent = `Points: ${result.points}`;
        }
    } catch (error) {
        console.error('Error loading user points:', error);
    }
}

// Predictions Management
async function loadActivePredictions() {
    try {
        const response = await fetch('/activePredictions');
        const predictions = await response.json();
        const predictionsDiv = document.getElementById('activePredictions');
        predictionsDiv.innerHTML = '';

        if (predictions.length === 0) {
            predictionsDiv.innerHTML = '<p>No active predictions.</p>';
            return;
        }

        predictions.forEach(renderPrediction);
    } catch (error) {
        console.error('Error loading active predictions:', error);
        showToast('Failed to load active predictions.', 'error');
    }
}

async function loadExpiredPredictions() {
    try {
        const response = await fetch('/expiredPredictions');
        const predictions = await response.json();
        const predictionsDiv = document.getElementById('expiredPredictionsList') || 
                             document.getElementById('expiredPredictions');
        predictionsDiv.innerHTML = '';

        if (predictions.length === 0) {
            predictionsDiv.innerHTML = '<p>No expired predictions.</p>';
            return;
        }

        const userRole = localStorage.getItem('role');
        predictions.forEach(prediction => renderPrediction(prediction, true, userRole === 'admin'));
    } catch (error) {
        console.error('Error loading expired predictions:', error);
        showToast('Failed to load expired predictions.', 'error');
    }
}

function renderPrediction(prediction, isExpired = false, isAdmin = false) {
    const container = document.createElement('div');
    container.className = 'prediction';

    const desc = document.createElement('p');
    desc.textContent = prediction.description;
    container.appendChild(desc);

    if (!isExpired) {
        const timer = document.createElement('p');
        timer.className = 'timer';
        container.appendChild(timer);
        updateTimer(timer, prediction.expiresAt);
    }

    const outcomesList = document.createElement('div');
    prediction.outcomes.forEach(outcome => {
        const outcomeDiv = document.createElement('div');
        outcomeDiv.className = 'outcome-container';

        const outcomeName = document.createElement('span');
        outcomeName.textContent = `${outcome.name} (${outcome.votes} votes, ${outcome.points} points)`;
        outcomeDiv.appendChild(outcomeName);

        if (!isExpired) {
            const pointsInput = document.createElement('input');
            pointsInput.type = 'number';
            pointsInput.min = '1';
            pointsInput.placeholder = 'Points';
            pointsInput.className = 'vote-points';
            outcomeDiv.appendChild(pointsInput);

            const voteButton = document.createElement('button');
            voteButton.textContent = 'Vote';
            voteButton.onclick = () => submitVote(prediction.id, outcome.id, pointsInput.value);
            outcomeDiv.appendChild(voteButton);
        }

        outcomesList.appendChild(outcomeDiv);
    });
    container.appendChild(outcomesList);

    if (isAdmin && isExpired) {
        const resolveButton = document.createElement('button');
        resolveButton.textContent = 'Resolve Prediction';
        resolveButton.onclick = () => resolvePrediction(prediction.id);
        container.appendChild(resolveButton);
    }

    const targetDiv = isExpired ? 
        (document.getElementById('expiredPredictionsList') || document.getElementById('expiredPredictions')) :
        document.getElementById('activePredictions');
    targetDiv.appendChild(container);
}

function updateTimer(timerElement, expiresAt) {
    const updateTime = () => {
        const now = Date.now();
        const timeLeft = expiresAt - now;

        if (timeLeft <= 0) {
            timerElement.textContent = 'Expired';
            clearInterval(intervalId);
            loadActivePredictions(); // Refresh the list
        } else {
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            timerElement.textContent = `Time Left: ${minutes}m ${seconds}s`;
        }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
}

// Form Submissions
async function handleCreatePrediction(e) {
    e.preventDefault();
    const description = document.getElementById('predictionDescription').value.trim();
    const expiresInMinutes = parseInt(document.getElementById('expiresIn').value, 10);
    const outcomeElements = document.querySelectorAll('.outcome');
    const outcomes = Array.from(outcomeElements).map(input => input.value.trim()).filter(v => v !== '');

    if (outcomes.length < 2) {
        showToast('Please provide at least two outcomes.', 'error');
        return;
    }

    try {
        const response = await fetch('/createPrediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, outcomes, expiresInMinutes })
        });

        const result = await response.json();
        if (result.message === 'Prediction created successfully') {
            showToast(result.message, 'success');
            loadActivePredictions();
            e.target.reset();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error creating prediction:', error);
        showToast('Failed to create prediction.', 'error');
    }
}

async function handleAllocatePoints(e) {
    e.preventDefault();
    const allocateUsername = document.getElementById('allocateUsername').value.trim();
    const allocatePoints = parseInt(document.getElementById('allocatePoints').value, 10);
    const adminUsername = localStorage.getItem('username');

    try {
        const response = await fetch('/admin/allocatePoints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: adminUsername, 
                allocateUsername, 
                points: allocatePoints 
            })
        });

        const result = await response.json();
        if (result.message.startsWith('Allocated')) {
            showToast(result.message, 'success');
            e.target.reset();
            loadUserPoints(adminUsername);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error allocating points:', error);
        showToast('Failed to allocate points.', 'error');
    }
}

// Voting and Resolution
async function submitVote(predictionId, outcomeId, points) {
    const username = localStorage.getItem('username');
    points = parseInt(points, 10);
    
    if (isNaN(points) || points <= 0) {
        showToast('Please enter a valid number of points.', 'error');
        return;
    }

    try {
        const response = await fetch('/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ predictionId, outcomeId, username, points })
        });

        const result = await response.json();
        if (result.message === 'Vote counted successfully') {
            showToast(result.message, 'success');
            loadActivePredictions();
            loadUserPoints(username);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during voting:', error);
        showToast('Failed to cast vote.', 'error');
    }
}

async function resolvePrediction(predictionId) {
    const winningOutcomeId = prompt('Enter the Winning Outcome ID:');
    if (!winningOutcomeId) {
        showToast('Winning Outcome ID is required.', 'error');
        return;
    }

    const username = localStorage.getItem('username');

    try {
        const response = await fetch('/admin/resolvePrediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                predictionId, 
                winningOutcomeId: Number(winningOutcomeId) 
            })
        });

        const result = await response.json();
        if (result.message === 'Prediction resolved and points distributed') {
            showToast(result.message, 'success');
            loadExpiredPredictions();
            loadUserPoints(username);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error resolving prediction:', error);
        showToast('Failed to resolve prediction.', 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    
    // Initialize page
    showPage(username ? (role === 'admin' ? 'admin' : 'home') : 'welcome');
    
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('predictionForm')?.addEventListener('submit', handleCreatePrediction);
    document.getElementById('allocatePointsForm')?.addEventListener('submit', handleAllocatePoints);
    
    // Navigation
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        showPage('welcome');
    });
    
    document.getElementById('viewExpiredBtn').addEventListener('click', () => {
        showPage('expired');
    });
});