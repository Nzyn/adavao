import React, { useRef } from 'react';
import { TouchableOpacity, Animated, TouchableOpacityProps, ViewStyle } from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    scaleValue?: number;
}

export default function AnimatedButton({
    children,
    style,
    scaleValue = 0.95,
    onPressIn,
    onPressOut,
    ...props
}: AnimatedButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(scaleAnim, {
            toValue: scaleValue,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
        }).start();
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
        }).start();
        onPressOut?.(e);
    };

    return (
        <TouchableOpacity
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}
