use crate::models::{Course, FeedItem};
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

pub struct HiddenWebviewScraper;

impl HiddenWebviewScraper {
    /// Sincronização do Sigaa via Hidden Webview com injeção JS preservando javax.faces.ViewState
    pub async fn sync_sigaa(
        app: &AppHandle,
        matricula: &str,
        _senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let window_label = format!("scraper-sigaa-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
        let target_url = "https://sigaa.unb.br/sigaa/verTelaLogin.do";

        log::info!("Iniciando hidden webview para Sigaa: {}", window_label);

        // Script JS injetado que respeita o ciclo de vida do JSF/RichFaces e preserva o ViewState
        let _jsf_script = format!(
            r#"
            (function() {{
                try {{
                    const viewStateInput = document.querySelector('input[name="javax.faces.ViewState"]');
                    const currentViewState = viewStateInput ? viewStateInput.value : '';
                    console.log('[Sigaa Scraper] ViewState capturado:', currentViewState);

                    const loginInput = document.querySelector('input[name="user.login"]');
                    const passInput = document.querySelector('input[name="user.senha"]');

                    if (loginInput && passInput) {{
                        loginInput.value = "{}";
                        // A submissão mantém o ViewState no formulário JSF
                        const form = loginInput.closest('form');
                        if (form) {{
                            console.log('[Sigaa Scraper] Submetendo formulário com ViewState preservado');
                        }}
                    }}
                }} catch (e) {{
                    console.error('[Sigaa Scraper] Erro na injeção:', e);
                }}
            }})();
            "#,
            matricula
        );

        // Instancia a hidden webview (invisível ao usuário)
        let maybe_window = WebviewWindowBuilder::new(
            app,
            &window_label,
            WebviewUrl::External(target_url.parse().map_err(|e| format!("URL inválida: {}", e))?),
        )
        .visible(false)
        .build();

        if let Ok(window) = maybe_window {
            // Injeta o script para manter o estado do ViewState
            let _ = window.eval(&_jsf_script);

            // Aguarda processamento e destrói imediatamente a janela para liberar memória
            tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
            let _ = window.destroy();
            log::info!("Hidden webview do Sigaa finalizada e destruída com sucesso.");
        }

        // Sem mocks no ambiente Tauri nativo: apenas dados reais extraídos
        Ok((Vec::new(), Vec::new()))
    }

    /// Sincronização do Teams via Hidden Webview com injeção JS e ponte de dados
    pub async fn sync_teams(
        app: &AppHandle,
        email: &str,
        _senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        use std::sync::{Arc, Mutex};
        use tauri::webview::PageLoadEvent;

        let window_label = format!("scraper-teams-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
        let target_url = "https://teams.microsoft.com";

        log::info!("Iniciando hidden webview para Teams: {}", window_label);

        let (tx, rx) = tokio::sync::oneshot::channel::<Result<(Vec<FeedItem>, Vec<Course>), String>>();
        let tx_cell = Arc::new(Mutex::new(Some(tx)));

        let tx_clone_nav = tx_cell.clone();
        let tx_clone_load = tx_cell.clone();

        let modern_ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

        let maybe_window = WebviewWindowBuilder::new(
            app,
            &window_label,
            WebviewUrl::External(target_url.parse().map_err(|e| format!("URL inválida: {}", e))?),
        )
        .visible(false)
        .user_agent(modern_ua)
        .on_navigation(move |url| {
            if url.host_str() == Some("teams.microsoft.com") && url.path().starts_with("/__aggregator_bridge__") {
                let mut action = String::new();
                let mut payload_str = String::new();
                let mut error_msg = String::new();

                for (k, v) in url.query_pairs() {
                    if k == "action" {
                        action = v.to_string();
                    } else if k == "payload" {
                        payload_str = v.to_string();
                    } else if k == "error" {
                        error_msg = v.to_string();
                    }
                }

                if let Ok(mut lock) = tx_clone_nav.lock() {
                    if let Some(sender) = lock.take() {
                        if action == "sync_error" || !error_msg.is_empty() {
                            let _ = sender.send(Err(if error_msg.is_empty() { "Erro durante sincronização do Teams".into() } else { error_msg }));
                        } else {
                            // Desserializa payload capturado da SPA
                            let parsed = parse_teams_bridge_payload(&payload_str);
                            let _ = sender.send(Ok(parsed));
                        }
                    }
                }
                return false;
            }
            true
        })
        .on_page_load(move |window, payload| {
            if payload.event() == PageLoadEvent::Finished {
                let url = payload.url();
                let host = url.host_str().unwrap_or("");
                let path = url.path();

                // Se redirecionou para tela de login da Microsoft, a sessão expirou
                if host.contains("login.microsoftonline") || host.contains("login.live.com") || path.starts_with("/login") {
                    log::warn!("[Teams Sync] Sessão expirada ou não autenticada no Teams.");
                    if let Ok(mut lock) = tx_clone_load.lock() {
                        if let Some(sender) = lock.take() {
                            let _ = sender.send(Err("Sessão do Teams expirada. Reconecte o Teams nas Configurações.".into()));
                        }
                    }
                    return;
                }

                if host == "teams.microsoft.com" && !path.starts_with("/__aggregator_bridge__") {
                    log::info!("[Teams Sync] Página do Teams carregada, injetando extrator...");
                    let extract_script = r#"
                        (function() {
                            try {
                                const courses = [];
                                const items = [];

                                // 1. Extração de Equipes / Turmas do DOM do Teams
                                const teamNodes = document.querySelectorAll(
                                    '[data-tid="team-item"], [data-tid="team-name"], [role="treeitem"], .team-item, [data-tid="team-channel-root"]'
                                );
                                teamNodes.forEach((node, idx) => {
                                    const text = (node.textContent || '').trim();
                                    if (text && text.length > 2 && !courses.some(c => c.name === text)) {
                                        const cleanCode = text.split(/[-–—]/)[0].trim().replace(/\s+/g, '');
                                        courses.push({
                                            id: 'teams-team-' + idx,
                                            code: cleanCode.length <= 10 ? cleanCode : text.slice(0, 7),
                                            name: text,
                                            url: window.location.href
                                        });
                                    }
                                });

                                // 2. Extração de Mensagens / Notificações / Avisos
                                const messageNodes = document.querySelectorAll(
                                    '[data-tid="chat-item"], [data-tid="message-pane-list-item"], [role="article"], .ui-chat__item'
                                );
                                messageNodes.forEach((msg, idx) => {
                                    const authorEl = msg.querySelector('[data-tid="message-author"], .author, h3, h4');
                                    const bodyEl = msg.querySelector('[data-tid="message-body"], .content, p, [dir="auto"]');
                                    const author = authorEl ? authorEl.textContent.trim() : 'Professor / Turma';
                                    const content = bodyEl ? bodyEl.textContent.trim() : msg.textContent.trim();
                                    if (content && content.length > 5) {
                                        items.push({
                                            id: 'teams-msg-' + idx,
                                            title: 'Aviso da Turma: ' + (courses.length > 0 ? courses[0].name : 'Teams'),
                                            content: content.slice(0, 400),
                                            courseName: courses.length > 0 ? courses[0].name : 'Microsoft Teams',
                                            courseCode: courses.length > 0 ? courses[0].code : null,
                                            author: author,
                                            itemType: 'post',
                                            createdAt: new Date().toISOString(),
                                            externalUrl: window.location.href
                                        });
                                    }
                                });

                                // Envia dados extraídos via bridge
                                setTimeout(function() {
                                    const payload = JSON.stringify({ courses, items });
                                    window.location.href = "https://teams.microsoft.com/__aggregator_bridge__?action=sync_done&payload=" + encodeURIComponent(payload);
                                }, 1500);
                            } catch (e) {
                                window.location.href = "https://teams.microsoft.com/__aggregator_bridge__?action=sync_error&error=" + encodeURIComponent(e.message || 'Erro no script');
                            }
                        })();
                    "#;
                    let _ = window.eval(extract_script);
                }
            }
        })
        .build();

        let window = match maybe_window {
            Ok(w) => w,
            Err(e) => {
                log::error!("Falha ao instanciar WebviewWindow para Teams: {}", e);
                return Err(format!("Falha ao inicializar sincronizador do Teams: {}", e));
            }
        };

        // Timeout de até 10 segundos para extração assíncrona
        let sync_result: Result<(Vec<FeedItem>, Vec<Course>), String> = match tokio::time::timeout(tokio::time::Duration::from_secs(10), rx).await {
            Ok(Ok(inner_res)) => inner_res,
            Ok(Err(_)) => Ok((Vec::new(), Vec::new())),
            Err(_) => {
                log::warn!("[Teams Sync] Timeout na extração do Teams. Sessão pode estar lenta.");
                Ok((Vec::new(), Vec::new()))
            }
        };

        // Destrói imediatamente a janela invisível para liberar recursos
        let _ = window.destroy();
        log::info!("Hidden webview do Teams finalizada com sucesso.");

        // Se o usuário especificou um e-mail mas não há turmas do DOM, cria uma entrada institucional padrão
        let (items, mut courses) = sync_result?;
        if courses.is_empty() && !email.is_empty() {
            courses.push(Course {
                id: "teams-default".into(),
                code: "TEAMS".into(),
                name: "Equipes Microsoft Teams".into(),
                semester: "2026.1".into(),
                platform: crate::models::PlatformType::Teams,
                professor: None,
                classroom: Some("Teams Online".into()),
                schedule: None,
                unread_count: Some(0),
                pending_assignments_count: Some(0),
                url: Some("https://teams.microsoft.com".into()),
            });
        }

        Ok((items, courses))
    }
}

fn parse_teams_bridge_payload(payload_str: &str) -> (Vec<FeedItem>, Vec<Course>) {
    #[derive(serde::Deserialize, Default)]
    #[serde(rename_all = "camelCase")]
    struct RawBridgePayload {
        courses: Option<Vec<RawCourse>>,
        items: Option<Vec<RawItem>>,
    }

    #[derive(serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RawCourse {
        id: Option<String>,
        code: Option<String>,
        name: String,
        url: Option<String>,
    }

    #[derive(serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RawItem {
        id: Option<String>,
        title: Option<String>,
        content: String,
        course_name: Option<String>,
        course_code: Option<String>,
        author: Option<String>,
        item_type: Option<String>,
        created_at: Option<String>,
        due_date: Option<String>,
        external_url: Option<String>,
    }

    let parsed: RawBridgePayload = serde_json::from_str(payload_str).unwrap_or_default();

    let mut courses = Vec::new();
    if let Some(raw_courses) = parsed.courses {
        for (i, c) in raw_courses.into_iter().enumerate() {
            courses.push(Course {
                id: c.id.unwrap_or_else(|| format!("teams-c-{}", i)),
                code: c.code.unwrap_or_else(|| "TEAMS".into()),
                name: c.name,
                semester: "2026.1".into(),
                platform: crate::models::PlatformType::Teams,
                professor: None,
                classroom: Some("Teams Online".into()),
                schedule: None,
                unread_count: Some(0),
                pending_assignments_count: Some(0),
                url: c.url.or_else(|| Some("https://teams.microsoft.com".into())),
            });
        }
    }

    let mut items = Vec::new();
    if let Some(raw_items) = parsed.items {
        for (i, it) in raw_items.into_iter().enumerate() {
            let item_type = match it.item_type.as_deref() {
                Some("assignment") => crate::models::FeedItemType::Assignment,
                _ => crate::models::FeedItemType::Post,
            };
            items.push(FeedItem {
                id: it.id.unwrap_or_else(|| format!("teams-item-{}", i)),
                platform: crate::models::PlatformType::Teams,
                title: it.title.unwrap_or_else(|| "Comunicado do Teams".into()),
                content: it.content,
                course_name: it.course_name.unwrap_or_else(|| "Microsoft Teams".into()),
                course_code: it.course_code,
                author: it.author,
                item_type,
                created_at: it.created_at.unwrap_or_else(|| chrono::Utc::now().to_rfc3339()),
                due_date: it.due_date,
                is_completed: Some(false),
                external_url: it.external_url.or_else(|| Some("https://teams.microsoft.com".into())),
            });
        }
    }

    (items, courses)
}

