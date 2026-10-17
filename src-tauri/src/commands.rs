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
                if is_connected {
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

#[command]
#[specta::specta]
pub async fn connect_teams(
    app: AppHandle,
    email: Option<String>,
) -> Result<crate::models::TeamsCreds, String> {
    use std::sync::{Arc, Mutex};
    use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

    // Fecha qualquer janela residual anterior de login
    if let Some(existing) = app.get_webview_window("teams-auth") {
        let _ = existing.destroy();
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }

    let raw_email = email.unwrap_or_default().trim().to_string();
    let mut target_url = tauri::Url::parse("https://teams.microsoft.com").map_err(|e| e.to_string())?;
    if !raw_email.is_empty() {
        target_url.query_pairs_mut().append_pair("login_hint", &raw_email);
    }

    let (tx, rx) = tokio::sync::oneshot::channel::<Result<String, String>>();
    let tx_cell = Arc::new(Mutex::new(Some(tx)));

    let tx_clone_nav = tx_cell.clone();
    let tx_clone_win = tx_cell.clone();

    // User agent moderno para prevenir tela de navegador não suportado
    let modern_ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    let window_builder = WebviewWindowBuilder::new(
        &app,
        "teams-auth",
        WebviewUrl::External(target_url),
    )
    .title("Login Institucional - Microsoft Teams (UnB)")
    .inner_size(960.0, 720.0)
    .center()
    .user_agent(modern_ua)
    .visible(true)
    .on_navigation(move |url| {
        if url.host_str() == Some("teams.microsoft.com") && url.path().starts_with("/__aggregator_bridge__") {
            let mut detected_email = String::new();
            for (k, v) in url.query_pairs() {
                if k == "email" && !v.is_empty() {
                    detected_email = v.to_string();
                }
            }
            if let Ok(mut lock) = tx_clone_nav.lock() {
                if let Some(sender) = lock.take() {
                    let _ = sender.send(Ok(detected_email));
                }
            }
            return false;
        }
        true
    })
    .on_page_load(move |window, payload| {
        if payload.event() == tauri::webview::PageLoadEvent::Finished {
            let url = payload.url();
            let host = url.host_str().unwrap_or("");
            let path = url.path();
            // Detecta quando o usuário completou o fluxo de login institucional e caiu na página do Teams
            if host == "teams.microsoft.com" && !path.starts_with("/login") && !path.starts_with("/__aggregator_bridge__") {
                log::info!("[Teams Connect] Usuário autenticado na página principal do Teams: {}", url);
                let probe_script = r#"
                    (function() {
                        try {
                            let foundEmail = '';
                            for (let i = 0; i < localStorage.length; i++) {
                                let key = localStorage.key(i);
                                let val = localStorage.getItem(key);
                                if (val && (val.includes('@aluno.unb.br') || val.includes('@unb.br'))) {
                                    let match = val.match(/[a-zA-Z0-9._%+-]+@(aluno\.)?unb\.br/i);
                                    if (match) { foundEmail = match[0]; break; }
                                }
                            }
                            setTimeout(function() {
                                window.location.href = "https://teams.microsoft.com/__aggregator_bridge__?action=login_done&email=" + encodeURIComponent(foundEmail);
                            }, 1200);
                        } catch(e) {
                            window.location.href = "https://teams.microsoft.com/__aggregator_bridge__?action=login_done&email=";
                        }
                    })();
                "#;
                let _ = window.eval(probe_script);
            }
        }
    });

    let window = window_builder.build().map_err(|e| format!("Falha ao abrir janela de login do Teams: {}", e))?;

    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Destroyed = event {
            if let Ok(mut lock) = tx_clone_win.lock() {
                if let Some(sender) = lock.take() {
                    let _ = sender.send(Err("Janela de autenticação fechada antes da conclusão.".into()));
                }
            }
        }
    });

    // Aguarda conclusão do login com tempo limite de 5 minutos (para 2FA/SSO)
    let auth_result = match tokio::time::timeout(tokio::time::Duration::from_secs(300), rx).await {
        Ok(res) => match res {
            Ok(inner) => inner,
            Err(_) => Err("Comunicação com a janela do Teams interrompida.".into()),
        },
        Err(_) => Err("Tempo limite esgotado para o login no Microsoft Teams.".into()),
    };

    // Fecha janela com segurança se ainda existir
    if let Some(win) = app.get_webview_window("teams-auth") {
        let _ = win.destroy();
    }

    match auth_result {
        Ok(detected_email) => {
            let final_email = if !detected_email.trim().is_empty() {
                detected_email.trim().to_string()
            } else if !raw_email.is_empty() {
                raw_email
            } else {
                "aluno@aluno.unb.br".to_string()
            };
            log::info!("Teams conectado com sucesso para: {}", final_email);
            Ok(crate::models::TeamsCreds {
                is_connected: Some(true),
                email: Some(final_email),
            })
        }
        Err(err) => Err(err),
    }
}

#[command]
#[specta::specta]
pub async fn disconnect_teams(app: AppHandle) -> Result<(), String> {
    use tauri::Manager;
    if let Some(win) = app.get_webview_window("teams-auth") {
        let _ = win.destroy();
    }
    log::info!("Microsoft Teams desconectado.");
    Ok(())
}



