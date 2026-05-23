import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="RoleSelection"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}
