use wasm_bindgen::prelude::*;
use quick_xml::events::Event;
use quick_xml::Reader;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use once_cell::sync::Lazy;
use regex::Regex;

static MED_PATTERNS: Lazy<Vec<Regex>> = Lazy::new(|| {
    vec![
        Regex::new(r"(?i)\b\w+(?:cillin|mycin|prazole|statin|tide|pine|zole|pril|sartan)\b").unwrap(),
        Regex::new(r"(?i)\b\w+\s*(?:mg|tablet|capsule|injection)\b").unwrap(),
        Regex::new(r"(?i)\baspirin\b|\bibuprofen\b|\bparacetamol\b|\bmetformin\b|\benalapril\b|\batorvastatin\b|\bsalbutamol\b|\bbudesonida\b|\bwarfarin\b").unwrap(),
    ]
});



// Importar console.log para debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Estructuras de datos para CDA
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Patient {
    pub id: Option<String>,
    pub name: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<String>,
    pub age: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Diagnosis {
    pub code: Option<String>,
    pub name: String,
    pub code_system: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Medication {
    pub name: String,
    pub medication_type: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CDADocument {
    pub file_name: String,
    pub patient: Patient,
    pub diagnoses: Vec<Diagnosis>,
    pub medications: Vec<Medication>,
    pub document_date: Option<String>,
    pub author: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Statistics {
    pub total_documents: u32,
    pub total_patients: u32,
    pub average_age: f64,
    pub gender_distribution: HashMap<String, u32>,
    pub top_diagnoses: Vec<DiagnosisCount>,
    pub top_medications: Vec<MedicationCount>,
    pub processing_time_ms: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DiagnosisCount {
    pub name: String,
    pub count: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MedicationCount {
    pub name: String,
    pub count: u32,
}

#[wasm_bindgen]
pub struct CDAParser {
    documents: Vec<CDADocument>,
}

#[wasm_bindgen]
impl CDAParser {
    #[wasm_bindgen(constructor)]
    pub fn new() -> CDAParser {
        //console_log!("CDA Parser WebAssembly inicializado");
        CDAParser {
            documents: Vec::new(),
        }
    }

    #[wasm_bindgen]
    pub fn parse_file(&mut self, file_name: &str, xml_content: &str) -> Result<String, JsValue> {      
        match self.parse_cda_document(file_name, xml_content) {
            Ok(document) => {
                self.documents.push(document);
                Ok("Success".to_string())
            }
            Err(e) => {
                //console_log!("Error parseando {}: {}", file_name, e);
                Err(JsValue::from_str(&format!("Error parsing {}: {}", file_name, e)))
            }
        }
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> Result<JsValue, JsValue> {      
        let stats = self.calculate_statistics();
        match serde_wasm_bindgen::to_value(&stats) {
            Ok(js_value) => Ok(js_value),
            Err(e) => Err(JsValue::from_str(&format!("Error serializing statistics: {:?}", e)))
        }
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.documents.clear();
        //console_log!("Parser limpiado");
    }

    #[wasm_bindgen]
    pub fn get_documents(&self) -> Result<JsValue, JsValue> {
        match serde_wasm_bindgen::to_value(&self.documents) {
            Ok(js_value) => Ok(js_value),
            Err(e) => Err(JsValue::from_str(&format!("Error serializing documents: {:?}", e)))
        }
    }

    #[wasm_bindgen]
    pub fn parse_files_batch(&mut self, files_data: JsValue) -> Result<JsValue, JsValue> {
        use std::time::Instant;
        let start_time = Instant::now();

        // Deserializar el array de archivos desde JavaScript
        let files: Vec<serde_json::Value> = serde_wasm_bindgen::from_value(files_data)
            .map_err(|e| JsValue::from_str(&format!("Error deserializando archivos: {:?}", e)))?;
        
        // Crear vector temporal para documentos
        let mut temp_documents = Vec::new();

        for file_data in files {
            if let (Some(file_name), Some(content)) = (
                file_data.get("name").and_then(|v| v.as_str()),
                file_data.get("content").and_then(|v| v.as_str())
            ) {
                match self.parse_cda_document(file_name, content) {
                    Ok(document) => {
                        temp_documents.push(document);
                    }
                    Err(_e) => {
                        console_log!("Error procesando {}: {}", file_name, _e);
                    }
                }
            }
        }

        // Una sola asignación al final
        self.documents = temp_documents;

        // Ahora calcular estadísticas
        let duration = start_time.elapsed();
        let processing_time_ms = duration.as_millis() as u64;

        let mut stats = self.calculate_statistics();
        stats.processing_time_ms = processing_time_ms;

        serde_wasm_bindgen::to_value(&stats)
            .map_err(|e| JsValue::from_str(&format!("Error serializando estadísticas: {:?}", e)))
    }

}

impl CDAParser {
    fn parse_cda_document(&self, file_name: &str, xml_content: &str) -> Result<CDADocument, String> {
        let mut reader = Reader::from_str(xml_content);
        reader.trim_text(true);

        let mut document = CDADocument {
            file_name: file_name.to_string(),
            patient: Patient {
                id: None,
                name: None,
                gender: None,
                birth_date: None,
                age: None,
            },
            diagnoses: Vec::new(),
            medications: Vec::new(),
            document_date: None,
            author: None,
        };

        let mut buf = Vec::new();
        let mut current_path = Vec::new();
        let mut current_text = String::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_lowercase();
                    current_path.push(tag_name.clone());
                    
                    // Extraer atributos importantes
                    self.extract_attributes(&mut document, &tag_name, e, &current_path);
                    //self.extract_attributes(&mut document, &tag_name, e, &current_path, &reader);
                }
                Ok(Event::End(ref e)) => {
                    let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_lowercase();
                    
                    // Procesar texto acumulado
                    if !current_text.trim().is_empty() {
                        self.process_text_content(&mut document, &tag_name, &current_text.trim(), &current_path);
                        current_text.clear();
                    }
                    
                    current_path.pop();
                }
                Ok(Event::Text(e)) => {
                    current_text.push_str(&e.unescape().unwrap_or_default());
                }
                Ok(Event::Eof) => break,
                Err(e) => return Err(format!("Error reading XML: {:?}", e)),
                _ => {}
            }
            buf.clear();
        }

        // Post-procesamiento
        self.post_process_document(&mut document);
        
        //console_log!("Documento parseado: {} diagnósticos, {} medicamentos", document.diagnoses.len(), document.medications.len());
        
        Ok(document)
    }

    fn extract_attributes(
        &self, 
        document: &mut CDADocument, 
        tag_name: &str, 
        element: &quick_xml::events::BytesStart, 
        path: &[String]
    ) {
        for attr in element.attributes() {
            if let Ok(attr) = attr {
                let attr_name = String::from_utf8_lossy(attr.key.as_ref()).to_lowercase();
                let attr_value = String::from_utf8_lossy(&attr.value);

                match (tag_name, attr_name.as_str()) {
                    ("administrativegendercode", "code") => {
                        document.patient.gender = Some(self.normalize_gender(&attr_value));
                    }
                    ("birthtime", "value") => {
                        document.patient.birth_date = Some(attr_value.to_string());
                        document.patient.age = self.calculate_age_from_hl7_date(&attr_value);
                    }
                    ("effectivetime", "value") if path.len() <= 3 => {
                        document.document_date = Some(attr_value.to_string());
                    }
                    ("code", "displayname") => {
                        if self.is_diagnosis_context(path) {
                            document.diagnoses.push(Diagnosis {
                                code: None,
                                name: attr_value.to_string(),
                                code_system: None,
                            });
                        }
                    }
                    ("code", "code") => {
                        if self.is_diagnosis_context(path) && !document.diagnoses.is_empty() {
                            if let Some(last_diagnosis) = document.diagnoses.last_mut() {
                                last_diagnosis.code = Some(attr_value.to_string());
                            }
                        }
                    }
                    ("id", "extension") if path.contains(&"patient".to_string()) => {
                        document.patient.id = Some(attr_value.to_string());
                    }
                    _ => {}
                }
            }                               
        }
    }

    /* fn extract_attributes(
        &self,
        document: &mut CDADocument,
        tag_name: &str,
        element: &quick_xml::events::BytesStart,
        path: &[String],
        reader: &Reader<&[u8]>, 
    ) {
        for attr in element.attributes() {
            if let Ok(attr) = attr {
                if let Ok(attr_value) = attr.unescape_and_decode_value(reader) {
                    let attr_name = String::from_utf8_lossy(attr.key.as_ref()).to_ascii_lowercase();

                    match (tag_name, attr_name.as_str()) {
                        ("administrativegendercode", "code") => {
                            console_log!(
                                "[WASM] Gender attr found → {} = {}",
                                attr_name,
                                attr_value
                            );
                            document.patient.gender = Some(self.normalize_gender(&attr_value));
                        }
                        ("birthtime", "value") => {
                            console_log!(
                                "[WASM] Birthtime attr found → {} = {}",
                                attr_name,
                                attr_value
                            );
                            document.patient.birth_date = Some(attr_value.clone());
                            document.patient.age = self.calculate_age_from_hl7_date(&attr_value);
                        }
                        ("effectivetime", "value") if path.len() <= 3 => {
                            console_log!(
                                "[WASM] EffectiveTime (doc date) → {} = {}",
                                attr_name,
                                attr_value
                            );
                            document.document_date = Some(attr_value.clone());
                        }
                        ("code", "displayname") => {
                            if self.is_diagnosis_context(path) {
                                console_log!(
                                    "[WASM] Diagnosis (displayName) → {}",
                                    attr_value
                                );
                                document.diagnoses.push(Diagnosis {
                                    code: None,
                                    name: attr_value.clone(),
                                    code_system: None,
                                });
                            }
                        }
                        ("code", "code") => {
                            if self.is_diagnosis_context(path) && !document.diagnoses.is_empty() {
                                console_log!(
                                    "[WASM] Diagnosis (code) → {}",
                                    attr_value
                                );
                                if let Some(last_diagnosis) = document.diagnoses.last_mut() {
                                    last_diagnosis.code = Some(attr_value.clone());
                                }
                            }
                        }
                        ("id", "extension") if path.contains(&"patient".to_string()) => {
                            console_log!(
                                "[WASM] Patient ID → {}",
                                attr_value
                            );
                            document.patient.id = Some(attr_value.clone());
                        }
                        _ => {
                            // Debug opcional para tags frecuentes
                            // console_log!("[WASM] Ignored attr {} = {}", attr_name, attr_value);
                        }
                    }
                }
            }
        }
    } */

    fn process_text_content(&self, document: &mut CDADocument, tag_name: &str, text: &str, path: &[String]) {
        match tag_name {
            "given" | "family" if path.contains(&"patient".to_string()) => {
                let current_name = document.patient.name.clone().unwrap_or_default();
                document.patient.name = Some(format!("{} {}", current_name, text).trim().to_string());
            }
            "name" if path.contains(&"assignedperson".to_string()) => {
                document.author = Some(text.to_string());
            }
            "name" if path.contains(&"manufacturedmaterial".to_string()) || 
                     path.contains(&"medication".to_string()) => {
                // Extraer medicamentos específicos de tus archivos
                let med_name = self.normalize_medication_name(text);
                if !med_name.is_empty() && !self.is_duplicate_medication(document, &med_name) {
                    document.medications.push(Medication {
                        name: med_name,
                        medication_type: "structured".to_string(),
                    });
                }
            }
            "title" => {
                // Extraer diagnósticos del título del documento
                self.extract_diagnoses_from_title(document, text);
                
                // También buscar medicamentos y diagnósticos en el texto
                self.extract_from_text(document, text);
            }
            "text" => {
                // Extraer diagnósticos y medicamentos del texto libre
                self.extract_from_text(document, text);
            }
            _ => {}
        }
    }
    
    fn normalize_medication_name(&self, name: &str) -> String {
        // Normalizar nombres de medicamentos comunes en tus archivos
        let name_lower = name.to_lowercase().trim().to_string();
        
        match name_lower.as_str() {
            "metformina" | "metformin" => "Metformina".to_string(),
            "enalapril" => "Enalapril".to_string(),
            "atorvastatina" | "atorvastatin" => "Atorvastatina".to_string(),
            "salbutamol" => "Salbutamol".to_string(),
            "budesonida" | "budesonide" => "Budesonida".to_string(),
            "warfarina" | "warfarin" => "Warfarina".to_string(),
            _ => {
                // Si no está en la lista, devolver el nombre original limpio
                name.trim().to_string()
            }
        }
    }

    fn extract_from_text(&self, document: &mut CDADocument, text: &str) {
        let text_lower = text.to_lowercase();
        
        // Extraer diagnósticos del título del documento
        self.extract_diagnoses_from_title(document, text);            

        for re in MED_PATTERNS.iter() {
            for mat in re.find_iter(&text_lower) {
                let med_name = mat.as_str().to_string();
                if med_name.len() > 3 && !self.is_duplicate_medication(document, &med_name) {
                    document.medications.push(Medication {
                        name: med_name,
                        medication_type: "text_extracted".to_string(),
                    });
                }
            }
        }
        
        // Buscar diagnósticos por palabras clave médicas específicas
        let diagnosis_keywords = [
            "diabetes", "diabético", "hipertension", "hipertenso", "asma", "pneumonia", "infection",
            "fracture", "cancer", "depression", "anxiety", "arthritis", "hipercolesterolemia",
            "bronchitis", "gastritis", "dermatitis", "nephritis", "controlada", "crónico",
            "agudo", "estable", "compensado"
        ];
        
        for keyword in &diagnosis_keywords {
            if text_lower.contains(keyword) {
                let diagnosis_name = keyword.to_string();
                if !self.is_duplicate_diagnosis(document, &diagnosis_name) {
                    document.diagnoses.push(Diagnosis {
                        code: None,
                        name: diagnosis_name,
                        code_system: Some("text_extracted".to_string()),
                    });
                }
            }
        }
    }
    
    fn extract_diagnoses_from_title(&self, document: &mut CDADocument, text: &str) {
        let text_lower = text.to_lowercase();
        
        // Mapear títulos específicos a diagnósticos
        let title_mappings = [
            ("hipertenso", "Hipertensión"),
            ("diabético", "Diabetes"),
            ("hipercolesterolemia", "Hipercolesterolemia"),
            ("asma", "Asma"),
            ("múltiples condiciones", "Múltiples patologías"),
            ("anticoagulación", "Trastorno de coagulación"),
            ("control anticoagulación", "Anticoagulación"),
        ];
        
        for (keyword, diagnosis) in &title_mappings {
            if text_lower.contains(keyword) {
                if !self.is_duplicate_diagnosis(document, diagnosis) {
                    document.diagnoses.push(Diagnosis {
                        code: None,
                        name: diagnosis.to_string(),
                        code_system: Some("title_inferred".to_string()),
                    });
                }
            }
        }
    }
    
    fn infer_diagnoses_from_medications(&self, document: &mut CDADocument) {
        // Mapear medicamentos a diagnósticos probables
        let med_to_diagnosis = [
            ("metformina", "Diabetes mellitus tipo 2"),
            ("metformin", "Diabetes mellitus tipo 2"),
            ("enalapril", "Hipertensión arterial"),
            ("atorvastatina", "Hipercolesterolemia"),
            ("atorvastatin", "Hipercolesterolemia"),
            ("salbutamol", "Asma bronquial"),
            ("budesonida", "Asma bronquial"),
            ("budesonide", "Asma bronquial"),
            ("warfarina", "Trastorno de coagulación"),
            ("warfarin", "Trastorno de coagulación"),
        ];
        
        for medication in &document.medications {
            let med_name_lower = medication.name.to_lowercase();
            
            for (med_keyword, diagnosis) in &med_to_diagnosis {
                if med_name_lower.contains(med_keyword) {
                    if !self.is_duplicate_diagnosis(document, diagnosis) {
                        document.diagnoses.push(Diagnosis {
                            code: None,
                            name: diagnosis.to_string(),
                            code_system: Some("medication_inferred".to_string()),
                        });
                    }
                }
            }
        }
    }
    
    fn extract_diagnoses_from_observations(&self, _document: &mut CDADocument) {
        // Buscar en observaciones clínicas valores anormales
        // Esto se podría expandir para buscar valores específicos en el XML
        // Por ahora, implementamos lógica básica basada en códigos LOINC comunes
        
        // Estos se extraerían del parsing XML de las observaciones
        // pero por simplicidad, los inferimos del contexto
    }

    fn is_duplicate_medication(&self, document: &CDADocument, med_name: &str) -> bool {
        document.medications.iter().any(|m| m.name.to_lowercase() == med_name.to_lowercase())
    }

    fn is_duplicate_diagnosis(&self, document: &CDADocument, diag_name: &str) -> bool {
        document.diagnoses.iter().any(|d| d.name.to_lowercase() == diag_name.to_lowercase())
    }

    fn is_diagnosis_context(&self, path: &[String]) -> bool {
        path.iter().any(|p| {
            p.contains("observation") || p.contains("diagnosis") || 
            p.contains("condition") || p.contains("problem")
        })
    }

    fn normalize_gender(&self, gender_code: &str) -> String {
        //console_log!("RUST normalize_gender: input='{}' len={}", gender_code, gender_code.len());
        let result = match gender_code.to_uppercase().as_str() {
            "M" | "MALE" => "M".to_string(),
            "F" | "FEMALE" => "F".to_string(),
            _ => {
                //console_log!("RUST: Género no reconocido: '{}'", gender_code);
                "Unknown".to_string()
            }
        };
        
        //console_log!("RUST normalize_gender: output='{}'", result);
        result
    }

    fn calculate_age_from_hl7_date(&self, hl7_date: &str) -> Option<u32> {
        if hl7_date.len() >= 8 {
            let year_str = &hl7_date[0..4];
            
            if let Ok(year) = year_str.parse::<i32>() {
                let current_year = 2024; // O usar chrono::Utc::now().year()
                let age = current_year - year;
                if age >= 0 && age <= 150 {
                    return Some(age as u32);
                }
            }
        }
        None
    }

    fn post_process_document(&self, document: &mut CDADocument) {
        // Limpiar nombre del paciente
        if let Some(ref mut name) = document.patient.name {
            *name = name.split_whitespace().collect::<Vec<&str>>().join(" ");
            if name.is_empty() {
                document.patient.name = None;
            }
        }

        // Inferir diagnósticos de medicamentos si no hay diagnósticos
        if document.diagnoses.is_empty() {
            self.infer_diagnoses_from_medications(document);
        }
        
        // Extraer diagnósticos de observaciones clínicas
        self.extract_diagnoses_from_observations(document);

        // Remover duplicados de diagnósticos
        document.diagnoses.sort_by(|a, b| a.name.cmp(&b.name));
        document.diagnoses.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());

        // Remover duplicados de medicamentos
        document.medications.sort_by(|a, b| a.name.cmp(&b.name));
        document.medications.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
        
        //console_log!("Post-procesamiento completado: {} diagnósticos, {} medicamentos", document.diagnoses.len(), document.medications.len());
    }

    fn calculate_statistics(&self) -> Statistics {
        let mut gender_distribution = HashMap::new();
        let mut diagnosis_counts: HashMap<String, u32> = HashMap::new();
        let mut medication_counts: HashMap<String, u32> = HashMap::new();
        let mut total_age = 0u32;
        let mut age_count = 0u32;

        use std::time::Instant;
        let start_time = Instant::now();

        for doc in &self.documents {
            // Contar géneros
            let gender = doc.patient.gender.as_deref().unwrap_or("Unknown");
            *gender_distribution.entry(gender.to_string()).or_insert(0) += 1;

            // Calcular edad promedio
            if let Some(age) = doc.patient.age {
                total_age += age;
                age_count += 1;
            }

            // Contar diagnósticos
            for diagnosis in &doc.diagnoses {
                *diagnosis_counts.entry(diagnosis.name.clone()).or_insert(0) += 1;
            }

            // Contar medicamentos
            for medication in &doc.medications {
                *medication_counts.entry(medication.name.clone()).or_insert(0) += 1;
            }
        }

        // Top diagnósticos
        let mut diagnosis_vec: Vec<_> = diagnosis_counts.into_iter().collect();
        diagnosis_vec.sort_by(|a, b| b.1.cmp(&a.1));
        let top_diagnoses: Vec<DiagnosisCount> = diagnosis_vec
            .into_iter()
            .take(5)
            .map(|(name, count)| DiagnosisCount { name, count })
            .collect();

        // Top medicamentos
        let mut medication_vec: Vec<_> = medication_counts.into_iter().collect();
        medication_vec.sort_by(|a, b| b.1.cmp(&a.1));
        let top_medications: Vec<MedicationCount> = medication_vec
            .into_iter()
            .take(5)
            .map(|(name, count)| MedicationCount { name, count })
            .collect();
        
        let duration = start_time.elapsed();
        let processing_time_ms = duration.as_millis() as u64;

        Statistics {
            total_documents: self.documents.len() as u32,
            total_patients: self.documents.len() as u32,
            average_age: if age_count > 0 { total_age as f64 / age_count as f64 } else { 0.0 },
            gender_distribution,
            top_diagnoses,
            top_medications,
            processing_time_ms, // Usar el tiempo pasado como parámetro
        }
    }
}

// Inicialización WASM
#[wasm_bindgen(start)]
pub fn main() {
    //console_log!("CDA Parser WebAssembly cargado correctamente");
}