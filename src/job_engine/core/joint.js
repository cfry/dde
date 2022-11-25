//model name can come from Default.Make_ins file property of "Dexter Model"
//or from Dexter.dexter0.defaults["Dexter Model"]

globalThis.DexterModel = class DexterModel {
    static models = []
    constructor ({name="required", joints=[]}){
        this.name = name,
        this.joints = joints
        DexterModel[name] = this ////replace old model of same name (if any).
        let brand_new_model = true
        for(let i = 0; i < DexterModel.models.length; i++){
            let model = DexterModel.models[i]
            if(model.name === name) {
                DexterModel.models[i] = this //replace old model of same name
                brand_new_model = false
                break
            }
        }
        if(brand_new_model) {
            DexterModel.models.push(this)
        }
    }
}

/*
DexterModel.models           //array of all defined models
DexterModel.models[0].name   //name of the first model
DexterModel.models[0].joints //array of Joint instances for the first model
DexterModel.HDI              //the HDI model instance.
DexterModel.HDI.name => "HDI"
DexterModel.HDI.J1.motor.torque
*/

globalThis.Joint = class Joint{
    constructor ({name= "required", gear_ratio = 1, offset = 0, motor,
                     max_boundry, min_boundry}){
        this.name       = name
        this.gear_ratio = gear_ratio
        this.motor      = motor
        this.offset     = offset
    }
}

/*
myjoint.name
myjoint.motor.max_rpm = 4444
 */
//default motor xl320
globalThis.Motor = class Motor{
    static motors = []
    constructor({name, max_rpm, torque, degrees_per_step, volts, weight}){
        this.name = name,
        Motor[name] = this ////replace old model of same name (if any).
        let brand_new_motor = true
        for(let i = 0; i < Motor.motors.length; i++){
            let mot = Motor.motors[i]
            if(mot.name === name) {
                Motor.motors[i] = this //replace old model of same name
                brand_new_motor = false
                break
            }
        }
        if(brand_new_motor) {
            Motor.motors.push(this)
        }
    }
}

/*
Motor.m320.max_rpm

 */