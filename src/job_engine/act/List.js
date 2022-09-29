globalThis.List = class List{
    static empty = null //the empty list
    static is_empty(lst) { return lst === List.empty }

    static make_pair(a_first, a_rest){
        return [a_first, a_rest]
    }
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

    static first(pair){
        return pair[0]
    }
    static rest(pair){
        return pair[1]
    }
    static replace_first(pair, value){
        pair[0] = value
        return pair
    }
    static replace_rest(pair, value){
        pair[1] = value
        return pair
    }
    static to_array(lst){
        if(lst === List.empty) { return []}
        else {
            let arr = List.to_array(List.rest(lst))
            arr.unshift(List.first(lst))
            return arr
        }
    }
}