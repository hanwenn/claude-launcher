mod commands;
mod errors;
mod models;
mod services;

use commands::{folders, launcher, network, sessions};
use services::session_parser::SessionParser;
use std::sync::Mutex;

/// Guard for serializing config read-modify-write sequences to prevent race conditions.
pub struct ConfigLock(pub Mutex<()>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(SessionParser::new())
        .manage(ConfigLock(Mutex::new(())))
        .invoke_handler(tauri::generate_handler![
            folders::get_folders,
            folders::add_folder,
            folders::remove_folder,
            sessions::get_sessions,
            sessions::get_session_detail,
            network::check_dns_health,
            launcher::launch_claude,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
