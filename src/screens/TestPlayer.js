/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import YouTube from 'react-native-youtube'
import api, {GOOGLE_API_KEY} from '../api';
import Video from 'react-native-video';

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

//JV7FMc8BW5U
const videoId = "kw2OFJeRIZ8"; 
const targetLang = 'es';
const nativeLang = 'en';
export default class TestPlayer extends Component{

  constructor(props){
    super(props);

    let {state: {params: {videoId}}} = this.props.navigation;

    console.log('videoId', videoId);

    this.state = {
      videoId,
      videoUrl: "",
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
      isReady: true,
      count: 0,
      isSetSubtitle: false,
    }
  }

  async componentDidMount() {
    let videoUrl = await api.getYoutubeVideoDownloadUrl(this.state.videoId);
    console.log("videoUrl", videoUrl);

    let targetSubtitles = await api.getSubtitlesFromYoutube(this.state.videoId, targetLang);
    if(!targetSubtitles){
      targetSubtitles = await api.getSubtitlesFromAmara(this.state.videoId, targetLang);
    } 

    let nativeSubtitles = await api.getSubtitlesFromYoutube(this.state.videoId, nativeLang);
    if(!nativeSubtitles){
      nativeSubtitles = await api.getSubtitlesFromAmara(this.state.videoId, nativeLang);
    } 

    this.setState({
      videoUrl,
      targetSubtitles: targetSubtitles || [],
      nativeSubtitles: nativeSubtitles || [], 
    });
  }

  onProgress = (e)=>{
    // if(!this.player || !this.state.isReady) return;

    var currentTime = e.currentTime;

    // console.log(e);
    let currentTargetSubtitle = this.state.targetSubtitles.find(subtitle => subtitle.end > currentTime);

    if(this.state.isSetSubtitle) {
      if(currentTime >= this.state.currentTargetSubtitle.end){
        this.setState({play: false, showTranscription: false, showTranslation: false});
        this.player.seek(currentTargetSubtitle.start);
      }
    }else{
      if(currentTargetSubtitle && currentTargetSubtitle.start != this.state.currentTargetSubtitle.start){
        console.log(currentTargetSubtitle);
        
        let currentNativeSubtitles = [];
        let targetStart = currentTargetSubtitle.start;
        let targetEnd = currentTargetSubtitle.end;
  
        let firstIndex = this.state.nativeSubtitles.findIndex(subtitle => subtitle.end >= targetStart);
  
        let lastIndex = this.state.nativeSubtitles.findIndex(subtitle => subtitle.end >= targetEnd);
        for(let i = firstIndex; i <= lastIndex; i ++){
          currentNativeSubtitles.push(this.state.nativeSubtitles[i]);
        }
  
        this.setState({isSetSubtitle: true, currentTargetSubtitle, currentNativeSubtitles, play: true, showTranscription: false, showTranslation: false});
      }
    }
  }

  onPressedShowTranscription = () => {
    this.setState({showTranscription: !this.state.showTranscription})
  }

  onPressedShowTranslation = () => {
    this.setState({showTranslation: !this.state.showTranslation})
  }

  onPressedPlay = () => {
    this.setState({play: true, isSetSubtitle: false, showTranscription: false, showTranslation: false})
  }

  onPrev = () => {
    if(this.state.currentTargetSubtitle.index == 0) return;

    let prevSubtitle = this.state.targetSubtitles[this.state.currentTargetSubtitle.index - 1];
    this.player.seek(prevSubtitle.start)
    this.setState({play: true, isSetSubtitle: false, showTranscription: false, showTranslation: false})
  }

  onNext = () => {
    this.setState({play: true, isSetSubtitle: false, showTranscription: false, showTranslation: false})
  }

  onPlay = () => {
    this.player.seek(this.state.currentTargetSubtitle.start)
    this.setState({play: true, isSetSubtitle: true, showTranscription: false, showTranslation: false})
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.videoUrl ?
          <View style={styles.playerWrapper} >
            <Video source={{uri: this.state.videoUrl}}   // Can be a URL or a local file.
              ref={(ref) => {
                  this.player = ref
              }}                                      // Store reference
              onBuffer={this.onBuffer}                // Callback when remote video is buffering
              onEnd={this.onEnd}                      // Callback when playback finishes
              onError={this.videoError}               // Callback when video cannot be loaded
              style={styles.player} 
              paused={!this.state.play}
              progressUpdateInterval={100}
              onProgress={this.onProgress}
              resizeMode={"stretch"}
            />
            {!this.state.play &&
            <View style={styles.buttons}>
              <Button 
                title="Prev" 
                onPress={this.onPrev}
                disabled={this.state.currentTargetSubtitle.index == 0}
              />
              <Button 
                title="Play" 
                onPress={this.onPlay}
              />
              <Button 
                title="Next" 
                onPress={this.onNext}
                disabled={this.state.currentTargetSubtitle.index == this.state.targetSubtitles.length - 1}
              />
            </View>
            }
          </View>
          :
          <View style={styles.playerWrapper} />
        }
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
  },

  playerWrapper: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  player: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  playerButton: {
    margin: 16,
  },

  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '25%',
  }
});
