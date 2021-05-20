const fs   = require('fs')
const get  = require('simple-get')
const pump = require('pump')
//const path = require('path')
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const client = require("scp2")

var FileTransfer = class FileTransfer {

    //path is the path to the folder that represents slash on Dexter
    //https://github.com/cthackers/adm-zip/wiki/ADM-ZIP-Introduction
    //create the zip file containing the update
    static zip_folder(path_to_folder_to_zip){
        let zip = new AdmZip();
        zip.addLocalFolder(path_to_folder_to_zip)
        zip.writeZip(path_to_folder_to_zip + ".zip")
    }

    //called by both encrypt_file and decrypt_file
    static process_password(passwd){
        return passwd.padEnd(32, passwd) //passwd must be 32 long
    }

    //encrypt the zip file containing the update
    //according to https://stackoverflow.com/questions/50963160/invalid-key-length-in-crypto-createcipheriv
    //the undocumented key-passwd length must be 32 chars.
    static encrypt_file(path_to_zip_file_to_encrypt, update_passwd){
        const algorithm = "aes-256-ctr"
        const iv = "0123456789012345"
        update_passwd = this.process_password(update_passwd)
        const read_stream = fs.createReadStream(path_to_zip_file_to_encrypt);
        const encrypt = crypto.createCipheriv(algorithm,
            update_passwd, //the "key" arg
                                              iv);
        const output_path = path_to_zip_file_to_encrypt.substring(0, path_to_zip_file_to_encrypt.length - 4)
                            + ".encrypted"
        const write_stream = fs.createWriteStream(output_path);
        read_stream.pipe(encrypt)
                    .pipe(write_stream);
    }

    //the top level fn to create the zipped and encryptied file to upload.
    static zip_and_encrypt(path_to_folder_to_zip, update_passwd){
        this.zip_folder(path_to_folder_to_zip)
        this.encrypt_file(path_to_folder_to_zip + ".zip", update_passwd)
    }

    static show_window_callback(vals){
        if(vals.clicked_button_value === "update"){
            FileTransfer.update_firmware(vals.dexter_user_name, vals.dexter_pwd, vals.update_pwd)
        }
    }

    static show_dialog(){
        show_window({title: "Update Dexter Firmware",
                     width:  450,
                     height: 415,
                     x: 400,
                     y: 50,
                     callback: "FileTransfer.show_window_callback",
                     content:
`<ol>  <li>Verify that your computer is connected to the Internet.</li>
       <li>Choose the Dexter to update from the Dexter.default menu<br/>
           in the Misc pane header.</li>
       <li>Verify that your computer is connected to that Dexter<br/>
           by running a small Job that moves that Dexter.</li>
       <li>Enter the Dexter user name. (default is "root")<br/>
           <input name="dexter_user_name" value="root"/></li>
       <li>Enter the Dexter password.<br/> 
           <input name="dexter_pwd"/></li>
       <li>Enter the update password to decrypt the software.<br/>
           (Contact Haddington if you need the update password)<br/>
       <input name="update_pwd"/></li>
       <li> Click: <input type="submit" name="update"/></li>
       <li> Be patient.<br/>
            There's many megabytes of code to move.<br/>
            <i>Do not use your computer until you see<br/>
               <b>Dexter firmware update completed</b><br/>
               (or an error message) in the Output pane.</i><br/>
               <span style="color:red;">Doing so may damage Dexter's file system.</span></li>
 </ol>`
        })
    }
    static update_firmware(dexter_user_name, dexter_pwd, update_pwd){
        let releases_url = "https://github.com/HaddingtonDynamics/Dexter/releases"
        get_page_async(releases_url, function(err, response, body){
            debugger;
            FileTransfer.get_releases_page_callback(err, response, body, dexter_user_name, dexter_pwd, update_pwd)
            })
    }
     /*   this.web_to_to_dde(url, ddd_encripted_zip_path,
            function() {
               FileTransfer.decrypt_file(ddd_encripted_zip_path,
                                         update_pwd,
                                         ddd_decripted_zip_path)
                FileTransfer.unzip(ddd_decripted_zip_path)
                FileTransfer.copy_to_dexter(from_dde_path, dexter_pwd)
            } )
    }*/

    static get_releases_page_callback(err, response, body, dexter_user_name, dexter_pwd, update_pwd){
        if(err) {
            dde_error("During update_firmware, could not get page:<br/>" +
                      " https://github.com/HaddingtonDynamics/Dexter/releases")
        }
        else {
            let url = FileTransfer.extract_update_url_from_page_content(body)
            let ddd_encrypted_zip_path = dde_apps_folder + "/firmware_encrypted.zip"
            let ddd_decrypted_zip_path = dde_apps_folder + "/firmware_decrypted.zip"
            FileTransfer.web_to_dde(url, ddd_encrypted_zip_path,
                   function(){
                       FileTransfer.decrypt_file(ddd_encrypted_zip_path, ddd_decrypted_zip_path, dexter_user_name, dexter_pwd, update_pwd)
                       //FileTransfer.unzip(ddd_decrypted_zip_path) //todo comment in
                       //FileTransfer.copy_to_dexter(ddd_decrypted_zip_path, dexter_pwd) //todo comment in
                   })
        }
    }

    static extract_update_url_from_page_content(page_content){
        let url_prefix      = "/HaddingtonDynamics/Dexter/releases/download/"
        let url_start_index = page_content.indexOf(url_prefix)
        if (url_start_index === -1) {
            dde_error("Could not find the released file url starting with: " + url_prefix)
        }
        else {
            let url_end_index   = page_content.indexOf('"', url_start_index)
            let url = page_content.substring(url_start_index, url_end_index) //starts with slash, still needs prefix
            url = "https://github.com" + url
            out("Getting: " + url)
            return url
        }
    }

    static path_to_file_name(url) { //includes extension
        let file_name_start = url.lastIndexOf("/")
        file_name_start += 1 //skip past slash
        let file_name = url.substring(file_name_start)
        return file_name
    }

    static web_to_dde(url, dde_path, cb){
        if(!dde_path){
            let file_name = this.path_to_file_name(url)
            dde_path = dde_apps_folder + "/" + file_name
        }
        out("Transfering " + url + " to: " + dde_path)
        get(url, (err, res) => {
            let the_callback = cb
            let the_url = url
            let the_dde_path = dde_path
            if (err) throw err
            const outStream = fs.createWriteStream(dde_path)
            pump(res, outStream, (err) => {
                if (err) {
                    dde_error("While transfering : " + url + " to: " + dde_path +
                              "<br/>" + err.message)
                }
                if(the_callback) { the_callback.call(null, the_url, the_dde_path) }
                else             { out("Transfer complete to: " + the_dde_path) }
            })
        })
    }

    //https://attacomsian.com/blog/nodejs-encrypt-decrypt-data#:~:text=Conclusion-,Node.,%2C%20sign%2C%20and%20verify%20functions.
    //this url uses algorithm: "aes-256-ctr"" but 7zip specifies that it uses 'AES-256".
    //there are other AES-256 alrorithms. 256 is just the length of the key.
    //The crap Node doc at https://nodejs.org/api/crypto.html doesn't list the possible algorithms
    //but evaling crypto.getCiphers() gives you a list. The list does not include "aes-256"
    //but does includes aes_256-ctr so I guess picking that is the best we can do.
    static decrypt_file(encrypted_dde_path, decrypted_zip_path, dexter_user_name, dexter_pwd, update_pwd){
        out("Decyrpting: " + encrypted_dde_path + " to: " + decrypted_zip_path)
        try{
            const readstream = fs.createReadStream(encrypted_dde_path);
            const algorithm = "aes-256-ctr"
            const iv = "0123456789012345"
            update_pwd = this.process_password(update_pwd)
            const decrypt = //crypto.createDecipher(algorithm, pwd)  //createDecipher is deprecated.
                            crypto.createDecipheriv(algorithm, update_pwd, iv) //"nonce"   null fails, and undefined
            //or just have the iv be part of the file name ie hash last 5 chars.

            const writestream = fs.createWriteStream(decrypted_zip_path)
            readstream.pipe(decrypt).pipe(writestream)
            writestream.on("finish", function(){
                out("Finished decryption")
                let unzip_to_folder = dde_apps_folder + "/firmware_unzipped"
                FileTransfer.unzip(decrypted_zip_path, unzip_to_folder)
                FileTransfer.copy_to_dexter(unzip_to_folder, dexter_user_name, dexter_pwd)
            })
        }
        catch(err){
            dde_error("Failed to decrypt: " + encrypted_dde_path +
                      "<br/>Maybe you entered the wrong password.")
        }
    }

    //zip_file_path expected to end in .zip
    //unzips files into a new folder having the same file name as the zip_file_path
    //(excluding the .zip)
    //That new folder will be put under folder_for_folder_of_files.
    static unzip(zip_file_path, unzip_into_folder){
        if(!unzip_into_folder) {
            unzip_into_folder = dde_apps_folder + "/firmware_unzipped"
        }
        //let file_name = this.path_to_file_name(zip_file_path)
        //file_name = file_name.substring(0, file_name.length - 4) //remove the .zip extension
        //folder_for_files =  dde_apps_folder + "/" + file_name
        //}
        out("Unzipping: " + zip_file_path + " into: " + unzip_into_folder)
        let zip = new AdmZip(zip_file_path);
        zip.extractAllTo(unzip_into_folder, true) //true means overwrite if folder already exists
        out("Unzipped: " + zip_file_path + " into: " + unzip_into_folder)
    }

    static copy_to_dexter(from_dde_path, dexter_user_name, dexter_pwd){
        out("Copying to Dexter from: " + from_dde_path)
        let ip_addr = Dexter.default.ip_address
        let folders_to_copy   = folder_listing(from_dde_path)
        let cur_folder_index  = 0
        let copy_fn = function(){
            let top_level_in_dexter_folder = folders_to_copy[cur_folder_index]
            let fold_name_begin_index = top_level_in_dexter_folder.lastIndexOf("/") + 1
            let fold_name = top_level_in_dexter_folder.substring(fold_name_begin_index)
            if (fold_name.startsWith(".")) { //happens on Mac with .DS_STORE
                cur_folder_index += 1
                copy_fn()
            }
            else {
                let from_dde_path_fold = from_dde_path + "/" + fold_name
                let scp_path = dexter_user_name + ':' + dexter_pwd + '@' + ip_addr + ":/" + fold_name
                out("Copying: " + from_dde_path_fold + " to Dexter: " + scp_path)
                try {
                    client.scp(from_dde_path_fold,
                               scp_path,
                               function(err){
                                 if(err) {
                                     dde_error("Failed to copy: " + fold_name + " to Dexter<br/>" + err.message)
                                 }
                                 else {
                                     out("Copied: " + fold_name + " to Dexter." + Dexter.default.name)
                                     if (cur_folder_index < (folders_to_copy.length - 1)){
                                         cur_folder_index += 1
                                         copy_fn()
                                     }
                                     else {
                                         out("<b>Dexter firmware update completed.</b>")
                                     }
                                 }
                              }
                    )
                }
                catch(err){
                    dde_error("Failed to copy to Dexter: " + from_dde_path_fold +
                              "<br/>" + err.message)
                }
            }
        }
        copy_fn() //the first call
    }


} //end class

// 'https://ballpit.github.io/website/pics.zip'
// path.join