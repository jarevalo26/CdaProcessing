// Interfaces TypeScript para tipado fuerte
interface CDADocument {
    typeId?: TypeId;
    templateId?: TemplateId[];
    id?: Identifier;
    code?: Code;
    title?: string;
    effectiveTime?: string;
    confidentialityCode?: Code;
    languageCode?: Code;
    recordTarget?: RecordTarget[];
    author?: Author[];
    custodian?: Custodian;
    component?: Component;
}

interface TypeId {
    root: string;
    extension?: string;
}

interface TemplateId {
    root: string;
    extension?: string;
}

interface Identifier {
    root: string;
    extension?: string;
    assigningAuthorityName?: string;
}

interface Code {
    code?: string;
    codeSystem?: string;
    codeSystemName?: string;
    displayName?: string;
}

interface RecordTarget {
    patientRole: PatientRole;
}

interface PatientRole {
    id: Identifier[];
    addr?: Address[];
    telecom?: Telecom[];
    patient: Patient;
}

interface Patient {
    name: Name[];
    administrativeGenderCode?: Code;
    birthTime?: string;
    ethnicGroupCode?: Code;
    raceCode?: Code;
}

interface Name {
    use?: string;
    given?: string[];
    family?: string;
    prefix?: string;
    suffix?: string;
}

interface Address {
    use?: string;
    streetAddressLine?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

interface Telecom {
    use?: string;
    value?: string;
}

interface Author {
    time: string;
    assignedAuthor: AssignedAuthor;
}

interface AssignedAuthor {
    id: Identifier[];
    code?: Code;
    addr?: Address[];
    telecom?: Telecom[];
    assignedPerson?: Person;
    representedOrganization?: Organization;
}

interface Person {
    name: Name[];
}

interface Organization {
    id?: Identifier[];
    name?: string[];
    telecom?: Telecom[];
    addr?: Address[];
}

interface Custodian {
    assignedCustodian: AssignedCustodian;
}

interface AssignedCustodian {
    representedCustodianOrganization: Organization;
}

interface Component {
    structuredBody?: StructuredBody;
    nonXMLBody?: NonXMLBody;
}

interface StructuredBody {
    component: SectionComponent[];
}

interface NonXMLBody {
    text: string;
}

interface SectionComponent {
    section: Section;
}

interface Section {
    templateId?: TemplateId[];
    id?: Identifier;
    code?: Code;
    title?: string;
    text?: string;
    entry?: Entry[];
    component?: SectionComponent[];
}

interface Entry {
    typeCode?: string;
    contextConductionInd?: boolean;
    act?: Act;
    encounter?: Encounter;
    observation?: Observation;
    procedure?: Procedure;
    substanceAdministration?: SubstanceAdministration;
    supply?: Supply;
    organizer?: Organizer;
}

interface Act {
    classCode?: string;
    moodCode?: string;
    id?: Identifier[];
    code?: Code;
    text?: string;
    effectiveTime?: EffectiveTime;
    performer?: Performer[];
}

interface Encounter {
    classCode?: string;
    moodCode?: string;
    id?: Identifier[];
    code?: Code;
    effectiveTime?: EffectiveTime;
}

interface Observation {
    classCode?: string;
    moodCode?: string;
    templateId?: TemplateId[];
    id?: Identifier[];
    code?: Code;
    text?: string;
    statusCode?: Code;
    effectiveTime?: EffectiveTime;
    value?: ObservationValue[];
    interpretationCode?: Code[];
    methodCode?: Code[];
    targetSiteCode?: Code[];
    performer?: Performer[];
    referenceRange?: ReferenceRange[];
}

interface ObservationValue {
    type: 'PQ' | 'CD' | 'ST' | 'INT' | 'REAL' | 'TS' | 'ED';
    value?: string | number;
    unit?: string;
    code?: string;
    codeSystem?: string;
    displayName?: string;
}

interface Procedure {
    classCode?: string;
    moodCode?: string;
    templateId?: TemplateId[];
    id?: Identifier[];
    code?: Code;
    text?: string;
    statusCode?: Code;
    effectiveTime?: EffectiveTime;
    methodCode?: Code[];
    targetSiteCode?: Code[];
    performer?: Performer[];
}

interface SubstanceAdministration {
    classCode?: string;
    moodCode?: string;
    templateId?: TemplateId[];
    id?: Identifier[];
    text?: string;
    statusCode?: Code;
    effectiveTime?: EffectiveTime[];
    routeCode?: Code;
    doseQuantity?: Quantity;
    consumable?: Consumable;
    performer?: Performer[];
}

interface Supply {
    classCode?: string;
    moodCode?: string;
    templateId?: TemplateId[];
    id?: Identifier[];
    code?: Code;
    text?: string;
    statusCode?: Code;
    effectiveTime?: EffectiveTime;
    quantity?: Quantity;
    product?: Product;
}

interface Organizer {
    classCode?: string;
    moodCode?: string;
    templateId?: TemplateId[];
    id?: Identifier[];
    code?: Code;
    text?: string;
    statusCode?: Code;
    effectiveTime?: EffectiveTime;
    component?: OrganizerComponent[];
}

interface OrganizerComponent {
    observation?: Observation;
    procedure?: Procedure;
    substanceAdministration?: SubstanceAdministration;
    supply?: Supply;
    act?: Act;
}

interface EffectiveTime {
    value?: string;
    low?: string;
    high?: string;
    center?: string;
    width?: string;
}

interface Quantity {
    value?: number;
    unit?: string;
}

interface Performer {
    typeCode?: string;
    assignedEntity?: AssignedEntity;
}

interface AssignedEntity {
    id?: Identifier[];
    code?: Code;
    addr?: Address[];
    telecom?: Telecom[];
    assignedPerson?: Person;
    representedOrganization?: Organization;
}

interface Consumable {
    manufacturedProduct: ManufacturedProduct;
}

interface ManufacturedProduct {
    templateId?: TemplateId[];
    manufacturedMaterial?: ManufacturedMaterial;
}

interface ManufacturedMaterial {
    code?: Code;
    name?: string;
    lotNumberText?: string;
}

interface Product {
    manufacturedProduct?: ManufacturedProduct;
}

interface ReferenceRange {
    observationRange: ObservationRange;
}

interface ObservationRange {
    value?: ObservationValue;
    text?: string;
}

interface SemanticAnalysis {
    documentType: string;
    clinicalDomains: string[];
    terminologies: TerminologyUsage[];
    dataTypes: DataTypeUsage[];
    templates: TemplateUsage[];
    relationships: ClinicalRelationship[];
    qualityMetrics: QualityMetrics;
}

interface TerminologyUsage {
    system: string;
    systemName: string;
    codesCount: number;
    samples: Code[];
}

interface DataTypeUsage {
    type: string;
    count: number;
    description: string;
}

interface TemplateUsage {
    oid: string;
    name: string;
    count: number;
    description: string;
}

interface ClinicalRelationship {
    type: string;
    source: string;
    target: string;
    description: string;
}

interface QualityMetrics {
    completenessScore: number;
    consistencyScore: number;
    standardsCompliance: number;
    dataRichness: number;
}

class CDASemanticAnalyzer {
    private startTime: number = 0;
    private endTime: number = 0;

    private terminologySystems: Map<string, string> = new Map([
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

    private templateDescriptions: Map<string, string> = new Map([
        ['2.16.840.1.113883.10.20.1', 'CCD Document'],
        ['2.16.840.1.113883.10.20.1.11', 'Medications Section'],
        ['2.16.840.1.113883.10.20.1.8', 'Allergies Section'],
        ['2.16.840.1.113883.10.20.1.3', 'Problems Section'],
        ['2.16.840.1.113883.10.20.1.12', 'Procedures Section'],
        ['2.16.840.1.113883.10.20.1.14', 'Results Section'],
        ['2.16.840.1.113883.10.20.1.16', 'Vital Signs Section']
    ]);

    async parseDocument(xmlContent: string): Promise<CDADocument> {
        this.startTime = performance.now();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Error al parsear XML: ' + parseError.textContent);
        }

        return this.extractCDAStructure(xmlDoc);
    }

    private extractCDAStructure(xmlDoc: Document): CDADocument {
        const root = xmlDoc.querySelector('ClinicalDocument');
        if (!root) {
            throw new Error('No se encontró elemento ClinicalDocument');
        }

        const cda: CDADocument = {};

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

    private extractTypeId(root: Element): TypeId | undefined {
        const typeIdEl = root.querySelector('typeId');
        if (!typeIdEl) return undefined;

        return {
            root: typeIdEl.getAttribute('root') || '',
            extension: typeIdEl.getAttribute('extension') || undefined
        };
    }

    private extractTemplateIds(root: Element): TemplateId[] {
        const templateIds = Array.from(root.querySelectorAll('templateId'));
        return templateIds.map(el => ({
            root: el.getAttribute('root') || '',
            extension: el.getAttribute('extension') || undefined
        }));
    }

    private extractId(element: Element | null): Identifier | undefined {
        if (!element) return undefined;

        return {
            root: element.getAttribute('root') || '',
            extension: element.getAttribute('extension') || undefined,
            assigningAuthorityName: element.getAttribute('assigningAuthorityName') || undefined
        };
    }

    private extractCode(element: Element | null): Code | undefined {
        if (!element) return undefined;

        return {
            code: element.getAttribute('code') || undefined,
            codeSystem: element.getAttribute('codeSystem') || undefined,
            codeSystemName: element.getAttribute('codeSystemName') || undefined,
            displayName: element.getAttribute('displayName') || undefined
        };
    }

    private extractEffectiveTime(element: Element | null): string | undefined {
        if (!element) return undefined;
        return element.getAttribute('value') || element.textContent || undefined;
    }

    private getTextContent(parent: Element, selector: string): string | undefined {
        const element = parent.querySelector(selector);
        return element?.textContent?.trim() || undefined;
    }

    private extractRecordTargets(root: Element): RecordTarget[] {
        const recordTargets = Array.from(root.querySelectorAll('recordTarget'));
        return recordTargets.map(rt => this.extractRecordTarget(rt));
    }

    private extractRecordTarget(recordTarget: Element): RecordTarget {
        const patientRoleEl = recordTarget.querySelector('patientRole');
        if (!patientRoleEl) {
            throw new Error('PatientRole no encontrado en recordTarget');
        }

        return {
            patientRole: this.extractPatientRole(patientRoleEl)
        };
    }

    private extractPatientRole(patientRoleEl: Element): PatientRole {
        const patientEl = patientRoleEl.querySelector('patient');
        if (!patientEl) {
            throw new Error('Patient no encontrado en patientRole');
        }

        return {
            id: Array.from(patientRoleEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            addr: this.extractAddresses(patientRoleEl),
            telecom: this.extractTelecoms(patientRoleEl),
            patient: this.extractPatient(patientEl)
        };
    }

    private extractPatient(patientEl: Element): Patient {
        return {
            name: this.extractNames(patientEl),
            administrativeGenderCode: this.extractCode(patientEl.querySelector('administrativeGenderCode')),
            birthTime: this.extractEffectiveTime(patientEl.querySelector('birthTime')),
            ethnicGroupCode: this.extractCode(patientEl.querySelector('ethnicGroupCode')),
            raceCode: this.extractCode(patientEl.querySelector('raceCode'))
        };
    }

    private extractNames(parent: Element): Name[] {
        const nameEls = Array.from(parent.querySelectorAll('name'));
        return nameEls.map(nameEl => ({
            use: nameEl.getAttribute('use') || undefined,
            given: Array.from(nameEl.querySelectorAll('given')).map(el => el.textContent || ''),
            family: nameEl.querySelector('family')?.textContent || undefined,
            prefix: nameEl.querySelector('prefix')?.textContent || undefined,
            suffix: nameEl.querySelector('suffix')?.textContent || undefined
        }));
    }

    private extractAddresses(parent: Element): Address[] {
        const addrEls = Array.from(parent.querySelectorAll('addr'));
        return addrEls.map(addrEl => ({
            use: addrEl.getAttribute('use') || undefined,
            streetAddressLine: Array.from(addrEl.querySelectorAll('streetAddressLine')).map(el => el.textContent || ''),
            city: addrEl.querySelector('city')?.textContent || undefined,
            state: addrEl.querySelector('state')?.textContent || undefined,
            postalCode: addrEl.querySelector('postalCode')?.textContent || undefined,
            country: addrEl.querySelector('country')?.textContent || undefined
        }));
    }

    private extractTelecoms(parent: Element): Telecom[] {
        const telecomEls = Array.from(parent.querySelectorAll('telecom'));
        return telecomEls.map(telecomEl => ({
            use: telecomEl.getAttribute('use') || undefined,
            value: telecomEl.getAttribute('value') || undefined
        }));
    }

    private extractAuthors(root: Element): Author[] {
        const authorEls = Array.from(root.querySelectorAll('author'));
        return authorEls.map(authorEl => ({
            time: this.extractEffectiveTime(authorEl.querySelector('time')) || '',
            assignedAuthor: this.extractAssignedAuthor(authorEl.querySelector('assignedAuthor')!)
        }));
    }

    private extractAssignedAuthor(assignedAuthorEl: Element): AssignedAuthor {
        return {
            id: Array.from(assignedAuthorEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            code: this.extractCode(assignedAuthorEl.querySelector('code')),
            addr: this.extractAddresses(assignedAuthorEl),
            telecom: this.extractTelecoms(assignedAuthorEl),
            assignedPerson: this.extractPerson(assignedAuthorEl.querySelector('assignedPerson')),
            representedOrganization: this.extractOrganization(assignedAuthorEl.querySelector('representedOrganization'))
        };
    }

    private extractPerson(personEl: Element | null): Person | undefined {
        if (!personEl) return undefined;

        return {
            name: this.extractNames(personEl)
        };
    }

    private extractOrganization(orgEl: Element | null): Organization | undefined {
        if (!orgEl) return undefined;

        return {
            id: Array.from(orgEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            name: Array.from(orgEl.querySelectorAll('name')).map(el => el.textContent || ''),
            telecom: this.extractTelecoms(orgEl),
            addr: this.extractAddresses(orgEl)
        };
    }

    private extractCustodian(custodianEl: Element): Custodian {
        const assignedCustodianEl = custodianEl.querySelector('assignedCustodian');
        if (!assignedCustodianEl) {
            throw new Error('AssignedCustodian no encontrado');
        }

        return {
            assignedCustodian: {
                representedCustodianOrganization: this.extractOrganization(
                    assignedCustodianEl.querySelector('representedCustodianOrganization')
                )!
            }
        };
    }

    private extractComponent(componentEl: Element): Component {
        const structuredBodyEl = componentEl.querySelector('structuredBody');
        const nonXMLBodyEl = componentEl.querySelector('nonXMLBody');

        if (structuredBodyEl) {
            return {
                structuredBody: this.extractStructuredBody(structuredBodyEl)
            };
        } else if (nonXMLBodyEl) {
            return {
                nonXMLBody: {
                    text: nonXMLBodyEl.textContent || ''
                }
            };
        }

        return {};
    }

    private extractStructuredBody(structuredBodyEl: Element): StructuredBody {
        const componentEls = Array.from(structuredBodyEl.querySelectorAll(':scope > component'));

        return {
            component: componentEls.map(compEl => ({
                section: this.extractSection(compEl.querySelector('section')!)
            }))
        };
    }

    private extractSection(sectionEl: Element): Section {
        return {
            templateId: this.extractTemplateIds(sectionEl),
            id: this.extractId(sectionEl.querySelector('id')),
            code: this.extractCode(sectionEl.querySelector('code')),
            title: this.getTextContent(sectionEl, 'title'),
            text: this.getTextContent(sectionEl, 'text'),
            entry: this.extractEntries(sectionEl),
            component: Array.from(sectionEl.querySelectorAll(':scope > component')).map(compEl => ({
                section: this.extractSection(compEl.querySelector('section')!)
            }))
        };
    }

    private extractEntries(sectionEl: Element): Entry[] {
        const entryEls = Array.from(sectionEl.querySelectorAll(':scope > entry'));
        return entryEls.map(entryEl => this.extractEntry(entryEl));
    }

    private extractEntry(entryEl: Element): Entry {
        const entry: Entry = {
            typeCode: entryEl.getAttribute('typeCode') || undefined,
            contextConductionInd: entryEl.getAttribute('contextConductionInd') === 'true'
        };

        if (entryEl.querySelector('observation')) {
            entry.observation = this.extractObservation(entryEl.querySelector('observation')!);
        } else if (entryEl.querySelector('substanceAdministration')) {
            entry.substanceAdministration = this.extractSubstanceAdministration(entryEl.querySelector('substanceAdministration')!);
        } else if (entryEl.querySelector('procedure')) {
            entry.procedure = this.extractProcedure(entryEl.querySelector('procedure')!);
        } else if (entryEl.querySelector('act')) {
            entry.act = this.extractAct(entryEl.querySelector('act')!);
        }

        return entry;
    }

    private extractObservation(obsEl: Element): Observation {
        return {
            classCode: obsEl.getAttribute('classCode') || undefined,
            moodCode: obsEl.getAttribute('moodCode') || undefined,
            templateId: this.extractTemplateIds(obsEl),
            id: Array.from(obsEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            code: this.extractCode(obsEl.querySelector('code')),
            text: this.getTextContent(obsEl, 'text'),
            statusCode: this.extractCode(obsEl.querySelector('statusCode')),
            effectiveTime: this.extractComplexEffectiveTime(obsEl.querySelector('effectiveTime')),
            value: this.extractObservationValues(obsEl)
        };
    }

    private extractSubstanceAdministration(substAdminEl: Element): SubstanceAdministration {
        return {
            classCode: substAdminEl.getAttribute('classCode') || undefined,
            moodCode: substAdminEl.getAttribute('moodCode') || undefined,
            templateId: this.extractTemplateIds(substAdminEl),
            id: Array.from(substAdminEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            text: this.getTextContent(substAdminEl, 'text'),
            statusCode: this.extractCode(substAdminEl.querySelector('statusCode')),
            routeCode: this.extractCode(substAdminEl.querySelector('routeCode')),
            doseQuantity: this.extractQuantity(substAdminEl.querySelector('doseQuantity')),
            consumable: this.extractConsumable(substAdminEl.querySelector('consumable'))
        };
    }

    private extractProcedure(procEl: Element): Procedure {
        return {
            classCode: procEl.getAttribute('classCode') || undefined,
            moodCode: procEl.getAttribute('moodCode') || undefined,
            templateId: this.extractTemplateIds(procEl),
            id: Array.from(procEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            code: this.extractCode(procEl.querySelector('code')),
            text: this.getTextContent(procEl, 'text'),
            statusCode: this.extractCode(procEl.querySelector('statusCode')),
            effectiveTime: this.extractComplexEffectiveTime(procEl.querySelector('effectiveTime'))
        };
    }

    private extractAct(actEl: Element): Act {
        return {
            classCode: actEl.getAttribute('classCode') || undefined,
            moodCode: actEl.getAttribute('moodCode') || undefined,
            id: Array.from(actEl.querySelectorAll('id')).map(el => this.extractId(el)!),
            code: this.extractCode(actEl.querySelector('code')),
            text: this.getTextContent(actEl, 'text'),
            effectiveTime: this.extractComplexEffectiveTime(actEl.querySelector('effectiveTime'))
        };
    }

    private extractComplexEffectiveTime(timeEl: Element | null): EffectiveTime | undefined {
        if (!timeEl) return undefined;

        return {
            value: timeEl.getAttribute('value') || undefined,
            low: timeEl.querySelector('low')?.getAttribute('value') || undefined,
            high: timeEl.querySelector('high')?.getAttribute('value') || undefined,
            center: timeEl.querySelector('center')?.getAttribute('value') || undefined,
            width: timeEl.querySelector('width')?.getAttribute('value') || undefined
        };
    }

    private extractQuantity(quantEl: Element | null): Quantity | undefined {
        if (!quantEl) return undefined;

        return {
            value: parseFloat(quantEl.getAttribute('value') || '0') || undefined,
            unit: quantEl.getAttribute('unit') || undefined
        };
    }

    private extractConsumable(consumableEl: Element | null): Consumable | undefined {
        if (!consumableEl) return undefined;

        const manufacturedProductEl = consumableEl.querySelector('manufacturedProduct');
        if (!manufacturedProductEl) return undefined;

        return {
            manufacturedProduct: {
                templateId: this.extractTemplateIds(manufacturedProductEl),
                manufacturedMaterial: this.extractManufacturedMaterial(manufacturedProductEl.querySelector('manufacturedMaterial'))
            }
        };
    }

    private extractManufacturedMaterial(materialEl: Element | null): ManufacturedMaterial | undefined {
        if (!materialEl) return undefined;

        return {
            code: this.extractCode(materialEl.querySelector('code')),
            name: this.getTextContent(materialEl, 'name'),
            lotNumberText: this.getTextContent(materialEl, 'lotNumberText')
        };
    }

    private extractObservationValues(obsEl: Element): ObservationValue[] {
        const valueEls = Array.from(obsEl.querySelectorAll('value'));
        return valueEls.map(valueEl => {
            const type = valueEl.getAttribute('xsi:type') as any || 'ST';
            const value: ObservationValue = { type };

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

    async performSemanticAnalysis(cda: CDADocument): Promise<SemanticAnalysis> {
        const analysis: SemanticAnalysis = {
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
    }

    private analyzeDocumentType(cda: CDADocument): string {
        if (!cda.code) return 'Tipo desconocido';

        const typeMap: { [key: string]: string } = {
            '34133-9': 'Nota de Resumen de Episodio',
            '11488-4': 'Nota de Consulta',
            '18842-5': 'Carta de Alta',
            '11506-3': 'Informe de Progreso',
            '28570-0': 'Documento de Instrucciones Previas'
        };

        return typeMap[cda.code.code || ''] || `Documento CDA (${cda.code.displayName || cda.code.code})`;
    }

    private analyzeClinicalDomains(cda: CDADocument): string[] {
        const domains = new Set<string>();

        if (cda.component?.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                const section = comp.section;
                if (section.code?.code) {
                    const domain = this.mapCodeToDomain(section.code.code);
                    if (domain) domains.add(domain);
                }
            });
        }

        return Array.from(domains);
    }

    private mapCodeToDomain(code: string): string | null {
        const domainMap: { [key: string]: string } = {
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

    private analyzeTerminologies(cda: CDADocument): TerminologyUsage[] {
        const terminologies = new Map<string, { codes: Code[], count: number }>();

        this.collectCodes(cda, (code) => {
            if (code.codeSystem) {
                if (!terminologies.has(code.codeSystem)) {
                    terminologies.set(code.codeSystem, { codes: [], count: 0 });
                }
                const entry = terminologies.get(code.codeSystem)!;
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

    private analyzeDataTypes(cda: CDADocument): DataTypeUsage[] {
        const dataTypes = new Map<string, number>();
        const descriptions: { [key: string]: string } = {
            'CD': 'Datos Codificados',
            'PQ': 'Cantidad Física',
            'ST': 'Cadena de Texto',
            'TS': 'Marca de Tiempo',
            'INT': 'Número Entero',
            'REAL': 'Número Real',
            'ED': 'Datos Encapsulados'
        };

        if (cda.component?.structuredBody) {
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

    private analyzeTemplates(cda: CDADocument): TemplateUsage[] {
        const templates = new Map<string, number>();

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

    private analyzeClinicalRelationships(cda: CDADocument): ClinicalRelationship[] {
        const relationships: ClinicalRelationship[] = [];

        if (cda.component?.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                const section = comp.section;
                if (section.entry) {
                    section.entry.forEach(entry => {
                        if (entry.observation?.value) {
                            entry.observation.value.forEach(value => {
                                if (value.type === 'CD' && value.code) {
                                    relationships.push({
                                        type: 'Observación-Código',
                                        source: entry.observation?.code?.displayName || 'Observación',
                                        target: value.displayName || value.code,
                                        description: 'Observación clínica con valor codificado'
                                    });
                                }
                            });
                        }

                        if (entry.substanceAdministration?.consumable?.manufacturedProduct?.manufacturedMaterial?.code) {
                            const medication = entry.substanceAdministration.consumable.manufacturedProduct.manufacturedMaterial;
                            relationships.push({
                                type: 'Paciente-Medicamento',
                                source: 'Paciente',
                                target: medication.code!.displayName || medication.code!.code || 'Medicamento',
                                description: 'Administración de medicamento al paciente'
                            });
                        }
                    });
                }
            });
        }

        return relationships.slice(0, 10);
    }

    private calculateQualityMetrics(cda: CDADocument): QualityMetrics {
        let completenessScore = 0;
        let consistencyScore = 0;
        let standardsCompliance = 0;
        let dataRichness = 0;

        const requiredFields = ['id', 'code', 'title', 'effectiveTime', 'recordTarget', 'author'];
        const presentFields = requiredFields.filter(field => (cda as any)[field]);
        completenessScore = (presentFields.length / requiredFields.length) * 100;

        if (cda.typeId?.root === '2.16.840.1.113883.1.3') standardsCompliance += 25;
        if (cda.templateId?.length) standardsCompliance += 25;
        if (cda.recordTarget?.[0]?.patientRole?.patient) standardsCompliance += 25;
        if (cda.component?.structuredBody) standardsCompliance += 25;

        let totalEntries = 0;
        let codedEntries = 0;
        if (cda.component?.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                if (comp.section.entry) {
                    totalEntries += comp.section.entry.length;
                    comp.section.entry.forEach(entry => {
                        if (entry.observation?.code || entry.procedure?.code ||
                            entry.substanceAdministration?.consumable?.manufacturedProduct?.manufacturedMaterial?.code) {
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

    private collectCodes(obj: any, callback: (code: Code) => void): void {
        if (obj && typeof obj === 'object') {
            if (obj.code && obj.codeSystem) {
                callback(obj as Code);
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any) => this.collectCodes(item, callback));
                    } else {
                        this.collectCodes(obj[key], callback);
                    }
                }
            }
        }
    }

    private collectTemplates(obj: any, callback: (templateId: TemplateId) => void): void {
        if (obj && typeof obj === 'object') {
            if (obj.templateId) {
                if (Array.isArray(obj.templateId)) {
                    obj.templateId.forEach((tid: TemplateId) => callback(tid));
                } else {
                    callback(obj.templateId);
                }
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any) => this.collectTemplates(item, callback));
                    } else {
                        this.collectTemplates(obj[key], callback);
                    }
                }
            }
        }
    }

    private collectObservationValues(obj: any, callback: (value: ObservationValue) => void): void {
        if (obj && typeof obj === 'object') {
            if (obj.value && Array.isArray(obj.value) && obj.value.length > 0 && obj.value[0].type) {
                obj.value.forEach((val: ObservationValue) => callback(val));
            }
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any) => this.collectObservationValues(item, callback));
                    } else {
                        this.collectObservationValues(obj[key], callback);
                    }
                }
            }
        }
    }

    getProcessingTime(): number {
        return this.endTime - this.startTime;
    }
}

class CDATransformer {
    private startTime: number = 0;
    private endTime: number = 0;

    async transformToJSON(cda: CDADocument): Promise<any> {
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
    }

    private transformDocument(cda: CDADocument): any {
        return {
            id: cda.id?.root + (cda.id?.extension ? '^' + cda.id.extension : ''),
            title: cda.title,
            type: {
                code: cda.code?.code,
                display: cda.code?.displayName,
                system: cda.code?.codeSystem
            },
            date: cda.effectiveTime,
            confidentiality: cda.confidentialityCode?.code,
            language: cda.languageCode?.code,
            templates: cda.templateId?.map(t => t.root)
        };
    }

    private transformPatient(cda: CDADocument): any {
        const recordTarget = cda.recordTarget?.[0];
        if (!recordTarget) return null;

        const patient = recordTarget.patientRole.patient;
        const name = patient.name?.[0];
        const address = recordTarget.patientRole.addr?.[0];

        return {
            id: recordTarget.patientRole.id?.[0]?.extension,
            name: {
                given: name?.given?.join(' '),
                family: name?.family,
                full: (name?.given?.join(' ') + ' ' + name?.family).trim()
            },
            gender: patient.administrativeGenderCode?.displayName,
            birthDate: patient.birthTime,
            address: address ? {
                street: address.streetAddressLine?.join(', '),
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country
            } : null
        };
    }

    private transformClinicalContent(cda: CDADocument): any {
        if (!cda.component?.structuredBody) return null;

        const sections = cda.component.structuredBody.component.map(comp => {
            const section = comp.section;
            return {
                title: section.title,
                code: section.code?.code,
                display: section.code?.displayName,
                text: section.text,
                entries: section.entry?.map(entry => this.transformEntry(entry)) || []
            };
        });

        return { sections };
    }

    private transformEntry(entry: Entry): any {
        if (entry.observation) {
            return {
                type: 'observation',
                code: entry.observation.code?.code,
                display: entry.observation.code?.displayName,
                value: entry.observation.value?.map(v => ({
                    type: v.type,
                    value: v.value,
                    unit: v.unit,
                    display: v.displayName
                })),
                status: entry.observation.statusCode?.code,
                effectiveTime: entry.observation.effectiveTime?.value
            };
        }

        if (entry.substanceAdministration) {
            const med = entry.substanceAdministration.consumable?.manufacturedProduct?.manufacturedMaterial;
            return {
                type: 'medication',
                medication: {
                    code: med?.code?.code,
                    display: med?.code?.displayName,
                    name: med?.name
                },
                dose: {
                    value: entry.substanceAdministration.doseQuantity?.value,
                    unit: entry.substanceAdministration.doseQuantity?.unit
                },
                route: entry.substanceAdministration.routeCode?.displayName,
                status: entry.substanceAdministration.statusCode?.code
            };
        }

        if (entry.procedure) {
            return {
                type: 'procedure',
                code: entry.procedure.code?.code,
                display: entry.procedure.code?.displayName,
                status: entry.procedure.statusCode?.code,
                effectiveTime: entry.procedure.effectiveTime?.value
            };
        }

        return {
            type: 'unknown',
            raw: entry
        };
    }

    private transformStructure(cda: CDADocument): any {
        let totalElements = 0;
        let codedElements = 0;
        let templateCount = 0;

        this.countElements(cda, (hasCode, hasTemplate) => {
            totalElements++;
            if (hasCode) codedElements++;
            if (hasTemplate) templateCount++;
        });

        return {
            totalElements,
            codedElements,
            templateCount,
            codingRatio: totalElements > 0 ? (codedElements / totalElements) : 0,
            sectionsCount: cda.component?.structuredBody?.component.length || 0,
            entriesCount: this.countEntries(cda)
        };
    }

    private countElements(obj: any, callback: (hasCode: boolean, hasTemplate: boolean) => void): void {
        if (obj && typeof obj === 'object') {
            const hasCode = !!(obj.code || obj.codeSystem);
            const hasTemplate = !!(obj.templateId);
            callback(hasCode, hasTemplate);

            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any) => this.countElements(item, callback));
                    } else {
                        this.countElements(obj[key], callback);
                    }
                }
            }
        }
    }

    private countEntries(cda: CDADocument): number {
        let count = 0;
        if (cda.component?.structuredBody) {
            cda.component.structuredBody.component.forEach(comp => {
                count += comp.section.entry?.length || 0;
            });
        }
        return count;
    }

    getProcessingTime(): number {
        return this.endTime - this.startTime;
    }
}

const analyzer = new CDASemanticAnalyzer();
const transformer = new CDATransformer();

async function analyzeDocument(): Promise<void> {
    const fileInput = document.getElementById('cdaFile') as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo CDA.');
        return;
    }

    try {
        const file = fileInput.files[0];
        const xmlContent = await file.text();
        const cda = await analyzer.parseDocument(xmlContent);
        const analysis = await analyzer.performSemanticAnalysis(cda);
        displaySemanticAnalysis(analysis, analyzer.getProcessingTime());

        // Limpiar el nombre del archivo después de mostrar los resultados
        //const selectedFileDiv = document.getElementById('selectedFile')!;
        //selectedFileDiv.textContent = '';
        //selectedFileDiv.classList.remove('show');
    } catch (error: any) {
        alert('Error al analizar el documento: ' + error.message);
    }
}

async function transformDocument(): Promise<void> {
    const fileInput = document.getElementById('cdaFile') as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo CDA.');
        return;
    }

    try {
        const file = fileInput.files[0];
        const xmlContent = await file.text();
        const cda = await analyzer.parseDocument(xmlContent);
        const transformed = await transformer.transformToJSON(cda);
        displayTransformation(transformed, transformer.getProcessingTime());

        // Limpiar el nombre del archivo después de mostrar los resultados
        //const selectedFileDiv = document.getElementById('selectedFile')!;
        //selectedFileDiv.textContent = '';
        //selectedFileDiv.classList.remove('show');
    } catch (error: any) {
        alert('Error al transformar el documento: ' + error.message);
    }
}

function displaySemanticAnalysis(analysis: SemanticAnalysis, processingTime: number): void {
    const resultsDiv = document.getElementById('results')!;
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

function displayTransformation(transformed: any, processingTime: number): void {
    const resultsDiv = document.getElementById('results')!;
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
                        <strong>Plantillas:</strong> <span>${transformed.document.templates?.join(', ') || 'N/A'}</span>
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
                            <strong>Ciudad:</strong> <span>${transformed.patient.address?.city || 'N/A'}</span>
                            <strong>Estado:</strong> <span>${transformed.patient.address?.state || 'N/A'}</span>
                        </div>
                    ` : '<p>No se encontró información del paciente</p>'}
                </div>
            </div>

            <div id="tab-clinical" class="tab-content">
                <div class="transform-output">
                    <h4>🩺 Contenido Clínico</h4>
                    ${transformed.clinical?.sections?.map((section: any, index: number) => `
                        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0;">
                            <h5 style="color: #2c3e50; margin-bottom: 10px;">
                                ${section.title || 'Sección ' + (index + 1)}
                                <span style="font-size: 0.8em; color: #7f8c8d;">(${section.code || 'Sin código'})</span>
                            </h5>
                            <p style="margin-bottom: 10px;">${section.text || 'Sin texto descriptivo'}</p>
                            <strong>Entradas:</strong> ${section.entries.length}
                            ${section.entries.slice(0, 3).map((entry: any) => `
                                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin: 5px 0; font-size: 0.9em;">
                                    <strong>${entry.type}:</strong> ${entry.display || entry.code || 'Sin descripción'}
                                    ${entry.value ? `<br><em>Valor: ${JSON.stringify(entry.value)}</em>` : ''}
                                </div>
                            `).join('')}
                            ${section.entries.length > 3 ? `<p><em>... y ${section.entries.length - 3} entradas más</em></p>` : ''}
                        </div>
                    `).join('') || '<p>No se encontró contenido clínico estructurado</p>'}
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

function showTab(tabName: string): void {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const clickedTab = event?.target as HTMLElement;
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
}

function clearResults(): void {
    document.getElementById('results')!.className = 'results hidden';
    (document.getElementById('cdaFile') as HTMLInputElement).value = '';
    const selectedFileDiv = document.getElementById('selectedFile');
    selectedFileDiv!.textContent = '';
    selectedFileDiv!.classList.remove('show');
}

document.getElementById('cdaFile')!.addEventListener('change', function (e) {
    const target = e.target as HTMLInputElement;
    const selectedFileDiv = document.getElementById('selectedFile')!;
    
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        selectedFileDiv.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        selectedFileDiv.classList.add('show');
    } else {
        selectedFileDiv.textContent = '';
        selectedFileDiv.classList.remove('show');
    }
});