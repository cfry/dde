class Metrics {
    static state = {"Eval button clicks": 0,
                    "Step button clicks": 0,
                    "Job button clicks": 0,
                    "Make Instruction inserts": 0}
    static init(){
        if(file_exists("dde_metrics.json")){
            this.state = JSON.parse(read_file("dde_metrics.json"))
        }
    }
    static increment_state(key){
        if(this.state[key]) {
            this.state[key] += 1
        }
        else {
            this.state[key] = 1
        }
        this.save()
        if(DDEVideo.misc_pane_menu_selection === "Reward Board"){ //refresh
            DDEVideo.show_in_misc_pane("Reward Board")
        }
    }
    static save(){
        write_file("dde_metrics.json", JSON.stringify(this.state))
    }
    static make_html(){
        let mid_html = "<div style='padding:15px;color:#00ff8f;font-weight:bold;font-size:18px;'>"
        for(let key in this.state){
            let item = "<div>" + key + ": " + this.state[key] + "</div>"
            mid_html += item
        }
        mid_html += "</div>"
        let result = "<div style='height:100%; background-color:black;'>" +
                     "<center style='color:white;font-size:28px;'>Reward Board</center>" +
                     mid_html +
                     this.make_magic_spells_html() +
                     "</div>"
        return result
    }
    //Magic Spells
    static self_printing_call = function() { out(" <code>Metrics.self_printing_call() </code> //select code, click Eval button.") }

    static magic_spells = {self_printing: "Metrics.self_printing_call()",
                           talking_clock: 'speak(new Date().getHours() + `, ` + new Date().getMinutes())'}
    static make_magic_spells_html(){
        let result = "<div style='padding:15px;color:#FFFF00;font-weight:bold;font-size:18px;'>Magic Spells</div>"
        for(let spell_name in this.magic_spells) {
            let code = this.magic_spells[spell_name]
            let item_html = `<button title='Cast Spell' 
                             style='font-weight:bold; background-color:#CC88FF; margin-left:20px; margin-bottom:10px;' 
                             onclick='` + code + `'>` + spell_name + `</button>`
            let incant_code = 'out("Incantation: <code> ' + code + '</code>")'
            let incantation_html = `<button title='Reveal Secret' 
                                    style='font-weight:bold; background-color:#FFAA00; margin-left:20px; margin-bottom:10px;' 
                                    onclick='` + incant_code + `'> Incantation </button>`
            result += item_html + " &nbsp;" + incantation_html + "<br/>"
        }
        result += "</div>"
        return result
    }

    static easter_egg_joke(){
        speak("What's the difference between a second, and, an ark, second?")
        setTimeout(function(){
            speak("3 letters.")
        }, 6000)
        out("degrees * 60 * 60 == arcseconds")
    }
}

globalThis.Metrics = Metrics