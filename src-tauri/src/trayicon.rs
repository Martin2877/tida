use crate::config::{get_config, set_config, write_config};
use crate::window::{persistent_window, screenshot_ocr_window, screenshot_translate_window};
use crate::APP;
use tauri::api::notification::Notification;
use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem,
    SystemTraySubmenu, WindowEvent,
};
use toml::Value;
#[cfg(any(target_os = "macos", target_os = "windows"))]
use window_shadows::set_shadow;

pub const CONFIG_TRAY_ITEM: &str = "config";
pub const QUIT_TRAY_ITEM: &str = "quit";
pub const PERSISTENT_WINDOW: &str = "persistent";
pub const OCR_WINDOW: &str = "ocr";
pub const SCREENSHOT_TRANSLATE: &str = "screenshot_translate";
pub const COPY_SOURCE: &str = "copy_source";
pub const COPY_TARGET: &str = "copy_target";
pub const COPY_SOURCE_TARGET: &str = "copy_source_target";
pub const COPY_CLOSE: &str = "copy_close";

// 创建托盘菜单
pub fn build_system_tray() -> SystemTray {
    let persistent = CustomMenuItem::new(PERSISTENT_WINDOW.to_string(), "翻译");
    let ocr = CustomMenuItem::new(OCR_WINDOW.to_string(), "截图OCR");
    let screenshot_translate = CustomMenuItem::new(SCREENSHOT_TRANSLATE.to_string(), "截图翻译");
    let config = CustomMenuItem::new(CONFIG_TRAY_ITEM.to_string(), "设置");
    let quit = CustomMenuItem::new(QUIT_TRAY_ITEM.to_string(), "退出");
    let tray_menu = SystemTrayMenu::new()
        .add_item(persistent)
        .add_submenu(SystemTraySubmenu::new(
            "自动复制",
            SystemTrayMenu::new()
                .add_item(CustomMenuItem::new(COPY_SOURCE.to_string(), "输入"))
                .add_item(CustomMenuItem::new(COPY_TARGET.to_string(), "结果"))
                .add_item(CustomMenuItem::new(
                    COPY_SOURCE_TARGET.to_string(),
                    "输入+结果",
                ))
                .add_native_item(SystemTrayMenuItem::Separator)
                .add_item(CustomMenuItem::new(COPY_CLOSE.to_string(), "关闭")),
        ))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(ocr)
        .add_item(screenshot_translate)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(config)
        .add_item(quit);
    SystemTray::new().with_menu(tray_menu)
}

// 启动独立翻译窗口
pub fn on_persistent_click() {
    persistent_window();
}

fn on_window_close(event: &WindowEvent) {
    let handle = APP.get().unwrap();
    if let WindowEvent::Destroyed { .. } = event {
        if let Err(e) = write_config(handle.state()) {
            Notification::new(&handle.config().tauri.bundle.identifier)
                .title("Config write failed")
                .body(e)
                .icon("pot")
                .show()
                .unwrap();
        }
    }
}

pub fn on_tray_click(app: &AppHandle) {
    let label = get_config("default_window", Value::from("config"), app.state());
    match label.as_str() {
        Some("config") => on_config_click(app),
        Some("persistent") => persistent_window(),
        Some("screenshot_ocr") => screenshot_ocr_window(),
        Some("screenshot_translate") => screenshot_translate_window(),
        Some(_) => {}
        None => {}
    }
}

// 打开设置
pub fn on_config_click(app: &AppHandle) {
    match app.get_window("config") {
        Some(window) => {
            window.set_focus().unwrap();
        }
        None => {
            let mut builder = tauri::WindowBuilder::new(
                app,
                "config",
                tauri::WindowUrl::App("index.html".into()),
            )
            .inner_size(800.0, 600.0)
            .min_inner_size(800.0, 400.0)
            .center()
            .focused(true)
            .visible(false)
            .title("Config");

            #[cfg(target_os = "linux")]
            {
                builder = builder.transparent(true);
            }
            #[cfg(target_os = "macos")]
            {
                builder = builder
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true);
            }
            #[cfg(not(target_os = "macos"))]
            {
                builder = builder.decorations(false);
            }
            let config_window = builder.build().unwrap();
            #[cfg(not(target_os = "linux"))]
            set_shadow(&config_window, true).unwrap_or_default();

            config_window.on_window_event(on_window_close);
        }
    }
}

pub fn on_ocr_click() {
    screenshot_ocr_window();
}

pub fn on_screenshot_translate_click() {
    screenshot_translate_window();
}
// 退出程序
pub fn on_quit_click() {
    std::process::exit(0);
}

pub fn on_auto_copy_click(app: &AppHandle, mode: i64) {
    set_config("auto_copy", Value::Integer(mode), app.state());
}

pub fn update_tray(app: &AppHandle, mode: i64, app_language: &str) {
    let tray = app.tray_handle();
    if mode != 0 {
        let _ = tray.get_item(COPY_SOURCE).set_selected(mode == 1);
        let _ = tray.get_item(COPY_TARGET).set_selected(mode == 2);
        let _ = tray.get_item(COPY_SOURCE_TARGET).set_selected(mode == 3);
        let _ = tray.get_item(COPY_CLOSE).set_selected(mode == 4);
    }
    match app_language {
        "zh_cn" => {
            let persistent = CustomMenuItem::new(PERSISTENT_WINDOW.to_string(), "查询");
            // let ocr = CustomMenuItem::new(OCR_WINDOW.to_string(), "截图OCR");
            // let screenshot_translate =
            //     CustomMenuItem::new(SCREENSHOT_TRANSLATE.to_string(), "截图翻译");
            let config = CustomMenuItem::new(CONFIG_TRAY_ITEM.to_string(), "设置");
            let quit = CustomMenuItem::new(QUIT_TRAY_ITEM.to_string(), "退出");
            let copy_source = CustomMenuItem::new(COPY_SOURCE.to_string(), "输入");
            let copy_target = CustomMenuItem::new(COPY_TARGET.to_string(), "结果");
            let copy_source_target =
                CustomMenuItem::new(COPY_SOURCE_TARGET.to_string(), "输入+结果");
            let copy_close = CustomMenuItem::new(COPY_CLOSE.to_string(), "关闭");
            let _ = tray.set_menu(
                SystemTrayMenu::new()
                    .add_item(persistent)
                    .add_submenu(SystemTraySubmenu::new(
                        "自动复制",
                        SystemTrayMenu::new()
                            .add_item(copy_source)
                            .add_item(copy_target)
                            .add_item(copy_source_target)
                            .add_native_item(SystemTrayMenuItem::Separator)
                            .add_item(copy_close),
                    ))
                    .add_native_item(SystemTrayMenuItem::Separator)
                    // .add_item(ocr)
                    // .add_item(screenshot_translate)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(config)
                    .add_item(quit),
            );
            #[cfg(not(target_os = "linux"))]
            tray.set_tooltip("pot").unwrap();
        }
        "zh_tw" => {
            let persistent = CustomMenuItem::new(PERSISTENT_WINDOW.to_string(), "翻譯");
            let ocr = CustomMenuItem::new(OCR_WINDOW.to_string(), "截圖OCR");
            let screenshot_translate =
                CustomMenuItem::new(SCREENSHOT_TRANSLATE.to_string(), "截圖翻譯");
            let config = CustomMenuItem::new(CONFIG_TRAY_ITEM.to_string(), "設置");
            let quit = CustomMenuItem::new(QUIT_TRAY_ITEM.to_string(), "退出");
            let copy_source = CustomMenuItem::new(COPY_SOURCE.to_string(), "原文");
            let copy_target = CustomMenuItem::new(COPY_TARGET.to_string(), "譯文");
            let copy_source_target =
                CustomMenuItem::new(COPY_SOURCE_TARGET.to_string(), "原文+譯文");
            let copy_close = CustomMenuItem::new(COPY_CLOSE.to_string(), "關閉");
            let _ = tray.set_menu(
                SystemTrayMenu::new()
                    .add_item(persistent)
                    .add_submenu(SystemTraySubmenu::new(
                        "自動複製",
                        SystemTrayMenu::new()
                            .add_item(copy_source)
                            .add_item(copy_target)
                            .add_item(copy_source_target)
                            .add_native_item(SystemTrayMenuItem::Separator)
                            .add_item(copy_close),
                    ))
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(ocr)
                    .add_item(screenshot_translate)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(config)
                    .add_item(quit),
            );
            #[cfg(not(target_os = "linux"))]
            tray.set_tooltip("pot").unwrap();
        }
        "en" => {
            let persistent = CustomMenuItem::new(PERSISTENT_WINDOW.to_string(), "Search");
            // let ocr = CustomMenuItem::new(OCR_WINDOW.to_string(), "Screenshot OCR");
            // let screenshot_translate =
            //     CustomMenuItem::new(SCREENSHOT_TRANSLATE.to_string(), "Screenshot Translate");
            let config = CustomMenuItem::new(CONFIG_TRAY_ITEM.to_string(), "Config");
            let quit = CustomMenuItem::new(QUIT_TRAY_ITEM.to_string(), "Quit");
            let copy_source = CustomMenuItem::new(COPY_SOURCE.to_string(), "Source");
            let copy_target = CustomMenuItem::new(COPY_TARGET.to_string(), "Target");
            let copy_source_target =
                CustomMenuItem::new(COPY_SOURCE_TARGET.to_string(), "Source+Target");
            let copy_close = CustomMenuItem::new(COPY_CLOSE.to_string(), "Close");
            let _ = tray.set_menu(
                SystemTrayMenu::new()
                    .add_item(persistent)
                    .add_submenu(SystemTraySubmenu::new(
                        "Auto Copy",
                        SystemTrayMenu::new()
                            .add_item(copy_source)
                            .add_item(copy_target)
                            .add_item(copy_source_target)
                            .add_native_item(SystemTrayMenuItem::Separator)
                            .add_item(copy_close),
                    ))
                    .add_native_item(SystemTrayMenuItem::Separator)
                    // .add_item(ocr)
                    // .add_item(screenshot_translate)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(config)
                    .add_item(quit),
            );
            #[cfg(not(target_os = "linux"))]
            tray.set_tooltip("pot").unwrap();
        }
        "ru" => {
            let persistent = CustomMenuItem::new(PERSISTENT_WINDOW.to_string(), "Перевести");
            let ocr = CustomMenuItem::new(OCR_WINDOW.to_string(), "Скриншот OCR");
            let screenshot_translate =
                CustomMenuItem::new(SCREENSHOT_TRANSLATE.to_string(), "Скриншот Перевести");
            let config = CustomMenuItem::new(CONFIG_TRAY_ITEM.to_string(), "Настройки");
            let quit = CustomMenuItem::new(QUIT_TRAY_ITEM.to_string(), "Выход");
            let copy_source = CustomMenuItem::new(COPY_SOURCE.to_string(), "Исходный");
            let copy_target = CustomMenuItem::new(COPY_TARGET.to_string(), "Цель");
            let copy_source_target =
                CustomMenuItem::new(COPY_SOURCE_TARGET.to_string(), "Исходный+Цель");
            let copy_close = CustomMenuItem::new(COPY_CLOSE.to_string(), "Закрыть");
            let _ = tray.set_menu(
                SystemTrayMenu::new()
                    .add_item(persistent)
                    .add_submenu(SystemTraySubmenu::new(
                        "Автокопирование",
                        SystemTrayMenu::new()
                            .add_item(copy_source)
                            .add_item(copy_target)
                            .add_item(copy_source_target)
                            .add_native_item(SystemTrayMenuItem::Separator)
                            .add_item(copy_close),
                    ))
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(ocr)
                    .add_item(screenshot_translate)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(config)
                    .add_item(quit),
            );
            #[cfg(not(target_os = "linux"))]
            tray.set_tooltip("pot").unwrap();
        }
        "pt_br" => {
            let persistent = CustomMenuItem::new(PERSISTENT_WINDOW.to_string(), "Tradução");
            let ocr = CustomMenuItem::new(OCR_WINDOW.to_string(), "OCR da Imagem da Tela");
            let screenshot_translate =
                CustomMenuItem::new(SCREENSHOT_TRANSLATE.to_string(), "Traduzir Imagem da Tela");
            let config = CustomMenuItem::new(CONFIG_TRAY_ITEM.to_string(), "Configurações");
            let quit = CustomMenuItem::new(QUIT_TRAY_ITEM.to_string(), "Sair");
            let copy_source = CustomMenuItem::new(COPY_SOURCE.to_string(), "Texto Fonte");
            let copy_target = CustomMenuItem::new(COPY_TARGET.to_string(), "Texto Traduzido");
            let copy_source_target = CustomMenuItem::new(
                COPY_SOURCE_TARGET.to_string(),
                "Texto Fonte & Texto Traduzido",
            );
            let copy_close = CustomMenuItem::new(COPY_CLOSE.to_string(), "Desabilitar");
            let _ = tray.set_menu(
                SystemTrayMenu::new()
                    .add_item(persistent)
                    .add_submenu(SystemTraySubmenu::new(
                        "Copiar Automaticamente",
                        SystemTrayMenu::new()
                            .add_item(copy_source)
                            .add_item(copy_target)
                            .add_item(copy_source_target)
                            .add_native_item(SystemTrayMenuItem::Separator)
                            .add_item(copy_close),
                    ))
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(ocr)
                    .add_item(screenshot_translate)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(config)
                    .add_item(quit),
            );
            #[cfg(not(target_os = "linux"))]
            tray.set_tooltip("pot").unwrap();
        }
        _ => {}
    }
}
