var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class CDASemanticAnalyzer {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.terminologySystems = new Map([
            ['2.16.840.1.113883.6.1', 'LOINC'],
            ['2.16.840.1.113883.6.88', 'RxNorm'],
            ['2.16.840.1.113883.6.96', 'SNOMED CT'],
            ['2.16.840.1.113883.6.12', 'CPT'],
            ['2.16.840.1.113883.6.103', 'ICD-9-CM'],
            ['2.16.840.1.113883.6.90', 'ICD-10-CM'],
            ['2.16.840.1.113883.5.1', 'HL7 Administrative Gender'],
            ['2.16.840.1.113883.5.25', 'HL7 Confidentiality'],
            ['2.16.840.1.113883.5.83', 'HL7 Observation Interpretation']
        ]);
        this.templateDescriptions = new Map([
            ['2.16.840.1.113883.10.20.1', 'CCD Document'],
            ['2.16.840.1.113883.10.20.1.11', 'Medications Section'],
            ['2.16.840.1.113883.10.20.1.8', 'Allergies Section'],
            ['2.16.840.1.113883.10.20.1.3', 'Problems Section'],
            ['2.16.840.1.113883.10.20.1.12', 'Procedures Section'],
            ['2.16.840.1.113883.10.20.1.14', 'Results Section'],
            ['2.16.840.1.113883.10.20.1.16', 'Vital Signs Section']
        ]);
    }
    parseDocument(xmlContent) {
        return __awaiter(this, void 0, void 0, function* () {
            this.startTime = performance.now();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Error al parsear XML: ' + parseError.textContent);
            }
            return this.extractCDAStructure(xmlDoc);
        });
    }
    extractCDAStructure(xmlDoc) {
        const root = xmlDoc.querySelector('ClinicalDocument');
        if (!root) {
            throw new Error('No se encontró elemento ClinicalDocument');
        }
        const cda = {};
        cda.typeId = this.extractTypeId(root);
        cda.templateId = this.extractTemplateIds(root);
        cda.id = this.extractId(root.querySelector('id'));
        cda.code = this.extractCode(root.querySelector('code'));
        cda.title = this.getTextContent(root, 'title');
        cda.effectiveTime = this.extractEffectiveTime(root.querySelector('effectiveTime'));
        cda.confidentialityCode = this.extractCode(root.querySelector('confidentialityCode'));
        cda.languageCode = this.extractCode(root.querySelector('languageCode'));
        cda.recordTarget = this.extractRecordTargets(root);
        cda.author = this.extractAuthors(root);
        const custodianEl = root.querySelector('custodian');
        if (custodianEl) {
            cda.custodian = this.extractCustodian(custodianEl);
        }
        const componentEl = root.querySelector('component');
        if (componentEl) {
            cda.component = this.extractComponent(componentEl);
        }
        return cda;
    }
    extractTypeId(root) {
        const typeIdEl = root.querySelector('typeId');
        if (!typeIdEl)
            return undefined;
        return {
            root: typeIdEl.getAttribute('root') || '',
            extension: typeIdEl.getAttribute('extension') || undefined
        };
    }
    extractTemplateIds(root) {
        const templateIds = Array.from(root.querySelectorAll('templateId'));
        return templateIds.map(el => ({
            root: el.getAttribute('root') || '',
            extension: el.getAttribute('extension') || undefined
        }));
    }
    extractId(element) {
        if (!element)
            return undefined;
        return {
            root: element.getAttribute('root') || '',
            extension: element.getAttribute('extension') || undefined,
            assigningAuthorityName: element.getAttribute('assigningAuthorityName') || undefined
        };
    }
    extractCode(element) {
        if (!element)
            return undefined;
        return {
            code: element.getAttribute('code') || undefined,
            codeSystem: element.getAttribute('codeSystem') || undefined,
            codeSystemName: element.getAttribute('codeSystemName') || undefined,
            displayName: element.getAttribute('displayName') || undefined
        };
    }
    extractEffectiveTime(element) {
        if (!element)
            return undefined;
        return element.getAttribute('value') || element.textContent || undefined;
    }
    getTextContent(parent, selector) {
        var _a;
        const element = parent.querySelector(selector);
        return ((_a = element === null || element === void 0 ? void 0 : element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
    }
    extractRecordTargets(root) {
        const recordTargets = Array.from(root.querySelectorAll('recordTarget'));
        return recordTargets.map(rt => this.extractRecordTarget(rt));
    }
    extractRecordTarget(recordTarget) {
        const patientRoleEl = recordTarget.querySelector('patientRole');
        if (!patientRoleEl) {
            throw new Error('PatientRole no encontrado en recordTarget');
        }
        return {
            patientRole: this.extractPatientRole(patientRoleEl)
        };
    }
    extractPatientRole(patientRoleEl) {
        const patientEl = patientRoleEl.querySelector('patient');
        if (!patientEl) {
            throw new Error('Patient no encontrado en patientRole');
        }
        return {
            id: Array.from(patientRoleEl.querySelectorAll('id')).map(el => this.extractId(el)),
            addr: this.extractAddresses(patientRoleEl),
            telecom: this.extractTelecoms(patientRoleEl),
            patient: this.extractPatient(patientEl)
        };
    }
    extractPatient(patientEl) {
        return {
            name: this.extractNames(patientEl),
            administrativeGenderCode: this.extractCode(patientEl.querySelector('administrativeGenderCode')),
            birthTime: this.extractEffectiveTime(patientEl.querySelector('birthTime')),
            ethnicGroupCode: this.extractCode(patientEl.querySelector('ethnicGroupCode')),
            raceCode: this.extractCode(patientEl.querySelector('raceCode'))
        };
    }
    extractNames(parent) {
        const nameEls = Array.from(parent.querySelectorAll('name'));
        return nameEls.map(nameEl => {
            var _a, _b, _c;
            return ({
                use: nameEl.getAttribute('use') || undefined,
                given: Array.from(nameEl.querySelectorAll('given')).map(el => el.textContent || ''),
                family: ((_a = nameEl.querySelector('family')) === null || _a === void 0 ? void 0 : _a.textContent) || undefined,
                prefix: ((_b = nameEl.querySelector('prefix')) === null || _b === void 0 ? void 0 : _b.textContent) || undefined,
                suffix: ((_c = nameEl.querySelector('suffix')) === null || _c === void 0 ? void 0 : _c.textContent) || undefined
            });
        });
    }
    extractAddresses(parent) {
        const addrEls = Array.from(parent.querySelectorAll('addr'));
        return addrEls.map(addrEl => {
            var _a, _b, _c, _d;
            return ({
                use: addrEl.getAttribute('use') || undefined,
                streetAddressLine: Array.from(addrEl.querySelectorAll('streetAddressLine')).map(el => el.textContent || ''),
                city: ((_a = addrEl.querySelector('city')) === null || _a === void 0 ? void 0 : _a.textContent) || undefined,
                state: ((_b = addrEl.querySelector('state')) === null || _b === void 0 ? void 0 : _b.textContent) || undefined,
                postalCode: ((_c = addrEl.querySelector('postalCode')) === null || _c === void 0 ? void 0 : _c.textContent) || undefined,
                country: ((_d = addrEl.querySelector('country')) === null || _d === void 0 ? void 0 : _d.textContent) || undefined
            });
        });
    }
    extractTelecoms(parent) {
        const telecomEls = Array.from(parent.querySelectorAll('telecom'));
        return telecomEls.map(telecomEl => ({
            use: telecomEl.getAttribute('use') || undefined,
            value: telecomEl.getAttribute('value') || undefined
        }));
    }
    extractAuthors(root) {
        const authorEls = Array.from(root.querySelectorAll('author'));
        return authorEls.map(authorEl => ({
            time: this.extractEffectiveTime(authorEl.querySelector('time')) || '',
            assignedAuthor: this.extractAssignedAuthor(authorEl.querySelector('assignedAuthor'))
        }));
    }
    extractAssignedAuthor(assignedAuthorEl) {
        return {
            id: Array.from(assignedAuthorEl.querySelectorAll('id')).map(el => this.extractId(el)),
            code: this.extractCode(assignedAuthorEl.querySelector('code')),
            addr: this.extractAddresses(assignedAuthorEl),
            telecom: this.extractTelecoms(assignedAuthorEl),
            assignedPerson: this.extractPerson(assignedAuthorEl.querySelector('assignedPerson')),
            representedOrganization: this.extractOrganization(assignedAuthorEl.querySelector('representedOrganization'))
        };
    }
    extractPerson(personEl) {
        if (!personEl)
            return undefined;
        return {
            name: this.extractNames(personEl)
        };
    }
    extractOrganization(orgEl) {
        if (!orgEl)
            return undefined;
        return {
            id: Array.from(orgEl.querySelectorAll('id')).map(el => this.extractId(el)),
            name: Array.from(orgEl.querySelectorAll('name')).map(el => el.textContent || ''),
            telecom: this.extractTelecoms(orgEl),
            addr: this.extractAddresses(orgEl)
        };
    }
    extractCustodian(custodianEl) {
        const assignedCustodianEl = custodianEl.querySelector('assignedCustodian');
        if (!assignedCustodianEl) {
            throw new Error('AssignedCustodian no encontrado');
        }
        return {
            assignedCustodian: {
                representedCustodianOrganization: this.extractOrganization(assignedCustodianEl.querySelector('representedCustodianOrganization'))
            }
        };
    }
    extractComponent(componentEl) {
        const structuredBodyEl = componentEl.querySelector('structuredBody');
        const nonXMLBodyEl = componentEl.querySelector('nonXMLBody');
        if (structuredBodyEl) {
            return {
                structuredBody: this.extractStructuredBody(structuredBodyEl)
            };
        }
        else if (nonXMLBodyEl) {
            return {
                nonXMLBody: {
                    text: nonXMLBodyEl.textContent || ''
                }
            };
        }
        return {};
    }
    extractStructuredBody(structuredBodyEl) {
        const componentEls = Array.from(structuredBodyEl.querySelectorAll(':scope > component'));
        return {
            component: componentEls.map(compEl => ({
                section: this.extractSection(compEl.querySelector('section'))
            }))
        };
    }
    extractSection(sectionEl) {
        return {
            templateId: this.extractTemplateIds(sectionEl),
            id: this.extractId(sectionEl.querySelector('id')),
            code: this.extractCode(sectionEl.querySelector('code')),
            title: this.getTextContent(sectionEl, 'title'),
            text: this.getTextContent(sectionEl, 'text'),
            entry: this.extractEntries(sectionEl),
            component: Array.from(sectionEl.querySelectorAll(':scope > component')).map(compEl => ({
                section: this.extractSection(compEl.querySelector('section'))
            }))
        };
    }
    extractEntries(sectionEl) {
        const entryEls = Array.from(sectionEl.querySelectorAll(':scope > entry'));
        return entryEls.map(entryEl => this.extractEntry(entryEl));
    }
    extractEntry(entryEl) {
        const entry = {
            typeCode: entryEl.getAttribute('typeCode') || undefined,
            contextConductionInd: entryEl.getAttribute('contextConductionInd') === 'true'
        };
        if (entryEl.querySelector('observation')) {
            entry.observation = this.extractObservation(entryEl.querySelector('observation'));
        }
        else if (entryEl.querySelector('substanceAdministration')) {
            entry.substanceAdministration = this.extractSubstanceAdministration(entryEl.querySelector('substanceAdministration'));
        }
        else if (entryEl.querySelector('procedure')) {
            entry.procedure = this.extractProcedure(entryEl.querySelector('procedure'));
        }
        else if (entryEl.querySelector('act')) {
            entry.act = this.extractAct(entryEl.querySelector('act'));
        }
        return entry;
    }
    extractObservation(obsEl) {
        return {
            classCode: obsEl.getAttribute('classCode') || undefined,
            moodCode: obsEl.getAttribute('moodCode') || undefined,
            templateId: this.extractTemplateIds(obsEl),
            id: Array.from(obsEl.querySelectorAll('id')).map(el => this.extractId(el)),
            code: this.extractCode(obsEl.querySelector('code')),
            text: this.getTextContent(obsEl, 'text'),
            statusCode: this.extractCode(obsEl.querySelector('statusCode')),
            effectiveTime: this.extractComplexEffectiveTime(obsEl.querySelector('effectiveTime')),
            value: this.extractObservationValues(obsEl)
        };
    }
    extractSubstanceAdministration(substAdminEl) {
        return {
            classCode: substAdminEl.getAttribute('classCode') || undefined,
            moodCode: substAdminEl.getAttribute('moodCode') || undefined,
            templateId: this.extractTemplateIds(substAdminEl),
            id: Array.from(substAdminEl.querySelectorAll('id')).map(el => this.extractId(el)),
            text: this.getTextContent(substAdminEl, 'text'),
            statusCode: this.extractCode(substAdminEl.querySelector('statusCode')),
            routeCode: this.extractCode(substAdminEl.querySelector('routeCode')),
            doseQuantity: this.extractQuantity(substAdminEl.querySelector('doseQuantity')),
            consumable: this.extractConsumable(substAdminEl.querySelector('consumable'))
        };
    }
    extractProcedure(procEl) {
        return {
            classCode: procEl.getAttribute('classCode') || undefined,
            moodCode: procEl.getAttribute('moodCode') || undefined,
            templateId: this.extractTemplateIds(procEl),
            id: Array.from(procEl.querySelectorAll('id')).map(el => this.extractId(el)),
            code: this.extractCode(procEl.querySelector('code')),
            text: this.getTextContent(procEl, 'text'),
            statusCode: this.extractCode(procEl.querySelector('statusCode')),
            effectiveTime: this.extractComplexEffectiveTime(procEl.querySelector('effectiveTime'))
        };
    }
    extractAct(actEl) {
        return {
            classCode: actEl.getAttribute('classCode') || undefined,
            moodCode: actEl.getAttribute('moodCode') || undefined,
            id: Array.from(actEl.querySelectorAll('id')).map(el => this.extractId(el)),
            code: this.extractCode(actEl.querySelector('code')),
            text: this.getTextContent(actEl, 'text'),
            effectiveTime: this.extractComplexEffectiveTime(actEl.querySelector('effectiveTime'))
        };
    }
    extractComplexEffectiveTime(timeEl) {
        var _a, _b, _c, _d;
        if (!timeEl)
            return undefined;
        return {
            value: timeEl.getAttribute('value') || undefined,
            low: ((_a = timeEl.querySelector('low')) === null || _a === void 0 ? void 0 : _a.getAttribute('value')) || undefined,
            high: ((_b = timeEl.querySelector('high')) === null || _b === void 0 ? void 0 : _b.getAttribute('value')) || undefined,
            center: ((_c = timeEl.querySelector('center')) === null || _c === void 0 ? void 0 : _c.getAttribute('value')) || undefined,
            width: ((_d = timeEl.querySelector('width')) === null || _d === void 0 ? void 0 : _d.getAttribute('value')) || undefined
        };
    }
    extractQuantity(quantEl) {
        if (!quantEl)
            return undefined;
        return {
            value: parseFloat(quantEl.getAttribute('value') || '0') || undefined,
            unit: quantEl.getAttribute('unit') || undefined
        };
    }
    extractConsumable(consumableEl) {
        if (!consumableEl)
            return undefined;
        const manufacturedProductEl = consumableEl.querySelector('manufacturedProduct');
        if (!manufacturedProductEl)
            return undefined;
        return {
            manufacturedProduct: {
                templateId: this.extractTemplateIds(manufacturedProductEl),
                manufacturedMaterial: this.extractManufacturedMaterial(manufacturedProductEl.querySelector('manufacturedMaterial'))
            }
        };
    }
    extractManufacturedMaterial(materialEl) {
        if (!materialEl)
            return undefined;
        return {
            code: this.extractCode(materialEl.querySelector('code')),
            name: this.getTextContent(materialEl, 'name'),
            lotNumberText: this.getTextContent(materialEl, 'lotNumberText')
        };
    }
    extractObservationValues(obsEl) {
        const valueEls = Array.from(obsEl.querySelectorAll('value'));
        return valueEls.map(valueEl => {
            const type = valueEl.getAttribute('xsi:type') || 'ST';
            const value = { type };
            switch (type) {
                case 'PQ':
                    value.value = parseFloat(valueEl.getAttribute('value') || '0');
                    value.unit = valueEl.getAttribute('unit') || undefined;
                    break;
                case 'CD':
                    value.code = valueEl.getAttribute('code') || undefined;
                    value.codeSystem = valueEl.getAttribute('codeSystem') || undefined;
                    value.displayName = valueEl.getAttribute('displayName') || undefined;
                    break;
                case 'ST':
                case 'ED':
                    value.value = valueEl.textContent || undefined;
                    break;
                case 'INT':
                case 'REAL':
                    value.value = parseFloat(valueEl.getAttribute('value') || '0');
                    break;
                case 'TS':
                    value.value = valueEl.getAttribute('value') || undefined;
                    break;
            }
            return value;
        });
    }
    performSemanticAnalysis(cda) {
        return __awaiter(this, void 0, void 0, function* () {
            const analysis = {
                documentType: this.analyzeDocumentType(cda),
                clinicalDomains: this.analyzeClinicalDomains(cda),
                terminologies: this.analyzeTerminologies(cda),
                dataTypes: this.analyzeDataTypes(cda),
                templates: this.analyzeTemplates(cda),
                relationships: this.analyzeClinicalRelationships(cda),
                qualityMetrics: this.calculateQualityMetrics(cda)
            };
            this.endTime = performance.now();
            return analysis;
        });
    }
    analyzeDocumentType(cda) {
        if (!cda.code)
            return 'Tipo desconocido';
        const typeMap = {
            '34133-9': 'Nota de Resumen de Episodio',
            '11488-4': 'Nota de Consulta',
            '18842-5': 'Carta de Alta',
            '11506-3': 'Informe de Progreso',
            '28570-0': 'Documento de Instrucciones Previas'
        };
        return typeMap[cda.code.code || ''] || `Documento CDA (${cda.code.displayName || cda.code.code})`;
    }
    analyzeClinicalDomains(cda) {
        var _a;
        const domains = new Set();
        if ((_a = cda.component) === null || _a === void 0 ? void 0 : _a.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                var _a;
                const section = comp.section;
                if ((_a = section.code) === null || _a === void 0 ? void 0 : _a.code) {
                    const domain = this.mapCodeToDomain(section.code.code);
                    if (domain)
                        domains.add(domain);
                }
            });
        }
        return Array.from(domains);
    }
    mapCodeToDomain(code) {
        const domainMap = {
            '10160-0': 'Farmacología',
            '48765-2': 'Alergias e Intolerancias',
            '11450-4': 'Lista de Problemas',
            '47519-4': 'Procedimientos',
            '30954-2': 'Resultados de Laboratorio',
            '8716-3': 'Signos Vitales',
            '46240-8': 'Historia de Encuentros',
            '10157-6': 'Historia Familiar',
            '10164-2': 'Historia Social'
        };
        return domainMap[code] || null;
    }
    analyzeTerminologies(cda) {
        const terminologies = new Map();
        this.collectCodes(cda, (code) => {
            if (code.codeSystem) {
                if (!terminologies.has(code.codeSystem)) {
                    terminologies.set(code.codeSystem, { codes: [], count: 0 });
                }
                const entry = terminologies.get(code.codeSystem);
                entry.codes.push(code);
                entry.count++;
            }
        });
        return Array.from(terminologies.entries()).map(([system, data]) => ({
            system,
            systemName: this.terminologySystems.get(system) || 'Sistema desconocido',
            codesCount: data.count,
            samples: data.codes.slice(0, 5)
        }));
    }
    analyzeDataTypes(cda) {
        var _a;
        const dataTypes = new Map();
        const descriptions = {
            'CD': 'Datos Codificados',
            'PQ': 'Cantidad Física',
            'ST': 'Cadena de Texto',
            'TS': 'Marca de Tiempo',
            'INT': 'Número Entero',
            'REAL': 'Número Real',
            'ED': 'Datos Encapsulados'
        };
        if ((_a = cda.component) === null || _a === void 0 ? void 0 : _a.structuredBody) {
            this.collectObservationValues(cda.component.structuredBody, (value) => {
                const count = dataTypes.get(value.type) || 0;
                dataTypes.set(value.type, count + 1);
            });
        }
        return Array.from(dataTypes.entries()).map(([type, count]) => ({
            type,
            count,
            description: descriptions[type] || 'Tipo desconocido'
        }));
    }
    analyzeTemplates(cda) {
        const templates = new Map();
        this.collectTemplates(cda, (templateId) => {
            const count = templates.get(templateId.root) || 0;
            templates.set(templateId.root, count + 1);
        });
        return Array.from(templates.entries()).map(([oid, count]) => ({
            oid,
            name: this.templateDescriptions.get(oid) || 'Plantilla desconocida',
            count,
            description: `Usado ${count} veces en el documento`
        }));
    }
    analyzeClinicalRelationships(cda) {
        var _a;
        const relationships = [];
        if ((_a = cda.component) === null || _a === void 0 ? void 0 : _a.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                const section = comp.section;
                if (section.entry) {
                    section.entry.forEach(entry => {
                        var _a, _b, _c, _d, _e;
                        if ((_a = entry.observation) === null || _a === void 0 ? void 0 : _a.value) {
                            entry.observation.value.forEach(value => {
                                var _a, _b;
                                if (value.type === 'CD' && value.code) {
                                    relationships.push({
                                        type: 'Observación-Código',
                                        source: ((_b = (_a = entry.observation) === null || _a === void 0 ? void 0 : _a.code) === null || _b === void 0 ? void 0 : _b.displayName) || 'Observación',
                                        target: value.displayName || value.code,
                                        description: 'Observación clínica con valor codificado'
                                    });
                                }
                            });
                        }
                        if ((_e = (_d = (_c = (_b = entry.substanceAdministration) === null || _b === void 0 ? void 0 : _b.consumable) === null || _c === void 0 ? void 0 : _c.manufacturedProduct) === null || _d === void 0 ? void 0 : _d.manufacturedMaterial) === null || _e === void 0 ? void 0 : _e.code) {
                            const medication = entry.substanceAdministration.consumable.manufacturedProduct.manufacturedMaterial;
                            relationships.push({
                                type: 'Paciente-Medicamento',
                                source: 'Paciente',
                                target: medication.code.displayName || medication.code.code || 'Medicamento',
                                description: 'Administración de medicamento al paciente'
                            });
                        }
                    });
                }
            });
        }
        return relationships.slice(0, 10);
    }
    calculateQualityMetrics(cda) {
        var _a, _b, _c, _d, _e, _f, _g;
        let completenessScore = 0;
        let consistencyScore = 0;
        let standardsCompliance = 0;
        let dataRichness = 0;
        const requiredFields = ['id', 'code', 'title', 'effectiveTime', 'recordTarget', 'author'];
        const presentFields = requiredFields.filter(field => cda[field]);
        completenessScore = (presentFields.length / requiredFields.length) * 100;
        if (((_a = cda.typeId) === null || _a === void 0 ? void 0 : _a.root) === '2.16.840.1.113883.1.3')
            standardsCompliance += 25;
        if ((_b = cda.templateId) === null || _b === void 0 ? void 0 : _b.length)
            standardsCompliance += 25;
        if ((_e = (_d = (_c = cda.recordTarget) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.patientRole) === null || _e === void 0 ? void 0 : _e.patient)
            standardsCompliance += 25;
        if ((_f = cda.component) === null || _f === void 0 ? void 0 : _f.structuredBody)
            standardsCompliance += 25;
        let totalEntries = 0;
        let codedEntries = 0;
        if ((_g = cda.component) === null || _g === void 0 ? void 0 : _g.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                if (comp.section.entry) {
                    totalEntries += comp.section.entry.length;
                    comp.section.entry.forEach(entry => {
                        var _a, _b, _c, _d, _e, _f;
                        if (((_a = entry.observation) === null || _a === void 0 ? void 0 : _a.code) || ((_b = entry.procedure) === null || _b === void 0 ? void 0 : _b.code) ||
                            ((_f = (_e = (_d = (_c = entry.substanceAdministration) === null || _c === void 0 ? void 0 : _c.consumable) === null || _d === void 0 ? void 0 : _d.manufacturedProduct) === null || _e === void 0 ? void 0 : _e.manufacturedMaterial) === null || _f === void 0 ? void 0 : _f.code)) {
                            codedEntries++;
                        }
                    });
                }
            });
        }
        dataRichness = totalEntries > 0 ? (codedEntries / totalEntries) * 100 : 0;
        consistencyScore = (completenessScore + standardsCompliance + dataRichness) / 3;
        return {
            completenessScore: Math.round(completenessScore),
            consistencyScore: Math.round(consistencyScore),
            standardsCompliance: Math.round(standardsCompliance),
            dataRichness: Math.round(dataRichness)
        };
    }
    collectCodes(obj, callback) {
        if (obj && typeof obj === 'object') {
            if (obj.code && obj.codeSystem) {
                callback(obj);
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item) => this.collectCodes(item, callback));
                    }
                    else {
                        this.collectCodes(obj[key], callback);
                    }
                }
            }
        }
    }
    collectTemplates(obj, callback) {
        if (obj && typeof obj === 'object') {
            if (obj.templateId) {
                if (Array.isArray(obj.templateId)) {
                    obj.templateId.forEach((tid) => callback(tid));
                }
                else {
                    callback(obj.templateId);
                }
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item) => this.collectTemplates(item, callback));
                    }
                    else {
                        this.collectTemplates(obj[key], callback);
                    }
                }
            }
        }
    }
    collectObservationValues(obj, callback) {
        if (obj && typeof obj === 'object') {
            if (obj.value && Array.isArray(obj.value) && obj.value.length > 0 && obj.value[0].type) {
                obj.value.forEach((val) => callback(val));
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item) => this.collectObservationValues(item, callback));
                    }
                    else {
                        this.collectObservationValues(obj[key], callback);
                    }
                }
            }
        }
    }
    getProcessingTime() {
        return this.endTime - this.startTime;
    }
}
class CDATransformer {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
    }
    transformToJSON(cda) {
        return __awaiter(this, void 0, void 0, function* () {
            this.startTime = performance.now();
            const transformed = {
                meta: {
                    transformedAt: new Date().toISOString(),
                    version: '1.0',
                    format: 'CDA-to-JSON'
                },
                document: this.transformDocument(cda),
                patient: this.transformPatient(cda),
                clinical: this.transformClinicalContent(cda),
                structure: this.transformStructure(cda)
            };
            this.endTime = performance.now();
            return transformed;
        });
    }
    transformDocument(cda) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return {
            id: ((_a = cda.id) === null || _a === void 0 ? void 0 : _a.root) + (((_b = cda.id) === null || _b === void 0 ? void 0 : _b.extension) ? '^' + cda.id.extension : ''),
            title: cda.title,
            type: {
                code: (_c = cda.code) === null || _c === void 0 ? void 0 : _c.code,
                display: (_d = cda.code) === null || _d === void 0 ? void 0 : _d.displayName,
                system: (_e = cda.code) === null || _e === void 0 ? void 0 : _e.codeSystem
            },
            date: cda.effectiveTime,
            confidentiality: (_f = cda.confidentialityCode) === null || _f === void 0 ? void 0 : _f.code,
            language: (_g = cda.languageCode) === null || _g === void 0 ? void 0 : _g.code,
            templates: (_h = cda.templateId) === null || _h === void 0 ? void 0 : _h.map(t => t.root)
        };
    }
    transformPatient(cda) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const recordTarget = (_a = cda.recordTarget) === null || _a === void 0 ? void 0 : _a[0];
        if (!recordTarget)
            return null;
        const patient = recordTarget.patientRole.patient;
        const name = (_b = patient.name) === null || _b === void 0 ? void 0 : _b[0];
        const address = (_c = recordTarget.patientRole.addr) === null || _c === void 0 ? void 0 : _c[0];
        return {
            id: (_e = (_d = recordTarget.patientRole.id) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.extension,
            name: {
                given: (_f = name === null || name === void 0 ? void 0 : name.given) === null || _f === void 0 ? void 0 : _f.join(' '),
                family: name === null || name === void 0 ? void 0 : name.family,
                full: (((_g = name === null || name === void 0 ? void 0 : name.given) === null || _g === void 0 ? void 0 : _g.join(' ')) + ' ' + (name === null || name === void 0 ? void 0 : name.family)).trim()
            },
            gender: (_h = patient.administrativeGenderCode) === null || _h === void 0 ? void 0 : _h.displayName,
            birthDate: patient.birthTime,
            address: address ? {
                street: (_j = address.streetAddressLine) === null || _j === void 0 ? void 0 : _j.join(', '),
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country
            } : null
        };
    }
    transformClinicalContent(cda) {
        var _a;
        if (!((_a = cda.component) === null || _a === void 0 ? void 0 : _a.structuredBody))
            return null;
        const sections = cda.component.structuredBody.component.map(comp => {
            var _a, _b, _c;
            const section = comp.section;
            return {
                title: section.title,
                code: (_a = section.code) === null || _a === void 0 ? void 0 : _a.code,
                display: (_b = section.code) === null || _b === void 0 ? void 0 : _b.displayName,
                text: section.text,
                entries: ((_c = section.entry) === null || _c === void 0 ? void 0 : _c.map(entry => this.transformEntry(entry))) || []
            };
        });
        return { sections };
    }
    transformEntry(entry) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        if (entry.observation) {
            return {
                type: 'observation',
                code: (_a = entry.observation.code) === null || _a === void 0 ? void 0 : _a.code,
                display: (_b = entry.observation.code) === null || _b === void 0 ? void 0 : _b.displayName,
                value: (_c = entry.observation.value) === null || _c === void 0 ? void 0 : _c.map(v => ({
                    type: v.type,
                    value: v.value,
                    unit: v.unit,
                    display: v.displayName
                })),
                status: (_d = entry.observation.statusCode) === null || _d === void 0 ? void 0 : _d.code,
                effectiveTime: (_e = entry.observation.effectiveTime) === null || _e === void 0 ? void 0 : _e.value
            };
        }
        if (entry.substanceAdministration) {
            const med = (_g = (_f = entry.substanceAdministration.consumable) === null || _f === void 0 ? void 0 : _f.manufacturedProduct) === null || _g === void 0 ? void 0 : _g.manufacturedMaterial;
            return {
                type: 'medication',
                medication: {
                    code: (_h = med === null || med === void 0 ? void 0 : med.code) === null || _h === void 0 ? void 0 : _h.code,
                    display: (_j = med === null || med === void 0 ? void 0 : med.code) === null || _j === void 0 ? void 0 : _j.displayName,
                    name: med === null || med === void 0 ? void 0 : med.name
                },
                dose: {
                    value: (_k = entry.substanceAdministration.doseQuantity) === null || _k === void 0 ? void 0 : _k.value,
                    unit: (_l = entry.substanceAdministration.doseQuantity) === null || _l === void 0 ? void 0 : _l.unit
                },
                route: (_m = entry.substanceAdministration.routeCode) === null || _m === void 0 ? void 0 : _m.displayName,
                status: (_o = entry.substanceAdministration.statusCode) === null || _o === void 0 ? void 0 : _o.code
            };
        }
        if (entry.procedure) {
            return {
                type: 'procedure',
                code: (_p = entry.procedure.code) === null || _p === void 0 ? void 0 : _p.code,
                display: (_q = entry.procedure.code) === null || _q === void 0 ? void 0 : _q.displayName,
                status: (_r = entry.procedure.statusCode) === null || _r === void 0 ? void 0 : _r.code,
                effectiveTime: (_s = entry.procedure.effectiveTime) === null || _s === void 0 ? void 0 : _s.value
            };
        }
        return {
            type: 'unknown',
            raw: entry
        };
    }
    transformStructure(cda) {
        var _a, _b;
        let totalElements = 0;
        let codedElements = 0;
        let templateCount = 0;
        this.countElements(cda, (hasCode, hasTemplate) => {
            totalElements++;
            if (hasCode)
                codedElements++;
            if (hasTemplate)
                templateCount++;
        });
        return {
            totalElements,
            codedElements,
            templateCount,
            codingRatio: totalElements > 0 ? (codedElements / totalElements) : 0,
            sectionsCount: ((_b = (_a = cda.component) === null || _a === void 0 ? void 0 : _a.structuredBody) === null || _b === void 0 ? void 0 : _b.component.length) || 0,
            entriesCount: this.countEntries(cda)
        };
    }
    countElements(obj, callback) {
        if (obj && typeof obj === 'object') {
            const hasCode = !!(obj.code || obj.codeSystem);
            const hasTemplate = !!(obj.templateId);
            callback(hasCode, hasTemplate);
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item) => this.countElements(item, callback));
                    }
                    else {
                        this.countElements(obj[key], callback);
                    }
                }
            }
        }
    }
    countEntries(cda) {
        var _a;
        let count = 0;
        if ((_a = cda.component) === null || _a === void 0 ? void 0 : _a.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                var _a;
                count += ((_a = comp.section.entry) === null || _a === void 0 ? void 0 : _a.length) || 0;
            });
        }
        return count;
    }
    getProcessingTime() {
        return this.endTime - this.startTime;
    }
}
const analyzer = new CDASemanticAnalyzer();
const transformer = new CDATransformer();
function analyzeDocument() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileInput = document.getElementById('cdaFile');
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Por favor, selecciona un archivo CDA.');
            return;
        }
        try {
            const file = fileInput.files[0];
            const xmlContent = yield file.text();
            const cda = yield analyzer.parseDocument(xmlContent);
            const analysis = yield analyzer.performSemanticAnalysis(cda);
            displaySemanticAnalysis(analysis, analyzer.getProcessingTime());
            // Limpiar el nombre del archivo después de mostrar los resultados
            //const selectedFileDiv = document.getElementById('selectedFile')!;
            //selectedFileDiv.textContent = '';
            //selectedFileDiv.classList.remove('show');
        }
        catch (error) {
            alert('Error al analizar el documento: ' + error.message);
        }
    });
}
function transformDocument() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileInput = document.getElementById('cdaFile');
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Por favor, selecciona un archivo CDA.');
            return;
        }
        try {
            const file = fileInput.files[0];
            const xmlContent = yield file.text();
            const cda = yield analyzer.parseDocument(xmlContent);
            const transformed = yield transformer.transformToJSON(cda);
            displayTransformation(transformed, transformer.getProcessingTime());
            // Limpiar el nombre del archivo después de mostrar los resultados
            //const selectedFileDiv = document.getElementById('selectedFile')!;
            //selectedFileDiv.textContent = '';
            //selectedFileDiv.classList.remove('show');
        }
        catch (error) {
            alert('Error al transformar el documento: ' + error.message);
        }
    });
}
function displaySemanticAnalysis(analysis, processingTime) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.className = 'results';
    resultsDiv.innerHTML = `
        <div class="result-card">
            <div class="performance">
                ⚡ Tiempo de análisis: ${processingTime.toFixed(2)} ms
            </div>
            <h3>🎯 Análisis Semántico</h3>
            <div class="semantic-item">
                <div class="semantic-label">Tipo de Documento</div>
                <div class="semantic-value">${analysis.documentType}</div>
            </div>
            <div class="semantic-item">
                <div class="semantic-label">Dominios Clínicos</div>
                <div class="semantic-value">${analysis.clinicalDomains.join(', ') || 'No identificados'}</div>
            </div>
        </div>

        <div class="result-card">
            <h3>📚 Terminologías Utilizadas</h3>
            ${analysis.terminologies.map(term => `
                <div class="terminology-item">
                    <div>
                        <strong>${term.systemName}</strong><br>
                        <small>OID: ${term.system} | Códigos: ${term.codesCount}</small>
                    </div>
                    <span style="background: #9b59b6; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">
                        ${term.codesCount}
                    </span>
                </div>
            `).join('')}
        </div>

        <div class="result-card">
            <h3>🗂️ Plantillas y Estructura</h3>
            ${analysis.templates.map(template => `
                <div class="semantic-item">
                    <div class="semantic-label">${template.name}</div>
                    <div class="semantic-value">OID: ${template.oid} (${template.count} usos)</div>
                </div>
            `).join('')}
        </div>

        <div class="result-card">
            <h3>🔗 Relaciones Clínicas</h3>
            ${analysis.relationships.slice(0, 8).map(rel => `
                <div class="semantic-item">
                    <div class="semantic-label">${rel.type}</div>
                    <div class="semantic-value">${rel.source} → ${rel.target}</div>
                </div>
            `).join('')}
        </div>

        <div class="result-card">
            <h3>📊 Métricas de Calidad</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div class="semantic-item">
                    <div class="semantic-label">Completitud</div>
                    <div class="semantic-value">${analysis.qualityMetrics.completenessScore}%</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Consistencia</div>
                    <div class="semantic-value">${analysis.qualityMetrics.consistencyScore}%</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Cumplimiento Estándares</div>
                    <div class="semantic-value">${analysis.qualityMetrics.standardsCompliance}%</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Riqueza de Datos</div>
                    <div class="semantic-value">${analysis.qualityMetrics.dataRichness}%</div>
                </div>
            </div>
        </div>

        <div class="result-card">
            <h3>💾 Tipos de Datos</h3>
            ${analysis.dataTypes.map(dt => `
                <div class="terminology-item">
                    <div>
                        <strong>${dt.description} (${dt.type})</strong>
                    </div>
                    <span style="background: #27ae60; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">
                        ${dt.count}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}
function displayTransformation(transformed, processingTime) {
    var _a, _b, _c, _d, _e;
    const resultsDiv = document.getElementById('results');
    resultsDiv.className = 'results';
    resultsDiv.innerHTML = `
        <div class="result-card">
            <div class="performance">
                ⚡ Tiempo de transformación: ${processingTime.toFixed(2)} ms
            </div>
            <h3>🔄 Transformación a JSON</h3>
            
            <div class="tab-container">
                <button class="tab active" onclick="showTab('document')">Documento</button>
                <button class="tab" onclick="showTab('patient')">Paciente</button>
                <button class="tab" onclick="showTab('clinical')">Clínico</button>
                <button class="tab" onclick="showTab('raw')">JSON Completo</button>
            </div>

            <div id="tab-document" class="tab-content active">
                <div class="transform-output">
                    <h4>📄 Información del Documento</h4>
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 15px 0;">
                        <strong>ID:</strong> <span>${transformed.document.id || 'N/A'}</span>
                        <strong>Título:</strong> <span>${transformed.document.title || 'N/A'}</span>
                        <strong>Tipo:</strong> <span>${transformed.document.type.display || transformed.document.type.code || 'N/A'}</span>
                        <strong>Fecha:</strong> <span>${transformed.document.date || 'N/A'}</span>
                        <strong>Idioma:</strong> <span>${transformed.document.language || 'N/A'}</span>
                        <strong>Plantillas:</strong> <span>${((_a = transformed.document.templates) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div id="tab-patient" class="tab-content">
                <div class="transform-output">
                    <h4>👤 Información del Paciente</h4>
                    ${transformed.patient ? `
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 15px 0;">
                            <strong>ID:</strong> <span>${transformed.patient.id || 'N/A'}</span>
                            <strong>Nombre:</strong> <span>${transformed.patient.name.full || 'N/A'}</span>
                            <strong>Género:</strong> <span>${transformed.patient.gender || 'N/A'}</span>
                            <strong>Fecha Nacimiento:</strong> <span>${transformed.patient.birthDate || 'N/A'}</span>
                            <strong>Ciudad:</strong> <span>${((_b = transformed.patient.address) === null || _b === void 0 ? void 0 : _b.city) || 'N/A'}</span>
                            <strong>Estado:</strong> <span>${((_c = transformed.patient.address) === null || _c === void 0 ? void 0 : _c.state) || 'N/A'}</span>
                        </div>
                    ` : '<p>No se encontró información del paciente</p>'}
                </div>
            </div>

            <div id="tab-clinical" class="tab-content">
                <div class="transform-output">
                    <h4>🩺 Contenido Clínico</h4>
                    ${((_e = (_d = transformed.clinical) === null || _d === void 0 ? void 0 : _d.sections) === null || _e === void 0 ? void 0 : _e.map((section, index) => `
                        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0;">
                            <h5 style="color: #2c3e50; margin-bottom: 10px;">
                                ${section.title || 'Sección ' + (index + 1)}
                                <span style="font-size: 0.8em; color: #7f8c8d;">(${section.code || 'Sin código'})</span>
                            </h5>
                            <p style="margin-bottom: 10px;">${section.text || 'Sin texto descriptivo'}</p>
                            <strong>Entradas:</strong> ${section.entries.length}
                            ${section.entries.slice(0, 3).map((entry) => `
                                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin: 5px 0; font-size: 0.9em;">
                                    <strong>${entry.type}:</strong> ${entry.display || entry.code || 'Sin descripción'}
                                    ${entry.value ? `<br><em>Valor: ${JSON.stringify(entry.value)}</em>` : ''}
                                </div>
                            `).join('')}
                            ${section.entries.length > 3 ? `<p><em>... y ${section.entries.length - 3} entradas más</em></p>` : ''}
                        </div>
                    `).join('')) || '<p>No se encontró contenido clínico estructurado</p>'}
                </div>
            </div>

            <div id="tab-raw" class="tab-content">
                <div class="code-block">
                    ${JSON.stringify(transformed, null, 2)}
                </div>
            </div>
        </div>

        <div class="result-card">
            <h3>📈 Estadísticas de Transformación</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div class="semantic-item">
                    <div class="semantic-label">Total Elementos</div>
                    <div class="semantic-value">${transformed.structure.totalElements}</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Elementos Codificados</div>
                    <div class="semantic-value">${transformed.structure.codedElements}</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Secciones</div>
                    <div class="semantic-value">${transformed.structure.sectionsCount}</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Entradas Clínicas</div>
                    <div class="semantic-value">${transformed.structure.entriesCount}</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Plantillas</div>
                    <div class="semantic-value">${transformed.structure.templateCount}</div>
                </div>
                <div class="semantic-item">
                    <div class="semantic-label">Ratio Codificación</div>
                    <div class="semantic-value">${(transformed.structure.codingRatio * 100).toFixed(1)}%</div>
                </div>
            </div>
        </div>
    `;
}
function showTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    const clickedTab = event === null || event === void 0 ? void 0 : event.target;
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
}
function clearResults() {
    document.getElementById('results').className = 'results hidden';
    document.getElementById('cdaFile').value = '';
    const selectedFileDiv = document.getElementById('selectedFile');
    selectedFileDiv.textContent = '';
    selectedFileDiv.classList.remove('show');
}
document.getElementById('cdaFile').addEventListener('change', function (e) {
    const target = e.target;
    const selectedFileDiv = document.getElementById('selectedFile');
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        selectedFileDiv.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        selectedFileDiv.classList.add('show');
    }
    else {
        selectedFileDiv.textContent = '';
        selectedFileDiv.classList.remove('show');
    }
});
