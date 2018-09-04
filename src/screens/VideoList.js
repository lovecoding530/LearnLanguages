import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity} from 'react-native';
import api from '../api';
import appdata from '../appdata';

export default class VideoList extends Component {
    constructor(props){
        super(props);
        let {state: {params: {playlistId}}} = this.props.navigation;
        this.state = {
            videos: [], 
            playlistId,
            nextPageToken: "", 
        }    
    }

    async componentDidMount() {
        let playlistItems = await api.getPlaylistItemss(this.state.playlistId);
        this.setState({videos: playlistItems.items, nextPageToken: playlistItems.nextPageToken});
    }

    onEndReached = async ()=>{
        if(!this.state.nextPageToken) return;
        let playlistItems = await api.getPlaylistItemss(this.state.playlistId, this.state.nextPageToken);
        this.setState({videos: [...this.state.videos, ...playlistItems.items], nextPageToken: playlistItems.nextPageToken});                
    }

    onPressItem = async (item) => {
        await appdata.addHistoryVideo(item);
        let {navigate, state: {params: {human, auto}}} = this.props.navigation;
        navigate('Player', {videoId: item.contentDetails.videoId, human, auto});
    }

    render(){
        return (
            <View style={{flex: 1}}>
                <FlatList
                    contentContainerStyle={styles.flatList}
                    data={this.state.videos}
                    renderItem={({item, index})=>{
                        
                        let thumbnailUrl = (item.snippet.thumbnails) ? 
                                           Object.values(item.snippet.thumbnails)[0].url : 
                                           "https://facebook.github.io/react-native/docs/assets/favicon.png";
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
    
    flatList: {
        paddingVertical: 4,
    },

    item: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    title: {
        fontSize: 18,        
    },

    detail: {
        fontSize: 16,
    },

    titleView: {
        flex: 1,
        marginHorizontal: 8,
    }
});
  