var fs = require('fs');
var poses = JSON.parse(fs.readFileSync('/home/abhishek/pose_detection_new/pose-detection/samples/dataframe.json', 'utf8'));
// var obj = JSON.parse(text);

console.log(poses)
var keys = Object.keys(poses)
var max_key;
var max_score = 0;
for (let i=0 ; i<keys.length ; i++)
{
    console.log('Pose corresponding to key value is::')
    console.log(poses[keys[i]]['human'])
    score = poses[keys[i]]['human']['pose'][0]['score']
    console.log('score is::')
    console.log(score)
    if(score > max_score)
    {
        max_score = score
        max_key = i
    }

}
console.log('Max key is::')
console.log(max_key)
console.log('Max score is::')
console.log(max_score)
// for (let i=0; i< poses.length; i++)
// {
//     console.log(poses[i])
// }

