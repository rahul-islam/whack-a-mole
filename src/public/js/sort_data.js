var fs = require('fs');
var poses = JSON.parse(fs.readFileSync('/home/abhishek/pose_detection_new/pose_detection_new_2/pose-detection/pose_test_6.json', 'utf8'));
// var obj = JSON.parse(text);

// console.log(poses)
var keys = Object.keys(poses)
var max_key;
var max_score = 0;

marker_value = '303'

for (let i=0 ; i<keys.length ; i++)
{
    console.log(keys)
    console.log('Pose corresponding to key value is::')
    console.log(poses[keys[i]]['human'])
    for(let j=0; j<poses[keys[i]]['human'].length;j++)
    {
        id = poses[keys[i]]['human'][j]['id']
        console.log('keys[i] is')
        console.log(keys[i])
        if(id==marker_value)
        {
            console.log('id is::')
            console.log(id)
            console.log('human is')
            console.log(poses[keys[i]]['human'])
            console.log('pose inside human is')
            console.log('length is')
            console.log(poses[keys[i]]['human'][j]['pose'].length)
            console.log(poses[keys[i]]['human'][0]['pose'][0]['pose'])
            score = poses[keys[i]]['human'][0]['pose'][0]['pose'].score
            console.log('score is:::')
            console.log(score)
            if(parseFloat(score) > max_score)
            {
                max_key=keys[i]
                max_score = score
                max_index = j
                console.log('new score is::')
                console.log(max_score)
                
            }

        }
        
        
    }
    // console.log('score is::')
    console.log(score)
    // console.log(poses[keys[i]]['aruco'])
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
console.log('max pose is')
// console.log(poses[max_key]['human'][max_index]['pose'][0])
// // for (let i=0; i< poses.length; i++)
// {
//     console.log(poses[i])
// }

