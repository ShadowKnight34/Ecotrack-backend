import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ModulesScreen from '../screens/ModulesScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ModuleDetailScreen from '../screens/ModuleDetailScreen';
import StudentReportScreen from '../screens/StudentReportScreen';
import AttemptHistoryScreen from '../screens/AttemptHistoryScreen';
import AttemptDetailScreen from '../screens/AttemptDetailScreen';

const Stack = createNativeStackNavigator();

export default function ModulesStackNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="ModulesList"
            screenOptions={{
                headerStyle: { backgroundColor: '#10B981' }, // Emerald primary
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '900', fontSize: 20 },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="StudentReport"
                component={StudentReportScreen}
                options={{ title: 'Student Report' }}
            />
            <Stack.Screen
                name="AttemptHistory"
                component={AttemptHistoryScreen}
                options={{ title: 'Attempt History' }}
            />
            <Stack.Screen
                name="AttemptDetail"
                component={AttemptDetailScreen}
                options={{ title: 'Attempt Details' }}
            />
            <Stack.Screen
                name="ModulesList"
                component={ModulesScreen}
                options={{ title: 'Learn' }}
            />
            <Stack.Screen
                name="ModuleDetail"
                component={ModuleDetailScreen}
                options={({ route }) => ({
                    title: route.params?.title || 'Details',
                })}
            />
            <Stack.Screen
                name="Quiz"
                component={QuizScreen}
                options={({ route }) => ({
                    title: route.params?.title || 'Quiz',
                })}
            />
            <Stack.Screen
                name="Results"
                component={ResultsScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
