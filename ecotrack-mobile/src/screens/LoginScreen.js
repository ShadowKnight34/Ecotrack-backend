import React, { useState, useContext } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function LoginScreen({ navigation, route }) {
    const role = route.params?.role || 'student';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { setIsAuthenticated, setUser } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter your email and password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });

            // The backend responds with `{ message, token, user }`
            const { token, user } = response.data;

            // Save token securely in AsyncStorage with the key expected by the interceptor
            if (token) {
                await AsyncStorage.setItem('userToken', token);
                setUser(user); // Send the user data to Context before auth to route properly
                setIsAuthenticated(true);
            } else {
                Alert.alert('Login Failed', 'No token received from backend.');
            }
        } catch (error) {
            console.error('Login Error:', error);
            const errorMsg = error.response?.data?.message || 'Something went wrong during login.';
            Alert.alert('Login Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const styles = getDynamicStyles(role);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={styles.logo}>🌿</Text>
                <Text style={styles.title}>EcoTrack</Text>
                <Text style={styles.subtitle}>Learn. Play. Save the Planet.</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                </TouchableOpacity>

                {role !== 'admin' && (
                    <TouchableOpacity onPress={() => navigation.navigate('Register', { role })}>
                        <Text style={styles.linkText}>
                            Don't have an account? <Text style={[styles.linkBold, role === 'teacher' && { color: '#60A5FA' }]}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const getDynamicStyles = (role) => {
    const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isTeacherOrAdmin ? '#1B263B' : '#0B3D2E',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        backButton: {
            position: 'absolute',
            top: 60,
            left: 20,
            padding: 10,
            zIndex: 10,
        },
        backButtonText: {
            color: isTeacherOrAdmin ? '#60A5FA' : '#34D399',
            fontSize: 16,
            fontWeight: '600',
        },
        header: {
            alignItems: 'center',
            marginBottom: 48,
        },
        logo: {
            fontSize: 56,
            marginBottom: 8,
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            color: isTeacherOrAdmin ? '#93C5FD' : '#A7F3D0',
        },
        subtitle: {
            fontSize: 14,
            color: isTeacherOrAdmin ? '#60A5FA' : '#6EE7B7',
            marginTop: 4,
            letterSpacing: 1,
        },
        form: {
            width: '100%',
        },
        input: {
            backgroundColor: isTeacherOrAdmin ? '#273859' : '#134E3A',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: '#E5E7EB',
            fontSize: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: isTeacherOrAdmin ? '#3A5078' : '#1F6E50',
        },
        button: {
            backgroundColor: isTeacherOrAdmin ? '#3B82F6' : '#10B981',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 20,
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '700',
        },
        linkText: {
            color: '#9CA3AF',
            textAlign: 'center',
            fontSize: 14,
        },
        linkBold: {
            color: isTeacherOrAdmin ? '#60A5FA' : '#34D399',
            fontWeight: '600',
        },
    });
};
