/**
 * Parser JavaScript usando DOMParser nativo
 * Para comparación de rendimiento con WebAssembly
 */

class JavaScriptCDAParser {
    constructor() {
        this.documents = [];
        this.isInitialized = true;
    }

    async parseFiles(files) {
        //const startTime = performance.now();
        const startTime = (typeof performance !== 'undefined' && performance.now) 
                     ? performance.now() 
                     : Date.now();
        this.documents = [];
        
        console.log(`JavaScript Parser: Procesando ${files.length} archivos...`);
        
        for (let file of files) {
            try {
                const content = await this.readFileContent(file);
                const document = await this.parseXMLContent(file.name, content);
                this.documents.push(document);
                console.log(`JS Parser: Procesado ${file.name}`);
            } catch (error) {
                console.error(`JS Parser error en ${file.name}:`, error);
            }
        }
        
        const processingTime = performance.now() - startTime;
        const stats = this.calculateStatistics();
        stats.processing_time_ms = Math.round(processingTime);
        
        console.log(`JavaScript Parser completado en ${processingTime}ms`);
        return stats;
    }

    async parseXMLContent(fileName, xmlContent) {
        // Usar DOMParser nativo del navegador
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
        
        // Verificar errores de parsing
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Error parsing XML: ' + parserError.textContent);
        }
        
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
        
        try {
            // ID del paciente
            const idElement = xmlDoc.querySelector('patient id, recordTarget id');
            if (idElement) {
                patient.id = idElement.getAttribute('extension') || 
                           idElement.getAttribute('root') || 
                           idElement.textContent;
            }
            
            // Nombre del paciente - múltiples selectores
            const nameSelectors = [
                'patient name given',
                'patient name family', 
                'recordTarget name given',
                'recordTarget name family',
                'patientRole name given',
                'patientRole name family'
            ];
            
            let names = [];
            nameSelectors.forEach(selector => {
                const elements = xmlDoc.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.textContent.trim()) {
                        names.push(el.textContent.trim());
                    }
                });
            });
            
            if (names.length > 0) {
                patient.name = [...new Set(names)].join(' '); // Eliminar duplicados
            }
            
            // Género
            const genderSelectors = [
                'administrativeGenderCode',
                'patient administrativeGenderCode',
                'genderCode'
            ];
            
            for (let selector of genderSelectors) {
                const genderElement = xmlDoc.querySelector(selector);
                if (genderElement) {
                    const code = genderElement.getAttribute('code') || 
                               genderElement.getAttribute('value') ||
                               genderElement.textContent;
                    patient.gender = this.normalizeGender(code);
                    break;
                }
            }
            
            // Fecha de nacimiento
            const birthSelectors = [
                'birthTime',
                'patient birthTime',
                'dateOfBirth'
            ];
            
            for (let selector of birthSelectors) {
                const birthElement = xmlDoc.querySelector(selector);
                if (birthElement) {
                    const birthValue = birthElement.getAttribute('value') ||
                                     birthElement.getAttribute('time') ||
                                     birthElement.textContent;
                    if (birthValue) {
                        patient.birth_date = birthValue;
                        patient.age = this.calculateAge(birthValue);
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.warn('JS Parser: Error extrayendo información del paciente:', error);
        }
        
        return patient;
    }

    extractDiagnoses(xmlDoc, fileName) {
        const diagnoses = [];
        const seen = new Set();
        
        try {
            // Buscar en observaciones con códigos
            const observations = xmlDoc.querySelectorAll('observation, act, encounter');
            observations.forEach(obs => {
                const codeElement = obs.querySelector('code');
                if (codeElement) {
                    const displayName = codeElement.getAttribute('displayName') ||
                                      codeElement.getAttribute('name');
                    const code = codeElement.getAttribute('code');
                    
                    if (displayName && !seen.has(displayName.toLowerCase())) {
                        diagnoses.push({
                            code: code,
                            name: displayName,
                            code_system: codeElement.getAttribute('codeSystem') || 'structured'
                        });
                        seen.add(displayName.toLowerCase());
                    }
                }
                
                // Buscar en valores de texto
                const valueElement = obs.querySelector('value');
                if (valueElement) {
                    const displayName = valueElement.getAttribute('displayName');
                    if (displayName && !seen.has(displayName.toLowerCase())) {
                        diagnoses.push({
                            code: valueElement.getAttribute('code'),
                            name: displayName,
                            code_system: 'observation_value'
                        });
                        seen.add(displayName.toLowerCase());
                    }
                }
            });
            
            // Buscar en texto libre
            const textElements = xmlDoc.querySelectorAll('text, title, caption');
            textElements.forEach(el => {
                const text = el.textContent;
                this.extractDiagnosesFromText(text, diagnoses, seen);
            });
            
            // Inferir del nombre del archivo
            const inferredDiagnoses = this.inferDiagnosesFromFileName(fileName);
            inferredDiagnoses.forEach(diag => {
                if (!seen.has(diag.name.toLowerCase())) {
                    diagnoses.push(diag);
                    seen.add(diag.name.toLowerCase());
                }
            });
            
        } catch (error) {
            console.warn('JS Parser: Error extrayendo diagnósticos:', error);
        }
        
        return diagnoses;
    }

    extractMedications(xmlDoc, fileName) {
        const medications = [];
        const seen = new Set();
        
        try {
            // Buscar medicamentos estructurados
            const medSelectors = [
                'substanceAdministration',
                'medication',
                'supply',
                'manufacturedProduct'
            ];
            
            medSelectors.forEach(selector => {
                const elements = xmlDoc.querySelectorAll(selector);
                elements.forEach(el => {
                    // Buscar nombre en diferentes ubicaciones
                    const nameSelectors = [
                        'manufacturedMaterial name',
                        'medication name', 
                        'name',
                        'displayName'
                    ];
                    
                    nameSelectors.forEach(nameSelector => {
                        const nameElement = el.querySelector(nameSelector);
                        if (nameElement && nameElement.textContent.trim()) {
                            const medName = this.normalizeMedicationName(nameElement.textContent.trim());
                            if (medName && !seen.has(medName.toLowerCase())) {
                                medications.push({
                                    name: medName,
                                    medication_type: 'structured'
                                });
                                seen.add(medName.toLowerCase());
                            }
                        }
                    });
                });
            });
            
            // Inferir del nombre del archivo
            const inferredMeds = this.inferMedicationsFromFileName(fileName);
            inferredMeds.forEach(med => {
                if (!seen.has(med.name.toLowerCase())) {
                    medications.push(med);
                    seen.add(med.name.toLowerCase());
                }
            });
            
        } catch (error) {
            console.warn('JS Parser: Error extrayendo medicamentos:', error);
        }
        
        return medications;
    }

    extractDiagnosesFromText(text, diagnoses, seen) {
        const diagnosisKeywords = [
            'diabetes', 'diabético', 'hipertension', 'hipertenso', 'asma', 
            'pneumonia', 'infection', 'fracture', 'cancer', 'depression', 
            'anxiety', 'arthritis', 'hipercolesterolemia', 'bronchitis', 
            'gastritis', 'dermatitis', 'nephritis'
        ];
        
        const textLower = text.toLowerCase();
        diagnosisKeywords.forEach(keyword => {
            if (textLower.includes(keyword) && !seen.has(keyword)) {
                diagnoses.push({
                    code: null,
                    name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                    code_system: 'text_extracted'
                });
                seen.add(keyword);
            }
        });
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

    normalizeMedicationName(name) {
        const nameMap = {
            'metformina': 'Metformina',
            'metformin': 'Metformina',
            'enalapril': 'Enalapril',
            'atorvastatina': 'Atorvastatina',
            'atorvastatin': 'Atorvastatina',
            'salbutamol': 'Salbutamol',
            'budesonida': 'Budesonida',
            'budesonide': 'Budesonida',
            'warfarina': 'Warfarina',
            'warfarin': 'Warfarina'
        };
        
        const normalized = nameMap[name.toLowerCase()];
        return normalized || name.trim();
    }

    extractDocumentDate(xmlDoc) {
        const dateSelectors = ['effectiveTime', 'time', 'creationTime'];
        
        for (let selector of dateSelectors) {
            const dateElement = xmlDoc.querySelector(selector);
            if (dateElement) {
                return dateElement.getAttribute('value') || 
                       dateElement.getAttribute('time') ||
                       dateElement.textContent;
            }
        }
        return null;
    }

    extractAuthor(xmlDoc) {
        const authorSelectors = [
            'assignedPerson name',
            'author name',
            'authenticator name'
        ];
        
        for (let selector of authorSelectors) {
            const authorElement = xmlDoc.querySelector(selector);
            if (authorElement) {
                return authorElement.textContent.trim();
            }
        }
        return null;
    }

    normalizeGender(code) {
        if (!code) return 'Unknown';
        const upperCode = code.toUpperCase();
        if (upperCode.includes('M') || upperCode === 'MALE') return 'M';
        if (upperCode.includes('F') || upperCode === 'FEMALE') return 'F';
        return 'Unknown';
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
        
        if (this.documents.length === 0) return stats;
        
        let totalAge = 0;
        let ageCount = 0;
        const genderCounts = {};
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
        
        stats.average_age = ageCount > 0 ? totalAge / ageCount : 0;
        stats.gender_distribution = genderCounts;
        
        // Top 5 diagnósticos
        stats.top_diagnoses = Object.entries(diagnosisCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        
        // Top 5 medicamentos
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

    clear() {
        this.documents = [];
    }
}

// Crear instancia global
window.jsParser = new JavaScriptCDAParser();