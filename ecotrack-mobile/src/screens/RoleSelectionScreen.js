import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function RoleSelectionScreen({ navigation }) {
    const handleRoleSelection = (role) => {
        navigation.navigate('Login', { role });
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity 
                style={styles.adminButton} 
                onLongPress={() => handleRoleSelection('admin')}
                delayLongPress={1000}
                activeOpacity={1}
            >
                <Text style={styles.adminIcon}>⚙️</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={styles.title}>Welcome to EcoTrack</Text>
                <Text style={styles.subtitle}>Choose your role to get started</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* Student Card */}
                <TouchableOpacity 
                    style={[styles.card, styles.studentCard]}
                    onPress={() => handleRoleSelection('student')}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🎒</Text>
                    </View>
                    <Text style={styles.cardTitle}>Student</Text>
                    <Text style={styles.cardDescription}>Learn, play, and earn points while saving the planet!</Text>
                </TouchableOpacity>

                {/* Teacher Card */}
                <TouchableOpacity 
                    style={[styles.card, styles.teacherCard]}
                    onPress={() => handleRoleSelection('teacher')}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>💼</Text>
                    </View>
                    <Text style={styles.cardTitle}>Teacher</Text>
                    <Text style={styles.cardDescription}>Manage classes, assign modules, and track student progress!</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
    adminButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        padding: 10,
        zIndex: 10,
    },
    adminIcon: {
        fontSize: 24,
        opacity: 0.15, // Hidden/Subtle
    },
    header: {
        alignItems: 'center',
        marginTop: 80,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    cardsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 20,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    card: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        width: '100%',
    },
    studentCard: {
        backgroundColor: '#27AE60', // Eco-Green
    },
    teacherCard: {
        backgroundColor: '#1B263B', // Navy Blue
    },
    iconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 40,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#E5E7EB',
        textAlign: 'center',
        lineHeight: 20,
    },
});
