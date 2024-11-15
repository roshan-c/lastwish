// expired.js

document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role'); // Retrieve role
    if (!username) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('username').textContent = username;
    document.getElementById('userPoints').textContent = 'Loading...';
    loadUserPoints(username);
    loadExpiredPredictions(role); // Pass role to the function
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

// Load Expired Predictions
async function loadExpiredPredictions(role) { // Accept role as a parameter
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
                listItem.textContent = `${outcome.name}: ${outcome.votes} votes (${outcome.points} points)`;
                outcomesList.appendChild(listItem);
            });
            predictionDiv.appendChild(outcomesList);

            const expiredAt = document.createElement('p');
            const expireDate = new Date(prediction.expiresAt).toLocaleString();
            expiredAt.textContent = `Expired At: ${expireDate}`;
            predictionDiv.appendChild(expiredAt);

            // Show Resolve Button Only for Admins
            if (role === 'admin') {
                const resolveButton = document.createElement('button');
                resolveButton.textContent = 'Resolve Prediction';
                resolveButton.onclick = () => resolvePrediction(prediction.id);
                predictionDiv.appendChild(resolveButton);
            }

            predictionsDiv.appendChild(predictionDiv);
        });
    } catch (error) {
        console.error('Error loading expired predictions:', error);
        showToast('Failed to load expired predictions.', 'error');
    }
}

// Helper function to determine the winning outcome (this should be replaced with actual logic or user input)
function getWinningOutcomeId(prediction) {
    // For demonstration, assume outcome with highest votes wins
    let winningOutcome = prediction.outcomes[0];
    prediction.outcomes.forEach(outcome => {
        if (outcome.votes > winningOutcome.votes) {
            winningOutcome = outcome;
        }
    });
    return winningOutcome.id;
}

// Resolve Prediction Function
async function resolvePrediction(predictionId) {
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
            body: JSON.stringify({ 
                username, 
                predictionId, 
                winningOutcomeId: Number(winningOutcomeId) 
            })
        });

        const result = await response.json();
        if (result.message === 'Prediction resolved and points distributed') {
            showToast(result.message, 'success');
            loadExpiredPredictions('admin'); // Reload predictions with admin role
            loadUserPoints(username);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error resolving prediction:', error);
        showToast('Failed to resolve prediction.', 'error');
    }
}

// Logout Functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role'); // Remove role
    window.location.href = 'login.html';
});