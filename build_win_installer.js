/**
 * Created by Fry on 2/18/17.
 */
 //from https://www.christianengvall.se/electron-windows-installer/
const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

function getInstallerConfig () {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'build_releases')

    return Promise.resolve({
        appDirectory: "./", //path.join(outPath, 'dexter_development_environment-win32-x64/'),
        authors: 'Fry',
        noMsi: true,
        outputDirectory: path.join(outPath, 'windows-installer'),
        exe: 'dexter_development_environment.exe', //the "input" file (name only) made by electron-packager
        setupExe: 'dexter_development_environment.exe'
        //setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'icon.ico')
    })
}

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((error) => {
    console.error(error.message || error)
process.exit(1)
})
