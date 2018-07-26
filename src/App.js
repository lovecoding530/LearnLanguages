/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import YouTube from 'react-native-youtube'
import { find } from 'lodash';
import {DOMParser} from 'xmldom';
import { xmlToJson } from './utils';
import { getText } from './api';

// https://www.youtube.com/api/timedtext?type=list&v=3wszM2SA12E
// https://www.youtube.com/api/timedtext?lang=en&v=7068mw-6lmI&name=English&tlang=lv
// https://www.youtube.com/api/timedtext?lang=ko&v=7068mw-6lmI&name=Korean&tlang=lv

//3wszM2SA12E
//GUqwNany2ZA
//7068mw-6lmI
const videoId = "GUqwNany2ZA"; 
export default class App extends Component{

  state = {
    quality: "",
    error: "",
    status: "",
    tracks: [],
    subtitle: [],
    currentCaption: ""
  }

  async componentDidMount() {
    setInterval(async ()=>{
      let currentTime = await this.player.currentTime();
      let caption = this.state.subtitle.slice().reverse().find(caption => caption.start <= currentTime);
      if(caption){
        console.log(caption);
        this.setState({currentCaption: caption.text});
      }
    }, 500);
    await this.getSubTitleTracks();
    await this.getSubTitle();
  }

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

  getSubTitle = async () => {
    let enTrack = this.state.tracks.find(track=>track.lang_code=='en');
    if(enTrack){
      let xmlStr = await getText(`https://www.youtube.com/api/timedtext?lang=${enTrack.lang_code}&v=${videoId}&name=${enTrack.name}&tlang=de`);

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

  render() {
    return (
      <View style={styles.container}>
        <YouTube
          ref={ref => this.player = ref}
          apiKey="AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80"
          videoId={videoId}   // The YouTube video ID
          play={true}             // control playback of video with true/false
          fullscreen={false}      // control whether the video should play in fullscreen or inline
          loop={true}             // control whether the video should loop when ended
          onReady={e => this.setState({ isReady: true })}
          onChangeState={e => {
            console.log(e.state)
            this.setState({ status: e.state });
          }}
          onChangeQuality={e => this.setState({ quality: e.quality })}
          onError={e => this.setState({ error: e.error })}
          style={{ alignSelf: 'stretch', height: 300 }}
        />
        <Text>
          {this.state.status}
        </Text>
        <Text style={styles.caption}>
          {this.state.currentCaption}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
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
});
