import React, {Component} from 'react';
import {RootStack} from './router'
import store from './store';
import { NavigationActions } from 'react-navigation';
import api from './api';

//Jtx7lNsSPPQ
export default class App extends Component{
  async componentDidMount() {
    let sharedVideoUrl = this.props.videoUrl || "";
    let sharedVideoId = sharedVideoUrl.split("/").pop();

    if(sharedVideoId){
      const navigateAction = NavigationActions.navigate({
        routeName: 'Player',
        params: {videoId: sharedVideoId, shared: true},
      });
      store.navigator.dispatch(navigateAction);
    }
  }

  render(){
    return (
      <RootStack 
        ref={navigatorRef => {
          store.navigator = navigatorRef;
        }}
      />
    ) 
  }
}