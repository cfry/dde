class File {
    static dde_apps_folder = "/Users/Fry/Documents/dde_apps"
    static folder_listing_url_prefix = "http://192.168.1.142/edit?list="
    static async get_folder(url=File.dde_apps_folder){
       let the_url = folder_listing_url_prefix + url
       let fold_info = await fetch(the_url)
       out("fold_info: " + fold_info)
    }

}
globalThis = File