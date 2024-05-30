<script setup lang="ts">
    // IMPORTS
    import { ref, onMounted } from 'vue'
    import { WebviewWindow, appWindow, primaryMonitor, availableMonitors } from '@tauri-apps/api/window'
    import { setInterval, setTimeout } from 'worker-timers'

    // IMPORTS: Scripts I wrote
    import { Timer } from './scripts/timer'
    import { Settings, readSettings, writeSettings } from './scripts/settings'

    // GLOBALS
    const TIME = 20
    const timer = new Timer(TIME, 0)
    
    // VUE REFS
    const minutes = ref()
    const seconds = ref()
    const appHidden = ref(false)
    const setupHidden = ref(true)
    const startButtonHidden = ref(false)
    const pauseButtonHidden = ref(true)
    
    // VUE REFS: Settings
    const DISPLAYS = ref()
    const SETTINGS = ref()
    const PRIMARY_DISPLAY = ref()
    const APP__START_APP_AT_LOGIN = ref()
    const APP__SHOW_APP_ON_LAUNCH = ref()
    const APP__MINIMIZE_TO_TRAY = ref()
    const DISPLAY__APP_LOCATION = ref()
    const DISPLAY__NOTIFICATION_LOCATION = ref()
    const TIMER__START_ON_APP_LAUNCH = ref()
    const TIMER__START_AFTER_RESET = ref()
    const SETUP_COMPLETE = ref(false)
    
    onMounted(async () =>
    {
        // APP ELEMENT SETTINGS
        DISPLAYS.value = await availableMonitors()
        PRIMARY_DISPLAY.value = await primaryMonitor()
        await _readSettings().then(() =>
        {
            if (SETUP_COMPLETE.value == false)
            {
                appHidden.value = true
                setupHidden.value = false
            }
        })

        if (TIMER__START_ON_APP_LAUNCH.value.checked)
        {
            timer.start()
            startButtonHidden.value = true
            pauseButtonHidden.value = false
        }

        // SYSTEM TRAY EVENTS
        appWindow.listen('start', startTimer);
        appWindow.listen('pause', pauseTimer);
        appWindow.listen('reset', resetTimer);

        // TIMER INITIAL VALUES
        minutes.value.style.setProperty("--value", Number(TIME).toLocaleString('en-US', { minimumIntegerDigits: 2 }))
        seconds.value.style.setProperty("--value", Number(0).toLocaleString('en-US', { minimumIntegerDigits: 2 }))

        // POLL TIME AND POP TOAST
        let time = null
        let toastFlag = true
        const toastHeight: number = 200
        const toastWidth: number = 500

        setInterval(async () =>
        {
            if (APP__MINIMIZE_TO_TRAY.value.checked)
            {
                let minimized = await appWindow.isMinimized()
                if (minimized)
                    appWindow.hide()
            }

            time = timer.get_time
            minutes.value.style.setProperty("--value", Number(time.minutes).toLocaleString('en-US', { minimumIntegerDigits: 2 }))
            seconds.value.style.setProperty("--value", Number(time.seconds).toLocaleString('en-US', { minimumIntegerDigits: 2 }))
            appWindow.emit("time", time)

            // Show notification
            if (time.minutes == 0 && time.seconds == 0 && toastFlag)
            {
                toastFlag = false
                resetTimer()
                pauseTimer()

                let position = notificationLocation(toastHeight, toastWidth)

                if (DISPLAY__NOTIFICATION_LOCATION.value == "tl" || DISPLAY__NOTIFICATION_LOCATION.value == "tr")
                    new WebviewWindow("toast", {url: "../toastTop/index.html", alwaysOnTop: true, closable: false, decorations: false, height: toastHeight, width: toastWidth, x: position[0], y: position[1]})
                else
                    new WebviewWindow("toast", {url: "../toastBottom/index.html", alwaysOnTop: true, closable: false, decorations: false, height: toastHeight, width: toastWidth, x: position[0], y: position[1]})
                
                setTimeout(() => 
                {
                    WebviewWindow.getByLabel("toast")?.close()
                    startTimer()
                    toastFlag = true
                }, (TIME*1000 + 1600))
            }
        }, 1000)
    })

    function startTimer()
    {
        if (timer.isRunning == false)
        {
            timer.start()
            startButtonHidden.value = true
            pauseButtonHidden.value = false
        }
    }

    function pauseTimer()
    {
        if (timer.isRunning == true)
        {
            timer.pause()
            startButtonHidden.value = false
            pauseButtonHidden.value = true
        }
    }

    function resetTimer()
    {
        timer.reset()

        if (TIMER__START_AFTER_RESET.value.checked)
            startTimer()
        else
            pauseTimer()
    }

    async function _readSettings()
    {
        SETTINGS.value = await readSettings()

        if (typeof SETTINGS.value !== "undefined")
        {
            APP__START_APP_AT_LOGIN.value.checked = SETTINGS.value.APP__START_APP_AT_LOGIN
            APP__SHOW_APP_ON_LAUNCH.value.checked = SETTINGS.value.APP__SHOW_APP_ON_LAUNCH
            APP__MINIMIZE_TO_TRAY.value.checked = SETTINGS.value.APP__MINIMIZE_TO_TRAY
            DISPLAY__APP_LOCATION.value = SETTINGS.value.DISPLAY__APP_LOCATION
            DISPLAY__NOTIFICATION_LOCATION.value = SETTINGS.value.DISPLAY__NOTIFICATION_LOCATION
            TIMER__START_ON_APP_LAUNCH.value.checked = SETTINGS.value.TIMER__START_ON_APP_LAUNCH
            TIMER__START_AFTER_RESET.value.checked = SETTINGS.value.TIMER__START_AFTER_RESET
            SETUP_COMPLETE.value = SETTINGS.value.SETUP_COMPLETE
    
            if (SETTINGS.value.DISPLAY__APP_LOCATION == "default")
            {
                DISPLAY__APP_LOCATION.value = PRIMARY_DISPLAY.value.name
            }
        }
    }

    async function _writeSettings()
    {
        const settings: Settings = {
            APP__START_APP_AT_LOGIN: APP__START_APP_AT_LOGIN.value.checked,
            APP__SHOW_APP_ON_LAUNCH: APP__SHOW_APP_ON_LAUNCH.value.checked,
            APP__MINIMIZE_TO_TRAY: APP__MINIMIZE_TO_TRAY.value.checked,
            DISPLAY__APP_LOCATION: DISPLAY__APP_LOCATION.value,
            DISPLAY__NOTIFICATION_LOCATION: DISPLAY__NOTIFICATION_LOCATION.value,
            TIMER__START_ON_APP_LAUNCH: TIMER__START_ON_APP_LAUNCH.value.checked,
            TIMER__START_AFTER_RESET: TIMER__START_AFTER_RESET.value.checked,
            SETUP_COMPLETE: true
        }
        await writeSettings(settings)
    }

    function notificationLocation(toastHeight: number, toastWidth: number)
    {
        let monitor: any = null
        let location = DISPLAY__NOTIFICATION_LOCATION.value

        Array.from(DISPLAYS.value).forEach((display: any) =>
        {
            if (display.name == DISPLAY__APP_LOCATION.value)
                monitor = display
        })

        switch (location)
        {
            case "tl":
                return [monitor.position.x, -toastHeight]

            case "tr":
                return [monitor.position.x + monitor.size.width - toastWidth, -toastHeight]

            case "bl":
                return [monitor.position.x, monitor.size.height]

            case "br":
                return [monitor.position.x + monitor.size.width - toastWidth, monitor.size.height]

            default:
                return [monitor.position.x + monitor.size.width - toastWidth, monitor.size.height]
        }
    }
</script>

<template>
    <div :class="{ hidden: setupHidden }">
        <div class="hero min-h-screen bg-base-200">
            <div class="hero-content text-center">
                <div class="max-w-md">
                    <h1 class="text-5xl font-bold">20-20-20 Setup Complete</h1>
                    <p class="py-6">Hi! The app needed to perform some setup before it could be used. You'll need to restart the app before it will function properly.</p>
                </div>
            </div>
        </div>
    </div>
    <div :class="{ hidden: appHidden }">
        <div>
            <ul class="menu menu-horizontal bg-base-200 flex justify-center mb-10">
                <li>
                    <button :class="{ hidden: startButtonHidden }" @click="startTimer">
                        <span>Start</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: #a6adbb;"><path d="M7 6v12l10-6z"></path></svg>
                    </button>
                </li>
                <li>
                    <button :class="{ hidden: pauseButtonHidden }" @click="pauseTimer">
                        <span>Pause</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: #a6adbb;"><path d="M8 7h3v10H8zm5 0h3v10h-3z"></path></svg>
                    </button>
                </li>
                <li>
                    <button @click="resetTimer">
                        <span>Reset</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: #a6adbb;"><path d="M12 16c1.671 0 3-1.331 3-3s-1.329-3-3-3-3 1.331-3 3 1.329 3 3 3z"></path><path d="M20.817 11.186a8.94 8.94 0 0 0-1.355-3.219 9.053 9.053 0 0 0-2.43-2.43 8.95 8.95 0 0 0-3.219-1.355 9.028 9.028 0 0 0-1.838-.18V2L8 5l3.975 3V6.002c.484-.002.968.044 1.435.14a6.961 6.961 0 0 1 2.502 1.053 7.005 7.005 0 0 1 1.892 1.892A6.967 6.967 0 0 1 19 13a7.032 7.032 0 0 1-.55 2.725 7.11 7.11 0 0 1-.644 1.188 7.2 7.2 0 0 1-.858 1.039 7.028 7.028 0 0 1-3.536 1.907 7.13 7.13 0 0 1-2.822 0 6.961 6.961 0 0 1-2.503-1.054 7.002 7.002 0 0 1-1.89-1.89A6.996 6.996 0 0 1 5 13H3a9.02 9.02 0 0 0 1.539 5.034 9.096 9.096 0 0 0 2.428 2.428A8.95 8.95 0 0 0 12 22a9.09 9.09 0 0 0 1.814-.183 9.014 9.014 0 0 0 3.218-1.355 8.886 8.886 0 0 0 1.331-1.099 9.228 9.228 0 0 0 1.1-1.332A8.952 8.952 0 0 0 21 13a9.09 9.09 0 0 0-.183-1.814z"></path></svg>
                    </button>
                </li>
                <li>
                    <button onclick="settings_modal.showModal()">Settings</button>
                </li>
            </ul>
        </div>
        <div class="text-center">
            <div class="stats">
                <div class="stat place-items-center rounded-box bg-base-200">
                    <div class="stat-value text-7xl font-mono font-normal countdown">
                        <span ref="minutes"></span>
                    </div>
                    <div class="stat-desc text-lg select-none">Minutes</div>
                </div>
                <div class="stat place-items-center rounded-box bg-base-200">
                    <div class="stat-value text-7xl font-mono font-normal countdown">
                        <span ref="seconds"></span>
                    </div>
                    <div class="stat-desc text-lg select-none">Seconds</div>
                </div>
            </div>
        </div>

        <!-- SETTINGS -->
        <dialog id="settings_modal" class="modal">
            <div class="modal-box">
                <h3 class="font-bold text-xl mb-3">Settings</h3>

                <!-- TAB 1: APP SETTINGS -->
                <div role="tablist" class="tabs tabs-bordered">
                    <input type="radio" name="my_tabs_1" role="tab" class="tab" aria-label="App&nbsp;Settings" checked />
                    <div role="tabpanel" class="tab-content p-10">
                        <div class="py-2 hidden">
                            <label for="APP__START_APP_AT_LOGIN">
                                <strong>Start at login</strong>
                                <p class="pb-2">Start the app when you login to your computer.</p>
                                <input type="checkbox" ref="APP__START_APP_AT_LOGIN" class="toggle toggle-success toggle-md" />
                            </label>
                        </div>
                        <div class="py-2">
                            <label for="APP__SHOW_APP_ON_LAUNCH">
                                <strong>Show app on launch</strong>
                                <p class="pb-2">When the app starts, show the app. Otherwise, the app will start in the background and can be opened from the tray.</p>
                                <input type="checkbox" ref="APP__SHOW_APP_ON_LAUNCH" class="toggle toggle-success toggle-md" />
                            </label>
                        </div>
                        <div class="py-2">
                            <label for="APP__MINIMIZE_TO_TRAY">
                                <strong>Minimize to tray</strong>
                                <p class="pb-2">When the minimize button is pressed, the app minimizes to the tray.</p>
                                <input type="checkbox" ref="APP__MINIMIZE_TO_TRAY" class="toggle toggle-success toggle-md" />
                            </label>
                        </div>
                    </div>
                    
                    <!-- TAB 2: DISPLAY SETTINGS -->
                    <input type="radio" name="my_tabs_1" role="tab" class="tab" aria-label="Display&nbsp;Settings" />
                    <div role="tabpanel" class="tab-content p-10">
                        <div class="py-2">
                            <label for="DISPLAY__APP_LOCATION">
                                <strong>Display Location</strong>
                                <p class="pb-2">If you have a multi-monitor setup, you may choose which display the app starts on.</p>
                                <div v-if="DISPLAYS">
                                    <template v-for="display in DISPLAYS">
                                        <div class="form-control">
                                            <label class="label cursor-pointer">
                                                <span class="label-text">{{ display.name }}</span> 
                                                <input type="radio" name="radio-10" class="radio" :value="display.name" v-model="DISPLAY__APP_LOCATION" />
                                            </label>
                                        </div>
                                    </template>
                                </div>
                                <div v-else>
                                    <span class="loading loading-spinner loading-sm"></span>
                                </div>
                            </label>
                        </div>
                        <div class="py-2">
                            <label for="DISPLAY__NOTIFICATION_LOCATION">
                                <strong>Notification Location</strong>
                                <p class="mb-3">You may choose where the notification appears on your screen. This option also respects which display you choose.</p>
                                <div class="flex flex-col border rounded-lg p-2 border-gray-600">
                                    <div class="flex justify-between mb-10">
                                        <label for="tl" class="flex">
                                            <input type="radio" name="radio-1" class="radio" value="tl" v-model="DISPLAY__NOTIFICATION_LOCATION" />
                                            <p class="ml-2 label-text">Top-Left</p>
                                        </label>
                                        <label for="tr" class="flex">
                                            <p class="mr-2 label-text">Top-Right</p>
                                            <input type="radio" name="radio-1" class="radio" value="tr" v-model="DISPLAY__NOTIFICATION_LOCATION" />
                                        </label>
                                    </div>
                                    <div class="flex justify-between">
                                        <label for="bl" class="flex">
                                            <input type="radio" name="radio-1" class="radio" value="bl" v-model="DISPLAY__NOTIFICATION_LOCATION" />
                                            <p class="ml-2 label-text">Bottom-Left</p>
                                        </label>
                                        <label for="br" class="flex">
                                            <p class="mr-2 label-text">Bottom-Right</p>
                                            <input type="radio" name="radio-1" class="radio" value="br" v-model="DISPLAY__NOTIFICATION_LOCATION" />
                                        </label>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- TAB 3: TIMER SETTINGS -->
                    <input type="radio" name="my_tabs_1" role="tab" class="tab" aria-label="Timer&nbsp;Settings" />
                    <div role="tabpanel" class="tab-content p-10">
                        <div class="py-2">
                            <label for="TIMER__START_ON_APP_LAUNCH">
                                <strong>Start timer on app launch</strong>
                                <p class="pb-2">If this option is checked, when the app is launched, the timer will immediately start counting down. Otherwise, you will have to manually start the timer.</p>
                                <input type="checkbox" ref="TIMER__START_ON_APP_LAUNCH" class="toggle toggle-success toggle-md" />
                            </label>
                        </div>
                        <div class="py-2">
                            <label for="TIMER__START_AFTER_RESET">
                                <strong>Start after reset</strong>
                                <p class="pb-2">If this option is checked, when the timer is reset, it will immediately start counting down. Otherwise, you will have to manually start the timer.</p>
                                <input type="checkbox" ref="TIMER__START_AFTER_RESET" class="toggle toggle-success toggle-md" />
                            </label>
                        </div>
                    </div>
                </div>

                <!-- SAVE & CLOSE OR CANCEL BUTTONS -->
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn mr-2" id="settings-save" @click="_writeSettings">Save & Close</button>
                        <button class="btn" id="settings-cancel" @click="_readSettings">Cancel</button>
                    </form>
                </div>
            </div>
        </dialog>
    </div>
</template>