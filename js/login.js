document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in 
                window.location.href = 'index.html';
            })
            .catch((error) => {
                loginError.textContent = error.message;
            });
    });
});
