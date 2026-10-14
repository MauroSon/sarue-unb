use crate::models::{Course, FeedItem, FeedItemType, PlatformType};
use regex::Regex;
use reqwest::Client;
use scraper::{Html, Selector};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::time::Duration;

pub struct MoodleClient {
    _client: Client,
}

impl MoodleClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .cookie_store(true)
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { _client: client }
    }

    /// Sincronização direta via requisição HTTP para a API e scraping do Aprender 3 (Moodle UnB)
    pub async fn sync_aprender3(
        &self,
        cpf: &str,
        senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let clean_username = clean_cpf(cpf);
        if clean_username.is_empty() || senha.is_empty() {
            return Err("Informe seu CPF e senha do Aprender 3 para sincronizar.".to_string());
        }

        let base_url = "https://aprender3.unb.br";
        let login_url = format!("{}/login/index.php", base_url);

        // 1. GET página de login para capturar o logintoken CSRF
        let login_page_res = self
            ._client
            .get(&login_url)
            .header("Referer", base_url)
            .send()
            .await
            .map_err(|e| format!("Falha ao conectar no Aprender 3: {}", e))?;

        let login_html = login_page_res
            .text()
            .await
            .map_err(|e| format!("Falha ao ler página de login do Aprender 3: {}", e))?;

        let logintoken = extract_logintoken(&login_html)
            .ok_or_else(|| "Não foi possível extrair o logintoken de segurança do Aprender 3.".to_string())?;

        // 2. POST de autenticação com cookies preservados
        let mut params = HashMap::new();
        params.insert("logintoken", logintoken.as_str());
        params.insert("username", clean_username.as_str());
        params.insert("password", senha);
        params.insert("anchor", "");

        let post_res = self
            ._client
            .post(&login_url)
            .form(&params)
            .header("Referer", &login_url)
            .header("Origin", base_url)
            .send()
            .await
            .map_err(|e| format!("Falha ao enviar credenciais para o Aprender 3: {}", e))?;

        let final_url = post_res.url().to_string();
        let post_text = post_res
            .text()
            .await
            .map_err(|e| format!("Falha ao processar resposta de login do Aprender 3: {}", e))?;

        // Validação de erro de login
        if final_url.contains("login/index.php") {
            if post_text.contains("alert-danger")
                || post_text.contains("Nome de usuário ou senha errados")
                || post_text.contains("loginerrormsg")
                || post_text.contains("Credenciais inválidas")
            {
                return Err("CPF ou senha incorretos no Aprender 3. Verifique seus dados.".to_string());
            }
            if post_text.contains("id=\"loginbtn\"") {
                return Err("Falha na autenticação do Aprender 3. Verifique seu CPF e senha.".to_string());
            }
        }

        // 3. GET /my/courses.php para extrair dados da sessão autenticada (sesskey e userId)
        let courses_url = format!("{}/my/courses.php", base_url);
        let courses_res = self
            ._client
            .get(&courses_url)
            .header("Referer", base_url)
            .send()
            .await
            .map_err(|e| format!("Falha ao acessar Meus Cursos no Aprender 3: {}", e))?;

        let courses_html = courses_res
            .text()
            .await
            .map_err(|e| format!("Falha ao carregar conteúdo de Meus Cursos: {}", e))?;

        let (sesskey, user_id) = extract_session_info(&courses_html)
            .ok_or_else(|| "Sessão expirada ou não autenticada no Aprender 3.".to_string())?;

        if user_id == 0 && sesskey.is_empty() {
            return Err("Usuário não identificado na sessão do Aprender 3.".to_string());
        }

        // 4. Chamada ao WebService AJAX do Moodle para obter turmas do usuário
        let service_url = format!(
            "{}/lib/ajax/service.php?sesskey={}&info=core_course_get_enrolled_courses_by_timeline_classification",
            base_url, sesskey
        );

        let ws_body = serde_json::json!([
            {
                "index": 0,
                "methodname": "core_course_get_enrolled_courses_by_timeline_classification",
                "args": {
                    "offset": 0,
                    "limit": 0,
                    "classification": "all",
                    "sort": "fullname"
                }
            }
        ]);

        let ws_res = self
            ._client
            .post(&service_url)
            .json(&ws_body)
            .header("Referer", &courses_url)
            .send()
            .await;

        let mut courses = Vec::new();
        let mut ws_success = false;

        if let Ok(res) = ws_res {
            if let Ok(json_val) = res.json::<Value>().await {
                if let Ok(parsed) = parse_moodle_courses_ws(&json_val) {
                    if !parsed.is_empty() {
                        courses = parsed;
                        ws_success = true;
                    }
                }
            }
        }

        // Se o WebService não retornou turmas ou falhou, aciona o fallback de raspagem HTML
        if !ws_success || courses.is_empty() {
            let scraped = scrape_courses_html(&courses_html);
            if !scraped.is_empty() {
                courses = scraped;
            }
        }

        // 5. Coleta de tarefas e prazos via calendário Moodle
        let mut feed_items = Vec::new();
        let calendar_url = format!(
            "{}/lib/ajax/service.php?sesskey={}&info=core_calendar_get_action_events_by_timesort",
            base_url, sesskey
        );

        let cal_body = serde_json::json!([
            {
                "index": 0,
                "methodname": "core_calendar_get_action_events_by_timesort",
                "args": {
                    "timesortfrom": 0,
                    "limitnum": 200
                }
            }
        ]);

        if let Ok(cal_res) = self
            ._client
            .post(&calendar_url)
            .json(&cal_body)
            .header("Referer", &courses_url)
            .send()
            .await
        {
            if let Ok(cal_json) = cal_res.json::<Value>().await {
                feed_items = parse_moodle_calendar_events(&cal_json);
            }
        }

        // Atualiza a contagem de tarefas pendentes em cada turma (apenas não concluídas)
        for course in &mut courses {
            let count = feed_items
                .iter()
                .filter(|item| {
                    let matches_course = if let Some(code) = &item.course_code {
                        code.to_lowercase().contains(&course.code.to_lowercase())
                    } else {
                        item.course_name.to_lowercase().contains(&course.name.to_lowercase())
                    };
                    matches_course && item.is_completed != Some(true)
                })
                .count() as u32;

            course.pending_assignments_count = Some(count);
        }

        log::info!(
            "Aprender 3 sincronizado: {} turmas, {} itens de feed.",
            courses.len(),
            feed_items.len()
        );

        Ok((feed_items, courses))
    }
}

// =========================================================================
// Funções Utilitárias e Parsers Isolados (Testáveis Unitariamente)
// =========================================================================

pub fn clean_cpf(cpf: &str) -> String {
    let digits: String = cpf.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.is_empty() {
        cpf.trim().to_string()
    } else {
        digits
    }
}

pub fn extract_logintoken(html: &str) -> Option<String> {
    // 1. Selector CSS
    if let Ok(selector) = Selector::parse("input[name='logintoken']") {
        let document = Html::parse_document(html);
        if let Some(el) = document.select(&selector).next() {
            if let Some(val) = el.value().attr("value") {
                if !val.trim().is_empty() {
                    return Some(val.trim().to_string());
                }
            }
        }
    }
    // 2. Regex fallback
    let re = Regex::new(r#"name=["']logintoken["']\s+value=["']([^"']+)["']"#).ok()?;
    if let Some(cap) = re.captures(html) {
        return Some(cap[1].to_string());
    }
    let re2 = Regex::new(r#"value=["']([^"']+)["']\s+name=["']logintoken["']"#).ok()?;
    if let Some(cap) = re2.captures(html) {
        return Some(cap[1].to_string());
    }
    None
}

pub fn extract_session_info(html: &str) -> Option<(String, u64)> {
    let sesskey_re = Regex::new(r#""sesskey"\s*:\s*"([^"]+)""#).ok()?;
    let userid_re = Regex::new(r#""userId"\s*:\s*([0-9]+)"#).ok()?;

    let sesskey = sesskey_re.captures(html).map(|c| c[1].to_string())?;
    let userid = userid_re
        .captures(html)
        .and_then(|c| c[1].parse::<u64>().ok())
        .unwrap_or(0);

    Some((sesskey, userid))
}

pub fn parse_course_code_and_name(fullname: &str, shortname: &str) -> (String, String, String) {
    let code_re = Regex::new(r"\b([A-Z]{3}\d{4})\b").unwrap();
    let semester_re = Regex::new(r"(20\d{2}[./]\d)").unwrap();

    let code = if let Some(cap) = code_re.captures(fullname) {
        cap[1].to_string()
    } else if let Some(cap) = code_re.captures(shortname) {
        cap[1].to_string()
    } else if !shortname.trim().is_empty() {
        shortname.trim().to_string()
    } else {
        "UNB0000".to_string()
    };

    let semester = if let Some(cap) = semester_re.captures(fullname) {
        cap[1].replace('/', ".")
    } else if let Some(cap) = semester_re.captures(shortname) {
        cap[1].replace('/', ".")
    } else {
        "2026.2".to_string()
    };

    let clean_name = fullname.trim().to_string();

    (code, clean_name, semester)
}

pub fn parse_moodle_courses_ws(json_val: &Value) -> Result<Vec<Course>, String> {
    let mut courses = Vec::new();
    let courses_arr = json_val
        .get(0)
        .and_then(|root| root.get("data"))
        .and_then(|data| data.get("courses"))
        .and_then(|c| c.as_array())
        .ok_or_else(|| "Campo data.courses não encontrado na resposta do WebService".to_string())?;

    for item in courses_arr {
        let id_val = item.get("id");
        let id_str = match id_val {
            Some(Value::Number(n)) => n.to_string(),
            Some(Value::String(s)) => s.clone(),
            _ => continue,
        };

        let fullname = item.get("fullname").and_then(|s| s.as_str()).unwrap_or("Disciplina");
        let shortname = item.get("shortname").and_then(|s| s.as_str()).unwrap_or("");
        let viewurl = item
            .get("viewurl")
            .and_then(|s| s.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("https://aprender3.unb.br/course/view.php?id={}", id_str));

        let (code, name, semester) = parse_course_code_and_name(fullname, shortname);

        courses.push(Course {
            id: format!("aprender-{}", id_str),
            code,
            name,
            semester,
            platform: PlatformType::Aprender3,
            professor: None,
            classroom: None,
            schedule: None,
            unread_count: Some(0),
            pending_assignments_count: Some(0),
            url: Some(viewurl),
        });
    }

    Ok(courses)
}

pub fn scrape_courses_html(html: &str) -> Vec<Course> {
    let mut courses = Vec::new();
    let mut seen_ids = HashSet::new();

    let id_re = Regex::new(r"[?&]id=(\d+)").unwrap();
    let document = Html::parse_document(html);
    let selector = match Selector::parse("a[href*='/course/view.php']") {
        Ok(s) => s,
        Err(_) => return courses,
    };

    for element in document.select(&selector) {
        let href = match element.value().attr("href") {
            Some(h) => h,
            None => continue,
        };

        let id_str = match id_re.captures(href) {
            Some(cap) => cap[1].to_string(),
            None => continue,
        };

        if id_str == "1" || seen_ids.contains(&id_str) {
            continue;
        }

        let inner_text: String = element.text().collect::<Vec<_>>().join(" ");
        let clean_text = inner_text.split_whitespace().collect::<Vec<_>>().join(" ");

        if clean_text.is_empty() || clean_text.to_lowercase().contains("pular") {
            continue;
        }

        seen_ids.insert(id_str.clone());
        let (code, name, semester) = parse_course_code_and_name(&clean_text, "");
        let viewurl = if href.starts_with("http") {
            href.to_string()
        } else {
            format!("https://aprender3.unb.br/course/view.php?id={}", id_str)
        };

        courses.push(Course {
            id: format!("aprender-{}", id_str),
            code,
            name,
            semester,
            platform: PlatformType::Aprender3,
            professor: None,
            classroom: None,
            schedule: None,
            unread_count: Some(0),
            pending_assignments_count: Some(0),
            url: Some(viewurl),
        });
    }

    courses
}

pub fn parse_moodle_calendar_events(json_val: &Value) -> Vec<FeedItem> {
    let now_epoch = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    parse_moodle_calendar_events_with_now(json_val, now_epoch)
}

pub fn parse_moodle_calendar_events_with_now(json_val: &Value, now_epoch: i64) -> Vec<FeedItem> {
    let mut items = Vec::new();
    let events_arr = match json_val
        .get(0)
        .and_then(|root| root.get("data"))
        .and_then(|data| data.get("events"))
        .and_then(|e| e.as_array())
    {
        Some(arr) => arr,
        None => return items,
    };

    let tag_strip = Regex::new(r"<[^>]+>").unwrap();

    for ev in events_arr {
        let id = match ev.get("id") {
            Some(Value::Number(n)) => n.to_string(),
            Some(Value::String(s)) => s.clone(),
            _ => continue,
        };

        let title = ev
            .get("name")
            .and_then(|s| s.as_str())
            .unwrap_or("Atividade")
            .to_string();
        let raw_desc = ev.get("description").and_then(|s| s.as_str()).unwrap_or("");
        let content = tag_strip.replace_all(raw_desc, " ").trim().to_string();
        let final_content = if content.is_empty() {
            title.clone()
        } else {
            content
        };

        let course_name = ev
            .get("course")
            .and_then(|c| c.get("fullname"))
            .and_then(|s| s.as_str())
            .unwrap_or("Aprender 3")
            .to_string();

        let code_regex = Regex::new(r"\b([A-Z]{3}\d{4})\b").unwrap();
        let course_code = ev
            .get("course")
            .and_then(|c| c.get("shortname"))
            .and_then(|s| s.as_str())
            .map(|s| s.to_string())
            .or_else(|| {
                code_regex.captures(&course_name).map(|cap| cap[1].to_string())
            })
            .or_else(|| Some("A3".to_string()));

        let raw_url = ev
            .get("action")
            .and_then(|a| a.get("url"))
            .and_then(|s| s.as_str())
            .or_else(|| ev.get("url").and_then(|s| s.as_str()));

        let url = raw_url.map(|u| {
            if u.starts_with("http") {
                u.to_string()
            } else {
                format!("https://aprender3.unb.br{}", u)
            }
        });

        let timesort = ev
            .get("timesort")
            .and_then(|t| t.as_i64())
            .or_else(|| ev.get("timestart").and_then(|t| t.as_i64()))
            .unwrap_or(0);

        let due_date_iso = if timesort > 0 {
            Some(format_epoch_iso(timesort))
        } else {
            None
        };

        let created_at_iso = format_epoch_iso(
            ev.get("timecreated")
                .and_then(|t| t.as_i64())
                .unwrap_or_else(|| timesort.saturating_sub(86400)),
        );

        // 1. Prazo já expirado no passado
        let is_past_due = timesort > 0 && timesort < now_epoch;

        // 2. Ação já enviada / não requer mais envio pelo aluno
        let is_submitted = if let Some(action) = ev.get("action") {
            let actionable = action.get("actionable").and_then(|a| a.as_bool()).unwrap_or(true);
            let name = action.get("name").and_then(|n| n.as_str()).unwrap_or("");
            let itemcount = action.get("itemcount").and_then(|c| c.as_i64()).unwrap_or(1);

            !actionable
                || itemcount == 0
                || name.contains("Editar envio")
                || name.contains("Ver envio")
                || name.contains("Remover envio")
                || name.contains("Enviado")
        } else {
            false
        };

        let is_completed = is_past_due || is_submitted;

        items.push(FeedItem {
            id: format!("aprender-event-{}", id),
            platform: PlatformType::Aprender3,
            title,
            content: final_content,
            course_name,
            course_code,
            author: None,
            item_type: FeedItemType::Assignment,
            created_at: created_at_iso,
            due_date: due_date_iso,
            is_completed: Some(is_completed),
            external_url: url,
        });
    }

    items
}

fn format_epoch_iso(seconds: i64) -> String {
    let days_since_epoch = seconds / 86400;
    let time_of_day = (seconds % 86400 + 86400) % 86400;
    let hour = time_of_day / 3600;
    let minute = (time_of_day % 3600) / 60;
    let second = time_of_day % 60;

    let (year, month, day) = days_to_ymd(days_since_epoch);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hour, minute, second
    )
}

fn days_to_ymd(days: i64) -> (i64, u8, u8) {
    let z = days + 719468;
    let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u8;
    let m = (if mp < 10 { mp + 3 } else { mp - 9 }) as u8;
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

// =========================================================================
// Testes Unitários
// =========================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_cpf() {
        assert_eq!(clean_cpf("123.456.789-00"), "12345678900");
        assert_eq!(clean_cpf("12345678900"), "12345678900");
        assert_eq!(clean_cpf("  123 456  "), "123456");
    }

    #[test]
    fn test_extract_logintoken() {
        let html = r#"
            <form id="login">
                <input type="hidden" name="logintoken" value="AbCdEf123456Token">
                <input type="text" name="username">
            </form>
        "#;
        assert_eq!(
            extract_logintoken(html),
            Some("AbCdEf123456Token".to_string())
        );
    }

    #[test]
    fn test_extract_session_info() {
        let html = r#"
            <script>
                M.cfg = {"wwwroot":"https:\/\/aprender3.unb.br","sesskey":"ayHavRJcSG","userId":97318};
            </script>
        "#;
        let info = extract_session_info(html);
        assert_eq!(info, Some(("ayHavRJcSG".to_string(), 97318)));
    }

    #[test]
    fn test_parse_course_code_and_name() {
        let (code, name, sem) = parse_course_code_and_name(
            "CIC0099 - ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES - Turma 02 - 2026/2",
            "OAC_T2_26.2",
        );
        assert_eq!(code, "CIC0099");
        assert_eq!(
            name,
            "CIC0099 - ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES - Turma 02 - 2026/2"
        );
        assert_eq!(sem, "2026.2");

        let (code2, _, sem2) = parse_course_code_and_name(
            "IFD0177 - FISICA 2 EXPERIMENTAL - Turma 03 - 2026/2",
            "FISICA 2 EXP 03_2026.2",
        );
        assert_eq!(code2, "IFD0177");
        assert_eq!(sem2, "2026.2");
    }

    #[test]
    fn test_parse_moodle_courses_ws() {
        let sample_json = serde_json::json!([
            {
                "error": false,
                "data": {
                    "courses": [
                        {
                            "id": 31429,
                            "fullname": "CIC0099 - ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES - Turma 02 - 2026/2",
                            "shortname": "OAC_T2_26.2",
                            "viewurl": "https://aprender3.unb.br/course/view.php?id=31429"
                        },
                        {
                            "id": 30937,
                            "fullname": "IFD0177 - FISICA 2 EXPERIMENTAL - Turma 03 - 2026/2",
                            "shortname": "FISICA 2 EXP 03_2026.2",
                            "viewurl": "https://aprender3.unb.br/course/view.php?id=30937"
                        }
                    ]
                }
            }
        ]);

        let courses = parse_moodle_courses_ws(&sample_json).unwrap();
        assert_eq!(courses.len(), 2);
        assert_eq!(courses[0].id, "aprender-31429");
        assert_eq!(courses[0].code, "CIC0099");
        assert_eq!(
            courses[0].url,
            Some("https://aprender3.unb.br/course/view.php?id=31429".to_string())
        );
        assert_eq!(courses[1].id, "aprender-30937");
        assert_eq!(courses[1].code, "IFD0177");
    }

    #[test]
    fn test_scrape_courses_html() {
        let html = r#"
            <div>
                <a href="https://aprender3.unb.br/course/view.php?id=1">Página inicial</a>
                <a href="https://aprender3.unb.br/course/view.php?id=31429">
                    <span>CIC0099 - ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES</span>
                </a>
            </div>
        "#;
        let courses = scrape_courses_html(html);
        assert_eq!(courses.len(), 1);
        assert_eq!(courses[0].id, "aprender-31429");
        assert_eq!(courses[0].code, "CIC0099");
    }

    #[test]
    fn test_parse_moodle_calendar_events_status() {
        let reference_now: i64 = 1700000000; // Timestamp de referência

        let events_json = serde_json::json!([
            {
                "data": {
                    "events": [
                        {
                            "id": 101,
                            "name": "Trabalho 1: Compiladores",
                            "description": "Entrega do analisador léxico",
                            "course": {
                                "fullname": "CIC0099 - Compiladores",
                                "shortname": "CIC0099"
                            },
                            "timesort": reference_now - 3600, // Prazo expirado (1h atrás)
                            "action": {
                                "name": "Adicionar envio",
                                "actionable": true,
                                "itemcount": 1,
                                "url": "/mod/assign/view.php?id=101"
                            }
                        },
                        {
                            "id": 102,
                            "name": "Lista 2: Grafos",
                            "description": "Resolução de exercícios",
                            "course": {
                                "fullname": "CIC0090 - Estruturas de Dados",
                                "shortname": "CIC0090"
                            },
                            "timesort": reference_now + 86400, // Prazo futuro (amanhã)
                            "action": {
                                "name": "Editar envio", // Já enviado pelo aluno
                                "actionable": false,
                                "itemcount": 0,
                                "url": "/mod/assign/view.php?id=102"
                            }
                        },
                        {
                            "id": 103,
                            "name": "Projeto Final: Arquitetura",
                            "description": "Entrega do relatório final",
                            "course": {
                                "fullname": "CIC0105 - Arquitetura de Computadores",
                                "shortname": "CIC0105"
                            },
                            "timesort": reference_now + 172800, // Prazo futuro (em 2 dias)
                            "action": {
                                "name": "Adicionar envio",
                                "actionable": true,
                                "itemcount": 1,
                                "url": "/mod/assign/view.php?id=103"
                            }
                        }
                    ]
                }
            }
        ]);

        let items = parse_moodle_calendar_events_with_now(&events_json, reference_now);
        assert_eq!(items.len(), 3);

        // 1. Trabalho 1 (prazo vencido) -> Concluído
        let t1 = items.iter().find(|i| i.id == "aprender-event-101").unwrap();
        assert_eq!(t1.is_completed, Some(true));

        // 2. Lista 2 (já enviado / actionable == false) -> Concluído
        let t2 = items.iter().find(|i| i.id == "aprender-event-102").unwrap();
        assert_eq!(t2.is_completed, Some(true));

        // 3. Projeto Final (prazo futuro e pendente) -> NÃO concluído
        let t3 = items.iter().find(|i| i.id == "aprender-event-103").unwrap();
        assert_eq!(t3.is_completed, Some(false));
    }

    #[tokio::test]
    #[ignore]
    async fn test_live_sync_aprender3() {
        let cpf = std::env::var("APRENDER3_CPF").unwrap_or_default();
        let senha = std::env::var("APRENDER3_SENHA").unwrap_or_default();
        if cpf.is_empty() || senha.is_empty() {
            println!("APRENDER3_CPF ou APRENDER3_SENHA não definidas no ambiente, pulando teste live.");
            return;
        }

        let client = MoodleClient::new();
        let (items, courses) = client
            .sync_aprender3(&cpf, &senha)
            .await
            .expect("Live sync failed");

        println!("Live sync concluído: {} turmas, {} itens", courses.len(), items.len());
        assert!(!courses.is_empty(), "Deveria carregar ao menos uma turma");
        assert!(courses.iter().any(|c| c.code == "CIC0099"));
    }
}
