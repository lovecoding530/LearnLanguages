import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import PlayLists from './screens/PlayLists'
import VideoList from './screens/VideoList'
import Settings from './screens/Settings'
import Player from './screens/Player'

import { strings } from "./i18n";
import store from "./store";

const BrowseStack = createStackNavigator({
    PlayLists: { 
        screen: PlayLists,
        navigationOptions: {
            header: null,
        }
    },
    VideoList: { screen: VideoList },
    // Player: { screen: Player },
}, {
    // headerMode: 'none',
});

const TabNav =  createBottomTabNavigator({
    Browse: BrowseStack,
    Settings: Settings,
}, {
    navigationOptions: ({ navigation }) => ({
        tabBarLabel: ({ focused, tintColor }) => {
            const { routeName } = navigation.state;
            return (
                <Text 
                    style={{
                        textAlign: 'center', 
                        fontSize: 18,
                        fontWeight: 'bold', 
                        color: tintColor
                    }}
                >
                    {strings(routeName)}
                </Text>
            );
        },
        // tabBarOnPress: ({previousScene, scene}) => {
        //     console.log(previousScene, scene);
        // },
    }),
    tabBarOptions: {
        activeTintColor: 'tomato',
        inactiveTintColor: 'gray',
    }
});

export const RootStack = createStackNavigator(
    {
      MainTab: {
        screen: TabNav,
      },
      Player: {
        screen: Player,
      },
    },
    {
      mode: 'modal',
      headerMode: 'none',
    }
);