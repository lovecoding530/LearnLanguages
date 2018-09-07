import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity} from 'react-native';
import ListItem from "../components/ListItem";
import api from '../api';
import {FAV_ICON} from '../appdata';
import { strings } from '../i18n';

export default class PlayLists extends Component {
    state = {
        playLists: [], 
        channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        humanChannelId: "UCxbq9z7XbThxhIxx2dyWSMg",
        autoChannelId: "UC8XwOvmFVdImmPSaJF-OUew",
        nextPageToken: "", 
    }

    async componentDidMount() {
        let channelId = (this.props.human) ? this.state.humanChannelId : this.state.autoChannelId;
        // let channelId = await api.getChannelID(); 
        this.setState({channelId});

        let playLists = await api.getPlaylistsInChannel(channelId);
        this.setState({playLists: playLists.items, nextPageToken: playLists.nextPageToken});
    }

    onEndReached = async () => {
        if(!this.state.nextPageToken) return;
        let playLists = await api.getPlaylistsInChannel(this.state.channelId, this.state.nextPageToken);
        this.setState({playLists: [...this.state.playLists, ...playLists.items], nextPageToken: playLists.nextPageToken});                
    }

    onPressItem = (item) => {
        let {navigation: {navigate}, human, auto} = this.props;
        navigate('VideoList', {playlistId: item.id, playlistTitle: item.snippet.title, human, auto})
    }

    render(){ 
        return (
            <View style={{flex: 1}}>
                <View style={{ padding: 16, elevation: 2, backgroundColor: '#fff' }}>
                    <Text style={{fontSize: 20, fontWeight: 'bold'}}>{strings('Scene by Scene - Spanish')}</Text>
                </View>
                <FlatList
                    contentContainerStyle={styles.FlatList}
                    data={this.state.playLists}
                    renderItem={({item, index})=>{
                        let thumbnailUrl = (item.snippet.thumbnails) ? Object.values(item.snippet.thumbnails)[0].url : FAV_ICON;
                        return (
                            <ListItem
                                thumbnailUrl={thumbnailUrl}
                                title={item.snippet.title} 
                                detail={item.snippet.channelTitle}
                                onPress={()=>this.onPressItem(item)}
                                styles={{
                                    title: {
                                        fontSize: 20,
                                    },
                                }}
                            />
                        )
                    }}
                    keyExtractor={(item, index) => index.toString()}
                    onEndReachedThreshold={0.1}
                    onEndReached={this.onEndReached}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    FlatList: {
        paddingVertical: 4,
    },
});
  