document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const saveBtn = document.getElementById('save-kpi-btn');
    const totalMonthlyTargetInput = document.getElementById('total-monthly-target-input');

    let changes = {};

    if (totalMonthlyTargetInput) {
        totalMonthlyTargetInput.addEventListener('input', () => {
            stageChange('kpi', 'main', 'total_monthly_target', totalMonthlyTargetInput.value, 'number');
        });
    }

    saveBtn.addEventListener('click', saveAllChanges);

    function stageChange(collection, id, field, value, type) {
        if (!changes[collection]) changes[collection] = {};
        if (!changes[collection][id]) changes[collection][id] = {};
        changes[collection][id][field] = type === 'number' ? parseFloat(value) || 0 : value;
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
        const doc = await db.collection('kpi').doc('main').get();
        if (doc.exists) {
            const data = doc.data();
            if (totalMonthlyTargetInput && data.total_monthly_target) {
                totalMonthlyTargetInput.value = data.total_monthly_target;
            }
        }
    }

    loadAllData();
});