import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity} from 'react-native';
import api from '../api';

export default class PlayLists extends Component {
    state = {
        playLists: [], 
        channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        nextPageToken: "", 
    }

    async componentDidMount() {
        let channelId = await api.getChannelID(); 
        this.setState({channelId});

        let playLists = await api.getPlaylistsInChannel(this.state.channelId);
        this.setState({playLists: playLists.items, nextPageToken: playLists.nextPageToken});
    }

    onEndReached = async () => {
        console.log("onEndReached");
        if(!this.state.nextPageToken) return;
        let playLists = await api.getPlaylistsInChannel(this.state.channelId, this.state.nextPageToken);
        this.setState({playLists: [...this.state.playLists, ...playLists.items], nextPageToken: playLists.nextPageToken});                
    }

    onPressItem = (item) => {
        let {navigate} = this.props.navigation;
        navigate('VideoList', {playlistId: item.id})
    }

    render(){
        return (
            <View style={{flex: 1}}>
                <FlatList
                    contentContainerStyle={styles.FlatList}
                    data={this.state.playLists}
                    renderItem={({item, index})=>{
                        let thumbnailUrl = Object.values(item.snippet.thumbnails)[0].url
                        return (
                            <TouchableOpacity style={styles.item} onPress={()=>this.onPressItem(item)}>
                                <Image
                                    style={{width: 120, height: 90, resizeMode: 'cover'}}
                                    source={{uri: thumbnailUrl}}
                                />
                                <View style={styles.titleView}>
                                    <Text style={styles.title}>{item.snippet.title}</Text>
                                    <Text style={styles.detail}>{item.snippet.channelTitle}</Text>
                                </View>
                            </TouchableOpacity>
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

    item: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    title: {
        fontSize: 20,        
    },

    detail: {
        fontSize: 18,
    },

    titleView: {
        flex: 1,
        marginLeft: 8,
    }
});
  