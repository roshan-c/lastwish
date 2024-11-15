// script.js

document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
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
            // Optionally redirect to login or home page after signup
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showToast('Signup failed. Please try again.', 'error');
    }
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
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
            if (result.redirect) {
                window.location.href = result.redirect;
            }
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showToast('Login failed. Please try again.', 'error');
    }
});