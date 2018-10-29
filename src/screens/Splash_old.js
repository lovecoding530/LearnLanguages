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

const FREE_USE_TIME = 30;

export default class Splash extends Component {
    state = {
        visibleModal: false,
    }

    async componentDidMount() {
        let start = new Date();
        let res = await this.checkPurchase();
        let end = new Date();
        if(res){
            let diff = end - start;
            setTimeout(async ()=>{
                if(await appdata.getNativeLang()){
                    this.props.navigation.navigate('MainStack');
                }else{
                    this.setState({visibleModal: true});
                }
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
                    const products = await RNIap.getProducts([itemSku]);
                    console.log({products});
                    const availablePurchases = await RNIap.getAvailablePurchases();
                    console.log({availablePurchases});
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
  