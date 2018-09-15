import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  View, 
  Image,
  Text,
} from 'react-native';

export default class Splash extends Component {
    async componentDidMount() {
        const {navigate} = this.props.navigation
        setTimeout(() => {
            navigate('MainStack');
        }, 2000);
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/logo.png')} style={styles.logo}/>
                <Text style={styles.title}>Scene by Scene - Spanish</Text>
                <Text style={styles.detail}>Making Authentic Language Accessible</Text>
            </View>
        );
    }
}
  
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logo: {
        width: 200,
        height: 200,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },

    detail: {
        fontSize: 18,
    }
});
  