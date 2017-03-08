/**
 * Created by Fry on 2/20/17.
 */

var sign = require('electron-osx-sign')
sign({app: './dist/dexter_development_environment-darwin-x64/dexter_development_environment.app',
      identity: 'cfry@hdrobotic.com',
      platform: "darwin"
     }
     , function done (err) {
    if (err) { console.log("Error while attempting to sign Mac app: " + err)}
    }
  )


const electronInstallerDmg = require('electron-installer-dmg')
electronInstallerDmg({
    appPath:  "./dist/dexter_development_environment-darwin-x64/dexter_development_environment.app",
    out:      "./dist",
    name:     'dexter_development_environment',
    overwrite: true,
    debug:     true
}, function done (err) {
    if(err){
        console.log("electronInstallerDMG errored with: " + err)
    }
})
