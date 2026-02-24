async function loadBulkGroups() {
    // We count unique members in each group
    const { data: groups } = await _spazaClient.from('buying_groups').select(`
        *,
        products(*),
        group_members(count) 
    `);
    
    const list = document.getElementById('bulk-groups-view');
    
    list.innerHTML = groups.map(group => {
        const memberCount = group.group_members[0].count; // Total spazas joined
        const progress = Math.min((memberCount / group.min_spazas) * 100, 100);
        
        return `
        <div class="bg-white p-6 rounded-2xl shadow-md border-t-4 border-blue-600 relative overflow-hidden">
            <div class="absolute top-2 right-2 bg-yellow-400 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                FEE: R${group.joining_fee}
            </div>
            
            <h3 class="font-bold text-gray-800 text-lg">${group.group_name}</h3>
            <p class="text-xs text-gray-500 mb-4">Stock: ${group.items_description || group.products.name}</p>
            
            <div class="flex justify-between text-xs font-bold mb-1">
                <span class="text-blue-600">${memberCount} / ${group.min_spazas} Shops Joined</span>
                <span>${Math.round(progress)}%</span>
            </div>
            <div class="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                <div class="bg-blue-600 h-full transition-all" style="width: ${progress}%"></div>
            </div>

            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Stock Contribution:</span>
                    <span class="font-bold">R ${group.contribution_per_spaza}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Joining Fee:</span>
                    <span class="font-bold">R ${group.joining_fee}</span>
                </div>
                <div class="flex justify-between text-lg font-black pt-2 border-t text-green-700">
                    <span>Total Due:</span>
                    <span>R ${(parseFloat(group.contribution_per_spaza) + parseFloat(group.joining_fee)).toFixed(2)}</span>
                </div>
            </div>

            <button onclick="joinBulkWithFee('${group.id}', ${group.joining_fee}, ${group.contribution_per_spaza}, '${group.group_name}')" 
                class="w-full bg-blue-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all">
                JOIN THIS GROUP
            </button>
        </div>
    `}).join('');
}

// New function to handle the 10-spaza logic and fees
function joinBulkWithFee(groupId, fee, stock, name) {
    const total = parseFloat(fee) + parseFloat(stock);
    const user = JSON.parse(localStorage.getItem('spaza_user'));
    
    // Alert or Modal to confirm payment of joining fee
    if(confirm(`To join ${name}, you need to pay:\n\n1. Joining Fee: R${fee}\n2. Stock: R${stock}\n\nTotal: R${total}\n\nProceed to WhatsApp for payment instructions?`)) {
        
        let text = `*BULK GROUP JOIN REQUEST*\n`;
        text += `Group: ${name}\n`;
        text += `Store: ${user.store_name}\n`;
        text += `Total Due: R${total.toFixed(2)} (Incl. R${fee} Fee)`;
        
        window.open(`https://wa.me/27764403803?text=${encodeURIComponent(text)}`, '_blank');
    }
}
