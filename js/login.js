document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            window.location.href = 'index.html';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                loginError.textContent = 'Please provide both email and password.';
                loginError.classList.remove('hidden');
                return;
            }

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                window.location.href = 'index.html';
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = error.message || 'Login failed. Please check your credentials.';
                loginError.classList.remove('hidden');
            }
        });
    }
});
