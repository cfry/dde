/* Eval this file, click to talk and say the
sentences provided in the dialog. Make sure your
sound is turned up so you can hear the responses.
You must have a good web connection.
Uses MIT's START English parser.
*/

var Start = class Start{ 
  static parse(sentence, callback=out){
    let sent_plused = sentence.replace(/\s+/g, "+")
    let url = "http://start.csail.mit.edu/api.php?server=guest&action=parse&te=formatted-text&kb=no&query=" +
               sent_plused
    get_page_async(url, callback)
  }
  static say(sentence) { 
  	  Start.parse(sentence, Structure.tell_or_ask)
  }
  static dialog(){
    recognize_speech(
    {title:  "Have a dialog with START",
     prompt: "<details><summary><b><i>Teach by saying...</i></b></summary>" +
             "<div style='margin-left:30px;'>" +
             "A robot has a hand.<br/>" +
             "If a robot has a hand, it is useful.<br/>" +
             "</div></details>" +
             "<details><summary><b><i>Ask Questions</i></b></summary>" +
             "<div style='margin-left:30px;'>" +
             "Does a robot have a hand?<br/>" +
             "Does a robot have a foot?<br/>" +
             "What has a hand?<br/>" +
             "Is a robot useful?<br/>" +
             "Why is a robot useful?<br/>" +
             "</div></details>" +
             "<details><summary><b><i>Ask for Meta-Knowledge</i></b></summary>" +
             "<div style='margin-left:30px;'>" +
             'What can you do? (or say "Help.")<br/>'    +
             "What do you know?<br/>"   +
             "What do you know about?<br/>"   +
             "What do you know about robots?<br/>" +
             "What did you say?<br/>" +
             "What did I say?<br/>"   +
             "</div></details>" +
             "<details><summary><b><i>Editing the Knowledge Base</i></b></summary>" +
             "<div style='margin-left:30px;'>" +
             "Forget what I just said.<br/>" +
             "Forget what I said about robots.<br/>" +
             "Forget everything." +
             "</div></details><br/>",
     click_to_talk:   true,
     only_once:       false,  
     height: 540, width: 310, x:500, y:100,
     background_color: "rgb(257, 219, 180)", //"rgb(217, 179, 140)",
     phrase_callback: Start.dialog_callback,     
     finish_callback: function(){speak("It was a pleasure talking with you.")},
     finish_phrase: "goodbye"
    })
  }
  
  static dialog_callback(text){
     out("Recognized: " + text)
     Start.parse(text,
       function(err, response, start_string){
          if(err) {
              out("Whoops! Can't access START website.")
          }
          else {
              let answer = Structure.tell_or_ask(start_string)
              if (answer == "not_understood"){
                 answer = "I can't understand sentences, like that."
              }
              else if (answer == "Understood.") { //means it was a 'tell'.
                 answer = Start.natural_acknowledgement()
              }
              speak(answer)
              Structure.conversation.push(answer)
              out("Answer: " + answer)
          }
       }
     )
  }
  
  static natural_acknowledgement(){
    let result = Start.acknowledgements[Start.acknowledgements_index]
    Start.acknowledgements_index += 1
    if (Start.acknowledgements_index === Start.acknowledgements.length){
        Start.acknowledgements_index = 0 //cycle around again  
    }
    return result
  }
}
Start.acknowledgements = ["OK", "Got it.", "Sure.", "I understand.", "Good.", "Yep."]
Start.acknowledgements_index = 0

var Structure = class Structure{
	constructor (start_string){
        if (start_string) { //allow for creating a raw Structure with no content, as "if_processing" needs
    	this.start_string      = start_string
        this.question_type     = start_string.includes("is_question Yes")
        if (this.question_type){
           this.utterance_type = "question"
           if      (start_string.includes("is_wh Yes"))          this.question_type = "what"
           else if (start_string.includes("has_purpose why"))    this.question_type = "why"
           else if (start_string.includes("has_location where")) this.question_type = "where"
           else if (start_string.includes("has_time when"))      this.question_type = "when"
           else if (start_string.includes("has_method how"))     this.question_type = "how"
           else                                                  this.question_type = "y_or_n"
        }
    	let lines = start_string.split("\n")   
        this.sentence = lines[0].substring(8)
        let svo   = lines[1]
        let words = Structure.string_to_word_array(svo)
        this.subject = words[0]
        this.verb    = words[1]
        this.object  = words[2]
        this.if_processing(lines)
        //Structure.structs.push(this) //now done by tell since we don't save questions
        }
    }
    
    if_processing(lines){
      if(this.verb === "if"){
        this.utterance_type = "rule"
        let condition_struct = new Structure()
        let condition_line   = lines[4] 
        let condition_words  = Structure.string_to_word_array(condition_line)
        condition_struct.sentence = condition_words.join(" ")
        if (last(condition_struct.sentence) != ".") { condition_struct.sentence = condition_struct.sentence + "." }
        condition_struct.subject = condition_words[0]
        condition_struct.verb    = condition_words[1]
        condition_struct.object  = condition_words[2]
        condition_struct.question_type  = false
        
        let action_struct  = new Structure()
        let action_line    = lines[2]
        let action_words   = Structure.string_to_word_array(action_line)
        action_struct.sentence = action_words.join(" ")
        if (last(action_struct.sentence) != ".") { action_struct.sentence = action_struct.sentence + "." }
        action_struct.subject = action_words[0]
        action_struct.verb    = action_words[1]
        action_struct.object  = action_words[2]
        action_struct.question_type  = false
        this.rule = {condition: condition_struct, action: action_struct}
      }
    }
    static string_to_word_array(str){
       str = str.trim()
       str = str.substring(1, str.length - 1)
       let words_with_numbs = str.split(" ")
       let words = []
       for(let word_num of words_with_numbs){
           let word = word_num.split("+")[0]
           words.push(word)
       }
       return words
    }
  
    static tell_or_ask(start_string){
      //out("t_or_a: " + start_string)
      let struct = new Structure(start_string)
      Structure.conversation.push(struct)
      switch(struct.sentence){
      	case "help":
            return this.ask_what_can_you_do()
      	case "forget what I just said":
        	return this.forget_what_i_just_said()  
        case "forget everything":
        	return this.forget_everything()   
        default:
        	if (struct.sentence.startsWith("forget what I said about")){
            	let a_noun = struct.sentence.substring(25).trim()
            	return this.forget_what_i_said_about_something(a_noun)
            }
      	  	else if (struct.utterance_type == "question"){ return struct.ask() }
      	  	else { return struct.tell() } //might be utterance_type == "rule" or 
              //not known which at this point it could be a valid fact or 
              // a not_understood
      }
    }
    
    tell(){ 
        if (Structure.struct_in_structs_with_sentence(this.sentence)){
        	return "I already know that." //don't add the same sentence twice
        }
        else if ((this.verb == "has_number") ||
                 (this.object == "null")){
                 return "not_understood"
        }
        else if (this.utterance_type == "rule"){
        	Structure.structs.push(this) 
        	return "Understood."
        }
        else {
            this.utterance_type = "fact"
        	Structure.structs.push(this) 
        	return "Understood."
        }
    }
    
    //return an existing struct or null if none
    static struct_in_structs_with_sentence(sent){
    	for(let a_struct of this.structs){
        	if (a_struct.sentence == sent) { return a_struct }
        }
        return null
    }
    ask(){
        switch(this.question_type){
           case "what":   return this.ask_what();
           case "why":    return this.ask_why(); 
           case "y_or_n": return this.ask_y_or_n();
           default:  
              let result = "Beats me " + this.question_type + "!"
              return result;
        }
    }
    ask_what(){
        //out("asking what question: "); out(this);
        let the_question = this
        let result = "shouldnt. ask_what got no result."
        switch(the_question.sentence){
          case "what do you know":       result = Structure.ask_what_do_you_know(); break;
          case "what do you know about": result = Structure.ask_what_do_you_know_about() ;break
          case "what can you do":        result = Structure.ask_what_can_you_do();  break;
          case "what did you say":       result = Structure.ask_what_did_you_say(); break;
          case "what did I say":         result = Structure.ask_what_did_I_say();   break; 
          default:
              if (the_question.sentence.startsWith("what do you know about")){
                  let something = the_question.sentence.substring(23).trim()
                  result = Structure.ask_what_do_you_know_about_something(something)
              }  
              else {
                  let the_matches = Structure.structs.filter(
                                    function(a_struct) {return the_question.vo_match(a_struct)})
                  if(the_matches.length == 0){
                      result = Structure.wh_cooresponding_no(this.subject)     
                  }
                  else { result = Structure.matches_to_english(the_matches) }     
              }
       }
       return result
    }
    static ask_what_do_you_know(){
        let facts = Structure.facts()
        let rules = Structure.rules()
        let result = ""
        if ((facts.length == 0) && (rules.length == 0)){
            result = "I don't know, anything. To learn how to teach me, say, help."
        }
        else {
            if (facts.length == 1) { result = "I know one fact. " + facts[0].sentence + ". "}
            else if (facts.length == 2) {
              result = "I know 2 facts. " + facts[0].sentence + ", and, " +  facts[1].sentence + ". "
            }
            else if (facts.length > 2) {
              result = "I know " + facts.length + " facts, such as: " + facts[0].sentence + ". "
            }

            if (rules.length == 1) { result += "I know one rule. " + rules[0].sentence + ". "}
            else if (rules.length == 2) {
              result += "I know 2 rules. " + rules[0].sentence + ", and, " +  rules[1].sentence + ". "
            }
            else if (rules.length > 2) {
              result += "I know " + rules.length + " rules, such as: " + rules[0].sentence + ". "
            }
        }
        return result
    }
    
    static ask_what_do_you_know_about(){
    	let nouns = Structure.nouns()
        let result = "shouldnt in ask_what_do_you_know_about"
        if      (nouns.length == 0) { result = "I don't know about, anything." }
        else if (nouns.length == 1) { result = "I know about " + this.pluralize(nouns[0]) }
        else if (nouns.length == 2) { result = "I know about " + this.pluralize(nouns[0]) +
                                               ", and, " + this.pluralize(nouns[1])
                                    }
        else                        { result = "I know about " + this.pluralize(nouns[0]) +
                                               ", and " + (nouns.length - 1) + ", other things."
        }
        return result
    }
    
    static structs_about_something(a_noun){
        let sing_noun
        let plural_noun
    	if (this.is_plural(a_noun)){ 
        	sing_noun   = this.singularize(a_noun)
            plural_noun = a_noun
        }
        else {
            sing_noun   = a_noun
            plural_noun = this.pluralize(a_noun)
        }
        let result = []
        for(let a_struct of this.structs){
        	if(a_struct.utterance_type == "rule"){
            	if(a_struct.rule.condition.is_struct_about_something(sing_noun, plural_noun)){
                  result.push(a_struct)
                }
                else if (a_struct.rule.action.is_struct_about_something(sing_noun, plural_noun)){
                  result.push(a_struct)
                }
            }
        	else if(a_struct.is_struct_about_something(sing_noun, plural_noun)){
            	result.push(a_struct)
            }
        }
        return result
    }
    
    is_struct_about_something(...nouns){
       for(let a_noun of nouns){
       		if ((this.subject == a_noun)    ||
                (this.object  == a_noun)){
            return true
        }
       }
       return false
    }
    
    static ask_what_do_you_know_about_something(a_noun){
      //often in such questions, a_noun is plural.
      let structs = this.structs_about_something(a_noun)
      let result = "shouldnt in ask_what_do_you_know_about_something"
      if (structs.length == 0) {
      	result = "I don't know anything about, " + a_noun
      }
      else if (structs.length == 1){
      	result = "I only know that, " + structs[0].sentence
      }
      else if (structs.length == 2){
      	result = "I just know that, " + structs[0].sentence +
                 ", and, " + structs[1].sentence
      }
      else {
        result = "I know, "         + structs.length + 
                 " things about, "  + a_noun +
                 ", including, "    + structs[0].sentence
      }
      return result
    }
    
    static ask_what_can_you_do(){
       let result = "I can remember facts, such as, A robot has a hand. " +
                    "I can also remember rules, such as, If a robot has a hand, a robot is useful. " +
                    "I, answer questions like, " + 
                    "Does a robot have a hand? , " +
                    "Why is a robot useful? " +
                    "Or. What do you know?"
        return result
    }
    static ask_what_did_you_say(){
      for (let item of Structure.conversation.reverse()){
         if (typeof(item) == "string") { return "I said, " + item }
      }
      return "I haven't said anything."
    }
    
    static ask_what_did_I_say(){
      let use_next_utterance = false
      for (let item of Structure.conversation.reverse()){
         if (typeof(item) != "string") { 
           if(!use_next_utterance) { use_next_utterance = true }
           else { return "You said, " + item.sentence }
         }
      }
      return "You didn't say anything."
    }
    
    static forget_what_i_just_said(){
      if (this.structs.length == 0){ return "You haven't told me any facts or rules." }
      else {
         let deleted_structs = this.structs.splice(this.structs.length - 1, 1)
         return "I just forgot that, " + deleted_structs[0].sentence
      }
    }
    
    static forget_what_i_said_about_something(a_noun){
      //often in such questions, a_noun is plural.
      let structs_about_noun     = this.structs_about_something(a_noun)
      let structs_not_about_noun = []
      for(let s of this.structs){
      	if (!structs_about_noun.includes(s)) { structs_not_about_noun.push(s) }
      }
      this.structs = structs_not_about_noun
      let result = "shouldnt in forget_what_i_said_about_something"
      if (structs_about_noun.length == 0) {
      	result = "I don't know anything about, " + a_noun + ", so there's nothing to forget."
      }
      else if (structs_about_noun.length == 1){
      	result = "I am forgetting the only thing I know about, " + a_noun + 
                 ", which, is, " + structs_about_noun[0].sentence
      }
      else {
        result = "OK, I just forgot the " + structs_about_noun.length + 
                 " things I knew about, " + a_noun
      }
      return result
    }
    
    static forget_everything(a_noun){
        //user has to say "forget everything" twice.
        if(this.structs.length == 0)      { return "I know nothing, so there's nothing to forget." }
        else if(this.structs.length == 1) { this.structs = []; return "OK, I've forgotten the one thing I knew." }
        else if(this.structs.length == 2) { this.structs = []; return "OK, I've forgotten the two things, I knew." }    
        else if (this.conversation[this.conversation.length - 2].startsWith("But I know")){
        	this.structs = []
            return "Done. My mind is empty."
        }
        else { return "But I know, " + this.structs.length + ", things! Say forget everthing, again, if you really mean it."}
    }
    
    ask_why(){
      let result
      let matching_action_rules = this.rules_with_matching_actions()
      if (matching_action_rules.length == 0){
         result = "I think its never the case, that " + this.subject + " " + 
                   this.verb + " " + this.object + "."
      }
      else {
        let true_rules = Structure.rules_with_true_conditions(matching_action_rules)

        if (true_rules.length > 0) {
          result = this.subject + " " + this.verb + " " + this.object + 
            ", because, " + true_rules[0].rule.condition.sentence
        }
        else { result = "Sorry, " + this.subject + " " + 
          this.verb + " " + this.object + ", is only true, under certain conditions."
        }
      }
      return result
    }
    ask_y_or_n(){
        //out("asking y_or_n question: "); out(this)
        let the_question = this
    	let the_matches = Structure.structs.filter(
                            function(a_struct) {return the_question.svo_match(a_struct)})
        let result
        if(the_matches.length > 0) { 
           let eng = Structure.matches_to_english(the_matches)
           result = "Yes, " + eng[0].toLowerCase() + eng.substring(1)
          
        }  
        else {
           let matching_action_rules = this.rules_with_matching_actions()
           let true_rules = Structure.rules_with_true_conditions(matching_action_rules)
           if (true_rules.length > 0) {
           		result = "Yes, " + true_rules[0].rule.action.sentence
           }
           else { result = "Not to my knowledge."}
        }
         return result
    }
    static facts(){
      return Structure.structs.filter(function(a_struct) {return a_struct.utterance_type == "fact"})
    }
    static rules(){
      return Structure.structs.filter(function(a_struct) {return a_struct.utterance_type == "rule"})
    }
    static nouns(){
      let fs = this.facts()
      let nouns = []
      for (let a_fact of fs){
        if (!nouns.includes(a_fact.subject)) { nouns.push(a_fact.subject) }
        if (!nouns.includes(a_fact.object))  { nouns.push(a_fact.object)  }
      }
      return nouns
    }
    
    rules_with_matching_actions(){
       let all_rules   = Structure.rules()
       let this_struct = this
       let result      = all_rules.filter(function(a_struct){return this_struct.svo_match(a_struct.rule.action)} )
       return result
    }
    
    static rules_with_true_conditions(some_rules=Structure.rules()){
      let result = []
      for(let a_rule of some_rules){
      	for(let a_struct of Structure.structs){
        	if (a_rule.rule.condition.svo_match(a_struct)){ result.push(a_rule) }
        }
      }
      return result
    }
    
    static matches_to_english(structs){
    	if (structs.length == 1) { return structs[0].sentence }
        else {
          let result = ""
          for(let i = 0; i < structs.length; i++){
            let struct = structs[i]
            let sent = this.remove_ending_punctuation(struct.sentence)
            if (i == 0) { result = sent }
            else if (i == structs.length - 1) { //the last
              sent = sent[0].toLowerCase() + sent.substring(1)
              result += " and " + sent
            }
            else { 
            	sent = sent[0].toLowerCase() + sent.substring(1)
                result += ", " + sent
            }
          }
          return result
        }
    }
    static remove_ending_punctuation(text){
        if (".!?,:;".includes(last(text))){
            text = text.substring(0, text.length - 1)
        }
        return text
    }
    static is_wh_word(word){ 
      return ["who", "what", "when", "where", "why", "how"].includes(word) 
    }
    static wh_cooresponding_no(wh_word) {
        return {"who": "Nobody.", "what": "Nothing.", "when": "Never.",
                "where": "Nowhere.", "why": "I don't know why.",
                "how": "Nohow."}[wh_word]
    }
    vo_match(struct){ //'this' is the question. subject is a wh word so ignore it for match purposes
        return (this.verb   == struct.verb) &&
               (this.object == struct.object)
    }
    svo_match(struct){
        return (this.subject == struct.subject) &&
               (this.verb    == struct.verb)    &&
               (this.object  == struct.object)
    }
    question_matches(){
       let result = []
       for(struct of Structure.structs){
          if(this.question_match(struct)) {
          	result.push(struct)
          }
       }
       return result
    }  
    
    //we count y as a consonate here
    static is_vowel(a_char)     { return "aeiou".includes(a_char) }
    static is_consonant(a_char) { return !this.is_vowel(a_char) }
    
    // see http://www.factmonster.com/ipka/A0886509.html
    static is_plural(a_word){
    	if (a_word.endsWith("ss")) { return false }
        else                       { return a_word.endsWith("s") }
    }
    
    static pluralize(a_singular_word){
        let last_let        = last(a_singular_word)
        let second_last_let = ((a_singular_word.length > 1) ? a_singular_word[a_singular_word.length - 2] : null)
    	let last_2_lets     = ((a_singular_word.length > 1) ? a_singular_word.substring(a_singular_word.length - 2) : null)
        if ("sxz".includes(last_let)) { return a_singular_word + "es" }
        else if(["ch", "sh", "ss"].includes(last_2_lets)) {
           return a_singular_word + "es" }
        else if ((last_let == "y") && this.is_consonant(second_last_let)) { 
           return a_singular_word.substring(0, a_singular_word.length - 1) + "ies" }
        else if (last_let == "f") { 
           return a_singular_word.substring(0, a_singular_word.length - 1) + "ves"}
        else if (last_let == "fe") { 
           return a_singular_word.substring(0, a_singular_word.length - 2) + "ves"}
        else { return a_singular_word + "s" }
        
    }
    
    static singularize(a_plural_word_maybe){
      if (a_plural_word_maybe.endsWith("ses")) {
          return a_plural_word_maybe.substring(0, a_plural_word_maybe.length - 2) }
      else if (a_plural_word_maybe.endsWith("ies")) {
          return a_plural_word_maybe.substring(0, a_plural_word_maybe.length - 3) + "y"
      }
      else if (a_plural_word_maybe.endsWith("ves")) {
          return a_plural_word_maybe.substring(0, a_plural_word_maybe.length - 3) + "f"
      }
      else if (a_plural_word_maybe.endsWith("es")) {
          return a_plural_word_maybe.substring(0, a_plural_word_maybe.length - 2)
      }
      else if (a_plural_word_maybe.endsWith("ss")) {
          return a_plural_word_maybe
      }
      else if (a_plural_word_maybe.endsWith("s")) {
          return a_plural_word_maybe.substring(0, a_plural_word_maybe.length - 1)
      }
      else { return a_plural_word_maybe }
    }
    
}
Structure.structs = []
// console.log(Structure.structs)
Structure.conversation = [] //strings are what the code said, structs are what the user said.

Start.dialog() //main demo with speech reco and speech output.
speak("At your service.")

new TestSuite("Structure.pluralize",
    ['Structure.pluralize("robot")', '"robots"'],
    ['Structure.pluralize("fly")',   '"flies"'],
    ['Structure.pluralize("elf")',   '"elves"'],
    ['Structure.pluralize("bush")',  '"bushes"'],
    ['Structure.pluralize("box")',   '"boxes"'],
    ['Structure.pluralize("car")',   '"cars"']
)

new TestSuite("Structure.singularize",
    ['Structure.singularize("robots")',  '"robot"'],
    ['Structure.singularize("flies")',   '"fly"'],
    ['Structure.singularize("elves")',   '"elf"'],
    [' Structure.singularize("bushes")', '"bush"'],
    ['Structure.singularize("boxes")',   '"box"'],
    ['Structure.singularize("cars")',    '"car"']
)

/*
Start.parse("a robot has a hand") //show what START returns
Structure.conversation  //the parsed conversation structure.
*/
 

