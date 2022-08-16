console.log("top of category_newObject")
import {newObject, Root} from "../job_engine/core/object_system.js"
//import {make_html} from "../job_engine/core/html_db.js" //not needed in dde4

function blocks_category_init() {
newObject({name: "BlockCategory",
           color: "gray",
           block_types: [], //only non-empty for the lowest level of the category hierarchy
           add_block_type: function(block_type){
               for(let i = 0; i <  this.block_types.length; i++){
                   let bt = this.block_types[i]
                   if (block_type.name == bt.name ) {
                       this.block_types[i] = block_type //we are effectively "redefining" the kind
                       return
                   }
               }
               this.block_types.push(block_type)
           },
           add_block_type_header: function (a_string){
               this.block_types.push(a_string)
           },
           name_to_category: function(name){
                if(globalThis.debug_name_to_category) { debugger }
                for(let cat of this.subObjects()){
                    if (cat.name == name) {return cat}
                    else {
                        let nested_cat = cat.name_to_category(name)
                        if(nested_cat) {return nested_cat }
                    }
                }
                return null
            },
           category_mouseover: function(cat_name){
                let the_html = " <b>Block Types</b><br/>"
                let cat = Root.BlockCategory.name_to_category(cat_name)
                for(let bt of cat.block_types){
                    the_html +=
                        ((typeof(bt) == "string") ? //header
                            make_html("div", {}, bt) :
                        '<div class="toolkit_type_name"' +
                        ' onclick="' + bt.objectPath() + '.make_and_draw_block(150, 70)"' +
                        ' draggable="true"' +
                        ' ondragstart="block_type_menu_dragstart_handler(event)"' +
                        ' ondrag="block_type_menu_drag_handler(event)"' +
                        ' data-block-type="' + bt.objectPath() + '"' +
                        ' style="padding-left:10px; width:108px; background-color:' + cat.color + ';">' +
                        bt.display_label +
                        "</div>")
                }
                block_type_menu_id.innerHTML     = the_html
                category_menu_id.style.display   = "block"
                block_type_menu_id.style.display = "block"
            }
})

newObject({prototype: Root.BlockCategory,
            name: "Misc",
            color: "#DDDDDD",
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "Logic",
            color: "#AAAAFF",
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "Math",
            color: "#AAFFAA", //green
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "Array",
            color: "#ffb108",
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "String",
            color: "#FFAAAA", //pink
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "Object",
            color: "#8eceff",
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "Control",
            color: "#99ffd7",
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "Job",
            color: "#4cecff", //green
            block_types: []
})
}

globalThis.blocks_category_init = blocks_category_init



