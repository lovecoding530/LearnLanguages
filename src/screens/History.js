import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity} from 'react-native';
import appdata from '../appdata';

export default class History extends Component {
    constructor(props){
        super(props);
        this.state = {
            videos: [], 
        }    
    }

    async componentDidMount() {
        let videos = await appdata.getHistoryVideos();
        this.setState({videos});
        this.props.navigation.addListener('willFocus', async (route) => { 
            let videos = await appdata.getHistoryVideos();
            this.setState({videos});
        });
    }

    onPressItem = (item) => {
        let {navigate} = this.props.navigation;
        navigate('Player', {videoId: item.contentDetails.videoId})
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
  