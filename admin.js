// Firebase Config & Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBlqe6nbmjfBv6B9K09Y9H5sL2j85E_crY",
    authDomain: "nexia-store.firebaseapp.com",
    projectId: "nexia-store",
    storageBucket: "nexia-store.firebasestorage.app",
    messagingSenderId: "703159032940",
    appId: "1:703159032940:web:4ad0cc5bca06e452f08c49",
    measurementId: "G-YENLL15GW2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cloudinary Configuration
const CLOUD_NAME = "qkyntaka";
const UPLOAD_PRESET = "unsigned_preset";

// PIN Lock Security Credentials
const ADMIN_PIN = "1234"; 

// Security Elements
const authModal = document.getElementById('authModal');
const pinInput = document.getElementById('pinInput');
const unlockBtn = document.getElementById('unlockBtn');
const authError = document.getElementById('authError');
const adminContent = document.getElementById('adminContent');

// PIN Authentication Event Listener
unlockBtn.addEventListener('click', () => {
    if (pinInput.value === ADMIN_PIN) {
        authModal.style.display = 'none';
        adminContent.style.display = 'block';
        loadAdminApps();
    } else {
        authError.style.display = 'block';
        pinInput.classList.add('error-shake');
        pinInput.value = '';
        pinInput.focus();
        setTimeout(() => pinInput.classList.remove('error-shake'), 500);
    }
});

pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        unlockBtn.click();
    }
});

const appForm = document.getElementById('appForm');
const uploadStatus = document.getElementById('uploadStatus');
const submitBtn = document.getElementById('submitBtn');
const adminAppList = document.getElementById('adminAppList');

// Helper function to format bytes to MB
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Updated Cloudinary Upload Function (Extensionless Bypass Trick Fixed)
async function uploadToCloudinary(file, resourceType = 'auto') {
    const formData = new FormData();

    // .apk ফাইলের ক্ষেত্রে Cloudinary Restricted Extension বাইপাস করতে এক্সটেনশন রিমুভ ট্রিক
    if (file.name.endsWith('.apk')) {
        resourceType = 'raw';
        const apkBlob = new Blob([file], { type: 'application/octet-stream' });
        // ফাইলনেম থেকে .apk এক্সটেনশন সরিয়ে নাম দেওয়া (যেমন: TicTacToe_app)
        const renamedFileName = file.name.replace(/\.apk$/i, '_app');
        formData.append('file', apkBlob, renamedFileName);
    } else {
        formData.append('file', file);
    }

    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Cloudinary Upload Failed.');
    }

    const data = await response.json();
    
    // কোনো ব্রোকেন fl_attachment ফ্লাগ ছাড়াই নিখুঁত secure_url রিটার্ন করবে
    return data.secure_url;
}

// Form Submit Event Handler
appForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const logoInput = document.getElementById('logoFile').files[0];
    const apkInput = document.getElementById('apkFile').files[0];
    const customSize = document.getElementById('appSize').value;

    submitBtn.disabled = true;
    uploadStatus.style.display = 'block';
    uploadStatus.style.color = 'var(--neon-cyan)';

    try {
        // Step 1: Upload Logo to Cloudinary (Image Type)
        uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Step 1/3: Uploading Logo to Cloudinary...`;
        const logoUrl = await uploadToCloudinary(logoInput, 'image');

        // Step 2: Upload APK to Cloudinary (Raw File Type)
        uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Step 2/3: Uploading APK File (Generating Direct Download Link)...`;
        const apkUrl = await uploadToCloudinary(apkInput, 'raw');

        // Step 3: Push Document to Firebase Firestore ('apps' Collection)
        uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Step 3/3: Saving App details to Firebase...`;
        const finalSize = customSize ? customSize : formatBytes(apkInput.size);

        await addDoc(collection(db, "apps"), {
            name: document.getElementById('appName').value,
            category: document.getElementById('appCategory').value,
            version: document.getElementById('appVersion').value,
            size: finalSize,
            logo: logoUrl,
            apkUrl: apkUrl,
            desc: document.getElementById('appDesc').value,
            createdAt: serverTimestamp()
        });

        uploadStatus.style.color = '#00f3ff';
        uploadStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Success! App published successfully!`;
        appForm.reset();
        loadAdminApps();

    } catch (error) {
        uploadStatus.style.color = '#ff0055';
        uploadStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error: ${error.message}`;
    } finally {
        submitBtn.disabled = false;
    }
});

// Load Published Apps for Admin Panel
async function loadAdminApps() {
    adminAppList.innerHTML = '<p>Loading apps...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        
        if (querySnapshot.empty) {
            adminAppList.innerHTML = '<p>No apps published yet.</p>';
            return;
        }

        adminAppList.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const appData = docSnap.data();
            const item = document.createElement('div');
            item.className = 'admin-app-item';
            item.innerHTML = `
                <div>
                    <strong>${appData.name}</strong> (v${appData.version})
                </div>
                <button class="delete-btn" onclick="deleteAppFromFirebase('${docSnap.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            `;
            adminAppList.appendChild(item);
        });
    } catch (err) {
        adminAppList.innerHTML = '<p>Error fetching data from Firestore.</p>';
    }
}

// Global Function to Delete App
window.deleteAppFromFirebase = async (docId) => {
    if (confirm('Are you sure you want to remove this app from store?')) {
        await deleteDoc(doc(db, "apps", docId));
        loadAdminApps();
    }
};