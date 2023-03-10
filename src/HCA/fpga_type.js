globalThis.FPGAType = class FPGAType {
    static current_fpga_type = "Xilinx" //also possible: "Intel"

    static possible_fpga_types = [
        "Xilinx",
        "Intel"
    ]

    static is_valid_fpga_type(str){
        return this.possible_fpga_types.includes(str)
    }

    static set_current_fpga_type(str){
        if(this.is_valid_fpga_type(str)) {
            current_fpga_type_id.value = str
            this.current_fpga_type = str
        }
        else {
            warning('FPGAType.is_valid_fpga_type passed invalid new vzlue of: "' + str + '".<br/>' +
                     'current_fpga_type not changed from: "' +
                      this.current_fpga_type + '".')
        }
    }

    static onchange(event){
        let select_dom_elt = event.target
        FPGAType.current_fpga_type = select_dom_elt.value
    }

    static pallette_html() {
        let result_html = '<b style="margin-top:5px;" title="The type of FPGA chip to compile for.">FPGA Type:</b> ' +
                          '<select id="current_fpga_type_id" value="' + FPGAType.current_fpga_type + '" onchange="FPGAType.onchange(event)">'
        for (let opt of this.possible_fpga_types){
            result_html += '<option>' + opt + '</option>'
        }
        result_html += '</select>'
        return result_html
    }
}