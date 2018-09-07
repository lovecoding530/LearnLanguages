/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
  StyleSheet, 
  Text, 
  View, 
  Button, 
  Slider, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Switch, 
  TextInput,
  Keyboard,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  FlatList,
  Image,
} from 'react-native';
import YouTube from 'react-native-youtube'
import api, {GOOGLE_API_KEY} from '../api';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/dist/FontAwesome5';
import { timeStringFromSeconds, strip } from '../utils';
import ParsedText from 'react-native-parsed-text';
import SlidingUpPanel from 'rn-sliding-up-panel'
import HTML from 'react-native-render-html';
import appdata from '../appdata';
import {DOMParser} from 'xmldom';

const videoId = "kw2OFJeRIZ8"; 
const targetLang = 'es';
const nativeLang = 'en';
const {width, height} = Dimensions.get('window')

export default class Player extends Component{

  constructor(props){
    super(props);

    let {state: {params: {videoId, human, auto, shared}}} = this.props.navigation;

    this.state = {
      human, 
      auto,
      shared,
      videoId,
      videoTitle: "",
      videoUrl: "",
      quality: "",
      error: "",
      status: "", //youtube player status
      tracks: [], //video tracks
      targetSubtitles: [], //video subtitle
      nativeSubtitles: [], //video subtitle
      currentTargetSubtitle: {}, //transcription
      currentNativeSubtitles: [], //translation
      showTranscription: true,
      showTranslation: true,
      play: false,
      isReady: true,
      duration: 0,
      videoSize: {width: width, height: width * ( 9 / 16)},
      currentTime: 0,
      playAll: true,
      normalSpeed: true,
      showButtons: false,
      searchWord: '',
      dictionaryData: {},
      allowDragging: true,
      searchLang: targetLang,
      isLoaded: false,
      pannelBottom: 80,
      pannelPosition: 80,
      isDraggingPanel: false,
      isKeyboardOpen: false,
      reviewMode: false,
      flaggedScenes: [],
      currentReviewScene: -1,
      isDraggingSlide: false,
    };
  }

  async componentDidMount() {
    let videoInfo = await api.getYoutubeVideoInfo(this.state.videoId);
    let videoUrl = await api.getYoutubeVideoDownloadUrlFromVideoInfo(videoInfo);
    console.log('videoUrl', videoUrl);

    var targetSubtitles = await api.getSubtitlesFromYoutubeVideoInfo(videoInfo, targetLang, false);
    if(!targetSubtitles){
      targetSubtitles = await api.getSubtitlesFromAmara(this.state.videoId, targetLang);
    }

    var nativeSubtitles = null;
    if(targetSubtitles){
      if(this.state.human || this.state.shared){
        var nativeSubtitles = await api.getSubtitlesFromYoutubeVideoInfo(videoInfo, nativeLang, false);
        if(!nativeSubtitles){
          nativeSubtitles = await api.getSubtitlesFromAmara(this.state.videoId, nativeLang);
        }
  
        if(this.state.shared){
          //save new video
          if(!nativeSubtitles){
            nativeSubtitles = await api.getAutoSubtitlesFromYoutubeVideoInfo(videoInfo, nativeLang);
          }
        }
      }else{
        var nativeSubtitles = await api.getAutoSubtitlesFromYoutubeVideoInfo(videoInfo, nativeLang);
      }
    }else{
      alert('There is no subtitle for target language');
    }

    let flaggedScenes = await appdata.getFlaggedScenes(this.state.videoId);

    this.setState({
      videoUrl,
      videoInfo,
      videoTitle: videoInfo.title,
      targetSubtitles: targetSubtitles || [],
      nativeSubtitles: nativeSubtitles || [],
      flaggedScenes,
      currentReviewScene: (flaggedScenes.length > 0) ? 0 : -1
    }, () => {
      let currentTargetSubtitle = this.state.targetSubtitles[0];
      let currentNativeSubtitles = this.getNativeSubtitlesForTarget(currentTargetSubtitle);
      this.setState({
        currentTargetSubtitle: currentTargetSubtitle || {},
        currentNativeSubtitles: currentNativeSubtitles || []
      });
    });

    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount() {
    if(this.keyboardDidShowListener) this.keyboardDidShowListener.remove();
    if(this.keyboardDidHideListener) this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow = (e) => {
    this.setState({isKeyboardOpen: true, pannelPosition: height});
    if(this.slidingUpPanel){
      this.slidingUpPanel.transitionTo(height);
    }
  }

  _keyboardDidHide = (e) => {
    this.setState({isKeyboardOpen: false});
  }

  getNativeSubtitlesForTarget(targetSubtitle){
    let nativeSubtitles = [];
    if(targetSubtitle){
      let targetStart = targetSubtitle.start;
      let targetEnd = targetSubtitle.end;
  
      let first = this.state.nativeSubtitles.find(subtitle => (subtitle.end - targetStart) > 0.25);
      
      let reversedSubtitles = this.state.nativeSubtitles.slice().reverse();
      let last = reversedSubtitles.find(subtitle => (subtitle.start - targetEnd) < -0.25);

      if(first && last){
        for(let i = first.index; i <= last.index; i ++){
          nativeSubtitles.push(this.state.nativeSubtitles[i]);
        }
      }
    }
    return nativeSubtitles;
  }

  onProgress = (e)=>{
    var currentTime = e.currentTime;

    if(!this.state.isDraggingSlide){
      this.setState({currentTime});
    }

    if(this.state.playAll){
      let currentTargetSubtitle = this.state.targetSubtitles.find(subtitle=>subtitle.end>=currentTime);
      let currentNativeSubtitles = this.getNativeSubtitlesForTarget(currentTargetSubtitle);
  
      this.setState({
        currentTargetSubtitle: currentTargetSubtitle || {},
        currentNativeSubtitles,
      });
    }else{
      if(currentTime >= this.state.currentTargetSubtitle.end){
        this.setState({play: false});
      }
    }
  }

  onPressedShowTranscription = () => {
    this.setState({showTranscription: !this.state.showTranscription})
  }

  onPressedShowTranslation = () => {
    this.setState({showTranslation: !this.state.showTranslation})
  }

  toScene = (sceneIndex) => {
    if(sceneIndex < 0) return;

    let targetSubtitle = this.state.targetSubtitles[sceneIndex];
    let nativeSubtitles = this.getNativeSubtitlesForTarget(targetSubtitle);

    this.player.seek(targetSubtitle.start);
    this.setState({
      currentTargetSubtitle: targetSubtitle,
      currentNativeSubtitles: nativeSubtitles,
      play: true,
      showTranscription: false,
      showTranslation: false,
    });
  }

  onPrev = () => {
    if(this.state.reviewMode){
      if(this.state.currentReviewScene == 0) return;
      let reviewScene = this.state.currentReviewScene - 1;
      this.toScene(this.state.flaggedScenes[reviewScene]);
      this.setState({currentReviewScene: reviewScene})
    }else{
      if(this.state.currentTargetSubtitle.index == 0) return;
      this.toScene(this.state.currentTargetSubtitle.index - 1);
    }
  }

  onNext = () => {
    if(this.state.reviewMode){
      if(this.state.currentReviewScene == this.state.flaggedScenes.length - 1) return;
      let reviewScene = this.state.currentReviewScene + 1;
      this.toScene(this.state.flaggedScenes[reviewScene]);
      this.setState({currentReviewScene: reviewScene})
    }else{
      if(this.state.currentTargetSubtitle.index == this.state.targetSubtitles.length - 1) return;
      this.toScene(this.state.currentTargetSubtitle.index + 1);      
    }
  }

  onReplay = () => {
    this.player.seek(this.state.currentTargetSubtitle.start);
    this.setState({play: true});
  }

  onPlay = () => {
    this.setState({play: true});
  }

  onPause = () => {
    this.setState({play: false});
  }

  onLoad = (e) => {
    let {duration, naturalSize} = e;
    let videoHeight = naturalSize.height * (width / naturalSize.width)
    this.setState({isLoaded: true, duration, videoSize: {width, height: videoHeight}});
    if(this.state.playAll == false){
      this.player.seek(this.state.currentTargetSubtitle.start);
    }
  }

  onSlidingComplete = (value) => {
    console.log("onSlidingComplete", value)

    if(this.state.playAll){
      this.player.seek(value);
    }else{
      let currentTargetSubtitleIndex = this.state.targetSubtitles.findIndex(subtitle=>subtitle.end > value);
      this.toScene(currentTargetSubtitleIndex);
    }
    this.setState({isDraggingSlide: false});
  }

  onSlideValueChange = (value) => {
    console.log("onSlideValueChange", value)
    this.setState({isDraggingSlide: true, currentTime: value});
  }

  onModeSwitchChanged = (value) => {
    this.setState({
      playAll: value,
      showTranscription: true, 
      showTranslation: true,
    });
  }

  onSpeedSwitchChanged = (value) => {
    this.setState({normalSpeed: value});    
  }

  onPressPlayer = () => {
    this.setState({showButtons: !this.state.showButtons})
  }

  onPressTargetWord = async (word) => {
    this.setState({searchLang: targetLang, searchWord: word}, async ()=>{
      await this.search();
    });
  }

  onPressNativeWord = async (word) => {
    this.setState({searchLang: nativeLang, searchWord: word}, async ()=>{
      await this.search();
    });
  }

  onChangeSearchText = (text) => {
    this.setState({searchWord: text});
  }

  onSearch = async () => {
    await this.search();
  }

  onToggleSearchLang = () => {
    this.setState({searchLang: (this.state.searchLang == targetLang) ? nativeLang : targetLang});
  }

  search = async () => {
    let from = this.state.searchLang;
    let dest = (from == targetLang) ? nativeLang : targetLang;
    let dictionaryData = await api.getDictionaryData(from, dest, this.state.searchWord);
    this.setState({dictionaryData});
  }

  onFocusSearch = () => {
  }

  onLayoutSubtitleView = (e) => {
    if(!this.state.videoUrl) return;
    let {nativeEvent: { layout}} = e;
    let endY = layout.y + layout.height + 20;
    let pannelBottom = height - endY;
    this.setState({pannelBottom, pannelPosition: pannelBottom}, ()=>{
      if(this.slidingUpPanel && this.state.isLoaded && !this.state.isKeyboardOpen){
        this.slidingUpPanel.transitionTo(pannelBottom);
      }
    });
  }

  onDragStartPanel = (position) => {
    this.setState({isDraggingPanel: true, pannelPosition: position});
  }

  onDragPanel = (position) => {
    // this.setState({isDraggingPanel: true, pannelPosition: position});
  }

  onDragEndPanel = (position) => {
    this.setState({isDraggingPanel: false, pannelPosition: position});
  }

  onToggleReviewMode = () => {
    let reviewMode = !this.state.reviewMode;
    let playAll = (reviewMode) ? false: this.state.playAll;
    this.setState({reviewMode, playAll});
    if(reviewMode){
      if(this.state.flaggedScenes.length == 0) return;
      this.toScene(this.state.flaggedScenes[0]);
    }
  }

  onToggleFlag = async () => {
    let scene = this.state.currentTargetSubtitle.index;
    let flaggedScenes = this.state.flaggedScenes.slice();
    let index = flaggedScenes.indexOf(scene);
    if(index > -1){
      flaggedScenes.splice(index, 1);
    }else{
      flaggedScenes.push(scene);
    }
    await appdata.setFlaggedScenes(this.state.videoId, flaggedScenes);
    this.setState({
      flaggedScenes,
      currentReviewScene: (flaggedScenes.length > 0) ? 0 : -1
    });
  }

  getMeaningStr(){
    let meaningStr = "";
    let {tuc} = this.state.dictionaryData;
    if(tuc){
      let _tuc = tuc.slice(0, 7);
      _tuc.forEach((item, index) => {
        let itemStr = (index + 1) + ". ";
        if(item.meanings){
          let meaning = item.meanings.find(meaning=>meaning.language==this.state.searchLang);
          if(meaning) {
            itemStr = itemStr + meaning.text + ": ";
          }
        }
        if(item.phrase){
          itemStr = itemStr + "<strong class='meaning'>" + item.phrase.text + "</strong>";
        }
        if(itemStr){
          meaningStr = meaningStr + itemStr + "<br/>";
        }
      });
    }
    meaningStr = "<span class='meaningspan'>" + meaningStr + "</span>";
    return meaningStr;
  }

  render() {
    let currentTargetSubtitleText = this.state.currentTargetSubtitle ? this.state.currentTargetSubtitle.text || "" : "";
    currentTargetSubtitleText = strip(currentTargetSubtitleText);
    let {examples: dicExamples} = this.state.dictionaryData;
    let isFlagged = this.state.flaggedScenes.indexOf(this.state.currentTargetSubtitle.index) > -1;
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={this.onPressPlayer}>
          {this.state.videoUrl ?
            <View style={[styles.playerWrapper, this.state.videoSize]}>
              <Video source={{uri: this.state.videoUrl}}  // Can be a URL or a local file.
                ref={(ref) => this.player = ref}          // Store reference
                onBuffer={this.onBuffer}                  // Callback when remote video is buffering
                onEnd={this.onEnd}                        // Callback when playback finishes
                onError={this.videoError}                 // Callback when video cannot be loaded
                onLoad={this.onLoad}
                style={styles.player}
                paused={!this.state.play}
                progressUpdateInterval={100}
                onProgress={this.onProgress}
                onPress={this.onPressPlayer}
                rate={this.state.normalSpeed ? 1.0 : 0.75}
                resizeMode={"stretch"}
              />
              {(!this.state.play || this.state.showButtons) &&
              <View style={styles.playerOverlay}>
                <View style={styles.playerTopBar}>
                  <Text numberOfLines={1} style={{color: '#fff', paddingVertical: 4,}}>{this.state.videoTitle}</Text>
                  <View style={styles.settingsBar}>
                    <TouchableOpacity 
                      onPress={this.onToggleReviewMode}>
                      {this.state.reviewMode ?
                        <View style={[styles.reviewMode, {backgroundColor: 'red'}]}>
                          <Icon name="flag" size={16} color='#fff' solid/>
                          <Text style={{color: '#fff'}}> {this.state.currentReviewScene + 1}/{this.state.flaggedScenes.length}</Text>
                        </View>
                        :
                        <View style={styles.reviewMode}>
                          <Icon name="flag" size={16} color='red' solid/>
                          <Text style={{color: '#fff'}}> {this.state.flaggedScenes.length}</Text>
                        </View>
                      }
                    </TouchableOpacity>
                    <View style={{flex: 1}}/>
                    <Text style={{color: '#fff'}}>Scenes</Text>
                    <Switch
                      value={this.state.playAll}
                      onValueChange={this.onModeSwitchChanged}
                      tintColor='#fff'
                    />
                    <Text style={{color: '#fff'}}>Play all</Text>
                    <View style={{flex: 1}}/>
                    <Text style={{color: '#fff'}}>75%</Text>
                    <Switch
                      value={this.state.normalSpeed}
                      onValueChange={this.onSpeedSwitchChanged}
                      tintColor='#fff'
                    />
                    <Text style={{color: '#fff'}}>100%</Text>
                  </View>
                </View>
                {this.state.playAll ?
                  <View style={styles.playallButtons}>
                    {this.state.play ?
                      <TouchableOpacity 
                        onPress={this.onPause}
                        style={styles.playerButton}
                      >
                        <Icon name="pause" size={30} color='#fff'/>
                      </TouchableOpacity>                  
                      :
                      <TouchableOpacity 
                        onPress={this.onPlay}
                        style={styles.playerButton}
                      >
                        <Icon name="play" size={30} color='#fff'/>
                      </TouchableOpacity>
                    }
                  </View>
                  :
                  <View style={styles.buttons}>
                    <TouchableOpacity 
                      onPress={this.onPrev}
                      disabled={this.state.currentTargetSubtitle.index == 0}
                      style={styles.playerButton}
                    >
                      <Icon name="step-backward" size={30} color='#fff'/>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={this.onReplay}
                      style={styles.playerButton}
                    >
                      <Icon name="undo-alt" size={30} color='#fff'/>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={this.onNext}
                      disabled={this.state.currentTargetSubtitle.index == this.state.targetSubtitles.length - 1}
                      style={styles.playerButton}
                    >
                      <Icon name="step-forward" size={30} color='#fff'/>
                    </TouchableOpacity>
                  </View>
                }
                <View style={styles.playerBottomBar}>
                  <View style={styles.sliderBar}>
                    <Text style={{color: '#fff'}}>{timeStringFromSeconds(this.state.currentTime)}</Text>
                    <Slider 
                      style={styles.playerSlider}
                      onSlidingComplete={this.onSlidingComplete}
                      onValueChange={this.onSlideValueChange}
                      maximumValue={this.state.duration}
                      minimumValue={0}
                      value={this.state.currentTime}
                      maximumTrackTintColor='#fff'
                    />
                    <Text style={{color: '#fff'}}>{timeStringFromSeconds(this.state.duration)}</Text>
                  </View>
                </View>
              </View>
              }
            </View>
            :
            <View style={styles.playerWrapper} />
          }
        </TouchableWithoutFeedback>
        {this.state.isLoaded &&
          <View 
            style={styles.subtitleView} 
            onLayout={this.onLayoutSubtitleView}
          >
            <View style={styles.transcription}>
              {this.state.showTranscription ?
                <View>
                  <ParsedText
                    style={styles.caption}
                    parse={
                      [
                        {pattern: /[^\s-&+,:;=?@#|'<>.^*()%!\\]+/, style: styles.parsedText, onPress: this.onPressTargetWord},
                      ]
                    }
                    childrenProps={{allowFontScaling: false}}
                  >
                    {currentTargetSubtitleText}
                  </ParsedText>
                  <TouchableOpacity 
                    style={{position: 'absolute', top: 0, right: 0, padding: 8,}}
                    onPress={this.onToggleFlag}>
                    {isFlagged ? 
                      <Icon name="flag" size={20} color='red' solid/>
                      :
                      <Icon name="flag" size={20} color='red' regular/>
                    }
                  </TouchableOpacity>
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
                    <ParsedText
                      key={index.toString()}
                      style={[styles.caption, {color: '#4682b4'}]}
                      parse={
                        [
                          {pattern: /[^\s-&+,:;=?@#|'<>.^*()%!\\]+/, style: styles.parsedText, onPress: this.onPressNativeWord},
                        ]
                      }
                      childrenProps={{allowFontScaling: false}}
                    >
                      {strip(subtitle.text)}
                    </ParsedText>
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
        }
        <SlidingUpPanel
          ref={ref=>this.slidingUpPanel=ref}
          visible={true}
          startCollapsed={true}
          showBackdrop={false}
          allowDragging={true}
          draggableRange={{
            top: height,
            bottom: 80,
          }}
          onDrag={this.onDragPanel}
          onDragStart={this.onDragStartPanel}
          onDragEnd={this.onDragEndPanel}
        >
          <View style={styles.panel}>
            <View style={{height: this.state.pannelPosition}}>
              <View style={styles.panelHeader}>
                <Image source={require('../assets/glosbe.png')} style={{width: 40, height: 40}}/>
                <TextInput 
                  style={styles.search}
                  returnKeyType={'search'}
                  onChangeText={this.onChangeSearchText}
                  onSubmitEditing={this.onSearch}
                  onFocus={this.onFocusSearch}
                  underlineColorAndroid='#fff'
                  selectionColor='#fff'
                  value={this.state.searchWord}/>
                <TouchableOpacity style={styles.searchLangBtn} onPress={this.onToggleSearchLang}>
                  <Text style={styles.searchLangText}>{this.state.searchLang.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
              {dicExamples &&
                <FlatList
                  style={styles.dictionaryList}
                  data={dicExamples.slice(0, 10)}
                  keyExtractor={(item, index)=>index.toString()}
                  ListHeaderComponent={
                    <HTML classesStyles={styles.dictionaryExampleStyles} html={this.getMeaningStr()}/>
                  }
                  ListFooterComponent={
                    <Text style={{width: '100%', textAlign: 'center', fontSize: 18,}}>courtesy of glosbe.com</Text>
                  }
                  renderItem={({item, index})=>(
                    <View style={styles.exampleListItem}>
                      <HTML classesStyles={styles.dictionaryExampleStyles} html={"<span class='text'>" + item.first + '</span>'}/>
                      <HTML classesStyles={styles.dictionaryExampleStyles} html={"<span class='text second'>" + item.second + '</span>'}/>
                    </View>
                  )}
                />
              }
            </View>
          </View>
        </SlidingUpPanel>
      </View>
    );
  }
}

const styles = {

  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },

  caption: {
    fontSize: 17,
    textAlign: 'center',
    marginHorizontal: 8,
    marginTop: 8,
  },

  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },

  subtitleView: {
  },

  targetSubtitleView: {
    flexDirection: 'row',
  },

  transcription: {
    zIndex: -1,
  },

  translation: {
    marginVertical: 4,
    zIndex: -1,
  },

  playerWrapper: {
  },

  playerOverlay: {
    flex: 1, 
    backgroundColor: '#0006',
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
    padding: 8,
  },

  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '25%',
  },

  playallButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: '25%',
  },

  sliderBar: {
    flexDirection: 'row',
    width: '100%',
  },

  playerSlider: {
    flex: 1,
  },

  playerBottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 8
  },

  playerTopBar: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingHorizontal: 8,
  },

  settingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  parsedText: {
    // color: 'red',
  },

  dictionaryView: {
    flex: 1,
    width: '100%',
    padding: 8,
  },

  dictionaryMeaningText: {
    fontSize: 17,
    marginHorizontal: 8,
    marginVertical: 4,
  },

  panel: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },

  panelHeader: {
    height: 60,
    paddingHorizontal: 8,
    backgroundColor: '#4682b4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flex: 1,
    color: '#fff', 
    fontSize: 18,
  },

  dictionaryExampleStyles: {
    keyword: {
      fontSize: 20,
    },
    text: {
      fontSize: 18,
    },
    second: {
      color: '#4682b4'
    },
    meaningspan: {
      fontSize: 18,
      marginHorizontal: 8,
      marginVertical: 4,  
    },
    meaning: {
      color: '#4682b4',
    }
  },

  exampleListItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: 'gray'
  },

  dictionaryList: {
    marginBottom: 24,
  },

  searchLangBtn: {
    borderWidth: 2, 
    borderColor: '#fff', 
    paddingHorizontal: 8,
    marginLeft: 8,
  },

  searchLangText: {
    color: '#fff',
    fontSize: 20,
  },

  reviewMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
    borderWidth: 1, 
    borderColor: 'red', 
    minWidth: 60,
  }
};
