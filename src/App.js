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
import axios from 'axios';
import {DOMParser} from 'xmldom';
import { xmlToJson } from './utils';
import { getText } from './api';

// https://www.youtube.com/api/timedtext?type=list&v=3wszM2SA12E
// https://www.youtube.com/api/timedtext?lang=en&v=7068mw-6lmI&name=English&tlang=lv
// https://www.youtube.com/api/timedtext?lang=ko&v=7068mw-6lmI&name=Korean&tlang=lv

export default class App extends Component{

  state = {
    quality: "",
    error: "",
    status: "",
    subtitle: []
  }

  async componentDidMount() {
    setInterval(async ()=>{
      let currentTime = await this.player.currentTime();
      // alert(currentTime);
    }, 500);

    await this.getSubTitle();
  }

  getSubTitle = async () => {
    let xmlStr = await getText('https://www.youtube.com/api/timedtext?lang=en&v=GUqwNany2ZA');
    let parser = new DOMParser();
    let xml = parser.parseFromString(xmlStr, "text/xml");
    let json = xmlToJson(xml);
    console.log(json);

    let subtitle = json.transcript.text.map(text => ({
      start: text['@attributes'].start,
      dur: text['@attributes'].dur,
      text: text['#text']    
    }));

    this.setState({subtitle});
  }

  render() {
    return (
      <View style={styles.container}>
        <YouTube
          ref={ref => this.player = ref}
          apiKey="AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80"
          videoId="GUqwNany2ZA"   // The YouTube video ID
          play={true}             // control playback of video with true/false
          fullscreen={false}      // control whether the video should play in fullscreen or inline
          loop={true}             // control whether the video should loop when ended

          onReady={e => this.setState({ isReady: true })}
          onChangeState={e => {
            this.setState({ status: e.state })
          }}
          onChangeQuality={e => this.setState({ quality: e.quality })}
          onError={e => this.setState({ error: e.error })}

          style={{ alignSelf: 'stretch', height: 300 }}
        />
        <Text>
          {this.state.status}
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

  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
