import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, Modal, Picker, TouchableWithoutFeedback} from 'react-native';
import api from '../api';
import { strings } from '../i18n';
import {LANGUAGES} from '../appdata';

export default class SelectLangModal extends Component {
    state={
        selectedLang: "",
    }

    componentDidMount () {
    }

    render () {
        let {visible, onCancel, onOK} = this.props;
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
                        <Text>Sorry at this time this app is only available for the following languages. If you would like to continue please select your preferred language.</Text>
                        <Picker
                            selectedValue={this.state.selectedLang}
                            style={{ height: 50, width: '100%' }}
                            onValueChange={(selectedLang, itemIndex) => this.setState({selectedLang})}>
                            <Picker.Item label={"None"} value={''} key={''}/>
                            {LANGUAGES.map((lang, index)=>(
                                <Picker.Item label={lang.text} value={lang.code} key={lang.code}/>
                            ))}
                        </Picker>
                        <View style={styles.buttonBar}>
                            <Button title="Cancel" onPress={onCancel}/>
                            <Button title="  OK  " onPress={()=>onOK(this.state.selectedLang)}/>
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
