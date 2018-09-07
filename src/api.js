import {DOMParser} from 'xmldom';
import { xmlToJson, qsToJson } from './utils';
import _ from 'lodash';
import qs from 'qs';

export const GOOGLE_API_KEY = "AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80";

// Endpoint to get the subtitle tracks
// https://www.youtube.com/api/timedtext?type=list&v=3wszM2SA12E

// Endpoint to get the subtitle for video id and support translate
// https://www.youtube.com/api/timedtext?lang=en&v=7068mw-6lmI&name=English&tlang=lv
// https://www.youtube.com/api/timedtext?lang=ko&v=7068mw-6lmI&name=Korean&tlang=lv

const API_PLAYLISTS_IN_CHANNEL = "https://www.googleapis.com/youtube/v3/playlists/";
const API_PLAYLISTITMES = "https://www.googleapis.com/youtube/v3/playlistItems";
const API_VIDEOS = "https://www.googleapis.com/youtube/v3/videos";
const API_GET_VIDEO_INFO = "http://www.youtube.com/get_video_info";
const API_DICTIONARY = "https://glosbe.com/gapi/translate";

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
        let responseJson = await response.json();
        return responseJson;
    } catch (error) {
        console.log("error", error);
    }
}

//==========unused===========================

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
    return tracks;
}

async function getSubtitlesFromYoutube(videoId, langCode) {
    let tracks = await getSubtitleTracksFromYoutube(videoId);
    let trackForLangCode = tracks.find(track=>track.lang_code.startsWith(langCode));
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
                end: (parseFloat(text["@attributes"].start) * 1000 + parseFloat(text["@attributes"].dur) * 1000) / 1000,
                text: text['#text'],
            }));

            return subtitles;
        }
    }
    return null
}

//================================================

async function getSubtitleTracksFromYoutubeVideoInfo(videoInfo){
    let _tracks = [];
    if(videoInfo.player_response.captions){
        _tracks = videoInfo.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
    }
    let tracks = _tracks.map(track=>{
        return {
            ...track,
            lang_code: track.languageCode,
            subtitles_uri: track.baseUrl
        }
    })
    return tracks;
}

async function getSubtitlesFromYoutubeVideoInfo(videoInfo, langCode, isAsr) {
    let tracks = await getSubtitleTracksFromYoutubeVideoInfo(videoInfo);
    let trackForLangCode = tracks.find(track=>(
        track.lang_code.startsWith(langCode) 
        && 
        (isAsr ? (track.kind=='asr') : (track.kind!='asr')))
    );
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
                end: (parseFloat(text["@attributes"].start) * 1000 + parseFloat(text["@attributes"].dur) * 1000) / 1000,
                text: text['#text'],
            }));

            return subtitles;
        }
    }
    return null
}

async function getAutoSubtitlesFromYoutubeVideoInfo(videoInfo, langCode) {
    let tracks = await getSubtitleTracksFromYoutubeVideoInfo(videoInfo);
    let firstTrack = tracks.find(track=>track.kind!='asr');
    if(firstTrack){
        let xmlStr = await getText(firstTrack.subtitles_uri + "&tlang=" + langCode);

        if(xmlStr){
            let parser = new DOMParser();
            let xml = parser.parseFromString(xmlStr, "text/xml");
            let json = xmlToJson(xml);
            let _texts = json.transcript.text instanceof Array ? json.transcript.text : [json.transcript.text]
            let subtitles = _texts.map((text, index) => ({
                index,
                start: parseFloat(text["@attributes"].start),
                dur: parseFloat(text["@attributes"].dur),
                end: (parseFloat(text["@attributes"].start) * 1000 + parseFloat(text["@attributes"].dur) * 1000) / 1000,
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
    return tracks;
}

async function getSubtitlesFromAmara(videoId, langCode){
    let tracks = await getSubtitleTracksFromAmara(videoId);
    let trackForLangCode = tracks.find(track=>track.code.startsWith(langCode));
    if(trackForLangCode){
        let res = await getJSON(trackForLangCode.subtitles_uri);
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

async function getVideoItemById(id){
    let part = 'snippet,contentDetails';
    let parameters = {
        id,
        part,
        key: GOOGLE_API_KEY,
    }
    let url = buildURL(API_VIDEOS, parameters);
    let res = await getJSON(url);

    if(res && res.items){
        return res.items[0];
    }else{
        return null;
    }    
}

async function getYoutubeVideoInfo(video_id){
    let el='detailpage';
    let url = buildURL(API_GET_VIDEO_INFO, {video_id, el});
    let res = await getText(url);

    let videoInfo = qs.parse(res);
    var tmp = videoInfo.url_encoded_fmt_stream_map;
    if (tmp) {
      tmp = tmp.split(',');
      for (i in tmp) {
        tmp[i] = qs.parse(tmp[i]);
      }
      videoInfo.url_encoded_fmt_stream_map = tmp;
    }
    videoInfo.adaptive_fmts = qs.parse(videoInfo.adaptive_fmts)
    videoInfo.player_response = JSON.parse(videoInfo.player_response);

    return videoInfo;
}

async function getYoutubeVideoDownloadUrl(video_id){
    let downloadUrl = "";
    let videoInfo = await getYoutubeVideoInfo(video_id);
    let videos = videoInfo.url_encoded_fmt_stream_map;
    if(videos){
        let mp4 = videos.find(video=>video.itag==18);
        downloadUrl = mp4.url;
        if(mp4.s){
            let signature = await getDeciperSignature2(videoInfo.video_id, mp4.s);
            downloadUrl = `${downloadUrl}&signature=${signature}`;
        }
    }
    return downloadUrl;
}

async function getYoutubeVideoDownloadUrlFromVideoInfo(videoInfo){
    let downloadUrl = "";
    let videos = videoInfo.url_encoded_fmt_stream_map;
    if(videos){
        let mp4 = videos.find(video=>video.itag==18);
        downloadUrl = mp4.url;
        if(mp4.s){
            let signature = await getDeciperSignature2(videoInfo.video_id, mp4.s);
            downloadUrl = `${downloadUrl}&signature=${signature}`;
        }
    }
    return downloadUrl;
}

async function getDeciperSignature1(videoId, signature) {
    var url = `https://www.youtube.com/embed/${videoId}?disable_polymer=true&hl=en`;
    let page = await getText(url);

    let configStr = /'PLAYER_CONFIG':\s(.*?),'EXPERIMENT_FLAGS/.exec(page)[1];
    let json = JSON.parse(configStr);
    let playerSourceUrl = `https://www.youtube.com${json.assets.js}`;
    console.log(videoId, playerSourceUrl);

    let playerSource = await getText(playerSourceUrl);
    let decipherFuncName = /"signature",\s?([a-zA-Z0-9\$]+)\(/.exec(playerSource)[1];

    let decipherFuncRegex = new RegExp(`(?!h\\.)${decipherFuncName}=function\\(\\w+\\)\\{(.*?)\\}`);
    let decipherFunc = decipherFuncRegex.exec(playerSource)[0];

    let functionsObjectName = /\.split\(""\);(\w+)\./.exec(decipherFunc)[1];
    let functionsObjectRegex = `var\\s${functionsObjectName}=\\{(.|\n)*?\\}\\};`;
    let functionsObject = new RegExp(functionsObjectRegex).exec(playerSource)[0];

    eval(functionsObject);
    eval(decipherFunc);
    let result = eval(decipherFuncName)(signature);

    console.log({
        playerSourceUrl,
        signature,
        decipherFunc,
        functionsObject,
        result,
    });

    return result;
}

async function getDeciperSignature2(videoId, signature) {
    var url = `https://www.youtube.com/embed/${videoId}?disable_polymer=true&hl=en`;
    let page = await getText(url);

    let configStr = /'PLAYER_CONFIG':\s(.*?),'EXPERIMENT_FLAGS/.exec(page)[1];
    let json = JSON.parse(configStr);
    let playerSourceUrl = `https://www.youtube.com${json.assets.js}`;

    let playerSource = await getText(playerSourceUrl);

    let decipherFuncArr = /function\(\w+\)\{.*split\(""\);(\w+)\..*join\(""\)\};/.exec(playerSource);
    let decipherFunc = decipherFuncArr[0];

    let functionsObjectName = decipherFuncArr[1];
    let functionsObjectRegex = `var\\s${functionsObjectName}=\\{(.|\n)*?\\}\\};`;
    let functionsObject = new RegExp(functionsObjectRegex).exec(playerSource)[0];

    eval(functionsObject);
    eval(`decipher=${decipherFunc}`);
    let result = decipher(signature);

    console.log({
        playerSourceUrl,
        signature,
        decipherFunc,
        functionsObject,
        result,
    });

    return result;
}

async function getDictionaryData(from, dest, phrase){
    let url = buildURL(API_DICTIONARY, {from, dest, phrase, format: 'json', pretty: true, tm: true});
    let res = await getJSON(url);
    return res;
}

export default {
    getJSON,
    postJSON,
    getText,

    getSubtitleTracksFromYoutube,
    getSubtitlesFromYoutube,
    getSubtitleTracksFromYoutubeVideoInfo,
    getSubtitlesFromYoutubeVideoInfo,
    getAutoSubtitlesFromYoutubeVideoInfo,

    getSubtitleTracksFromAmara,
    getSubtitlesFromAmara,
    getChannelID,
    getPlaylistsInChannel,
    getPlaylistItemss,
    getVideoItemById,

    getYoutubeVideoInfo,
    getYoutubeVideoDownloadUrl,
    getYoutubeVideoDownloadUrlFromVideoInfo,
    getDeciperSignature1,
    getDeciperSignature2,
    
    getDictionaryData
}