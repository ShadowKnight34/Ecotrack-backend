import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ContentManagerScreen from '../screens/ContentManagerScreen';
import QuizEditorScreen from '../screens/QuizEditorScreen';
import StudentReportScreen from '../screens/StudentReportScreen';
import AttemptHistoryScreen from '../screens/AttemptHistoryScreen';
import AttemptDetailScreen from '../screens/AttemptDetailScreen';
import BadgeManagerScreen from '../screens/BadgeManagerScreen';
import MissionManagerScreen from '../screens/MissionManagerScreen';

const Stack = createNativeStackNavigator();

export default function AdminStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#1B1B1B' },
                headerTintColor: '#D4AF37',
                headerTitleStyle: { fontWeight: 'bold' },
                contentStyle: { backgroundColor: '#121212' },
            }}
        >
            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ title: 'Admin Dashboard' }}
            />
            <Stack.Screen
                name="UserManagement"
                component={UserManagementScreen}
                options={{ title: 'User Management' }}
            />
            <Stack.Screen
                name="ContentManager"
                component={ContentManagerScreen}
                options={{ title: 'Module Management' }}
            />
            <Stack.Screen
                name="QuizEditor"
                component={QuizEditorScreen}
                options={{ title: 'Quiz Editor' }}
            />
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
                name="BadgeManager"
                component={BadgeManagerScreen}
                options={{ title: 'Badge Management' }}
            />
            <Stack.Screen
                name="MissionManager"
                component={MissionManagerScreen}
                options={{ title: 'Assign Missions' }}
            />
        </Stack.Navigator>
    );
}
