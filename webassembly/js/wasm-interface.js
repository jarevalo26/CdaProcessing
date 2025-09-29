/**
 * Interfaz JavaScript para el parser CDA con fallback sin WebAssembly
 */

class WasmCDAParser {
    constructor() {
        this.wasmModule = null;
        this.parser = null;
        this.isInitialized = false;
        this.useWasm = false; // Flag para indicar si usar WASM o fallback
        this.documents = []; // Almacenar documentos parseados
    }
    
    async initialize() {
        try {          
            // Intentar cargar WASM
            const wasmModule = await import('./cda_parser_wasm.js');
            await wasmModule.default();
            
            this.wasmModule = wasmModule;
            this.parser = new wasmModule.CDAParser();
            this.isInitialized = true;
            this.useWasm = true;
            
            return true;
            
        } catch (error) {
            console.warn('WebAssembly no disponible, usando fallback JavaScript:', error.message);            
            this.isInitialized = true;
            this.useWasm = false;
            
            return true;
        }
    }
       
    async parseFiles(files) {
        if (!this.isInitialized) throw new Error('Parser no está inicializado');

        console.log(`Procesando ${files.length} archivos con WebAssembly (batch)...`);

        // construir payload una sola vez
        const filesData = await Promise.all(files.map(async f => ({
            name: f.name,
            content: await this.readFileContent(f)
        })));

        try {
            // Llamada única al método batch del WASM
            const stats = this.parser.parse_files_batch(filesData);
            //return await this.parseFilesWithFallback(files);
            // stats probablemente sea un objeto JS ya serializado por wasm-bindgen   
            return stats;         
        } catch (e) {
            console.error("Error al Llamar al método batch del WASM:", e);
            return await this.parseFilesWithFallback(files); // tu fallback actual
        }
    }


    /* async parseFilesWithWasm(files) {                
        const startTime = (typeof performance !== 'undefined' && performance.now) 
                     ? performance.now() 
                     : Date.now();
        this.parser.clear();
        console.log(`Procesando ${files.length} archivos con WebAssembly en lote...`);

        for (let file of files) {
            try {
                const content = await this.readFileContent(file);
                await this.parser.parse_file(file.name, content);
                console.log(`WASM: Procesado ${file.name}`);
            } catch (error) {
                console.error(`Error procesando ${file.name} con WASM:`, error);
            }
        }

       // Obtener estadísticas finales
        console.log(`Me reviento acaaaaaaaaaaa!!!!`);
        const stats = this.parser.get_statistics();
        //const processingTime = performance.now() - startTime;
        //stats.processing_time_ms = Math.round(processingTime);
        
        console.log(`WebAssembly procesamiento en lote completado en ${processingTime}ms`);
        return stats;
    } */
    
    async parseFilesWithFallback(files) {
        console.log(`Procesando ${files.length} archivos con fallback JavaScript...`);
        
        const startTime = (typeof performance !== 'undefined' && performance.now) 
                     ? performance.now() 
                     : Date.now();
        this.documents = [];

        for (let file of files) {
            try {
                const content = await this.readFileContent(file);
                const document = await this.parseXMLContent(file.name, content);
                this.documents.push(document);
            } catch (error) {
                console.error(`Error procesando ${file.name}:`, error);
            }
        }
        
        const processingTime = performance.now() - startTime;
        const stats = this.calculateStatistics();
        stats.processing_time_ms = Math.round(processingTime);
        return stats;
    }
    
    async parseXMLContent(fileName, xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
        
        const patient = this.extractPatientInfo(xmlDoc);
        const diagnoses = this.extractDiagnoses(xmlDoc, fileName);
        const medications = this.extractMedications(xmlDoc, fileName);
        
        return {
            file_name: fileName,
            patient: patient,
            diagnoses: diagnoses,
            medications: medications,
            document_date: this.extractDocumentDate(xmlDoc),
            author: this.extractAuthor(xmlDoc)
        };
    }
    
    extractPatientInfo(xmlDoc) {
        const patient = {
            id: null,
            name: null,
            gender: null,
            birth_date: null,
            age: null
        };
        
        // Buscar información del paciente en el XML
        try {
            // ID del paciente
            const idElement = xmlDoc.querySelector('patient id');
            if (idElement) {
                patient.id = idElement.getAttribute('extension') || idElement.getAttribute('root');
            }
            
            // Nombre del paciente
            const nameElements = xmlDoc.querySelectorAll('patient name *');
            let names = [];
            nameElements.forEach(el => {
                if (el.textContent.trim()) {
                    names.push(el.textContent.trim());
                }
            });
            if (names.length > 0) {
                patient.name = names.join(' ');
            }
            
            // Género
            const genderElement = xmlDoc.querySelector('administrativeGenderCode');
            if (genderElement) {
                const code = genderElement.getAttribute('code');
                patient.gender = this.normalizeGender(code);
            }
            
            // Fecha de nacimiento
            const birthElement = xmlDoc.querySelector('birthTime');
            if (birthElement) {
                const birthValue = birthElement.getAttribute('value');
                patient.birth_date = birthValue;
                patient.age = this.calculateAge(birthValue);
            }
            
        } catch (error) {
            console.warn('Error extrayendo información del paciente:', error);
        }
        
        return patient;
    }
    
    extractDiagnoses(xmlDoc, fileName) {
        const diagnoses = [];
        
        // Buscar diagnósticos en observaciones
        const observations = xmlDoc.querySelectorAll('observation');
        observations.forEach(obs => {
            const codeElement = obs.querySelector('code');
            if (codeElement) {
                const displayName = codeElement.getAttribute('displayName');
                if (displayName) {
                    diagnoses.push({
                        code: codeElement.getAttribute('code'),
                        name: displayName,
                        code_system: codeElement.getAttribute('codeSystem')
                    });
                }
            }
        });
        
        // Inferir diagnósticos del nombre del archivo
        const inferredDiagnoses = this.inferDiagnosesFromFileName(fileName);
        diagnoses.push(...inferredDiagnoses);
        
        // Eliminar duplicados
        const uniqueDiagnoses = [];
        const seen = new Set();
        diagnoses.forEach(diag => {
            const key = diag.name.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueDiagnoses.push(diag);
            }
        });
        
        return uniqueDiagnoses;
    }
    
    extractMedications(xmlDoc, fileName) {
        const medications = [];
        
        // Buscar medicamentos en substanceAdministration
        const medications_elements = xmlDoc.querySelectorAll('substanceAdministration');
        medications_elements.forEach(med => {
            const nameElement = med.querySelector('manufacturedMaterial name');
            if (nameElement && nameElement.textContent.trim()) {
                medications.push({
                    name: nameElement.textContent.trim(),
                    medication_type: 'structured'
                });
            }
        });
        
        // Inferir medicamentos del nombre del archivo
        const inferredMeds = this.inferMedicationsFromFileName(fileName);
        medications.push(...inferredMeds);
        
        // Eliminar duplicados
        const uniqueMeds = [];
        const seen = new Set();
        medications.forEach(med => {
            const key = med.name.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMeds.push(med);
            }
        });
        
        return uniqueMeds;
    }
    
    inferDiagnosesFromFileName(fileName) {
        const diagnoses = [];
        const lowerName = fileName.toLowerCase();
        
        const diagnosisMap = {
            'hipertenso': 'Hipertensión arterial',
            'diabetico': 'Diabetes mellitus',
            'diabetes': 'Diabetes mellitus tipo 2',
            'hipertension': 'Hipertensión arterial',
            'asma': 'Asma bronquial',
            'hipercolesterolemia': 'Hipercolesterolemia',
            'anticoagulacion': 'Trastorno de coagulación'
        };
        
        Object.entries(diagnosisMap).forEach(([keyword, diagnosis]) => {
            if (lowerName.includes(keyword)) {
                diagnoses.push({
                    code: null,
                    name: diagnosis,
                    code_system: 'filename_inferred'
                });
            }
        });
        
        return diagnoses;
    }
    
    inferMedicationsFromFileName(fileName) {
        const medications = [];
        const lowerName = fileName.toLowerCase();
        
        const medicationMap = {
            'diabetico': 'Metformina',
            'diabetes': 'Metformina',
            'hipertenso': 'Enalapril',
            'hipertension': 'Enalapril',
            'hipercolesterolemia': 'Atorvastatina',
            'asma': 'Salbutamol',
            'anticoagulacion': 'Warfarina'
        };
        
        Object.entries(medicationMap).forEach(([keyword, medication]) => {
            if (lowerName.includes(keyword)) {
                medications.push({
                    name: medication,
                    medication_type: 'filename_inferred'
                });
            }
        });
        
        return medications;
    }
    
    extractDocumentDate(xmlDoc) {
        const dateElement = xmlDoc.querySelector('effectiveTime');
        return dateElement ? dateElement.getAttribute('value') : null;
    }
    
    extractAuthor(xmlDoc) {
        const authorElement = xmlDoc.querySelector('assignedPerson name');
        return authorElement ? authorElement.textContent.trim() : null;
    }
    
    normalizeGender(code) {
        if (!code) return 'Unknown';
        switch (code.toUpperCase()) {
            case 'M': case 'MALE': return 'M';
            case 'F': case 'FEMALE': return 'F';
            default: return 'Unknown';
        }
    }
    
    calculateAge(birthDateHL7) {
        if (!birthDateHL7 || birthDateHL7.length < 8) return null;
        
        try {
            const year = parseInt(birthDateHL7.substring(0, 4));
            const currentYear = new Date().getFullYear();
            const age = currentYear - year;
            
            return (age >= 0 && age <= 150) ? age : null;
        } catch (error) {
            return null;
        }
    }
    
    calculateStatistics() {
        const stats = {
            total_documents: this.documents.length,
            total_patients: this.documents.length,
            average_age: 0,
            gender_distribution: {},
            top_diagnoses: [],
            top_medications: [],
            processing_time_ms: 0
        };
        
        if (this.documents.length === 0) {
            return stats;
        }
        
        // Calcular edad promedio
        let totalAge = 0;
        let ageCount = 0;
        
        // Contar géneros
        const genderCounts = {};
        
        // Contar diagnósticos y medicamentos
        const diagnosisCounts = {};
        const medicationCounts = {};
        
        this.documents.forEach(doc => {
            // Edad
            if (doc.patient.age) {
                totalAge += doc.patient.age;
                ageCount++;
            }
            
            // Género
            const gender = doc.patient.gender || 'Unknown';
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
            
            // Diagnósticos
            doc.diagnoses.forEach(diag => {
                diagnosisCounts[diag.name] = (diagnosisCounts[diag.name] || 0) + 1;
            });
            
            // Medicamentos
            doc.medications.forEach(med => {
                medicationCounts[med.name] = (medicationCounts[med.name] || 0) + 1;
            });
        });
        
        // Edad promedio
        stats.average_age = ageCount > 0 ? totalAge / ageCount : 0;
        
        // Distribución de género
        stats.gender_distribution = genderCounts;
        
        // Top diagnósticos
        stats.top_diagnoses = Object.entries(diagnosisCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        
        // Top medicamentos
        stats.top_medications = Object.entries(medicationCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        
        return stats;
    }
    
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    getDocuments() {
        if (this.useWasm && this.parser) {
            return this.parser.get_documents();
        } else {
            return this.documents;
        }
    }
    
    clear() {
        if (this.useWasm && this.parser) {
            this.parser.clear();
        } else {
            this.documents = [];
        }
    }
    
    getStats() {
        if (!this.isInitialized) {
            return null;
        }
        
        if (this.useWasm && this.parser) {
            return this.parser.get_statistics();
        } else {
            return this.calculateStatistics();
        }
    }
}

// Crear instancia global
window.wasmParser = new WasmCDAParser();