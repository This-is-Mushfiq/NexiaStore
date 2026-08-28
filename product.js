import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('id');
const productWrapper = document.getElementById('productWrapper');

// Text safe escape helper (XSS প্রতিরোধে)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

async function loadSingleProduct() {
    if (!productWrapper) {
        console.error("HTML এ 'productWrapper' নামের কোনো Element পাওয়া যায়নি!");
        return;
    }

    if (!appId) {
        productWrapper.innerHTML = '<h2 style="text-align:center;">কোনো অ্যাপ নির্বাচন করা হয়নি!</h2>';
        return;
    }

    try {
        const docRef = doc(db, "apps", appId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            productWrapper.innerHTML = '<h2 style="text-align:center;">অ্যাপটি পাওয়া যায়নি!</h2>';
            return;
        }

        const app = docSnap.data();
        const appName = escapeHTML(app.name || 'App');
        const appCategory = escapeHTML(app.category || 'App');
        const appVersion = escapeHTML(app.version || '1.0');
        const appSize = escapeHTML(app.size || 'APK');
        const appDesc = escapeHTML(app.desc || 'No description provided.').replace(/\n/g, '<br>');

        document.title = `${appName} - NexiaStore`;

        productWrapper.innerHTML = `
            <div class="product-detail-card">
                <div class="product-header-flex">
                    <img src="${app.logo || 'placeholder.png'}" class="product-big-icon" alt="${appName}">
                    <div class="product-meta">
                        <h1>${appName}</h1>
                        <div class="meta-badges">
                            <span><i class="fa-solid fa-tag"></i> ${appCategory}</span>
                            <span><i class="fa-solid fa-code-branch"></i> v${appVersion}</span>
                            <span><i class="fa-solid fa-hard-drive"></i> ${appSize}</span>
                        </div>
                    </div>
                </div>

                <div class="product-desc">
                    <h3 style="color:var(--neon-cyan); margin-bottom:8px;"><i class="fa-solid fa-circle-info"></i> About this App</h3>
                    <p>${appDesc}</p>
                </div>

                <button id="downloadBtn" class="download-action-btn">
                    <i class="fa-solid fa-circle-down"></i> Download APK Now (${appSize})
                </button>
                <p id="downloadProgress" style="text-align:center; color:var(--neon-cyan); margin-top:10px; display:none;"></p>
            </div>
        `;

        // ডাউনলোড হ্যান্ডলার
        const btn = document.getElementById('downloadBtn');

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Starting Download...';
            
            let directUrl = app.apkUrl;
            if (!directUrl) {
                alert('ডাউনলোড লিঙ্ক পাওয়া যায়নি!');
                resetBtn(btn, appSize);
                return;
            }

            const cleanFileName = appName.trim().replace(/\s+/g, '_');
            const finalFileName = cleanFileName.endsWith('.apk') ? cleanFileName : `${cleanFileName}.apk`;

            // Gofile Link (Direct Redirect)
            if (directUrl.includes('gofile.io')) {
                window.open(directUrl, '_blank');
                resetBtn(btn, appSize);
                return;
            }

            // Dropbox Link Transform
            if (directUrl.includes('dropbox.com')) {
                directUrl = directUrl.replace('?dl=0', '?dl=1').replace('&dl=0', '&dl=1');
                if (!directUrl.includes('dl=1')) {
                    directUrl += (directUrl.includes('?') ? '&' : '?') + 'dl=1';
                }
            }

            try {
                // Fetch & Blob Download
                const response = await fetch(directUrl);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = finalFileName;
                
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(a);
                }, 100);

                btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Downloaded!';
                setTimeout(() => resetBtn(btn, appSize), 3000);

            } catch (err) {
                console.warn("CORS/Blob download fallback, opening direct link:", err);
                
                // Fallback Direct Download Link
                const link = document.createElement('a');
                link.href = directUrl;
                link.target = '_blank';
                link.setAttribute('download', finalFileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                resetBtn(btn, appSize);
            }
        });

    } catch (error) {
        console.error("Error loading product:", error);
        productWrapper.innerHTML = '<h2 style="text-align:center;">তথ্য লোড করতে সমস্যা হয়েছে!</h2>';
    }
}

// Button reset helper function
function resetBtn(btn, appSize) {
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-circle-down"></i> Download APK Now (${appSize})`;
    }
}

// Ensure DOM is ready before executing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSingleProduct);
} else {
    loadSingleProduct();
}
