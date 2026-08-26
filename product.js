import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('id');
const productWrapper = document.getElementById('productWrapper');

async function loadSingleProduct() {
    if (!appId) {
        productWrapper.innerHTML = '<h2 style="text-align:center;">কোনো অ্যাপ নির্বাচন করা হয়নি!</h2>';
        return;
    }

    try {
        const docRef = doc(db, "apps", appId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const app = docSnap.data();
            document.title = `${app.name} - NexiaStore`;

            productWrapper.innerHTML = `
                <div class="product-detail-card">
                    <div class="product-header-flex">
                        <img src="${app.logo}" class="product-big-icon" alt="${app.name}">
                        <div class="product-meta">
                            <h1>${app.name}</h1>
                            <div class="meta-badges">
                                <span><i class="fa-solid fa-tag"></i> ${app.category || 'App'}</span>
                                <span><i class="fa-solid fa-code-branch"></i> v${app.version || '1.0'}</span>
                                <span><i class="fa-solid fa-hard-drive"></i> ${app.size || 'APK'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="product-desc">
                        <h3 style="color:var(--neon-cyan); margin-bottom:8px;"><i class="fa-solid fa-circle-info"></i> About this App</h3>
                        <p>${app.desc ? app.desc.replace(/\n/g, '<br>') : 'No description provided.'}</p>
                    </div>

                    <button id="downloadBtn" class="download-action-btn">
                        <i class="fa-solid fa-circle-down"></i> Download APK Now (${app.size || ''})
                    </button>
                    <p id="downloadProgress" style="text-align:center; color:var(--neon-cyan); margin-top:10px; display:none;"></p>
                </div>
            `;

            // ১-ক্লিকে ১০০% ডাইরেক্ট ফোর্স ডাউনলোডার
            const btn = document.getElementById('downloadBtn');
            const progress = document.getElementById('downloadProgress');

            btn.addEventListener('click', async () => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Starting Download...';
                
                try {
                    let directUrl = app.apkUrl;

                    // Gofile Link Transform
                    if (directUrl.includes('gofile.io/d/')) {
                        window.location.href = directUrl;
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-circle-down"></i> Download APK Now';
                        return;
                    }

                    // Dropbox Link Transform
                    if (directUrl.includes('dropbox.com')) {
                        directUrl = directUrl.replace('dl=0', 'dl=1');
                    }

                    // Blob দিয়ে Cloudinary ফাইল ডাউনলোড করে সঠিক .apk নামে সেভ করার লজিক
                    const response = await fetch(directUrl);
                    if (!response.ok) throw new Error('Network response was not ok');
                    
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = blobUrl;
                    
                    // ফাইলনেম শেষে ঠিকমতো .apk এক্সটেনশন যোগ করা
                    const cleanFileName = app.name.trim().replace(/\s+/g, '_');
                    a.download = cleanFileName.endsWith('.apk') ? cleanFileName : `${cleanFileName}.apk`;
                    
                    document.body.appendChild(a);
                    a.click();
                    
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(a);

                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Downloaded!';
                } catch (err) {
                    console.log("Blob download fallback, opening direct link", err);
                    
                    // Fallback Direct Link
                    const link = document.createElement('a');
                    link.href = app.apkUrl;
                    link.target = '_blank';
                    const cleanFileName = app.name.trim().replace(/\s+/g, '_');
                    link.setAttribute('download', cleanFileName.endsWith('.apk') ? cleanFileName : `${cleanFileName}.apk`);
                    link.click();

                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-circle-down"></i> Download APK Now';
                }
            });

        } else {
            productWrapper.innerHTML = '<h2 style="text-align:center;">অ্যাপটি পাওয়া যায়নি!</h2>';
        }
    } catch (error) {
        console.error("Error loading product:", error);
        productWrapper.innerHTML = '<h2 style="text-align:center;">তথ্য লোড করতে সমস্যা হয়েছে!</h2>';
    }
}

loadSingleProduct();