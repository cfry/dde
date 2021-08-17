/**
 * Created by Fry on 4/30/16.
 */
//rootObject.name = "rootObject" //its undefined before doing this, but broken jQuery prevents me from doing this
/* js won't let me do this as even though "name" is undefined, its a read-only property. too bad.
Object.defineProperty(Object.prototype, 'name', {
    enumerable : false,
    value : "rootObject"
})
*/
import {shouldnt, function_param_names, is_iterator, last,
        starts_with_one_of, stringify_value_sans_html, value_of_path} from "./utils.js"

function ob_sys_is_class(obj){
    return ((typeof(obj) == "function") && obj.toString().startsWith("class "))
}

export var Root = {name: "Root"} //"root" is an old node,js global that's been depricated but still defined. I decidd to steer clear of it by using capitalied Root.

//window.Root = Root //if I don't to this, value_of_path fails since window["rootObjject"] fails
//rootObject.name = "rootObject" //errors if I do this. the error happens in Jquery on something
                               //that looks very unlrelated, in ready, when seting the operating_system variable.
                               //mysterious. try again once electron is up.
                               //BUT search below for rootObject to see the solution.

    /* User can pass as many property_objects as they like.
     None will be modified by this fn.
     Properties from all will be combined in to one object.
     If there are duplicates, the last one wins.
     You might want a different winner so you can reorder the
     property_objects, but if there is a conflict in ordering,
     you can add an extra property_object to the end to
     ensure a win for a particular property. For instance
     var myboat = {prototype:boat, color:white}
     var my_fav_colors = {prototype:color_pallette, color:blue, trim:green},
     newObject(myboat, mycolors)
     Here we want to make an instance of myboat,
     BUT we want to over-ride the default color of "white" for a myboat,
     and use my_fav_colors to get the color from.
     If we just passed those 2 classes to newObject, we would indeed get
     a color of blue, however we'd make a color_pallette, not a boat.
     To fix that, we add an extra properties object on the end
     whose job is simply to over-ride the prototype in mycolors.
     newObject(myboat, mycolors, {prototype: boat})
     If no properties object has a prototype property, we use rootObject
     as the default.
     */

export function newObject(...property_objects){
    property_objects.unshift({}) //put new obj on front as assign mungs the first arg and if first arg is used elsewhere, this would be bad.
    let properties = Object.assign(...property_objects)
    let prototype
    if (properties.hasOwnProperty("prototype")){
        prototype = properties.prototype
        delete properties.prototype
    }
    if (!prototype){ prototype = Root }
    else if (typeof(prototype) == "string"){
        var new_prototype = value_of_path(prototype)
        if ((new_prototype == null) || (typeof(new_prototype) != "object")){
            throw new Error("In a call to newObject, failed to resolve: " + prototype +
                " into the prototype object.")
        }
        else {prototype = new_prototype}
    }
    if (!prototype) { //no prototype arg passed and no prototype property in properties
        prototype = Root
    }
    if (properties.hasOwnProperty("name")){
        const name_val = properties.name
        if (name_val) {
            if (typeof(name_val) != "string") {
                dde_error("newObject called with name: " + name_val + " but that is not a string. Names must be strings.")
            }
            //else OK as is
        }
        else { //name is null or undefined so just get rid of it. IF we don't, it will cause a bad bug
            delete properties.name
        }
    }
    var result
    if(ob_sys_is_class(prototype)){
        return new prototype(properties) //only works when the class accepts 1 literal object in its constructor
        //if (prototype == Job) {
        //return new Job(properties) //weak as hell
        //result = Reflect.construct(prototype, properties) //errors too
        // result = new (Function.prototype.bind.call(prototype, properties)) //errors
        //}
    }
    else if (ob_sys_is_class(prototype.constructor)){ //ie prototype is a job instance
        //we are going to call effectively new Job(props)
        //so we've got to get the class of prototype in its "constructor" prop,
        //then we have to fill in the defaults of the args to that class's
        //constructor params with values from the actual prototype.
        //
        var class_param_names = function_param_names(prototype.constructor)
        properties = Object.assign({}, properties); //make a copy
        for(let pname of class_param_names){
            if (!(properties.hasOwnProperty(pname))){ //props doesn't have a necessary arg so inherit it from the prototype
                var inherited_val
                if ((pname == "do_list") && (prototype.constructor == Job)){ //special hack for Job's do_list because
                    //a running job modifies its do_list
                    //so we want to use the orig.
                    inherited_val = prototype.orig_args.do_list
                }
                else {inherited_val = prototype[pname] }
                properties[pname] = inherited_val
            }
        }
        return new prototype.constructor(properties) //only works when the class accepts 1 literal object in its constructor
    }
    else { //not related to classes at all, ie a normal dobject object.
        result = Object.assign(Object.create(prototype), properties)
        if (properties.hasOwnProperty("name")){prototype[properties.name] = result}
        else if(prototype.name) {//we don't want to inherit so block inheritance
            result.name = undefined
        }
        result.prototype = prototype //commenting this out doesn't get rid of jquery bug, but it has a different one.
        result.constructor() //note this is called even on the obj that defines it! That's true prototype
        //it is never passed args but "this" inside it is the new obj.
        return result
    }
}

Object.defineProperty(Object, 'isNewObject',{
    enumerable : false,
    value : function(obj, require_name_in_prototype = true, permit_rootObject = true){
        if(obj == Root) {
            if (permit_rootObject) { return true}
            else { return false }
        }
        else if ((obj == undefined) || (obj == null) || (typeof(obj) != "object")) { return false }
        else {
            let proto
            try { proto = Object.getPrototypeOf(obj)}
            catch (err) { return false }
            if (proto){
               if (obj.hasOwnProperty("prototype") && (obj.prototype == proto)){
                   if (require_name_in_prototype){
                       if ((proto == Root) || proto.name) {
                            if ((obj.name == undefined) || (proto[obj.name] == obj)) { return true }
                            else { return false} //obj has a name but it isn't in the proto bound to obj
                       }
                       else { return false }
                   }
                   else { return true }
               }
               else { return false }
            }
            else { return false }
        }
    }
})

//jquery breaks if you add properties to Object prototype in the usual way. ie
// Object.prototype.subObjectsOf129 = function(){ ...}
//but http://stackoverflow.com/questions/21729895/jquery-conflict-with-native-prototype
//says the workaround for this jquery bug is to add non-enumerable props.
/* Nope, the below also screws up Jquery. Try in next version of Jquery perhaps.
Object.defineProperty(Object.prototype, 'name',{
    enumerable : false,
    configurable: true,
    writable: true,
    value: "rootObject"})
*/

Object.defineProperty(Object.prototype, 'subObjects',{
    enumerable : false,
    value : function(){
        var result = []
        for(var sub_ob_name in this){
            if(this.hasOwnProperty(sub_ob_name)){
                var sub_ob = this[sub_ob_name]
                if(Object.isNewObject(sub_ob) && (sub_ob.name == sub_ob_name)){
                   result.push(sub_ob)
                }
            }
        }
        return result
    }
})

Object.defineProperty(Object.prototype, 'isSubObject',{
    value : function(prototype_maybe){
        let pt = (prototype_maybe ? prototype_maybe : Object.getPrototypeOf(this))
        if (pt && //if this is rootObject, pt will be null and this will fail as it should.
                this.hasOwnProperty("name") &&
                this.name &&
                pt.hasOwnProperty(this.name) &&
                (pt[this.name] == this)) { return true } //note (null && 33)evals to null, not false
        else { return false }
    },
    enumerable : false
})

Object.defineProperty(Object.prototype, 'isLeafObject',{
    value : function(){
        let sub_objs = this.subObjects()
        return sub_objs.length == 0
    }
})

Object.defineProperty(Object.prototype, 'leafObjectNamed',{
    value : function(leaf_name){
        if(this.isLeafObject()){
            if(this.name == leaf_name) { return this }
            else { return null }
        }
        else {
            for(let subobj of this.subObjects()){
                let result = subobj.leafObjectNamed(leaf_name)
                if(result) { return result }
            }
            return null
        }
    }
})


//returns true if this == ancestor. This makes sense for prototype object system.
Object.defineProperty(Object.prototype, 'isA',{
    value : function(ancestor){
        if (this == ancestor) { return true }
        else if (Object.isNewObject(ancestor)) { return ancestor.isPrototypeOf(this) }
        else { return false }
    },
    enumerable : false
})

Object.defineProperty(Object.prototype, 'siblings',{
    value : function(include_this=false){
                if(this === Root) {
                    if (include_this){ return [Root] }
                    else { return [] }
                }
                else {
                    var pt
                    try{ pt = Object.getPrototypeOf(this)}
                    catch(e) { return [] }
                    if(pt) {
                        var result = pt.subObjects()
                        if (!include_this){
                            for(var i = result.length-1; i--;){ //traverse in reverse order is necessary!
                                if (result[i] === this) result.splice(i, 1);
                            }
                        }
                        return result
                    }
                    else { return [] }
                }
    },
    enumerable : false
})

// retruns true if all args are siblings
Object.defineProperty(Object, 'areSiblings',{
    value : function(...maybe_siblings){
        if(maybe_siblings.length < 2) { return true }
        else {
            var pt
            try{ pt = Object.getPrototypeOf(maybe_siblings[0])}
            catch(e) { return [] }
            if(pt) {
                for(var maybe_sib of maybe_siblings){
                    if (Object.getPrototypeOf(maybe_sib) !== pt) { return false }
                }
                return true
            }
            else { return false } //hmm, I'm being conservative here.
        }
    },
    enumerable : false
})


//climbs up the prototype chain from obj,
//returning the first obj that has prop_name, or null
Object.defineProperty(Object.prototype, 'inheritsPropertyFrom',{
    value : function(property_name){
                if(this == null) { return null }
                else if (this.hasOwnProperty(property_name)) {return this}
                else if (this === Root) { return null }
                else { return Object.getPrototypeOf(this).inheritsPropertyFrom(property_name) }
    },
    enumerable : false
})

/*fails because "this" needs to be the original obj, but
as we go up the stack we need to remember the previous obj
we came from which isn't 'this' after we've alread gone up one.*/
Object.defineProperty(Object.prototype, 'callPrototypeConstructor',{
    value : function(){
        let next_cons = newObect_find_next_constructor(this)
        if (next_cons) {
            //return Object.getPrototypeOf(this).constructor.apply(this)
            next_cons.apply(this)
        }
       // else {} //do nothing if there is no next_cons
    }
})

//callPrototypeConstructor is called within a constructor.
//we don't want to return THAT constuctor, but rather the
//next one up the change.
function newObect_find_next_constructor(obj, cur_constructor){
    let obj_of_cur_cons = obj.inheritsPropertyFrom("constructor")
    let next_ans_above_cur_cons = Object.getPrototypeOf(obj_of_cur_cons)
    if(next_ans_above_cur_cons) { return next_ans_above_cur_cons.constructor } //might be nothing
    else { return null }
    //if(!cur_constructor) { cur_constructor = obj.constructor }
    //let obj_cons = obj.constructor
    //if (!obj_constructor) { return null } //there is no next constructor
    //else if (obj_cons != cur_constructor) { return obj_cons }
    //else { return newObject_find_next_constructor(Object.getPrototypeOf(obj), cur_constructor) }
}

Object.defineProperty(Object.prototype, 'normal_keys',{
    enumerable : false,
    value : function(include_inherited=false,
                     include_functions=false,
                     include_subobject_names=false,
                     include_name_and_prototype=false){
        return this.normal_keys_aux(include_inherited,  //maybe should be true
                                    include_functions,
                                    include_subobject_names,
                                    include_name_and_prototype,
                                    [])
    }

})

Object.defineProperty(Object.prototype, 'normal_keys_aux',{
    enumerable : false,
    value : function(include_inherited,  //maybe should be true
                     include_functions,
                     include_subobject_names,
                     include_name_and_prototype,
                     result){
        if (this == Root){ return result }
        else {
            for(let key of Object.getOwnPropertyNames(this)){
                if (!result.includes(key)) {
                   let val = this[key]
                   if (((typeof(val) != "function") || include_functions) &&
                       (!val.isSubObject() || include_subobject_names) &&
                       (((key != "name") && (key != "prototype")) || include_name_and_prototype)){
                        result.push(key)
                    }
                }
            }
            if (include_inherited) {
                return Object.getPrototypeOf(this).normal_keys_aux(include_inherited,  //maybe should be true
                                            include_functions,
                                            include_subobject_names,
                                            include_name_and_prototype,
                                            result)
            }
            else { return result }
        }
    }
})


//result array has Root first
Object.defineProperty(Object.prototype, 'ancestors',{
    value : function(include_self=false){
                if(this == Root){
                    if(include_self) { return [this] }
                    else { return [] }
                }
                else {
                    var obj = this
                    if (!include_self) { obj = Object.getPrototypeOf(obj) }
                    var result = obj.ancestors_of_aux([])
                    return result
                }
    },
    enumerable : false
})

Object.defineProperty(Object.prototype, 'ancestors_of_aux',{
    value : function(result){
        if (this == null){ return result }
        else {
            result.unshift(this) //push onto front of array, order is top of ancestors first
            if (this == Root) { return result } //must do this becasue ancestors_of_axu not on this's prototype
            return Object.getPrototypeOf(this).ancestors_of_aux(result)
        }
    },
    enumerable : false
})

Object.defineProperty(Object, 'allCommonAncestors',{
    value : function(...objects){
        let result = []
        for(let obj of objects){
            var ans = obj.ancestors()
            if(result.length == 0) { result = ans }
            else {
                for(let i = 0; i < result.length; i++){
                    if(result[i] !== ans[i]) { result = result.slice(0, i)}
                }
            }
        }
        return result
    },
    enumerable : false
    })

Object.defineProperty(Object, 'lowestCommonAncestor',{
    value : function(...objects){
        let ans = Object.allCommonAncestors(...objects)
        if(ans.length == 0) { return null }
        else{ return ans[ans.length - 1] }
    },
    enumerable : false
})


//returns a string of a path to "this", or null
//evaling the string should return "this" object.
Object.defineProperty(Object.prototype, 'objectPath',{
    value : function(){ return this.object_path_aux("") },
    enumerable : false
})

Object.defineProperty(Object.prototype, 'object_path_aux',{
    value : function(result){
        if (this == null) {return result} //usually never hits
        else if (this == Root) { return "Root" } //hits just once in the recursion
        else if (this.hasOwnProperty("name") && this.name){ //note obj could have name == undefined when we block inheritance.
            //var separator = ((result == "")? "" : ".")
            //result = this.name + separator + result //push onto front of path, order is top of ancestors first
            var proto = Object.getPrototypeOf(this)
            //if (proto == Root) {
             //  return "Root." + this.name
            //}
            //else {
                var result = proto.object_path_aux(result)
                if (result){ return result + "." +  this.name}
                else       { return null }
            //}
        }
        else { return null }
    } ,
    enumerable : false
})

//new_obj.toString errors without this fn
Root.toString = function(){
    const path = this.objectPath()
    if (path) { return path }
    else {
        const anses = this.ancestors(true) //include self
        let result = ""
        for(let ans of anses){
            if(ans === Root) { result = "Root" }
            else if (Object.hasOwnProperty("name") && ans.name){
                result +=  "." + ans.name
            }
            else { //no more named ancestors
                result = "An instance of: " + result
                break;
            }
        }
        return result
    }
}

// the printer!
// print_this=true, kid_levels="all" or non-neg-int, last_level_format="path"/"full"
/*hier arch printer, fails with refs up  tree
Object.defineProperty(Object.prototype, 'sourceCode',{
    value : function(print_object_values_as_strings=true, indent="  "){
        if (this == Root) { return "Root" }
        else {
            let proto = Object.getPrototypeOf(this)
            if (!proto) { throw new Error("Object.sourceCode passed this with no prototype: " + stringify_value(this))}
            else {
                let prop_names     = Object.getOwnPropertyNames(this)
                let proto_index    = prop_names.indexOf("prototype")
                proto_prop = prop_names.splice(proto_index, 1)
                prop_names = proto_prop.concat(prop_names) //move prototype to begin of list.
                let has_props      = prop_names.length != 0 //since newobjects will always have a prototype, I think this will always be true
                let last_prop_name = (has_props? prop_names[prop_names.length - 1] : undefined)
                let result = "newObject({\n"
                for(let prop_name of prop_names){
                   // let prefix
                   // if (prop_name == "prototype") { prefix = "{"}
                   // else                          { prefix = " "}
                    let val = this[prop_name]
                    let val_string
                    if (Object.isNewObject(val)){
                        if (print_object_values_as_strings || (prop_name == "prototype")) { val_string = val.objectPath() }
                        else {
                            val_string = val.sourceCode(false, indent + "  ")
                        }
                    }
                    else { val_string = stringify_value_sans_html(val) }
                    result += indent + prop_name + ": " + val_string + ((prop_name == last_prop_name)?
                                                                           "\n" +
                                                                           indent +
                                                                           "})" : ",\n")
                }
                return result
            }
        }
    } ,
    enumerable : false
})
*/
//flat list of obj def printer.
Object.defineProperty(Object.prototype, 'sourceCode',{
    value : function({include_this=true, include_subobjects=true, indent="", at_top_level=true}={}){
        if (this == Root) { return "Root" }
        else {
            let proto = Object.getPrototypeOf(this)
            if (!proto) { throw new Error("Object.sourceCode passed this with no prototype: " + stringify_value(this))}
            else {
                let prop_names     = Object.getOwnPropertyNames(this)
                let sub_objs = []
                let non_subobject_prop_names = ["prototype"]
                for(let prop_name of prop_names){
                    let val = this[prop_name]
                    if (prop_name === "prototype") {} //already is first in non_subobject_prop_names
                    else if(val && val.isSubObject(this)) { sub_objs.push(val) } //needed to check that val is not undefined in order for val.isSubject to be found
                    else { non_subobject_prop_names.push(prop_name) }
                }
                let result = ""
                if(include_this){
                    result = indent + "newObject({\n"
                    indent += "  "
                    for(let prop_name of non_subobject_prop_names){
                        let val = this[prop_name]
                        let val_string
                        if (Object.isNewObject(val)){ //whether its the prototype or some other random, non-subobject, just print its path
                            if (val.hasOwnProperty("name")) { //hits for prototype and possibly others, but no subobjects will even be tried here
                                val_string = val.objectPath()
                            }
                            else { val_string = val.sourceCode({include_this: true, include_subobjects: true, indent: indent + "  ", at_top_level: false}) }
                        }
                        else { val_string = stringify_value_sans_html(val) }
                        result += indent + prop_name + ": " + val_string + ((prop_name == last(non_subobject_prop_names))?
                            "\n" +
                            indent.substring(2) +
                            "})\n" : ",\n")
                    }
                }
                //all non-subojects printed, so the only thing left in this to print are subojects, if any
                if (include_subobjects){
                    let on_first_subobject = true
                    for (let sub_ob of sub_objs){
                        let comma_prefix = ((include_this || !on_first_subobject || !at_top_level) ? ", " : "")
                        result += comma_prefix + sub_ob.sourceCode({include_this: true, include_subobjects: true, indent: indent, at_top_level: false})
                        on_first_subobject = false
                    }
                }
                if (at_top_level) {
                    if (include_this){
                        if(include_subobjects && (sub_objs.length > 0)) { result = "[" + result + "\n][0]" } //wrap result in an array and return the first one a sthe result of evaling the source code returned.
                        else {} //only printing this, just leave the object src as is
                    }
                    else {
                        if(include_subobjects) { result = "[" + result + "]" }
                        else {}  //result is empty string so just leave it.
                    }
                }
                return result
            }
        }
    } ,
    enumerable : false
})
