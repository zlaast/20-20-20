import { LogicalPosition, appWindow } from '@tauri-apps/api/window'
import { Timer } from './timer'
import sound from '../assets/notification.mp3'

const TIME = 20
const timer = new Timer(0, TIME)
let animationFinished = false

window.addEventListener('DOMContentLoaded', async () =>
{
    let time = null
    let progress = 0
    const progressEl = document.getElementById("progress") as HTMLProgressElement

    progressEl!.textContent = String(TIME)
    progressEl!.style.setProperty("--value", Number(0).toLocaleString('en-US', { minimumIntegerDigits: 2 }))

    // Open toast
    toastAnimation(true)

    // Start countdown
    let countdown = setInterval(() =>
    {
        if (animationFinished)
        {
            timer.start()
            time = timer.get_time
            progress = (TIME*1000 - time.seconds*1000 - time.fraction)/200
            progressEl!.textContent = String(time.seconds)
            progressEl!.style.setProperty("--value", Number(progress).toLocaleString('en-US', { minimumIntegerDigits: 2 }))
        }
    }, 1000)
    
    // Close toast
    setTimeout(() =>
    {
        toastAnimation(false)
        clearInterval(countdown)    
    }, TIME*1000)
})

async function toastAnimation(show: boolean)
{
    animationFinished = false
    const audio = new Audio(sound)
    let position = await appWindow.outerPosition()
    let x = position.x
    let y = position.y

    audio.play()
    let animation = setInterval(() =>
    {
        if (show)
            y = position.y++
        else
            y = position.y--

        appWindow.setPosition(new LogicalPosition(x, y))
        
        setTimeout(() =>
        { 
            clearInterval(animation)
            animationFinished = true
        }, 790)
    }, 1)
}