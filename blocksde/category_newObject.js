newObject({name: "BlockCategory",
           color: "gray",
           block_types: [], //only non-empty for the lowest level of the category hierarchy
           add_block_type: function(block_type){
               for(let i in this.block_types){
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
            }
})

newObject({prototype: Root.BlockCategory,
           name: "Math",
           color: "#AAFFAA", //green
           block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "String",
            color: "#FFAAAA", //pink
            block_types: []
})

newObject({prototype: Root.BlockCategory,
            name: "misc",
            color: "#BBBBBB", //green
            block_types: []
})