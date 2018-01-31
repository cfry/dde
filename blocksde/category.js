/* Created by Fry on jan 4, 2018.
* The class BlockCategory has instance vars name, color a few others AND
* instance var block_classes, an array of subclasses of Block,
* each created by calling make_block_class.
* instances of those classes are created from choosing a block subclass name from
* the toolkit which calls make_and_draw_block_of_class
* */

var BlockCategory = class BlockCategory{
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