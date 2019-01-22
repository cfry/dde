//after using this fn to define a global constant,
//foo: [ 42 doesn't error. however
//it doesn't set it either, just keeps the old value.
function define_global_constant(name, value) {
    Object.defineProperty(global, name, { value: value})
}

var units_data = {
length_units: {
_km: [ 1000,        "kilometer"],
_m:  [ 1,           "meter"],
_cm: [ 0.01,	    "centimeter"],
_mm: [ 0.001,	    "millimeter"],
_um: [ 0.000001,	"micron"],
_nm: [ 0.000000001,	"nanometer"],

_LY:    [ 9.461e+15,"light-year"],
_mile:  [ 1609.34,  "mile"],
_yard:  [ 0.9144,	"yard"],
_ft:    [ 0.3048,	"foot"],
_in:    [ 0.0254,	"inch"],
_mil:   [ 0.0000254,"thou"],
},

angle_units: {
_rev:    [ 360,			"revolution"],
_rad:    [ 180/Math.PI,	"radian"],
_deg:    [ 1,			"degree"],
_arcmin: [ 1/60,		"arcminute"],
_arcsec: [ 1/3600,		"arcsecond"]
},

duration_units: {
_week: [ 604800,        "week"],
_day:  [ 86400,			"day"],
_hour: [ 3600,			"hour"],
_min:  [ 60,			"minute"],
_s  :  [ 1,				"second"],
_ms :  [ 0.001,			"millisecond"],
_us :  [ 0.000001,		"microsecond"],
_ns :  [ 0.000000001,	"nanosecond"]
},

frequency_units: {
_Ghz: [ 1000000000,	"Gigahertz"],
_Mhz: [ 1000000,	"Megahertz"],
_khz: [ 1000,		"kilohertz"],
_hz : [ 1,			"hertz"]
},

mass_units: {
_kg: [ 1,				"kilogram"],
_g : [ 0.001,			"gram"],
_mg: [ 0.000001,		"milligram"],
_ug: [ 0.000000001,		"microgram"],
_ng: [ 0.000000000001,	"nanogram"],

_lb_mass: [ 0.453592,	"pound mass (lbm)"],
_slug	: [ 14.5939,	"slug"],
_blob   : [ 175.126836,	"blob"]
},

force_units: { //weight
_GN: [ 1000000000,	"Giga-Newton"],
_MN: [ 1000000,		"Mega-Newton"],
_kN: [ 1000,		"kilo-Newton"],
_N : [ 1,			"Newton"],
_mN: [ 0.001,		"milli-Newton"],
_uN: [ 0.000001,	"micro-Newton"],

_lb: [ 4.44822,		"pound force (lbf)"],
_oz: [ 4.44822/16,	"ounce"]
},

pressure_units: {
_GPa: [ 1000000000,	"GigaPascal"],
_Mpa: [ 1000000,	"MegaPascal"],
_kPa: [ 1000,		"kiloPascal"],
_Pa : [ 1,			"Pascal"],
_mPa: [ 0.001,		"milliPascal"],
_uPa: [ 0.000001,	"microPascal"],
_nPa: [ 0.000000001,"nanoPascal"],

_Gpsi: [ 6894760000000,"Giga-pounds per square inch"],
_Mpsi: [ 6894760000,	"Mega-pounds per square inch"],
_kpsi: [ 6894760,		"kilo-pounds per square inch"],
_psi : [ 6894.76,			"pounds per square inch"],
_mpsi: [ 6.89,		"milli-pounds per square inch"],
_upsi: [ 0.00689476,	"micro-pounds per square inch"],
_npsi: [ 0.00000689476,"nano-pounds per square inch"]
},

torque_units: {
_N_m:  [ 1,			        "Newton-meter"],
_N_cm: [ 0.001,		        "Newton-centimeter"],

_lbf_ft: [ 1.35581794,	    "pound-foot"],
_lbf_in: [ 1.35581794/12,	"pound-in"],
},

power_units: {
_GW: [ 1000000000,	"GigaWatt"],
_MW: [ 1000000,		"MegaWatt"],
_kW: [ 1000,		"kiloWatt"],
_W : [ 1,			"Watt"],
_mW: [ 0.001,		"milliWatt"],
_uW: [ 0.000001,	"microWatt"],
_nW: [ 0.000000001,	"nanoWatt"],

_HP: [ 745.7,		"horsepower"],
},

energy_units: {
_GJ: [ 1000000000,	"GigaJoule"],
_MJ: [ 1000000,		"MegaJoule"],
_kJ: [ 1000,		"kiloJoule"],
_J : [ 1,			"Joule"],
_mJ: [ 0.001,		"milliJoule"],
_uJ: [ 0.000001,	"microJoule"],
_nJ: [ 0.000000001,	"nanoJoule"],

_GWh: [3600000000000, "Gigawatt-hour"],
_MWh: [3600000000,	  "Megawatt-hour"],
_kWh: [3600000,		  "kilowatt-hour"],
_Wh:  [3600,		  "watt-hour"],
_mWh: [3.6,			  "milliwatt-hour"],
_uWh: [0.0036,		  "microwatt-hour"],
_nWh: [0.0000036,	  "nanowatt-hour"],

_kcal:   [ 4184,	  "kilocalorie"],
_cal:    [ 4.184,	  "calorie"],
_ft_lbf: [ 1.35582,	  "foot-pound"],
_BTU:    [ 1055.06,	  "British Thermal Unit"]
}
}

function pluralize_full_unit_name(unit_name){
    unit_name = replace_substrings(unit_name, "-", "_") //becuase dash looks like a minus sign to JavaScript.
    if      (unit_name == "foot")     { return "feet" }
    else if (unit_name == "inch")     { return "inches" }
    else if (unit_name.includes(" ")) { return unit_name }
    else                              { return unit_name + "s" }
}
module.exports.pluralize_full_unit_name = pluralize_full_unit_name


function init_units(){
    for(let series_name_core in units_data) {
        let ser = units_to_series(series_name_core, units_data[series_name_core])
        Series.instances.push(ser)
    }
    Series.instances.push(make_temperature_series())
    define_global_constant("_nbits_cf", 7754.73550222) //(nbits*seconds/degree)
      //don't put _nbits_cf into a series. Not for use by users.
      //it is used for converting S params: MaxSpeec StartSpeed, Accelleration
      //before sending this to Dexter hardware.
}

module.exports.init_units = init_units

function units_to_series(name, units_for_one_series){
    var the_keys = Object.keys(units_for_one_series)
    for(let a_unit_abrev of the_keys) {
        if(a_unit_abrev != "base") {
            let val = units_for_one_series[a_unit_abrev][0]
            define_global_constant(a_unit_abrev, val)
        }
    }
    return new Series({ id: "series_" + name + "_id",
                        array: the_keys,
                        menu_insertion_string: the_keys[0],
                        menu_sel_start: true,
                        menu_sel_end: null,
                        sample: the_keys[0],
                        base: units_for_one_series.base
                        })
}

function series_name_to_core_name(series_name){
    if (series_name.startsWith("series_")) { series_name = series_name.substring(7) }
    if (series_name.endsWith("_id")) {
       series_name = series_name.substring(0, series_name.length - 3)
    }
    return series_name
}

//series_name might or might not start with "series_" and end with "_id"
function unit_abbrev_to_full_name(series_name, abbrev){
   const core_name = series_name_to_core_name(series_name)
   const data = units_data[core_name]
   return data[abbrev][1]
}

module.exports.unit_abbrev_to_full_name = unit_abbrev_to_full_name


//returns an array of the abbrev and the full name of the unit
function series_name_to_unity_unit(series_name){
    let core_name = series_name_to_core_name(series_name)
    const data = units_data[core_name]
    for(let abbrev in data) {
        let val = data[abbrev]
        if (val[0] == 1) {
            return [abbrev, val[1]]
        }
    }
}
module.exports.series_name_to_unity_unit = series_name_to_unity_unit


//[123, 456].micron() => [0.000123, 0.000456]
//assumes input array has numbers in microns, and converts
//those numbers to meters.
Array.prototype.micron = function(){
    let result = []
    for(let elt of this) {
       if (typeof(elt) === "number") {
           elt = elt*_um
       }
       result.push(elt)
    }
    return result
}

//input array is in arcseconds, converts its angles to degrees.
Array.prototype.arcsec = function(){
    if(//Instruction.is_instruction_array(this) && //unnecessary.
    // we know its an array or this method wouldn't be called.
    //and if array is too short, a lookup returns undefined
        ["a", "P"].includes(this[Instruction.INSTRUCTION_TYPE])){
        let result = this.slice() //make copy
        for(let i = Instruction.INSTRUCTION_ARG0;
            i <= Instruction.INSTRUCTION_ARG4; i++){
            let orig_val = this[i]
            if (orig_val !== undefined){
                result[i] = orig_val * _arcsec
            }
        }
        return result
    }
    else {
        let result = []
        for(let elt of this) {
            if (typeof(elt) === "number") {
                elt = elt*_arcsec
            }
            result.push(elt)
        }
        return result
    }
}

//TEMPERATURE
function deg_c_to_c(deg_c){ return deg_c }
module.exports.deg_c_to_c = deg_c_to_c
function deg_f_to_c(deg_f){ return (deg_f-32)*5/9 }
module.exports.deg_f_to_c = deg_f_to_c
function deg_c_to_f(deg_c){ return deg_c*9/5+32 }
module.exports.deg_c_to_f = deg_c_to_f
function deg_k_to_c(deg_k){ return deg_k-273.15 }
module.exports.deg_k_to_c = deg_k_to_c
function deg_c_to_k(deg_c){ return deg_c+273.15 }
module.exports.deg_c_to_k = deg_c_to_k
function deg_f_to_k(deg_f){ return deg_c_to_k(deg_f_to_c(deg_f)) }
module.exports.deg_f_to_k = deg_f_to_k
function deg_k_to_f(deg_k){ return deg_c_to_f(deg_k_to_c(deg_k)) }
module.exports.deg_k_to_f = deg_k_to_f

function make_temperature_series(){
    return new Series({id:"series_temperature_id",  array: ["deg_c_to_c", "deg_f_to_c", "deg_c_to_f",
                           "deg_k_to_c", "deg_c_to_k", "deg_f_to_k", "deg_k_to_f"],
        menu_insertion_string:"deg_f_to_c()",  menu_sel_start:0, menu_sel_end:10, sample:"deg_f_to_c"})

}

function es_lint_names_of_units(){
    let result = ""
    for(let obj_name in units_data){
        for(let subobj_name in units_data[obj_name])
        result += '        "' + subobj_name + '": false,\n'
    }
    return result
}

var {replace_substrings} = require("./utils.js")
var {Instruction} = require("./instruction.js")
