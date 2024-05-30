// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use tauri::api::path::config_dir;
use serde_json::Value;
// use auto_launch::*;

fn main()
{
    // AUTO LAUNCH SETTINGS
    // let auto = AutoLaunchBuilder::new()
    //     .set_app_name("20-20-20")
    //     .set_app_path("./")
    //     .set_use_launch_agent(true)
    //     .build()
    //     .unwrap();

    // READ SETTINGS
    let file_path = format!("{}\\com.app-20-20-20.dev\\settings.json", config_dir().unwrap().display());
    let settings_file_result = fs::read_to_string(file_path.as_str());

    // The settings file might not exist. The frontend will automatically create it if it doesn't
    let settings_file = match settings_file_result
    {
        Ok(file) => file,
        Err(_error) => "false".to_string(),
    };

    // SYSTEM TRAY
    let start = CustomMenuItem::new("start".to_string(), "Start");
    let pause = CustomMenuItem::new("pause".to_string(), "Pause");
    let reset = CustomMenuItem::new("reset".to_string(), "Reset");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(start)
        .add_item(pause)
        .add_item(reset)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(show)
        .add_item(hide)
        .add_item(quit);

    let tray_id = "app-20-20-20";
    let tray = SystemTray::new().with_id(tray_id).with_menu(tray_menu).with_tooltip("");

    tauri::Builder::default()
        .on_window_event(|event| match event.event()
        {
            tauri::WindowEvent::Destroyed =>
            {
                let window = event.window();

                if window.label() == "main"
                {
                    window.app_handle().exit(0);
                }
            }

            _ => {}
        })
        .setup(move |app|
        {
            // If settings file does exist, handle the APP__* settings
            if settings_file != "false"
            {
                let window = app.get_window("main").unwrap();
                let settings: Value = serde_json::from_str(&settings_file).unwrap();
                let _start_app_at_login: String = settings.get("APP__START_APP_AT_LOGIN").unwrap().to_string();
                let show_app_on_launch: String = settings.get("APP__SHOW_APP_ON_LAUNCH").unwrap().to_string();

                if show_app_on_launch == "false"
                {
                    window.minimize().unwrap();
                    window.hide().unwrap();
                }

                // if start_app_at_login == "true"
                // {
                //     auto.enable().unwrap();
                //     auto.is_enabled().unwrap();
                // }
                // else
                // {
                //     auto.enable().unwrap();
                //     auto.is_enabled().unwrap();
                // }
            }

            // Tray tooltip will show countdown timer
            let tray_handle = app.handle().tray_handle_by_id(tray_id).unwrap();
            app.listen_global("time", move |event|
            {
                let payload = event.payload().unwrap();
                let time: Value = serde_json::from_str(payload).unwrap();
                let minutes: i32 = time.get("minutes").unwrap().to_string().parse().unwrap();
                let seconds: i32 = time.get("seconds").unwrap().to_string().parse().unwrap();
                tray_handle.set_tooltip(format!("{:02}:{:02}", minutes, seconds).as_str()).unwrap();
            });

            Ok(())
        })
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick
            {
                position: _,
                size: _,
                ..
            } =>
            {
                let window = app.get_window("main").unwrap();
                window.unminimize().unwrap();
                window.show().unwrap();
            }

            SystemTrayEvent::MenuItemClick { id, .. } =>
            {
                let window = app.get_window("main").unwrap();

                match id.as_str()
                {
                    "start" => { let _ = window.emit("start", true); }
                    "pause" => { let _ = window.emit("pause", true); }
                    "reset" => { let _ = window.emit("reset", true); }
                    "show" => { window.unminimize().unwrap(); window.show().unwrap(); }
                    "hide" => { window.hide().unwrap(); }
                    "quit" => { std::process::exit(0); }
                    _ => {}
                }
            }

            _ => {}
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");        
}