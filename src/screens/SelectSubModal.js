import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, Modal, Picker, TouchableWithoutFeedback} from 'react-native';
import api from '../api';
import { strings } from '../i18n';
import {TARGET_LANG, NATIVE_LANG} from '../appdata';

export default class SelectSubModal extends Component {
    state={
        selectedTargetTrackKey: "",
        selectedNativeTrackKey: "",
        targetTracks: [],
        nativeTracks: [],
    }

    componentDidMount () {
        let {subtitleTracks, targetTrack, nativeTrack} = this.props;

        let targetTracks = subtitleTracks.filter(track=>track.lang_code.includes(TARGET_LANG));
        let nativeTracks = subtitleTracks.filter(track=>track.lang_code.includes(NATIVE_LANG));

        this.setState({
            targetTracks,
            nativeTracks,
            selectedTargetTrackKey: targetTrack.key,
            selectedNativeTrackKey: nativeTrack.key,
        });
    }

    onPressOK = () => {
        let {subtitleTracks, onSelect} = this.props;

        let targetTrack = subtitleTracks.find(track=>track.key == this.state.selectedTargetTrackKey);
        let nativeTrack = subtitleTracks.find(track=>track.key == this.state.selectedNativeTrackKey);

        onSelect(targetTrack, nativeTrack);
    }

    render () {
        let {visible, onSelect, onCancel} = this.props;
        return (
            <Modal
                supportedOrientations={[ 'portrait', 'landscape' ]}
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={onCancel}
            >
                <View style={styles.container}>
                    <View style={styles.modal}>
                        <Text>Transcription Subtitles</Text>
                        <Picker
                            selectedValue={this.state.selectedTargetTrackKey}
                            style={{ height: 50, width: '100%' }}
                            onValueChange={(selectedTargetTrackKey, itemIndex) => this.setState({selectedTargetTrackKey})}>
                            {this.state.targetTracks.map((track, index)=>(
                                <Picker.Item label={track.label} value={track.key} key={track.key}/>
                            ))}
                        </Picker>
                        <Text>Translation Subtitles</Text>
                        <Picker
                            selectedValue={this.state.selectedNativeTrackKey}
                            style={{ height: 50, width: '100%' }}
                            onValueChange={(selectedNativeTrackKey, itemIndex) => this.setState({selectedNativeTrackKey})}>
                            {this.state.nativeTracks.map((track, index)=>(
                                <Picker.Item label={track.label} value={track.key} key={track.key}/>
                            ))}
                        </Picker>
                        <View style={styles.buttonBar}>
                            <Button title="Cancel" onPress={onCancel}/>
                            <Button title="  OK  " onPress={this.onPressOK}/>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
        backgroundColor: '#0006',
        justifyContent: 'center'
	},

	modal: {
        backgroundColor: '#fff',
        margin: 12,
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    
    buttonBar: {
        flexDirection: 'row', 
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    }
});
