// signup.js

document.getElementById('signupForm').addEventListener('submit', async (e) => {
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
            // Redirect to login page after successful signup
            window.location.href = 'login.html';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showToast('Signup failed. Please try again.', 'error');
    }
});