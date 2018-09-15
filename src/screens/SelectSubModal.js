import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, Modal} from 'react-native';
import api from '../api';
import { strings } from '../i18n';

export default class SelectSubModal extends Component {
    render () {
        let {visible} = this.props;
        return (
            <Modal
                supportedOrientations={[ 'portrait', 'landscape' ]}
                animationType="slide"
                transparent={true}
                visible={visible}
            >
                <View style={styles.container}>
                    <View style={styles.modal}>
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.backgroundModal,
		justifyContent: 'center',
		alignItems: 'center'
	},

	modal: {
		backgroundColor: Colors.backgroundPrimary,
		borderRadius: deviceWidth(1.2),
		width: 300,
		padding: 15,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: Metrics.shadowOffset, height: Metrics.shadowOffset },
		shadowOpacity: 0.4,
		shadowRadius: 0
	},
});
