import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Card({ children, style, variant = 'default' }) {
    // We can support variants like primary, secondary (e.g. green, yellow)
    // For now we'll stick to a default white/light green or dark mode gamified look

    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 4,
        overflow: 'hidden',
        // iOS shadow equivalent
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});
