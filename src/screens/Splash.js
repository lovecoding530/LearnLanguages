import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  View, 
  Image,
  Text,
} from 'react-native';
import appdata, {APP_NAME} from '../appdata';
import {currentLocaleTwoLetters} from '../i18n';
import * as RNIap from 'react-native-iap';
import SelectLangModal from './SelectLangModal';
import SubscribeModal from './SubscribeModal';
import { strings } from '../i18n';
import RNExitApp from 'react-native-exit-app';

const FREE_USE_TIME = 5 * 60 * 1000;

const itemSku = Platform.select({
    ios: 'com.scenebyscene.spanish.monthly.payment',
    android: 'monthly.payment'
});

export default class Splash extends Component {
    state = {
        visibleLangModal: false,
        visibleSubscribeModal: false,
    }

    async componentDidMount() {
        await this.checkPurchase();

        setTimeout(async ()=>{
            if(await appdata.getNativeLang()){
                this.props.navigation.navigate('MainStack');
            }else{
                this.setState({visibleLangModal: true});
            }
        }, 2000);

    }

    checkPurchase = async () => {
        let time = new Date().getTime();
        let firstRunTime = await appdata.getItem('first-run-time');

        if(firstRunTime){
            let usedTime = time - firstRunTime;
            setTimeout(async ()=>{
                await this.buyProduct();
            }, FREE_USE_TIME - usedTime);
        }else{
            setTimeout(async ()=>{
                await this.buyProduct();
            }, FREE_USE_TIME);
            appdata.setItem('first-run-time', time);
        }
    }

    buyProduct = async () => {
        try {
            const products = await RNIap.getProducts([itemSku]);
            console.log({products});
            const availablePurchases = await RNIap.getAvailablePurchases();
            console.log({availablePurchases});
            let monthlyPurchase = availablePurchases.find((purchase)=>purchase.productId == itemSku);
            if(!monthlyPurchase){
                // alert(Platform.OS == 'ios')
                if(Platform.OS == 'ios') {
                    this.setState({visibleSubscribeModal: true});
                }else{
                    const purchased = await RNIap.buySubscription(itemSku);
                    console.log({purchased});
                }
            }
        } catch(err) {
            console.log(err); // standardized err.code and err.message available
            RNExitApp.exitApp();
        }
    }

    onSelectLang = async (selectedLang) => {
        console.log({selectedLang});
        if(selectedLang){
            await appdata.setNativeLang(selectedLang);
            this.setState({visibleLangModal: false});
            this.props.navigation.navigate('MainStack');
        }
    }

    onCancelSelectLang = () => {
        this.setState({visibleLangModal: false});
    }

    onOKSubscribe = async () => {
        this.setState({visibleSubscribeModal: false});
        try {
            const purchased = await RNIap.buySubscription(itemSku);
            console.log({purchased});
        } catch(err) {
            console.log(err); // standardized err.code and err.message available
            RNExitApp.exitApp();
        }
    }

    onCancelSubscribe = () => {
        this.setState({visibleSubscribeModal: false});
        RNExitApp.exitApp();
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/logo.png')} style={styles.logo}/>
                <Text style={styles.title}>{strings(APP_NAME)}</Text>
                <Text style={styles.detail}>{strings('Making Authentic Language Accessible')}</Text>
                <SelectLangModal 
                    visible={this.state.visibleLangModal}
                    onCancel={this.onCancelSelectLang}
                    onOK={this.onSelectLang}
                />
                <SubscribeModal 
                    visible={this.state.visibleSubscribeModal}
                    onCancel={this.onCancelSubscribe}
                    onOK={this.onOKSubscribe}
                />
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
  