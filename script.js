import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const mainAppGrid = document.getElementById('mainAppGrid');
const searchInput = document.getElementById('searchInput');
let allAppsData = [];

async function fetchApps() {
    try {
        const q = query(collection(db, "apps"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            mainAppGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">কোনো অ্যাপ পাওয়া যায়নি!</p>';
            return;
        }

        allAppsData = [];
        querySnapshot.forEach((doc) => {
            allAppsData.push({ id: doc.id, ...doc.data() });
        });

        renderApps(allAppsData);
    } catch (error) {
        console.error("Fetch Error:", error);
        mainAppGrid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1/-1;">অ্যাপ লোড করতে সমস্যা হয়েছে!</p>';
    }
}

function renderApps(apps) {
    mainAppGrid.innerHTML = '';
    apps.forEach(app => {
        const card = document.createElement('a');
        
        // './' সহ পাথ নির্ধারণ করা হয়েছে যাতে Render রিডাইরেক্টে ?id= নষ্ট না হয়
        card.href = `./product.html?id=${app.id}`;
        card.className = 'app-card';

        card.innerHTML = `
            <div class="app-card-header">
                <img src="${app.logo}" class="app-icon" alt="${app.name}">
                <div class="app-info">
                    <h3>${app.name}</h3>
                    <span>${app.category || 'App'}</span>
                </div>
            </div>
            <div class="btn-card-download"><i class="fa-solid fa-download"></i> Get App</div>
        `;
        mainAppGrid.appendChild(card);
    });
}

// Search Filter
searchInput?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allAppsData.filter(app => app.name.toLowerCase().includes(keyword));
    renderApps(filtered);
});

fetchApps();
