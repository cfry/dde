//describes an argument to a TalkCommand action function
globalThis.TalkParameter = class TalkParameter {
    constructor({
        name,
        type=new TalkTypeAny(),
        default_value= ""
    }){
        this.name = name
        this.type = type
        this.default_value = default_value
    }
}