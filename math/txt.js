//txt class
//James Wigglesworth
//Started: 5_16_17
//Updated: 5_1_19


/*
debugger
var my_string = 
`BAYMF`

var points = txt.string_to_lines(my_string)
Vector.max(txt.a())[0]
var dd = txt.a_max()
points[1]

debugger
Vector.add(txt.a(), [3, 0, 100])


clear_output()
var file_path = choose_file()
var content = file_content(file_path)
var entities = DXF.content_to_entities(content)
var points = DXF.entities_to_points(entities)
var noprint = out(points)

Vector.max(Vector.transpose(Vector.pull(txt.vertical_bar(), [0, txt.vertical_bar().length-1], [0,0])))

txt.string_to_lines("#%()@[]_{}~^><|\\\`\n")
txt.string_to_lines("Hello\nWorld!\b\b\b\b\b\b______", undefined, undefined, true)
*/

var txt = new function(){
	this.string_to_lines = function(string = "Hello World", horizontal_spacing = 0.15, vertical_spacing = 0.15, fixed_width = false){
    	let lines = []
        let spacing = horizontal_spacing
        let vert_spacing = 1 + vertical_spacing
        let max_width = 0
        let line_num = 0
        let width = 0
        
        for(let i = 0; i < string.length; i++){
        	switch(string[i]){
            	case "a":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.a()))
                    width = txt.a_max()+spacing
                	break
                case "b":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.b()))
                    width = txt.b_max()+spacing
                	break
                case "c":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.c()))
                    width = txt.c_max()+spacing
                	break
                case "d":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.d()))
                    width = txt.d_max()+spacing
                	break
                case "e":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.e()))
                    width = txt.e_max()+spacing
                	break
                case "f":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.f()))
                    width = txt.f_max()+spacing
                	break
                case "g":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.g()))
                    width = txt.g_max()+spacing
                	break
                case "h":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.h()))
                    width = txt.h_max()+spacing
                	break
                case "i":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.i()))
                    width = txt.i_max()+spacing
                	break
                case "j":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.j()))
                    width = txt.j_max()+spacing
                	break
                case "k":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.k()))
                    width = txt.k_max()+spacing
                	break
                case "l":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.l()))
                    width = txt.l_max()+spacing
                	break
                case "m":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.m()))
                    width = txt.m_max()+spacing
                	break
                case "n":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.n()))
                    width = txt.n_max()+spacing
                	break
                case "o":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.o()))
                    width = txt.o_max()+spacing
                	break
                case "p":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.p()))
                    width = txt.p_max()+spacing
                	break
                case "q":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.q()))
                    width = txt.q_max()+spacing
                	break
                case "r":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.r()))
                    width = txt.r_max()+spacing
                	break
                case "s":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.s()))
                    width = txt.s_max()+spacing
                	break
                case "t":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.t()))
                    width = txt.t_max()+spacing
                	break
                case "u":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.u()))
                    width = txt.u_max()+spacing
                	break
                case "v":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.v()))
                    width = txt.v_max()+spacing
                	break
                case "w":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.w()))
                    width = txt.w_max()+spacing
                	break
                case "x":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.x()))
                    width = txt.x_max()+spacing
                	break
                case "y":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.y()))
                    width = txt.y_max()+spacing
                	break
                case "z":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.z()))
                    width = txt.z_max()+spacing
                	break
                
                //Capital Letters
                case "A":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.A()))
                    width = txt.A_max()+spacing
                	break
                    
               case "B":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.B()))
                    width = txt.V_max()+spacing
                	break
                    
               case "C":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.C()))
                    width = txt.C_max()+spacing
                	break
                    
               case "D":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.D()))
                    width = txt.D_max()+spacing
                	break
                    
               case "E":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.E()))
                    width = txt.E_max()+spacing
                	break
                    
               case "F":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.F()))
                    width = txt.F_max()+spacing
                	break
                    
               case "G":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.G()))
                    width = txt.G_max()+spacing
                	break
                    
               case "H":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.H()))
                    width = txt.H_max()+spacing
                	break
                    
               case "I":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.I()))
                    width = txt.I_max()+spacing
                	break
                    
               case "J":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.J()))
                    width = txt.J_max()+spacing
                	break
                    
               case "K":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.K()))
                    width = txt.K_max()+spacing
                	break
                    
               case "L":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.L()))
                    width = txt.L_max()+spacing
                	break
                    
               case "M":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.M()))
                    width = txt.M_max()+spacing
                	break
                    
               case "N":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.N()))
                    width = txt.N_max()+spacing
                	break
                    
               case "O":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.O()))
                    width = txt.O_max()+spacing
                	break
                    
               case "P":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.P()))
                    width = txt.P_max()+spacing
                	break
                    
               case "Q":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.Q()))
                    width = txt.Q_max()+spacing
                	break
                    
               case "R":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.R()))
                    width = txt.R_max()+spacing
                	break
                    
               case "S":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.S()))
                    width = txt.S_max()+spacing
                	break
                    
               case "T":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.T()))
                    width = txt.T_max()+spacing
                	break
                    
               case "U":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.U()))
                    width = txt.U_max()+spacing
                	break
                    
               case "V":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.V()))
                    width = txt.V_max()+spacing
                	break
                    
               case "W":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.W()))
                    width = txt.W_max()+spacing
                	break
                    
               case "X":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.X()))
                    width = txt.X_max()+spacing
                	break
                    
               case "Y":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.Y()))
                    width = txt.Y_max()+spacing
                	break
                    
               case "Z":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.Z()))
                    width = txt.Z_max()+spacing
                	break
                
                
                
                //Numbers
                case "0":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._0()))
                    width = txt._0_max()+spacing
                	break
                    
                case "1":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._1()))
                    width = txt._1_max()+spacing
                	break
                    
                case "2":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._2()))
                    width = txt._2_max()+spacing
                	break
                    
                case "3":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._3()))
                    width = txt._3_max()+spacing
                	break
                    
                case "4":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._4()))
                    width = txt._4_max()+spacing
                	break
                    
                case "5":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._5()))
                    width = txt._5_max()+spacing
                	break
                    
                case "6":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._6()))
                    width = txt._6_max()+spacing
                	break
                    
                case "7":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._7()))
                    width = txt._7_max()+spacing
                	break
                    
                case "8":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._8()))
                    width = txt._8_max()+spacing
                	break
                    
                case "9":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt._9()))
                    width = txt._9_max()+spacing
                	break
                
                
                
                
                //Symbols
                case ".":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.period()))
                    width = txt.exclamation_max()+spacing
                	break
                
                case ",":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.comma()))
                    width = txt.exclamation_max()+spacing
                	break
                
                case "!":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.exclamation()))
                    width = txt.exclamation_max()+spacing
                	break
                    
                case "'":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.single_quote()))
                    width = txt.single_quote_max()+spacing
                	break
                    
                case "-":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.minus()))
                    width = txt.minus_max()+spacing
                	break
                    
                case "+":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.plus()))
                    width = txt.plus_max()+spacing
                	break
                    
                case "=":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.equals()))
                    width = txt.equals_max()+spacing
                	break
                    
                case "?":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.question()))
                    width = txt.question_max()+spacing
                	break
                    
                case '"':
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.double_quote()))
                    width = txt.double_quote_max()+spacing
                	break
                    
                case "*":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.star()))
                    width = txt.star_max()+spacing
                	break
                    
                case "/":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.forward_slash()))
                    width = txt.forward_slash_max()+spacing
                	break
                    
                case "$":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.dollar()))
                    width = txt.dollar_max()+spacing
                	break
                    
                case ":":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.colon()))
                    width = txt.colon_max()+spacing
                	break
                    
                //New Caracters (4_23_19):
                case "#":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.hashtag()))
                    width = txt.hashtag_max()+spacing
                	break
                
                case "%":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.percent()))
                    width = txt.percent_max()+spacing
                	break
                    
                case "&":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.ampersand()))
                    width = txt.ampersand_max()+spacing
                	break
                    
                case "(":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.open_paren()))
                    width = txt.open_paren_max()+spacing
                	break
                    
                case ")":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.close_paren()))
                    width = txt.close_paren_max()+spacing
                	break
                    
                case "@":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.at_sign()))
                    width = txt.at_sign_max()+spacing
                	break
                    
                case "[":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.open_square_bracket()))
                    width = txt.open_square_bracket_max()+spacing
                	break
                    
                case "]":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.close_square_bracket()))
                    width = txt.close_square_bracket_max()+spacing
                	break
                    
                case "_":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.underscore()))
                    width = txt.underscore_max()+spacing
                	break
                    
                case "{":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.open_curly_brace()))
                    width = txt.open_curly_brace_max()+spacing
                	break
                    
                case "}":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.close_curly_brace()))
                    width = txt.close_curly_brace_max()+spacing
                	break
                    
                case "~":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.tilde()))
                    width = txt.tilde_max()+spacing
                	break
                    
                case "^":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.caret()))
                    width = txt.caret_max()+spacing
                	break
                    
                case ">":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.greater_than()))
                    width = txt.greater_than_max()+spacing
                	break
                    
                case "<":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.less_than()))
                    width = txt.less_than_max()+spacing
                	break
                    
                case "|":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.vertical_bar()))
                    width = txt.vertical_bar_max()+spacing
                	break
                    
                case "\\":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.backslash()))
                    width = txt.backslash_max()+spacing
                	break
                
                case "\`":
                	lines.push(Vector.add([max_width, -line_num*vert_spacing, 0], txt.backtick()))
                    width = txt.backtick_max()+spacing
                	break
                    
                //Special Characters
                case "\n":
                    line_num++
                    max_width = 0
                    width = 0
                	break
                    
                case " ":
                    width = 1+spacing
                	break
                
                case "\t":
                    width = 4*(1+spacing)
                	break
                
                case "\b":
                    width = -(1+spacing)
                	break
                
                default:
                	warning('The character "' + string[i] + '" is not supported by DXF.string_to_lines()<br>A space was used in its place.')
            		width = 1+spacing
            }
        }
        if(fixed_width){
        	if(fixed_width == true){
            	width = 1 + spacing
            }else{
            	width = fixed_width + spacing
            }
            
            //overwrite with special char cases if needed:
            if(string[i] == "\n"){
            	width = 0
            }else if(string[i] == "\t"){
            	width = 4*width
            }else if(string[i] == "\b"){
            	width = -width
            }
        }
        max_width += width
        
        let elt
        let result = []
        if(lines.length != 1){
        	for(let i = 0; i < lines.length; i++){
        		elt = lines[i]
                for(let j = 0; j < elt.length; j++){
                	result.push(elt[j])
                }
        	}
        }else{
        	result = lines[0]
        }
        return result
    }
    
    this.a_max = function(){return 0.5844795491948674}
	this.a = function(){
    	return [
                [0, 0.5013053841213804, 0],
                [0.0417183435327218, 0.5850920221709118, 0],
                [0.0417183435327218, 0.5850920221709118, 0],
                [0.0828585304459182, 0.6262322090841224, 0],
                [0.0828585304459182, 0.6262322090841224, 0],
                [0.1670515009790563, 0.6682908966985935, 0],
                [0.1670515009790563, 0.6682908966985935, 0],
                [0.3753608867560558, 0.6682908966985935, 0],
                [0.3753608867560558, 0.6682908966985935, 0],
                [0.45933040569534, 0.626605190917914, 0],
                [0.45933040569534, 0.626605190917914, 0],
                [0.5016471002539618, 0.5420222280966556, 0],
                [0.5016471002539618, 0.5420222280966556, 0],
                [0.5016471002539618, 0.2506877584206393, 0],
                [0.5016471002539618, 0.2506877584206393, 0],
                [0.5016471002539618, 0.3337084078802803, 0],
                [0.5016471002539618, 0.3337084078802803, 0],
                [0.459284487518886, 0.3760710206153703, 0],
                [0.459284487518886, 0.3760710206153703, 0],
                [0.3754941637237437, 0.4177083472079204, 0],
                [0.3754941637237437, 0.4177083472079204, 0],
                [0.1668075789816328, 0.4177083472079204, 0],
                [0.1668075789816328, 0.4177083472079204, 0],
                [0.0828154281047944, 0.3759183608023022, 0],
                [0.0828154281047944, 0.3759183608023022, 0],
                [0.0416341917307648, 0.3347371244282868, 0],
                [0.0416341917307648, 0.3347371244282868, 0],
                [0.0000177406168689, 0.2500630226771534, 0],
                [0.0000177406168689, 0.2500630226771534, 0],
                [0.0000177406168689, 0.1676235006995483, 0],
                [0.0000177406168689, 0.1676235006995483, 0],
                [0.042130747734717, 0.0835410848777798, 0],
                [0.042130747734717, 0.0835410848777798, 0],
                [0.125671885927801, -5.331529e-8, 0],
                [0.125671885927801, -5.331529e-8, 0],
                [0.3770155328828935, -5.331529e-8, 0],
                [0.3770155328828935, -5.331529e-8, 0],
                [0.458379743935069, 0.0813641577368856, 0],
                [0.458379743935069, 0.0813641577368856, 0],
                [0.5016471002539618, 0.2506877584206393, 0],
                [0.5016471002539618, 0.2506877584206393, 0],
                [0.5016471002539618, 0.1261776403560191, 0],
                [0.5016471002539618, 0.1261776403560191, 0],
                [0.5432772926963878, 0.0412022031831754, 0],
                [0.5432772926963878, 0.0412022031831754, 0],
                [0.5844795491948674, -5.33153042e-8, 0]
                ]
    }
    
    this.b_max = function(){return 0.6677685667166317}
	this.b = function(){
    	return [
                [0.0835750791019336, 1, 0],
                [0.0835750791019336, 0.2505979856938723, 0],
                [0.0835750791019336, 0.2505979856938723, 0],
                [0.0835750791019336, 0.4596499844835194, 0],
                [0.0835750791019336, 0.4596499844835194, 0],
                [0.1248576793608436, 0.5422846756756883, 0],
                [0.1248576793608436, 0.5422846756756883, 0],
                [0.2085348941799907, 0.6259618904948355, 0],
                [0.2085348941799907, 0.6259618904948355, 0],
                [0.2917268697551662, 0.6676587978472526, 0],
                [0.2917268697551662, 0.6676587978472526, 0],
                [0.4581027609523858, 0.6676587978472526, 0],
                [0.4581027609523858, 0.6676587978472526, 0],
                [0.5420374788506024, 0.62710802860272, 0],
                [0.5420374788506024, 0.62710802860272, 0],
                [0.6266513300668919, 0.5424941773864305, 0],
                [0.6266513300668919, 0.5424941773864305, 0],
                [0.6677685667166317, 0.4187784213453086, 0],
                [0.6677685667166317, 0.4187784213453086, 0],
                [0.6677685667166317, 0.2506041897267437, 0],
                [0.6677685667166317, 0.2506041897267437, 0],
                [0.6263828111332828, 0.1256631393115981, 0],
                [0.6263828111332828, 0.1256631393115981, 0],
                [0.5427430154034738, 0.0420233435817892, 0],
                [0.5427430154034738, 0.0420233435817892, 0],
                [0.4594742852456762, 0, 0],
                [0.4594742852456762, 0, 0],
                [0.2506132515645731, 0, 0],
                [0.2506132515645731, 0, 0],
                [0.1668314604312968, 0.041729686803734, 0],
                [0.1668314604312968, 0.041729686803734, 0],
                [0.1253614145051642, 0.1252822722218241, 0],
                [0.1253614145051642, 0.1252822722218241, 0],
                [0.0835750791019336, 0.2505979856938723, 0],
                [0.0835750791019336, 0.2505979856938723, 0],
                [0.0835750791019336, 0.1251235397716073, 0],
                [0.0835750791019336, 0.1251235397716073, 0],
                [0.0418569787381671, 0.0418569451360895, 0],
                [0.0418569787381671, 0.0418569451360895, 0],
                [0, 0, 0]
                ]
    }
    
    this.c_max = function(){return 0.6681574259470722}
	this.c = function(){
    	return [
                [0.6680185475726148, 0.5014703084891609, 0],
                [0.6276775908582977, 0.584717534436777, 0],
                [0.6276775908582977, 0.584717534436777, 0],
                [0.5848902072879127, 0.6262147969854936, 0],
                [0.5848902072879127, 0.6262147969854936, 0],
                [0.4595119347141577, 0.6680991306568274, 0],
                [0.4595119347141577, 0.6680991306568274, 0],
                [0.2513545247047091, 0.6680991306568274, 0],
                [0.2513545247047091, 0.6680991306568274, 0],
                [0.1253500952982449, 0.6262797123536075, 0],
                [0.1253500952982449, 0.6262797123536075, 0],
                [0.0835827858414717, 0.5845124028968343, 0],
                [0.0835827858414717, 0.5845124028968343, 0],
                [0.0417689954575735, 0.5011139548950326, 0],
                [0.0417689954575735, 0.5011139548950326, 0],
                [-8.04944875e-8, 0.3758117087137975, 0],
                [-8.04944875e-8, 0.3758117087137975, 0],
                [-8.04944875e-8, 0.2924874619681077, 0],
                [-8.04944875e-8, 0.2924874619681077, 0],
                [0.0417324696423407, 0.1670986619627399, 0],
                [0.0417324696423407, 0.1670986619627399, 0],
                [0.0836327976996927, 0.0833613174200423, 0],
                [0.0836327976996927, 0.0833613174200423, 0],
                [0.1247921330740667, 0.0422019820456683, 0],
                [0.1247921330740667, 0.0422019820456683, 0],
                [0.2500203289919227, -2.2048425e-9, 0],
                [0.2500203289919227, -2.2048425e-9, 0],
                [0.4579718297351861, -2.2048425e-9, 0],
                [0.4579718297351861, -2.2048425e-9, 0],
                [0.5845980007659364, 0.0414157000095941, 0],
                [0.5845980007659364, 0.0414157000095941, 0],
                [0.6264439945960305, 0.0832616938396882, 0],
                [0.6264439945960305, 0.0832616938396882, 0],
                [0.6681574259470722, 0.166711742157986, 0]
                ]
    }
    
    this.d_max = function(){return 0.6687340335045562}
	this.d = function(){
    	return [
                [0.5852238367106111, 0.4593830597531508, 0],
                [0.5429594546485533, 0.5434867448696821, 0],
                [0.5429594546485533, 0.5434867448696821, 0],
                [0.4601054872179447, 0.6263407123002906, 0],
                [0.4601054872179447, 0.6263407123002906, 0],
                [0.3757651443603436, 0.6683123397466773, 0],
                [0.3757651443603436, 0.6683123397466773, 0],
                [0.2090496834961186, 0.6683123397466773, 0],
                [0.2090496834961186, 0.6683123397466773, 0],
                [0.1269203844656772, 0.627708457928236, 0],
                [0.1269203844656772, 0.627708457928236, 0],
                [0.0415461713906922, 0.5423342448532509, 0],
                [0.0415461713906922, 0.5423342448532509, 0],
                [0, 0.4175710560257642, 0],
                [0, 0.4175710560257642, 0],
                [0, 0.2511104993343736, 0],
                [0, 0.2511104993343736, 0],
                [0.0418878851972409, 0.125086769528167, 0],
                [0.0418878851972409, 0.125086769528167, 0],
                [0.1246797394586565, 0.0422949152667513, 0],
                [0.1246797394586565, 0.0422949152667513, 0],
                [0.2090934341978823, 0, 0],
                [0.2090934341978823, 0, 0],
                [0.4178220116259013, 0, 0],
                [0.4178220116259013, 0, 0],
                [0.5013822395721946, 0.0417838586027699, 0],
                [0.5013822395721946, 0.0417838586027699, 0],
                [0.5431886441046458, 0.1253828986082794, 0],
                [0.5431886441046458, 0.1253828986082794, 0],
                [0.5849099555290423, 0.2506350585731241, 0],
                [0.5849099555290423, 0.2506350585731241, 0],
                [0.5849099555290423, 1.002458673958159, 0],
                [0.5849099555290423, 1.002458673958159, 0],
                [0.5849099555290423, 0.1261043822332795, 0],
                [0.5849099555290423, 0.1261043822332795, 0],
                [0.6270338536863278, 0.0417001798182355, 0],
                [0.6270338536863278, 0.0417001798182355, 0],
                [0.6687340335045562, 0, 0]
                ]
    }
    
    this.e_max = function(){return 0.6681505023968839}
	this.e = function(){
    	return [
                [0.0001140367142227, 0.3342305888374426, 0],
                [0.6681505023968839, 0.3342305888374426, 0],
                [0.6681505023968839, 0.3342305888374426, 0],
                [0.6681505023968839, 0.4169623498193858, 0],
                [0.6681505023968839, 0.4169623498193858, 0],
                [0.6265109355852873, 0.5425120455479373, 0],
                [0.6265109355852873, 0.5425120455479373, 0],
                [0.5432444043025555, 0.625778576830669, 0],
                [0.5432444043025555, 0.625778576830669, 0],
                [0.4602368862798301, 0.6682750485490488, 0],
                [0.4602368862798301, 0.6682750485490488, 0],
                [0.2095557884939296, 0.6682750485490488, 0],
                [0.2095557884939296, 0.6682750485490488, 0],
                [0.1267845770173608, 0.6279865756794579, 0],
                [0.1267845770173608, 0.6279865756794579, 0],
                [0.0403513165522398, 0.5415533152143368, 0],
                [0.0403513165522398, 0.5415533152143368, 0],
                [0, 0.4174574862373391, 0],
                [0, 0.4174574862373391, 0],
                [0, 0.2506091141623585, 0],
                [0, 0.2506091141623585, 0],
                [0.0424017777232564, 0.1235178410100843, 0],
                [0.0424017777232564, 0.1235178410100843, 0],
                [0.119807937144607, 0.0461116815887337, 0],
                [0.119807937144607, 0.0461116815887337, 0],
                [0.2068728572871166, 1.5489263e-9, 0],
                [0.2068728572871166, 1.5489263e-9, 0],
                [0.4586757629852798, 1.5489263e-9, 0],
                [0.4586757629852798, 1.5489263e-9, 0],
                [0.5429270486741018, 0.0419052431658145, 0],
                [0.5429270486741018, 0.0419052431658145, 0],
                [0.6678452429846616, 0.1668234374763742, 0]
                ]
    }
    
    this.f_max = function(){return 0.4995542111909117}
	this.f = function(){
    	return [
                [0.4940568551058107, 1.001484233218903, 0],
                [0.3695905876884638, 0.9594443346899197, 0],
                [0.3695905876884638, 0.9594443346899197, 0],
                [0.2882268917988355, 0.8780806388002915, 0],
                [0.2882268917988355, 0.8780806388002915, 0],
                [0.2458081036341468, 0.7509536886078934, 0],
                [0.2458081036341468, 0.7509536886078934, 0],
                [0.2458081036341539, 1.5489281e-9, 0],
                [0.4995542111909117, 0.5814229158122118, 0],
                [0, 0.5814229158122118, 0]
                ]
    }
    
    this.g_max = function(){return 0.5852999895271012}
	this.g = function(){
    	return [
                [0.5852753034184559, 0.3346367865900817, 0],
                [0.5426893629555707, 0.418865075158621, 0],
                [0.5426893629555707, 0.418865075158621, 0],
                [0.5031977844319045, 0.4583566536822872, 0],
                [0.5031977844319045, 0.4583566536822872, 0],
                [0.4167801597195365, 0.5010565675274848, 0],
                [0.4167801597195365, 0.5010565675274848, 0],
                [0.1678205357037257, 0.5010565675274848, 0],
                [0.1678205357037257, 0.5010565675274848, 0],
                [0.0836258314497514, 0.4592602840225056, 0],
                [0.0836258314497514, 0.4592602840225056, 0],
                [0.0421063700647366, 0.4177408226374908, 0],
                [0.0421063700647366, 0.4177408226374908, 0],
                [0, 0.3344461277731199, 0],
                [0, 0.3344461277731199, 0],
                [0, 0.1664173181933819, 0],
                [0, 0.1664173181933819, 0],
                [0.0429051121859914, 0.0828415522195485, 0],
                [0.0429051121859914, 0.0828415522195485, 0],
                [0.0851588763524731, 0.0405877880530667, 0],
                [0.0851588763524731, 0.0405877880530667, 0],
                [0.166725608478373, -0.0002775385317904, 0],
                [0.166725608478373, -0.0002775385317904, 0],
                [0.4146099667712804, -0.0002775385317904, 0],
                [0.4146099667712804, -0.0002775385317904, 0],
                [0.4999548689186213, 0.0399654727106054, 0],
                [0.4999548689186213, 0.0399654727106054, 0],
                [0.5439942926903996, 0.0840048964823836, 0],
                [0.5439942926903996, 0.0840048964823836, 0],
                [0.5852999895271012, 0.1670085664210177, 0],
                [0.5852999895271012, 0.1670085664210177, 0],
                [0.5852999895271012, 0.4996454452079036, 0],
                [0.5852999895271012, 0.4996454452079036, 0],
                [0.5852999895271012, -0.0837743231641497, 0],
                [0.5852999895271012, -0.0837743231641497, 0],
                [0.5430284146422651, -0.2102321807824126, 0],
                [0.5430284146422651, -0.2102321807824126, 0],
                [0.4607386070032291, -0.2925219884214485, 0],
                [0.4607386070032291, -0.2925219884214485, 0],
                [0.3760662127510557, -0.3351961462707038, 0],
                [0.3760662127510557, -0.3351961462707038, 0],
                [0.2093613580807982, -0.3351961462707038, 0],
                [0.2093613580807982, -0.3351961462707038, 0],
                [0.1254617948247301, -0.2921057711929649, 0],
                [0.1254617948247301, -0.2921057711929649, 0],
                [0.0420149656117701, -0.2086589419800049, 0],
                [0.0420149656117701, -0.2086589419800049, 0],
                [0.000191153496047, -0.1258274813344116, 0]
                ]
    }
    
    this.h_max = function(){return 0.5850044116069171}
	this.h = function(){
    	return [
                [0.0020705746691476, 1.000000001548924, 0],
                [0.0020705746691405, 1.5489263e-9, 0],
                [0.0020705746691405, 1.5489263e-9, 0],
                [0, 0.376174869704883, 0],
                [0, 0.376174869704883, 0],
                [0.0419390770322536, 0.4590481217656617, 0],
                [0.0419390770322536, 0.4590481217656617, 0],
                [0.1247501562211895, 0.5418592009545975, 0],
                [0.1247501562211895, 0.5418592009545975, 0],
                [0.2104901467826039, 0.5850431273099163, 0],
                [0.2104901467826039, 0.5850431273099163, 0],
                [0.3745042156119496, 0.5850431273099163, 0],
                [0.3745042156119496, 0.5850431273099163, 0],
                [0.460311163066848, 0.5421406108764586, 0],
                [0.460311163066848, 0.5421406108764586, 0],
                [0.5417687240027931, 0.4606830499405135, 0],
                [0.5417687240027931, 0.4606830499405135, 0],
                [0.5850044116069171, 0.3767833307587551, 0],
                [0.5850044116069171, 0.3767833307587551, 0],
                [0.58500441160691, 1.5489263e-9, 0]
                ]
    }
    
    this.i_max = function(){return 0.0837800650134284}
	this.i = function(){
    	return [
                [0.0414302810410732, 0.8770927383296225, 0],
                [0.0414302810410732, 0.7931759277937971, 0],
                [0.0414302810410732, 0.7931759277937971, 0],
                [0, 0.8346061850890933, 0],
                [0, 0.8346061850890933, 0],
                [0.0837800650134284, 0.8346061850890933, 0],
                [0.0837800650134284, 0.8346061850890933, 0],
                [0.0414302810410732, 0.8770927383296225, 0],
                [0.0421503289530279, 0.6793251888468462, 0],
                [0.0421503289530279, 0, 0]
                ] 
    }
    
    this.j_max = function(){return 0.4173861709172685}
	this.j = function(){
    	return [
                [0.3763626645157672, 0.6669350820100703, 0],
                [0.3763626645157672, 0.1247941417015284, 0],
                [0.3763626645157672, 0.1247941417015284, 0],
                [0.3339567360308707, 0, 0],
                [0.3339567360308707, 0, 0],
                [0.2931021000893282, -0.0828936783987473, 0],
                [0.2931021000893282, -0.0828936783987473, 0],
                [0.2517747457776096, -0.1242210327104658, 0],
                [0.2517747457776096, -0.1242210327104658, 0],
                [0.1668831189591345, -0.1663912042533013, 0],
                [0.1668831189591345, -0.1663912042533013, 0],
                [1e-16, -0.1663912042533013, 0],
                [0.3757186410799705, 0.8766963476290641, 0],
                [0.3757186410799705, 0.7948993501773743, 0],
                [0.3757186410799705, 0.7948993501773743, 0],
                [0.334623191820981, 0.8359947994363636, 0],
                [0.334623191820981, 0.8359947994363636, 0],
                [0.4173861709172685, 0.8359947994363636, 0],
                [0.4173861709172685, 0.8359947994363636, 0],
                [0.3757186410799705, 0.8766963476290641, 0]
                ]
    }
    
    this.k_max = function(){return 0.581830493937673}
	this.k = function(){
    	return [
                [0, 1.000000001548924, 0],
                [0, 1.5489263e-9, 0],
                [0.5803999061942023, 0.5848617749492462, 0],
                [0, 0.2948392258441448, 0],
                [0, 0.2948392258441448, 0],
                [0.1619926802914335, 0.3757860515984017, 0],
                [0.1619926802914335, 0.3757860515984017, 0],
                [0.581830493937673, 1.5489281e-9, 0]
                ]
    }
    
    this.l_max = function(){return 0.2092599385287457}
	this.l = function(){
    	return [
                [0, 1.000000001548926, 0],
                [0, 0.2496943636310505, 0],
                [0, 0.2496943636310505, 0],
                [0.041910677084303, 0.1260163362715048, 0],
                [0.041910677084303, 0.1260163362715048, 0],
                [0.125510386086205, 0.0424166272696027, 0],
                [0.125510386086205, 0.0424166272696027, 0],
                [0.2092599385287457, 1.5489281e-9, 0]
                ]
    }
    
    this.m_max = function(){return 0.7505380961145534}
	this.m = function(){
    	return [
                [0, 0.6628787039858537, 0],
                [0, 1.5489281e-9, 0],
                [0, 1.5489281e-9, 0],
                [0, 0.5030049855748331, 0],
                [0, 0.5030049855748331, 0],
                [0.0403952121676525, 0.5848499977523433, 0],
                [0.0403952121676525, 0.5848499977523433, 0],
                [0.082154596978711, 0.6266093825634016, 0],
                [0.082154596978711, 0.6266093825634016, 0],
                [0.1657226533922937, 0.6683958677648008, 0],
                [0.1657226533922937, 0.6683958677648008, 0],
                [0.2075675736739413, 0.6683958677648008, 0],
                [0.2075675736739413, 0.6683958677648008, 0],
                [0.2907195629146315, 0.6270412703226214, 0],
                [0.2907195629146315, 0.6270412703226214, 0],
                [0.3327717402811032, 0.5849890929561427, 0],
                [0.3327717402811032, 0.5849890929561427, 0],
                [0.3745494370675999, 0.501337647454136, 0],
                [0.3745494370675999, 0.501337647454136, 0],
                [0.3745494370675999, 1.5489263e-9, 0],
                [0.3745494370675999, 1.5489263e-9, 0],
                [0.3745494370675999, 0.501337647454136, 0],
                [0.3745494370675999, 0.501337647454136, 0],
                [0.4163430189817348, 0.584697964846896, 0],
                [0.4163430189817348, 0.584697964846896, 0],
                [0.4584194490448113, 0.6267743949099654, 0],
                [0.4584194490448113, 0.6267743949099654, 0],
                [0.5416169372275021, 0.6683854906542451, 0],
                [0.5416169372275021, 0.6683854906542451, 0],
                [0.5836246110571893, 0.6683854906542451, 0],
                [0.5836246110571893, 0.6683854906542451, 0],
                [0.6667241696247004, 0.6273256525666682, 0],
                [0.6667241696247004, 0.6273256525666682, 0],
                [0.7080935425440913, 0.5859562796472773, 0],
                [0.7080935425440913, 0.5859562796472773, 0],
                [0.7505380961145534, 0.5011585187600219, 0],
                [0.7505380961145534, 0.5011585187600219, 0],
                [0.7505380961145393, 1.5489245e-9, 0]
                ]
    }
    
    this.n_max = function(){return 0.5849347225037889}
	this.n = function(){
    	return [
                [0, 0.6683622656925224, 0],
                [0, 1.5489263e-9, 0],
                [0, 1.5489263e-9, 0],
                [0, 0.4177489512711361, 0],
                [0, 0.4177489512711361, 0],
                [0.0417415881632053, 0.543133025020893, 0],
                [0.0417415881632053, 0.543133025020893, 0],
                [0.1252290535962288, 0.6266204904539096, 0],
                [0.1252290535962288, 0.6266204904539096, 0],
                [0.2093696596040786, 0.6687150050934179, 0],
                [0.2093696596040786, 0.6687150050934179, 0],
                [0.3759980528759002, 0.6687150050934179, 0],
                [0.3759980528759002, 0.6687150050934179, 0],
                [0.4590281408014221, 0.6265430866579039, 0],
                [0.4590281408014221, 0.6265430866579039, 0],
                [0.5423552120430486, 0.5432160154162702, 0],
                [0.5423552120430486, 0.5432160154162702, 0],
                [0.5849347225037889, 0.4176188255990781, 0],
                [0.5849347225037889, 0.4176188255990781, 0],
                [0.5849347225037889, 1.5489263e-9, 0]
                ]
    }
    
    this.o_max = function(){return 0.5846858952672278}
	this.o = function(){
    	return [
                [0.209501173209361, 1.5489245e-9, 0],
                [0.1253300627583087, 0.0417631755808259, 0],
                [0.1253300627583087, 0.0417631755808259, 0],
                [0.0417176379671389, 0.1253756003719886, 0],
                [0.0417176379671389, 0.1253756003719886, 0],
                [0, 0.2504205966539246, 0],
                [0, 0.2504205966539246, 0],
                [0, 0.4178196144525402, 0],
                [0, 0.4178196144525402, 0],
                [0.041755788137209, 0.5430621971234473, 0],
                [0.041755788137209, 0.5430621971234473, 0],
                [0.1252656744793086, 0.6265720834655469, 0],
                [0.1252656744793086, 0.6265720834655469, 0],
                [0.208819574457749, 0.6683919145798285, 0],
                [0.208819574457749, 0.6683919145798285, 0],
                [0.3759062991977942, 0.6683919145798285, 0],
                [0.3759062991977942, 0.6683919145798285, 0],
                [0.4593573617368918, 0.6266993198223929, 0],
                [0.4593573617368918, 0.6266993198223929, 0],
                [0.543055676533399, 0.5430010050258858, 0],
                [0.543055676533399, 0.5430010050258858, 0],
                [0.5846858952672278, 0.4175545863432575, 0],
                [0.5846858952672278, 0.4175545863432575, 0],
                [0.5846858952672278, 0.2524338384598082, 0],
                [0.5846858952672278, 0.2524338384598082, 0],
                [0.5436147643375762, 0.126332179279288, 0],
                [0.5436147643375762, 0.126332179279288, 0],
                [0.4603405354412474, 0.0430579503829662, 0],
                [0.4603405354412474, 0.0430579503829662, 0],
                [0.3762554000968805, 1.5489263e-9, 0],
                [0.3762554000968805, 1.5489263e-9, 0],
                [0.209501173209361, 1.5489245e-9, 0]
                ]
    }
    
    this.p_max = function(){return 0.585117792937723}
	this.p = function(){
    	return [
                [0, 0.6678369023321978, 0],
                [0, -0.1661134930088934, 0],
                [0, -0.1661134930088934, 0],
                [0, 0.4182602283121355, 0],
                [0, 0.4182602283121355, 0],
                [0.0420793290830943, 0.543121658065175, 0],
                [0.0420793290830943, 0.543121658065175, 0],
                [0.1254880101613196, 0.6266194309937845, 0],
                [0.1254880101613196, 0.6266194309937845, 0],
                [0.2092038476000937, 0.6684310330905419, 0],
                [0.2092038476000937, 0.6684310330905419, 0],
                [0.3760603143003323, 0.6684310330905419, 0],
                [0.3760603143003323, 0.6684310330905419, 0],
                [0.4596677950144681, 0.6266397734247989, 0],
                [0.4596677950144681, 0.6266397734247989, 0],
                [0.5433574555818268, 0.5429501128574401, 0],
                [0.5433574555818268, 0.5429501128574401, 0],
                [0.585117792937723, 0.4178258721131556, 0],
                [0.585117792937723, 0.4178258721131556, 0],
                [0.585117792937723, 0.3353332788221195, 0],
                [0.585117792937723, 0.3353332788221195, 0],
                [0.5434815030432106, 0.2091360019800561, 0],
                [0.5434815030432106, 0.2091360019800561, 0],
                [0.4599295194521176, 0.1255840183889703, 0],
                [0.4599295194521176, 0.1255840183889703, 0],
                [0.3760091943939585, 0.0835989070285877, 0],
                [0.3760091943939585, 0.0835989070285877, 0],
                [0.2091791614914484, 0.0835989070285877, 0],
                [0.2091791614914484, 0.0835989070285877, 0],
                [0.1256221453002695, 0.1248776527340993, 0],
                [0.1256221453002695, 0.1248776527340993, 0],
                [0.0415095396329122, 0.2089902584014567, 0],
                [0.0415095396329122, 0.2089902584014567, 0],
                [0, 0.3351887404965197, 0]
                ]
    }
    
    this.q_max = function(){return 0.584677156821698}
	this.q = function(){
    	return [
                [0.584677156821698, 0.4176739215657222, 0],
                [0.5428385719130518, 0.5433485544110539, 0],
                [0.5428385719130518, 0.5433485544110539, 0],
                [0.4597230924075149, 0.6264640339165908, 0],
                [0.4597230924075149, 0.6264640339165908, 0],
                [0.3750414115511091, 0.668312684615387, 0],
                [0.3750414115511091, 0.668312684615387, 0],
                [0.2084245967196239, 0.668312684615387, 0],
                [0.2084245967196239, 0.668312684615387, 0],
                [0.1251817276453551, 0.6263777102042525, 0],
                [0.1251817276453551, 0.6263777102042525, 0],
                [0.0422577126317805, 0.5434536951906779, 0],
                [0.0422577126317805, 0.5434536951906779, 0],
                [0, 0.4175180178333165, 0],
                [0, 0.4175180178333165, 0],
                [0, 0.3343831143420886, 0],
                [0, 0.3343831143420886, 0],
                [0.0413217058553244, 0.2096056074117172, 0],
                [0.0413217058553244, 0.2096056074117172, 0],
                [0.125182164567633, 0.125475571961374, 0],
                [0.125182164567633, 0.125475571961374, 0],
                [0.2087944514268258, 0.0837008662577148, 0],
                [0.2087944514268258, 0.0837008662577148, 0],
                [0.3755781705680192, 0.0837008662577148, 0],
                [0.3755781705680192, 0.0837008662577148, 0],
                [0.459144362127006, 0.1252710769970093, 0],
                [0.459144362127006, 0.1252710769970093, 0],
                [0.5428890364360086, 0.2089660973842058, 0],
                [0.5428890364360086, 0.2089660973842058, 0],
                [0.5846529076353307, 0.3342579301512529, 0],
                [0.5846529076353307, 0.3342579301512529, 0],
                [0.5846529076353307, 0.668388371636027, 0],
                [0.5846529076353307, 0.668388371636027, 0],
                [0.5846529076353307, -0.1667297780746963, 0]
                ]
    }
    
    this.r_max = function(){return 0.3337175210844236}
	this.r = function(){
    	return [
                [0.3337175210844236, 0.6679443810975983, 0],
                [0.2502487631931274, 0.6679443810975983, 0],
                [0.2502487631931274, 0.6679443810975983, 0],
                [0.1255142254979091, 0.6269315694395914, 0],
                [0.1255142254979091, 0.6269315694395914, 0],
                [0.0414296596391921, 0.5428470035808745, 0],
                [0.0414296596391921, 0.5428470035808745, 0],
                [0, 0.4175196665426597, 0],
                [0, 0.4175196665426597, 0],
                [0, 0.6680673416218923, 0],
                [0, 0.6680673416218923, 0],
                [0, 0, 0]
                ]
    }
    
    this.s_max = function(){return 0.5016464135127876}
	this.s = function(){
    	return [
                [0.501140894438663, 0.543091598936698, 0],
                [0.4593807370787033, 0.6266214914932249, 0],
                [0.4593807370787033, 0.6266214914932249, 0],
                [0.3340458681753375, 0.6684081391098289, 0],
                [0.3340458681753375, 0.6684081391098289, 0],
                [0.1670141956421389, 0.6684081391098289, 0],
                [0.1670141956421389, 0.6684081391098289, 0],
                [0.0417339420233702, 0.6266249505300721, 0],
                [0.0417339420233702, 0.6266249505300721, 0],
                [0, 0.5430038052870714, 0],
                [0, 0.5430038052870714, 0],
                [0, 0.4595935789340189, 0],
                [0, 0.4595935789340189, 0],
                [0.0418285356962827, 0.3756939812244298, 0],
                [0.0418285356962827, 0.3756939812244298, 0],
                [0.16758765613028, 0.3334481052867062, 0],
                [0.16758765613028, 0.3334481052867062, 0],
                [0.3344803873795001, 0.3334481052867062, 0],
                [0.3344803873795001, 0.3334481052867062, 0],
                [0.4594333862130498, 0.2924147041236296, 0],
                [0.4594333862130498, 0.2924147041236296, 0],
                [0.5016464135127876, 0.2085702039296109, 0],
                [0.5016464135127876, 0.2085702039296109, 0],
                [0.5016464135127876, 0.1261066006617284, 0],
                [0.5016464135127876, 0.1261066006617284, 0],
                [0.4593680663326723, 0.0418970073637866, 0],
                [0.4593680663326723, 0.0418970073637866, 0],
                [0.3337928901771647, 1.5489263e-9, 0],
                [0.3337928901771647, 1.5489263e-9, 0],
                [0.1663140276937725, 1.5489263e-9, 0],
                [0.1663140276937725, 1.5489263e-9, 0],
                [0.0410475371267296, 0.0421818013979305, 0],
                [0.0410475371267296, 0.0421818013979305, 0],
                [0.0005446236178841, 0.1238298131909232, 0]
                ]
    }
    
    this.t_max = function(){return 0.4998969767169683}
	this.t = function(){
    	return [
                [0.2490382700256077, 0.8354348162987292, 0],
                [0.2490382700256077, 0.1673607213191701, 0],
                [0.2490382700256077, 0.1673607213191701, 0],
                [0.290913556405485, 0.0834070143902608, 0],
                [0.290913556405485, 0.0834070143902608, 0],
                [0.3322386976403777, 0.042081873155361, 0],
                [0.3322386976403777, 0.042081873155361, 0],
                [0.4151801251816778, 1.5489263e-9, 0],
                [0, 0.5853535346883662, 0],
                [0.4998969767169683, 0.5853535346883662, 0]
                ]
    }
    
    this.u_max = function(){return 0.5848340119190425}
	this.u = function(){
    	return [
                [0, 0.6684991447222473, 0],
                [0, 0.2523584808712656, 0],
                [0, 0.2523584808712656, 0],
                [0.0416791082776626, 0.1257827689259727, 0],
                [0.0416791082776626, 0.1257827689259727, 0],
                [0.1253140901990264, 0.042147787004609, 0],
                [0.1253140901990264, 0.042147787004609, 0],
                [0.2094646901992689, 0, 0],
                [0.2094646901992689, 0, 0],
                [0.3743534774265242, 0, 0],
                [0.3743534774265242, 0, 0],
                [0.4594390662026342, 0.042250735060918, 0],
                [0.4594390662026342, 0.042250735060918, 0],
                [0.543367148548569, 0.1261788174068528, 0],
                [0.543367148548569, 0.1261788174068528, 0],
                [0.5848340119190425, 0.2509088149981835, 0],
                [0.5848340119190425, 0.2509088149981835, 0],
                [0.5848340119190425, 0.6704821611347, 0],
                [0.5848340119190425, 0.6704821611347, 0],
                [0.5848340119190425, 0.0000959486425671, 0]
                ]
    }
    
    this.v_max = function(){return 0.6685133663476677}
	this.v = function(){
    	return [
                [0, 0.6685777142735958, 0],
                [0.3351473492348305, 1.5489263e-9, 0],
                [0.3351473492348305, 1.5489263e-9, 0],
                [0.6685133663476677, 0.66816477115988, 0]
                ]
    }
    
    this.w_max = function(){return 0.7528247288495038}
	this.w = function(){
    	return [
                [0, 0.669060167556438, 0],
                [0.1676608406116031, 1.5489263e-9, 0],
                [0.1676608406116031, 1.5489263e-9, 0],
                [0.3769767587756405, 0.668400891604037, 0],
                [0.3769767587756405, 0.668400891604037, 0],
                [0.5858828438441606, 0.0003292673651032, 0],
                [0.5858828438441606, 0.0003292673651032, 0],
                [0.7528247288495038, 0.6685053215737611, 0]
                ]
    }
    
    this.x_max = function(){return 0.6691180667785944}
	this.x = function(){
    	return [
                [0.0000225014972557, 0.6683736310993283, 0],
                [0.6691180667785944, 1.5489263e-9, 0],
                [0.6684301326539526, 0.668430046343218, 0],
                [8.78596467e-8, 1.5489245e-9, 0]
                ]
    }
    
    this.y_max = function(){return 0.6685583693421507}
	this.y = function(){
    	return [
                [0.6685583693421507, 0.6689683368148849, 0],
                [0.2080138897795507, 0, 0],
                [0.2080138897795507, 0, 0],
                [0.0835513362015661, -0.1251365894477345, 0],
                [0.0835513362015661, -0.1251365894477345, 0],
                [0, -0.1669292491998249, 0],
                [0.0000349537821194, 0.6685591821700996, 0],
                [0.3286851303847982, 0.1752821773170421, 0]
                ]
    }
    
    this.z_max = function(){return 0.6688860610496477}
	this.z = function(){
    	return [
                [0.0001371935948669, 0.6684042682828704, 0],
                [0.6684043542396126, 0.6684042682828704, 0],
                [0.6684043542396126, 0.6684042682828704, 0],
                [8.75056827e-8, 1.5489281e-9, 0],
                [8.75056827e-8, 1.5489281e-9, 0],
                [0.6688860610496477, 1.5489281e-9, 0]
                ]
    }
    
    
    //Capital Letters
    this.A_max = function(){return 0.6704006815866707}
	this.A = function(){
    	return [
                [0, 0, 0],
                [0.3352600751822194, 1.003620764981164, 0],
                [0.3352600751822194, 1.003620764981164, 0],
                [0.6704006815866707, 0, 0],
                [0.1684521068546587, 0.4609508391083353, 0],
                [0.5022399724256275, 0.4609508391083353, 0]
                ]
    }
    
    this.B_max = function(){return 0.6682667281578177}
	this.B = function(){
    	return [
                [-1.811864649e-7, 1.002420750975531, 0],
                [-1.811864578e-7, -1.5086101e-9, 0],
                [-1.811864649e-7, 1.002420750975531, 0],
                [0.4594343703940922, 1.002420750975531, 0],
                [0.4594343703940922, 1.002420750975531, 0],
                [0.5429703284415553, 0.9606542922506378, 0],
                [0.5429703284415553, 0.9606542922506378, 0],
                [0.6264991209408564, 0.8771254997513366, 0],
                [0.6264991209408564, 0.8771254997513366, 0],
                [0.6682667281578177, 0.7935879282028396, 0],
                [0.6682667281578177, 0.7935879282028396, 0],
                [0.6682667281578177, 0.7100566863888959, 0],
                [0.6682667281578177, 0.7100566863888959, 0],
                [0.6265030093781548, 0.6265206822414342, 0],
                [0.6265030093781548, 0.6265206822414342, 0],
                [0.5429700348043909, 0.5429881406070863, 0],
                [0.5429700348043909, 0.5429881406070863, 0],
                [0.4594334964978942, 0.501221835214892, 0],
                [0.4594334964978942, 0.501221835214892, 0],
                [-1.811864649e-7, 0.501221835214892, 0],
                [-1.811864649e-7, 0.501221835214892, 0],
                [0.4594334964978942, 0.501221835214892, 0],
                [0.4594334964978942, 0.501221835214892, 0],
                [0.5429657404863804, 0.4594547591504466, 0],
                [0.5429657404863804, 0.4594547591504466, 0],
                [0.6264744393857029, 0.375946060251124, 0],
                [0.6264744393857029, 0.375946060251124, 0],
                [0.6682667281578177, 0.292388659676746, 0],
                [0.6682667281578177, 0.292388659676746, 0],
                [0.6682667281578177, 0.2088509798934126, 0],
                [0.6682667281578177, 0.2088509798934126, 0],
                [0.6265091266516833, 0.125339757518546, 0],
                [0.6265091266516833, 0.125339757518546, 0],
                [0.5429584165946792, 0.0417890474615419, 0],
                [0.5429584165946792, 0.0417890474615419, 0],
                [0.4570063737391479, -1.5086119e-9, 0],
                [0.4594337149719366, 0.0012138250115186, 0],
                [-1.811864649e-7, 0.0012134748279387, 0],
                [0.4570063737391479, -1.5086119e-9, 0],
                [-1.811864578e-7, -1.5086137e-9, 0]
                ]
    }

    this.C_max = function(){return 0.6688626609616222}
	this.C = function(){
    	return points = [
                          [0.6682814896378205, 0.6682895598691232, 0],
                          [0.6265096329805147, 0.7936029914735343, 0],
                          [0.6265096329805147, 0.7936029914735343, 0],
                          [0.5848263613283962, 0.8771138461158614, 0],
                          [0.5848263613283962, 0.8771138461158614, 0],
                          [0.5013001025561721, 0.9606401048880854, 0],
                          [0.5013001025561721, 0.9606401048880854, 0],
                          [0.4174449935442297, 1.002428270470772, 0],
                          [0.4174449935442297, 1.002428270470772, 0],
                          [0.2505642652604365, 1.002428270470772, 0],
                          [0.2505642652604365, 1.002428270470772, 0],
                          [0.1670218941426356, 0.9606600629888646, 0],
                          [0.1670218941426356, 0.9606600629888646, 0],
                          [0.0835640814391354, 0.8771133549737726, 0],
                          [0.0835640814391354, 0.8771133549737726, 0],
                          [0.040670148046047, 0.7926609809391323, 0],
                          [0.040670148046047, 0.7926609809391323, 0],
                          [2.351684998e-7, 0.6682679496170465, 0],
                          [2.351684998e-7, 0.6682679496170465, 0],
                          [2.351684998e-7, 0.3345034997566074, 0],
                          [2.351684998e-7, 0.3345034997566074, 0],
                          [0.0416405565147216, 0.2089774036259371, 0],
                          [0.0416405565147216, 0.2089774036259371, 0],
                          [0.0837090387208264, 0.125013224831747, 0],
                          [0.0837090387208264, 0.125013224831747, 0],
                          [0.167021145995335, 0.0417011175572384, 0],
                          [0.167021145995335, 0.0417011175572384, 0],
                          [0.2526231955384901, -1.5086101e-9, 0],
                          [0.2526231955384901, -1.5086101e-9, 0],
                          [0.4155390737300877, -1.5086101e-9, 0],
                          [0.4155390737300877, -1.5086101e-9, 0],
                          [0.5012155381609773, 0.0417764274773447, 0],
                          [0.5012155381609773, 0.0417764274773447, 0],
                          [0.584766025964882, 0.1253269152812493, 0],
                          [0.584766025964882, 0.1253269152812493, 0],
                          [0.626477420251149, 0.2088290787138192, 0],
                          [0.626477420251149, 0.2088290787138192, 0],
                          [0.6688626609616222, 0.3339435977705705, 0]
                          ]
    }
    
    this.D_max = function(){return 0.6681683721944865}
	this.D = function(){
    	return [
                [-1.377225161e-7, 1.002428270470772, 0],
                [-1.377225161e-7, -1.5086101e-9, 0],
                [-1.377225161e-7, 1.002428270470772, 0],
                [0.4174862287618453, 1.002428270470772, 0],
                [0.4174862287618453, 1.002428270470772, 0],
                [0.5009547790418765, 0.9606900226565642, 0],
                [0.5009547790418765, 0.9606900226565642, 0],
                [0.5844307107020086, 0.8772140909964321, 0],
                [0.5844307107020086, 0.8772140909964321, 0],
                [0.6264018843253325, 0.793401132073285, 0],
                [0.6264018843253325, 0.793401132073285, 0],
                [0.6681683721944865, 0.6680764042007752, 0],
                [0.6681683721944865, 0.6680764042007752, 0],
                [0.6681683721944865, 0.3343163746191919, 0],
                [0.6681683721944865, 0.3343163746191919, 0],
                [0.6263320900786767, 0.2088693523654399, 0],
                [0.6263320900786767, 0.2088693523654399, 0],
                [0.5845401004653468, 0.1253226443503479, 0],
                [0.5845401004653468, 0.1253226443503479, 0],
                [0.5010375732497891, 0.0418201171347903, 0],
                [0.5010375732497891, 0.0418201171347903, 0],
                [0.4152004671821175, -1.5086101e-9, 0],
                [0.4152004671821175, -1.5086101e-9, 0],
                [-1.377225161e-7, -1.5086101e-9, 0]
                ]
    }
    
    this.E_max = function(){return 0.5844795491948674}
	this.E = function(){
    	return [
                [0.5842716826599031, 1.001898873733324, 0],
                [-1.161176328e-7, 1.001898873733324, 0],
                [-1.161176328e-7, 1.001898873733324, 0],
                [-1.161176328e-7, -6.45150067e-8, 0],
                [-1.161176328e-7, -6.45150067e-8, 0],
                [0.5842716826599031, -6.45150067e-8, 0],
                [-1.161176328e-7, 0.500949404609159, 0],
                [0.5842716826599031, 0.500949404609159, 0]
                ]
    }
    
    this.F_max = function(){return 0.5885762622268658}
	this.F = function(){
    	return [
                [0.5885762622268658, 1.002428270470772, 0],
                [3.75029003e-8, 1.002428270470772, 0],
                [3.75029003e-8, 1.002428270470772, 0],
                [3.75029003e-8, -1.5086101e-9, 0],
                [3.75029003e-8, 0.5012141344810815, 0],
                [0.5885762622268658, 0.5012141344810815, 0]
                ]
    }
    
    this.G_max = function(){return 0.6683106445256044}
	this.G = function(){
    	return [
                [0.6683106445256044, 0.6684747204381836, 0],
                [0.6266287150705239, 0.7935921863474676, 0],
                [0.6266287150705239, 0.7935921863474676, 0],
                [0.5849239682657981, 0.8771894819981582, 0],
                [0.5849239682657981, 0.8771894819981582, 0],
                [0.5013594809772428, 0.9607539692867135, 0],
                [0.5013594809772428, 0.9607539692867135, 0],
                [0.4167668105852869, 1.002428270470772, 0],
                [0.4167668105852869, 1.002428270470772, 0],
                [0.2510739266928113, 1.002428270470772, 0],
                [0.2510739266928113, 1.002428270470772, 0],
                [0.1671772155531244, 0.9606566249942432, 0],
                [0.1671772155531244, 0.9606566249942432, 0],
                [0.0836378653461338, 0.8771172747872527, 0],
                [0.0836378653461338, 0.8771172747872527, 0],
                [0.0415005945736766, 0.7913437378457218, 0],
                [0.0415005945736766, 0.7913437378457218, 0],
                [-1.382792334e-7, 0.6677124679098654, 0],
                [-1.382792334e-7, 0.6677124679098654, 0],
                [-1.382792334e-7, 0.3345334594242502, 0],
                [-1.382792334e-7, 0.3345334594242502, 0],
                [0.0417542698165789, 0.2090378141033682, 0],
                [0.0417542698165789, 0.2090378141033682, 0],
                [0.0837704063375213, 0.1255328531661632, 0],
                [0.0837704063375213, 0.1255328531661632, 0],
                [0.1670896473102914, 0.0422136121933932, 0],
                [0.1670896473102914, 0.0422136121933932, 0],
                [0.2517222078689656, -1.5086101e-9, 0],
                [0.2517222078689656, -1.5086101e-9, 0],
                [0.4170768581044513, -1.5086101e-9, 0],
                [0.4170768581044513, -1.5086101e-9, 0],
                [0.501243350851496, 0.0417661134933667, 0],
                [0.501243350851496, 0.0417661134933667, 0],
                [0.5842081402752229, 0.1247309029170935, 0],
                [0.5842081402752229, 0.1247309029170935, 0],
                [0.6263092721720795, 0.2084882261013092, 0],
                [0.6263092721720795, 0.2084882261013092, 0],
                [0.6680542848886191, 0.3332720300803356, 0],
                [0.3325036796505856, 0.5013518358823889, 0],
                [0.6680542848886262, 0.5013518358823889, 0],
                [0.6680542848886262, 0.5013518358823889, 0],
                [0.6680542848886333, -1.5086101e-9, 0]
                ]
    }
    
    this.H_max = function(){return 0.664923111926953}
	this.H = function(){
    	return [
                [0, 1, 0],
                [0, 0, 0],
                [0.664923111926953, 1.002428270470772, 0],
                [0.664923111926953, 0, 0],
                [0, 0.5012141344810815, 0],
                [0.664923111926953, 0.5012141344810815, 0]
                ]
    }
    
    this.I_max = function(){return 0.2520914706697113}
	this.I = function(){
    	return [
                [0.2520914706697113, 1.002428270470772, 0],
                [0.0014858324691431, 1.002428270470772, 0],
                [0.1267886515694343, 1.002428270470771, 0],
                [0.1267886515694343, -1.5086101e-9, 0],
                [2.03322088e-8, -1.5086101e-9, 0],
                [0.2520028856642966, -1.5086101e-9, 0]
                ]
    }
    
    this.J_max = function(){return 0.6682800047917681}
	this.J = function(){
    	return [
                [0.6682800047917681, 1.002428270470772, 0],
                [0.6682800047917681, 0.2091856478733405, 0],
                [0.6682800047917681, 0.2091856478733405, 0],
                [0.6265135169226143, 0.1253997536589679, 0],
                [0.6265135169226143, 0.1253997536589679, 0],
                [0.5428357191776172, 0.041721955913971, 0],
                [0.5428357191776172, 0.041721955913971, 0],
                [0.4587845201017445, -1.5086101e-9, 0],
                [0.4587845201017445, -1.5086101e-9, 0],
                [0.2088674289889241, -1.5086101e-9, 0],
                [0.2088674289889241, -1.5086101e-9, 0],
                [0.1252821075654538, 0.0417479412359683, 0],
                [0.1252821075654538, 0.0417479412359683, 0],
                [0.0419726049974827, 0.1250574438039393, 0],
                [0.0419726049974827, 0.1250574438039393, 0],
                [9.2519258e-8, 0.2089553022317148, 0],
                [9.2519258e-8, 0.2089553022317148, 0],
                [9.2519258e-8, 0.2924420909115213, 0]
                ]
    }
    
    this.K_max = function(){return 0.6736032151655423}
	this.K = function(){
    	return [
                [1.493841069e-7, 1.002428270470772, 0],
                [1.493841069e-7, -1.5086101e-9, 0],
                [0.6683189853711724, 1.002428270470771, 0],
                [1.493841069e-7, 0.5012141344810815, 0],
                [1.493841069e-7, 0.5012141344810815, 0],
                [0.6736032151655423, -1.5086101e-9, 0]
                ]
    }
    
    this.L_max = function(){return 0.6685877579551374}
	this.L = function(){
    	return [
                [-1.328541117e-7, 1.002428270470772, 0],
                [-1.328541117e-7, -1.5086101e-9, 0],
                [-1.328541117e-7, -1.5086101e-9, 0],
                [0.6685877579551374, -1.5086101e-9, 0]
                ]
    }
    
    this.M_max = function(){return 0.6657700496519965}
	this.M = function(){
    	return [
                [0, 0, 0],
                [0, 1, 0],
                [0, 1, 0],
                [0.328345580558846, 0, 0],
                [0.328345580558846, 0, 0],
                [0.6657700496519965, 1, 0],
                [0.6657700496519965, 1, 0],
                [0.6657700496519965, 0, 0]
                ]
    }
    
    this.N_max = function(){return 0.6683444664786009}
	this.N = function(){
    	return [
                [0, 0, 0],
                [0, 1, 0],
                [0, 1, 0],
                [0.6683444664786009, 0, 0],
                [0.6683444664786009, 0, 0],
                [0.6683444664786009, 1, 0]
                ]
    }
    
    this.O_max = function(){return 0.6682619960490115}
	this.O = function(){
    	return [
                [0.2506217892629365, -1.5086101e-9, 0],
                [0.1670618085056503, 0.0417896836090108, 0],
                [0.1670618085056503, 0.0417896836090108, 0],
                [0.0835447032776244, 0.1253067888370367, 0],
                [0.0835447032776244, 0.1253067888370367, 0],
                [0.0417573377289102, 0.2087827772978414, 0],
                [0.0417573377289102, 0.2087827772978414, 0],
                [1.768119944e-7, 0.3341508467944436, 0],
                [1.768119944e-7, 0.3341508467944436, 0],
                [1.768119944e-7, 0.6683898080103888, 0],
                [1.768119944e-7, 0.6683898080103888, 0],
                [0.0413132009279025, 0.7904744556665122, 0],
                [0.0413132009279025, 0.7904744556665122, 0],
                [0.084081849001052, 0.8780585121604929, 0],
                [0.084081849001052, 0.8780585121604929, 0],
                [0.1652059537211841, 0.959182616880625, 0],
                [0.1652059537211841, 0.959182616880625, 0],
                [0.2505007603461706, 1.002428270470772, 0],
                [0.2505007603461706, 1.002428270470772, 0],
                [0.4174459508618043, 1.002428270470772, 0],
                [0.4174459508618043, 1.002428270470772, 0],
                [0.5012755158849131, 0.9605878913001646, 0],
                [0.5012755158849131, 0.9605878913001646, 0],
                [0.58473116886384, 0.8771322383212378, 0],
                [0.58473116886384, 0.8771322383212378, 0],
                [0.6271034258034263, 0.7932427368953939, 0],
                [0.6271034258034263, 0.7932427368953939, 0],
                [0.6682619960490115, 0.6682711753804114, 0],
                [0.6682619960490115, 0.6682711753804114, 0],
                [0.6682619960490115, 0.3343872327020279, 0],
                [0.6682619960490115, 0.3343872327020279, 0],
                [0.6266411565112833, 0.2089791926427722, 0],
                [0.6266411565112833, 0.2089791926427722, 0],
                [0.5847380618102705, 0.1254287255093232, 0],
                [0.5847380618102705, 0.1254287255093232, 0],
                [0.5011776552061633, 0.041868318905216, 0],
                [0.5011776552061633, 0.041868318905216, 0],
                [0.4175051545376789, -1.5086101e-9, 0],
                [0.4175051545376789, -1.5086101e-9, 0],
                [0.2506217892629365, -1.5086101e-9, 0]
                ]
    }
    
    this.P_max = function(){return 0.6682710758300062}
	this.P = function(){
    	return [
                [0, 0.5010746315276294, 0],
                [0.459016229577145, 0.5010746315276294, 0],
                [0.459016229577145, 0.5010746315276294, 0],
                [0.5430535536252137, 0.5428801627808469, 0],
                [0.5430535536252137, 0.5428801627808469, 0],
                [0.6263469024981703, 0.6261735116537963, 0],
                [0.6263469024981703, 0.6261735116537963, 0],
                [0.6682710758300062, 0.7100618375843198, 0],
                [0.6682710758300062, 0.7100618375843198, 0],
                [0.6682710758300062, 0.7935884822624218, 0],
                [0.6682710758300062, 0.7935884822624218, 0],
                [0.6265185026518055, 0.8771045747119927, 0],
                [0.6265185026518055, 0.8771045747119927, 0],
                [0.5429681386229533, 0.960654938740845, 0],
                [0.5429681386229533, 0.960654938740845, 0],
                [0.4593461098376111, 1.002428270470772, 0],
                [0.4593461098376111, 1.002428270470772, 0],
                [0, 1.002428270470772, 0],
                [0, 1.002428270470772, 0],
                [0, 0, 0]
                ]
    }
    
    this.Q_max = function(){return 0.67279917831641}
	this.Q = function(){
    	return [
                [0.2506216744397705, -1.5086101e-9, 0],
                [0.1670616936824842, 0.0417896836090108, 0],
                [0.1670616936824842, 0.0417896836090108, 0],
                [0.0835445884544584, 0.1253067888370367, 0],
                [0.0835445884544584, 0.1253067888370367, 0],
                [0.0417572229057441, 0.2087827772978414, 0],
                [0.0417572229057441, 0.2087827772978414, 0],
                [6.19888283e-8, 0.3341508467944436, 0],
                [6.19888283e-8, 0.3341508467944436, 0],
                [6.19888283e-8, 0.6683898080103888, 0],
                [6.19888283e-8, 0.6683898080103888, 0],
                [0.0413130861047364, 0.7904744556665122, 0],
                [0.0413130861047364, 0.7904744556665122, 0],
                [0.0840817341778859, 0.8780585121604929, 0],
                [0.0840817341778859, 0.8780585121604929, 0],
                [0.165205838898018, 0.959182616880625, 0],
                [0.165205838898018, 0.959182616880625, 0],
                [0.2505006455230045, 1.002428270470772, 0],
                [0.2505006455230045, 1.002428270470772, 0],
                [0.4174458360386382, 1.002428270470772, 0],
                [0.4174458360386382, 1.002428270470772, 0],
                [0.5012754010617471, 0.9605878913001646, 0],
                [0.5012754010617471, 0.9605878913001646, 0],
                [0.5847310540406739, 0.8771322383212378, 0],
                [0.5847310540406739, 0.8771322383212378, 0],
                [0.6271033109802602, 0.7932427368953939, 0],
                [0.6271033109802602, 0.7932427368953939, 0],
                [0.6682618812258454, 0.6682711753804114, 0],
                [0.6682618812258454, 0.6682711753804114, 0],
                [0.6682618812258454, 0.3343872327020279, 0],
                [0.6682618812258454, 0.3343872327020279, 0],
                [0.6266410416881172, 0.2089791926427722, 0],
                [0.6266410416881172, 0.2089791926427722, 0],
                [0.5847379469871044, 0.1254287255093232, 0],
                [0.5847379469871044, 0.1254287255093232, 0],
                [0.5011775403829973, 0.041868318905216, 0],
                [0.5011775403829973, 0.041868318905216, 0],
                [0.4175050397145128, -1.5086101e-9, 0],
                [0.4175050397145128, -1.5086101e-9, 0],
                [0.2506216744397705, -1.5086101e-9, 0],
                [0.3379709089173559, 0.3348282678904439, 0],
                [0.67279917831641, -1.5086101e-9, 0]
                ]
    }
    
    this.R_max = function(){return 0.6694213593157201}
	this.R = function(){
    	return [
                [1.529646312e-7, 0.5010746315276294, 0],
                [0.4590163014262317, 0.5010746315276294, 0],
                [0.4590163014262317, 0.5010746315276294, 0],
                [0.5430536254743004, 0.5428801627808469, 0],
                [0.5430536254743004, 0.5428801627808469, 0],
                [0.626346974347257, 0.6261735116537963, 0],
                [0.626346974347257, 0.6261735116537963, 0],
                [0.6682711476790928, 0.7100618375843198, 0],
                [0.6682711476790928, 0.7100618375843198, 0],
                [0.6682711476790928, 0.7935884822624218, 0],
                [0.6682711476790928, 0.7935884822624218, 0],
                [0.6265185745008921, 0.8771045747119927, 0],
                [0.6265185745008921, 0.8771045747119927, 0],
                [0.54296821047204, 0.960654938740845, 0],
                [0.54296821047204, 0.960654938740845, 0],
                [0.4593461816866978, 1.002428270470772, 0],
                [0.4593461816866978, 1.002428270470772, 0],
                [1.52964617e-7, 1.002428270470772, 0],
                [1.52964617e-7, 1.002428270470772, 0],
                [1.52964617e-7, -1.5086101e-9, 0],
                [0.4590163014262317, 0.5010746315276294, 0],
                [0.6694213593157201, -1.5086101e-9, 0]
                ]
    }
    
    this.S_max = function(){return 0.6682717266528755}
	this.S = function(){
    	return [
                [0.6682699789428739, 0.8353562013633677, 0],
                [0.6265117257072177, 0.9188857239219885, 0],
                [0.6265117257072177, 0.9188857239219885, 0],
                [0.5847421133015019, 0.9606553363276972, 0],
                [0.5847421133015019, 0.9606553363276972, 0],
                [0.5011266418072183, 1.002428270470772, 0],
                [0.5011266418072183, 1.002428270470772, 0],
                [0.1670828992244253, 1.002428270470772, 0],
                [0.1670828992244253, 1.002428270470772, 0],
                [0.0835362447558339, 0.9606532831406867, 0],
                [0.0835362447558339, 0.9606532831406867, 0],
                [0.0417685353898349, 0.9188859094014389, 0],
                [0.0417685353898349, 0.9188859094014389, 0],
                [0.0000035719671416, 0.8353539630118689, 0],
                [0.0000035719671416, 0.8353539630118689, 0],
                [0.0000035719671416, 0.6683189002322365, 0],
                [0.0000035719671416, 0.6683189002322365, 0],
                [0.0417613882752903, 0.5847510858745864, 0],
                [0.0417613882752903, 0.5847510858745864, 0],
                [0.0836177453630143, 0.5428947287868624, 0],
                [0.0836177453630143, 0.5428947287868624, 0],
                [0.1670730683557338, 0.5012206839635951, 0],
                [0.1670730683557338, 0.5012206839635951, 0],
                [0.5012024487280087, 0.5012206839635951, 0],
                [0.5012024487280087, 0.5012206839635951, 0],
                [0.584738398472922, 0.4594601595639319, 0],
                [0.584738398472922, 0.4594601595639319, 0],
                [0.6264389040663759, 0.417759653970478, 0],
                [0.6264389040663759, 0.417759653970478, 0],
                [0.6682717266528755, 0.3341552435563386, 0],
                [0.6682717266528755, 0.3341552435563386, 0],
                [0.6682717266528755, 0.1670918016772163, 0],
                [0.6682717266528755, 0.1670918016772163, 0],
                [0.6265091041422579, 0.0835675552328752, 0],
                [0.6265091041422579, 0.0835675552328752, 0],
                [0.5847374147561624, 0.0417958658467796, 0],
                [0.5847374147561624, 0.0417958658467796, 0],
                [0.5009990589780103, -1.5086101e-9, 0],
                [0.5009990589780103, -1.5086101e-9, 0],
                [0.1670962255130917, -1.5086101e-9, 0],
                [0.1670962255130917, -1.5086101e-9, 0],
                [0.0835200784384256, 0.041726450178885, 0],
                [0.0835200784384256, 0.041726450178885, 0],
                [0.0416907870049101, 0.0835557416124004, 0],
                [0.0416907870049101, 0.0835557416124004, 0],
                [7.65471668e-8, 0.1670947594988519, 0]
                ]
    }
    
    this.T_max = function(){return 0.5844795491948674}
	this.T = function(){
    	return [
                [-1.43200765e-7, 1.002428270470772, 0],
                [0.6696511054776693, 1.002428270470772, 0],
                [0.3348254811384521, 1.002428270470772, 0],
                [0.3348254811384521, -1.5086083e-9, 0]
                ]
    }
    
    this.U_max = function(){return 0.6682668376336097}
	this.U = function(){
    	return [
                [2.121941236e-7, 1.002428270470772, 0],
                [2.121941236e-7, 0.3342865068841263, 0],
                [2.121941236e-7, 0.3342865068841263, 0],
                [0.0415118198575328, 0.2097367946874726, 0],
                [0.0415118198575328, 0.2097367946874726, 0],
                [0.0833589878388921, 0.1258043688572314, 0],
                [0.0833589878388921, 0.1258043688572314, 0],
                [0.1670413082954099, 0.0417972780159204, 0],
                [0.1670413082954099, 0.0417972780159204, 0],
                [0.2509119445032581, -1.5086101e-9, 0],
                [0.2509119445032581, -1.5086101e-9, 0],
                [0.4176312435027683, -1.5086101e-9, 0],
                [0.4176312435027683, -1.5086101e-9, 0],
                [0.501197341244989, 0.0417872054341331, 0],
                [0.501197341244989, 0.0417872054341331, 0],
                [0.5847296881418913, 0.1253195523310353, 0],
                [0.5847296881418913, 0.1253195523310353, 0],
                [0.6265046520504997, 0.2088636777166783, 0],
                [0.6265046520504997, 0.2088636777166783, 0],
                [0.6682668376336097, 0.3341551636152076, 0],
                [0.6682668376336097, 0.3341551636152076, 0],
                [0.6682659637786231, 1.002428270470772, 0]
                ]
    }
    
    this.V_max = function(){return 0.6682752995922386}
	this.V = function(){
    	return [
                [0, 1, 0],
                [0.3341437345824829, 0, 0],
                [0.3341437345824829, 0, 0],
                [0.6682752995922386, 1, 0]
                ] 
    }
    
    this.W_max = function(){return 0.5844795491948674}
	this.W = function(){
    	return [
                [0, 1, 0],
                [0.1668335609454346, -1.5086101e-9, 0],
                [0.1668335609454346, -1.5086101e-9, 0],
                [0.3758096474550001, 1.002428270470772, 0],
                [0.3758096474550001, 1.002428270470772, 0],
                [0.5845847473158301, -1.5086101e-9, 0],
                [0.5845847473158301, -1.5086101e-9, 0],
                [0.751666259210623, 1.002428270470772, 0]
                ]
    }
    
    this.X_max = function(){return 0.5844795491948674}
	this.X = function(){
    	return [
                [0.0003369483156348, 1.002428270470772, 0],
                [0.6686979500945541, -1.5086101e-9, 0],
                [0.6689391340730282, 1.002428270470772, 0],
                [-1.412485346e-7, -1.5086101e-9, 0]
                ]
    }
    
    this.Y_max = function(){return 0.6686469575894592}
	this.Y = function(){
    	return [
                [-1.32364306e-8, 1.002428270470772, 0],
                [0.333481185193591, 0.5054526871971774, 0],
                [0.333481185193591, 0.5054526871971774, 0],
                [0.333481185193591, -1.5086101e-9, 0],
                [0.333481185193591, 0.5054526871971774, 0],
                [0.6686469575894592, 1.002428270470772, 0]
                ]
    }
    
    this.Z_max = function(){return 0.6691223020828545}
	this.Z = function(){
    	return [
                [0, 1, 0],
                [0.6675504554113445, 1, 0],
                [0.6675504554113445, 1, 0],
                [0.0008510889046534, 0, 0],
                [0.0008510889046534, 0, 0],
                [0.6691223020828545, 0, 0]
                ]
    }
    
    //Numbers
    this._0_max = function(){return 0.5847517382670447}
	this._0 = function(){
    	return [
                [0.1672043386573989, 0.000339229551642, 0],
                [0.0831509562511883, 0.0412414144207674, 0],
                [0.0831509562511883, 0.0412414144207674, 0],
                [0.0418194422765339, 0.0834484165710308, 0],
                [0.0418194422765339, 0.0834484165710308, 0],
                [-1.510404672e-7, 0.1670252678001418, 0],
                [-1.510404672e-7, 0.1670252678001418, 0],
                [-1.510404672e-7, 0.8353199495337975, 0],
                [-1.510404672e-7, 0.8353199495337975, 0],
                [0.041785672260886, 0.9188668292901951, 0],
                [0.041785672260886, 0.9188668292901951, 0],
                [0.0836037624169279, 0.9606860936195786, 0],
                [0.0836037624169279, 0.9606860936195786, 0],
                [0.1670869831885966, 1.002401966237243, 0],
                [0.1670869831885966, 1.002401966237243, 0],
                [0.4176955754335552, 1.002401966237243, 0],
                [0.4176955754335552, 1.002401966237243, 0],
                [0.5012129288066376, 0.9606334078175819, 0],
                [0.5012129288066376, 0.9606334078175819, 0],
                [0.5429746641440687, 0.9188716724801508, 0],
                [0.5429746641440687, 0.9188716724801508, 0],
                [0.5847517382670447, 0.8353423427981567, 0],
                [0.5847517382670447, 0.8353423427981567, 0],
                [0.5847517382670447, 0.1670473197037552, 0],
                [0.5847517382670447, 0.1670473197037552, 0],
                [0.5430412911332497, 0.0835966354030404, 0],
                [0.5430412911332497, 0.0835966354030404, 0],
                [0.5012133793734819, 0.0417687236432727, 0],
                [0.5012133793734819, 0.0417687236432727, 0],
                [0.4176886721706694, 5.35233369e-8, 0],
                [0.4176886721706694, 5.35233369e-8, 0],
                [0.1672043386573989, 0.000339229551642, 0]
                ]
    }
    
    this._1_max = function(){return 0.2509255111655193}
	this._1 = function(){
    	return [
                [0.0000536467380812, 0.8354669686477222, 0],
                [0.1253581962806152, 1.002536340375712, 0],
                [0.1253581962806152, 1.002536340375712, 0],
                [0.1253581962806294, -6.89072976e-8, 0],
                [1.074189981e-7, -6.89072976e-8, 0],
                [0.2509255111655193, -6.89072976e-8, 0]
                ]
    }
    
    this._2_max = function(){return 0.6682695124055728}
	this._2 = function(){
    	return [
                [8.924839818e-7, 0.7520235160261404, 0],
                [8.924839818e-7, 0.7937043091421981, 0],
                [0.0000231325113731, 0.7936871344762279, 0],
                [0.0417679125779387, 0.877236317691441, 0],
                [0.0417679125779387, 0.877236317691441, 0],
                [0.1252293631781924, 0.9606977682916948, 0],
                [0.1252293631781924, 0.9606977682916948, 0],
                [0.2037524467529579, 0.9999999310927024, 0],
                [0.2037524467529579, 0.9999999310927024, 0],
                [0.4645068447937604, 0.9999999310927024, 0],
                [0.4645068447937604, 0.9999999310927024, 0],
                [0.5429613277450756, 0.9607779113599832, 0],
                [0.5429613277450756, 0.9607779113599832, 0],
                [0.6264127758551723, 0.8773264632498793, 0],
                [0.6264127758551723, 0.8773264632498793, 0],
                [0.6682695124055728, 0.7937074346618403, 0],
                [0.6682695124055728, 0.7937074346618403, 0],
                [0.6682695124055728, 0.6266361585524294, 0],
                [0.6682695124055728, 0.6266361585524294, 0],
                [0.6265007729099921, 0.543104157818931, 0],
                [0.6265007729099921, 0.543104157818931, 0],
                [0.5847089263634189, 0.5013123112723576, 0],
                [0.5847089263634189, 0.5013123112723576, 0],
                [0.083474826832628, 0.1671579929339089, 0],
                [0.083474826832628, 0.1671579929339089, 0],
                [0.0419034699924907, 0.1255866360937787, 0],
                [0.0419034699924907, 0.1255866360937787, 0],
                [-1.715264091e-7, 0.041913512417068, 0],
                [-1.715264091e-7, 0.041913512417068, 0],
                [-1.715264091e-7, -6.89072959e-8, 0],
                [-1.715264091e-7, -6.89072959e-8, 0],
                [0.6681235786214758, -6.89072959e-8, 0]
                ]
    }
    
    this._3_max = function(){return 0.6683444776927843}
	this._3 = function(){
    	return [
                [7.91587809e-8, 0.7518612773866807, 0],
                [7.91587809e-8, 0.793532427608227, 0],
                [7.91587809e-8, 0.793532427608227, 0],
                [0.0417091780509793, 0.8771551615189707, 0],
                [0.0417091780509793, 0.8771551615189707, 0],
                [0.124900749158698, 0.9603467326266893, 0],
                [0.124900749158698, 0.9603467326266893, 0],
                [0.2088804785464333, 1.002403159445336, 0],
                [0.2088804785464333, 1.002403159445336, 0],
                [0.459492260128684, 1.002403159445336, 0],
                [0.459492260128684, 1.002403159445336, 0],
                [0.5429694431252301, 0.9606822858438306, 0],
                [0.5429694431252301, 0.9606822858438306, 0],
                [0.6262895258909822, 0.8773622030780714, 0],
                [0.6262895258909822, 0.8773622030780714, 0],
                [0.6683444776927843, 0.7940899370162527, 0],
                [0.6683444776927843, 0.7940899370162527, 0],
                [0.6683444776927843, 0.7100325632071077, 0],
                [0.6683444776927843, 0.7100325632071077, 0],
                [0.6265217776512771, 0.6265169504043087, 0],
                [0.6265217776512771, 0.6265169504043087, 0],
                [0.5430156979994507, 0.5430108707524895, 0],
                [0.5430156979994507, 0.5430108707524895, 0],
                [0.4594865800712285, 0.5012043600486891, 0],
                [0.4594865800712285, 0.5012043600486891, 0],
                [0.2506203808272005, 0.5012043600486891, 0],
                [0.2506203808272005, 0.5012043600486891, 0],
                [0.4594865800712285, 0.5012043600486891, 0],
                [0.4594865800712285, 0.5012043600486891, 0],
                [0.5430483085384878, 0.459439039181504, 0],
                [0.5430483085384878, 0.459439039181504, 0],
                [0.626501031096808, 0.3759863166231838, 0],
                [0.626501031096808, 0.3759863166231838, 0],
                [0.6683121450579961, 0.2923566512556732, 0],
                [0.6683121450579961, 0.2923566512556732, 0],
                [0.6683121450579961, 0.2088357623385946, 0],
                [0.6683121450579961, 0.2088357623385946, 0],
                [0.6265427501711544, 0.1253002441955857, 0],
                [0.6265427501711544, 0.1253002441955857, 0],
                [0.5429550444458187, 0.0417132579403727, 0],
                [0.5429550444458187, 0.0417132579403727, 0],
                [0.4594778415212773, -3.52267335e-8, 0],
                [0.4594778415212773, -3.52267335e-8, 0],
                [0.208880260082708, -3.52267335e-8, 0],
                [0.208880260082708, -3.52267335e-8, 0],
                [0.1253336056140881, 0.0417818334533848, 0],
                [0.1253336056140881, 0.0417818334533848, 0],
                [0.0417342164875692, 0.1253812225799038, 0],
                [0.0417342164875692, 0.1253812225799038, 0],
                [0.0000448642272488, 0.2088332042225858, 0],
                [0.0000448642272488, 0.2088332042225858, 0],
                [0.0000448642272488, 0.2505930091521265, 0]
                ]
    }
    
    this._4_max = function(){return 0.6682644188224458}
	this._4 = function(){
    	return [
                [0.6682644188224458, 0.250734201109708, 0],
                [1.964841658e-7, 0.250734201109708, 0],
                [1.964841658e-7, 0.250734201109708, 0],
                [0.5847367706999762, 0.9999999310927024, 0],
                [0.5847367706999762, 0.9999999310927024, 0],
                [0.5847367706999762, -6.89072994e-8, 0]
                ]
    }
    
    this._5_max = function(){return 0.6682663962241407}
	this._5 = function(){
    	return [
                [0.6680095359762959, 0.9999999310927024, 0],
                [0.0000026639339694, 0.9999999310927024, 0],
                [0.0000026639339694, 0.9999999310927024, 0],
                [0.0000026639339694, 0.4595704405243879, 0],
                [0.0000026639339694, 0.4595421791634351, 0],
                [0.0417441693130911, 0.5430761274454455, 0],
                [0.0417441693130911, 0.5430761274454455, 0],
                [0.1253013565009553, 0.6266333146333097, 0],
                [0.1253013565009553, 0.6266333146333097, 0],
                [0.2088346618862431, 0.6684036497915855, 0],
                [0.2088346618862431, 0.6684036497915855, 0],
                [0.4594318730761984, 0.6684030353422657, 0],
                [0.4594318730761984, 0.6684030353422657, 0],
                [0.5429669510431268, 0.626636729903467, 0],
                [0.5429669510431268, 0.626636729903467, 0],
                [0.6264980716218957, 0.5431056093246909, 0],
                [0.6264980716218957, 0.5431056093246909, 0],
                [0.6682663962241407, 0.4595695282560257, 0],
                [0.6682663962241407, 0.4595695282560257, 0],
                [0.6682663962241407, 0.2089731976105043, 0],
                [0.6682663962241407, 0.2089731976105043, 0],
                [0.626544941184676, 0.1254523978144135, 0],
                [0.626544941184676, 0.1254523978144135, 0],
                [0.5431285690421106, 0.0420360256718482, 0],
                [0.5431285690421106, 0.0420360256718482, 0],
                [0.4591605935028725, -6.89072976e-8, 0],
                [0.4591605935028725, -6.89072976e-8, 0],
                [0.2090688130998046, -6.89072976e-8, 0],
                [0.2090688130998046, -6.89072976e-8, 0],
                [0.1252618958355356, 0.0418628479658878, 0],
                [0.1252618958355356, 0.0418628479658878, 0],
                [0.0417631999296475, 0.1254513737322043, 0],
                [0.0417631999296475, 0.1254513737322043, 0],
                [6.984623155e-7, 0.2089723783447397, 0],
                [6.984623155e-7, 0.2089723783447397, 0],
                [1.387383008e-7, 0.2507190896772187, 0]
                ] 
    }
    
    this._6_max = function(){return 0.5847517382670447}
	this._6 = function(){
    	return [
                [0.6682302121354269, 0.7937175177082594, 0],
                [0.6265068913492371, 0.8772239803533921, 0],
                [0.6265068913492371, 0.8772239803533921, 0],
                [0.5429592885487438, 0.9607715831538854, 0],
                [0.5429592885487438, 0.9607715831538854, 0],
                [0.4644912298588793, 0.9999999310927041, 0],
                [0.4644912298588793, 0.9999999310927041, 0],
                [0.2037577898797451, 0.9999999310927041, 0],
                [0.2037577898797451, 0.9999999310927041, 0],
                [0.1252939980768133, 0.9607690850339452, 0],
                [0.1252939980768133, 0.9607690850339452, 0],
                [0.0417623798107201, 0.8772374667678519, 0],
                [0.0417623798107201, 0.8772374667678519, 0],
                [-3.64386779e-8, 0.7936807190207987, 0],
                [-3.64386779e-8, 0.7936807190207987, 0],
                [-3.64386779e-8, 0.2089714908068174, 0],
                [-3.64386779e-8, 0.2089714908068174, 0],
                [0.0417626516033067, 0.125437855847025, 0],
                [0.0417626516033067, 0.125437855847025, 0],
                [0.1253004708974856, 0.0419000365528461, 0],
                [0.1253004708974856, 0.0419000365528461, 0],
                [0.2091098709253742, -6.89072976e-8, 0],
                [0.2091098709253742, -6.89072976e-8, 0],
                [0.4594259140843633, -6.89072976e-8, 0],
                [0.4594259140843633, -6.89072976e-8, 0],
                [0.542964910119423, 0.0419047670643948, 0],
                [0.542964910119423, 0.0419047670643948, 0],
                [0.6264801822434976, 0.1254200391884694, 0],
                [0.6264801822434976, 0.1254200391884694, 0],
                [0.6682658478977999, 0.2089822095339571, 0],
                [0.6682658478977999, 0.2089822095339571, 0],
                [0.6682658478977999, 0.376043403232444, 0],
                [0.6682658478977999, 0.376043403232444, 0],
                [0.6265074510732518, 0.4595502755104519, 0],
                [0.6265074510732518, 0.4595502755104519, 0],
                [0.542968375175434, 0.5430893514082697, 0],
                [0.542968375175434, 0.5430893514082697, 0],
                [0.4594261006590444, 0.584869741743205, 0],
                [0.4594261006590444, 0.584869741743205, 0],
                [0.2088339269852497, 0.584869741743205, 0],
                [0.2088339269852497, 0.584869741743205, 0],
                [0.1253029536610768, 0.5431102635191536, 0],
                [0.1253029536610768, 0.5431102635191536, 0],
                [0.0417391706306205, 0.4595464804887044, 0],
                [0.0417391706306205, 0.4595464804887044, 0],
                [-3.64386779e-8, 0.3752649642077568, 0]
                ]
    }
    
    this._7_max = function(){return 0.6655854309758809}
	this._7 = function(){
    	return [
                [6.4954321e-8, 1.002730332488056, 0],
                [0.6655854309758809, 1.002730332488056, 0],
                [0.6655854309758809, 1.002730332488056, 0],
                [0.3325399392843167, -3.75269877e-8, 0]
                ]
    }
    
    this._8_max = function(){return 0.6682701365310777}
	this._8 = function(){
    	return [
                [0.3383057389756061, 4.00320914e-8, 0],
                [0.2088320586543375, 4.00320914e-8, 0],
                [0.2088320586543375, 4.00320914e-8, 0],
                [0.1252880251031456, 0.0417673695530851, 0],
                [0.1252880251031456, 0.0417673695530851, 0],
                [0.0417722777638403, 0.1252831168923905, 0],
                [0.0417722777638403, 0.1252831168923905, 0],
                [1.475518161e-7, 0.2088346394726841, 0],
                [1.475518161e-7, 0.2088346394726841, 0],
                [1.475518161e-7, 0.2923666359009473, 0],
                [1.475518161e-7, 0.2923666359009473, 0],
                [0.04178485140514, 0.375889893494346, 0],
                [0.04178485140514, 0.375889893494346, 0],
                [0.1252362776030225, 0.4593413196922285, 0],
                [0.1252362776030225, 0.4593413196922285, 0],
                [0.208829073459583, 0.5012016449744295, 0],
                [0.208829073459583, 0.5012016449744295, 0],
                [0.3383057389756061, 0.5012016449744295, 0],
                [0.3383057389756061, 0.5012016449744295, 0],
                [0.208829073459583, 0.5012016449744295, 0],
                [0.208829073459583, 0.5012016449744295, 0],
                [0.12530446487483, 0.5847262535591824, 0],
                [0.12530446487483, 0.5847262535591824, 0],
                [0.0835337329213815, 0.6682674129067863, 0],
                [0.0835337329213815, 0.6682674129067863, 0],
                [0.0835339194960625, 0.8353002736640888, 0],
                [0.0835339194960625, 0.8353002736640888, 0],
                [0.1253057496969916, 0.9188617636600326, 0],
                [0.1253057496969916, 0.9188617636600326, 0],
                [0.1669452984553743, 0.9606581088436882, 0],
                [0.1669452984553743, 0.9606581088436882, 0],
                [0.2506003439364974, 1.002400177670153, 0],
                [0.2506003439364974, 1.002400177670153, 0],
                [0.4176673281009755, 1.002400177670153, 0],
                [0.4176673281009755, 1.002400177670153, 0],
                [0.5011990477238158, 0.9606339405034987, 0],
                [0.5011990477238158, 0.9606339405034987, 0],
                [0.5429676446810561, 0.9188658396930762, 0],
                [0.5429676446810561, 0.9188658396930762, 0],
                [0.5847305807720033, 0.8353498392431077, 0],
                [0.5847305807720033, 0.8353498392431077, 0],
                [0.5847305807720033, 0.6682210561186963, 0],
                [0.5847305807720033, 0.6682210561186963, 0],
                [0.5429785274863264, 0.5847431995033361, 0],
                [0.5429785274863264, 0.5847431995033361, 0],
                [0.4594362999436897, 0.5012009719607065, 0],
                [0.4594362999436897, 0.5012009719607065, 0],
                [0.3383057389756061, 0.5012016449744295, 0],
                [0.3383057389756061, 0.5012016449744295, 0],
                [0.4594362999436897, 0.5012009719607065, 0],
                [0.4594362999436897, 0.5012009719607065, 0],
                [0.5430040882164066, 0.459438684870861, 0],
                [0.5430040882164066, 0.459438684870861, 0],
                [0.6265089660771963, 0.3759338070100711, 0],
                [0.6265089660771963, 0.3759338070100711, 0],
                [0.6682701365310777, 0.2923633588378749, 0],
                [0.6682701365310777, 0.2923633588378749, 0],
                [0.6682701365310777, 0.2088352539220182, 0],
                [0.6682701365310777, 0.2088352539220182, 0],
                [0.6264593122236591, 0.1253220323342816, 0],
                [0.6264593122236591, 0.1253220323342816, 0],
                [0.5429286903347901, 0.0417914104454127, 0],
                [0.5429286903347901, 0.0417914104454127, 0],
                [0.4592257754606664, 4.00320914e-8, 0],
                [0.4592257754606806, 4.00320914e-8, 0],
                [0.3383057389756061, 4.00320914e-8, 0]
                ]
    }
    
    this._9_max = function(){return 0.6682804371447446}
	this._9 = function(){
    	return [
                [0.6682804371447446, 0.6265232250712103, 0],
                [0.6265037560023359, 0.5429808512765391, 0],
                [0.6265037560023359, 0.5429808512765391, 0],
                [0.5429618312584239, 0.4594389265326342, 0],
                [0.5429618312584239, 0.4594389265326342, 0],
                [0.4594362121138432, 0.4176768828212545, 0],
                [0.4594362121138432, 0.4176768828212545, 0],
                [0.2088375083265248, 0.4176770876376992, 0],
                [0.2088375083265248, 0.4176770876376992, 0],
                [0.1253029900836111, 0.4594445537029941, 0],
                [0.1253029900836111, 0.4594445537029941, 0],
                [0.0417663092861744, 0.5429818489497507, 0],
                [0.0417663092861744, 0.5429818489497507, 0],
                [1.865585091e-7, 0.6265176950272604, 0],
                [1.865585091e-7, 0.6265176950272604, 0],
                [1.865585091e-7, 0.7935710374287908, 0],
                [1.865585091e-7, 0.7935710374287908, 0],
                [0.0417701510127131, 0.8770970941802289, 0],
                [0.0417701510127131, 0.8770970941802289, 0],
                [0.1252417517279838, 0.9605686948954996, 0],
                [0.1252417517279838, 0.9605686948954996, 0],
                [0.2088449713134253, 1.002415263242184, 0],
                [0.2088449713134253, 1.002415263242184, 0],
                [0.4594434885260626, 1.002415263242184, 0],
                [0.4594434885260626, 1.002415263242184, 0],
                [0.5429662525646677, 0.9606473875440003, 0],
                [0.5429662525646677, 0.9606473875440003, 0],
                [0.6265034761892565, 0.8771101639194114, 0],
                [0.6265034761892565, 0.8771101639194114, 0],
                [0.6682705486871328, 0.793577250194204, 0],
                [0.6682705486871328, 0.793577250194204, 0],
                [0.6682699889631181, 0.2088590783289135, 0],
                [0.6682699889631181, 0.2088590783289135, 0],
                [0.6265155102067013, 0.1253433989438832, 0],
                [0.6265155102067013, 0.1253433989438832, 0],
                [0.5431612290146292, 0.0419891177518181, 0],
                [0.5431612290146292, 0.0419891177518181, 0],
                [0.4594255773575356, -3.08126147e-8, 0],
                [0.4594255773575356, -3.08126147e-8, 0],
                [0.2088263138462025, -3.08126147e-8, 0],
                [0.2088263138462025, -3.08126147e-8, 0],
                [0.1253141845639334, 0.0417916718650133, 0],
                [0.1253141845639334, 0.0417916718650133, 0],
                [0.0417765984514063, 0.1253292579775334, 0],
                [0.0417765984514063, 0.1253292579775334, 0],
                [0.0000231352431967, 0.2088287654954684, 0]
                ]
    }
    
    
    
    //Symbols
    this.period_max = function(){return 0.0839491771521068}
	this.period = function(){
    	return [
                [0.0418921311051292, 0.0416591264874526, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [-4.80492162e-8, 0, 0],
                [-4.80492162e-8, 0, 0],
                [0.083686368402681, 0, 0],
                [0.083686368402681, 0, 0],
                [0.0418921311051292, 0.0416591264874526, 0]
                ]
    }
    
    this.comma_max = function(){return 0.0839491771521068}
	this.comma = function(){
    	return [
        		[0.083686368402681, 0, 0],
                [0.0418921311051292, 0.0416591264874526, 0],
                [0.0418921311051292, 0.0416591264874526, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0.083686368402681, 0, 0],
                [0.083686368402681, 0, 0],
                [0, -0.083784358308705, 0]
                ]
    }
    
    this.semicolon_max = function(){return 0.0839491771521068}
	this.semicolon = function(){
    	return [
                [0.0421566363818329, 0.7101689680214635, 0],
                [0.0421566363818329, 0.6270342337244302, 0],
                [0.0421566363818329, 0.6270342337244302, 0],
                [0, 0.669190768677197, 0],
                [0, 0.669190768677197, 0],
                [0.0837429280404649, 0.669190768677197, 0],
                [0.0837429280404649, 0.669190768677197, 0],
                [0.0421566363818329, 0.7101689680214635, 0],
                [0.083686368402681, 0, 0],
                [0.0418921311051292, 0.0416591264874526, 0],
                [0.0418921311051292, 0.0416591264874526, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0.083686368402681, 0, 0],
                [0.083686368402681, 0, 0],
                [0, -0.083784358308705, 0]
                ]
    }
    
    
    this.exclamation_max = function(){return 0.0839491771521068}
	this.exclamation = function(){
    	return [
                [0.0422189489680989, 0.2509815885743549, 0],
                [0.0002538750603662, 1.002223530253267, 0],
                [0.0002538750603662, 1.002223530253267, 0],
                [0.0839491771521068, 1.002223530253267, 0],
                [0.0839491771521068, 1.002223530253267, 0],
                [0.0422189489680989, 0.2509815885743549, 0],
                [0.0418921311051292, 0.0416591264874526, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0.0418921311051292, -0.0418921791543525, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0.083686368402681, 0, 0],
                [0.083686368402681, 0, 0],
                [0.0418921311051292, 0.0416591264874526, 0]
                ]
    }
    
    this.single_quote_max = function(){return 0.1670718827331825}
	this.single_quote = function(){
    	return [
                [0.1670718827331825, 0.9999999310927024, 0],
                [-2.81146981e-8, 0.9999999310927024, 0],
                [-2.81146981e-8, 0.9999999310927024, 0],
                [0.0835319310645844, 0.9164679719134198, 0],
                [0.0835319310645844, 0.9164679719134198, 0],
                [0.0835319310645844, 1.083541834811796, 0],
                [0.0835319310645844, 1.083541834811796, 0],
                [0.1670718827331825, 0.9999999310927024, 0],
                [0.1670718827331825, 0.9999999310927024, 0],
                [0.1566454525727181, 0.9215851534021339, 0],
                [0.1566454525727181, 0.9215851534021339, 0],
                [0.1462309983125465, 0.8827026969261736, 0],
                [0.1462309983125465, 0.8827026969261736, 0],
                [0.1331818459813689, 0.8449392657695682, 0],
                [0.1331818459813689, 0.8449392657695682, 0],
                [0.1061184246459561, 0.7889386348270762, 0],
                [0.1061184246459561, 0.7889386348270762, 0],
                [0.0839024250823286, 0.7500581117051297, 0]
                ]
    }
    
    this.minus_max = function(){return 0.6659415148739072}
	this.minus = function(){
    	return [
                [0, 0.4593194631833626, 0],
                [0.6659415148739072, 0.4593194631833626, 0]
                ]
    }
    
    this.plus_max = function(){return 0.6683500267304794}
	this.plus = function(){
    	return [
                [0.3342542897755152, 0.8356316784812491, 0],
                [0.3342542897755152, 0.0834885734010556, 0],
                [0, 0.4595695989644924, 0],
                [0.6683500267304794, 0.4595695989644924, 0]
                ] 
    }
    
    this.equals_max = function(){return 0.5845692356545414}
	this.equals = function(){
    	return [
                [0, 0.6682870037232221, 0],
                [0.5845692356545414, 0.6682870037232221, 0],
                [0, 0.2506042455582573, 0],
                [0.5845669158804156, 0.2506042455582573, 0]
                ]
    }
    
    this.question_max = function(){return 0.5844795491948674}
	this.question = function(){
    	return [
                [0.0832388402540119, 0.5853237626762962, 0],
                [0.0417239996843648, 0.6268386032459432, 0],
                [0.0417239996843648, 0.6268386032459432, 0],
                [-7.1722184e-9, 0.7101448374318409, 0],
                [-7.1722184e-9, 0.7101448374318409, 0],
                [-7.1722184e-9, 0.7936114692335537, 0],
                [-7.1722184e-9, 0.7936114692335537, 0],
                [0.0417078268638989, 0.8772486228617992, 0],
                [0.0417078268638989, 0.8772486228617992, 0],
                [0.1249670226105763, 0.9605078186084767, 0],
                [0.1249670226105763, 0.9605078186084767, 0],
                [0.2037160452693456, 1, 0],
                [0.2037160452693456, 1, 0],
                [0.4644616872805614, 1, 0],
                [0.4644616872805614, 1, 0],
                [0.5429242638721803, 0.9607704196988321, 0],
                [0.5429242638721803, 0.9607704196988321, 0],
                [0.626459294766903, 0.8772360932688059, 0],
                [0.626459294766903, 0.8772360932688059, 0],
                [0.6682231776968593, 0.7937118747534555, 0],
                [0.6682231776968593, 0.7937118747534555, 0],
                [0.6682231776968593, 0.7101592731420113, 0],
                [0.6682231776968593, 0.7101592731420113, 0],
                [0.626462156574064, 0.6266392807687283, 0],
                [0.626462156574064, 0.6266392807687283, 0],
                [0.5847933799827559, 0.5849705041774201, 0],
                [0.5847933799827559, 0.5849705041774201, 0],
                [0.4593927113527343, 0.5013407964551391, 0],
                [0.4593927113527343, 0.5013407964551391, 0],
                [0.3758489125035282, 0.4177977020706294, 0],
                [0.3758489125035282, 0.4177977020706294, 0],
                [0.3340895707397067, 0.3342711669465643, 0],
                [0.3340895707397067, 0.3342711669465643, 0],
                [0.3340899229720549, 0.1672413645312929, 0],
                [0.3342818896095991, 0.0420911040275485, 0],
                [0.3342818896095991, -0.0415555874805875, 0],
                [0.3342818896095991, -0.0415555874805875, 0],
                [0.2923063589780668, 0, 0],
                [0.2923063589780668, 0, 0],
                [0.3759854968573109, 0, 0],
                [0.3759854968573109, 0, 0],
                [0.3342818896095991, 0.0420911040275485, 0]
                ]
    }
    
    this.double_quote_max = function(){return 0.5014326421759847}
	this.double_quote = function(){
    	return [
                [0.1670718453449922, 0.9999999310927024, 0],
                [-6.55028884e-8, 0.9999999310927024, 0],
                [-6.55028884e-8, 0.9999999310927024, 0],
                [0.083531893676394, 0.9164679719134198, 0],
                [0.083531893676394, 0.9164679719134198, 0],
                [0.083531893676394, 1.083541834811796, 0],
                [0.083531893676394, 1.083541834811796, 0],
                [0.1670718453449922, 0.9999999310927024, 0],
                [0.1670718453449922, 0.9999999310927024, 0],
                [0.1566454151845278, 0.9215851534021339, 0],
                [0.1566454151845278, 0.9215851534021339, 0],
                [0.1462309609243562, 0.8827026969261736, 0],
                [0.1462309609243562, 0.8827026969261736, 0],
                [0.1331818085931786, 0.8449392657695682, 0],
                [0.1331818085931786, 0.8449392657695682, 0],
                [0.1061183872577658, 0.7889386348270762, 0],
                [0.1061183872577658, 0.7889386348270762, 0],
                [0.0839023876941383, 0.7500581117051297, 0],
                [0.5014326421759847, 0.9999999310927024, 0],
                [0.3343607313281041, 0.9999999310927024, 0],
                [0.3343607313281041, 0.9999999310927024, 0],
                [0.4178926905073866, 0.9164679719134198, 0],
                [0.4178926905073866, 0.9164679719134198, 0],
                [0.4178926905073866, 1.083541834811796, 0],
                [0.4178926905073866, 1.083541834811796, 0],
                [0.5014326421759847, 0.9999999310927024, 0],
                [0.5014326421759847, 0.9999999310927024, 0],
                [0.4910062120155203, 0.9215851534021339, 0],
                [0.4910062120155203, 0.9215851534021339, 0],
                [0.4805917577553487, 0.8827026969261736, 0],
                [0.4805917577553487, 0.8827026969261736, 0],
                [0.4675426054241712, 0.8449392657695682, 0],
                [0.4675426054241712, 0.8449392657695682, 0],
                [0.4404791840887583, 0.7889386348270762, 0],
                [0.4404791840887583, 0.7889386348270762, 0],
                [0.4182631845251308, 0.7500581117051297, 0]
                ]
    }
    
    this.star_max = function(){return 0.6684433118214486}
	this.star = function(){
    	return [
                [0, 0.7518521800237324, 0],
                [0.6681850876705653, 0.1671448825844379, 0],
                [0.6684433118214486, 0.7518618528999071, 0],
                [0.0000914855199881, 0.1670899630313301, 0],
                [0.3342357214271772, 0.8353218266794897, 0],
                [0.3342357214271772, 0.0832481104960721, 0]
                ]
    }
    
    this.forward_slash_max = function(){return 0.6681428964700729}
	this.forward_slash = function(){
    	return [
                [0.6681428964700729, 0.835538467129112, 0],
                [0, 0.0836275910179865, 0]
                ]
    }
    
    this.backslash_max = function(){return 0.6681428964700729}
	this.backslash = function(){
    	return [
                [0, 0.835538467129112, 0],
                [0.6681428964700729, 0.0836275910179865, 0]
                ]
    }
    
    this.dollar_max = function(){return 0.6682717266528755}
	this.dollar = function(){
    	return [
                [0.6682699789428739, 0.8353562028719778, 0],
                [0.6265117257072177, 0.9188857254305987, 0],
                [0.6265117257072177, 0.9188857254305987, 0],
                [0.5847421133015019, 0.9606553378363074, 0],
                [0.5847421133015019, 0.9606553378363074, 0],
                [0.4511161042348704, 1.002428271979383, 0],
                [0.4511161042348704, 1.002428271979383, 0],
                [0.2036515003871386, 1.002428271979383, 0],
                [0.2036515003871386, 1.002428271979383, 0],
                [0.0835362447558339, 0.9606532846492967, 0],
                [0.0835362447558339, 0.9606532846492967, 0],
                [0.0417685353898349, 0.9188859109100491, 0],
                [0.0417685353898349, 0.9188859109100491, 0],
                [0.0000035719671416, 0.835353964520479, 0],
                [0.0000035719671416, 0.835353964520479, 0],
                [0.0000035719671416, 0.6683189017408467, 0],
                [0.0000035719671416, 0.6683189017408467, 0],
                [0.0417613882752903, 0.5847510873831965, 0],
                [0.0417613882752903, 0.5847510873831965, 0],
                [0.0836177453630143, 0.5428947302954726, 0],
                [0.0836177453630143, 0.5428947302954726, 0],
                [0.1670730683557338, 0.5012206854722053, 0],
                [0.1670730683557338, 0.5012206854722053, 0],
                [0.5012024487280087, 0.5012206854722053, 0],
                [0.5012024487280087, 0.5012206854722053, 0],
                [0.584738398472922, 0.459460161072542, 0],
                [0.584738398472922, 0.459460161072542, 0],
                [0.6264389040663759, 0.4177596554790881, 0],
                [0.6264389040663759, 0.4177596554790881, 0],
                [0.6682717266528755, 0.3341552450649488, 0],
                [0.6682717266528755, 0.3341552450649488, 0],
                [0.6682717266528755, 0.1670918031858264, 0],
                [0.6682717266528755, 0.1670918031858264, 0],
                [0.6265091041422579, 0.0835675567414853, 0],
                [0.6265091041422579, 0.0835675567414853, 0],
                [0.5847374147561624, 0.0417958673553898, 0],
                [0.5847374147561624, 0.0417958673553898, 0],
                [0.4491502654760211, 0, 0],
                [0.4491502654760211, 0, 0],
                [0.2050849541381581, 0, 0],
                [0.2050849541381581, 0, 0],
                [0.0835200784384256, 0.0417264516874951, 0],
                [0.0835200784384256, 0.0417264516874951, 0],
                [0.0416907870049101, 0.0835557431210106, 0],
                [0.0416907870049101, 0.0835557431210106, 0],
                [7.65471668e-8, 0.167094761007462, 0],
                [0.3283833290659004, 1.085262445119909, 0],
                [0.3283833290659004, -0.0834922361936066, 0]
                ]
    }
    
    this.colon_max = function(){return 0.5844795491948674}
	this.colon = function(){
    	return [
                [0.0421566363818329, 0.7101689680214635, 0],
                [0.0421566363818329, 0.6270342337244302, 0],
                [0.0421566363818329, 0.6270342337244302, 0],
                [0, 0.669190768677197, 0],
                [0, 0.669190768677197, 0],
                [0.0837429280404649, 0.669190768677197, 0],
                [0.0837429280404649, 0.669190768677197, 0],
                [0.0421566363818329, 0.7101689680214635, 0],
                [0.0421566363818329, 0.1244947008542567, 0],
                [0.0421566363818329, 0.0413599665572235, 0],
                [0.0421566363818329, 0.0413599665572235, 0],
                [0, 0.0835165015099904, 0],
                [0, 0.0835165015099904, 0],
                [0.0837429280404649, 0.0835165015099904, 0],
                [0.0837429280404649, 0.0835165015099904, 0],
                [0.0421566363818329, 0.1244947008542567, 0]
                ]
    }
    
    
    //New Characters (4_22_2019):
    
    this.hashtag_max = function(){return 0.7267785583640034}
	this.hashtag = function(){
    	return [
			[0.3150114186441897, 1.002427586737184, 0],
			[0.1080042839507627, -6.85242199e-7, 0],
			[0.6210246327154892, 1.002427586737184, 0],
			[0.4140174980220622, -6.85242199e-7, 0],
			[0.0022503583018079, 0.6705791470012628, 0],
			[0.7267785583640034, 0.6705791470012628, 0],
			[0, 0.3196812623777987, 0],
			[0.7245314286969915, 0.3196812623777987, 0]
		]
    }
    
    this.percent_max = function(){return 0.9656135727414039}
	this.percent = function(){
    	return [
			[0.7433188533141362, 1.002427586737184, 0],
			[0.2314059262103001, -6.85242199e-7, 0],
			[0.1682570624716391, 0.5295713513914962, 0],
			[0.2449435910016291, 0.5554167163695638, 0],
			[0.2449435910016291, 0.5554167163695638, 0],
			[0.2909258046815921, 0.6119909438712057, 0],
			[0.2909258046815921, 0.6119909438712057, 0],
			[0.3156862032710705, 0.694200091631501, 0],
			[0.3156862032710705, 0.694200091631501, 0],
			[0.3183369122607473, 0.7923224003411633, 0],
			[0.3183369122607473, 0.7923224003411633, 0],
			[0.2873872211825983, 0.9037027263498202, 0],
			[0.2873872211825983, 0.9037027263498202, 0],
			[0.2307957142747909, 0.9567406958622086, 0],
			[0.2307957142747909, 0.9567406958622086, 0],
			[0.1688963321180381, 0.9753050669169169, 0],
			[0.1688963321180381, 0.9753050669169169, 0],
			[0.1016923033475905, 0.9682325509393194, 0],
			[0.1016923033475905, 0.9682325509393194, 0],
			[0.0424468588153104, 0.9196139205259896, 0],
			[0.0424468588153104, 0.9196139205259896, 0],
			[0.0097278759876644, 0.8400559828705809, 0],
			[0.0097278759876644, 0.8400559828705809, 0],
			[0, 0.7481231090278015, 0],
			[0, 0.7481231090278015, 0],
			[0.0088432301131434, 0.6561902351845675, 0],
			[0.0088432301131434, 0.6561902351845675, 0],
			[0.0371389835668197, 0.5996140409101827, 0],
			[0.0371389835668197, 0.5996140409101827, 0],
			[0.1016923033475905, 0.5395055221933945, 0],
			[0.1016923033475905, 0.5395055221933945, 0],
			[0.1485591629025293, 0.5244774091274849, 0],
			[0.1485591629025293, 0.5244774091274849, 0],
			[0.1768549163566604, 0.5227092801328582, 0],
			[0.8155337229522956, 0.0085239945065041, 0],
			[0.8922202514822856, 0.0343693594845718, 0],
			[0.8922202514822856, 0.0343693594845718, 0],
			[0.9382024651622486, 0.0909435869862137, 0],
			[0.9382024651622486, 0.0909435869862137, 0],
			[0.9629628637517271, 0.1731527347465089, 0],
			[0.9629628637517271, 0.1731527347465089, 0],
			[0.9656135727414039, 0.2712750434561713, 0],
			[0.9656135727414039, 0.2712750434561713, 0],
			[0.9346638816632548, 0.3826553694648282, 0],
			[0.9346638816632548, 0.3826553694648282, 0],
			[0.8780723747554475, 0.4356933389772167, 0],
			[0.8780723747554475, 0.4356933389772167, 0],
			[0.8161729925986946, 0.454257710031925, 0],
			[0.8161729925986946, 0.454257710031925, 0],
			[0.7489689638282471, 0.4471851940543275, 0],
			[0.7489689638282471, 0.4471851940543275, 0],
			[0.689723519295967, 0.3985665636409976, 0],
			[0.689723519295967, 0.3985665636409976, 0],
			[0.6570045364683211, 0.3190086259855889, 0],
			[0.6570045364683211, 0.3190086259855889, 0],
			[0.6472766604806566, 0.2270757521428095, 0],
			[0.6472766604806566, 0.2270757521428095, 0],
			[0.6561198905938, 0.1351428782995754, 0],
			[0.6561198905938, 0.1351428782995754, 0],
			[0.6844156440474763, 0.0785666840251906, 0],
			[0.6844156440474763, 0.0785666840251906, 0],
			[0.7489689638282471, 0.0184581653084024, 0],
			[0.7489689638282471, 0.0184581653084024, 0],
			[0.795835823383186, 0.0034300522424928, 0],
			[0.795835823383186, 0.0034300522424928, 0],
			[0.8241315768373169, 0.0016619232478661, 0]
		]
    }
    
    this.ampersand_max = function(){return 0.7214706831150579}
	this.ampersand = function(){
    	return [
			[0.7214706831150579, 0.023221689696129, 0],
            [0.621860849071254, 0.098617935524544, 0],
            [0.621860849071254, 0.098617935524544, 0],
            [0.1622227444422606, 0.6804405471989412, 0],
            [0.1622227444422606, 0.6804405471989412, 0],
            [0.1323385027753829, 0.7643706213998485, 0],
            [0.1323385027753829, 0.7643706213998485, 0],
            [0.1280702478616149, 0.8454567417347789, 0],
            [0.1280702478616149, 0.8454567417347789, 0],
            [0.169338655055526, 0.912315225644761, 0],
            [0.169338655055526, 0.912315225644761, 0],
            [0.2376436482177269, 0.9549922345986487, 0],
            [0.2376436482177269, 0.9549922345986487, 0],
            [0.3002565586161836, 0.9663719836103155, 0],
            [0.3002565586161836, 0.9663719836103155, 0],
            [0.3842139722191859, 0.949302360092588, 0],
            [0.3842139722191859, 0.949302360092588, 0],
            [0.44255862770342, 0.8852878300485826, 0],
            [0.44255862770342, 0.8852878300485826, 0],
            [0.4695952136717097, 0.7842861655572051, 0],
            [0.4695952136717097, 0.7842861655572051, 0],
            [0.4382903727896519, 0.6946662168502371, 0],
            [0.4382903727896519, 0.6946662168502371, 0],
            [0.3529091313371282, 0.6178479940881516, 0],
            [0.3529091313371282, 0.6178479940881516, 0],
            [0.1152622544850601, 0.47986116192169, 0],
            [0.1152622544850601, 0.47986116192169, 0],
            [0.0412651785595699, 0.40019701852043, 0],
            [0.0412651785595699, 0.40019701852043, 0],
            [0.0014205992147254, 0.310577069813462, 0],
            [0.0014205992147254, 0.310577069813462, 0],
            [0, 0.2124213259612588, 0],
            [0, 0.2124213259612588, 0],
            [0.0469572613228593, 0.1327591493331965, 0],
            [0.0469572613228593, 0.1327591493331965, 0],
            [0.1323385027753829, 0.0673206755827778, 0],
            [0.1323385027753829, 0.0673206755827778, 0],
            [0.2433357309810162, 0.0488271083590917, 0],
            [0.2433357309810162, 0.0488271083590917, 0],
            [0.365713896078887, 0.0630527780099328, 0],
            [0.365713896078887, 0.0630527780099328, 0],
            [0.4639031309079656, 0.1341811262664123, 0],
            [0.4639031309079656, 0.1341811262664123, 0],
            [0.5492843723604893, 0.2408726652638506, 0],
            [0.5492843723604893, 0.2408726652638506, 0],
            [0.5891289517053337, 0.3233807625315421, 0],
            [0.5891289517053337, 0.3233807625315421, 0],
            [0.6289735310497236, 0.4528317995527687, 0]
		]
    }
    
    this.open_paren_max = function(){return 0.2270601840664312}
	this.open_paren = function(){
    	return [
            [0.2184913878927545, 1.002428271979383, 0],
            [0.1028190968158924, 0.8000289024910358, 0],
            [0.1028190968158924, 0.8000289024910358, 0],
            [0.0299907866083231, 0.5801849749448281, 0],
            [0.0299907866083231, 0.5801849749448281, 0],
            [0.0014302851186584, 0.3974560220961081, 0],
            [0.0014302851186584, 0.3974560220961081, 0],
            [-1e-16, 0.3146588091860992, 0],
            [-1e-16, 0.3146588091860992, 0],
            [0.0257063885214847, 0.1476325725682415, 0],
            [0.0257063885214847, 0.1476325725682415, 0],
            [0.1028190968158924, -0.052225006990497, 0],
            [0.1028190968158924, -0.052225006990497, 0],
            [0.2270601840664312, -0.2834919525564458, 0]
		]
    }
    
    this.close_paren_max = function(){return 0.217061102774096}
	this.close_paren = function(){
    	return [
            [0.0042843980868383, 1.002428271979383, 0],
            [0.0885388460710601, 0.872834908180053, 0],
            [0.0885388460710601, 0.872834908180053, 0],
            [0.1599400997947668, 0.7043827610825844, 0],
            [0.1599400997947668, 0.7043827610825844, 0],
            [0.2070652501161021, 0.5373584912374696, 0],
            [0.2070652501161021, 0.5373584912374696, 0],
            [0.217061102774096, 0.3603390806254225, 0],
            [0.217061102774096, 0.3603390806254225, 0],
            [0.1956423409742455, 0.163335288798649, 0],
            [0.1956423409742455, 0.163335288798649, 0],
            [0.1385213379949163, -0.0179638200245194, 0],
            [0.1385213379949163, -0.0179638200245194, 0],
            [-1e-16, -0.289201494792664, 0]
		]
    }
    
    this.at_sign_max = function(){return 1.168746874209929}
	this.at_sign = function(){
    	return [
            [0.7932308435476187, 0.4010986898617262, 0],
            [0.7622876097386069, 0.5487246768686305, 0],
            [0.7622876097386069, 0.5487246768686305, 0],
            [0.7032165114734852, 0.6274585366056158, 0],
            [0.7032165114734852, 0.6274585366056158, 0],
            [0.6216450588246261, 0.6836964459113802, 0],
            [0.6216450588246261, 0.6836964459113802, 0],
            [0.5372582368228649, 0.6851026886599243, 0],
            [0.5372582368228649, 0.6851026886599243, 0],
            [0.4303710604364568, 0.6527650057611823, 0],
            [0.4303710604364568, 0.6527650057611823, 0],
            [0.3389522723206682, 0.551535195592976, 0],
            [0.3389522723206682, 0.551535195592976, 0],
            [0.2911329655650405, 0.4418698957057928, 0],
            [0.2911329655650405, 0.4418698957057928, 0],
            [0.2756613486605346, 0.3293940770947188, 0],
            [0.2756613486605346, 0.3293940770947188, 0],
            [0.2812888587324522, 0.2267580241779683, 0],
            [0.2812888587324522, 0.2267580241779683, 0],
            [0.3066045824695465, 0.1592721396565935, 0],
            [0.3066045824695465, 0.1592721396565935, 0],
            [0.3600481706622958, 0.086161284141042, 0],
            [0.3600481706622958, 0.086161284141042, 0],
            [0.4289633757600058, 0.0467943542727767, 0],
            [0.4289633757600058, 0.0467943542727767, 0],
            [0.4936587554622492, 0.0439818687752336, 0],
            [0.4936587554622492, 0.0439818687752336, 0],
            [0.5836698589015868, 0.0777257944225198, 0],
            [0.5836698589015868, 0.0777257944225198, 0],
            [0.6835282978083086, 0.1691138721236598, 0],
            [0.6835282978083086, 0.1691138721236598, 0],
            [0.7819790520381247, 0.2900271472264535, 0],
            [0.7819790520381247, 0.2900271472264535, 0],
            [0.8410469216684504, 0.7174403715582116, 0],
            [0.8410469216684504, 0.7174403715582116, 0],
            [0.7580677843431403, 0.0974092593566525, 0],
            [0.7580677843431403, 0.0974092593566525, 0],
            [0.774947085924552, 0.0678840619554535, 0],
            [0.774947085924552, 0.0678840619554535, 0],
            [0.829798358794207, 0.0510130825184092, 0],
            [0.829798358794207, 0.0510130825184092, 0],
            [0.9212139182756544, 0.0763195516739757, 0],
            [0.9212139182756544, 0.0763195516739757, 0],
            [1.035136289409976, 0.1620826583809389, 0],
            [1.035136289409976, 0.1620826583809389, 0],
            [1.113895601340274, 0.2886209044779093, 0],
            [1.113895601340274, 0.2886209044779093, 0],
            [1.150463116586408, 0.3800089821790493, 0],
            [1.150463116586408, 0.3800089821790493, 0],
            [1.157495082700435, 0.4812387923477104, 0],
            [1.157495082700435, 0.4812387923477104, 0],
            [1.153275257305423, 0.5937146109583296, 0],
            [1.153275257305423, 0.5937146109583296, 0],
            [1.105459179184137, 0.7160341288096675, 0],
            [1.105459179184137, 0.7160341288096675, 0],
            [1.037948430128537, 0.8017972355166307, 0],
            [1.037948430128537, 0.8017972355166307, 0],
            [0.9605968028751448, 0.8608495970922263, 0],
            [0.9605968028751448, 0.8608495970922263, 0],
            [0.8748022961964778, 0.9142750209009022, 0],
            [0.8748022961964778, 0.9142750209009022, 0],
            [0.7524435029060186, 0.9550481935177118, 0],
            [0.7524435029060186, 0.9550481935177118, 0],
            [0.6413332724898027, 0.9705148969794095, 0],
            [0.6413332724898027, 0.9705148969794095, 0],
            [0.5147546538043315, 0.9606731645123431, 0],
            [0.5147546538043315, 0.9606731645123431, 0],
            [0.3909881758369664, 0.9283354816136011, 0],
            [0.3909881758369664, 0.9283354816136011, 0],
            [0.2855086841274641, 0.8791268192782695, 0],
            [0.2855086841274641, 0.8791268192782695, 0],
            [0.1983097214066873, 0.804609721013719, 0],
            [0.1983097214066873, 0.804609721013719, 0],
            [0.1068909332908987, 0.6865089314084685, 0],
            [0.1068909332908987, 0.6865089314084685, 0],
            [0.046412150349326, 0.5641894135571306, 0],
            [0.046412150349326, 0.5641894135571306, 0],
            [0.005628038342067, 0.3968799616160936, 0],
            [0.005628038342067, 0.3968799616160936, 0],
            [5.282701494e-7, 0.285808418980821, 0],
            [5.282701494e-7, 0.285808418980821, 0],
            [0.0281283927262592, 0.1170927242912398, 0],
            [0.0281283927262592, 0.1170927242912398, 0],
            [0.1082953893330085, -0.0220977729971423, 0],
            [0.1082953893330085, -0.0220977729971423, 0],
            [0.2208100757908795, -0.1359818011299581, 0],
            [0.2208100757908795, -0.1359818011299581, 0],
            [0.3712999621717898, -0.2104969326213109, 0],
            [0.3712999621717898, -0.2104969326213109, 0],
            [0.5189744791993434, -0.2386158872739656, 0],
            [0.5189744791993434, -0.2386158872739656, 0],
            [0.6525850639992968, -0.241428372771054, 0],
            [0.6525850639992968, -0.241428372771054, 0],
            [0.8649581893638895, -0.2175281463640317, 0],
            [0.8649581893638895, -0.2175281463640317, 0],
            [0.9605968028751448, -0.1809717352196571, 0],
            [0.9605968028751448, -0.1809717352196571, 0],
            [1.08717542156107, -0.096614871261238, 0],
            [1.08717542156107, -0.096614871261238, 0],
            [1.168746874209929, 0.0074274244040566, 0]
		]
    }
    
    this.open_square_bracket_max = function(){return 0.2010503038945898}
	this.open_square_bracket = function(){
    	return [
            [0.1987676592470961, 0.951484196674997, 0],
            [0, 0.951484196674997, 0],
            [0, 0.951484196674997, 0],
            [0, -0.2247247730763178, 0],
            [0, -0.2247247730763178, 0],
            [0.2010503038945898, -0.2247247730763178, 0]
		]
    }
    
    this.close_square_bracket_max = function(){return 0.2010503038941351}
	this.close_square_bracket = function(){
    	return [
            [0.002282644647039, 0.951484196674997, 0],
            [0.2010503038941351, 0.951484196674997, 0],
            [0.2010503038941351, 0.951484196674997, 0],
            [0.2010503038941351, -0.2247247730763178, 0],
            [0.2010503038941351, -0.2247247730763178, 0],
            [-4.547e-13, -0.2247247730763178, 0]
		]
    }
    
    this.underscore_max = function(){return 0.8051730345869145}
	this.underscore = function(){
    	return [
        	[0, -0.2308847063470552, 0],
 			[0.8051730345869145, -0.2308847063470552, 0]
        ]
    }
    
    this.open_curly_brace_max = function(){return 0.4499844872361791}
	this.open_curly_brace = function(){
    	return [
            [0.4499844872361791, 0.9672183812747476, 0],
            [0.3511043246071494, 0.961487204534265, 0],
            [0.3511043246071494, 0.961487204534265, 0],
            [0.3095453403011561, 0.9428638302872656, 0],
            [0.3095453403011561, 0.9428638302872656, 0],
            [0.2808815225048419, 0.917077468501489, 0],
            [0.2808815225048419, 0.917077468501489, 0],
            [0.2608187872283451, 0.8812625308066941, 0],
            [0.2608187872283451, 0.8812625308066941, 0],
            [0.2507874195903241, 0.5976086176158475, 0],
            [0.2507874195903241, 0.5976086176158475, 0],
            [0.2393225381988486, 0.5202475654853203, 0],
            [0.2393225381988486, 0.5202475654853203, 0],
            [0.2063646364122178, 0.4486176900952758, 0],
            [0.2063646364122178, 0.4486176900952758, 0],
            [0.1662359372244281, 0.4070735424327411, 0],
            [0.1662359372244281, 0.4070735424327411, 0],
            [0.1089147589018466, 0.3769878147047763, 0],
            [0.1089147589018466, 0.3769878147047763, 0],
            [0.0530238656974688, 0.3626618396267674, 0],
            [0.0530238656974688, 0.3626618396267674, 0],
            [-1e-16, 0.3554988520879903, 0],
            [-1e-16, 0.3554988520879903, 0],
            [0.1318445216847976, 0.3383092554129377, 0],
            [0.1318445216847976, 0.3383092554129377, 0],
            [0.1705364784843368, 0.3168202927956969, 0],
            [0.1705364784843368, 0.3168202927956969, 0],
            [0.2063646364122178, 0.2810053551004473, 0],
            [0.2063646364122178, 0.2810053551004473, 0],
            [0.2292911705603728, 0.2380274298664205, 0],
            [0.2292911705603728, 0.2380274298664205, 0],
            [0.2450565932117569, 0.1721267644436609, 0],
            [0.2450565932117569, 0.1721267644436609, 0],
            [0.2507874195903241, 0.077576115638081, 0],
            [0.2507874195903241, 0.077576115638081, 0],
            [0.2536544470967783, -0.0141089447977123, 0],
            [0.2536544470967783, -0.0141089447977123, 0],
            [0.2608187872283451, -0.1143907703437747, 0],
            [0.2608187872283451, -0.1143907703437747, 0],
            [0.2765842098797293, -0.1702628598575159, 0],
            [0.2765842098797293, -0.1702628598575159, 0],
            [0.2906513707421254, -0.2066147266020692, 0],
            [0.2906513707421254, -0.2066147266020692, 0],
            [0.3473978521101344, -0.2391923558159163, 0],
            [0.3473978521101344, -0.2391923558159163, 0],
            [0.4112925304366399, -0.2418927352475606, 0],
            [0.4112925304366399, -0.2418927352475606, 0],
            [0.4479730478933561, -0.2414403774402984, 0]
		]
    }
    
    this.close_curly_brace_max = function(){return .4499844872357244}
	this.close_curly_brace = function(){
    	return [
            [-4.547e-13, 0.9676707390820098, 0],
            [0.0988801626285749, 0.9619395623415272, 0],
            [0.0988801626285749, 0.9619395623415272, 0],
            [0.1404391469345683, 0.9433161880945277, 0],
            [0.1404391469345683, 0.9433161880945277, 0],
            [0.1691029647308824, 0.9175298263087512, 0],
            [0.1691029647308824, 0.9175298263087512, 0],
            [0.1891657000073792, 0.8817148886139563, 0],
            [0.1891657000073792, 0.8817148886139563, 0],
            [0.1991970676454002, 0.5980609754231097, 0],
            [0.1991970676454002, 0.5980609754231097, 0],
            [0.2106619490368757, 0.5206999232925825, 0],
            [0.2106619490368757, 0.5206999232925825, 0],
            [0.2436198508235066, 0.4490700479025378, 0],
            [0.2436198508235066, 0.4490700479025378, 0],
            [0.2837485500112962, 0.4075259002400032, 0],
            [0.2837485500112962, 0.4075259002400032, 0],
            [0.3410697283338777, 0.3774401725120384, 0],
            [0.3410697283338777, 0.3774401725120384, 0],
            [0.3969606215382555, 0.3631141974340295, 0],
            [0.3969606215382555, 0.3631141974340295, 0],
            [0.4499844872357244, 0.3559512098952524, 0],
            [0.4499844872357244, 0.3559512098952524, 0],
            [0.3181399655509267, 0.3387616132201998, 0],
            [0.3181399655509267, 0.3387616132201998, 0],
            [0.2794480087513875, 0.3172726506029591, 0],
            [0.2794480087513875, 0.3172726506029591, 0],
            [0.2436198508235066, 0.2814577129077094, 0],
            [0.2436198508235066, 0.2814577129077094, 0],
            [0.2206933166753515, 0.2384797876736826, 0],
            [0.2206933166753515, 0.2384797876736826, 0],
            [0.2049278940239674, 0.172579122250923, 0],
            [0.2049278940239674, 0.172579122250923, 0],
            [0.1991970676454002, 0.0780284734453432, 0],
            [0.1991970676454002, 0.0780284734453432, 0],
            [0.196330040138946, -0.0136565869904502, 0],
            [0.196330040138946, -0.0136565869904502, 0],
            [0.1891657000073792, -0.1139384125365126, 0],
            [0.1891657000073792, -0.1139384125365126, 0],
            [0.1734002773559951, -0.1698105020502538, 0],
            [0.1734002773559951, -0.1698105020502538, 0],
            [0.1593331164935989, -0.2061623687948071, 0],
            [0.1593331164935989, -0.2061623687948071, 0],
            [0.10258663512559, -0.2387399980086542, 0],
            [0.10258663512559, -0.2387399980086542, 0],
            [0.0386919567990844, -0.2414403774402984, 0],
            [0.0386919567990844, -0.2414403774402984, 0],
            [0.0020114393423683, -0.2409880196330363, 0]
		]
    }
    
    this.tilde_max = function(){return 0.697088034771241}
	this.tilde = function(){
    	return [
            [0, 0.4602012982645647, 0],
            [0.0556003160918408, 0.498868056918127, 0],
            [0.0556003160918408, 0.498868056918127, 0],
            [0.0966685479420448, 0.5211063600768285, 0],
            [0.0966685479420448, 0.5211063600768285, 0],
            [0.1377400084265901, 0.5313709487550115, 0],
            [0.1377400084265901, 0.5313709487550115, 0],
            [0.1791504755424285, 0.5323976043005132, 0],
            [0.1791504755424285, 0.5323976043005132, 0],
            [0.2369914640325987, 0.525897419287503, 0],
            [0.2369914640325987, 0.525897419287503, 0],
            [0.272587160270632, 0.5152906120943044, 0],
            [0.272587160270632, 0.5152906120943044, 0],
            [0.3098715952492768, 0.5041805944539332, 0],
            [0.3098715952492768, 0.5041805944539332, 0],
            [0.4090579914824417, 0.4746250275674698, 0],
            [0.4090579914824417, 0.4746250275674698, 0],
            [0.4878628281217062, 0.4567850134330911, 0],
            [0.4878628281217062, 0.4567850134330911, 0],
            [0.5566553451053551, 0.4574694504635773, 0],
            [0.5566553451053551, 0.4574694504635773, 0],
            [0.6151808041263394, 0.4708120390041586, 0],
            [0.6151808041263394, 0.4708120390041586, 0],
            [0.6676525733109884, 0.4958077580135978, 0],
            [0.6676525733109884, 0.4958077580135978, 0],
            [0.697088034771241, 0.5197571537473779, 0]
		]
    }
    
    this.caret_max = function(){return 0.5844795491948674}
	this.caret = function(){
    	return [
            [0, 0.4689141029866733, 0],
            [0.226724406069934, 1.002427586737184, 0],
            [0.226724406069934, 1.002427586737184, 0],
            [0.4596251900902644, 0.4717324888028998, 0]
		]
    }
    
    this.greater_than_max = function(){return 0.6580958149561412}
	this.greater_than = function(){
    	return [
            [0, 0.7688096282299739, 0],
            [0.6580958149561412, 0.4903676636881756, 0],
            [0.6580958149561412, 0.4903676636881756, 0],
            [0, 0.2162525999115132, 0]
		]
    }
    
    this.less_than_max = function(){return 0.6653118132412601}
	this.less_than = function(){
    	return [
            [0.6653118132412601, 0.7630391160282671, 0],
            [0, 0.4975798205541651, 0],
            [0, 0.4975798205541651, 0],
            [0.6653118132412601, 0.2104820877093516, 0]
		]
    }
    
    this.vertical_bar_max = function(){return 0.1}
	this.vertical_bar = function(){
    	return [
        	[0, 1.002428271979383, 0],
 			[0, -0.2931547086734412, 0]
        ]
    }
    
    this.backtick_max = function(){return 0.1}
	this.backtick = function(){
    	return [
            [-4.262472117e-7, 0.9783775842390269, 0],
            [0.1613786472882168, 1.021618976668129, 0],
            [0.1613786472882168, 1.021618976668129, 0],
            [0.1023126325067523, 0.9193136380660079, 0],
            [0.1023126325067523, 0.9193136380660079, 0],
            [0.0590707348497972, 1.08069459713743, 0],
            [0.0590707348497972, 1.08069459713743, 0],
            [-4.262472117e-7, 0.9783775842390269, 0],
            [-4.262472117e-7, 0.9783775842390269, 0],
            [0.0303659698045635, 0.9053332840029497, 0],
            [0.0303659698045635, 0.9053332840029497, 0],
            [0.0504890803975258, 0.870471174210138, 0],
            [0.0504890803975258, 0.870471174210138, 0],
            [0.0728674888371472, 0.8373718699124381, 0],
            [0.0728674888371472, 0.8373718699124381, 0],
            [0.1135027762784375, 0.7902839430638409, 0],
            [0.1135027762784375, 0.7902839430638409, 0],
            [0.1450248038812703, 0.7584781654337789, 0]
		]
    }
    
}
module.exports.txt = txt

