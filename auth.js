
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const authContainer = document.getElementById('auth-container');
    const editorModeBtn = document.getElementById('editor-mode-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');

    let editorMode = false;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && (userDoc.data().role === 'admin' || userDoc.data().role === 'editor')) {
                    authContainer.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
            window.location.reload();
        });
    }

    if (editorModeBtn) {
        editorModeBtn.addEventListener('click', () => {
            editorMode = !editorMode;
            if (editorMode) {
                // Enter editor mode
                editorModeBtn.textContent = 'Exit Editor Mode';
                editorModeBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                editorModeBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
                saveChangesBtn.classList.remove('hidden');
                document.querySelectorAll('.editable').forEach(el => {
                    el.setAttribute('contenteditable', 'true');
                    el.style.border = '2px dashed #3498db';
                    el.style.padding = '5px';
                    el.style.borderRadius = '5px';
                });
            } else {
                // Exit editor mode
                editorModeBtn.textContent = 'Enter Editor Mode';
                editorModeBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                editorModeBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
                saveChangesBtn.classList.add('hidden');
                document.querySelectorAll('.editable').forEach(el => {
                    el.setAttribute('contenteditable', 'false');
                    el.style.border = 'none';
                    el.style.padding = '0';
                });
            }
        });
    }

    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', async () => {
            const batch = db.batch();
            document.querySelectorAll('.editable').forEach(el => {
                const fieldId = el.dataset.fieldId;
                const content = el.innerHTML;
                const docRef = db.collection('content').doc(fieldId);
                batch.set(docRef, { html: content });
            });

            try {
                await batch.commit();
                alert('Changes saved successfully!');
                editorModeBtn.click(); // Exit editor mode
            } catch (error) {
                console.error('Error saving changes:', error);
                alert('Error saving changes. Please see the console for details.');
            }
        });
    }

    // Function to load content from Firestore
    const loadContent = async () => {
        try {
            const snapshot = await db.collection('content').get();
            snapshot.forEach(doc => {
                const fieldId = doc.id;
                const content = doc.data().html;
                const element = document.querySelector(`[data-field-id='${fieldId}']`);
                if (element) {
                    element.innerHTML = content;
                }
            });
        } catch (error) {
            console.error('Error loading content:', error);
        }
    };

    loadContent();
});
