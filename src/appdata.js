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
    let existingIndex = historyVideos.findIndex((item)=>item.contentDetails.videoId==videoItem.contentDetails.videoId);
    if(existingIndex >= 0){
        historyVideos.splice(existingIndex, 1);        
    }
    historyVideos = [videoItem, ...historyVideos];
    historyVideos = historyVideos.slice(0, 10);
    await setItem('history', historyVideos);
}

async function getFlaggedScenes(videoId){
    let key = `flagged-scenes-${videoId}`;
    let flaggedScenes = await getItem(key);
    return flaggedScenes || [];
}

async function setFlaggedScenes(videoId, flaggedScenes){
    let key = `flagged-scenes-${videoId}`;
    await setItem(key, flaggedScenes);
}

async function addFlaggedScene(videoId, scene){
    let key = `flagged-scenes-${videoId}`;
    let flaggedScenes = await getItem(key);
    flaggedScenes = [...flaggedScenes, scene];
    await setItem(key, flaggedScenes);
}

async function removeFlaggedScene(videoId, scene){
    let key = `flagged-scenes-${videoId}`;
    let flaggedScenes = await getItem(key);
    let index = flaggedScenes.indexOf(scene);
    if(index > -1){
        flaggedScenes.splice(index, 1);
    }
    await setItem(key, flaggedScenes);
}

export default {
    getItem, 
    setItem, 
    getHistoryVideos,
    addHistoryVideo,
    getFlaggedScenes,
    setFlaggedScenes,
    addFlaggedScene,
    removeFlaggedScene,
}