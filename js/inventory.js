document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const addProductBtn = document.getElementById('add-product-btn');
    const newProductNameInput = document.getElementById('new-product-name');
    const newOpeningStockInput = document.getElementById('new-opening-stock');
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryRowTemplate = document.getElementById('inventory-row-template');

    // --- ADD NEW PRODUCT ---
    addProductBtn.addEventListener('click', () => {
        const productName = newProductNameInput.value.trim();
        const openingStock = parseInt(newOpeningStockInput.value) || 0;

        if (productName) {
            db.collection('inventory').add({
                name: productName,
                openingStock: openingStock,
                stockIn: 0,
                stockOut: 0
            }).then(() => {
                newProductNameInput.value = '';
                newOpeningStockInput.value = '';
            }).catch(error => {
                console.error("Error adding product: ", error);
            });
        }
    });

    // --- LOAD & DISPLAY INVENTORY ---
    db.collection('inventory').onSnapshot(snapshot => {
        inventoryTableBody.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const row = inventoryRowTemplate.content.cloneNode(true).querySelector('tr');
            const closingStock = product.openingStock + product.stockIn - product.stockOut;

            row.dataset.id = doc.id;
            row.children[0].textContent = product.name;
            row.children[1].textContent = product.openingStock;
            row.querySelector('[data-field="stockIn"]').value = product.stockIn;
            row.querySelector('[data-field="stockOut"]').value = product.stockOut;
            row.children[4].textContent = closingStock;

            // --- UPDATE STOCK ---
            row.querySelector('.update-stock-btn').addEventListener('click', () => {
                const stockIn = parseInt(row.querySelector('[data-field="stockIn"]').value) || 0;
                const stockOut = parseInt(row.querySelector('[data-field="stockOut"]').value) || 0;
                db.collection('inventory').doc(doc.id).update({ stockIn, stockOut });
            });

            // --- DELETE PRODUCT ---
            row.querySelector('.delete-product-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                    db.collection('inventory').doc(doc.id).delete();
                }
            });

            inventoryTableBody.appendChild(row);
        });
    });
});