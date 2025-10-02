document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const editorModeBtn = document.getElementById('editor-mode-btn');

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;

        if (user) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');

            const { data: userData } = await supabaseClient
                .from('users')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (userData && (userData.role === 'admin' || userData.role === 'editor')) {
                editorModeBtn.classList.remove('hidden');
            }
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            editorModeBtn.classList.add('hidden');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
        });
    }
});
