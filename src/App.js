import React, {Component} from 'react';
import {RootStack} from './router'
import TestPlayer from './screens/TestPlayer'
import api from './api';

export default class App extends Component{
  render(){
    return <RootStack/>
  }
}