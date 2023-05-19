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
        if(!this.openai) {
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
        out("<div style='background:#bcfbe0;'>OpenAI passed prompt: " + prompt + "</div>")
        let response = await this.openai.createCompletion({
            model: "text-davinci-003", //"text-davinci-003" //gpt-3.5-turbo errors, maybe because I haven't paid, or because it streams the result
            prompt: prompt
        })
        let result_text = response.data.choices[0].text
        //result_text = result_text.replaceAll("\n", "<br/>")
        out("<pre style='display:inline;margin:0px;'>" + result_text + "</pre>")
    }

    static show_config(){
        let org = DDE_DB.persistent_get("gpt_org") //if this has never been set, the result is undefined
        if(!org) { org = "" }
        let key = DDE_DB.persistent_get("gpt_key") //if this has never been set, the result is undefined
        if(!key) { key = "" }
        show_window({title: "GPT Configuration",
            content: 'organization: <input name="org" style="margin:5px;width:275px;" value="' + org + '"/><br>' +
                     'apiKey:       <input name="key" style="margin:5px;width:400px;" value="' + key + '"/><br/>' +
                     '<input type="submit" value="Update Configuration" style="margin:5px;"></input>',
                      width:  500,
                      height: 200
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
        }
    }
}