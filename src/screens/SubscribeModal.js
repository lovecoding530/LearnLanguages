import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, Modal, Picker, TouchableWithoutFeedback} from 'react-native';
import { strings } from '../i18n';

export default class SubscribeModal extends Component {

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
                        <Text style={styles.desc}>
                            To use this app, A $1.49/month purchase will be applied to your iTunes account at the end of the trial.
                            Subscriptions will automatically renew unless canceled within 24-hours before the end of the current period. You can cancel anytime with your iTunes account settings. Any unused portion of a free trial will be forfeited if you purchase a subscription.                        </Text>
                        <Button title={"Terms of Service"} onPress={()=>{}}/>
                        <Button title={"Privacy Policy"} onPress={()=>{}}/>
                        <View style={styles.buttonBar}>
                            <Button title={strings("Cancel")} onPress={onCancel}/>
                            <Button title={strings("OK")} onPress={onOK}/>
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
        marginTop: 16,
        paddingHorizontal: 16,
    }, 

    desc: {
        fontSize: 17,
        marginBottom: 16,
        textAlign: 'justify'
    }
});
