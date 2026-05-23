import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgress({
    size = 120,
    strokeWidth = 12,
    progress = 0, // 0 to 1
    color = '#10B981',
    backgroundColor = '#E5E7EB',
    children
}) {
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    <Circle
                        stroke={backgroundColor}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <AnimatedCircle
                        stroke={color}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                    />
                </G>
            </Svg>
            <View style={StyleSheet.absoluteFillObject}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {children}
                </View>
            </View>
        </View>
    );
}
