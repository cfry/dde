import { Configuration, OpenAIApi } from "openai";
import {grab_text_for_eval_button} from "./eval.js"

globalThis.OpenAIApi = OpenAIApi
globalThis.Configuration = Configuration

globalThis.OpenAI = class OpenAI{
    static configuration
    static openai
    static init(){
        gpt_id.onclick = OpenAI.gpt_button_action
        gpt_id.onmousedown = function() {
            DocCode.previous_active_element = document.activeElement
            DocCode.selected_text_when_eval_button_clicked = Editor.get_any_selection()
        }
        gpt_config_id.onclick = this.show_config

        //the below is so that, if you've already entered an org and a key once,
        //you won't have to do it again, even in a new dde session
        let org = DDE_DB.persistent_get("gpt_org") //if this has never been set, the result is undefined
        let key = DDE_DB.persistent_get("gpt_key") //if this has never been set, the result is undefined
        out("OpenAI.init got key: " + key)
        if(org && key){
           this.make_configuration(org, key)
        }
    }

    static make_configuration(org, key){
        //https://platform.openai.com/docs/api-reference/authentication
        //but better: https://www.npmjs.com/package/openai
        this.configuration = new Configuration({
            organization: org,
            apiKey: key //process.env.OPENAI_API_KEY,
        })
        this.openai = new OpenAIApi(this.configuration);
    }

    static gpt_button_action(){
        if(!OpenAI.openai) {
            warning("You need to configure GPT before using it.")
            OpenAI.show_config()
        }
        else {
            let [src, src_comes_from_editor] = grab_text_for_eval_button()
            OpenAI.openai_request(src)
        }
    }


    //https://platform.openai.com/docs/api-reference/authentication
    //but better: https://www.npmjs.com/package/openai
    //to use gpt-3.5-turbo, see:
    // https://stackoverflow.com/questions/72326140/openai-api-refused-to-set-unsafe-header-user-agent
    static async openai_request(prompt="hello world"){
        //let response = await openai.listEngines();#bcfbe0  #6afbbc too dark green
        if(Editor.current_buffer_needs_saving) {
            Editor.save_current_file()
        }
        prompt = prompt.trim()
        let summary_prompt
        if (prompt.length > 50) { summary_prompt = prompt.substring(0, 47) + "..." }
        else { summary_prompt = prompt }
        let prompt_for_title = prompt.replaceAll("'", "\\'")
        out("<div style='background:#bcfbe0;' title='" + prompt_for_title + "'><i>OpenAI passed prompt: </i> " + summary_prompt + "</div>")
        let media = DDE_DB.persistent_get("gpt_response_media")
        if     (media === "text")    { return this.make_text(prompt) }
        else if(media === "inspect") { return this.make_inspect(prompt) }
        else if(media === "image")   { return this.make_image(prompt) }
        else { shouldnt("In openai_request with invalid response media of: " + media)}
    }

    static async make_text(prompt, callback=OpenAI.make_text_default_callback){
        let model = DDE_DB.persistent_get("gpt_model")
        let max_tokens = DDE_DB.persistent_get("gpt_completion_max_tokens")
        if(!max_tokens || Number.isNaN(max_tokens)) { max_tokens = 200 }
        let result_text
        if(model === "text-davinci-003") {
            const completion = await this.openai.createCompletion({
                model: "text-davinci-003", //"text-davinci-003", //"text-davinci-003" //gpt-3.5-turbo errors, maybe because I haven't paid, or because it streams the result
                prompt: prompt,
                max_tokens: max_tokens
            })
            let result_text = completion.data.choices[0].text
            callback(prompt, result_text)
            return result_text
        }
        else if ((model === "gpt-3.5-turbo")){ //see https://platform.openai.com/docs/api-reference/chat/create
            const completion = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: prompt}],
                max_tokens: max_tokens
            });
            let result_text = completion.data.choices[0].message.content
            callback(prompt, result_text)
            return result_text
        }
    }

    static make_text_default_callback(promot, result_text){
        let result_text_html = result_text //result_text.replaceAll("\n", "<br/>")
        //using white-space:pre-wrap; is perfect. lines don't go outside the bounding box of the out pane,
        // line breaks are preserved, as are intentions for hiearchy display
        out("<div style='background:#bcfbe0; white-space:pre-wrap;'>" + result_text_html + "</div>")
        return result_text
    }

    static async make_inspect(prompt){
        let response = await this.openai.createCompletion({
            model: "text-davinci-003", //"text-davinci-003" //gpt-3.5-turbo errors, maybe because I haven't paid, or because it streams the result
            prompt: prompt,
            max_tokens: DDE_DB.persistent_get("gpt_completion_max_tokens")
        })
        inspect(response)
        return response
    }

    static async make_image(prompt="a blue dog"){
        out("<div style='background:#bcfbe0;'> An image will be shown in a new tab.</div>")
        let image_size = DDE_DB.persistent_get("gpt_image_size")
        var response = await OpenAI.openai.createImage({
            prompt: prompt,
            n: 1,
            size: image_size,
        })
        let url = response.data.data[0].url
        window.open(url, "_blank")
        return (response)
    }

    static show_config(){
        DocCode.open_doc(gpt_interface_doc_id)
        let org = DDE_DB.persistent_get("gpt_org") //if this has never been set, the result is undefined
        if(!org) { org = "" }
        let key = DDE_DB.persistent_get("gpt_key") //if this has never been set, the result is undefined
        if(!key) { key = "" }
        let response_media = DDE_DB.persistent_get("gpt_response_media")
        if(!response_media) {response_media = "text" }
        let text_checked    = ((response_media === "text")    ? " checked" : "")
        let image_checked   = ((response_media === "image")   ? " checked" : "")
        let inspect_checked = ((response_media === "inspect") ? " checked" : "")
        let model = DDE_DB.persistent_get("model")
        if(!model) { model = "gpt-3.5-turbo" }
        let gpt_3_5_checked = ((model === "gpt-3.5-turbo")    ?  " checked" : "")
        let davinci_checked = ((model === "text-davinci-003") ?  " checked" : "")
        let max_tokens = DDE_DB.persistent_get("gpt_completion_max_tokens")
        if(!max_tokens || Number.isNaN(max_tokens)) { max_tokens = "100" }
        let image_size = DDE_DB.persistent_get("gpt_image_size")
        if(!image_size) { image_size = "256x256" }
        let selected_256 =  ((image_size === "256x256")   ? " selected " : "")
        let selected_512 =  ((image_size === "512x512")   ? " selected " : "")
        let selected_1024 = ((image_size === "1024x1024") ? " selected " : "")
        show_window({title: "GPT Configuration",
            content: "<span title='Do not give info you do not want to share.&#13;Be careful how you use the responses.'> " +
                     "<span style='font-weight:bold; color:red;'>Warning:</span> " +
                     "<a target='_blank' href='https://www.lexology.com/library/detail.aspx?g=33bf4b4f-ffd9-4bf1-bfc1-7c790d86a22f'>Please read this.</a> " +
                     "</span>" +
                     "<fieldset style='margin-top:5px;'><legend><i>OpenAI Log In Requirements</i></legend>" +
                     "If you don't have a key, sign up for one at <a target='_blank' href='http://openai.com' title='You are given a lot of initial usage for free.'>openai.com</a>. " +
                     "&nbsp;&nbsp;<a target='_blank' href='http://platform.openai.com/account/usage' title='http://platform.openai.com/account/usage'>usage</a><br/>" +
                     'organization: <input name="org" style="margin:5px;width:275px;" value="' + org + '"/><br>'  +
                     'apiKey:       <input name="key" style="margin:5px;width:425px;" value="' + key + '"/><br/>' +
                     '</fieldset>' +

                     "<fieldset style='margin-top:10px;'><legend><i>Completion Parameters</i></legend>" +
                     "<span title='The process used to compute the completions.'> Model:</span> " +
                     '<span title="Cheaper and faster.&#13;The default."><input type="radio" name="model" value="gpt-3.5-turbo" '    + gpt_3_5_checked    + ' style="margin:5px 3px 5px 15px;""/>gpt-3.5-turbo</span>   &nbsp;&nbsp;' +
                     '<span title="Good for specialized cases."><input type="radio" name="model" value="text-davinci-003" ' + davinci_checked    + ' style="margin:5px 3px 5px 15px;"/>text-davinci-003</span> &nbsp;&nbsp; <br/>' + //a tag fails when you click on it but I don't know why <a target="_blank" href="https://scale.com/blog/chatgpt-vs-davinci">How to choose</a><br/>' +
                     '<span title="Produce text in the output pane."><input type="radio" name="response_media" value="text" '    + text_checked       + ' style="margin:5px 3px 5px 20px;"/>text</span> &nbsp;&nbsp;' +
                     ' <span title="max_tokens is roughly equivlent to the number of words in the completion result.&#13;Default: 200">max_tokens: <input name="max_tokens" value="' + max_tokens + '" type="number" min="1" style="width:50px; margin:5px 5px 5px 5px;" /></span>' +
                     '<br/>' +
                     '<span title="Inspect the full result in the output pane."><input type="radio" name="response_media" value="inspect" ' + inspect_checked + ' style="margin:5px 3px 5px 20px;"/>inspect </span>&nbsp;&nbsp;<br/>' +
                     '<span title="Show an image of the result in a new tab.">  <input type="radio" name="response_media" value="image" '   + image_checked   + ' style="margin:5px 3px 5px 2px;"/>image</span> ' +
                     ' &nbsp;&nbsp;&nbsp;size: <select name="image_size">' +
                                     '<option value="256x256" '   + selected_256  + '>256x256</option>'   +
                                     '<option value="512x512" '   + selected_512  + '>512x512</option>'   +
                                     '<option value="1024x1024" ' + selected_1024 + '>1024x1024</option>' +
                      '</select>\n' +
                      '</fieldset>' +
                     '<input type="submit" value="Update Configuration" style="margin:10px;"></input>',

                      width:  550,
                      height: 350,
                      callback: "OpenAI.show_config_cb"
        }
        )
    }

    static show_config_cb(vals){
        if(vals.clicked_button_value){
            let org = vals.org.trim()
            let key = vals.key.trim()
            if((key.length > 0)  &&
                (org.length > 0)){
                OpenAI.make_configuration(org, key)
                DDE_DB.persistent_set("gpt_org", org)
                DDE_DB.persistent_set("gpt_key", key)
            }
            let response_media = vals.response_media
            if(!response_media) {
                response_media = "text"
            }
            DDE_DB.persistent_set("gpt_response_media", response_media)
            DDE_DB.persistent_set("gpt_completion_max_tokens", parseInt(vals.max_tokens))
            DDE_DB.persistent_set("gpt_model", vals.model)
            DDE_DB.persistent_set("gpt_image_size", vals.image_size)
        }
    }

    static text_to_data(text){
        text = text.trim()
        let result = {first_word_data: null,
                      last_word_data: null,
                      numbers: [], //does not include numbers_prefixed_with_dollar_sign
                      numbers_prefixed_with_dollar_sign: [],
                      numbered_bullet_points: [], //starts with "1.", "2." etc
                      bullet_points: [], // start with "- "
                      name_value_pairs: {} //values are always arrays as there might be > value per name in named entities.
        }
        let words = text.split(/\s/) //spit on whitespace
        if(words.length > 0) {
            result.first_word_data = this.text_to_boolean_or_number(words[0])
            result.last_word_data  = this.text_to_boolean_or_number(words[words.length - 1])
        }
        for (let word of words) {
            let num_maybe = this.text_to_boolean_or_number(word)
            if ((typeof(num_maybe) === "number") &&
                !Number.isNaN(num_maybe)) {
                if(word.startsWith("$")){ result.numbers_prefixed_with_dollar_sign.push(num_maybe) }
                else                    { result.numbers.push(num_maybe) }
            }
        }
        let lines = text.split("\n")
        let bullet_points = []
        for (let line of lines) { //grab bullet point if any
            if (line.startsWith("-")) { // unnumbered bullet_point
                result.bullet_points.push(line.substring(1).trim())

                //maybe we have named entities so grab name-value pair
                let [name, content] = line.substring(2).split(": ")
                if(name && content) { //each might be undefined
                    name = name.trim()
                    content = content.trim()
                    if ((name.length > 0) && (content.length > 0)) { //got name-value pair as in prompt of "role:named entities from: ..."
                        content = this.text_to_boolean_or_number(content)
                        let cur_content = result.name_value_pairs[name]
                        if (!cur_content) {
                            result.name_value_pairs[name] = [content] //value is always an array, maybe of just one item, maybe more, but htey are in order or appearance in the text
                        } else if (Array.isArray(cur_content)) {
                            cur_content.push(content)
                        } else {
                            warning("OpenAI.text_to_data had bad data in name: " + name + " of: " + cur_content + " for line: " + line)
                        }
                    }
                }
            }
            else { //possibly a numbered bullet point
                let [int_maybe_text, content] = line.split(". ")
                if (Utils.is_string_a_integer(int_maybe_text) && content) {
                    let int_maybe = parseInt(int_maybe_text)
                    content = content.trim()
                    if (!Number.isNaN(int_maybe) && (content.length > 0)) {
                        result.numbered_bullet_points.push(content)
                    }
                }
                else { //maybe a name value pair without a starting "- "
                    let [name, content] = line.split(": ")
                    if(name && content) { //each might be undefined
                        name = name.trim()
                        content = content.trim()
                        if ((name.length > 0) && (content.length > 0)) { //got name-value pair as in prompt of "role:named entities from: ..."
                            content = this.text_to_boolean_or_number(content)
                            let cur_content = result.name_value_pairs[name]
                            if (!cur_content) {
                                result.name_value_pairs[name] = [content] //value is always an array, maybe of just one item, maybe more, but htey are in order or appearance in the text
                            } else if (Array.isArray(cur_content)) {
                                cur_content.push(content)
                            } else {
                                warning("OpenAI.text_to_data had bad data in name: " + name + " of: " + cur_content + " for line: " + line)
                            }
                        }
                    }
                }
            }
        }
        return result
    }

    static text_to_boolean_or_number(text) {
        text = text.toLowerCase(text)
        if (text.endsWith(".")) {
            text = text.substring(0, text.length - 1)
        }
        if (text.endsWith(",")) {
            text = text.substring(0, text.length - 1)
        }

        if      (["yes", "ok", "true"].includes(text))   { return true }
        else if (["no", "nope", "false"].includes(text)) { return false }
        else if (["null", "none"].includes(text))        { return null }
        else { //maybe its a number
            let num_maybe = text
            if (num_maybe.startsWith("$")) {
                num_maybe = num_maybe.substring(1)
            } //cut off the $
            num_maybe = num_maybe.replaceAll(",", "")
            //note num_maybe has been lower cased so "K" has become "k".
            if      (num_maybe.endsWith("k")) { num_maybe = num_maybe.replace("k", "000") }
            else if (num_maybe.endsWith("k")) { num_maybe = num_maybe.replace("m", "000000") }
            else if (num_maybe.endsWith("b")) { num_maybe = num_maybe.replace("b", "000000000") }
            else if (num_maybe.endsWith("t")) { num_maybe = num_maybe.replace("t", "000000000000") }

            let result = parseFloat(num_maybe)
            if (!Number.isNaN(result)) {
                return result
            }
            else { return text }
        }
    } //end of text_to_boolean_or_number
} //end of class OpenAI