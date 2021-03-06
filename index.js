const _ = require('lodash')
const request = require('request-promise')

function PlayCanvasWebpackPlugin(options) {
    this.options = _.extend({
        files: {}
    }, options)
}

PlayCanvasWebpackPlugin.prototype.apply = function (compiler) {
    let options = this.options
    compiler.plugin('emit', (compilation, callback) => {
        try {
            if (options.skipUpload) {
                console.log("Skipping Upload")
                callback()
                return
            }
            Object.keys(compilation.assets)
                .forEach(key => {
                    let asset = compilation.assets[key]
                    if (!asset || !asset.children) return
                    let filename = options.files[key]
                    if (filename) {
                        if (!filename.assetId) {
                            throw new Error("No assetId aborting " + filename.path)
                        }
                        if (!options.bearer) {
                            throw new Error("No bearer token, aborting")
                        }
                        console.log(`Uploading ${filename.path} to PlayCanvas`)
                        let content = asset.children.map(c => c._value ? c._value : c).join('\n')
                        let req = request({
                            uri: `https://playcanvas.com/api/assets/${filename.assetId}`,
                            method: 'PUT',
                            headers: {
                                "Authorization": `Bearer ${options.bearer}`
                            }
                        })
                        let form = req.form()
                        if (options.branchId)
                        {
                            form.append("branchId", `${options.branchId}`)
                        }
                        form.append("file", filename.value ? filename.value : content, {
                            filename: filename.path,
                            contentType: "text/javascript"
                        })
                        req.then(() => {
                            console.log("Upload complete for file " + filename.path)
                            callback()
                        }, (e) => {
                            console.error(e)
                            compilation.errors.push(e)
                            callback()
                        })


                    }
                })
        } catch (e) {
            compilation.errors.push(e)
            callback()
        }
    })

}

module.exports = PlayCanvasWebpackPlugin
