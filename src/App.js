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
import { getText } from './api';

// Endpoint to get the subtitle tracks
// https://www.youtube.com/api/timedtext?type=list&v=3wszM2SA12E

// Endpoint to get the subtitle for video id and support translate
// https://www.youtube.com/api/timedtext?lang=en&v=7068mw-6lmI&name=English&tlang=lv
// https://www.youtube.com/api/timedtext?lang=ko&v=7068mw-6lmI&name=Korean&tlang=lv

//3wszM2SA12E
//GUqwNany2ZA
//7068mw-6lmI
const videoId = "3wszM2SA12E"; 
export default class App extends Component{

  state = {
    quality: "",
    error: "",
    status: "", //youtube player status
    tracks: [], //video tracks
    subtitle: [], //video subtitle
    currentCaption: {}, //video current caption
    showSubtitle: false,
    play: true,
  }

  async componentDidMount() {
    setInterval(async ()=>{
      let currentTime = await this.player.currentTime();
      let reversedSubtitle = this.state.subtitle.slice().reverse();
      let caption = reversedSubtitle.find(caption => caption.start <= currentTime); // get current caption for current scene
      if(caption && caption.start != this.state.currentCaption.start){
        console.log(caption);
        this.setState({currentCaption: caption, play: false, showSubtitle: false});
      }
    }, 200); //update captions if needed every 500 ms
    await this.getSubTitleTracks();
    await this.getSubTitle();
  }

  //get subtitle tracks for the video.
  getSubTitleTracks = async () => {
    let xmlStr = await getText(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`);
    if(xmlStr){
      let parser = new DOMParser();
      let xml = parser.parseFromString(xmlStr, "text/xml");
      let json = xmlToJson(xml);
      console.log('getSubTitleTracks json', json);
      let _tracks = json.transcript_list.track instanceof Array ? json.transcript_list.track : [json.transcript_list.track]
      let tracks = _tracks.map(track=>({
          ...track["@attributes"]
      }))
      console.log(tracks);
      this.setState({tracks});  
    }
  }

  //get subtitle for the video.
  getSubTitle = async () => {
    let enTrack = this.state.tracks.find(track=>track.lang_code=='en');
    if(enTrack){
      let xmlStr = await getText(`https://www.youtube.com/api/timedtext?lang=${enTrack.lang_code}&v=${videoId}&name=${enTrack.name}`);

      if(xmlStr){
        let parser = new DOMParser();
        let xml = parser.parseFromString(xmlStr, "text/xml");
        let json = xmlToJson(xml);
        console.log(json);
        let _texts = json.transcript.text instanceof Array ? json.transcript.text : [json.transcript.text]
        let subtitle = _texts.map(text => ({
          ...text['@attributes'],
          text: text['#text']
        }));
  
        this.setState({subtitle});  
      }  
    }else{
      alert("There is no caption English track for the video id");
    }
  }

  onPressedShowBtn = () => {
    this.setState({showSubtitle: !this.state.showSubtitle})
  }

  render() {
    return (
      <View style={styles.container}>
        <YouTube
          ref={ref => this.player = ref}
          apiKey="AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80"
          videoId={videoId}       // The YouTube video ID
          play={this.state.play}             // control playback of video with true/false
          fullscreen={false}      // control whether the video should play in fullscreen or inline
          loop={false}             // control whether the video should loop when ended
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
          {this.state.showSubtitle ?
            <Text style={styles.caption}>
              {this.state.currentCaption.text}
            </Text>
            :
            <Button 
              title="Click here to show transcription" 
              onPress={this.onPressedShowBtn}
            />
          }
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
});
