/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Button} from 'react-native';
import YouTube from 'react-native-youtube'
import { find } from 'lodash';
import {DOMParser} from 'xmldom';
import { xmlToJson } from './utils';
import api from './api';

// Endpoint to get the subtitle tracks
// https://www.youtube.com/api/timedtext?type=list&v=3wszM2SA12E

// Endpoint to get the subtitle for video id and support translate
// https://www.youtube.com/api/timedtext?lang=en&v=7068mw-6lmI&name=English&tlang=lv
// https://www.youtube.com/api/timedtext?lang=ko&v=7068mw-6lmI&name=Korean&tlang=lv

// http://www.youtube.com/watch?v=Ec0oP4OXMcM

//3wszM2SA12E
//7068mw-6lmI
//GUqwNany2ZA

//qJlbPXZEpRE
//JV7FMc8BW5U

//Ec0oP4OXMcM
const videoId = "Ec0oP4OXMcM"; 
const targetLang = 'en';
const nativeLang = 'ar';
export default class App extends Component{

  state = {
    quality: "",
    error: "",
    status: "", //youtube player status
    tracks: [], //video tracks
    targetSubtitles: [], //video subtitle
    nativeSubtitles: [], //video subtitle
    currentTargetSubtitle: {}, //transcription
    currentNativeSubtitles: [], //translation
    showTranscription: false,
    showTranslation: false,
    play: true,
  }

  async componentDidMount() {
    setInterval(async ()=>{
      if(!this.player) return;
      let currentTime = await this.player.currentTime();
      let reversedTargetSubtitles = this.state.targetSubtitles.slice().reverse();
      let currentTargetSubtitle = reversedTargetSubtitles.find(subtitle => subtitle.start <= currentTime);
      if(currentTargetSubtitle && currentTargetSubtitle.start != this.state.currentTargetSubtitle.start){
        console.log(currentTargetSubtitle);
        
        let currentNativeSubtitles = [];
        let targetStart = currentTargetSubtitle.start;
        let targetEnd = currentTargetSubtitle.end;

        let firstIndex = 0;
        this.state.nativeSubtitles.forEach((subtitle, index)=>{
          if(subtitle.start <= targetStart) firstIndex = index;
        })

        let lastIndex = this.state.nativeSubtitles.findIndex(subtitle => subtitle.end >= targetEnd);
        console.log("indexes", firstIndex, lastIndex)
        for(let i = firstIndex; i <= lastIndex; i ++){
          currentNativeSubtitles.push(this.state.nativeSubtitles[i]);
        }  

        this.setState({currentTargetSubtitle, currentNativeSubtitles, play: false, showTranscription: false, showTranslation: false});
      }
    }, 200); //update captions if needed every 200 ms

    let targetSubtitles = await api.getSubtitlesFromYoutube(videoId, targetLang);
    if(!targetSubtitles){
      targetSubtitles = await api.getSubtitlesFromAmara(videoId, targetLang);
    } 

    let nativeSubtitles = await api.getSubtitlesFromYoutube(videoId, nativeLang);
    if(!nativeSubtitles){
      nativeSubtitles = await api.getSubtitlesFromAmara(videoId, nativeLang);
    } 

    this.setState({
      targetSubtitles: targetSubtitles || [],
      nativeSubtitles: nativeSubtitles || [], 
    });
  }

  onPressedShowTranscription = () => {
    this.setState({showTranscription: !this.state.showTranscription})
  }

  onPressedShowTranslation = () => {
    this.setState({showTranslation: !this.state.showTranslation})
  }

  render() {
    return (
      <View style={styles.container}>
        <YouTube
          ref={ref => this.player = ref}
          apiKey="AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80"
          videoId={videoId}       // The YouTube video ID
          play={this.state.play}  // control playback of video with true/false
          fullscreen={false}      // control whether the video should play in fullscreen or inline
          loop={false}            // control whether the video should loop when ended
          onReady={e => this.setState({ isReady: true })}
          onChangeState={e => {
            console.log(e.state)
            if (e.state === 'playing') {
              this.setState({status: e.state, play: true })
            } else if (e.state === 'paused' || e.state === 'stopped' || e.state === 'ended') {
              this.setState({status: e.state, play: false })
            }
          }}
          onChangeQuality={e => this.setState({ quality: e.quality })}
          onError={e => this.setState({ error: e.error })}
          style={{ alignSelf: 'stretch', height: 300 }}
        />
        <View style={styles.subtitleView}>
          <View style={styles.transcription}>
            {this.state.showTranscription ?
              <View>
                <Text style={styles.caption}>
                  {this.state.currentTargetSubtitle.text}
                </Text>
              </View>
              :
              <Button 
                title="Click here to show transcription" 
                onPress={this.onPressedShowTranscription}
              />
            }
          </View>
          <View style={styles.translation}>
            {this.state.showTranslation ?
              <View>
                {this.state.currentNativeSubtitles.map((subtitle, index)=>
                  <Text style={styles.caption} key={index.toString()}>
                    {subtitle.text}
                  </Text>
                )}
              </View>
              :
              <Button 
                title="Click here to show translation" 
                onPress={this.onPressedShowTranslation}
              />
            }
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },

  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },

  caption: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },

  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },

  subtitleView: {
    marginVertical: 24,
  },

  transcription: {
    marginBottom: 24,
  },

  translation: {
    marginBottom: 24,
  }
});
