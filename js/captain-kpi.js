document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const saveBtn = document.getElementById('save-kpi-btn');
    const captainTemplate = document.getElementById('captain-template');
    const captainContainer = document.getElementById('captain-container');

    let changes = {};

    // --- EVENT LISTENERS ---
    document.getElementById('add-captain-btn').addEventListener('click', () => addEntry('captains', captainTemplate, captainContainer));
    saveBtn.addEventListener('click', saveAllChanges);

    function addEntry(collectionName, template, container) {
        const newDocRef = db.collection(collectionName).doc();
        const newEntry = createEntryElement(newDocRef.id, {}, template, collectionName);
        container.appendChild(newEntry);
        if (!changes[collectionName]) changes[collectionName] = {};
        changes[collectionName][newDocRef.id] = { isNew: true };
    }

    function createEntryElement(id, data, template, collectionName) {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        card.dataset.id = id;

        const inputs = card.querySelectorAll('input, select');
        inputs.forEach(input => {
            const field = input.dataset.field;
            input.value = data[field] || '';
            input.addEventListener('input', (e) => {
                stageChange(collectionName, id, field, e.target.value, e.target.type);
            });
        });

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this entry?')) {
                stageDeletion(collectionName, id);
                card.remove();
            }
        });
        return card;
    }

    function stageChange(collection, id, field, value, type) {
        if (!changes[collection]) changes[collection] = {};
        if (!changes[collection][id]) changes[collection][id] = {};
        changes[collection][id][field] = type === 'number' ? parseFloat(value) || 0 : value;
        saveBtn.classList.add('animate-pulse');
    }

    function stageDeletion(collection, id) {
        if (!changes[collection]) changes[collection] = {};
        changes[collection][id] = { _delete: true };
        saveBtn.classList.add('animate-pulse');
    }

    async function saveAllChanges() {
        const batch = db.batch();

        for (const collectionName in changes) {
            for (const docId in changes[collectionName]) {
                const docChanges = changes[collectionName][docId];
                const docRef = db.collection(collectionName).doc(docId);
                if (docChanges._delete) {
                    batch.delete(docRef);
                } else {
                    batch.set(docRef, docChanges, { merge: true });
                }
            }
        }

        await batch.commit();

        alert('All changes have been saved successfully!');
        changes = {};
        saveBtn.classList.remove('animate-pulse');
        loadAllData(); 
    }

    async function loadAllData() {
        const collectionsToLoad = {
            captains: { template: captainTemplate, container: captainContainer },
        };

        for (const collectionName in collectionsToLoad) {
            const { template, container } = collectionsToLoad[collectionName];
            if(container) {
                container.innerHTML = ''; // Clear existing entries before loading
                const snapshot = await db.collection(collectionName).get();
                snapshot.forEach(doc => {
                    const newEntry = createEntryElement(doc.id, doc.data(), template, collectionName);
                    container.appendChild(newEntry);
                });
            }
        }
    }

    loadAllData();
});