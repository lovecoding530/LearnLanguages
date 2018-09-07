import React, {Component} from 'react';
import {Text, View, Image, TouchableOpacity} from 'react-native';

export default ListItem = (props) => {
    let {thumbnailUrl, title, detail, onPress, styles: pStyles} = props;
    pStyles = pStyles || {};
    return (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <Image
                style={styles.image}
                source={{uri: thumbnailUrl}}
            />
            <View style={styles.titleView}>
                <Text style={[styles.title, pStyles.title]}>{title}</Text>
                <Text style={styles.detail} numberOfLines={3}>{detail}</Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = {
    item: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    
    image: {
        width: 120, 
        height: 90, 
        resizeMode: 'cover'
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
}