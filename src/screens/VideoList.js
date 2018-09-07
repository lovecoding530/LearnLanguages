import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity} from 'react-native';
import ListItem from "../components/ListItem";
import api from '../api';
import appdata, {FAV_ICON} from '../appdata';

export default class VideoList extends Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerTitle: <Text style={{fontSize: 20, fontWeight: 'bold'}}>{navigation.getParam('playlistTitle')}</Text>
        };
    };
    
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
                        let thumbnailUrl = (item.snippet.thumbnails) ? Object.values(item.snippet.thumbnails)[0].url : FAV_ICON;
                        return (
                            <ListItem
                                thumbnailUrl={thumbnailUrl}
                                title={item.snippet.title} 
                                detail={item.snippet.channelTitle} 
                                onPress={()=>this.onPressItem(item)}
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
    
    flatList: {
        paddingVertical: 4,
    },
});
  