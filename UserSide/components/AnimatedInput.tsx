import React, { useRef, useEffect } from 'react';
import { TextInput, Animated, TextInputProps, ViewStyle, StyleSheet } from 'react-native';

interface AnimatedInputProps extends TextInputProps {
    containerStyle?: ViewStyle | ViewStyle[];
}

export default function AnimatedInput({
    containerStyle,
    style,
    onFocus,
    onBlur,
    ...props
}: AnimatedInputProps) {
    const borderAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleFocus = (e: any) => {
        Animated.parallel([
            Animated.timing(borderAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1.01,
                tension: 100,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        Animated.parallel([
            Animated.timing(borderAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
        onBlur?.(e);
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#ddd', '#1D3557'],
    });

    return (
        <Animated.View
            style={[
                containerStyle,
                {
                    borderColor,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <TextInput
                {...props}
                style={style}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </Animated.View>
    );
}
