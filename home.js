// home.js

// Initialize username and points on page load
document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('username').textContent = username;
    loadUserPoints(username);
});

// Function to load user points
async function loadUserPoints(username) {
    try {
        const response = await fetch('/getUserPoints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const result = await response.json();
        if (result.points !== undefined) {
            document.getElementById('userPoints').textContent = result.points;
        }
    } catch (error) {
        console.error('Error loading user points:', error);
    }
}

// Create Prediction
document.getElementById('predictionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('predictionDescription').value.trim();
    const expiresInMinutes = parseInt(document.getElementById('expiresIn').value, 10);
    const outcomeElements = document.querySelectorAll('.outcome');
    const outcomes = Array.from(outcomeElements).map(input => input.value.trim()).filter(v => v !== '');

    if (outcomes.length < 2) {
        showToast('Please provide at least two outcomes.', 'error');
        return;
    }

    if (isNaN(expiresInMinutes) || expiresInMinutes <= 0) {
        showToast('Please enter a valid expiration time in minutes.', 'error');
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
            // Reset form
            document.getElementById('predictionForm').reset();
            // Outcomes are fixed, no need to modify outcomesDiv
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error creating prediction:', error);
        showToast('Failed to create prediction. Please try again.', 'error');
    }
});

// Load Active Predictions
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

        predictions.forEach(prediction => {
            const predictionDiv = document.createElement('div');
            predictionDiv.className = 'prediction';

            const desc = document.createElement('p');
            desc.textContent = prediction.description;
            predictionDiv.appendChild(desc);

            // Countdown Timer
            const timer = document.createElement('p');
            timer.className = 'timer';
            predictionDiv.appendChild(timer);

            // Function to update the timer
            function updateTimer() {
                const now = Date.now();
                const timeLeft = prediction.expiresAt - now;

                if (timeLeft <= 0) {
                    timer.textContent = 'Expired';
                    clearInterval(intervalId);
                } else {
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                    timer.textContent = `Time Left: ${minutes}m ${seconds}s`;
                }
            }

            // Initial call
            updateTimer();
            // Update every second
            const intervalId = setInterval(updateTimer, 1000);

            prediction.outcomes.forEach(outcome => {
                const outcomeDiv = document.createElement('div');
                outcomeDiv.className = 'outcome-container';

                const outcomeName = document.createElement('span');
                outcomeName.textContent = `${outcome.name} (${outcome.votes} votes): `;
                outcomeDiv.appendChild(outcomeName);

                const pointsInput = document.createElement('input');
                pointsInput.type = 'number';
                pointsInput.min = '1';
                pointsInput.id = `points-${prediction.id}-${outcome.id}`;
                pointsInput.placeholder = 'Points';
                pointsInput.className = 'vote-points';
                outcomeDiv.appendChild(pointsInput);

                const voteButton = document.createElement('button');
                voteButton.textContent = 'Vote';
                voteButton.onclick = () => submitVote(prediction.id, outcome.id);
                outcomeDiv.appendChild(voteButton);

                predictionDiv.appendChild(outcomeDiv);
            });

            predictionsDiv.appendChild(predictionDiv);
        });
    } catch (error) {
        console.error('Error loading active predictions:', error);
        showToast('Failed to load active predictions.', 'error');
    }
}

// Submit Vote Function
async function submitVote(predictionId, outcomeId) {
    const username = localStorage.getItem('username');
    const pointsInput = document.getElementById(`points-${predictionId}-${outcomeId}`);
    const points = parseInt(pointsInput.value, 10);
    
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

// Logout Functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// View Expired Predictions
document.getElementById('viewExpiredBtn').addEventListener('click', () => {
    window.location.href = 'expired.html';
});

// Initialize on Page Load
window.onload = () => {
    loadActivePredictions();
};