import {DOMParser} from 'xmldom';
import { xmlToJson } from './utils';
import _ from 'lodash';

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
            let subtitles = _texts.map(text => ({
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
            let subtitles = res.subtitles.map(subtitle=>({
                ...subtitle,
                start: subtitle.start / 1000,
                end: subtitle.end / 1000,
                dur: (subtitle.end-subtitle.start) / 1000,
            }))
            return subtitles
        }
    }
    return null
}

export default {
    getJSON,
    postJSON,
    getText,
    getSubtitleTracksFromYoutube,
    getSubtitlesFromYoutube,
    getSubtitleTracksFromAmara,
    getSubtitlesFromAmara,
}