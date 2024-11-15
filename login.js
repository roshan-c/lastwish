// login.js

document.getElementById('loginForm').addEventListener('submit', async (e) => {
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
            // Store the username and role in localStorage for session management
            localStorage.setItem('username', result.username);
            localStorage.setItem('role', result.role); // Store role
            // Redirect based on role
            window.location.href = result.redirect;
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showToast('Failed to login. Please try again.', 'error');
    }
});