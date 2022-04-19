/*Created by Fry on 6/19/17.*/

class Gamepad {
   //////keyboard specific code

    static clear_down_keys(){
        Gamepad.the_down_keys = new Array(256).fill(false)
    }
    static remember_keydown(event){
        Gamepad.the_down_keys[event.keyCode] = true
        //event.stopPropagation() //doesn't work in stopping keystokes going to the editor.
                                  //so just click mouse on another pane first.
    }
    static remember_keyup(event){
        Gamepad.the_down_keys[event.keyCode] = false
        //event.stopPropagation()
    }
    //this is effectively, "init". Do it once per dde session,
    //or whenever a key is "stuck down" and you want to clear
    //all "down" keys. Don't do it in the middle of a loop
    //as it will undo any legit down keys
    static start_remembering_keydown(sticky=false){
        this.clear_down_keys() //always "init" when starting to remember keydown
        if(!Gamepad.is_remembering_keydown){
            globalThis.addEventListener("keydown", Gamepad.remember_keydown)
            if(!sticky) { globalThis.addEventListener("keyup",  Gamepad.remember_keyup) }
            Gamepad.is_remembering_keydown = true
        }
        else if (!sticky){
            globalThis.removeEventListener("keyup",   Gamepad.remember_keyup)
        }
    }
    static stop_remembering_keydown(){
        globalThis.removeEventListener("keydown", Gamepad.remember_keydown)
        globalThis.removeEventListener("keyup",   Gamepad.remember_keyup)
        Gamepad.is_remembering_keydown = false
    }
    //used for testing
    //from https://stackoverflow.com/questions/596481/is-it-possible-to-simulate-key-press-events-programmatically
    //but modified.
    static simulate_keydown(keycode_or_keyname, isShift=false, isCtrl=false, isAlt=false, isMeta=false){
        let keycode = keycode_or_keyname
        if(typeof(keycode) == "string") { //keycode = keycode.charCodeAt(keycode)
            keycode = Gamepad.keycode_to_keyname_map.indexOf(keycode)
        }
        var e = new KeyboardEvent( "keydown", { bubbles:true, cancelable:true, keyCode: keycode, //char:String.fromCharCode(keycode), key:String.fromCharCode(keycode),
                                                shiftKey:isShift, ctrlKey:isCtrl, altKey:isAlt, metaKey:isMeta} );
        Object.defineProperty(e, 'keyCode', {get : function() { return this.keyCodeVal; } });
        e.keyCodeVal = keycode;
        document.dispatchEvent(e);
    }
    static keycode_to_keyname(keycode){ //keycode is NOT the ascii integer. keyname is the char, ie "a" or "3"
        return Gamepad.keycode_to_keyname_map[keycode]
    }
    ///////gamepad specific code
    //good for axes too
    static gamecode_to_gamename(but_or_axes_code){
        if (but_or_axes_code >= 0) { // 0 to 16 or so
            if (but_or_axes_code < Gamepad.gamecode_to_gamename_map.length){
                return Gamepad.gamecode_to_gamename_map[but_or_axes_code]
            }
            else { return "button" + but_or_axes_code }
        }
        else { //but_code is really an axis_code from -1 on down.
            let i = (but_or_axes_code + 1) * -1 //i is now axes names array index
            if (i < Gamepad.axes_names.length){
                return Gamepad.axes_names[i]
            }
            else { return "axes" + but_or_axes_code }
        }
    }

    static gamename_to_gamecode(gamename){
        for (var gamecode = 0; gamecode < Gamepad.gamecode_to_keycode_map.length; gamecode++) {
            var a_gamename =  Gamepad.gamecode_to_gamename(gamecode)
            if (a_gamename == gamename) { return gamecode }
        }
        for (var i = 0; i < Gamepad.axes_names.length; i++) {
            var a_gamename =  Gamepad.axes_names[i]
            if (a_gamename == gamename) { return (i + 1) * -1 }  //returns -1, -2, -3 or -4
        }
        if (gamename.startsWith("button")) {
            var gamecode_str = gamename.substring(6)
            if(Utils.is_string_a_integer(gamecode_str)){
                return Number.parseInt(gamecode_str)
            }
            else { return null }
        }
        return null
    }


    /////keyboard & gamepad code
    //return an array of literal objects, each one standing for a key that's down
    //this is the main user function.
    /*a,b,x,y l(eft bumper) r(ight bumper)
     [ left_stick   ] right_stick
     v view, m menu
     1-> 4 left trigger for values 0.25, 0.5. 0.71. 1
     and 6->9 right trigger
     arrows: up, down, left, right*/
     //may return null
    static gamecode_to_keycode(gamecode){ //gamecode is an integer 0 through 17 or so depending on the gamepad.
        if (gamecode >= Gamepad.gamecode_to_keycode_map.length) { return null }
        else if (gamecode < 0) { return null } //game axis, not a game button.
        else { return Gamepad.gamecode_to_keycode_map[gamecode] }
    }
    //may return null
    static keycode_to_gamecode(keycode){ //gamecode is an integer 0 through 17 or so depending on the gamepad.
        for (var gamecode = 0; gamecode < Gamepad.gamecode_to_keycode_map.length; gamecode++) {
            var a_keycode = Gamepad.gamecode_to_keycode_map[gamecode]
            if (a_keycode == keycode) { return gamecode }
        }
        var keyname = Gamepad.keycode_to_keyname(keycode)
        if (["1", "2", "3", "4"].includes(keyname)) {
            return Gamepad.gamename_to_gamecode("LEFT_TRIGGER")
        }
        else if (["5", "6", "7", "8"].includes(keyname)) {
            return Gamepad.gamename_to_gamecode("RIGHT_TRIGGER")
        }
        else { return null }
    }

    static down_keys(device="keyboard_gamepad", which_gamepad=0){
        const result = []
        if (device.includes("keyboard")){
            if (!Gamepad.is_remembering_keydown){
                 Gamepad.start_remembering_keydown()
            }
            for(var keycode = 0; keycode < Gamepad.the_down_keys.length; keycode++){
                if(Gamepad.the_down_keys[keycode]) {
                    var gamecode = Gamepad.keycode_to_gamecode(keycode)
                    var gamename = Gamepad.gamecode_to_gamename(gamecode)
                    var keyname  = Gamepad.keycode_to_keyname(keycode)
                    var val      = 1
                    switch(keyname){
                        case "1": val = 0.25; break;
                        case "2": val = 0.5;  break;
                        case "3": val = 0.75; break;
                        case "4": val = 1;    break;
                        case "5": val = 0.25; break;
                        case "6": val = 0.5.  break;
                        case "7": val = 0.75; break;
                        case "8": val = 1;    break;
                    }
                    result.push({device:   "keyboard",
                                 gamecode:  gamecode,
                                 gamename:  gamename,
                                 keycode:   keycode,
                                 keyname:   keyname,
                                 value:     val
                                })
                }
            }
        }
        if (device.includes("gamepad")){
            var gp = navigator.getGamepads()[which_gamepad]
            if (!gp && !device.includes("keyboard")) { //if there's no gamepad AND we're not allowing kwyboard input, then no possibility of any input so error
                if (which_gamepad > 3) {
                    dde_error("Usually, only 4 gamepads can be used (0 thru 3) but you tried for: " + which_gamepad)
                }
                else { dde_error("No gamepad at index: " + which_gamepad + " found." +
                    "<br/>Make sure a gamepad is plugged into a USB port," +
                    "<br/>Hit a button on it, and try again.")
                }
            }
            else if (gp) {
                const num_of_buttons = gp.buttons.length
                for (let gamecode = 0; gamecode < num_of_buttons; gamecode++){
                    var   but     = gp.buttons[gamecode]
                    if(but.pressed){
                        let gamename = Gamepad.gamecode_to_gamename(gamecode)
                        let keycode = Gamepad.gamecode_to_keycode(gamecode)
                        let keyname = (keycode ? Gamepad.keycode_to_keyname(keycode) : null)
                        result.push({device:   "gamepad",
                                     gamecode:  gamecode,
                                     gamename:  gamename,
                                     keycode:   keycode,
                                     keyname:   keyname,
                                     value:     1
                                     })
                    }
                }
                const num_of_axes = gp.axes.length
                for(let i = 0; i < num_of_axes; i++){
                    let val = gp.axes[i]
                    if ((val >= 0.1) || (val <= -0.1)) { //joysticks are "noisy" so filter out values close to 0
                        let axes_num = (i + 1) * -1 //axes_num is typically -1 thru -4
                        var axes_name = gamepad_button_number_to_name(axes_num)
                        result.push({gamename: axes_name,
                                     gamecode: axes_num, //will be -1, -2, -3, or -4
                                     keycode:  null,
                                     keyname:  null,
                                     value:    val //will not be 0
                                    })
                    }
                }
            }
        }
        return result
    }
    static is_key_down(keycode_or_keyname){
        let down_keys = this.down_keys()
        for(let obj of down_keys){
            if     (obj.keycode == keycode_or_keyname) { return true }
            else if(obj.keyname == keycode_or_keyname) { return true }
        }
        return false
    }
}

Gamepad.is_remembering_keydown = false
// Gamepad.start_remembering_keydown()
// Gamepad.down_keys()

//from https://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim/5829387#5829387
//array index is a keyCode and the corresponding value
//is the "name" of the key. Note that there's
//just 1 set of letters (upper case) because
//there's just one set of letters on a keyboard.
//the "name" is generally the name printed on the key though these vary slightly.
//this has nothing to do with ascii codes.
//this maps keycode (0 to 255)  to keyname (a string)
//speical keys:
// fn on both mac and windows does not get an event
//both shift keys, Alt/option keys and command/windows keys retun the same keycode
Gamepad.keycode_to_keyname_map = [
    "", // [0]
    "", // [1]
    "", // [2]
    "CANCEL", // [3]
    "", // [4]
    "", // [5]
    "HELP", // [6]
    "", // [7]
    "BACK_SPACE", // [8] sometimes called "delete"
    "TAB", // [9]
    "", // [10]
    "", // [11]
    "CLEAR", // [12]
    "ENTER", // [13]
    "ENTER_SPECIAL", // [14]
    "", // [15]
    "SHIFT", // [16]
    "CONTROL", // [17]
    "ALT", // [18] called "option" on Mac
    "PAUSE", // [19]
    "CAPS_LOCK", // [20]
    "KANA", // [21]
    "EISU", // [22]
    "JUNJA", // [23]
    "FINAL", // [24]
    "HANJA", // [25]
    "", // [26]
    "ESCAPE", // [27]
    "CONVERT", // [28]
    "NONCONVERT", // [29]
    "ACCEPT", // [30]
    "MODECHANGE", // [31]
    " ", //"SPACE", // [32]
    "PAGE_UP", // [33]
    "PAGE_DOWN", // [34]
    "END", // [35]
    "HOME", // [36]
    "LEFT", // [37]
    "UP", // [38]
    "RIGHT", // [39]
    "DOWN", // [40]
    "SELECT", // [41]
    "PRINT", // [42]
    "EXECUTE", // [43]
    "PRINTSCREEN", // [44]
    "INSERT", // [45]
    "DELETE", // [46]
    "", // [47]
    "0", // [48]
    "1", // [49]
    "2", // [50]
    "3", // [51]
    "4", // [52]
    "5", // [53]
    "6", // [54]
    "7", // [55]
    "8", // [56]
    "9", // [57]
    "COLON", // [58]
    "SEMICOLON", // [59]
    "LESS_THAN", // [60]
    "EQUALS", // [61]
    "GREATER_THAN", // [62]
    "QUESTION_MARK", // [63]
    "AT", // [64]
    "A", // [65]
    "B", // [66]
    "C", // [67]
    "D", // [68]
    "E", // [69]
    "F", // [70]
    "G", // [71]
    "H", // [72]
    "I", // [73]
    "J", // [74]
    "K", // [75]
    "L", // [76]
    "M", // [77]
    "N", // [78]
    "O", // [79]
    "P", // [80]
    "Q", // [81]
    "R", // [82]
    "S", // [83]
    "T", // [84]
    "U", // [85]
    "V", // [86]
    "W", // [87]
    "X", // [88]
    "Y", // [89]
    "Z", // [90]
    "OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
    "", // [92]
    "CONTEXT_MENU", // [93]
    "", // [94]
    "SLEEP", // [95]
    "NUMPAD0", // [96]
    "NUMPAD1", // [97]
    "NUMPAD2", // [98]
    "NUMPAD3", // [99]
    "NUMPAD4", // [100]
    "NUMPAD5", // [101]
    "NUMPAD6", // [102]
    "NUMPAD7", // [103]
    "NUMPAD8", // [104]
    "NUMPAD9", // [105]
    "MULTIPLY", // [106]
    "ADD", // [107]
    "SEPARATOR", // [108]
    "SUBTRACT", // [109]
    "DECIMAL", // [110]
    "DIVIDE", // [111]
    "F1", // [112]
    "F2", // [113]
    "F3", // [114]
    "F4", // [115]
    "F5", // [116]
    "F6", // [117]
    "F7", // [118]
    "F8", // [119]
    "F9", // [120]
    "F10", // [121]
    "F11", // [122]
    "F12", // [123]
    "F13", // [124]
    "F14", // [125]
    "F15", // [126]
    "F16", // [127]
    "F17", // [128]
    "F18", // [129]
    "F19", // [130]
    "F20", // [131]
    "F21", // [132]
    "F22", // [133]
    "F23", // [134]
    "F24", // [135]
    "", // [136]
    "", // [137]
    "", // [138]
    "", // [139]
    "", // [140]
    "", // [141]
    "", // [142]
    "", // [143]
    "NUM_LOCK", // [144]
    "SCROLL_LOCK", // [145]
    "WIN_OEM_FJ_JISHO", // [146]
    "WIN_OEM_FJ_MASSHOU", // [147]
    "WIN_OEM_FJ_TOUROKU", // [148]
    "WIN_OEM_FJ_LOYA", // [149]
    "WIN_OEM_FJ_ROYA", // [150]
    "", // [151]
    "", // [152]
    "", // [153]
    "", // [154]
    "", // [155]
    "", // [156]
    "", // [157]
    "", // [158]
    "", // [159]
    "CIRCUMFLEX", // [160]
    "EXCLAMATION", // [161]
    "DOUBLE_QUOTE", // [162]
    "HASH", // [163]
    "DOLLAR", // [164]
    "PERCENT", // [165]
    "AMPERSAND", // [166]
    "UNDERSCORE", // [167]
    "OPEN_PAREN", // [168]
    "CLOSE_PAREN", // [169]
    "ASTERISK", // [170]
    "PLUS", // [171]
    "PIPE", // [172]
    "HYPHEN_MINUS", // [173]
    "OPEN_CURLY_BRACKET", // [174]
    "CLOSE_CURLY_BRACKET", // [175]
    "TILDE", // [176]
    "", // [177]
    "", // [178]
    "", // [179]
    "", // [180]
    "VOLUME_MUTE", // [181]
    "VOLUME_DOWN", // [182]
    "VOLUME_UP", // [183]
    "",  // [184]
    "",  // [185]
    ";", // "SEMICOLON", // [186]
    "=", //"EQUALS", // [187]
    ",", //"COMMA", // [188]
    "-", //"MINUS", // [189]
    ".", //"PERIOD", // [190]
    "/", //"SLASH", // [191]
    "`", //"BACK_QUOTE", // [192]
    "", // [193]
    "", // [194]
    "", // [195]
    "", // [196]
    "", // [197]
    "", // [198]
    "", // [199]
    "", // [200]
    "", // [201]
    "", // [202]
    "", // [203]
    "", // [204]
    "", // [205]
    "", // [206]
    "", // [207]
    "", // [208]
    "", // [209]
    "", // [210]
    "", // [211]
    "", // [212]
    "", // [213]
    "", // [214]
    "", // [215]
    "", // [216]
    "", // [217]
    "", // [218]
    "[", //"OPEN_BRACKET", // [219]
    "\\", //"BACK_SLASH", // [220]
    "]", //"CLOSE_BRACKET", // [221]
    "'", //"QUOTE", // [222]
    "", // [223]
    "META", // [224]
    "ALTGR", // [225]
    "", // [226]
    "WIN_ICO_HELP", // [227]
    "WIN_ICO_00", // [228]
    "", // [229]
    "WIN_ICO_CLEAR", // [230]
    "", // [231]
    "", // [232]
    "WIN_OEM_RESET", // [233]
    "WIN_OEM_JUMP", // [234]
    "WIN_OEM_PA1", // [235]
    "WIN_OEM_PA2", // [236]
    "WIN_OEM_PA3", // [237]
    "WIN_OEM_WSCTRL", // [238]
    "WIN_OEM_CUSEL", // [239]
    "WIN_OEM_ATTN", // [240]
    "WIN_OEM_FINISH", // [241]
    "WIN_OEM_COPY", // [242]
    "WIN_OEM_AUTO", // [243]
    "WIN_OEM_ENLW", // [244]
    "WIN_OEM_BACKTAB", // [245]
    "ATTN", // [246]
    "CRSEL", // [247]
    "EXSEL", // [248]
    "EREOF", // [249]
    "PLAY", // [250]
    "ZOOM", // [251]
    "", // [252]
    "PA1", // [253]
    "WIN_OEM_CLEAR", // [254]
    "" // [255]
]

Gamepad.axes_names = [
    //axis name      //gamecode
    "LEFT_STICK_X",  //-1
    "LEFT_STICK_Y",  //-2
    "RIGHT_STICK_X", //-3
    "RIGHT_STICK_Y"  //-4
]

Gamepad.gamecode_to_gamename_map = [ //xbox one button names from https://support.xbox.com/en-US/xbox-one/accessories/xbox-one-wireless-controller
    "A",             //0 right thumb 0 or 1
    "B",             //1 right thumb 0 or 1
    "X",             //2 right thumb 0 or 1
    "Y",             //3 right thumb 0 or 1
    "LEFT_BUMPER",   //4 left  forefinger (above trigger) 0 or 1
    "RIGHT_BUMPER",  //5 right forefinger (above trigger) 0 or 1
    "LEFT_TRIGGER",  //6 left  forefinger 0 to 1
    "RIGHT_TRIGGER", //7 right forefinger 0 to 1
    "VIEW",          //8 left  thumb (near center little button) 0 or 1
    "MENU",          //9 right thumb (near center little button) 0 or 1
    "LEFT_STICK",    //10 left  thumb joystick button 0 or 1 and horizontal -1 to 1 and vertical -1 to 1
    "RIGHT_STICK",   //11 right thumb joystick button 0 or 1 and horizontal -1 to 1 and vertical -1 to 1
    "UP",            //12 left  thumb Direction pad 0 or 1
    "DOWN",          //13 left  thumb Direction pad 0 or 1
    "LEFT",          //14 left  thumb Direction pad 0 or 1
    "RIGHT",         //15 left  thumb Direction pad 0 or 1
    "OS_KEY"         //16 XBOX either thumb (top center of gamepad) 0 or 1
]

Gamepad.gamecode_to_keycode_map = [
//keycode, gamecode, keyname, gamename
     65,   //0, A       A
     66,   //1, B       B
     88,   //2, X       X
     89,   //3, Y       Y
     76,   //4, L       LEFT BUMPER
     82,   //5, R       RIGHT BUMPER
     52,   //6  4       LEFT_TRIGGER  (really keynames 1, 2, 3, 4)
     57,   //7  9       RIGHT_TRIGGER (really keynames 5 ,6, 7, 8)
     86,   //8  V       VIEW
     77,   //9  M       MENU
     219, //10  [       LEFT_STICK
     221, //11  ]       RIGHT_STICK
     38,  //12  UP      UP
     40,  //13  DOWN    DOWN
     37,  //14  LEFT    LEFT
     39,  //15  RIGHT   RIGHT
     91   //16  OS_KEY  OS_KEY
]

globalThis.Gamepad = Gamepad