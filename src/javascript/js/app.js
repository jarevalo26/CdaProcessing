class CDAProcessor {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
    }

    async processDocument(xmlContent) {
        this.startTime = performance.now();

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Verificar errores de parsing
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Error al parsear XML: ' + parseError.textContent);
            }

            const validation = this.validateCDA(xmlDoc);
            const clinicalData = this.extractClinicalData(xmlDoc);
            const structure = this.analyzeStructure(xmlDoc);

            this.endTime = performance.now();

            return {
                validation,
                clinicalData,
                structure,
                performanceTime: this.endTime - this.startTime
            };
        } catch (error) {
            this.endTime = performance.now();
            throw error;
        }
    }

    validateCDA(xmlDoc) {
        const validations = [];

        // Validar raíz ClinicalDocument
        const root = xmlDoc.querySelector('ClinicalDocument');
        validations.push({
            rule: 'Elemento raíz ClinicalDocument',
            valid: !!root,
            message: root ? 'Elemento raíz válido' : 'Falta elemento raíz ClinicalDocument'
        });

        if (root) {
            // Validar namespace
            const namespace = root.getAttribute('xmlns');
            validations.push({
                rule: 'Namespace HL7 CDA',
                valid: namespace && namespace.includes('hl7.org'),
                message: namespace ? `Namespace: ${namespace}` : 'Namespace HL7 requerido'
            });

            // Validar elementos requeridos
            const requiredElements = [
                'typeId', 'templateId', 'id', 'code', 'title',
                'effectiveTime', 'confidentialityCode', 'languageCode'
            ];

            requiredElements.forEach(element => {
                const found = root.querySelector(element);
                validations.push({
                    rule: `Elemento ${element}`,
                    valid: !!found,
                    message: found ? `${element} presente` : `${element} faltante`
                });
            });

            // Validar estructura de paciente
            const patient = root.querySelector('recordTarget patient');
            validations.push({
                rule: 'Información del paciente',
                valid: !!patient,
                message: patient ? 'Paciente identificado' : 'Información del paciente faltante'
            });

            // Validar autor
            const author = root.querySelector('author');
            validations.push({
                rule: 'Información del autor',
                valid: !!author,
                message: author ? 'Autor identificado' : 'Información del autor faltante'
            });
        }

        return validations;
    }

    extractClinicalData(xmlDoc) {
        const data = {};

        // Información del documento
        const clinicalDoc = xmlDoc.querySelector('ClinicalDocument');
        if (clinicalDoc) {
            data.documentId = this.getElementText(clinicalDoc, 'id');
            data.title = this.getElementText(clinicalDoc, 'title');
            data.effectiveTime = this.getElementText(clinicalDoc, 'effectiveTime');
            data.confidentiality = this.getElementText(clinicalDoc, 'confidentialityCode');
        }

        // Información del paciente
        const patient = xmlDoc.querySelector('recordTarget patient');
        if (patient) {
            data.patient = {
                id: this.getElementText(patient.parentElement, 'id'),
                name: this.extractPatientName(patient),
                gender: this.getElementText(patient, 'administrativeGenderCode'),
                birthTime: this.getElementText(patient, 'birthTime'),
                address: this.extractAddress(patient)
            };
        }

        // Información del autor
        const author = xmlDoc.querySelector('author');
        if (author) {
            data.author = {
                time: this.getElementText(author, 'time'),
                name: this.extractAuthorName(author),
                organization: this.getElementText(author, 'representedOrganization name')
            };
        }

        // Secciones clínicas
        const sections = xmlDoc.querySelectorAll('section');
        data.sections = Array.from(sections).map(section => ({
            code: this.getAttributeValue(section, 'code', 'code'),
            title: this.getElementText(section, 'title'),
            text: this.getElementText(section, 'text'),
            entries: section.querySelectorAll('entry').length
        }));

        return data;
    }

    analyzeStructure(xmlDoc) {
        const stats = {
            totalElements: xmlDoc.querySelectorAll('*').length,
            sections: xmlDoc.querySelectorAll('section').length,
            entries: xmlDoc.querySelectorAll('entry').length,
            observations: xmlDoc.querySelectorAll('observation').length,
            procedures: xmlDoc.querySelectorAll('procedure').length,
            medications: xmlDoc.querySelectorAll('substanceAdministration').length,
            depth: this.calculateMaxDepth(xmlDoc.documentElement),
            namespaces: this.extractNamespaces(xmlDoc)
        };

        return stats;
    }

    // Métodos auxiliares
    getElementText(parent, selector) {
        const element = parent?.querySelector(selector);
        return element?.textContent?.trim() ||
            element?.getAttribute('value') ||
            element?.getAttribute('displayName') ||
            'No especificado';
    }

    getAttributeValue(parent, selector, attribute) {
        const element = parent?.querySelector(selector);
        return element?.getAttribute(attribute) || 'No especificado';
    }

    extractPatientName(patient) {
        const name = patient.querySelector('name');
        if (!name) return 'No especificado';

        const given = name.querySelector('given')?.textContent || '';
        const family = name.querySelector('family')?.textContent || '';
        return `${given} ${family}`.trim() || 'No especificado';
    }

    extractAuthorName(author) {
        const name = author.querySelector('assignedPerson name');
        if (!name) return 'No especificado';

        const given = name.querySelector('given')?.textContent || '';
        const family = name.querySelector('family')?.textContent || '';
        return `${given} ${family}`.trim() || 'No especificado';
    }

    extractAddress(patient) {
        const addr = patient.querySelector('addr');
        if (!addr) return 'No especificado';

        const streetAddressLine = addr.querySelector('streetAddressLine')?.textContent || '';
        const city = addr.querySelector('city')?.textContent || '';
        const state = addr.querySelector('state')?.textContent || '';

        return `${streetAddressLine}, ${city}, ${state}`.replace(/^,\s*|,\s*$/g, '') || 'No especificado';
    }

    calculateMaxDepth(element, depth = 0) {
        let maxDepth = depth;
        for (const child of element.children) {
            const childDepth = this.calculateMaxDepth(child, depth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
        }
        return maxDepth;
    }

    extractNamespaces(xmlDoc) {
        const namespaces = [];
        const root = xmlDoc.documentElement;
        for (const attr of root.attributes) {
            if (attr.name.startsWith('xmlns')) {
                namespaces.push(`${attr.name}: ${attr.value}`);
            }
        }
        return namespaces;
    }
}

const processor = new CDAProcessor();

async function processDocument() {
    const fileInput = document.getElementById('cdaFile');
    
    if (fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo CDA.');
        return;
    }

    try {
        const file = fileInput.files[0];
        const xmlContent = await file.text();
        const results = await processor.processDocument(xmlContent);
        displayResults(results);
    } catch (error) {
        alert('Error al procesar el documento: ' + error.message);
    }
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.className = 'results';

    resultsDiv.innerHTML = `
        <div class="result-card">
            <div class="performance">
                ⚡ Tiempo de procesamiento: ${results.performanceTime.toFixed(2)} ms
            </div>
            <h3>🔍 Validación del Documento</h3>
            ${results.validation.map(v => `
                <div class="validation-item ${v.valid ? 'valid' : 'invalid'}">
                    <span class="status-icon">${v.valid ? '✅' : '❌'}</span>
                    <div>
                        <strong>${v.rule}</strong><br>
                        <small>${v.message}</small>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="result-card">
            <h3>👤 Datos Clínicos Extraídos</h3>
            <div class="data-grid">
                <div class="data-label">ID Documento:</div>
                <div class="data-value">${results.clinicalData.documentId || 'N/A'}</div>
                <div class="data-label">Título:</div>
                <div class="data-value">${results.clinicalData.title || 'N/A'}</div>
                <div class="data-label">Fecha Efectiva:</div>
                <div class="data-value">${results.clinicalData.effectiveTime || 'N/A'}</div>
                <div class="data-label">Paciente:</div>
                <div class="data-value">${results.clinicalData.patient?.name || 'N/A'}</div>
                <div class="data-label">Género:</div>
                <div class="data-value">${results.clinicalData.patient?.gender || 'N/A'}</div>
                <div class="data-label">Fecha Nacimiento:</div>
                <div class="data-value">${results.clinicalData.patient?.birthTime || 'N/A'}</div>
                <div class="data-label">Autor:</div>
                <div class="data-value">${results.clinicalData.author?.name || 'N/A'}</div>
            </div>
        </div>

        <div class="result-card">
            <h3>📊 Análisis Estructural</h3>
            <div class="data-grid">
                <div class="data-label">Total Elementos:</div>
                <div class="data-value">${results.structure.totalElements}</div>
                <div class="data-label">Secciones:</div>
                <div class="data-value">${results.structure.sections}</div>
                <div class="data-label">Entradas:</div>
                <div class="data-value">${results.structure.entries}</div>
                <div class="data-label">Observaciones:</div>
                <div class="data-value">${results.structure.observations}</div>
                <div class="data-label">Procedimientos:</div>
                <div class="data-value">${results.structure.procedures}</div>
                <div class="data-label">Medicamentos:</div>
                <div class="data-value">${results.structure.medications}</div>
                <div class="data-label">Profundidad XML:</div>
                <div class="data-value">${results.structure.depth}</div>
            </div>
        </div>

        <div class="result-card">
            <h3>📋 Secciones del Documento</h3>
            ${results.clinicalData.sections?.map(section => `
                <div class="validation-item valid" style="margin-bottom: 10px;">
                    <span class="status-icon">📄</span>
                    <div>
                        <strong>${section.title}</strong><br>
                        <small>Código: ${section.code} | Entradas: ${section.entries}</small>
                    </div>
                </div>
            `).join('') || '<p>No se encontraron secciones</p>'}
        </div>
    `;

    // Limpiar el archivo seleccionado después de mostrar resultados
    document.getElementById('cdaFile').value = '';

    // Si implementaste el feedback visual, también limpiarlo:
    const selectedFileDiv = document.getElementById('selectedFile');
    if (selectedFileDiv) {
        selectedFileDiv.textContent = '';
        selectedFileDiv.className = 'selected-file';
    }

    // Si cambiaste el texto del label, restaurarlo:
    const label = document.querySelector('label[for="cdaFile"]');
    if (label) {
        label.textContent = 'Seleccionar archivo CDA (XML)';
        label.style.background = 'var(--gradient-primary)';
    }
}

function clearResults() {
    document.getElementById('results').className = 'results hidden';
    document.getElementById('cdaFile').value = '';
    // Si implementaste el feedback visual, también limpiarlo:
    const selectedFileDiv = document.getElementById('selectedFile');
    if (selectedFileDiv) {
        selectedFileDiv.textContent = '';
        selectedFileDiv.className = 'selected-file';
    }

    // Si cambiaste el texto del label, restaurarlo:
    const label = document.querySelector('label[for="cdaFile"]');
    if (label) {
        label.textContent = 'Seleccionar archivo CDA (XML)';
        label.style.background = 'var(--gradient-primary)';
    }
}

// Event listener simplificado
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cdaFile').addEventListener('change', function (e) {
        const selectedFileDiv = document.getElementById('selectedFile');
        if (e.target.files.length > 0) {
            const fileName = e.target.files[0].name;
            selectedFileDiv.textContent = `Archivo seleccionado: ${fileName}`;
            selectedFileDiv.className = 'selected-file show';
        } else {
            selectedFileDiv.textContent = '';
            selectedFileDiv.className = 'selected-file';
        }
    });
});