globalThis.List = class List{
    static empty = null //the empty list
    static is_empty(lst) { return lst === List.empty }

    //Lisp's "cons"
    static make_pair(a_first, a_rest){
        return [a_first, a_rest]
    }

    //convert a bunch of args into a list. Lisp's "list"
    static make(...elts){
        if(elts.length === 0){
            return List.empty
        }
        else {
            return List.make_pair(elts[0], List.make(...elts.slice(1)))
        }
    }

    static length(lst){
        if(lst === List.empty){
            return 0
        }
        else {
            let len = List.length(List.rest(lst))
            return len + 1
        }
    }

    //Lisp's "car"
    static first(pair){
        return pair[0]
    }

    //Lisp's "cdr"
    static rest(pair){
        return pair[1]
    }

    //Lisp's replaca
    static replace_first(pair, value){
        pair[0] = value
        return pair
    }

    //Lisp's replacd
    static replace_rest(pair, value){
        pair[1] = value
        return pair
    }

    //convert a list into an array.
    static to_array(lst){
        if(lst === List.empty) { return []}
        else {
            let arr = List.to_array(List.rest(lst))
            arr.unshift(List.first(lst))
            return arr
        }
    }
}