const fs = require('fs')
const https = require('https');
let jsonData = {}
fs.readFile('manifest.json', 'utf-8', (err, data) => {
  if (err) throw err
  
  jsonData = JSON.parse(data)
    for (var key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            // const file = fs.createWriteStream("./" + jsonData[key].filename);
            // // const request = https.get("https://storage.googleapis.com/tfjs-mo(dels/weights/posenet/mobilenet_v1_075/" + jsonData[key].filename, function(response) {
            // console.log(response)
            // response.pipe(file);
            // });
            console.log("https://storage.googleapis.com/tfjs-models/weights/posenet/mobilenet_v1_075/" + jsonData[key].filename);
        }
    }
})