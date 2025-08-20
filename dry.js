// Database variables
let db;
const DB_NAME = 'VehicleRecordsDB';
const DB_VERSION = 3; // Increased version for updates

// Object store names
const STORES = {
    COMPANIES: 'companies',
    VEHICLES: 'vehicles',
    NOTES: 'notes',
    IMAGES: 'images'
};

// DOM Elements
const companiesPage = document.getElementById('companies-page');
const companyPage = document.getElementById('company-page');
const vehiclePage = document.getElementById('vehicle-page');
const vehicleFormPage = document.getElementById('vehicle-form-page');
const alertMessage = document.getElementById('alert-message');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');
const companiesList = document.getElementById('companies-list');
const addCompanyBtn = document.getElementById('add-company-btn');
const backToCompaniesBtn = document.getElementById('back-to-companies');
const globalSearch = document.getElementById('global-search');
const exportCompanyBtn = document.getElementById('export-company-btn');
const importDataBtn = document.getElementById('import-data-btn');
const companyNameTitle = document.getElementById('company-name-title');
const addVehicleBtn = document.getElementById('add-vehicle-btn');
const backToCompanyBtn = document.getElementById('back-to-company');
const companyVehicleSearch = document.getElementById('company-vehicle-search');
const vehiclesTableBody = document.getElementById('vehicles-table-body');
const noVehicles = document.getElementById('no-vehicles');
const vehicleLicenseNumber = document.getElementById('vehicle-license-number');
const vehicleExpiryDate = document.getElementById('vehicle-expiry-date');
const vehicleCalibrationDate = document.getElementById('vehicle-calibration-date');
const vehicleStatus = document.getElementById('vehicle-status');
const vehicleImages = document.getElementById('vehicle-images');
const noImages = document.getElementById('no-images');
const vehicleNotes = document.getElementById('vehicle-notes');
const newNote = document.getElementById('new-note');
const addNoteBtn = document.getElementById('add-note-btn');
const editVehicleBtn = document.getElementById('edit-vehicle-btn');
const deleteVehicleBtn = document.getElementById('delete-vehicle-btn');
const backFromFormBtn = document.getElementById('back-from-form');
const formTitle = document.getElementById('form-title');
const vehicleForm = document.getElementById('vehicle-form');
const vehicleIdInput = document.getElementById('vehicle-id');
const companyIdInput = document.getElementById('company-id');
const licenseNumberInput = document.getElementById('license-number');
const expiryDateInput = document.getElementById('expiry-date');
const calibrationDateInput = document.getElementById('calibration-date');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const cancelFormBtn = document.getElementById('cancel-form');
const addCompanyModal = document.getElementById('add-company-modal');
const editCompanyModal = document.getElementById('edit-company-modal');
const deleteModal = document.getElementById('delete-modal');
const exportModal = document.getElementById('export-modal');
const importModal = document.getElementById('import-modal');
const lightbox = document.getElementById('lightbox');
const activeCount = document.getElementById('active-count');
const expiringCount = document.getElementById('expiring-count');
const expiredCount = document.getElementById('expired-count');
const activeStat = document.getElementById('active-stat');
const expiringStat = document.getElementById('expiring-stat');
const expiredStat = document.getElementById('expired-stat');
const filterButtons = document.querySelectorAll('.filter-btn');

// State variables
let currentCompanyId = null;
let currentVehicleId = null;
let selectedFiles = [];
let currentLightboxIndex = 0;
let currentFilter = 'all';
let currentSearchTerm = '';
let currentImages = [];
let allVehicles = [];
let existingImages = [];

// Initialize the app and database
function init() {
    setupEventListeners();
    openDatabase();
}

// Show toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast toast-${type}`;
    
    let iconClass;
    switch(type) {
        case 'success': iconClass = 'fa-check-circle'; break;
        case 'error': iconClass = 'fa-exclamation-circle'; break;
        case 'warning': iconClass = 'fa-exclamation-triangle'; break;
        default: iconClass = 'fa-info-circle';
    }
    
    toastIcon.className = `fas ${iconClass}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show alert message
function showAlert(message, type = 'success') {
    alertMessage.textContent = message;
    alertMessage.className = `alert alert-${type}`;
    alertMessage.style.display = 'block';
    
    setTimeout(() => {
        alertMessage.style.display = 'none';
    }, 5000);
}

// Open or create IndexedDB database
function openDatabase() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = function(event) {
        console.error('فشل فتح قاعدة البيانات', event.target.error);
        showToast('حدث خطأ في فتح قاعدة البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى.', 'error');
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        renderCompanies();
        loadAllVehicles();
    };
    
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORES.COMPANIES)) {
            const companiesStore = db.createObjectStore(STORES.COMPANIES, { keyPath: 'id' });
            companiesStore.createIndex('name', 'name', { unique: true });
        }
        
        if (!db.objectStoreNames.contains(STORES.VEHICLES)) {
            const vehiclesStore = db.createObjectStore(STORES.VEHICLES, { keyPath: 'id' });
            vehiclesStore.createIndex('companyId', 'companyId', { unique: false });
            vehiclesStore.createIndex('licenseNumber', 'licenseNumber', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
            const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
            notesStore.createIndex('vehicleId', 'vehicleId', { unique: false });
            notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
            const imagesStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
            imagesStore.createIndex('vehicleId', 'vehicleId', { unique: false });
        }
    };
}

// Load all vehicles for global search
function loadAllVehicles() {
    getAllVehicles().then(vehicles => {
        allVehicles = vehicles;
    }).catch(error => {
        console.error('Error loading all vehicles:', error);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Export/Import buttons
    exportCompanyBtn.addEventListener('click', () => showExportModal('current-company'));
    importDataBtn.addEventListener('click', showImportModal);
    
    // Global search
    globalSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        if (searchTerm.length > 2) searchVehicleGlobally(searchTerm);
    });
    
    // Company vehicle search
    companyVehicleSearch.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.trim().toLowerCase();
        renderCompanyVehicles(currentCompanyId);
    });
    
    // Company modals
    document.querySelector('#add-company-modal .close').addEventListener('click', () => {
        addCompanyModal.style.display = 'none';
    });
    document.querySelector('#edit-company-modal .close').addEventListener('click', () => {
        editCompanyModal.style.display = 'none';
    });
    document.querySelector('#delete-modal .close').addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });
    document.querySelector('#export-modal .close').addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    document.querySelector('#import-modal .close').addEventListener('click', () => {
        importModal.style.display = 'none';
    });
    document.querySelector('#lightbox .lightbox-close').addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
    
    document.getElementById('save-company').addEventListener('click', saveCompany);
    document.getElementById('cancel-company').addEventListener('click', () => {
        addCompanyModal.style.display = 'none';
    });
    document.getElementById('update-company').addEventListener('click', updateCompany);
    document.getElementById('cancel-edit-company').addEventListener('click', () => {
        editCompanyModal.style.display = 'none';
    });
    document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
    document.getElementById('cancel-delete').addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });
    document.getElementById('close-export').addEventListener('click', () => {
        exportModal.style.display = 'none';
    });
    document.getElementById('cancel-import').addEventListener('click', () => {
        importModal.style.display = 'none';
    });
    
    // Export/Import functions
    document.getElementById('generate-export').addEventListener('click', generateExport);
    document.getElementById('download-export').addEventListener('click', downloadExport);
    document.getElementById('import-file').addEventListener('change', handleImportFile);
    document.getElementById('confirm-import').addEventListener('click', confirmImport);
    
    // Vehicle form
    addVehicleBtn.addEventListener('click', () => {
        showVehicleFormPage(null, currentCompanyId);
    });
    vehicleForm.addEventListener('submit', handleVehicleFormSubmit);
    editVehicleBtn.addEventListener('click', () => {
        showVehicleFormPage(currentVehicleId, currentCompanyId);
    });
    deleteVehicleBtn.addEventListener('click', () => {
        showDeleteModal('vehicle', currentVehicleId, 'هل أنت متأكد أنك تريد حذف هذه المركبة؟ سيتم حذف جميع الصور والملاحظات المرتبطة بها.');
    });
    
    // Notes
    addNoteBtn.addEventListener('click', addNote);
    
    // Image handling
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('active');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('active');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });
    
    // Lightbox navigation
    document.getElementById('prev-image').addEventListener('click', showPrevImage);
    document.getElementById('next-image').addEventListener('click', showNextImage);
    
    // Search and filter
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderCompanyVehicles(currentCompanyId);
        });
    });
    
    // Stats cards as filters
    activeStat.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="active"]').classList.add('active');
        currentFilter = 'active';
        renderCompanyVehicles(currentCompanyId);
    });
    
    expiringStat.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="expiring"]').classList.add('active');
        currentFilter = 'expiring';
        renderCompanyVehicles(currentCompanyId);
    });
    
    expiredStat.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="expired"]').classList.add('active');
        currentFilter = 'expired';
        renderCompanyVehicles(currentCompanyId);
    });
}

// Show export modal
function showExportModal(type) {
    // تحديث خيارات التصدير لتحتوي فقط على الشركة الحالية
    document.getElementById('export-type').innerHTML = '<option value="current-company">الشركة الحالية مع مركباتها</option>';
    document.getElementById('export-result').style.display = 'none';
    exportModal.style.display = 'block';
}

// Generate export data
function generateExport() {
    const exportType = document.getElementById('export-type').value;
    const generateBtn = document.getElementById('generate-export');
    const originalText = generateBtn.innerHTML;
    
    generateBtn.innerHTML = '<div class="spinner"></div> جاري التصدير...';
    generateBtn.disabled = true;
    
    if (exportType === 'current-company' && currentCompanyId) {
        exportCompanyData(currentCompanyId).then(data => {
            const exportData = document.getElementById('export-data');
            exportData.value = JSON.stringify(data, null, 2);
            document.getElementById('export-result').style.display = 'block';
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }).catch(error => {
            console.error('Error exporting company data:', error);
            showToast('حدث خطأ أثناء تصدير بيانات الشركة', 'error');
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        });
    } else {
        showToast('الرجاء تحديد شركة أولاً', 'error');
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// Download export file
function downloadExport() {
    const data = document.getElementById('export-data').value;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let filename = `company-${currentCompanyId}-export`;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('تم تنزيل ملف التصدير بنجاح', 'success');
}

// Show import modal
function showImportModal() {
    document.getElementById('import-file').value = '';
    document.getElementById('import-overwrite').checked = false;
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('confirm-import').disabled = true;
    importModal.style.display = 'block';
}

// Handle import file selection
function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            document.getElementById('import-preview-content').innerHTML = `
                <p><strong>الشركات:</strong> ${data.companies ? data.companies.length : 0}</p>
                <p><strong>المركبات:</strong> ${data.vehicles ? data.vehicles.length : 0}</p>
                <p><strong>الملاحظات:</strong> ${data.notes ? data.notes.length : 0}</p>
                <p><strong>الصور:</strong> ${data.images ? data.images.length : 0}</p>
            `;
            document.getElementById('import-preview').style.display = 'block';
            document.getElementById('confirm-import').disabled = false;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            showToast('ملف غير صالح. الرجاء اختيار ملف JSON صحيح.', 'error');
            document.getElementById('import-preview').style.display = 'none';
            document.getElementById('confirm-import').disabled = true;
        }
    };
    reader.readAsText(file);
}

// Confirm import
function confirmImport() {
    const file = document.getElementById('import-file').files[0];
    const overwrite = document.getElementById('import-overwrite').checked;
    const confirmBtn = document.getElementById('confirm-import');
    const originalText = confirmBtn.innerHTML;
    
    confirmBtn.innerHTML = '<div class="spinner"></div> جاري الاستيراد...';
    confirmBtn.disabled = true;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            importData(data, overwrite).then(() => {
                showToast('تم استيراد البيانات بنجاح', 'success');
                renderCompanies();
                if (currentCompanyId) {
                    renderCompanyVehicles(currentCompanyId);
                }
                importModal.style.display = 'none';
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            }).catch(error => {
                console.error('Error importing data:', error);
                showToast('حدث خطأ أثناء استيراد البيانات', 'error');
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            showToast('ملف غير صالح. الرجاء اختيار ملف JSON صحيح.', 'error');
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    };
    reader.readAsText(file);
}

// Export company data
function exportCompanyData(companyId) {
    return new Promise((resolve, reject) => {
        Promise.all([
            getCompany(companyId),
            getVehiclesByCompany(companyId)
        ]).then(([company, vehicles]) => {
            if (!company) {
                reject(new Error('Company not found'));
                return;
            }
            
            const vehicleIds = vehicles.map(v => v.id);
            
            Promise.all([
                getNotesForVehicles(vehicleIds),
                getImagesForVehicles(vehicleIds)
            ]).then(([notes, images]) => {
                resolve({
                    company,
                    vehicles,
                    notes,
                    images
                });
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
}

// Import data
function importData(data, overwrite = false) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([
            STORES.COMPANIES, 
            STORES.VEHICLES, 
            STORES.NOTES, 
            STORES.IMAGES
        ], 'readwrite');
        
        const companiesStore = transaction.objectStore(STORES.COMPANIES);
        const vehiclesStore = transaction.objectStore(STORES.VEHICLES);
        const notesStore = transaction.objectStore(STORES.NOTES);
        const imagesStore = transaction.objectStore(STORES.IMAGES);
        
        // Clear existing data if overwrite is true
        if (overwrite) {
            companiesStore.clear();
            vehiclesStore.clear();
            notesStore.clear();
            imagesStore.clear();
        }
        
        // Import companies
        if (data.companies && data.companies.length > 0) {
            data.companies.forEach(company => {
                companiesStore.put(company);
            });
        }
        
        // Import vehicles
        if (data.vehicles && data.vehicles.length > 0) {
            data.vehicles.forEach(vehicle => {
                vehiclesStore.put(vehicle);
            });
        }
        
        // Import notes
        if (data.notes && data.notes.length > 0) {
            data.notes.forEach(note => {
                notesStore.put(note);
            });
        }
        
        // Import images
        if (data.images && data.images.length > 0) {
            data.images.forEach(image => {
                imagesStore.put(image);
            });
        }
        
        transaction.oncomplete = () => {
            resolve();
        };
        
        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Search vehicle globally
function searchVehicleGlobally(searchTerm) {
    const matchedVehicles = allVehicles.filter(v => 
        v.licenseNumber.toLowerCase().includes(searchTerm)
    );
    
    if (matchedVehicles.length > 0) {
        const vehicle = matchedVehicles[0];
        
        getCompany(vehicle.companyId).then(company => {
            if (company) {
                showCompanyPage(vehicle.companyId);
                
                setTimeout(() => {
                    highlightVehicleInTable(vehicle.id);
                }, 300);
                
                showToast(`تم العثور على ${matchedVehicles.length} نتيجة`, 'success');
            }
        }).catch(error => {
            console.error('Error getting company:', error);
            showToast('حدث خطأ أثناء البحث', 'error');
        });
    } else {
        showToast('لا توجد نتائج مطابقة للبحث', 'warning');
    }
}

// Highlight vehicle in table
function highlightVehicleInTable(vehicleId) {
    document.querySelectorAll('#vehicles-table-body tr').forEach(row => {
        row.classList.remove('highlight');
    });
    
    const row = document.querySelector(`#vehicles-table-body tr[data-vehicle-id="${vehicleId}"]`);
    if (row) {
        row.classList.add('highlight');
        
        row.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Render companies list
function renderCompanies() {
    getAllCompanies().then(companies => {
        companiesList.innerHTML = '';
        
        if (companies.length === 0) {
            companiesList.innerHTML = '<div class="no-data">لا توجد شركات مسجلة</div>';
            return;
        }
        
        companies.sort((a, b) => a.name.localeCompare(b.name)).forEach(company => {
            const companyCard = document.createElement('div');
            companyCard.className = 'company-card';
            companyCard.innerHTML = `
                <div class="company-name">${company.name}</div>
                <div class="company-actions">
                    <button class="btn btn-primary btn-sm view-company" data-id="${company.id}">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn btn-primary btn-sm edit-company" data-id="${company.id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-danger btn-sm delete-company" data-id="${company.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            `;
            companiesList.appendChild(companyCard);
        });
        
        // Add event listeners to company buttons
        document.querySelectorAll('.view-company').forEach(btn => {
            btn.addEventListener('click', () => showCompanyPage(btn.dataset.id));
        });
        document.querySelectorAll('.edit-company').forEach(btn => {
            btn.addEventListener('click', () => showEditCompanyModal(btn.dataset.id));
        });
        document.querySelectorAll('.delete-company').forEach(btn => {
            btn.addEventListener('click', () => showDeleteModal('company', btn.dataset.id, 'هل أنت متأكد أنك تريد حذف هذه الشركة وجميع مركباتها؟ سيتم حذف جميع البيانات المرتبطة بهذه الشركة.'));
        });
    }).catch(error => {
        console.error('Error rendering companies:', error);
        showToast('حدث خطأ أثناء تحميل بيانات الشركات', 'error');
    });
}

// Show companies page
function showCompaniesPage() {
    companiesPage.style.display = 'block';
    companyPage.style.display = 'none';
    vehiclePage.style.display = 'none';
    vehicleFormPage.style.display = 'none';
    currentCompanyId = null;
    currentVehicleId = null;
    renderCompanies();
}

// Show company page
function showCompanyPage(companyId) {
    currentCompanyId = companyId;
    currentVehicleId = null;
    
    getCompany(companyId).then(company => {
        if (!company) {
            showCompaniesPage();
            return;
        }
        
        companyNameTitle.textContent = company.name;
        
        companiesPage.style.display = 'none';
        companyPage.style.display = 'block';
        vehiclePage.style.display = 'none';
        vehicleFormPage.style.display = 'none';
        
        renderCompanyVehicles(companyId);
    }).catch(error => {
        console.error('Error showing company page:', error);
        showToast('حدث خطأ أثناء تحميل بيانات الشركة', 'error');
    });
}

// Render company vehicles
function renderCompanyVehicles(companyId) {
    getVehiclesByCompany(companyId).then(companyVehicles => {
        // Filter by search term
        let filteredVehicles = companyVehicles;
        if (currentSearchTerm) {
            filteredVehicles = filteredVehicles.filter(v => 
                v.licenseNumber.toLowerCase().includes(currentSearchTerm)
            );
        }
        
        // Filter by status
        if (currentFilter !== 'all') {
            filteredVehicles = filteredVehicles.filter(v => getLicenseStatus(v) === currentFilter);
        }
        
        // Update stats
        updateVehicleStats(companyVehicles);
        
        // Render table
        vehiclesTableBody.innerHTML = '';
        
        if (filteredVehicles.length === 0) {
            noVehicles.style.display = 'block';
            return;
        }
        
        noVehicles.style.display = 'none';
        
        filteredVehicles.forEach((vehicle, index) => {
            const status = getLicenseStatus(vehicle);
            let statusBadge = '';
            
            if (status === 'active') {
                statusBadge = '<span class="status-badge status-active"><i class="fas fa-check-circle"></i> نشطة</span>';
            } else if (status === 'expiring') {
                statusBadge = '<span class="status-badge status-expiring"><i class="fas fa-exclamation-triangle"></i> قريبة من الانتهاء</span>';
            } else {
                statusBadge = '<span class="status-badge status-expired"><i class="fas fa-times-circle"></i> منتهية</span>';
            }
            
            const expiryDate = vehicle.expiryDate || 'غير محدد';
            const calibrationDate = vehicle.calibrationDate || 'غير محدد';
            
            const row = document.createElement('tr');
            row.dataset.vehicleId = vehicle.id;
            row.innerHTML = `
                <td class="serial-number">${index + 1}</td>
                <td>${vehicle.licenseNumber}</td>
                <td>${expiryDate}</td>
                <td>${calibrationDate</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-primary btn-sm view-vehicle" data-id="${vehicle.id}">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                </td>
            `;
            vehiclesTableBody.appendChild(row);
        });
        
        // Add event listeners to vehicle buttons
        document.querySelectorAll('.view-vehicle').forEach(btn => {
            btn.addEventListener('click', () => showVehiclePage(btn.dataset.id));
        });
    }).catch(error => {
        console.error('Error rendering company vehicles:', error);
        showToast('حدث خطأ أثناء تحميل بيانات المركبات', 'error');
    });
}

// Update vehicle stats
function updateVehicleStats(companyVehicles) {
    let active = 0, expiring = 0, expired = 0;
    
    companyVehicles.forEach(vehicle => {
        const status = getLicenseStatus(vehicle);
        if (status === 'active') active++;
        else if (status === 'expiring') expiring++;
        else expired++;
    });
    
    activeCount.textContent = active;
    expiringCount.textContent = expiring;
    expiredCount.textContent = expired;
}

// Show vehicle page
function showVehiclePage(vehicleId) {
    currentVehicleId = vehicleId;
    
    getVehicle(vehicleId).then(vehicle => {
        if (!vehicle) {
            if (currentCompanyId) showCompanyPage(currentCompanyId);
            else showCompaniesPage();
            return;
        }
        
        // Set current company ID from vehicle data
        currentCompanyId = vehicle.companyId;
        
        // Set vehicle details
        vehicleLicenseNumber.textContent = vehicle.licenseNumber;
        vehicleExpiryDate.textContent = vehicle.expiryDate || 'غير محدد';
        vehicleCalibrationDate.textContent = vehicle.calibrationDate || 'غير محدد';
        
        // Set status
        const status = getLicenseStatus(vehicle);
        if (status === 'active') {
            vehicleStatus.innerHTML = '<span class="status-badge status-active"><i class="fas fa-check-circle"></i> نشطة</span>';
        } else if (status === 'expiring') {
            vehicleStatus.innerHTML = '<span class="status-badge status-expiring"><i class="fas fa-exclamation-triangle"></i> قريبة من الانتهاء</span>';
        } else {
            vehicleStatus.innerHTML = '<span class="status-badge status-expired"><i class="fas fa-times-circle"></i> منتهية</span>';
        }
        
        // Render images
        renderVehicleImages(vehicleId);
        
        // Render notes
        renderVehicleNotes(vehicleId);
        
        companiesPage.style.display = 'none';
        companyPage.style.display = 'none';
        vehiclePage.style.display = 'block';
        vehicleFormPage.style.display = 'none';
    }).catch(error => {
        console.error('Error showing vehicle page:', error);
        showToast('حدث خطأ أثناء تحميل بيانات المركبة', 'error');
    });
}

// Render vehicle images
function renderVehicleImages(vehicleId) {
    getVehicleImages(vehicleId).then(vehicleImagesData => {
        vehicleImages.innerHTML = '';
        currentImages = vehicleImagesData;
        
        if (vehicleImagesData.length === 0) {
            noImages.style.display = 'block';
            return;
        }
        
        noImages.style.display = 'none';
        
        vehicleImagesData.forEach((img, index) => {
            const imgElement = document.createElement('div');
            imgElement.className = 'gallery-item';
            imgElement.innerHTML = `
                <img src="${img.data}" alt="صورة الرخصة" data-index="${index}">
            `;
            vehicleImages.appendChild(imgElement);
        });
        
        // Add click event to images
        document.querySelectorAll('#vehicle-images img').forEach(img => {
            img.addEventListener('click', () => showLightbox(vehicleImagesData, parseInt(img.dataset.index)));
        });
    }).catch(error => {
        console.error('Error rendering vehicle images:', error);
        showToast('حدث خطأ أثناء تحميل صور المركبة', 'error');
    });
}

// Render vehicle notes
function renderVehicleNotes(vehicleId) {
    getVehicleNotes(vehicleId).then(vehicleNotesData => {
        vehicleNotes.innerHTML = '';
        
        if (vehicleNotesData.length === 0) {
            vehicleNotes.innerHTML = '<div class="no-data">لا توجد ملاحظات</div>';
            return;
        }
        
        vehicleNotesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `
                <div class="note-header">
                    <span>${formatDateTime(note.createdAt)}</span>
                    <span class="note-delete" data-id="${note.id}">
                        <i class="fas fa-trash"></i> حذف
                    </span>
                </div>
                <div class="note-content">${note.content}</div>
            `;
            vehicleNotes.appendChild(noteElement);
        });
        
        // Add delete event to note delete buttons
        document.querySelectorAll('.note-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                showDeleteModal('note', btn.dataset.id, 'هل أنت متأكد أنك تريد حذف هذه الملاحظة؟');
            });
        });
    }).catch(error => {
        console.error('Error rendering vehicle notes:', error);
        showToast('حدث خطأ أثناء تحميل ملاحظات المركبة', 'error');
    });
}

// Show vehicle form page
function showVehicleFormPage(vehicleId, companyId) {
    currentVehicleId = vehicleId;
    currentCompanyId = companyId;
    companyIdInput.value = companyId;
    
    // Reset form
    vehicleForm.reset();
    imagePreview.innerHTML = '';
    selectedFiles = [];
    existingImages = [];
    
    if (vehicleId) {
        // Edit mode
        formTitle.textContent = 'تعديل المركبة';
        vehicleIdInput.value = vehicleId;
        
        getVehicle(vehicleId).then(vehicle => {
            if (vehicle) {
                licenseNumberInput.value = vehicle.licenseNumber;
                expiryDateInput.value = vehicle.expiryDate || '';
                calibrationDateInput.value = vehicle.calibrationDate || '';
                
                // Load existing images
                getVehicleImages(vehicleId).then(vehicleImagesData => {
                    vehicleImagesData.forEach(img => {
                        existingImages.push(img);
                        addImageToPreview(img.data, img.id);
                    });
                }).catch(error => {
                    console.error('Error loading vehicle images:', error);
                    showToast('حدث خطأ أثناء تحميل صور المركبة', 'error');
                });
            }
        }).catch(error => {
            console.error('Error loading vehicle:', error);
            showToast('حدث خطأ أثناء تحميل بيانات المركبة', 'error');
        });
    } else {
        // Add mode
        formTitle.textContent = 'إضافة مركبة جديدة';
        vehicleIdInput.value = '';
    }
    
    companiesPage.style.display = 'none';
    companyPage.style.display = 'none';
    vehiclePage.style.display = 'none';
    vehicleFormPage.style.display = 'block';
}

// Handle vehicle form submission
function handleVehicleFormSubmit(e) {
    e.preventDefault();
    
    const licenseNumber = licenseNumberInput.value.trim();
    const expiryDate = expiryDateInput.value.trim();
    
    if (!licenseNumber || !expiryDate) {
        showToast('الرجاء إدخال جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // Validate date format (dd/mm/yyyy)
    if (!isValidDate(expiryDate)) {
        showToast('الرجاء إدخال تاريخ انتهاء الرخصة بصيغة صحيحة (يوم/شهر/سنة)', 'error');
        return;
    }
    
    const vehicleData = {
        licenseNumber,
        expiryDate,
        companyId: companyIdInput.value,
        calibrationDate: calibrationDateInput.value.trim() || null
    };
    
    if (calibrationDateInput.value.trim() && !isValidDate(calibrationDateInput.value.trim())) {
        showToast('الرجاء إدخال تاريخ انتهاء العيار بصيغة صحيحة (يوم/شهر/سنة)', 'error');
        return;
    }
    
    const submitBtn = vehicleForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner"></div> جاري الحفظ...';
    submitBtn.disabled = true;
    
    if (currentVehicleId) {
        // Update existing vehicle
        vehicleData.id = currentVehicleId;
        updateVehicle(vehicleData).then(() => {
            showToast('تم تحديث بيانات المركبة بنجاح', 'success');
            showVehiclePage(currentVehicleId);
        }).catch(error => {
            console.error('Error updating vehicle:', error);
            showToast('حدث خطأ أثناء تحديث بيانات المركبة', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    } else {
        // Add new vehicle
        addVehicle(vehicleData).then(() => {
            showToast('تم إضافة المركبة بنجاح', 'success');
            showCompanyPage(currentCompanyId);
        }).catch(error => {
            console.error('Error adding vehicle:', error);
            showToast('حدث خطأ أثناء إضافة المركبة', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
}

// Validate date format (dd/mm/yyyy)
function isValidDate(dateString) {
    const regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;
    
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;
    
    const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Adjust for leap years
    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
        monthLength[1] = 29;
    }
    
    return day > 0 && day <= monthLength[month - 1];
}

// Show add company modal
function showAddCompanyModal() {
    document.getElementById('company-name').value = '';
    addCompanyModal.style.display = 'block';
}

// Show edit company modal
function showEditCompanyModal(companyId) {
    getCompany(companyId).then(company => {
        if (company) {
            document.getElementById('edit-company-id').value = companyId;
            document.getElementById('edit-company-name').value = company.name;
            editCompanyModal.style.display = 'block';
        }
    }).catch(error => {
        console.error('Error loading company for edit:', error);
        showToast('حدث خطأ أثناء تحميل بيانات الشركة', 'error');
    });
}

// Show delete confirmation modal
function showDeleteModal(type, id, message) {
    document.getElementById('delete-modal-title').textContent = 'تأكيد الحذف';
    document.getElementById('delete-modal-message').textContent = message;
    document.getElementById('confirm-delete').dataset.type = type;
    document.getElementById('confirm-delete').dataset.id = id;
    deleteModal.style.display = 'block';
}

// Confirm delete action
function confirmDelete() {
    const type = this.dataset.type;
    const id = this.dataset.id;
    const deleteBtn = this;
    const originalText = deleteBtn.innerHTML;
    
    deleteBtn.innerHTML = '<div class="spinner"></div> جاري الحذف...';
    deleteBtn.disabled = true;
    
    if (type === 'company') {
        deleteCompany(id).then(() => {
            showToast('تم حذف الشركة بنجاح', 'success');
            showCompaniesPage();
        }).catch(error => {
            console.error('Error deleting company:', error);
            showToast('حدث خطأ أثناء حذف الشركة', 'error');
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
        });
    } else if (type === 'vehicle') {
        deleteVehicle(id).then(() => {
            showToast('تم حذف المركبة بنجاح', 'success');
            showCompanyPage(currentCompanyId);
        }).catch(error => {
            console.error('Error deleting vehicle:', error);
            showToast('حدث خطأ أثناء حذف المركبة', 'error');
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
        });
    } else if (type === 'note') {
        deleteNote(id).then(() => {
            showToast('تم حذف الملاحظة بنجاح', 'success');
            renderVehicleNotes(currentVehicleId);
        }).catch(error => {
            console.error('Error deleting note:', error);
            showToast('حدث خطأ أثناء حذف الملاحظة', 'error');
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
        });
    }
    
    deleteModal.style.display = 'none';
}

// Save new company
function saveCompany() {
    const name = document.getElementById('company-name').value.trim();
    
    if (!name) {
        showToast('الرجاء إدخال اسم الشركة', 'error');
        return;
    }
    
    const newCompany = {
        id: generateId(),
        name
    };
    
    const saveBtn = document.getElementById('save-company');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="spinner"></div> جاري الحفظ...';
    saveBtn.disabled = true;
    
    addCompany(newCompany).then(() => {
        addCompanyModal.style.display = 'none';
        showToast('تم إضافة الشركة بنجاح', 'success');
        renderCompanies();
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }).catch(error => {
        if (error.name === 'ConstraintError') {
            showToast('اسم الشركة موجود بالفعل', 'error');
        } else {
            console.error('Error adding company:', error);
            showToast('حدث خطأ أثناء إضافة الشركة', 'error');
        }
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

// Update company
function updateCompany() {
    const id = document.getElementById('edit-company-id').value;
    const name = document.getElementById('edit-company-name').value.trim();
    
    if (!name) {
        showToast('الرجاء إدخال اسم الشركة', 'error');
        return;
    }
    
    const company = {
        id,
        name
    };
    
    const updateBtn = document.getElementById('update-company');
    const originalText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<div class="spinner"></div> جاري التحديث...';
    updateBtn.disabled = true;
    
    updateCompanyData(company).then(() => {
        editCompanyModal.style.display = 'none';
        showToast('تم تحديث بيانات الشركة بنجاح', 'success');
        renderCompanies();
        
        // If we're on the company page, update the title
        if (currentCompanyId === id) {
            companyNameTitle.textContent = name;
        }
        
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    }).catch(error => {
        if (error.name === 'ConstraintError') {
            showToast('اسم الشركة موجود بالفعل', 'error');
        } else {
            console.error('Error updating company:', error);
            showToast('حدث خطأ أثناء تحديث بيانات الشركة', 'error');
        }
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    });
}

// Delete company
function deleteCompany(id) {
    // First get all vehicles for this company
    return getVehiclesByCompany(id).then(companyVehicles => {
        const vehicleIds = companyVehicles.map(v => v.id);
        
        // Delete all images for these vehicles
        const deleteImagesPromises = vehicleIds.map(vehicleId => 
            deleteAllImagesForVehicle(vehicleId)
        );
        
        // Delete all notes for these vehicles
        const deleteNotesPromises = vehicleIds.map(vehicleId => 
            deleteAllNotesForVehicle(vehicleId)
        );
        
        // Delete all vehicles
        const deleteVehiclesPromise = deleteAllVehiclesForCompany(id);
        
        // Delete the company
        const deleteCompanyPromise = deleteCompanyData(id);
        
        // Wait for all deletions to complete
        return Promise.all([
            ...deleteImagesPromises,
            ...deleteNotesPromises,
            deleteVehiclesPromise,
            deleteCompanyPromise
        ]);
    });
}

// Add new vehicle
function addVehicle(vehicleData) {
    vehicleData.id = generateId();
    
    return new Promise((resolve, reject) => {
        addVehicleData(vehicleData).then(() => {
            // Save images
            saveVehicleImages(vehicleData.id).then(() => {
                resolve();
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
}

// Update vehicle
function updateVehicle(vehicleData) {
    return new Promise((resolve, reject) => {
        updateVehicleData(vehicleData).then(() => {
            // First, find images that were removed
            const removedImages = existingImages.filter(img => 
                !document.querySelector(`.preview-item[data-image-id="${img.id}"]`)
            );
            
            // Delete removed images
            const deletePromises = removedImages.map(img => 
                deleteImageData(img.id)
            );
            
            // Save new images
            saveVehicleImages(vehicleData.id).then(() => {
                Promise.all(deletePromises).then(() => {
                    resolve();
                }).catch(error => {
                    console.error('Error deleting old images:', error);
                    resolve(); // Still resolve as the main update was successful
                });
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
}

// Delete vehicle
function deleteVehicle(id) {
    return new Promise((resolve, reject) => {
        // Delete images
        deleteAllImagesForVehicle(id).then(() => {
            // Delete notes
            deleteAllNotesForVehicle(id).then(() => {
                // Delete vehicle
                deleteVehicleData(id).then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                });
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
}

// Add note to vehicle
function addNote() {
    const content = newNote.value.trim();
    
    if (!content) {
        showToast('الرجاء إدخال محتوى الملاحظة', 'error');
        return;
    }
    
    const newNoteObj = {
        id: generateId(),
        vehicleId: currentVehicleId,
        content,
        createdAt: new Date().toISOString()
    };
    
    const addBtn = addNoteBtn;
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<div class="spinner"></div> جاري الإضافة...';
    addBtn.disabled = true;
    
    addNoteData(newNoteObj).then(() => {
        newNote.value = '';
        renderVehicleNotes(currentVehicleId);
        showToast('تم إضافة الملاحظة بنجاح', 'success');
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
    }).catch(error => {
        console.error('Error adding note:', error);
        showToast('حدث خطأ أثناء إضافة الملاحظة', 'error');
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
    });
}

// Delete note
function deleteNote(id) {
    return deleteNoteData(id).then(() => {
        renderVehicleNotes(currentVehicleId);
    }).catch(error => {
        console.error('Error deleting note:', error);
        showToast('حدث خطأ أثناء حذف الملاحظة', 'error');
    });
}

// Handle dropped/selected files
function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.match('image.*')) {
            continue;
        }
        
        const reader = new FileReader();
        
        reader.onload = (function(theFile) {
            return function(e) {
                addImageToPreview(e.target.result);
                selectedFiles.push({
                    data: e.target.result,
                    name: theFile.name,
                    type: theFile.type
                });
            };
        })(file);
        
        reader.readAsDataURL(file);
    }
}

// Add image to preview
function addImageToPreview(imageData, imageId = null) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    previewItem.innerHTML = `
        <img src="${imageData}" alt="معاينة الصورة">
        <button class="remove-btn">&times;</button>
    `;
    
    if (imageId) {
        previewItem.dataset.imageId = imageId;
    }
    
    imagePreview.appendChild(previewItem);
    
    // Add remove event
    previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (confirm('هل أنت متأكد أنك تريد حذف هذه الصورة؟')) {
            previewItem.remove();
            
            if (imageId) {
                // Remove from database
                deleteImageData(imageId).then(() => {
                    showToast('تم حذف الصورة بنجاح', 'success');
                }).catch(error => {
                    console.error('Error deleting image:', error);
                    showToast('حدث خطأ أثناء حذف الصورة', 'error');
                });
            } else {
                // Remove from selected files
                const index = selectedFiles.findIndex(file => file.data === imageData);
                if (index !== -1) {
                    selectedFiles.splice(index, 1);
                }
            }
        }
    });
}

// Save vehicle images
function saveVehicleImages(vehicleId) {
    const promises = selectedFiles.map(file => {
        return addImageData({
            id: generateId(),
            vehicleId,
            data: file.data,
            name: file.name,
            type: file.type
        });
    });
    
    selectedFiles = [];
    return Promise.all(promises);
}

// Show image in lightbox
function showLightbox(imagesArray, index) {
    if (imagesArray.length === 0) return;
    
    currentLightboxIndex = index;
    document.getElementById('lightbox-img').src = imagesArray[currentLightboxIndex].data;
    lightbox.style.display = 'block';
}

// Show previous image in lightbox
function showPrevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentImages.length) % currentImages.length;
    document.getElementById('lightbox-img').src = currentImages[currentLightboxIndex].data;
}

// Show next image in lightbox
function showNextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentImages.length;
    document.getElementById('lightbox-img').src = currentImages[currentLightboxIndex].data;
}

// Get license status
function getLicenseStatus(vehicle) {
    if (!vehicle.expiryDate) return 'expired';
    
    const dateParts = vehicle.expiryDate.split('/');
    if (dateParts.length !== 3) return 'expired';
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    
    const today = new Date();
    const expiryDate = new Date(year, month - 1, day);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'expired';
    } else if (diffDays <= 30) {
        return 'expiring';
    } else {
        return 'active';
    }
}

// Format date and time
function formatDateTime(isoString) {
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-EG', options);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// IndexedDB Helper Functions

function getAllCompanies() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.COMPANIES], 'readonly');
        const store = transaction.objectStore(STORES.COMPANIES);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getCompany(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.COMPANIES], 'readonly');
        const store = transaction.objectStore(STORES.COMPANIES);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllVehicles() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.VEHICLES], 'readonly');
        const store = transaction.objectStore(STORES.VEHICLES);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getVehiclesByCompany(companyId) {
    return new Promise((resolve, reject) {
        const transaction = db.transaction([STORES.VEHICLES], 'readonly');
        const store = transaction.objectStore(STORES.VEHICLES);
        const index = store.index('companyId');
        const request = index.getAll(companyId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getVehicle(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.VEHICLES], 'readonly');
        const store = transaction.objectStore(STORES.VEHICLES);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function addCompany(company) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.COMPANIES], 'readwrite');
        const store = transaction.objectStore(STORES.COMPANIES);
        const request = store.add(company);
        
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

function updateCompanyData(company) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.COMPANIES], 'readwrite');
        const store = transaction.objectStore(STORES.COMPANIES);
        const request = store.put(company);
        
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

function deleteCompanyData(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.COMPANIES], 'readwrite');
        const store = transaction.objectStore(STORES.COMPANIES);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function addVehicleData(vehicle) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.VEHICLES], 'readwrite');
        const store = transaction.objectStore(STORES.VEHICLES);
        const request = store.add(vehicle);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function updateVehicleData(vehicle) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.VEHICLES], 'readwrite');
        const store = transaction.objectStore(STORES.VEHICLES);
        const request = store.put(vehicle);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteVehicleData(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.VEHICLES], 'readwrite');
        const store = transaction.objectStore(STORES.VEHICLES);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteAllVehiclesForCompany(companyId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.VEHICLES], 'readwrite');
        const store = transaction.objectStore(STORES.VEHICLES);
        const index = store.index('companyId');
        const request = index.getAllKeys(companyId);
        
        request.onsuccess = () => {
            const keys = request.result;
            const deleteRequests = keys.map(key => {
                return new Promise((res, rej) => {
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = () => res();
                    deleteRequest.onerror = () => rej(deleteRequest.error);
                });
            });
            
            Promise.all(deleteRequests)
                .then(() => resolve())
                .catch(error => reject(error));
        };
        
        request.onerror = () => reject(request.error);
    });
}

function getVehicleNotes(vehicleId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.NOTES], 'readonly');
        const store = transaction.objectStore(STORES.NOTES);
        const index = store.index('vehicleId');
        const request = index.getAll(vehicleId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllNotes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.NOTES], 'readonly');
        const store = transaction.objectStore(STORES.NOTES);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getNotesForVehicles(vehicleIds) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.NOTES], 'readonly');
        const store = transaction.objectStore(STORES.NOTES);
        const index = store.index('vehicleId');
        
        const requests = vehicleIds.map(id => {
            return new Promise((res, rej) => {
                const request = index.getAll(id);
                request.onsuccess = () => res(request.result);
                request.onerror = () => rej(request.error);
            });
        });
        
        Promise.all(requests).then(results => {
            resolve(results.flat());
        }).catch(error => {
            reject(error);
        });
    });
}

function addNoteData(note) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.NOTES], 'readwrite');
        const store = transaction.objectStore(STORES.NOTES);
        const request = store.add(note);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteNoteData(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.NOTES], 'readwrite');
        const store = transaction.objectStore(STORES.NOTES);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteAllNotesForVehicle(vehicleId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.NOTES], 'readwrite');
        const store = transaction.objectStore(STORES.NOTES);
        const index = store.index('vehicleId');
        const request = index.getAllKeys(vehicleId);
        
        request.onsuccess = () => {
            const keys = request.result;
            const deleteRequests = keys.map(key => {
                return new Promise((res, rej) => {
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = () => res();
                    deleteRequest.onerror = () => rej(deleteRequest.error);
                });
            });
            
            Promise.all(deleteRequests)
                .then(() => resolve())
                .catch(error => reject(error));
        };
        
        request.onerror = () => reject(request.error);
    });
}

function getVehicleImages(vehicleId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.IMAGES], 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const index = store.index('vehicleId');
        const request = index.getAll(vehicleId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllImages() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.IMAGES], 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getImagesForVehicles(vehicleIds) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.IMAGES], 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const index = store.index('vehicleId');
        
        const requests = vehicleIds.map(id => {
            return new Promise((res, rej) => {
                const request = index.getAll(id);
                request.onsuccess = () => res(request.result);
                request.onerror = () => rej(request.error);
            });
        });
        
        Promise.all(requests).then(results => {
            resolve(results.flat());
        }).catch(error => {
            reject(error);
        });
    });
}

function addImageData(image) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.add(image);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteImageData(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteAllImagesForVehicle(vehicleId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const index = store.index('vehicleId');
        const request = index.getAllKeys(vehicleId);
        
        request.onsuccess = () => {
            const keys = request.result;
            const deleteRequests = keys.map(key => {
                return new Promise((res, rej) => {
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = () => res();
                    deleteRequest.onerror = () => rej(deleteRequest.error);
                });
            });
            
            Promise.all(deleteRequests)
                .then(() => resolve())
                .catch(error => reject(error));
        };
        
        request.onerror = () => reject(request.error);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
