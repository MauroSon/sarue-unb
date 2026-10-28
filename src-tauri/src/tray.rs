use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

const IDLE_ICON_BYTES: &[u8] = include_bytes!("../icons/tray-icon.png");
const SYNCING_ICON_BYTES: &[u8] = include_bytes!("../icons/tray-syncing.png");

pub const TRAY_ID: &str = "main-tray";

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_item = MenuItem::with_id(app, "open", "Abrir Saruê UnB", true, None::<&str>)?;
    let sync_item = MenuItem::with_id(app, "sync", "Sincronizar agora", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Sair do Saruê", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(app, &[&open_item, &sep1, &sync_item, &sep2, &quit_item])?;

    let icon = Image::from_bytes(IDLE_ICON_BYTES)?;

    let _tray = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .icon_as_template(false)
        .tooltip("Saruê UnB")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "sync" => {
                let _ = app.emit("request-sync", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn update_tray_sync_state(app: &AppHandle, syncing: bool) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let (icon_bytes, tooltip) = if syncing {
            (SYNCING_ICON_BYTES, "Saruê UnB — Sincronizando dados...")
        } else {
            (IDLE_ICON_BYTES, "Saruê UnB")
        };

        if let Ok(img) = Image::from_bytes(icon_bytes) {
            let _ = tray.set_icon(Some(img));
        }
        let _ = tray.set_tooltip(Some(tooltip));
    }
    Ok(())
}
