// https://platform.openai.com/docs/guides/gpt  describes "functions" interface.

import { Configuration, OpenAIApi } from "openai";
import {grab_text_for_eval_button} from "./eval.js"

globalThis.OpenAIApi = OpenAIApi
globalThis.Configuration = Configuration

globalThis.OpenAI = class OpenAI{
    static configuration
    static openai
    static previous_envelope = null //will get set after first gpt call and remain set until dde relaunched
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
        if(org && key){
            this.make_configuration(org, key)
        }

        let model = DDE_DB.persistent_get("gpt_model")
        if(!model) { DDE_DB.persistent_set("gpt_model", "gpt-3.5-turbo")}

        let media = DDE_DB.persistent_get("gpt_response_media")
        if(!media) { DDE_DB.persistent_set("gpt_response_media", "text")}

        let temperature = DDE_DB.persistent_get("gpt_temperature")
        if(!temperature || Number.isNaN(temperature)) { DDE_DB.persistent_set("gpt_temperature", 0)}

        let max_tokens = DDE_DB.persistent_get("gpt_completion_max_tokens")
        if(!max_tokens || Number.isNaN(max_tokens)) { DDE_DB.persistent_set("gpt_completion_max_tokens", 200)}

        let image_size = DDE_DB.persistent_get("gpt_image_size")
        if(!image_size)  { DDE_DB.persistent_set("gpt_image_size", "512x512") }
    }

    static make_configuration(org, key){
        //https://platform.openai.com/docs/api-reference/authentication
        //but better: https://www.npmjs.com/package/openai
        this.configuration = new Configuration({
            organization: org,
            apiKey: key //process.env.OPENAI_API_KEY,
        })
        //to get rid of the console error: Refused to set unsafe header "User-Agent"
        //see this solution in https://github.com/openai/openai-node/issues/6
        delete this.configuration.baseOptions.headers['User-Agent'];

        this.openai = new OpenAIApi(this.configuration);
    }

    static gpt_button_action(){
        if(!OpenAI.openai) {
            warning("You need to configure GPT before using it.")
            OpenAI.show_config()
        }
        else {
            let [src, src_comes_from_editor] = grab_text_for_eval_button()
            OpenAI.request(src)
        }
    }

    static show_prompt(prompt){
        prompt = prompt.trim()
        let summary_prompt
        if (prompt.length > 50) { summary_prompt = prompt.substring(0, 47) + "..." }
        else { summary_prompt = prompt }
        let prompt_for_title = prompt.replaceAll("'", "\\'")
        out("<div class='gpt' title='" + prompt_for_title + "'><i>OpenAI passed prompt: </i> " + summary_prompt + "</div>")
    }

    //https://platform.openai.com/docs/api-reference/authentication
    //but better: https://www.npmjs.com/package/openai
    //to use gpt-3.5-turbo, see:
    // https://stackoverflow.com/questions/72326140/openai-api-refused-to-set-unsafe-header-user-agent
    static async request(prompt= OpenAI.previous_prompt()){
        if(typeof(prompt) !== "string") {
            prompt = this.envelope_to_prompt(this.previous_envelope)
        }
        //let response = await openai.listEngines();#bcfbe0  #6afbbc too dark green
        if(Editor.current_buffer_needs_saving) {
            Editor.save_current_file()
        }
        prompt = prompt.trim()
        this.show_prompt(prompt)
        let media = DDE_DB.persistent_get("gpt_response_media")
        if     (media === "inspect_envelope")     {  this.previous_envelope = await this.make_inspect_envelope(prompt)
                                                     return this.previous_envelope
                                                  }
        else if(media === "text")                 { this.previous_envelope = await this.make_text(prompt)
                                                    return this.previous_envelope
                                                  }
        else if(media === "inspect_text_to_data") { this.previous_envelope = await this.make_inspect_text_to_data(prompt)
                                                    return this.previous_envelope
                                                  }
        else if(media === "code_only")            { this.previous_envelope = await this.make_code_only(prompt)
                                                    return this.previous_envelope
                                                  }
        else if(media === "whole_response")       { this.previous_envelope = await this.make_whole_response(prompt)
                                                    return this.previous_envelope
                                                  }
        else if(media === "plot_numbers")         { this.previous_envelope = await this.make_plot_numbers(prompt)
                                                    return this.previous_envelope
                                                  }
        else if (media === "search_google")       { this.previous_envelope = await this.make_search_google(prompt)
                                                    return this.previous_envelope
                                                  }
        else if(media === "image")                { this.previous_envelope  = await this.make_image(prompt) //does not take temperature
                                                    return this.previous_envelope
                                                  }
        else { shouldnt("In OpenAI.request with invalid response media of: " + media)}
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
                "<br/>by giving you more responses per minute.<br>" +
                "<br/>Browse <a target='_blank' href='http://openai.com'>openai.com</a>"

        }
        else if (err.message.includes("500")){
            return "<br/> A 500 status code means the OpenAI server errored.<br/>Please try again later."
        }
        else {
            return ""
        }
    }

    static envelope_to_model(envelope){
        if(envelope.data) { //good for most models
            let model = envelope.data.model
            if(model) {
                if (model.startsWith("gpt-4")) {
                    return "gpt-4"
                } else if (model.startsWith("gpt-3.5-turbo")) {
                    return "gpt-3.5-turbo"
                } else if (model.startsWith("text-davinci-003")) {
                    return "text-davinci-003"
                }
                else {
                    shouldnt("OpenAI.envelope_to_model got invalid model: " + model)
                }
            }
        }
        if(envelope.config){ //might be an image
            let config_url = envelope.config.url
            if(typeof(config_url) === "string"){
                if (config_url.includes("/images/")){
                    return "image"
                }
            }
        }
        shouldnt("OpenAI.envelope_to_model passed envelope that didn't have the model in a recognized place.")
    }

    static envelope_to_prompt(envelope){
        let model = this.envelope_to_model(envelope)
        let data_str = envelope.config.data
        let data = JSON.parse(data_str)
        let prompt
        if(model === "text-davinci-003"){
            return data.prompt
        }
        if(model === "code_davinci_002"){
            return data.prompt
        }
        if(model === "image") {
            return data.prompt
        }
        else {
            return data.messages[0].content
        }
    }

    static previous_prompt(){
        if(this.previous_envelope) {
            return this.envelope_to_prompt(this.previous_envelope)
        }
        else { return "hello world"}
    }

    static envelope_to_response(envelope) {
        let model = this.envelope_to_model(envelope)
        if(model === "text-davinci-003") {
               return envelope.data.choices[0].text }
        else if (model === "image") {
               return this.envelope_to_url(envelope)
        }
        else { return envelope.data.choices[0].message.content}
    }

    //only used for envelope's for image
    static envelope_to_url(envelope) {
        let model = this.envelope_to_model(envelope)
        if(model === "image") {
            return envelope.data.data[0].url
        }
        else { return null } //envelope is not an image
    }

    //see: https://www.makeuseof.com/chatgpt-api-complete-guide/ for 3.5 and 4 api's.
    //very similar to make_text
    static async make_inspect_envelope(prompt, callback=OpenAI.make_inspect_envelope_cb){
        let model       = DDE_DB.persistent_get("gpt_model")
        let max_tokens  = DDE_DB.persistent_get("gpt_completion_max_tokens")
        let temperature = DDE_DB.persistent_get("gpt_temperature")
        let envelope
        try {
            if (model === "text-davinci-003") {
                envelope = await this.openai.createCompletion({
                    model: model, //"text-davinci-003", //"text-davinci-003" //gpt-3.5-turbo errors, maybe because I haven't paid, or because it streams the response
                    prompt: prompt,
                    max_tokens: max_tokens,
                    temperature: temperature
                })
            }
            else if (["gpt-4", "gpt-3.5-turbo"].includes(model)) { //see https://platform.openai.com/docs/api-reference/chat/create
                envelope = await this.openai.createChatCompletion({
                    model: model,
                    messages: [{role: "user", content: prompt}],
                    max_tokens: max_tokens,
                    temperature: temperature
                });
            }
        }
        catch(err){
            dde_error("OpenAI could not complete your prompt:<br/><code>" + prompt +
                "</code><br/> due to: <b>" + err.message + "</b>" +
                OpenAI.special_error_message(err)
            )
        }
        callback(envelope)
        return envelope
    }

    static make_inspect_envelope_cb(envelope){
        inspect(envelope)
        return envelope
    }

    static async make_text(prompt, callback=OpenAI.make_text_cb) {
        return this.make_inspect_envelope(prompt, callback)
    }

    static make_text_cb(envelope){
        let response = OpenAI.envelope_to_response(envelope)
        let response_with_tags = OpenAI.wrap_a_tags_around_urls(response)
        out("<div class='gpt' style='white-space:pre-wrap;'>" + response_with_tags + "</div>")
        return envelope
    }

    static async make_inspect_text_to_data(prompt, callback=OpenAI.make_inspect_text_to_data_cb){
       return await this.make_inspect_envelope(prompt, callback)
    }

    //callback for make_text
    //called from more than 1 place
    static make_inspect_text_to_data_cb(envelope){
        let prompt = OpenAI.envelope_to_prompt(envelope)
        let response = OpenAI.envelope_to_response(envelope)
        let data = OpenAI.text_to_data(prompt, response)
        inspect(data)
        return envelope
    }


    static async make_code_only(prompt, callback=OpenAI.make_code_only_cb){
        return await this.make_inspect_envelope(prompt, callback)
    }

    //callback for make_text
    //called from more than 1 place
    static make_code_only_cb(envelope){
        let prompt   = OpenAI.envelope_to_prompt(envelope)
        let response = OpenAI.envelope_to_response(envelope)
        let data = OpenAI.text_to_data(prompt, response)
        let code = OpenAI.data_to_code(data)
        if ((code.length === 0) && data.numbers.length > 0){
            if(data.numbers.length === 1) { code = "" + data.numbers[0]}
            else { code = "[" + data.numbers.join(", ") + "]" }
        }
        if(code.length === 0){
            warning("There is no code in the previous response to insert.")
        }
        else {
            Editor.insert(code + "\n", "selection_end", true)
        }
        return envelope
    }

    static async make_whole_response(prompt, callback=OpenAI.make_whole_response_cb){
        return await this.make_inspect_envelope(prompt, callback)
    }

    //callback for make_text
    //called from more than 1 place
    static make_whole_response_cb(envelope){
        let response = OpenAI.envelope_to_response(envelope)
        Editor.insert("/*" + response + "*/", "selection_end", true)
    }

    static async make_plot_numbers(prompt, callback=OpenAI.make_plot_numbers_cb){
        return await this.make_inspect_envelope(prompt, OpenAI.make_plot_numbers_cb)
    }

    //callback for make_text
    //called from more than 1 place
    static make_plot_numbers_cb(envelope){
        let prompt   = OpenAI.envelope_to_prompt(envelope)
        let response = OpenAI.envelope_to_response(envelope)
        let data = OpenAI.text_to_data(prompt, response)
        if(data.numbers.length === 0){
            warning("Sorry, no there are numbers in the response to plot.")
        }
        else {
            Plot.show(undefined, data.numbers)
        }
    }

    static async make_search_google(prompt, callback=OpenAI.make_search_google_cb){
        out("<div class='gpt'> A Google search page will be shown in a new browser tab in a few seconds.</div>")
        return await this.make_inspect_envelope(prompt, OpenAI.make_search_google_cb)
    }

    //callback for make_text
    //called from more than 1 place
    static make_search_google_cb(envelope){
        let prompt = OpenAI.envelope_to_prompt(envelope)
        let encoded_prompt = encodeURIComponent(prompt)
        window.open("https://www.google.com/search?q=" + encoded_prompt,  "_blank")
        //window.open("https://duckduckgo.com/?q=" + encoded_prompt + "&va=v&t=ha&ia=web", "_blank") //works
        //window.open("https://duckduckgo.com/html/?q=" + encoded_prompt, "_blank") //result page doesn't contain images

    }

    //does not take a temperature. not sure why
    static async make_image(prompt="a blue dog", callback=OpenAI.make_image_cb){
        out("<div class='gpt'> An image will be shown in a new browser tab in a few seconds.</div>")
        let image_size = DDE_DB.persistent_get("gpt_image_size")
        let envelope = await OpenAI.openai.createImage({
            prompt: prompt,
            n: 1,
            size: image_size,
        })
        callback(envelope)
        return envelope
    }

    static make_image_cb(envelope){
        let url = OpenAI.envelope_to_url(envelope)
        window.open(url, "_blank")
    }

    static show_config(){
        DocCode.open_doc(gpt_interface_doc_id)
        let org = DDE_DB.persistent_get("gpt_org") //if this has never been set, the response is undefined
        if(!org) { org = "" }
        let key = DDE_DB.persistent_get("gpt_key") //if this has never been set, the response is undefined
        if(!key) { key = "" }

        let response_media = DDE_DB.persistent_get("gpt_response_media")
        if(!response_media) {response_media = "text" }
        let text_checked                 = ((response_media === "text")           ? " checked" : "")
        let image_checked                = ((response_media === "image")          ? " checked" : "")
        let inspect_envelope_checked     = ((response_media === "inspect_envelope") ? " checked" : "")
        let inspect_text_to_data_checked = ((response_media === "inspect_text_to_data") ? " checked" : "")
        let code_only_checked            = ((response_media === "code_only")      ? " checked" : "")
        let whole_response_checked       = ((response_media === "whole_response") ? " checked" : "")
        let plot_numbers_checked         = ((response_media === "plot_numbers")   ? " checked" : "")
        let search_google_checked        = ((response_media === "search_google")  ? " checked" : "")


        let model = DDE_DB.persistent_get("gpt_model")
        if(!model) { model = "gpt-3.5-turbo" }
        let gpt_4_checked   =      ((model === "gpt-4")            ?  " checked" : "")
        let gpt_3_5_checked =      ((model === "gpt-3.5-turbo")    ?  " checked" : "")
        let davinci_checked =      ((model === "text-davinci-003") ?  " checked" : "")

        let max_tokens = DDE_DB.persistent_get("gpt_completion_max_tokens")
        if(!max_tokens || Number.isNaN(max_tokens)) { max_tokens = "200" }

        let temperature = DDE_DB.persistent_get("gpt_temperature")
        if(!temperature || Number.isNaN(temperature)) { temperature = "0" }

        let image_size = DDE_DB.persistent_get("gpt_image_size")
        if(!image_size) { image_size = "256x256" }
        let selected_256 =  ((image_size === "256x256")   ? " selected " : "")
        let selected_512 =  ((image_size === "512x512")   ? " selected " : "")
        let selected_1024 = ((image_size === "1024x1024") ? " selected " : "")
        show_window({title: "GPT Configuration",
            content: "<span title='Summary:&#13;- Do not give info in prompts you do not want to share.&#13;- Responses are often inaccurate.'> " +
                     "<a style='font-weight:bold;' target='_blank' href='https://www.opengrowth.com/resources/the-dangers-of-chatgpt-how-it-can-put-you-at-risk'>The risks of GPT</a> " +
                     "</span>" +
                     "<fieldset style='margin-top:5px;'><legend><i>OpenAI Log In Requirements</i> </legend>" +
                         "If you don't have a key, sign up at <a target='_blank' href='http://openai.com' title='On the menu in the upper right of the page, choose: Sign up.&#13;You are given a lot of initial usage for free.'>openai.com</a>. " +
                         "&nbsp;&nbsp;<a target='_blank' href='http://platform.openai.com/account/usage' title='How much you are spending at OpenAI.com'>usage</a><br/>" +
                         'organization: <input id="gpt_config_org_id" type="password" style="margin:5px;width:235px;" value="' + org + '"/>' +
                         '<input type="checkbox" name="show" data-onchange="true">Show</input><br/>' +
                         'apiKey:      <input id="gpt_config_key_id" type="password" style="margin:5px;width:380px;" value="' + key + '"/><br/>' +
                        '<input type="button" value="Update Organization and API keys" style="margin:4px;"></input>' +
                     '</fieldset>' +
                     "<fieldset style='margin-top:10px;'><legend><i>Model used to compute the response</i> </legend>" +
                         '<span title="Best but new and not everyone has access to the API." style="margin-left:5px";> <input type="radio" name="model" value="gpt-4" '            + gpt_4_checked        + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>gpt-4</span> ' +
                         '<span title="Cheaper and faster.&#13;The default.">                 <input type="radio" name="model" value="gpt-3.5-turbo" '    + gpt_3_5_checked      + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>gpt-3.5-turbo</span> ' +
                         '<span title="Good for specialized cases.">                          <input type="radio" name="model" value="text-davinci-003" ' + davinci_checked      + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>text-davinci-003</span> ' +
                         '&nbsp; <a target="_blank" href="https://scale.com/blog/chatgpt-vs-davinci">How to choose</a><br/>' +

                         '<span title="max_tokens is roughly equivalent to the number of words in the response.&#13;Default: 200&#13;Click regenerate to store the new value." style="margin-left:22px;">max_tokens: <input name="max_tokens"  type="number" min="1"         step="1"   value="' + max_tokens  + '" style="width:50px;"/></span>' +
                         '<span title="0 (the default) is most accurate&#13;whereas 2 is most creative.&#13;Click regenerate to store the new value." style="margin-left:15px;">temperature:                         <input name="temperature" type="number" min="0" max="2" step="0.1" value="' + temperature + '"/></span>' +
                     '</fieldset>' +
                     '<fieldset style="margin-top:10px;"><legend><i>How and where to display the response</i> </legend>' +
                         '<span title="Produce text in the output pane."><input type="radio" name="response_media" value="text" '    + text_checked       + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>text</span> &nbsp;&nbsp;' +

                         '<br/><span style="margin-left:20px;">Inspect: </span>' +
                         '<span title="Inspect the high level parsing of the response.&#13;Good for JavaScript-compatible data."><input type="radio" name="response_media" value="inspect_text_to_data" ' + inspect_text_to_data_checked + ' style="margin:5px 3px 5px 10px;" data-onchange="true"/>text_to_data</span>&nbsp;&nbsp;&nbsp;' +
                         '<span title="Inspect the low level transfer data from OpenAI."><input type="radio" name="response_media" value="inspect_envelope" ' + inspect_envelope_checked + ' style="margin:5px 3px 5px 15px;" data-onchange="true"/>envelope</span><br/>' +

                         '<span style="margin-left:20px;">Insert into editor: </span>' +
                         '&nbsp;<span title="Insert only the code from the previous response&#13;into the Editor&#13;at the end of the selection or cursor.">' +
                         '<input type="radio" name="response_media" value="code_only" '      + code_only_checked      + ' style="margin:5px 3px 5px 10px;" data-onchange="true"/>code_only</span>' +
                         '&nbsp;<span title="Insert the whole previous response&#13;into the editor&#13;at the end of the selection or cursor.&#13;The response is wrapped in a comment.">' +
                         '<input type="radio" name="response_media" value="whole_response" ' + whole_response_checked + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>whole_response</span><br/>' +


                         '<span title="Show the numbers in the response, if any."><input type="radio" name="response_media" value="plot_numbers" '   + plot_numbers_checked  + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>plot_numbers  </span>' +
                         '<span title="Use the prompt to query Google search.&#13;You may have to allow pop-ups.&#13;Click on the leftmost icon in the right of the URL bar.">   <input type="radio" name="response_media" value="search_google" '  + search_google_checked + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>search_google </span><br/>' +

                         '<span title="Show an image of the response in a new tab.&#13;You may have to allow pop-ups.&#13;Click on the leftmost icon in the right of the URL bar."><input type="radio" name="response_media" value="image" '   + image_checked   + ' style="margin:5px 3px 5px 20px;" data-onchange="true"/>image</span> ' +
                         ' &nbsp;&nbsp;&nbsp;size: <select name="image_size" data-onchange="true">' +
                                         '<option value="256x256" '   + selected_256  + '>256x256</option>'   +
                                         '<option value="512x512" '   + selected_512  + '>512x512</option>'   +
                                         '<option value="1024x1024" ' + selected_1024 + '>1024x1024</option>' +
                          '</select>\n' +
                          '&nbsp;<a href="#" title="Click for help.">Image not showing?</a>' +
                      '</fieldset>' +
                      '<input type="button" name="regenerate" value="regenerate" style="margin: 7px; 7px; 0px; 7px;" ' +
                      'title="Call GPT again with the same prompt and settings.&#13;Often you will get a different response."/>'
                      ,
                      x: 700,
                      y: 0,
                      width:  500,
                      height: 475,
                      callback: "OpenAI.show_config_cb"
        }
        )
    }

    static show_config_cb(vals){
        if(vals.clicked_button_value){
            if(vals.clicked_button_value === "show"){ //show the  org and API key
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
            else {
                DDE_DB.persistent_set("gpt_temperature", vals.temperature)
                DDE_DB.persistent_set("gpt_completion_max_tokens",  parseInt(vals.max_tokens))
                //DDE_DB.persistent_set("gpt_image_size",  vals.image_size) //don't do this here. see below
                if (vals.clicked_button_value === "model") {
                    let model = vals.model
                    DDE_DB.persistent_set("gpt_model", model)
                    OpenAI.request()
                } else if (vals.clicked_button_value === "temperature") {
                } //user needs to click "generate" to see the effect of changing this.
                else if (vals.clicked_button_value === "response_media") {
                    let media = vals.response_media
                    DDE_DB.persistent_set("gpt_response_media", media)
                    DDE_DB.persistent_set("gpt_model", vals.model)
                    DDE_DB.persistent_set("gpt_image_size", vals.image_size)

                    if (!OpenAI.previous_envelope) {
                        OpenAI.request() //uses "hello world" for the prompt
                        return
                    }
                    let prev_model = OpenAI.envelope_to_model(OpenAI.previous_envelope)
                    if ((media === "image") && (prev_model !== "image")) {
                        OpenAI.request() //uses previous prompt but must make a new request
                        return
                    }
                    if ((media !== "image") && (prev_model === "image")) {
                        OpenAI.request() //uses previous prompt but must make a new request
                        return
                    }
                    //below here we are gaurenteed to have a previous response and one that is
                    //compatible with previous_response, so no request calls the below media section
                    if (media === "text") {
                        OpenAI.make_text_cb(OpenAI.previous_envelope)
                    } else if (media === "inspect_text_to_data") {
                        OpenAI.make_inspect_text_to_data_cb(OpenAI.previous_envelope)
                    } else if (media === "inspect_envelope") {
                        OpenAI.make_inspect_envelope_cb(OpenAI.previous_envelope)
                    } else if (media === "code_only") {
                        OpenAI.make_code_only_cb(OpenAI.previous_envelope)
                    } else if (media === "whole_response") {
                        OpenAI.make_whole_response_cb(OpenAI.previous_envelope)
                    } else if (media === "plot_numbers") {
                        OpenAI.make_plot_numbers_cb(OpenAI.previous_envelope)
                    }
                    else if (media === "search_google") {
                        OpenAI.make_search_google_cb(OpenAI.previous_envelope)
                    }
                    else if (media === "image") {
                        OpenAI.make_image_cb(OpenAI.previous_envelope)
                    } else {
                        shouldnt("In OpenAI.request with invalid media of: " + media)
                    }
                }
                /*else if (vals.clicked_button_value === "Update max_tokens") {
                    DDE_DB.persistent_set("gpt_completion_max_tokens", parseInt(vals.max_tokens))
                    let media = DDE_DB.persistent_get("gpt_response_media")
                    //if(["text", "inspect_text_to_data", "inspect_envelope", "code_only", "whole_response", "plot_numbers"].includes(media)){
                    OpenAI.request()
                    //}
                } */
                else if (vals.clicked_button_value === "image_size") {
                    DDE_DB.persistent_set("gpt_image_size", vals.image_size) //ie "256x256", "512x512", or "1024x1024"
                    if (DDE_DB.persistent_get("gpt_response_media") == "image") {
                        OpenAI.request()
                    }
                } else if (vals.clicked_button_value === "How to choose") {
                } //user clicks on A tag
                else if (vals.clicked_button_value === "Image not showing?") {
                    DocCode.open_doc(gpt_image_not_showing_doc_id)
                } else if (vals.clicked_button_value === "regenerate") {
                    OpenAI.request()
                } else if (vals.clicked_button_value === "close_button") {
                } else {
                    shouldnt("In OpenAI.show_config_cb with invalid vals.clicked_button_value of: " + vals.clicked_button_value)
                }
            }
        }
    }

    static text_to_data(prompt = null, response){
        response = response.trim()
        let result = {prompt: prompt,
                      response: response,

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
                      name_value_pairs: {}, // property values are always arrays as there might be > value per name in named entities.
                      code: []
        }
        let words = response.split(/\s/) //spit on whitespace
        result.word_count = words.length
        result.first_sentence = this.first_sentence(response)
        if(words.length > 0) {
            result.first_word_data = this.text_to_boolean_or_number(words[0])
            result.last_word_data  = this.text_to_boolean_or_number(words[words.length - 1])
        }
        for (let word of words) {
            if(".,?!;:([{|\"'+>=&*/^".includes(word[0])){ //trim off first char
               word = word.substring(1)
            }
            if (",?!;:)]}|/\"'+>=&*^".includes(Utils.last(word))) { //trim off last char. Don't trim off . because .23 is parseed by parseFloat in 0.23
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
        let lines = response.split("\n")
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
        result.code = this.text_to_code(response) //returns [] if none
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
        //return (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(text))
        return Utils.starts_with_one_of(text, ["http://", "https://"])
    }

    /*static wrap_a_tags_around_urls(text){
        let result = ''
        let start_pos = 0
        for(let i = 0; i < 100; i++){
            //I tried using text.search(rexex) but that only matches the first pos and can't give it a starting pos.
           let url_start_pos1 = text.indexOf("http://", start_pos)
           let url_start_pos2 = text.indexOf("https://", start_pos)
           let url_start_pos
           if(url_start_pos1 === -1)       { url_start_pos = url_start_pos2 }
           else if(url_start_pos2 === -1)  { url_start_pos = url_start_pos1 }
           //neither are -1
           else { url_start_pos = Math.min(url_start_pos1, url_start_pos2)}

           if(url_start_pos == -1) { //both are -1
               result = result + text.substring(start_pos)
               break;
           }
           else {
             result = result + text.substring(start_pos, url_start_pos)
             let url_end_pos1 = text.indexOf(" ",  url_start_pos)
             let url_end_pos2 = text.indexOf("\n", url_start_pos)
             let url_end_pos3 = text.indexOf("'",  url_start_pos) //must do this to catch urls in A tags like below
             let url_end_pos4 = text.indexOf('"',  url_start_pos) //must do this to catch urls in A tags like below

             let url_end_pos = text.length
             if(url_end_pos1 !== -1) { url_end_pos = Math.min(url_end_pos, url_end_pos1)}
             if(url_end_pos2 !== -1) { url_end_pos = Math.min(url_end_pos, url_end_pos2)}
             if(url_end_pos3 !== -1) { url_end_pos = Math.min(url_end_pos, url_end_pos3)}
             if(url_end_pos4 !== -1) { url_end_pos = Math.min(url_end_pos, url_end_pos4)}

             let url = text.substring(url_start_pos, url_end_pos)
             let tag = '<a target="_blank" href="' + url + '">' + url + '</a>'
             result += tag
             start_pos = url_end_pos
           }
        }
        return result
    }*/

    static wrap_a_tags_around_urls(text){
        let result = ''
        let start_pos = 0
        for(let i = 0; i < 100; i++){
            //I tried using text.search(rexex) but that only matches the first pos and can't give it a starting pos.
            let [matching_str, url_start_pos] = Utils.index_of_first_one_of(text, ["http://", "https://"], start_pos)
            if(url_start_pos == -1) { //both are -1
                result = result + text.substring(start_pos)
                break;
            }
            else {
                result = result + text.substring(start_pos, url_start_pos)
                let [matching_delim, url_end_pos] =
                      Utils.index_of_first_one_of(text, [" ", "\n", "'", '"', "\t", "\r"], url_start_pos)
                if(url_end_pos === -1) { url_end_pos = text.length }
                let url = text.substring(url_start_pos, url_end_pos)
                let tag = '<a target="_blank" href="' + url + '">' + url + '</a>'
                result += tag
                start_pos = url_end_pos
            }
        }
        return result
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

    //returns [] if none
    /*example:
      [javascript, [`function foo(){return "hi"}`, `var bar = 22`],
      [html, [`<b>bold</b>`]],
      [javascript, [`baz = 42`]]
     ]
     Note that this representation
     - preserves the order of the code
     - allows more more than one language,
     - allows for more than one snipit in each lang.

     text may include:
     ```javascript
     foo = 2
     ```
     ```html
     <b>hi</b>
     ```
     languages are usually lower cased, but in any case,
     text_to_code lower cases the lang names.
     The end of the code is either ```  on a line by itself,
     or the end of the text.
     */
    static text_to_code(text){
        let result = []
        let code_demarker = "```"
        let start_pos = 0
        for (let i = 0; i < 100; i++) {
          start_pos = text.indexOf(code_demarker, start_pos)
          if(start_pos === -1) { return result }
          else {
              let code_lang_name_end_pos = text.indexOf("\n", start_pos)
              if(code_lang_name_end_pos === -1) { //not expected, but don't error
                  return result
              }
              else {
                  let code_lang_name_start_pos = start_pos + 3
                  let lang_name = text.substring(code_lang_name_start_pos, code_lang_name_end_pos).trim()
                  lang_name = lang_name.toLowerCase()
                  let code_end_pos = text.indexOf(code_demarker, code_lang_name_end_pos + 1)
                  if(code_end_pos === -1) {
                      code_end_pos = text.length
                  }
                  let code = text.substring(code_lang_name_end_pos, code_end_pos).trim()
                  //probably only counts for JavaScript code, but *maybe* there's some in HTML or others???
                  code = Utils.insert_outs_after_logs(code)
                  result.push([lang_name, code])
                  if(code_end_pos === text.length) { return result }
                  else {
                      start_pos =  code_end_pos + 3 //code_end_pos is the beginning of the ``` delimiting the end of the code section
                  }
              }
          }
        }
        return result
    }

    // data is the name-value pair obj retured by text_to_data
    // OR the array that is normally in data.code
    //Returned is a string of all its code stippets strung together
    //with newline separators, provided they match the "lang" arg.
    static data_to_code(data, lang="all"){
        let result = ""
        let lang_code_arrays = (Array.isArray(data) ? data : data.code)
        for(let lang_code_array of lang_code_arrays){
            let lang_in_data = lang_code_array[0]
            if((lang === "all") || (lang_in_data === lang)){
                result += lang_code_array[1] + "\n"
            }
        }
        return result.trim()
    }

    //result is an array
    /*static add_code_to_result(result, lang_name, code){
        for(let arr of result){
            if(arr[0] === lang_name){
                arr.push(code)
                return result
            }
        }
        //no existing array in result for lang_name, so make one.
        result.push([lang_name, code])
        return result
    }*/

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

    static modify_pattern_maybe(pattern, responses){
        if(responses.length > 0){}
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
                    responses.push(bracket_word)
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
    // "?" is a shortcut for "?0" filling in with the last elt of responses
    // "?1" fills in with the 2nd to last elt of responses, etc. works thru "?9"
    static recursive_fill_in_pattern(pattern, responses){
        for(let i = 0; i < 10; i++){
            let pat = "?" + i
            let index_into_responses = responses.length - 1 - i
            pattern = pattern.replaceAll(pat, responses[index_into_responses])
        }
        let default_filler = Utils.last(responses)
        pattern = pattern.replaceAll("?", default_filler)
        return pattern
    }

    static recursive_default_clean_up_response(response){
        if(response.endsWith(".")){
            response = response.substring(0, response.length - 1)
        }
        return response
    }

    static recursive_make_assertion(prompt, response){
        let colon_index = prompt.indexOf(":")
        if(colon_index >= 0){
            prompt = prompt.substring(colon_index + 1).trim()
        }
        let assertion = prompt + " " + response + "."
        return assertion
    }

    //not now used
    //static recursive_number_clean_up_response(response){
    //     let data = OpenAI.text_to_data(response)
    //    return data.numbers[0]
    //}

    static recursive(pattern="[fire] is caused by",
                     responses=[], //but ultimately defaults to ["fire"]
                     times=3,
                     callback=OpenAI.recursive_default_callback,
                     clean_up_response_callback = OpenAI.recursive_default_clean_up_response,
                     assertions=[]){ //for the initial call, this is always [].
        if(times === 0){
            callback(assertions, responses)
        }
        else {
            pattern = this.modify_pattern_maybe(pattern, responses) //returns possibly modified pattern and possibly psuhes onto responses
            //if (responses.length === 0) { responses.push("fire")} //default first response but don't do before calling modify_pattern ...
            prompt = this.recursive_fill_in_pattern(pattern, responses)
            this.show_prompt(prompt)
            this.make_text(prompt,
                   function(envelope){
                        let prompt   = OpenAI.envelope_to_prompt(envelope)
                        let response = OpenAI.envelope_to_response(envelope)
                        response = clean_up_response_callback(response)
                        responses.push(response)
                        let assertion = OpenAI.recursive_make_assertion(prompt, response)
                        assertions.push(assertion)
                        times = times - 1
                        OpenAI.recursive(pattern, responses, times, callback, clean_up_response_callback, assertions)
                   }
                )
        }
        return "dont_print" //so that the 3 show_prompts will come out together.
    }

    static recursive_default_callback(assertions, responses){
        inspect({assertions: assertions, responses: responses})
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
                        function(envelope){
                            let prompt = OpenAI.envelope_to_prompt(envelope)
                            let response = OpenAI.envelope_to_response(envelope)
                            let data = OpenAI.text_to_data(prompt, response)
                            let angles = data.numbers.slice(0, 5)
                            out("Computed angles to move Dexter to: " + angles)
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
        })
        Job.my_job.start()
    }

} //end of class OpenAI