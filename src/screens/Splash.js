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
import { strings } from '../i18n';
import RNExitApp from 'react-native-exit-app';

const FREE_USE_TIME = 5 * 60 * 1000;

export default class Splash extends Component {
    state = {
        visibleModal: false,
    }

    async componentDidMount() {
        await this.checkPurchase();

        setTimeout(async ()=>{
            if(await appdata.getNativeLang()){
                this.props.navigation.navigate('MainStack');
            }else{
                this.setState({visibleModal: true});
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
        const itemSku = Platform.select({
            ios: 'com.example.coins100',
            android: 'monthly.payment'
        });

        try {
            const availablePurchases = await RNIap.getAvailablePurchases();
            let monthlyPurchase = availablePurchases.find((purchase)=>purchase.productId == itemSku);
            if(!monthlyPurchase){
                const purchased = await RNIap.buySubscription(itemSku);
                console.log({purchased});
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
            this.setState({visibleModal: false});
            this.props.navigation.navigate('MainStack');    
        }
    }

    onCancelSelectLang = () => {
        this.setState({visibleModal: false});
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/logo.png')} style={styles.logo}/>
                <Text style={styles.title}>{strings(APP_NAME)}</Text>
                <Text style={styles.detail}>{strings('Making Authentic Language Accessible')}</Text>
                <SelectLangModal 
                    visible={this.state.visibleModal}
                    onCancel={this.onCancelSelectLang}
                    onOK={this.onSelectLang}
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
  