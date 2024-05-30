import { clearInterval, setInterval } from 'worker-timers';

export class Timer 
{
    // Public Variables
    isRunning: boolean = false
    
    // Private Variables
    #minutes: number = 0
    #seconds: number = 0
    #timerID: any = null
    #timeLeft = { minutes: 0, seconds: 0, fraction: 0 }

    // Public Functions
    constructor(minutes: number, seconds: number)
    {
        this.#minutes = minutes
        this.#seconds = seconds
        this.#timeLeft = { minutes: minutes, seconds: seconds, fraction: 0 }
    }

    get get_time()
    {
        return this.#timeLeft
    }

    start()
    {
        if (!this.isRunning)
        {
            this.#timerID = setInterval(() => { this.#timer() }, 1000)
            this.isRunning = true
        }
    }

    pause()
    {
        clearInterval(this.#timerID)
        this.isRunning = false
    }

    reset()
    {
        clearInterval(this.#timerID)
        this.#timeLeft.minutes = this.#minutes
        this.#timeLeft.seconds = this.#seconds
        this.#timeLeft.fraction = 0
        this.isRunning = false
    }

    // Private Functions
    #timer()
    {
        if (this.#timeLeft.seconds == 0)
        {
            if (this.#timeLeft.minutes == 0)
            {
                this.#timeLeft.fraction = 0
                this.#timeLeft.seconds = this.#seconds
                this.#timeLeft.minutes = this.#minutes
            }
            else
            {
                this.#timeLeft.seconds = 59
                --this.#timeLeft.minutes
            }
        }
        else
        {
            --this.#timeLeft.seconds
        }
    }
}