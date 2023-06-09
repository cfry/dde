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

        let media = DDE_DB.persistent_get("gpt_response_media")
        if(!media) { DDE_DB.persistent_set("gpt_response_media", "text")}

        //the below is so that, if you've already entered an org and a key once,
        //you won't have to do it again, even in a new dde session
        let org = DDE_DB.persistent_get("gpt_org") //if this has never been set, the result is undefined
        let key = DDE_DB.persistent_get("gpt_key") //if this has never been set, the result is undefined
        out("OpenAI.init got key: " + key)
        if(org && key){
           this.make_configuration(org, key)
        }
        this.init_previous_cache()
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

    static show_prompt(prompt){
        prompt = prompt.trim()
        let summary_prompt
        if (prompt.length > 50) { summary_prompt = prompt.substring(0, 47) + "..." }
        else { summary_prompt = prompt }
        let prompt_for_title = prompt.replaceAll("'", "\\'")
        out("<div style='background:#bcfbe0;' title='" + prompt_for_title + "'><i>OpenAI passed prompt: </i> " + summary_prompt + "</div>")
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
        if (prompt !== OpenAI.previous_prompt){ //means the "previous cache for clicking on radio buttons in the config dialog box is no longer valid, so get rid of them
            this.init_previous_cache()
        }
        this.show_prompt(prompt)
        let media = DDE_DB.persistent_get("gpt_response_media")
        if     (media === "text")             { let [env, text] = await this.make_text(prompt)
                                                this.previous_prompt = prompt
                                                this.previous_response_envelope = env
                                                this.previous_response_text = text
                                                return text
                                              }
        else if(media === "inspect_text_to_data") { let [env, text] = await this.make_inspect_text_to_data(prompt)
                                                    this.previous_prompt = prompt
                                                    this.previous_response_envelope = env
                                                    this.previous_response_text = text
                                                    return text
        }
        else if(media === "inspect_envelope") { let [env, text] = await this.make_inspect_envelope(prompt)
                                                this.previous_prompt = prompt
                                                this.previous_response_envelope = env
                                                this.previous_response_text = text
                                                return text
                                              }
        else if(media === "plot_numbers") { let [env, text] = await this.make_plot_numbers(prompt)
                                                this.previous_prompt = prompt
                                                this.previous_response_envelope = env
                                                this.previous_response_text = text
                                                return text
        }

        else if(media === "image")            { let [env, text] = await this.make_image(prompt)
                                                this.previous_prompt = prompt
                                                this.previous_response_envelope = env
                                                this.previous_response_url = text //don't set text as user might
                                                //want to go back to a previous text
                                                return text
                                              }
        else { shouldnt("In openai_request with invalid response media of: " + media)}
    }

    static previous_prompt
    static previous_response_envelope
    static previous_response_text
    static previous_response_url

    static init_previous_cache() {
        this.previous_prompt = null
        this.previous_response_envelope = null
        this.previous_response_text = null
        this.previous_response_url = null
    }

    static special_error_message(err){
        if(err.message.includes("401")){
            return "<br/> A 401 status code means your organization or API key are not valid.<br/>" +
                "Please check DDE's GPT configuration settings for these keys.<br/>" +
                "To see GPT configurations, click the down arrow next to DDE's <button>GPT</button> button."
        }
        else if(err.message.includes("429")){
            return "<br/> A 429 status code probably means you exceeded your allowed requests per minute." +
                "<br/>If you don't have a paid subscription, getting one will help" +
                "<br/>by giving you more completions per minute.<br>" +
                "<br/>Browse <a target='_blank' href='http://openai.com'>openai.com</a>"

        }
        else if (err.message.includes("500")){
            return "<br/> A 500 status code means the OpenAI server errored.<br/>Please try again later."
        }
        else {
            return ""
        }
    }

    //see: https://www.makeuseof.com/chatgpt-api-complete-guide/ for 3.5 and 4 api's.
    static async make_text(prompt, callback=OpenAI.make_text_default_callback){
        let model = DDE_DB.persistent_get("gpt_model")
        let max_tokens = DDE_DB.persistent_get("gpt_completion_max_tokens")
        if(!max_tokens || Number.isNaN(max_tokens)) { max_tokens = 200 }
        let result_text
        try {
            let completion
            let result_text
            if (model === "text-davinci-003") {
                completion = await this.openai.createCompletion({
                    model: model,
                    prompt: prompt,
                    max_tokens: max_tokens
                })
                result_text = completion.data.choices[0].text

            }
            else if (["gpt-4", "gpt-3.5-turbo"].includes(model)) { //see https://platform.openai.com/docs/api-reference/chat/create
                completion = await this.openai.createChatCompletion({
                    model: model,
                    messages: [{role: "user", content: prompt}],
                    max_tokens: max_tokens
                });
                result_text = completion.data.choices[0].message.content
            }
            callback(prompt, result_text)
            return [completion, result_text]
        }
        catch(err){
            dde_error("OpenAI could not complete your prompt:<br/><code>" + prompt +
                      "</code><br/> due to: <b>" + err.message + "</b>" +
                       OpenAI.special_error_message(err)
            )
        }
    }


    static make_text_default_callback(prompt, result_text){
        let result_text_html = result_text //result_text.replaceAll("\n", "<br/>")
        //using white-space:pre-wrap; is perfect. lines don't go outside the bounding box of the out pane,
        // line breaks are preserved, as are intentions for hiearchy display
        out("<div style='background:#bcfbe0; white-space:pre-wrap;'>" + result_text_html + "</div>")
        return result_text
    }

    static async make_inspect_text_to_data(prompt){
       let env_and_text = await this.make_text(prompt, OpenAI.inspect_text_to_data_cb)
       return env_and_text
    }

    //callback for make_text
    //called from more than 1 place
    static inspect_text_to_data_cb(prompt, result){
        let data = OpenAI.text_to_data(result, prompt)
        inspect(data)
    }

    //very similar to make_text
    static async make_inspect_envelope(prompt){
        let model = DDE_DB.persistent_get("gpt_model")
        let max_tokens = DDE_DB.persistent_get("gpt_completion_max_tokens")
        if(!max_tokens || Number.isNaN(max_tokens)) { max_tokens = 200 }
        let result_text
        let completion
        try {
            let result_text
            if (model === "text-davinci-003") {
                completion = await this.openai.createCompletion({
                    model: model, //"text-davinci-003", //"text-davinci-003" //gpt-3.5-turbo errors, maybe because I haven't paid, or because it streams the result
                    prompt: prompt,
                    max_tokens: max_tokens
                })
                result_text = completion.data.choices[0].text

            }
            else if (["gpt-4", "gpt-3.5-turbo"].includes(model)) { //see https://platform.openai.com/docs/api-reference/chat/create
                completion = await this.openai.createChatCompletion({
                    model: model,
                    messages: [{role: "user", content: prompt}],
                    max_tokens: max_tokens
                });
                result_text = completion.data.choices[0].message.content
            }
        }
        catch(err){
            dde_error("OpenAI could not complete your prompt:<br/><code>" + prompt +
                "</code><br/> due to: <b>" + err.message + "</b>" +
                OpenAI.special_error_message(err)
            )
        }
        inspect(completion)
        let choice_zero = completion.data.choices[0]
        let text = (choice_zero.text ? choice_zero.text : choice_zero.message.content) // if(completion.data.choices[0].message.content
            //choice_zero.text works for model: text-davinci-003
            //choice_zero.message.content works for models: gpt-3.5-turbo, gpt-4 models.
        return [completion, text]
    }

    static async make_plot_numbers(prompt){
        let env_and_text = await this.make_text(prompt, OpenAI.make_plot_numbers_cb)
        return env_and_text
    }

    //callback for make_text
    //called from more than 1 place
    static make_plot_numbers_cb(prompt, result){
        let data = OpenAI.text_to_data(result, prompt)
        if(data.numbers.length === 0){
            warning("Sorry, no there are numbers in the response to plot.")
        }
        else {
            Plot.show(undefined, data.numbers)
        }
    }

    static async make_image(prompt="a blue dog"){
        out("<div style='background:#bcfbe0;'> An image will be shown in a new browser tab in a few seconds.</div>")
        let image_size = DDE_DB.persistent_get("gpt_image_size")
        let completion = await OpenAI.openai.createImage({
            prompt: prompt,
            n: 1,
            size: image_size,
        })
        let url = completion.data.data[0].url
        window.open(url, "_blank")
        return [completion, url]
    }

    static show_config(){
        DocCode.open_doc(gpt_interface_doc_id)
        let org = DDE_DB.persistent_get("gpt_org") //if this has never been set, the result is undefined
        if(!org) { org = "" }
        let key = DDE_DB.persistent_get("gpt_key") //if this has never been set, the result is undefined
        if(!key) { key = "" }

        let response_media = DDE_DB.persistent_get("gpt_response_media")
        if(!response_media) {response_media = "text" }
        let text_checked                 = ((response_media === "text")    ? " checked" : "")
        let image_checked                = ((response_media === "image")   ? " checked" : "")
        let inspect_envelope_checked     = ((response_media === "inspect_envelope") ? " checked" : "")
        let inspect_text_to_data_checked = ((response_media === "inspect_text_to_data") ? " checked" : "")
        let plot_numbers_checked         = ((response_media === "plot_numbers") ? " checked" : "")

        let model = DDE_DB.persistent_get("gpt_model")
        if(!model) { model = "gpt-3.5-turbo" }
        let gpt_4_checked   = ((model === "gpt-4")            ?  " checked" : "")
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
                     "<fieldset style='margin-top:5px;'><legend><i>OpenAI Log In Requirements</i> </legend>" +
                         "If you don't have a key, sign up for one at <a target='_blank' href='http://openai.com' title='You are given a lot of initial usage for free.'>openai.com</a>. " +
                         "&nbsp;&nbsp;<a target='_blank' href='http://platform.openai.com/account/usage' title='http://platform.openai.com/account/usage'>usage</a><br/>" +
                         'organization: <input id="gpt_config_org_id" type="password" style="margin:5px;width:275px;" value="' + org + '"/>' +
                         '<input type="checkbox" name="show" data-onchange="true">Show</input><br/>' +
                         'apiKey:       <input id="gpt_config_key_id" type="password" style="margin:5px;width:425px;" value="' + key + '"/><br/>' +
                        '<input type="submit" value="Update Organization and API keys" style="margin:10px;"></input>' +
                     '</fieldset>' +
                     "<fieldset style='margin-top:10px;'><legend><i>Model used to compute the response</i> </legend>" +
                         '<span title="Best but new and not everyone has access to the API."> <input type="radio" name="model" value="gpt-4" '            + gpt_4_checked   + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>gpt-4</span>   &nbsp;&nbsp;' +
                         '<span title="Cheaper and faster.&#13;The default.">                 <input type="radio" name="model" value="gpt-3.5-turbo" '    + gpt_3_5_checked + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>gpt-3.5-turbo</span>   &nbsp;&nbsp;' +
                         '<span title="Good for specialized cases.">                          <input type="radio" name="model" value="text-davinci-003" ' + davinci_checked + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>text-davinci-003</span> &nbsp;&nbsp; <br/>' + //a tag fails when you click on it but I don't know why <a target="_blank" href="https://scale.com/blog/chatgpt-vs-davinci">How to choose</a><br/>' +
                     '</fieldset>' +
                     '<fieldset style="margin-top:10px;"><legend><i>Media to display the response in</i> </legend>' +
                         '<span title="Produce text in the output pane."><input type="radio" name="response_media" value="text" '    + text_checked       + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>text</span> &nbsp;&nbsp;' +
                         '<span title="max_tokens is roughly equivlent to the number of words in the completion result.&#13;Default: 200">max_tokens: <input name="max_tokens" value="' + max_tokens + '" type="number" min="1" style="width:50px; margin:5px 5px 5px 5px;"/></span>' +
                          '<input type="button" value="Update max_tokens" style="margin:10px;"/>' +
                         '<br/>' +
                         '<span title="Inspect the high level parsing of the response, good for JavaScript-compatible data."><input type="radio" name="response_media" value="inspect_text_to_data" ' + inspect_text_to_data_checked + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>inspect_text_to_data </span>&nbsp;&nbsp;<br/>' +
                         '<span title="Inspect the low level transfer data from OpenAI."><input type="radio" name="response_media" value="inspect_envelope" ' + inspect_envelope_checked + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>inspect_envelope </span>&nbsp;&nbsp;<br/>' +
                         '<span title="Show the numbers in the response, if any."><input type="radio" name="response_media" value="plot_numbers" ' + plot_numbers_checked + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>plot_numbers </span>&nbsp;&nbsp;<br/>' +
                         '<span title="Show an image of the result in a new tab."><input type="radio" name="response_media" value="image" '   + image_checked   + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>image</span> ' +
                         ' &nbsp;&nbsp;&nbsp;size: <select name="image_size" data-onchange="true">' +
                                         '<option value="256x256" '   + selected_256  + '>256x256</option>'   +
                                         '<option value="512x512" '   + selected_512  + '>512x512</option>'   +
                                         '<option value="1024x1024" ' + selected_1024 + '>1024x1024</option>' +
                          '</select>\n' +
                      '</fieldset>',
                      x: 700,
                      y: 0,
                      width:  550,
                      height: 450,
                      callback: "OpenAI.show_config_cb"
        }
        )
    }

    static show_config_cb(vals){
        if(vals.clicked_button_value){
            if(vals.clicked_button_value === "show"){
                if(vals.show){
                    gpt_config_org_id.setAttribute("type", "text")
                    gpt_config_key_id.setAttribute("type", "text")
                }
                else {
                    gpt_config_org_id.setAttribute("type", "password")
                    gpt_config_key_id.setAttribute("type", "password")
                }
            }
            else if (vals.clicked_button_value  === "Update Organization and API keys"){
                let org = vals.gpt_config_org_id.trim()
                let key = vals.gpt_config_key_id.trim()
                if ((key.length > 0) &&
                    (org.length > 0)) {
                    OpenAI.make_configuration(org, key)
                    DDE_DB.persistent_set("gpt_org", org)
                    DDE_DB.persistent_set("gpt_key", key)
                }
            }
            else if(vals.clicked_button_value === "model"){
                let model = vals.model
                DDE_DB.persistent_set("gpt_model", model)
                OpenAI.openai_request(OpenAI.previous_prompt)
            }
            else if (vals.clicked_button_value === "response_media"){
                let media = vals.response_media
                DDE_DB.persistent_set("gpt_response_media", media)
                DDE_DB.persistent_set("gpt_completion_max_tokens", parseInt(vals.max_tokens))
                DDE_DB.persistent_set("gpt_model", vals.model)
                DDE_DB.persistent_set("gpt_image_size", vals.image_size)
                if(media === "text") {
                    if(OpenAI.previous_response_text) {
                        OpenAI.make_text_default_callback(OpenAI.previous_prompt, OpenAI.previous_response_text)
                    }
                    else if(OpenAI.previous_prompt){ //probably started out with an image, now we need to compute the text.
                        OpenAI.openai_request(OpenAI.previous_prompt)
                    }
                    else return //probably no previous activity so do nothing, wait for user to click GPT button and give it a prompt
                }
                else if(media === "inspect_text_to_data") {
                    if(OpenAI.previous_response_text) {
                        inspect(OpenAI.text_to_data(OpenAI.previous_response_text, OpenAI.previous_prompt))
                    }
                    else if(OpenAI.previous_prompt){ //probably started out with an image, now we need to compute the text.
                        OpenAI.openai_request(OpenAI.previous_prompt)
                    }
                    else return //probably no previous activity so do nothing, wait for user to click GPT button and give it a prompt
                }
                else if(media === "inspect_envelope") {
                    if(OpenAI.previous_response_text) {
                        inspect(OpenAI.previous_response_envelope)
                    }
                    else if(OpenAI.previous_prompt){ //probably started out with an image, now we need to compute the text.
                        OpenAI.openai_request(OpenAI.previous_prompt)
                    }
                    else return //probably no previous activity so do nothing, wait for user to click GPT button and give it a prompt
                }
                else if(media === "plot_numbers") {
                    if(OpenAI.previous_response_text) {
                        OpenAI.make_plot_numbers_cb(OpenAI.previous_prompt, OpenAI.previous_response_text)
                    }
                    else if(OpenAI.previous_prompt){ //probably started out with an image, now we need to compute the text.
                        OpenAI.openai_request(OpenAI.previous_prompt)
                    }
                    else return //probably no previous activity so do nothing, wait for user to click GPT button and give it a prompt
                }
                else if(media === "image") {
                    if(OpenAI.previous_response_url){ //note: has been set to null, if openai_request was last called with different prompt
                        window.open(OpenAI.previous_response_url, "_blank")
                    }
                    else if(OpenAI.previous_prompt){ //probably started out with an image, now we need to compute the text.
                        OpenAI.openai_request(OpenAI.previous_prompt)
                    }
                    else return //probably no previous activity so do nothing, wait for user to click GPT button and give it a prompt
                }
            }
            else if (vals.clicked_button_value === "Update max_tokens"){
                DDE_DB.persistent_set("gpt_completion_max_tokens", parseInt(vals.max_tokens))
                let media = DDE_DB.persistent_get("gpt_response_media")
                if(["text", "inspect_text_to_data", "inspect_envelope", "plot_numbers"].includes(media)){
                    if(OpenAI.previous_prompt){
                        OpenAI.openai_request(OpenAI.previous_prompt)
                     }
                }
            }
            else if (vals.clicked_button_value === "image_size"){
                DDE_DB.persistent_set("gpt_image_size", vals.image_size) //ie "256x256", "512x512", or "1024x1024"
                if(DDE_DB.persistent_get("gpt_response_media") == "image"){
                    if(OpenAI.previous_prompt){
                        OpenAI.openai_request(OpenAI.previous_prompt)
                    }
                }
            }
            else if (vals.clicked_button_value === "close_button"){}
            else {
                shouldnt("In OpenAI.show_config_cb with invalid vals.clicked_button_value of: " + vals.clicked_button_value)
            }
        }
    }

    static text_to_data(text, prompt=null){
        text = text.trim()
        let result = {prompt: prompt,
                      text: text,

                      email_addresses: [], //chatGPT generaly filters email addresses out of results as a privacy issue, but you might find some
                      phone_numbers: [],
                      urls: [],
                      zip_codes: [],

                      first_word_data: null,
                      last_word_data: null,
                      word_count: 0,
                      first_sentence: null,

                      numbers: [], //does not include dollar_numbers
                      dollar_numbers: [],
                      UK_pound_numbers: [],
                      euro_numbers: [],
                      percent_numbers: [],

                      numbered_bullet_points: [], //starts with "1.", "2." etc
                      bullet_points: [], // start with "- "
                      name_value_pairs: {} //values are always arrays as there might be > value per name in named entities.
        }
        let words = text.split(/\s/) //spit on whitespace
        result.word_count = words.length
        result.first_sentence = this.first_sentence(text)
        if(words.length > 0) {
            result.first_word_data = this.text_to_boolean_or_number(words[0])
            result.last_word_data  = this.text_to_boolean_or_number(words[words.length - 1])
        }
        for (let word of words) {
            if ((".,?!;:)]}|/\"'+>=&*^").includes(Utils.last(word))) {
                word = word.substring(0, word.length - 1) //trim off last char if its punctuation
            }
            let num_maybe = this.text_to_boolean_or_number(word)
            if ((typeof (num_maybe) === "number") &&
                !Number.isNaN(num_maybe)) {
                if      (word.startsWith("$")) { result.dollar_numbers.push(num_maybe) }
                else if (word.startsWith("£")) { result.UK_pound_numbers.push(num_maybe) }
                else if (word.startsWith("€")) { result.euro_numbers.push(num_maybe) }
                else if (word.endsWith("%"))   { result.percent_numbers.push(num_maybe) }
                else                           { result.numbers.push(num_maybe) }
            }
            if      (this.is_email_address(word)) {
                result.email_addresses.push(word)
            }
            else if (this.is_url(word)) {
                result.urls.push(word)
            }
            else if (this.is_phone_number(word)) {
                result.phone_numbers.push(word)
            }
            else if (this.is_zip_code(word)) {
                result.zip_codes.push(word)
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

    static first_sentence(text){
        for (let i = 0; i < text.length; i++){
            let char = text[i]
            if(".?!".includes(char)){
                return text.substring(0, i + 1)
            }
        }
        return text
    }

    static is_email_address(text){
        return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(text))
    }

    //https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
    static is_phone_number(text){
        return (/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(text))
    }

    static is_url(text){
        return (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(text))
    }

    static is_zip_code(text){
        return /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(text)
    }

    static text_to_boolean_or_number(text) {
        text = text.toLowerCase(text)
        if (".!?,%".includes(Utils.last(text))) {
            text = text.substring(0, text.length - 1)
        }
        if      (["yes", "ok", "true", "that is correct"].includes(text))   { return true }
        else if (["no", "nope", "false"].includes(text)) { return false }
        else if (["null", "none"].includes(text))        { return null }
        else { //maybe its a number
            let num_maybe = text
            if ("$£€".includes(text[0])) {
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

    //RECURSIVE
    //if results is empty,
    //prompt of "what causes sickness?" is returned as "what causes ?",
    // and result becomes ["sickness"]
    /*static modify_pattern_maybe(pattern, results){
        if(results.length > 0){}
        else if(pattern.includes("?")) {}
        else if(pattern.includes("[") && pattern.includes("]")) {
            let words = pattern.split(/\s/)
            for(let i = 0; i < words.length; i++){
                let word = words[i]
                if(word.startsWith("[") && word.endsWith("]")){
                    let word_no_brackets = word.substring(1, word.length - 1)
                     //"[fire] is caused by"
                    results.push(word_no_brackets) //push sickness
                    pattern = pattern.replace(word, "?") //now pattern is "? is caused by"
                    if (!pattern.startsWith("single word: ")) {
                        pattern = "single word: " + pattern
                    }
                    return pattern
                }
            }
        }
        return pattern
    }*/

    static modify_pattern_maybe(pattern, results){
        if(results.length > 0){}
        else if(pattern.includes("?")) {}
        else if(pattern.includes("[") && pattern.includes("]")) {
            //let words = pattern.split(/\s/)
            let collecting_bracket_word = false
            let bracket_word = ""
            let new_pattern = ""
            let bracket_word_count
            for(let i = 0; i < pattern.length; i++) {
                let char = pattern[i]
                if (char === "[") {
                    collecting_bracket_word = true
                } else if (char === "]") {
                    collecting_bracket_word = false
                    bracket_word = bracket_word.trim()
                    let bracket_words = bracket_word.split(" ")
                    bracket_word_count = bracket_words.length
                    results.push(bracket_word)
                    new_pattern += "?"
                } else if (collecting_bracket_word) {
                    bracket_word += char
                } else {
                    new_pattern += char
                }
            }
            if(!new_pattern.includes(":")) {
                new_pattern = bracket_word_count + " word: " + new_pattern
            }
            return new_pattern
        }
        return pattern
    }



    //if pattern has no ?, just return it.
    // "?" is a shortcut for "?0" filling in with the last elt of results
    // "?1" fills in with the 2nd to last elt of results, etc. works thru "?9"
    static recursive_fill_in_pattern(pattern, results){
        for(let i = 0; i < 10; i++){
            let pat = "?" + i
            let index_into_results = results.length - 1 - i
            pattern = pattern.replaceAll(pat, results[index_into_results])
        }
        let default_filler = Utils.last(results)
        pattern = pattern.replaceAll("?", default_filler)
        return pattern
    }

    static recursive_default_clean_up_result(result){
        if(result.endsWith(".")){
            result = result.substring(0, result.length - 1)
        }
        return result
    }

    static recursive_make_assertion(prompt, result){
        let colon_index = prompt.indexOf(":")
        if(colon_index >= 0){
            prompt = prompt.substring(colon_index + 1).trim()
        }
        let assertion = prompt + " " + result + "."
        return assertion
    }

    //not now used
    //static recursive_number_clean_up_result(result){
    //     let data = OpenAI.text_to_data(result)
    //    return data.numbers[0]
    //}

    static recursive(pattern="[fire] is caused by",
                     results=[], //but ultimately defaults to ["fire"]
                     times=3,
                     callback=OpenAI.recursive_default_callback,
                     clean_up_result_callback = OpenAI.recursive_default_clean_up_result,
                     assertions=[]){ //for the initial call, this is always [].
        if(times === 0){
            callback(assertions, results)
        }
        else {
            pattern = this.modify_pattern_maybe(pattern, results) //returns possibly modified pattern and possibly psuhes onto results
            //if (results.length === 0) { results.push("fire")} //default first result but don't do before calling modify_pattern ...
            prompt = this.recursive_fill_in_pattern(pattern, results)
            this.show_prompt(prompt)
            this.make_text(prompt,
                   function(prompt, result){
                        result = clean_up_result_callback(result)
                        results.push(result)
                        let assertion = OpenAI.recursive_make_assertion(prompt, result)
                        assertions.push(assertion)
                        times = times -1
                        OpenAI.recursive(pattern, results, times, callback, clean_up_result_callback, assertions)
                   }
                )
        }
        return "dont_print" //so that the 3 show_prompts will come out together.
    }

    static recursive_default_callback(assertions, results){
        inspect({assertions: assertions, results: results})
    }

    //_____SIMILAR____

    //text can be a string, or array of strings
    // see: https://platform.openai.com/docs/guides/embeddings/use-cases
    // but better: https://platform.openai.com/docs/api-reference/embeddings/create
    static async create_embedding(text, callback=null) {
        let model = "text-embedding-ada-002" // can't use gtp 3.5 for embeddings DDE_DB.persistent_get("gpt_model") ,causes request status code of 403 (error)
        try {
            const response = await this.openai.createEmbedding({
                model: model,
                input: text,
            })
            if (callback) {
                callback(response)
            }
            return response
        }
        catch(err){
            dde_error("OpenAI could not process create an embedding for:<br/><code>" + text +
                "</code><br/><b>" + err.message + "</b>" +
                OpenAI.special_error_message(err) +
                "<br/>Browse <a target='_blank' href='http://openai.com'>openai.com</a>"
            )
        }
    }

    static cosine_similarity(vector1, vector2) {
        const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((acc, val) => acc + val ** 2, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((acc, val) => acc + val ** 2, 0));
        return dotProduct / (magnitude1 * magnitude2);
    }

    static similar_default_callback(text0, text1, score){
        inspect({text0: text0, text1: text1, score: score})
    }

    static async similar(text0, text1, callback=OpenAI.similar_default_callback){
        const response = await this.create_embedding([text0, text1])
        if(response.status === 200) {
            let text0_embedding = response.data.data[0].embedding
            let text1_embedding = response.data.data[1].embedding
            let score = this.cosine_similarity(text0_embedding, text1_embedding)
            if(callback) {
                callback(text0, text1, score)
            }
            return score
        }
        else {
            dde_error("OpenAI.similar got error: " + response.status + "for: <br/>" +
                        text0 + "<br/>" + text1)
        }
    }

    //another possible callback for similar that shows the score in a gauge
    static plot_similar_score(text0, text1, score, min=-1, max=1){
        let data  = [
            { value: score,
                title: text0.substring(0, 12) + ", " + text1.substring(0, 12),
                type:  "indicator",
                mode:  "gauge+number", //bar+number
                gauge: { axis:  { range: [min, max] },
                    shape: "angular", //also: "bullet"
                    bar:   { color: rgb(100, 30, 200)}
                }
            }
        ]
        Plot.show( undefined,
            data,
            {height: 250, //layout
                width: 300,
                margin: {l:40, r:20, t:0, b:0},
            },
            null, //config
            {title: "Similarity of:", x: 20, y: 40, width: 310, height: 300} //show_window attributes
        )
    }

    static move_dexter_joints(prompt="multiples of fifteen") {
        this.show_prompt(prompt)
        new Job({name: "my_job",
            do_list: [
                function(){
                    OpenAI.make_text(prompt,
                        function(prompt, result){
                            let data = OpenAI.text_to_data(result)
                            let angles = data.numbers.slice(0, 5)
                            out("Computed angles: " + angles)
                            Job.my_job.user_data.angles = angles
                        }
                    )},
                Control.wait_until(function(){
                    return this.user_data.angles
                }),
                function(){
                    let angles = this.user_data.angles
                    if(Utils.is_array_of_numbers(angles, null, 0, 90)){
                        return Dexter.move_all_joints(angles)
                    }
                    else { warning("Sorry, couldn't compute angles 0 thru 90. Got instead:<br/>" +
                        angles)}
                },
                Dexter.move_all_joints(0,0,0,0,0)
            ]
        }).start()
    }

} //end of class OpenAI