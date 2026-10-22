pub mod commands;
pub mod grade_scraper;
pub mod models;
pub mod moodle;
pub mod schedule_solver;
pub mod scraper;
pub mod sigaa;

use tauri::Manager;
use tauri_specta::{collect_commands, Builder};

/// Fonte única da superfície IPC: os commands registrados aqui geram os
/// bindings TypeScript em `src/lib/bindings.ts` (via `cargo test export_bindings`).
pub fn builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::sync_platforms,
        commands::check_vault_status,
        commands::get_sigaa_departments,
        commands::scrape_sigaa_classes,
        commands::get_courses_catalog,
        commands::get_course_curriculum,
        commands::get_all_curricula,
        commands::fetch_sigaa_academic_history,
        commands::solve_schedules,
        commands::check_schedule_conflicts,
        commands::open_external_url,
        commands::validate_sigaa_credentials,
        commands::validate_aprender3_credentials,
        commands::connect_teams,
        commands::disconnect_teams,
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = builder();

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/core/infrastructure/bindings.ts",
        )
        .expect("Falha ao exportar bindings TypeScript");

    tauri::Builder::default()
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_filter(|label| label == "main")
                .build(),
        )
        .setup(|app| {
            // Inicialização do cofre criptográfico com derivação Argon2 do Tauri Stronghold
            let app_data_dir = app
                .path()
                .app_local_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            let _ = std::fs::create_dir_all(&app_data_dir);

            let salt_filename = if cfg!(debug_assertions) {
                "vault_dev.salt"
            } else {
                "vault.salt"
            };
            let salt_path = app_data_dir.join(salt_filename);

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            app.handle()
                .plugin(tauri_plugin_sql::Builder::default().build())?;

            app.handle()
                .plugin(tauri_plugin_notification::init())?;

            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle()
                    .plugin(tauri_plugin_process::init())?;
                app.handle()
                    .plugin(tauri_plugin_autostart::init(
                        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                        None,
                    ))?;
            }

            log::info!("Plugins Tauri Stronghold e SQL (SQLite) inicializados com sucesso.");

            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("erro durante a execução do aplicativo Saruê UnB");
}

#[cfg(test)]
mod tests {
    #[test]
    fn export_bindings() {
        crate::builder()
            .export(
                specta_typescript::Typescript::default(),
                "../src/core/infrastructure/bindings.ts",
            )
            .expect("Falha ao exportar bindings TypeScript");
    }
}
