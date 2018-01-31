/* Created by Fry on jan 4, 2018.
* The class BlockCategory has instance vars name, color a few others AND
* instance var block_classes, an array of subclasses of Block,
* each created by calling make_block_class.
* instances of those classes are created from choosing a block subclass name from
* the toolkit which calls make_and_draw_block_of_class
* */
/*$(document).ready(function () {
   new Workspace(400, 400)
})*/


//draws the block classes menu
function category_mouseover(cat_name){
    let the_html = " <b>Block Classes</b><br/>"
    let cat = BlockCategory.name_to_category(cat_name)
    for(let a_kind of cat.kinds){
        the_html +=
            '<div class="toolkit_class_name" ' +
            `onclick="make_and_draw_block_of_kind('`  + a_kind.kind_name +
            `')" style="width:108px; background-color:` + cat.color + ";" +
            `">` +
            a_kind.display_label() +
            "</div>"
    }
    block_class_menu_id.innerHTML     = the_html
    category_menu_id.style.display    = "block"
    block_class_menu_id.style.display = "block"
}

class BlockCategory{
    constructor(name, color="gray", kinds=[]){
        this.name   = name
        this.color  = color
        this.kinds  = kinds
        BlockCategory.add_category(this)
    }
    //if existing block_class, replace it with new block_class preserivng order of block_classes
    //otherwise, just add it to the end of block_classes
    add_kind(kind){
        for(let a_kind_index in this.kinds){
            let a_kind = this.kinds[a_kind_index]
            if (a_kind.kind_name == kind.kind_name) {
                this.kinds[kind_index] = kind //we are effectively "redefining" the kind
                return
            }
        }
        this.kinds.push(kind) //brand new kind with unused name
    }

    static name_to_category(name){
        for(let cat of BlockCategory.categories){
            if (cat.name == name) {return cat}
        }
        return null
    }
    static add_category(new_cat){
        let cat = BlockCategory.name_to_category(name)
        if (cat)  { //replaces old cat with new cat, preserving cat order of BlockCategory.categories
            for (let a_cat_index in BlockCategory.categories){
                let a_cat = BlockCategory.categories[a_cat_index]
                if (a_cat.name == "name") {
                    BlockCategory.categories[a_cat_index] = new_cat //wipes out all the block classes in the prev cat
                    return
                }
            }
        }
        else {  BlockCategory.categories.push(new_cat) }
    }
}

BlockCategory.categories = []

new BlockCategory("Math",   "#AAFFAA") //green
new BlockCategory("String", "#FFAAAA") //pink