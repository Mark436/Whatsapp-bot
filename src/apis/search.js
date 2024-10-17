const https=require('https');
require('dotenv').config();
/**
 * 
 * @param {string} searchTerm What you're searching in youtube
 * @returns {Promise<Set<{title:string,imgUrl:string,url:string}>>}a Set of 5 videos with it's thumbnailUrl, Title and Url
 */
function buscarVideo(searchTerm){
const videos=new Set();
const searchUrl=`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${searchTerm}&key=${process.env.apiKey}`;
return new Promise((resolve,reject)=>{https.get(searchUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk
    });

    res.on('end', () => {
        const searchResults = JSON.parse(data).items;
        for (const video in searchResults)videos.add({title:searchResults[video].snippet.title,imgUrl:searchResults[video].snippet.thumbnails.default.url,url:'https://www.youtube.com/watch?v='+ searchResults[video].id.videoId})
        resolve(videos);
    });

}).on('error', (err) => {
    reject('Error: ' + err.message);
});})
}
module.exports=buscarVideo;