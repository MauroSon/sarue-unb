use crate::models::{
    Aprender3Creds, Course, FeedItem, PlatformType, SigaaCreds, SyncResult, TeamsCreds,
};
use crate::moodle::MoodleClient;
use crate::scraper::HiddenWebviewScraper;
use crate::sigaa::SigaaClient;
use std::collections::HashMap;

use tauri::{command, AppHandle};

#[command]
#[specta::specta]
pub async fn sync_platforms(
    app: AppHandle,
    platforms: Vec<PlatformType>,
    sigaa: Option<SigaaCreds>,
    aprender3: Option<Aprender3Creds>,
    teams: Option<TeamsCreds>,
) -> Result<SyncResult, String> {
    let mut all_items: Vec<FeedItem> = Vec::new();
    let mut all_courses: Vec<Course> = Vec::new();
    let mut errors: HashMap<PlatformType, String> = HashMap::new();

    let moodle = MoodleClient::new();

    for platform in platforms {
        match platform {
            PlatformType::Aprender3 => {
                let (cpf, senha) = match &aprender3 {
                    Some(c) => (c.cpf.trim(), c.senha.as_str()),
                    None => ("", ""),
                };
                if !cpf.is_empty() && !senha.is_empty() {
                    match moodle.sync_aprender3(cpf, senha).await {
                        Ok((items, courses)) => {
                            all_items.extend(items);
                            all_courses.extend(courses);
                        }
                        Err(e) => {
                            errors.insert(PlatformType::Aprender3, e);
                        }
                    }
                }
            }
            PlatformType::Sigaa => {
                let (matricula, senha) = match &sigaa {
                    Some(c) => (c.matricula.trim(), c.senha.as_str()),
                    None => ("", ""),
                };
                if !matricula.is_empty() && !senha.is_empty() {
                    let client = SigaaClient::new();
                    match client.sync_sigaa(matricula, senha).await {
                        Ok((items, courses)) => {
                            all_items.extend(items);
                            all_courses.extend(courses);
                        }
                        Err(e) => {
                            errors.insert(PlatformType::Sigaa, e);
                        }
                    }
                }
            }
            PlatformType::Teams => {
                let is_connected = teams.as_ref().and_then(|t| t.is_connected).unwrap_or(false);
                let email = teams.as_ref().and_then(|t| t.email.as_deref()).unwrap_or("");
                if is_connected && !email.is_empty() {
                    match HiddenWebviewScraper::sync_teams(&app, email, "").await {
                        Ok((items, courses)) => {
                            all_items.extend(items);
                            all_courses.extend(courses);
                        }
                        Err(e) => {
                            errors.insert(PlatformType::Teams, e);
                        }
                    }
                }
            }
        }
    }

    // Ordenação estrita por data decrescente
    all_items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(SyncResult {
        items: all_items,
        courses: all_courses,
        synced_at: chrono_like_timestamp(),
        errors: if errors.is_empty() { None } else { Some(errors) },
    })
}

#[command]
#[specta::specta]
pub fn check_vault_status() -> crate::models::VaultStatus {
    crate::models::VaultStatus {
        status: "ready".into(),
        encryption: "Argon2id (32 bytes)".into(),
        zero_telemetry: true,
    }
}

#[command]
#[specta::specta]
pub async fn get_sigaa_departments() -> Result<Vec<crate::grade_scraper::Department>, String> {
    crate::grade_scraper::SigaaGradeScraper::fetch_departments().await
}

#[command]
#[specta::specta]
pub async fn scrape_sigaa_classes(
    department_id: String,
    year: String,
    period: String,
) -> Result<Vec<crate::grade_scraper::ScrapedDiscipline>, String> {
    crate::grade_scraper::SigaaGradeScraper::scrape_department_classes(&department_id, &year, &period).await
}

#[command]
#[specta::specta]
pub async fn get_courses_catalog() -> Result<Vec<crate::grade_scraper::CourseCatalogItem>, String> {
    crate::grade_scraper::SigaaGradeScraper::fetch_courses_catalog().await
}

#[command]
#[specta::specta]
pub async fn get_course_curriculum(
    course_id: String,
) -> Result<Vec<crate::grade_scraper::CurriculumStructure>, String> {
    crate::grade_scraper::SigaaGradeScraper::fetch_course_curriculum(&course_id).await
}

#[command]
#[specta::specta]
pub async fn get_all_curricula() -> Result<Vec<crate::grade_scraper::CurriculumStructure>, String> {
    crate::grade_scraper::SigaaGradeScraper::fetch_all_curricula().await
}

#[command]
#[specta::specta]
pub async fn fetch_sigaa_academic_history(
    matricula: String,
    senha: String,
) -> Result<crate::models::DiscenteAcademicHistoryPayload, String> {
    let client = crate::sigaa::SigaaClient::new();
    client
        .fetch_discente_profile_and_historico(&matricula, &senha)
        .await
}

#[command]
#[specta::specta]
pub fn solve_schedules(
    candidate_classes: Vec<crate::grade_scraper::ScrapedClass>,
    preference_shift: Option<char>,
) -> Result<Vec<crate::schedule_solver::ScheduleOption>, String> {
    Ok(crate::schedule_solver::ScheduleSolver::solve(candidate_classes, preference_shift))
}

#[command]
#[specta::specta]
pub fn check_schedule_conflicts(
    classes: Vec<crate::grade_scraper::ScrapedClass>,
) -> Result<Vec<String>, String> {
    Ok(crate::schedule_solver::ScheduleSolver::find_conflicts(&classes))
}

#[command]
#[specta::specta]
pub fn open_external_url(url: String) -> Result<(), String> {
    log::info!("Abrindo URL externa no navegador padrão: {}", url);
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Falha ao abrir URL no macOS: {}", e))?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Falha ao abrir URL no Windows: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Falha ao abrir URL no Linux: {}", e))?;
    }
    Ok(())
}

fn chrono_like_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

#[command]
#[specta::specta]
pub async fn validate_sigaa_credentials(
    matricula: String,
    senha: String,
) -> Result<String, String> {
    let clean_matricula = matricula.trim();
    if clean_matricula.is_empty() || senha.is_empty() {
        return Err("Informe a matrícula e senha do SIGAA.".into());
    }
    let client = SigaaClient::new();
    let (html, _) = client.login_to_portal(clean_matricula, &senha).await?;
    let profile = SigaaClient::parse_discente_profile(&html, clean_matricula);
    let discente_name = profile.nome.unwrap_or_else(|| "Discente".into());
    Ok(format!("Conectado como {} ({})", discente_name, profile.curso))
}

#[command]
#[specta::specta]
pub async fn validate_aprender3_credentials(
    cpf: String,
    senha: String,
) -> Result<String, String> {
    let clean_cpf = crate::moodle::clean_cpf(&cpf);
    if clean_cpf.is_empty() || senha.is_empty() {
        return Err("Informe o CPF e senha do Aprender 3.".into());
    }
    let client = MoodleClient::new();
    let (_items, courses) = client.sync_aprender3(&clean_cpf, &senha).await?;
    Ok(format!("Conectado ao Aprender 3 ({} turmas encontradas)", courses.len()))
}


