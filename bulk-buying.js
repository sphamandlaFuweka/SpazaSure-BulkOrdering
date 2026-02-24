async function loadBulkGroups() {
    const { data: groups } = await _spazaClient.from('buying_groups').select('*, products(*), group_members(count)');
    const list = document.getElementById('bulk-groups-view');
    if (!groups) return;

    list.innerHTML = groups.map(group => {
        const spazaCount = group.group_members[0].count;
        const progress = Math.min((spazaCount / group.min_spazas) * 100, 100);
        const isComplete = spazaCount >= group.min_spazas;

        return `
        <div class="bg-white p-6 rounded-3xl shadow-md border-t-8 ${isComplete ? 'border-green-500' : 'border-blue-600'} transition-all">
            <div class="flex justify-between items-start mb-4">
                <h3 class="font-black text-gray-800 text-lg uppercase leading-tight">${group.group_name}</h3>
                <span class="text-[10px] font-black px-2 py-1 rounded-full ${isComplete ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} uppercase">
                    ${isComplete ? 'Ready' : 'Open'}
                </span>
            </div>
            
            <p class="text-xs text-gray-500 mb-4 font-bold uppercase tracking-tight">${group.items_description || 'Assorted Pallet'}</p>
            
            <div class="flex justify-between text-[10px] font-black mb-1 uppercase text-gray-400">
                <span>Progress: ${spazaCount} / ${group.min_spazas} Shops</span>
                <span>${Math.round(progress)}%</span>
            </div>
            <div class="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-6 border border-gray-100 shadow-inner">
                <div class="h-full ${isComplete ? 'bg-green-500' : 'bg-blue-600'} transition-all duration-1000" style="width: ${progress}%"></div>
            </div>

            <div class="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl mb-4 text-center">
                <div class="border-r border-gray-200">
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Join Fee</p>
                    <p class="text-sm font-black text-gray-700 text-lg">R${group.joining_fee}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Stock Due</p>
                    <p class="text-sm font-black text-green-600 text-lg">R${group.contribution_per_spaza}</p>
                </div>
            </div>

            <button onclick="confirmJoinGroup('${group.id}', ${group.joining_fee}, ${group.contribution_per_spaza}, '${group.group_name}')" 
                class="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Join Community Group
            </button>
        </div>
        `;
    }).join('');
}

async function confirmJoinGroup(groupId, fee, stock, name) {
    const user = JSON.parse(localStorage.getItem('spaza_user'));
    const total = parseFloat(fee) + parseFloat(stock);

    if(confirm(`JOIN ${name}?\n\nTotal Due: R${total.toFixed(2)}\n(Fee: R${fee} + Stock: R${stock})\n\nThis will send your request via WhatsApp.`)) {
        
        // WhatsApp Logic
        let text = `*BULK JOIN REQUEST*\n`;
        text += `Group: ${name}\n`;
        text += `Store: ${user.store_name}\n`;
        text += `Contact: ${user.whatsapp_number}\n`;
        text += `--------------------------\n`;
        text += `Total Commitment: R${total.toFixed(2)}\n\n`;
        text += `I am ready to pay the R${fee} joining fee. Please send bank details.`;

        window.open(`https://wa.me/27764403803?text=${encodeURIComponent(text)}`, '_blank');
        
        // Optional: Record the intent in DB (if you want to track before payment)
        await _spazaClient.from('group_members').insert([{
            group_id: groupId,
            profile_id: user.id, // Assuming profile ID is stored in user
            quantity_contributed: 1 
        }]);
    }
}
