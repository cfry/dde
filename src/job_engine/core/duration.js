class Duration {
    //DO NOT default minutes to anything as we need null there so that the first arg will be interprested as ms
    constructor(string_or_hours=0, minutes=0, seconds=0, milliseconds=0){ //First arg can be "12:34" for hours:mins,
        // "12:34:56" for hours:mins:secs,
        // or 123 for hours
        if (typeof(string_or_hours) == "string") { //presume "12:34"(hours and mins) or "12:34:56" hours, mins, secs
            if (is_hour_colon_minute(string_or_hours) || is_hour_colon_minute_colon_second(string_or_hours)){
                var [h, m, s] = string_or_hours.split(":")
                var secs = parseInt(h) * 60 * 60
                secs += parseInt(m) * 60
                if (s) { secs += parseInt(s) }
                this.milliseconds = secs * 1000 //to get milliseconds
                return
            }
        }
        else if (typeof(string_or_hours) == "number"){
            let secs = (string_or_hours * 60 * 60) + (minutes * 60) + seconds
            this.milliseconds = (secs * 1000) + milliseconds
            return
        }
        throw new Error("new Duration passed arg: " + string_or_hours + " which is not a number or a string of the format 12:34 or 12:34:56 ")
    }
    toString() { return this.to_source_code }

    to_source_code(){
        let total_ms  = this.milliseconds
        let ms        = total_ms  % 1000
        let total_sec = (total_ms - ms)   / 1000
        let sec       = total_sec % 60
        let total_min = (total_sec - sec) / 60
        let min       = total_min % 60
        let hour      = (total_min - min) / 60
        return "new Duration(" + hour + ", " + min + ", " + sec + ", " + ms + ")"
    }

    to_seconds(){ return this.milliseconds / 1000 }
}

globalThis.Duration = Duration