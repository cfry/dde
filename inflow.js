var https = require('https')
var Inflow = class Inflow{}
Inflow.if_host       = "cloudapi.inflowinventory.com" //does not end in slash
Inflow.if_company_id = "set Inflow.if_company_id to your company inflow id."
Inflow.if_api_key    = "set Inflow.if_api_key to your company api (secret) key."

Inflow.get = function(path = "categories", callback = inspect){
    let req = https.request({hostname: Inflow.if_host,
            //port: port,
            path: "/" + Inflow.if_company_id + "/" + path,
            method: "GET",
            //responseType: "json", //doesn't work
            headers: {
                'Authorization': "Bearer " + this.if_api_key,
                'Content-Type': 'application/json',
                'Accept': 'application/json;version=2020-01-30'
            }
        },
        function(res){
            out("Inflow.get system callback received res: " + res)
            if(res.statusCode !== 200){
                dde_error("inflow.get path: " + path + " errored with statusCode: " + res.statusCode +
                    "<br/>Message: " + res.statusMessage)
            }
            let data_string = ""
            res.on('data', function(data){
                data_string += data.toString() //the url encoding is automatically decoded
            })
            res.on('end', function() {
                out("cb data_string: " + data_string)
                let ds_obj = JSON.parse(data_string)
                if(!path.includes("/")) {
                    Inflow[path] = ds_obj
                }
                callback(ds_obj)
            })})
    req.responseType = "json"
    req.on('error', (err) => {
        dde_error("Inflow.get for " + path + " errored with: " + err.message)
    })
    req.end()
}

//The body of the uuidv4() function from
//https://stackoverflow.com/questions/105034/how-to-create-guid-uuid
Inflow.make_guid = function(){
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

Inflow.put = function(path = "categories", put_data, callback = inspect){
    let req = https.request({hostname: Inflow.if_host,
            //port: port,
            path: "/" + Inflow.if_company_id + "/" + path,
            method: "PUT",
            //responseType: "json", //doesn't work
            headers: {
                'Authorization': "Bearer " + this.if_api_key,
                'Content-Type': 'application/json',
                'Accept': 'application/json;version=2020-01-30'
            }
        },
        function(res){
            out("Inflow.put system callback received res: " + res)
            if(res.statusCode !== 200){
                dde_error("inflow.put errored with statusCode: " + res.statusCode +
                    "<br/>Message: " + res.statusMessage)
            }
            let data_string = ""
            res.on('data', function(data){
                data_string += data.toString() //the url encoding is automatically decoded
            })
            res.on('end', function() {
                out("cb data_string: " + data_string)
                let ds_obj = JSON.parse(data_string)
                callback(ds_obj)
            })})
    req.responseType = "json"
    req.on('error', (err) => {
        dde_error("Inflow.put errored with: " + err.message)
    })
    let data_string = JSON.stringify(put_data)
    req.write(data_string)
    req.end()
}