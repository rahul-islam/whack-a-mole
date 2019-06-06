var fs = require('fs');
var poses = JSON.parse(fs.readFileSync('../../../samples/dataframe.json', 'utf8'));
// var obj = JSON.parse(text);

// console.log(poses)
var keys = Object.keys(poses)
var max_key;
var max_score = 0;

marker_value = '303'

for (let i=0 ; i<keys.length ; i++)
{
    // console.log('Pose corresponding to key value is::')
    // console.log(poses[keys[i]]['human'])
    for(let j=0; j<poses[keys[i]]['human'].length;j++)
    {
        id = poses[keys[i]]['human'][j]['id']
        if(id==marker_value)
        {
            score = poses[keys[i]]['human'][j]['pose'][0].score
            console.log('score is:::')
            console.log(score)
            if(parseFloat(score) > max_score)
            {
                max_key=keys[i]
                max_score = score
                console.log('new score is::')
                console.log(max_score)
                
            }

        }
        
        
    }
    // console.log('score is::')
    // console.log(score)
    // console.log(poses[keys[i]]['aruco'])
    // if(score > max_score)
    // {
    //     max_score = score
    //     max_key = i
    // }

}
console.log('Max key is::')
console.log(max_key)
console.log('Max score is::')
console.log(max_score)
// for (let i=0; i< poses.length; i++)
// {
//     console.log(poses[i])
// }

