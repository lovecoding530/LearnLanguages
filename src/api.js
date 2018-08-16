import {DOMParser} from 'xmldom';
import { xmlToJson, qsToJson } from './utils';
import _ from 'lodash';

export const GOOGLE_API_KEY = "AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80";
const API_PLAYLISTS_IN_CHANNEL = "https://www.googleapis.com/youtube/v3/playlists/";
const API_PLAYLISTITMES = "https://www.googleapis.com/youtube/v3/playlistItems";
const API_GET_VIDEO_INFO = "http://www.youtube.com/get_video_info"

const maxResults = 20;

function buildURL(url, parameters){
    let query = Object.keys(parameters).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]);
    }).join("&");
    let encodedUrl = url + "?" + query;
    return encodedUrl;
}

async function getJSON(url, headers={}){
    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });
        let json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function getText(url){
    try {
        let response = await fetch(url);
        let json = await response.text();
        return json;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function postJSON(url, json) {
    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        });
        let responseJson = await response.json() ;
        return responseJson;
    } catch (error) {
        console.log("error", error);
    }
}

async function getSubtitleTracksFromYoutube(videoId){
    let tracks = [];
    let xmlStr = await getText(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`);
    if(xmlStr){
        let parser = new DOMParser();
        let xml = parser.parseFromString(xmlStr, "text/xml");
        let json = xmlToJson(xml);
        if(json && json.transcript_list && json.transcript_list.track){
            let _tracks = json.transcript_list.track instanceof Array ? json.transcript_list.track : [json.transcript_list.track]
            tracks = _tracks.map(track=>{
                track = track["@attributes"];
                return {
                    ...track, 
                    subtitles_uri: `https://www.youtube.com/api/timedtext?lang=${track.lang_code}&v=${videoId}&name=${track.name}`
                }
            })
        }
    }
    console.log('getSubtitleTracksFromYoutube', tracks);
    return tracks;
}

async function getSubtitlesFromYoutube(videoId, langCode) {
    let tracks = await getSubtitleTracksFromYoutube(videoId);
    let trackForLangCode = tracks.find(track=>track.lang_code == langCode);
    if(trackForLangCode){
        let xmlStr = await getText(trackForLangCode.subtitles_uri);

        if(xmlStr){
            let parser = new DOMParser();
            let xml = parser.parseFromString(xmlStr, "text/xml");
            let json = xmlToJson(xml);
            let _texts = json.transcript.text instanceof Array ? json.transcript.text : [json.transcript.text]
            let subtitles = _texts.map((text, index) => ({
                index,
                start: parseFloat(text["@attributes"].start),
                dur: parseFloat(text["@attributes"].dur),
                end: parseFloat(text["@attributes"].start) + parseFloat(text["@attributes"].dur),
                text: text['#text'],
            }));

            return subtitles;
        }
    }
    return null
}

async function getSubtitleTracksFromAmara(videoId){
    var apiUsername = "Yash5";
    var apiKey = "26c6a056419d24fb29306e3ad7f1bcfb23658f57";
    var baseUrl = "https://www.amara.org/api2/partners";
    var domainUrl = "https://www.amara.org";

    var headers = {
        "X-api-username" : apiUsername,
        "X-apikey" : apiKey
    };

    let url = `${baseUrl}/videos/?video_url=https://www.youtube.com/watch?v=${videoId}`;
    let res = await getJSON(url, headers);
    let tracks = [];
    if(res && res.objects){
        for (const object of res.objects) {
            tracks = [...tracks, ...object.languages];
            tracks = _.reject(tracks, {published: false})
        }
    }
    console.log('getSubtitleTracksFromAmara', tracks);
    return tracks;
}

async function getSubtitlesFromAmara(videoId, langCode){
    let tracks = await getSubtitleTracksFromAmara(videoId);
    let trackForLangCode = tracks.find(track=>track.code == langCode);
    if(trackForLangCode){
        let res = await getJSON(trackForLangCode.subtitles_uri);
        console.log("Amara subtitles new", res);
        if(res && res.subtitles){
            let subtitles = res.subtitles.map((subtitle, index)=>({
                ...subtitle,
                index,
                start: subtitle.start / 1000,
                end: subtitle.end / 1000,
                dur: (subtitle.end-subtitle.start) / 1000,
            }))
            return subtitles
        }
    }
    return null
}

async function getChannelID(targetLang, nativeLang){
    let url = 'https://demo1204964.mockable.io/channel';
    let res = await getJSON(url);
    if(res){
        return res.channelId;
    }
    return null;
}

async function getPlaylistsInChannel(channelId, pageToken = ''){
    let part = 'snippet,contentDetails';
    let parameters = {
        channelId,
        part,
        maxResults,
        pageToken,
        key: GOOGLE_API_KEY,
    }
    let url = buildURL(API_PLAYLISTS_IN_CHANNEL, parameters);
    let res = await getJSON(url);
    return res;
}

async function getPlaylistItemss(playlistId, pageToken = ''){
    let part = 'snippet,contentDetails';
    let parameters = {
        playlistId,
        part,
        maxResults,
        pageToken,
        key: GOOGLE_API_KEY,
    }
    let url = buildURL(API_PLAYLISTITMES, parameters);
    let res = await getJSON(url);
    return res;
}

async function getYoutubeVideoInfo(video_id){
    let url = buildURL(API_GET_VIDEO_INFO, {video_id});
    let res = await getText(url);
    let videoInfo = qsToJson(res);
    var tmp = videoInfo.url_encoded_fmt_stream_map;
    if (tmp) {
      tmp = tmp.split(',');
      for (i in tmp) {
        tmp[i] = qsToJson(tmp[i]);
      }
      videoInfo.url_encoded_fmt_stream_map = tmp;
    }
    return videoInfo;
}

async function getYoutubeVideoDownloadUrl(video_id){
    let videoInfo = await getYoutubeVideoInfo(video_id);
    let videos = videoInfo.url_encoded_fmt_stream_map;
    let mp4 = videos.find(video=>video.itag==18);
    return mp4.url;
}

export default {
    getJSON,
    postJSON,
    getText,
    getSubtitleTracksFromYoutube,
    getSubtitlesFromYoutube,
    getSubtitleTracksFromAmara,
    getSubtitlesFromAmara,
    getChannelID,
    getPlaylistsInChannel,
    getPlaylistItemss,
    getYoutubeVideoInfo,
    getYoutubeVideoDownloadUrl
}