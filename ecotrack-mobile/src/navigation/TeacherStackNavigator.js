import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import ContentManagerScreen from '../screens/ContentManagerScreen';
import StudentListScreen from '../screens/StudentListScreen';
import StudentReportScreen from '../screens/StudentReportScreen';
import QuizEditorScreen from '../screens/QuizEditorScreen';
import AttemptHistoryScreen from '../screens/AttemptHistoryScreen';
import AttemptDetailScreen from '../screens/AttemptDetailScreen';

const Stack = createNativeStackNavigator();

export default function TeacherStackNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="TeacherDashboard"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#1B263B', // Professional Navy Blue
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="TeacherDashboard"
                component={TeacherDashboardScreen}
                options={{ title: 'Teacher Dashboard' }}
            />
            <Stack.Screen
                name="ContentManager"
                component={ContentManagerScreen}
                options={{ title: 'Module Management' }}
            />
            <Stack.Screen
                name="StudentList"
                component={StudentListScreen}
                options={{ title: 'Report Analytics' }}
            />
            <Stack.Screen
                name="StudentReport"
                component={StudentReportScreen}
                options={{ title: 'Student Report' }}
            />
            <Stack.Screen
                name="QuizEditor"
                component={QuizEditorScreen}
                options={{ title: 'Quiz Editor' }}
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
        </Stack.Navigator>
    );
}
