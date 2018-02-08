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
           name_to_category: function(name){
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
                        '<div class="toolkit_type_name" ' +
                        'onclick="' + bt.objectPath() + '.make_and_draw_block(150, 70)"' +
                        ' style="width:108px; background-color:' + cat.color + ';">&nbsp;' +
                        bt.display_label +
                        "</div>"
                }
                block_type_menu_id.innerHTML     = the_html
                category_menu_id.style.display   = "block"
                block_type_menu_id.style.display = "block"
            }
})

newObject({prototype: Root.BlockCategory,
    name: "misc",
    color: "#BBBBBB", //green
    block_types: []
})

newObject({prototype: Root.BlockCategory,
    name: "Logic",
    color: "#AAAAFF",
    block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "String",
            color: "#FFAAAA", //pink
            block_types: []
})

newObject({prototype: Root.BlockCategory,
    name: "Array",
    color: "#ffb108",
    block_types: []
})

newObject({prototype: Root.BlockCategory,
    name: "Math",
    color: "#AAFFAA", //green
    block_types: []
})

