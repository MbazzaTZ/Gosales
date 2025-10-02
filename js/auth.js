document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const editorModeBtn = document.getElementById('editor-mode-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');

            // Check user role for editor button
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'editor')) {
                    editorModeBtn.classList.remove('hidden');
                }
            });

        } else {
            // User is signed out.
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            editorModeBtn.classList.add('hidden');
        }
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }
});
