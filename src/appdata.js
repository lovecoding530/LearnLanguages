import React, { Component } from 'react';
import {
    Platform,
    AsyncStorage
} from 'react-native';

export const FAV_ICON = "https://facebook.github.io/react-native/docs/assets/favicon.png";

async function getItem(key){
    const valueStr = await AsyncStorage.getItem(key)
    try {
        return JSON.parse(valueStr)        
    } catch (error) {
        return valueStr
    }
}

async function setItem(key, value){
    await AsyncStorage.setItem(key, JSON.stringify(value))            
}

async function getHistoryVideos(){
    let historyVideos = await getItem('history');
    return historyVideos || [];
}

async function addHistoryVideo(videoItem){
    let historyVideos = await getHistoryVideos();
    let existingIndex = historyVideos.findIndex((item)=>item.id==videoItem.id);
    if(existingIndex >= 0){
        historyVideos.splice(existingIndex, 1);        
    }
    historyVideos = [videoItem, ...historyVideos];
    historyVideos = historyVideos.slice(0, 10);
    await setItem('history', historyVideos);
}

async function getCurrentTimeForHistoryVideo(videoId){
    let historyVideos = await getHistoryVideos();
    let videoItem = historyVideos.find((item)=>item.id==videoId);
    if(videoItem){
        return videoItem.currentTime;
    }else{
        return 0;
    }
}

async function setCurrentTimeForHistoryVideo(videoId, currentTime){
    let historyVideos = await getHistoryVideos();
    let videoItem = historyVideos.find((item)=>item.id==videoId);
    if(videoItem){
        videoItem.currentTime = currentTime;
    }
    await setItem('history', historyVideos);
}

async function getFlaggedScenes(videoId, trackKey){
    let key = `flagged-scenes-${videoId}-${trackKey}`;
    let flaggedScenes = await getItem(key);
    return flaggedScenes || [];
}

async function setFlaggedScenes(videoId, trackKey, flaggedScenes){
    let key = `flagged-scenes-${videoId}-${trackKey}`;
    await setItem(key, flaggedScenes);
}

async function getSelectedTracks(videoId){
    let key = `selected-tracks-${videoId}`;
    let selectedTracks = await getItem(key);
    return selectedTracks || {};
}

async function setSelectedTracks(videoId, target, native){
    let key = `selected-tracks-${videoId}`;
    await setItem(key, {target, native});
}

export default {
    getItem, 
    setItem, 
    getHistoryVideos,
    addHistoryVideo,
    getCurrentTimeForHistoryVideo,
    setCurrentTimeForHistoryVideo,
    getFlaggedScenes,
    setFlaggedScenes,
    getSelectedTracks,
    setSelectedTracks,
}