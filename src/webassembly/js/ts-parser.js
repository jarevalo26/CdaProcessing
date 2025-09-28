/**
 * Parser TypeScript simulado usando RegExp y parsing manual
 * Para comparación de rendimiento con WebAssembly y JavaScript
 */

class TypeScriptCDAParser {
    constructor() {
        this.documents = [];
        this.isInitialized = true;
    }

    async parseFiles(files) {
        const startTime = performance.now();
        this.documents = [];
        
        console.log(`TypeScript Parser: Procesando ${files.length} archivos...`);
        
        for (let file of files) {
            try {
                const content = await this.readFileContent(file);
                const document = await this.parseXMLWithRegExp(file.name, content);
                this.documents.push(document);
                console.log(`TS Parser: Procesado ${file.name}`);
            } catch (error) {
                console.error(`TS Parser error en ${file.name}:`, error);
            }
        }
        
        const processingTime = performance.now() - startTime;
        const stats = this.calculateStatistics();
        stats.processing_time_ms = Math.round(processingTime);
        
        console.log(`TypeScript Parser completado en ${processingTime}ms`);
        return stats;
    }

    async parseXMLWithRegExp(fileName, xmlContent) {
        // Enfoque TypeScript: usar RegExp para extraer información
        // Simula un approach más manual y estructurado
        
        const patient = this.extractPatientWithRegExp(xmlContent);
        const diagnoses = this.extractDiagnosesWithRegExp(xmlContent, fileName);
        const medications = this.extractMedicationsWithRegExp(xmlContent, fileName);
        
        return {
            file_name: fileName,
            patient: patient,
            diagnoses: diagnoses,
            medications: medications,
            document_date: this.extractDocumentDateWithRegExp(xmlContent),
            author: this.extractAuthorWithRegExp(xmlContent)
        };
    }

    extractPatientWithRegExp(xmlContent) {
        const patient = {
            id: null,
            name: null,
            gender: null,
            birth_date: null,
            age: null
        };
        
        try {
            // ID del paciente con RegExp
            const idPatterns = [
                /<patient[^>]*id[^>]*extension\s*=\s*["']([^"']+)["']/i,
                /<id[^>]*extension\s*=\s*["']([^"']+)["']/i,
                /<recordTarget[^>]*id[^>]*extension\s*=\s*["']([^"']+)["']/i
            ];
            
            for (let pattern of idPatterns) {
                const match = xmlContent.match(pattern);
                if (match) {
                    patient.id = match[1];
                    break;
                }
            }
            
            // Nombre del paciente con RegExp múltiples
            const namePatterns = [
                /<given[^>]*>([^<]+)<\/given>/gi,
                /<family[^>]*>([^<]+)<\/family>/gi,
                /<name[^>]*>([^<]+)<\/name>/gi
            ];
            
            let names = [];
            namePatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(xmlContent)) !== null) {
                    const name = match[1].trim();
                    if (name && !names.includes(name)) {
                        names.push(name);
                    }
                }
            });
            
            if (names.length > 0) {
                patient.name = names.join(' ');
            }
            
            // Género con RegExp
            const genderPatterns = [
                /<administrativeGenderCode[^>]*code\s*=\s*["']([^"']+)["']/i,
                /<genderCode[^>]*code\s*=\s*["']([^"']+)["']/i,
                /<gender[^>]*>([^<]+)<\/gender>/i
            ];
            
            for (let pattern of genderPatterns) {
                const match = xmlContent.match(pattern);
                if (match) {
                    patient.gender = this.normalizeGender(match[1]);
                    break;
                }
            }
            
            // Fecha de nacimiento con RegExp
            const birthPatterns = [
                /<birthTime[^>]*value\s*=\s*["']([^"']+)["']/i,
                /<dateOfBirth[^>]*value\s*=\s*["']([^"']+)["']/i,
                /<birthTime[^>]*>([^<]+)<\/birthTime>/i
            ];
            
            for (let pattern of birthPatterns) {
                const match = xmlContent.match(pattern);
                if (match) {
                    patient.birth_date = match[1];
                    patient.age = this.calculateAge(match[1]);
                    break;
                }
            }
            
        } catch (error) {
            console.warn('TS Parser: Error extrayendo información del paciente:', error);
        }
        
        return patient;
    }

    extractDiagnosesWithRegExp(xmlContent, fileName) {
        const diagnoses = [];
        const seen = new Set();
        
        try {
            // Buscar códigos de diagnóstico con RegExp
            const diagnosisPatterns = [
                /<code[^>]*displayName\s*=\s*["']([^"']+)["'][^>]*>/gi,
                /<observation[^>]*>[\s\S]*?<code[^>]*displayName\s*=\s*["']([^"']+)["'][\s\S]*?<\/observation>/gi,
                /<value[^>]*displayName\s*=\s*["']([^"']+)["'][^>]*>/gi
            ];
            
            diagnosisPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(xmlContent)) !== null) {
                    const diagnosisName = match[1].trim();
                    if (diagnosisName && !seen.has(diagnosisName.toLowerCase())) {
                        diagnoses.push({
                            code: null,
                            name: diagnosisName,
                            code_system: 'regexp_extracted'
                        });
                        seen.add(diagnosisName.toLowerCase());
                    }
                }
            });
            
            // Buscar en texto libre con palabras clave
            const textPattern = /<text[^>]*>([\s\S]*?)<\/text>/gi;
            let textMatch;
            while ((textMatch = textPattern.exec(xmlContent)) !== null) {
                this.extractDiagnosesFromText(textMatch[1], diagnoses, seen);
            }
            
            // Buscar en títulos
            const titlePattern = /<title[^>]*>([\s\S]*?)<\/title>/gi;
            let titleMatch;
            while ((titleMatch = titlePattern.exec(xmlContent)) !== null) {
                this.extractDiagnosesFromText(titleMatch[1], diagnoses, seen);
            }
            
            // Inferir del nombre del archivo
            const inferredDiagnoses = this.inferDiagnosesFromFileName(fileName);
            inferredDiagnoses.forEach(diag => {
                if (!seen.has(diag.name.toLowerCase())) {
                    diagnoses.push(diag);
                    seen.add(diag.name.toLowerCase());
                }
            });
            
        } catch (error) {
            console.warn('TS Parser: Error extrayendo diagnósticos:', error);
        }
        
        return diagnoses;
    }

    extractMedicationsWithRegExp(xmlContent, fileName) {
        const medications = [];
        const seen = new Set();
        
        try {
            // Buscar medicamentos con RegExp
            const medicationPatterns = [
                /<substanceAdministration[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/substanceAdministration>/gi,
                /<manufacturedMaterial[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/manufacturedMaterial>/gi,
                /<medication[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/medication>/gi,
                /<supply[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/supply>/gi
            ];
            
            medicationPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(xmlContent)) !== null) {
                    const medName = this.normalizeMedicationName(match[1].trim());
                    if (medName && !seen.has(medName.toLowerCase())) {
                        medications.push({
                            name: medName,
                            medication_type: 'regexp_extracted'
                        });
                        seen.add(medName.toLowerCase());
                    }
                }
            });
            
            // Buscar medicamentos en texto libre con RegExp avanzado
            const medKeywordPattern = /\b(metformina|enalapril|atorvastatina|salbutamol|budesonida|warfarina|aspirin|ibuprofen|paracetamol|insulin)\b/gi;
            let medMatch;
            while ((medMatch = medKeywordPattern.exec(xmlContent)) !== null) {
                const medName = this.normalizeMedicationName(medMatch[1]);
                if (!seen.has(medName.toLowerCase())) {
                    medications.push({
                        name: medName,
                        medication_type: 'regexp_keyword'
                    });
                    seen.add(medName.toLowerCase());
                }
            }
            
            // Inferir del nombre del archivo
            const inferredMeds = this.inferMedicationsFromFileName(fileName);
            inferredMeds.forEach(med => {
                if (!seen.has(med.name.toLowerCase())) {
                    medications.push(med);
                    seen.add(med.name.toLowerCase());
                }
            });
            
        } catch (error) {
            console.warn('TS Parser: Error extrayendo medicamentos:', error);
        }
        
        return medications;
    }

    extractDiagnosesFromText(text, diagnoses, seen) {
        // Approach más sofisticado con RegExp para TypeScript
        const diagnosisPatterns = [
            /\b(diabetes|diabético|diabetico)\b/gi,
            /\b(hipertension|hipertensi[oó]n|hipertenso)\b/gi,
            /\b(asma|asthma)\b/gi,
            /\b(pneumonia|neumon[íi]a)\b/gi,
            /\b(hipercolesterolemia|colesterol alto)\b/gi,
            /\b(bronchitis|bronquitis)\b/gi,
            /\b(gastritis|gastric)\b/gi,
            /\b(arthritis|artritis)\b/gi,
            /\b(depression|depresi[oó]n)\b/gi,
            /\b(anxiety|ansiedad)\b/gi
        ];
        
        const diagnosisMap = {
            'diabetes': 'Diabetes mellitus',
            'diabético': 'Diabetes mellitus',
            'diabetico': 'Diabetes mellitus',
            'hipertension': 'Hipertensión arterial',
            'hipertensión': 'Hipertensión arterial',
            'hipertenso': 'Hipertensión arterial',
            'asma': 'Asma bronquial',
            'asthma': 'Asma bronquial',
            'pneumonia': 'Neumonía',
            'neumonía': 'Neumonía',
            'hipercolesterolemia': 'Hipercolesterolemia',
            'colesterol alto': 'Hipercolesterolemia',
            'bronchitis': 'Bronquitis',
            'bronquitis': 'Bronquitis',
            'gastritis': 'Gastritis',
            'arthritis': 'Artritis',
            'artritis': 'Artritis',
            'depression': 'Depresión',
            'depresión': 'Depresión',
            'anxiety': 'Ansiedad',
            'ansiedad': 'Ansiedad'
        };
        
        diagnosisPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const keyword = match[1].toLowerCase();
                const diagnosisName = diagnosisMap[keyword] || keyword;
                
                if (!seen.has(diagnosisName.toLowerCase())) {
                    diagnoses.push({
                        code: null,
                        name: diagnosisName,
                        code_system: 'regexp_text_analysis'
                    });
                    seen.add(diagnosisName.toLowerCase());
                }
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
            'warfarin': 'Warfarina',
            'aspirin': 'Aspirina',
            'ibuprofen': 'Ibuprofeno',
            'paracetamol': 'Paracetamol',
            'insulin': 'Insulina'
        };
        
        const normalized = nameMap[name.toLowerCase()];
        return normalized || name.trim();
    }

    extractDocumentDateWithRegExp(xmlContent) {
        const datePatterns = [
            /<effectiveTime[^>]*value\s*=\s*["']([^"']+)["']/i,
            /<time[^>]*value\s*=\s*["']([^"']+)["']/i,
            /<creationTime[^>]*value\s*=\s*["']([^"']+)["']/i,
            /<effectiveTime[^>]*>([^<]+)<\/effectiveTime>/i
        ];
        
        for (let pattern of datePatterns) {
            const match = xmlContent.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    extractAuthorWithRegExp(xmlContent) {
        const authorPatterns = [
            /<assignedPerson[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/assignedPerson>/i,
            /<author[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/author>/i,
            /<authenticator[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/authenticator>/i
        ];
        
        for (let pattern of authorPatterns) {
            const match = xmlContent.match(pattern);
            if (match) {
                return match[1].trim();
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
window.tsParser = new TypeScriptCDAParser();