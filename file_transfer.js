const AdmZip = require('adm-zip')

var FileTransfer = class FileTransfer {

    //create the zip file containing the update
    //path is the path to the folder that represents slash on Dexter
    //https://github.com/cthackers/adm-zip/wiki/ADM-ZIP-Introduction
    static zip_folder(path_to_folder_to_zip) {
        let zip = new AdmZip();
        zip.addLocalFolder(path_to_folder_to_zip)
        zip.writeZip(path_to_folder_to_zip + ".zip")
        out(path_to_folder_to_zip + ".zip created.")
    }

    //zip_file_path expected to end in .zip
    //unzips files into a new folder having the same file name as the zip_file_path
    //(excluding the .zip)
    //That new folder will be put under folder_for_folder_of_files.
    static unzip(zip_file_path, unzip_into_folder) {
        if (!unzip_into_folder) {
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
}

