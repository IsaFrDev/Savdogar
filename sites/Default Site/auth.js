// Auth logic for the site
let currentUser = null;

function checkAuth() {
    const token = localStorage.getItem('user_token');
    if (token) {
        // mock auth check
        currentUser = { id: 1, phone: '+998901234567' };
    }
}

function logout() {
    localStorage.removeItem('user_token');
    currentUser = null;
    window.location.reload();
}

window.addEventListener('DOMContentLoaded', checkAuth);
