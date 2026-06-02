import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation, route }) {
    const role = route.params?.role || 'student';
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                email: email.trim(),
                newPassword: newPassword
            });

            Alert.alert(
                'Success',
                response.data.message || 'Password reset successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login', { role })
                    }
                ]
            );
        } catch (error) {
            console.error('Reset Password Error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to reset password. Please check your email.';
            Alert.alert('Reset Failed', errorMsg);
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
                <Text style={styles.logo}>🔒</Text>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email to secure your account</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.7 }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
                </TouchableOpacity>
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
            marginBottom: 40,
        },
        logo: {
            fontSize: 56,
            marginBottom: 8,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: isTeacherOrAdmin ? '#93C5FD' : '#A7F3D0',
        },
        subtitle: {
            fontSize: 14,
            color: isTeacherOrAdmin ? '#60A5FA' : '#6EE7B7',
            marginTop: 4,
            textAlign: 'center',
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
    });
};
