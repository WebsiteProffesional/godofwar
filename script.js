pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax//* Animation for Toast Notifications */
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

.toast {
    animation: slideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast.hiding {
    animation: fadeOut 0.3s forwards;
}

/* Feature Card Hover Effects */
.feature-card {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s ease;
    cursor: pointer;
}

.feature-card:hover {
    transform: translateY(-10px) scale(1.02);
    filter: brightness(1.2);
}

.icon-red { color: #ef4444; }

/* Auth Input Styling */
.auth-input {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 1rem;
    border-radius: 1rem;
    margin-bottom: 1rem;
    outline: none;
    transition: all 0.2s;
}

.auth-input:focus {
    border-color: #9333ea;
    box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}

.dark .auth-input {
    background: #0f172a;
    border-color: #334155;
    color: white;
}

/* View Transition */
.view-section { display: none; }
.view-active { display: block; animation: fadeIn 0.4s ease; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}/pdf.js/3.4.120/pdf.worker.min.js';

let pdfQueue = [];

// --- NOTIFICATION ENGINE ---
function notify(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = type === 'error' ? 'bg-red-500 border-red-600' : 
                   type === 'info' ? 'bg-slate-800 border-slate-700' : 
                   'bg-green-500 border-green-600';
    
    const icon = type === 'error' ? '⚠️' : type === 'info' ? 'ℹ️' : '✅';

    toast.className = `${colors} text-white px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 min-w-[300px] toast pointer-events-auto`;
    toast.innerHTML = `<span class="text-xl">${icon}</span><div class="font-bold text-sm">${message}</div>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// --- INITIALIZE APP ---
window.onload = function() {
    const activeUser = localStorage.getItem('activeUser');
    if (activeUser) {
        document.getElementById('user-display').innerText = activeUser;
        notify(`Welcome back, ${activeUser}`, 'success');
    }
}

// VIEW SWITCHER
function showView(id) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('view-active'));
    document.getElementById(id).classList.add('view-active');
}

function toggleTheme() { 
    document.documentElement.classList.toggle('dark'); 
    const isDark = document.documentElement.classList.contains('dark');
    notify(isDark ? "Dark Mode Enabled" : "Light Mode Enabled", "info");
}

// --- AUTH LOGIC ---
function handleAuth(type) {
    if (type === 'Registration') {
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const name = document.getElementById('reg-name').value;
        if (!email || !pass || !name) return notify("Please fill all fields", "error");
        
        localStorage.setItem(email, JSON.stringify({ email, pass, name }));
        notify("Account Created! Please Login.", "success");
        showView('login-view');
    } else {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const stored = localStorage.getItem(email);
        
        if (stored) {
            const user = JSON.parse(stored);
            if (user.pass === pass) {
                localStorage.setItem('activeUser', user.name);
                document.getElementById('user-display').innerText = user.name;
                notify("Login Successful!", "success");
                showView('tool-view');
            } else {
                notify("Incorrect Password!", "error");
            }
        } else {
            notify("User not found. Register first.", "error");
        }
    }
}

// --- PDF PROCESSING ---
const pdfInput = document.getElementById('pdf-input');
const queueList = document.getElementById('file-queue');
const runBtn = document.getElementById('run-btn');
const wmInputGlobal = document.getElementById('wm-input-global');
const pageNumCheck = document.getElementById('page-num-check');

pdfInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if(files.length > 0) notify(`${files.length} File(s) Added`, "info");
    for (const f of files) {
        const thumb = await generateThumb(f);
        pdfQueue.push({ file: f, rotation: 0, thumb: thumb });
    }
    renderQueue();
});

async function generateThumb(file) {
    const array = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: array }).promise;
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 0.2 });
    const canvas = document.createElement('canvas');
    canvas.height = vp.height; canvas.width = vp.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    return canvas.toDataURL();
}

function renderQueue() {
    queueList.innerHTML = '';
    pdfQueue.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700 flex gap-4 items-center";
        div.innerHTML = `
            <img src="${item.thumb}" class="w-12 h-16 rounded border" style="transform: rotate(${item.rotation}deg)">
            <div class="flex-grow truncate text-xs font-bold">${item.file.name}</div>
            
            <div class="flex gap-2">
                <button onclick="rotateItem(${idx})" class="p-2 hover:bg-purple-100 dark:hover:bg-slate-800 rounded transition" title="Rotate">🔄</button>
                <button onclick="splitItem(${idx})" class="p-2 hover:bg-purple-100 dark:hover:bg-slate-800 rounded transition" title="Split & Download Pages">✂️</button>
                <button onclick="removeItem(${idx})" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition" title="Remove">🗑️</button>
            </div>
        `;
        queueList.appendChild(div);
    });
}

window.rotateItem = (i) => { 
    pdfQueue[i].rotation = (pdfQueue[i].rotation + 90) % 360; 
    renderQueue(); 
    notify("Page Rotated 90°", "info");
};

window.removeItem = (i) => { 
    pdfQueue.splice(i, 1); 
    renderQueue(); 
    notify("File Removed", "error");
};

// --- NEW FEATURE: SPLIT PDF ---
window.splitItem = async (i) => {
    const item = pdfQueue[i];
    notify("Splitting PDF...", "info");
    
    const { PDFDocument } = PDFLib;
    const array = await item.file.arrayBuffer();
    const doc = await PDFDocument.load(array);
    const pageCount = doc.getPageCount();

    // Loop through every page and save it as a new file
    for (let k = 0; k < pageCount; k++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(doc, [k]);
        
        // Apply rotation if user rotated it in queue
        copiedPage.setRotation(doc.getPages()[k].getRotation() + (item.rotation || 0));
        
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save();
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        link.download = `${item.file.name}_Page_${k+1}.pdf`;
        link.click();
    }
    notify(`Extracted ${pageCount} pages!`, "success");
};

// --- MERGE & STAMP ENGINE ---
runBtn.onclick = async () => {
    if (pdfQueue.length === 0) return notify("Please add PDF files first!", "error");
    
    runBtn.innerText = "PROCESSING...";
    notify("Merging started...", "info");
    
    try {
        const { PDFDocument, StandardFonts, rgb, degrees } = PDFLib;
        const finalDoc = await PDFDocument.create();
        const font = await finalDoc.embedFont(StandardFonts.HelveticaBold);
        const wmText = wmInputGlobal.value;
        const addPageNums = pageNumCheck.checked;
        let globalPageCounter = 1;

        for (const item of pdfQueue) {
            const doc = await PDFDocument.load(await item.file.arrayBuffer());
            const pages = await finalDoc.copyPages(doc, doc.getPageIndices());
            
            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.setRotation(degrees(item.rotation));
                
                // WATERMARK
                if (wmText.trim()) {
                    page.drawText(wmText, { 
                        x: width/4, y: height/2, 
                        size: 50, font, 
                        color: rgb(0.7,0.7,0.7), opacity: 0.4, 
                        rotate: degrees(45) 
                    });
                }

                // PAGE NUMBERS (Centered at bottom)
                if (addPageNums) {
                    page.drawText(String(globalPageCounter), {
                        x: width / 2,
                        y: 20,
                        size: 12,
                        font: font,
                        color: rgb(0, 0, 0),
                    });
                    globalPageCounter++;
                }

                finalDoc.addPage(page);
            });
        }
        
        const bytes = await finalDoc.save();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        link.download = "FastPDF_Merged.pdf";
        link.click();
        
        runBtn.innerText = "MERGE PDFS";
        notify("Download Ready! Job Complete.", "success");
    } catch (e) {
        notify("Engine Error: " + e.message, "error");
        runBtn.innerText = "MERGE PDFS";
    }
};