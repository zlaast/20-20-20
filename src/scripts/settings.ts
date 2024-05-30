import { exists, createDir, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";

export type Settings =
{
    APP__START_APP_AT_LOGIN: boolean,
    APP__SHOW_APP_ON_LAUNCH: boolean,
    APP__MINIMIZE_TO_TRAY: boolean,
    DISPLAY__APP_LOCATION: string,
    DISPLAY__NOTIFICATION_LOCATION: string,
    TIMER__START_ON_APP_LAUNCH: boolean,
    TIMER__START_AFTER_RESET: boolean,
    SETUP_COMPLETE: boolean
}

export async function readSettings()
{
    try
    {
        await exists('settings.json', { dir: BaseDirectory.AppConfig })
        
        const file = await readTextFile('settings.json', { dir: BaseDirectory.AppConfig })
        const settings: Settings = JSON.parse(file)

        return settings
    }
    catch
    {
        const defaultSettings: Settings =
        {
            APP__START_APP_AT_LOGIN: false,
            APP__SHOW_APP_ON_LAUNCH: true,
            APP__MINIMIZE_TO_TRAY: true,
            DISPLAY__APP_LOCATION: "default",
            DISPLAY__NOTIFICATION_LOCATION: "br",
            TIMER__START_ON_APP_LAUNCH: true,
            TIMER__START_AFTER_RESET: true,
            SETUP_COMPLETE: true
        }
        await writeSettings(defaultSettings)
    }
}

export async function writeSettings(inputSettings: Settings)
{
    try
    {
        const SETTINGS: Settings = {
            "SETUP_COMPLETE": inputSettings.SETUP_COMPLETE,
            "APP__START_APP_AT_LOGIN": inputSettings.APP__START_APP_AT_LOGIN,
            "APP__SHOW_APP_ON_LAUNCH": inputSettings.APP__SHOW_APP_ON_LAUNCH,
            "APP__MINIMIZE_TO_TRAY": inputSettings.APP__MINIMIZE_TO_TRAY,
            "DISPLAY__APP_LOCATION": inputSettings.DISPLAY__APP_LOCATION,
            "DISPLAY__NOTIFICATION_LOCATION": inputSettings.DISPLAY__NOTIFICATION_LOCATION,
            "TIMER__START_ON_APP_LAUNCH": inputSettings.TIMER__START_ON_APP_LAUNCH,
            "TIMER__START_AFTER_RESET": inputSettings.TIMER__START_AFTER_RESET
        }

        const dir = await exists('', { dir: BaseDirectory.AppConfig })
        if (!dir)
        {
            await createDir('', { dir: BaseDirectory.AppData })
        }

        await writeTextFile("settings.json", JSON.stringify(SETTINGS), { dir: BaseDirectory.AppConfig })
    
    }
    catch (error)
    {
        console.log(error)
    }
}