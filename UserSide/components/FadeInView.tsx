import React, { useRef, useEffect } from 'react';
import { View, Animated, ViewProps, ViewStyle } from 'react-native';

interface FadeInViewProps extends ViewProps {
    children: React.ReactNode;
    duration?: number;
    delay?: number;
    style?: ViewStyle | ViewStyle[];
}

export default function FadeInView({
    children,
    duration = 300,
    delay = 0,
    style,
    ...props
}: FadeInViewProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            {...props}
            style={[
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}
