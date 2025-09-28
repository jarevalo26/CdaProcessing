/**
 * Upload Handler con benchmark automático integrado en dashboard único
 */

class UploadHandler {
    constructor() {
        this.uploadSection = document.querySelector('.cda-upload-section');
        this.fileInput = document.getElementById('cda-file-input');
        this.uploadedFiles = [];
        this.currentStats = null;
        this.wasmInitialized = false;
        this.benchmarkResults = null;
        
        this.init();
    }
    
    async init() {
        this.setupDragAndDrop();
        this.setupFileInput();
        this.setupActionButtons();
        this.setupFileRemoval(); // NUEVA LÍNEA
        this.hideDashboard();
        
        // Inicializar WASM
        await this.initializeWasm();
    }
    
    async initializeWasm() {
        try {
            console.log('Inicializando WebAssembly parser...');
            this.wasmInitialized = await window.wasmParser.initialize();
            if (this.wasmInitialized) {
                console.log('WASM inicializado correctamente');
            } else {
                console.error('Error inicializando WASM');
            }
        } catch (error) {
            console.error('Error durante inicialización WASM:', error);
            this.wasmInitialized = false;
        }
    }
    
    setupDragAndDrop() {
        // Drag over
        this.uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadSection.classList.add('cda-upload-section--dragover');
        });
        
        // Drag leave
        this.uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadSection.classList.remove('cda-upload-section--dragover');
        });
        
        // Drop
        this.uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadSection.classList.remove('cda-upload-section--dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
        
        // Click solo en elementos específicos del upload
        this.uploadSection.addEventListener('click', (e) => {
            // IMPORTANTE: Ignorar clics en archivos cargados y sus botones
            if (e.target.closest('.uploaded-file') || 
                e.target.closest('.files-list') || 
                e.target.closest('.files-list-container')) {
                return; // No hacer nada si el clic es en un archivo o su botón X
            }
            
            const clickableElements = [
                '.cda-upload-icon',
                '.cda-upload-title', 
                '.cda-upload-subtitle'
            ];
            
            const isClickableElement = clickableElements.some(selector => 
                e.target.matches(selector) || e.target.closest(selector)
            );
            
            const isDirectUploadClick = e.target === this.uploadSection;
            
            if (isClickableElement || isDirectUploadClick) {
                this.fileInput.click();
            }
        });
    }
    
    setupFileInput() {
        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
            e.target.value = '';
        });
    }
    
    handleFiles(files) {
        console.log('Archivos recibidos:', files.length);
        
        files.forEach(file => {
            if (this.isValidFile(file)) {
                this.uploadedFiles.push(file);
                this.showFileInList(file);
                console.log('Archivo válido:', file.name);
            } else {
                alert(`Archivo no válido: ${file.name}. Solo se aceptan archivos .xml o .cda menores a 10MB`);
            }
        });
        
        this.updateUI();
    }
    
    isValidFile(file) {
        const validTypes = ['text/xml', 'application/xml'];
        const validExtensions = ['.xml', '.cda'];
        
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        const maxSize = 10 * 1024 * 1024;
        const validSize = file.size <= maxSize;
        
        return (hasValidType || hasValidExtension) && validSize;
    }
    
    showFileInList(file) {        
        const fileId = Date.now() + '_' + Math.random(); // ID único

        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.dataset.fileId = fileId; // Guardar ID

        fileElement.setAttribute('role', 'listitem');
        fileElement.setAttribute('aria-label', `Archivo: ${file.name}, ${this.formatFileSize(file.size)}`);
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        fileName.setAttribute('title', file.name);
        
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = this.formatFileSize(file.size);
        
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-file';
        removeButton.textContent = '×';

        removeButton.dataset.fileId = fileId; // Asociar botón con archivo
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.removeFileById(fileId, file.name);
        });

        removeButton.setAttribute('aria-label', `Eliminar archivo ${file.name}`);
        removeButton.setAttribute('title', 'Eliminar archivo');
        
        fileElement.appendChild(fileName);
        fileElement.appendChild(fileSize);
        fileElement.appendChild(removeButton);
        
        let filesContainer = document.getElementById('files-container');
        if (!filesContainer) {
            filesContainer = document.createElement('div');
            filesContainer.id = 'files-container';
            filesContainer.className = 'files-list-container';
            this.uploadSection.appendChild(filesContainer);
        }
        
        let filesList = document.getElementById('files-list');
        if (!filesList) {
            filesList = document.createElement('div');
            filesList.id = 'files-list';
            filesList.className = 'files-list';
            filesList.setAttribute('role', 'list');
            filesList.setAttribute('aria-label', 'Lista de archivos cargados');
            filesContainer.appendChild(filesList);
        }
        
        filesList.appendChild(fileElement);
        this.updateScrollIndicator(filesContainer, filesList);
        
        setTimeout(() => {
            fileElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'end'
            });
        }, 100);
    }

    removeFileById(fileId, fileName) {
        // Eliminar del array
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        
        // Eliminar del DOM usando el ID específico
        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileElement) {
            fileElement.remove();
        }
        
        this.updateUI();
    }
    
    updateScrollIndicator(container, list) {
        const needsScroll = list.scrollWidth > list.clientWidth;
        
        if (needsScroll) {
            container.classList.remove('no-scroll');
            container.setAttribute('aria-label', 'Lista de archivos con scroll horizontal disponible');
        } else {
            container.classList.add('no-scroll');
            container.removeAttribute('aria-label');
        }
    }
    
    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        
        const fileElements = document.querySelectorAll('.uploaded-file');
        fileElements.forEach(element => {
            const nameElement = element.querySelector('.file-name');
            if (nameElement && nameElement.textContent === fileName) {
                element.remove();
            }
        });
        
        const filesContainer = document.getElementById('files-container');
        const filesList = document.getElementById('files-list');
        if (filesContainer && filesList) {
            this.updateScrollIndicator(filesContainer, filesList);
        }
        
        this.updateUI();
    }
    
    updateUI() {
        const processBtn = document.getElementById('process-btn');
        
        if (processBtn) {
            processBtn.disabled = this.uploadedFiles.length === 0;
        }
        
        const uploadTitle = this.uploadSection.querySelector('.cda-upload-title');
        if (uploadTitle) {
            if (this.uploadedFiles.length > 0) {
                uploadTitle.textContent = `${this.uploadedFiles.length} archivo(s) cargado(s)`;
            } else {
                uploadTitle.textContent = 'Arrastra archivos CDA aquí';
            }
        }
        
        if (this.uploadedFiles.length === 0) {
            this.hideDashboard();
            const filesContainer = document.getElementById('files-container');
            if (filesContainer) {
                filesContainer.remove();
            }
        }
    }
    
    hideDashboard() {
        const mainDashboard = document.getElementById('main-dashboard');
        if (mainDashboard) {
            mainDashboard.style.display = 'none';
        }
    }
    
    showDashboard() {
        const mainDashboard = document.getElementById('main-dashboard');
        if (mainDashboard) {
            mainDashboard.style.display = 'block';
        }
    }
    
    setupActionButtons() {
        const processBtn = document.getElementById('process-btn');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processFilesWithBenchmark();
            });
        }
        
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFiles();
            });
        }
    }
    
    async processFilesWithBenchmark() {
        if (!this.wasmInitialized) {
            alert('El sistema no está inicializado. Recarga la página e intenta de nuevo.');
            return;
        }
        
        if (this.uploadedFiles.length === 0) {
            alert('No hay archivos para procesar.');
            return;
        }
        
        console.log('🚀 Iniciando procesamiento con benchmark automático...');
        this.showLoadingWithProgress('Iniciando benchmark comparativo...');
        
        try {
            // Verificar que todos los parsers estén disponibles
            if (!window.wasmParser) {
                throw new Error('WebAssembly parser no disponible');
            }
            if (!window.jsParser) {
                throw new Error('JavaScript parser no disponible - verifica que js/js-parser.js esté cargado');
            }
            if (!window.tsParser) {
                throw new Error('TypeScript parser no disponible - verifica que js/ts-parser.js esté cargado');
            }
            
            // Ejecutar benchmark de los 3 parsers
            this.benchmarkResults = await this.runTripleParserBenchmark();
            
            // Usar datos médicos del WebAssembly
            this.currentStats = this.benchmarkResults.wasmStats;
            let tsStats = this.benchmarkResults.tsStats;

            // Combinar: usar WebAssembly como base pero completar con JavaScript
            if (!this.currentStats.gender_distribution || this.currentStats.gender_distribution.size === 0 || 
                (this.currentStats.gender_distribution.size === 1 && this.currentStats.gender_distribution.has('Unknown'))) {
                
                console.log('WebAssembly falló en género, usando datos de JavaScript');
                this.currentStats.gender_distribution = tsStats.gender_distribution;
                this.currentStats.average_age = tsStats.average_age;
            }
            
            console.log('✅ Benchmark completado:', this.benchmarkResults);
            
            this.hideLoading();
            this.showDashboard();
            this.populateMedicalData();
            this.showPerformanceComparison();
            
            console.log('📊 Dashboard completo mostrado con 3 niveles: Métricas + Gráficos + Rendimiento');
            
            // Limpiar solo la visualización de archivos:
            const filesContainer = document.getElementById('files-container');
            if (filesContainer) {
                filesContainer.remove();
            }

            const uploadTitle = this.uploadSection.querySelector('.cda-upload-title');
            if (uploadTitle) {
                uploadTitle.textContent = 'Arrastra archivos CDA aquí';
            }

        } catch (error) {
            console.error('❌ Error en benchmark:', error);
            this.hideLoading();
            alert('Error procesando archivos: ' + error.message);
        }
    }
    
    async runTripleParserBenchmark() {
        console.log('⚡ Ejecutando benchmark de 3 parsers...');
        
        // 1. WebAssembly Parser
        this.updateLoadingProgress('Procesando con WebAssembly...');
        const wasmStartTime = (typeof performance !== 'undefined' && performance.now) 
                     ? performance.now() 
                     : Date.now();
        const wasmStats = await window.wasmParser.parseFiles(this.uploadedFiles);
        const wasmTime = ((typeof performance !== 'undefined' && performance.now) 
                 ? performance.now() 
                 : Date.now()) - wasmStartTime;
        
        // 2. JavaScript Parser
        this.updateLoadingProgress('Procesando con JavaScript nativo...');
        const jsStartTime = (typeof performance !== 'undefined' && performance.now) 
                   ? performance.now() 
                   : Date.now();
        const jsStats = await window.jsParser.parseFiles(this.uploadedFiles);
        const jsTime = ((typeof performance !== 'undefined' && performance.now) 
               ? performance.now() 
               : Date.now()) - jsStartTime;
        
        // 3. TypeScript Parser
        this.updateLoadingProgress('Procesando con TypeScript...');
        const tsStartTime = (typeof performance !== 'undefined' && performance.now) 
                   ? performance.now() 
                   : Date.now();
        const tsStats = await window.tsParser.parseFiles(this.uploadedFiles);
        const tsTime = ((typeof performance !== 'undefined' && performance.now) 
               ? performance.now() 
               : Date.now()) - tsStartTime;
        
        this.updateLoadingProgress('Calculando resultados...');
        
        return {
            wasmTime: Math.round(wasmTime),
            jsTime: Math.round(jsTime),
            tsTime: Math.round(tsTime),
            wasmStats: wasmStats,
            jsStats: jsStats,
            tsStats: tsStats,
            speedupJS: (jsTime / wasmTime).toFixed(1),
            speedupTS: (tsTime / wasmTime).toFixed(1),
            filesProcessed: this.uploadedFiles.length
        };
    }
    
    showPerformanceComparison() {
        const performanceSection = document.getElementById('performance-section');
        if (performanceSection && this.benchmarkResults) {
            // Mostrar la sección de rendimiento
            performanceSection.style.display = 'block';
            
            // Poblar los datos
            this.populatePerformanceData();
            
            console.log('⚡ Sección de rendimiento mostrada como tercer nivel');
        }
    }
    
    populatePerformanceData() {
        if (!this.benchmarkResults) return;
        
        const results = this.benchmarkResults;

        // Determinar el ganador real
        const times = {
            js: results.jsTime,
            ts: results.tsTime,
            wasm: results.wasmTime
        };
        
        // Llenar tiempos de cada parser
        const jsTimeElement = document.getElementById('jsTime');
        const tsTimeElement = document.getElementById('tsTime');
        const wasmTimeElement = document.getElementById('wasmTime');

        if (jsTimeElement) jsTimeElement.textContent = results.jsTime;
        if (tsTimeElement) tsTimeElement.textContent = results.tsTime;
        if (wasmTimeElement) wasmTimeElement.textContent = results.wasmTime;

        const fastest = Object.keys(times).reduce((a, b) => times[a] < times[b] ? a : b);
        
        // Llenar speedup relativo
        const jsSpeedupElement = document.getElementById('jsSpeedup');
        const tsSpeedupElement = document.getElementById('tsSpeedup');
        const wasmResultElement = document.getElementById('wasmResult');
        
        if (fastest === 'js') {
            if (jsSpeedupElement) jsSpeedupElement.textContent = '🏆 Ganador';
            if (tsSpeedupElement) tsSpeedupElement.textContent = `${(results.tsTime / results.jsTime).toFixed(1)}x más lento`;
            if (wasmResultElement) wasmResultElement.textContent = `${(results.wasmTime / results.jsTime).toFixed(1)}x más lento`;
        } else if (fastest === 'ts') {
            if (jsSpeedupElement) jsSpeedupElement.textContent = `${(results.jsTime / results.tsTime).toFixed(1)}x más lento`;
            if (tsSpeedupElement) tsSpeedupElement.textContent = '🏆 Ganador';
            if (wasmResultElement) wasmResultElement.textContent = `${(results.wasmTime / results.tsTime).toFixed(1)}x más lento`;
        } else {
            if (jsSpeedupElement) jsSpeedupElement.textContent = `${(results.jsTime / results.wasmTime).toFixed(1)}x más lento`;
            if (tsSpeedupElement) tsSpeedupElement.textContent = `${(results.tsTime / results.wasmTime).toFixed(1)}x más lento`;
            if (wasmResultElement) wasmResultElement.textContent = '🏆 Ganador';
        }
        
        console.log('📊 Datos de rendimiento poblados en tercer nivel');
    }
    
    populateMedicalData() {
        if (!this.currentStats) {
            console.log('No hay estadísticas disponibles');
            this.showSimpleInfo();
            return;
        }

        console.log('Poblando datos médicos:', this.currentStats);
    
        document.getElementById('totalDocuments').textContent = this.currentStats.total_documents || '0';
        document.getElementById('totalPatients').textContent = this.currentStats.total_patients || '0';
        document.getElementById('avgAge').textContent = this.currentStats.average_age ? 
            Math.round(this.currentStats.average_age) + ' años' : 'N/A';
        document.getElementById('processTime').textContent = this.currentStats.processing_time_ms || '0';

        this.showDetailedInfo();
    
        console.log('WASM Stats:', this.benchmarkResults.wasmStats);
        console.log('JS Stats:', this.benchmarkResults.jsStats);
        console.log('TS Stats:', this.benchmarkResults.tsStats);
    }
    
    showSimpleInfo() {
        document.getElementById('totalDocuments').textContent = this.uploadedFiles.length;
        document.getElementById('totalPatients').textContent = this.uploadedFiles.length;
        document.getElementById('avgAge').textContent = 'Calculando...';
        document.getElementById('processTime').textContent = 'N/A';
        
        const chartContainers = document.querySelectorAll('.cda-chart-container');
        chartContainers.forEach(container => {
            container.innerHTML = '<div class="cda-chart-placeholder">Datos en procesamiento...</div>';
        });
    }
    
    showDetailedInfo() {
        if (!this.currentStats) return;
        
        const diagnosisChart = document.getElementById('diagnosisChart');
        if (diagnosisChart && this.currentStats.top_diagnoses) {
            diagnosisChart.innerHTML = this.createDiagnosisList(this.currentStats.top_diagnoses);
        }
        
        const demographicsChart = document.getElementById('demographicsChart');
        if (demographicsChart && this.currentStats.gender_distribution) {
            demographicsChart.innerHTML = this.createGenderDistribution(this.currentStats.gender_distribution);
        }
        
        const medicationsChart = document.getElementById('medicationsChart');
        if (medicationsChart && this.currentStats.top_medications) {
            medicationsChart.innerHTML = this.createMedicationsList(this.currentStats.top_medications);
        }
    }
    
    createDiagnosisList(diagnoses) {
        if (!diagnoses.length) {
            return '<div class="info-message">No se encontraron diagnósticos</div>';
        }
        
        let html = '<div class="stats-list">';
        diagnoses.forEach(diag => {
            html += `
                <div class="stats-item">
                    <span class="stats-name">${diag.name}</span>
                    <span class="stats-count">${diag.count}</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
    
    createGenderDistribution(genderDist) {
        console.log('Creando distribución de género:', genderDist);
        console.log('Total patients:', this.currentStats.total_patients);

        // Verificar si genderDist está vacío
        if (!genderDist || Object.keys(genderDist).length === 0) {
            return '<div class="info-message">No se encontró información demográfica</div>';
        }
    
        let html = '<div class="stats-list">';
        Object.entries(genderDist).forEach(([gender, count]) => {
            const percentage = ((count / this.currentStats.total_patients) * 100).toFixed(1);
            html += `
                <div class="stats-item">
                    <span class="stats-name">${gender === 'M' ? 'Masculino' : gender === 'F' ? 'Femenino' : 'No especificado'}</span>
                    <span class="stats-count">${count} (${percentage}%)</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
    
    createMedicationsList(medications) {
        if (!medications.length) {
            return '<div class="info-message">No se encontraron medicamentos</div>';
        }
        
        let html = '<div class="stats-list">';
        medications.forEach(med => {
            html += `
                <div class="stats-item">
                    <span class="stats-name">${med.name}</span>
                    <span class="stats-count">${med.count}</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
    
    showLoadingWithProgress(message = 'Procesando...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        const loadingProgress = document.getElementById('loadingProgress');
        
        if (loadingText) loadingText.textContent = message;
        if (loadingProgress) loadingProgress.textContent = 'Iniciando benchmark comparativo...';
        if (loadingOverlay) loadingOverlay.classList.add('cda-loading-overlay--active');
    }
    
    updateLoadingProgress(message) {
        const loadingProgress = document.getElementById('loadingProgress');
        if (loadingProgress) {
            loadingProgress.textContent = message;
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.remove('cda-loading-overlay--active');
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    getUploadedFiles() {
        return this.uploadedFiles;
    }
    
    clearFiles() {
        this.uploadedFiles = [];
        this.currentStats = null;
        this.benchmarkResults = null;
        
        const filesContainer = document.getElementById('files-container');
        if (filesContainer) {
            filesContainer.remove();
        }
        
        // Limpiar parsers
        if (this.wasmInitialized && window.wasmParser) {
            window.wasmParser.clear();
        }
        if (window.jsParser) {
            window.jsParser.clear();
        }
        if (window.tsParser) {
            window.tsParser.clear();
        }
        
        // Ocultar dashboard y performance
        this.hideDashboard();
        const performanceSection = document.getElementById('performance-section');
        if (performanceSection) {
            performanceSection.style.display = 'none';
        }
        
        this.updateUI();
        this.fileInput.value = '';
    }

    setupFileRemoval() {
    // Event delegation para botones de eliminar
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-file')) {
            e.stopPropagation();
            e.preventDefault();
            
            // Obtener el nombre del archivo desde el elemento padre
            const fileElement = e.target.closest('.uploaded-file');
            if (fileElement) {
                const fileName = fileElement.querySelector('.file-name').textContent;
                this.removeFile(fileName);
            }
        }
    });
}
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.uploadHandler = new UploadHandler();
});