document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');
    const teamMemberForm = document.getElementById('team-member-form');
    const teamMembersTableBody = document.querySelector('#team-members-table tbody');

    // --- Firebase Services ---
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- Function to load team members ---
    const loadTeamMembers = async () => {
        if (!teamMembersTableBody) return;
        teamMembersTableBody.innerHTML = ''; // Clear existing table data
        try {
            const snapshot = await db.collection('team').orderBy('name').get();
            snapshot.forEach(doc => {
                const member = doc.data();
                const row = teamMembersTableBody.insertRow();
                row.innerHTML = `
                    <td>${member.name}</td>
                    <td>${member.role}</td>
                `;
            });
        } catch (error) {
            console.error("Error loading team members: ", error);
            alert("Could not load team members.");
        }
    };

    // --- Auth State Observer ---
    // This runs when the page loads to check if the user is already logged in.
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in, check their role.
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && (userDoc.data().role === 'admin' || userDoc.data().role === 'editor')) {
                    // If user is admin, show the panel and hide the login form.
                    // This allows admins to access this page directly if they are already authenticated.
                    adminPanel.classList.remove('hidden');
                    loginContainer.classList.add('hidden');
                    loadTeamMembers();
                } else {
                    // Not an admin or user doc doesn't exist, sign them out from this page.
                    auth.signOut();
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
                auth.signOut();
            }
        } else {
            // User is signed out, ensure the login form is visible.
            adminPanel.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }
    });

    // --- Event Listeners ---

    // Login Button
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // On successful login, check role and REDIRECT.
                    const user = userCredential.user;
                    db.collection('users').doc(user.uid).get().then(userDoc => {
                        if (userDoc.exists && (userDoc.data().role === 'admin' || userDoc.data().role === 'editor')) {
                            // It's an admin! Redirect to the main page.
                            window.location.href = 'index.html';
                        } else {
                            // Not an admin.
                            errorMessage.textContent = 'You do not have permission to access this page.';
                            errorMessage.classList.remove('hidden');
                            auth.signOut();
                        }
                    });
                })
                .catch((error) => {
                    errorMessage.textContent = error.message;
                    errorMessage.classList.remove('hidden');
                });
        });
    }

    // Logout Button
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                // After logout, redirect to the main page.
                window.location.href = 'index.html';
            });
        });
    }

    // --- Team Management Form ---
    if (teamMemberForm) {
        teamMemberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const memberName = document.getElementById('team-member-name').value;
            const memberRole = document.getElementById('team-member-role').value;

            if (!memberName || !memberRole) {
                alert('Please provide a name and a role.');
                return;
            }

            try {
                await db.collection('team').add({
                    name: memberName,
                    role: memberRole
                });
                alert('Team member added successfully!');
                teamMemberForm.reset();
                loadTeamMembers(); // Refresh the table
            } catch (error) {
                console.error('Error adding team member: ', error);
                alert('Error adding team member. See console for details.');
            }
        });
    }


    // --- Existing Admin Panel Form Logic ---

    const handleFirestoreResponse = (form, error) => {
        if (error) {
            console.error('Error writing to Firestore: ', error);
            alert('Error submitting data. See console for details.');
        } else {
            alert('Data submitted successfully!');
            form.reset();
        }
    };

    const uploadCsvToFirestore = (file, collectionName, form) => {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const batch = db.batch();
                results.data.forEach(item => {
                    // Simple validation to skip empty rows
                    if (Object.values(item).some(val => val)) {
                        const docRef = db.collection(collectionName).doc();
                        batch.set(docRef, item);
                    }
                });
                batch.commit()
                    .then(() => handleFirestoreResponse(form))
                    .catch(e => handleFirestoreResponse(form, e));
            }
        });
    };

    // --- Form Event Listeners ---
    const setupFormListener = (formId, fileId, collection) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                const fileInput = document.getElementById(fileId);
                uploadCsvToFirestore(fileInput.files[0], collection, form);
            });
        }
    };

    setupFormListener('stock-form', 'stock-file', 'stock');
    setupFormListener('sales-form', 'sales-file', 'sales');
    setupFormListener('target-form', 'target-file', 'targets');

    const manualSalesForm = document.getElementById('manual-sales-form');
    if (manualSalesForm) {
        manualSalesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dsrName = document.getElementById('sales-dsr').value;
            const salesCount = document.getElementById('sales-count').value;
            db.collection('sales').add({ dsrName, sales: parseInt(salesCount, 10), date: new Date() })
                .then(() => handleFirestoreResponse(manualSalesForm))
                .catch(e => handleFirestoreResponse(manualSalesForm, e));
        });
    }

    const manualStockForm = document.getElementById('manual-stock-form');
    if (manualStockForm) {
        manualStockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemName = document.getElementById('stock-item').value;
            const quantity = document.getElementById('stock-quantity').value;
            db.collection('stock').add({ itemName, quantity: parseInt(quantity, 10), date: new Date() })
                .then(() => handleFirestoreResponse(manualStockForm))
                .catch(e => handleFirestoreResponse(manualStockForm, e));
        });
    }

    const roleTargetForm = document.getElementById('role-target-form');
    if (roleTargetForm) {
        roleTargetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.getElementById('target-role').value;
            const name = document.getElementById('target-name').value;
            const target = document.getElementById('target-value').value;
            db.collection('targets').add({ role, name, target: parseInt(target, 10), date: new Date() })
                .then(() => handleFirestoreResponse(roleTargetForm))
                .catch(e => handleFirestoreResponse(roleTargetForm, e));
        });
    }

    const kpiForm = document.getElementById('kpi-form');
    if (kpiForm) {
        kpiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const kpiName = document.getElementById('kpi-name').value;
            const kpiValue = document.getElementById('kpi-value').value;
            db.collection('kpis').add({ name: kpiName, value: kpiValue })
                .then(() => handleFirestoreResponse(kpiForm))
                .catch(e => handleFirestoreResponse(kpiForm, e));
        });
    }
});
