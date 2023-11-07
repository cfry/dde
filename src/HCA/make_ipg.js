/*
ready.js has view_js_id.onclick = function (event) {
           change_code_view_kind("JS")
change_code_view_kind is in blocks_ide init.
  it cals HCA_to_js
HCA_to_js is in HCA_ui.js
calls: new_json_str = HCAObjDef.json_string_of_defs_in_files(selected_files)
calls: json_obj_of_defs_in_files(files_array=ipg_to_json.loaded_files)


 */

globalThis.Make_ipg = class Make_ipg{
    static make_ipg_string(files_array=ipg_to_json.loaded_files){
        let result = ""
        result += this.top_text(files_array)
        return result
    }

    static top_text(files_array){
        let result = "VIVA 3.03 Implementation Independent Algorithm Description Language"
        return result
    }
}