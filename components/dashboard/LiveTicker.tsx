import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface LiveTickerProps {
    messages: string[];
}

export default function LiveTicker({ messages }: LiveTickerProps) {
    const translateX = useRef(new Animated.Value(width)).current;

    useEffect(() => {
        const textWidth = messages.join(' • ').length * 8; // approximate width
        const duration = textWidth * 30; // speed

        const animate = () => {
            translateX.setValue(width);
            Animated.timing(translateX, {
                toValue: -textWidth,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => animate());
        };

        animate();
    }, [messages]);

    const combinedText = messages.join('     •     ');

    return (
        <View style={styles.container}>
            <Animated.Text style={[styles.tickerText, { transform: [{ translateX }] }]} numberOfLines={1}>
                {combinedText}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 28,
        backgroundColor: theme.colors.primary,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    tickerText: {
        color: theme.colors.uberGreen,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
