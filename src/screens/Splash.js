import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  View, 
  Image,
  Text,
} from 'react-native';
import appdata, {APP_NAME} from '../appdata';
import * as RNIap from 'react-native-iap';

const FREE_USE_TIME = 1 * 60 * 60;

export default class Splash extends Component {
    async componentDidMount() {
        let start = new Date();
        let res = await this.checkPurchase();
        let end = new Date();
        if(res){
            let diff = end - start;
            setTimeout(()=>{
                this.props.navigation.navigate('MainStack');
            }, 2000 - diff);
        }
    }

    checkPurchase = async () => {
        let time = new Date().getTime() / 1000;
        let firstRunTime = await appdata.getItem('first-run-time');

        if(firstRunTime){
            if(time - firstRunTime > FREE_USE_TIME){

                const itemSku = Platform.select({
                    ios: 'com.example.coins100',
                    android: 'monthly.payment'
                });

                try {
                    const availablePurchases = await RNIap.getAvailablePurchases();
                    let monthlyPurchase = availablePurchases.find((purchase)=>purchase.productId == itemSku);
                    if(!monthlyPurchase){
                        const purchase = await RNIap.buySubscription(itemSku);
                        console.log({purchase});
                    }
                    return true;
                } catch(err) {
                    console.log(err); // standardized err.code and err.message available
                    return false;
                }
            }else{
                return true;
            }
        }else{
            appdata.setItem('first-run-time', time);
            return true;
        }
    }
    
    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/logo.png')} style={styles.logo}/>
                <Text style={styles.title}>{APP_NAME}</Text>
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
  