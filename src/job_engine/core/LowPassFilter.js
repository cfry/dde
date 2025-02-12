globalThis.LowPassFilter = class LowPassFilter {
    constructor({array_length = 4} = {}) {
        this.array_length = array_length
        this.the_array = Array(array_length)
    }

    filter(val) {
        if(this.the_array[0] === undefined) {
            this.the_array.fill(val)
            return val  //since (sum / len) of all elts that are the same is val
        }
        this.the_array.shift() //get rid of old value
        this.the_array.push(val) //add new elt on end
        let sum = 0
        for(let val of this.the_array) {
            sum += val
        }
        let result = sum / this.array_length
        return result
    } //end of filter
} //end of class

/*
var my_filter = new LowPassFilter()
my_filter.filter(2)
my_filter.filter(3)
*/