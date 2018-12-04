import React, { Component } from 'react';
import {
    View,
    Platform,
    StatusBar
} from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper'

const MyStatusBar = (props) => {
    return (
        <View 
            style={{
                backgroundColor: '#000',
                height: Platform.select({
                    ios: getStatusBarHeight(true),
                    android: 0
                }),
            }}
        >
            <StatusBar barStyle='light-content' />
        </View>
    )
}

export default MyStatusBar;