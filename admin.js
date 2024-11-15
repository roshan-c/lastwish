// admin.js

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

// Load Expired Predictions
async function loadExpiredPredictions() {
    try {
        const response = await fetch('/expiredPredictions');
        const predictions = await response.json();
        const predictionsDiv = document.getElementById('expiredPredictions');
        predictionsDiv.innerHTML = '';
        if (predictions.length === 0) {
            predictionsDiv.innerHTML = '<p>No expired predictions.</p>';
            return;
        }
        predictions.forEach(prediction => {
            const predictionDiv = document.createElement('div');
            predictionDiv.className = 'prediction';
            
            const desc = document.createElement('p');
            desc.textContent = prediction.description;
            predictionDiv.appendChild(desc);
            
            const outcomesList = document.createElement('ul');
            prediction.outcomes.forEach(outcome => {
                const listItem = document.createElement('li');
                listItem.textContent = `ID: ${outcome.id} - ${outcome.name}: ${outcome.votes} votes (${outcome.points} points)`;
                outcomesList.appendChild(listItem);
            });
            predictionDiv.appendChild(outcomesList);
            
            const resolveButton = document.createElement('button');
            resolveButton.textContent = 'Resolve Prediction';
            resolveButton.onclick = () => resolvePrediction(prediction.id);
            predictionDiv.appendChild(resolveButton);
            
            predictionsDiv.appendChild(predictionDiv);
        });
    } catch (error) {
        console.error('Error loading expired predictions:', error);
    }
}

// Resolve Prediction Function
async function resolvePrediction(predictionId) {
    // Prompt admin to enter the winning outcome ID
    const winningOutcomeId = prompt('Enter the Winning Outcome ID:');
    if (!winningOutcomeId) {
        showToast('Winning Outcome ID is required.', 'error');
        return;
    }

    const username = localStorage.getItem('username'); // Admin username

    try {
        const response = await fetch('/admin/resolvePrediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, predictionId, winningOutcomeId: Number(winningOutcomeId) })
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

// Allocate Points Form Submission
document.getElementById('allocatePointsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const allocateUsername = document.getElementById('allocateUsername').value.trim();
    const allocatePoints = parseInt(document.getElementById('allocatePoints').value, 10);
    const adminUsername = localStorage.getItem('username'); // Admin's username

    if (!allocateUsername || isNaN(allocatePoints) || allocatePoints <= 0) {
        showToast('Please enter a valid username and points.', 'error');
        return;
    }

    try {
        const response = await fetch('/admin/allocatePoints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminUsername, allocateUsername, points: allocatePoints })
        });

        const result = await response.json();
        if (result.message.startsWith('Allocated')) {
            showToast(result.message, 'success');
            document.getElementById('allocatePointsForm').reset();
            loadUserPoints(adminUsername);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error allocating points:', error);
        showToast('Failed to allocate points.', 'error');
    }
});

// Logout Functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('username').textContent = username;
    loadUserPoints(username);
    loadExpiredPredictions();
});