import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView } from 'react-native';

export default function WelcomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image 
                    source={require('../../assets/ecotrack_logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>Welcome to EcoTrack</Text>
                <Text style={styles.subtitle}>
                    Join a community of students and teachers taking action for the planet. Learn about the SDGs, complete interactive quizzes, and earn points and badges along the way!
                </Text>

                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate('RoleSelection')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>GET STARTED</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B3D2E',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 24,
        borderRadius: 28,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#A7F3D0',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#D1FAE5',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 18,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
