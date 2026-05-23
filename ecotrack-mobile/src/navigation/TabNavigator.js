import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, Trophy, User, MessageSquare } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ModulesStackNavigator from './ModulesStackNavigator';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForumScreen from '../screens/ForumScreen';
import TeacherStackNavigator from './TeacherStackNavigator';
import { AuthContext } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const ICONS = {
    Home: Home,
    Modules: BookOpen,
    Forum: MessageSquare,
    Leaderboard: Trophy,
    Profile: User,
};

const TabItem = ({ route, isFocused, options, onPress, onLongPress }) => {
    const animation = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(animation, {
            toValue: isFocused ? 1 : 0,
            friction: 7,
            tension: 50,
            useNativeDriver: false, // Animating layout properties
        }).start();
    }, [isFocused]);

    const IconComponent = ICONS[route.name] || Home;

    const labelWidth = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 75], 
    });

    const marginLeft = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 6],
    });

    const labelOpacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1], 
    });

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', '#10B98120'], // Emerald with 12% opacity
    });

    const scale = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.15]
    });

    const iconColor = isFocused ? '#10B981' : '#9CA3AF';
    const fillValue = isFocused ? '#10B981' : 'transparent';

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
            style={styles.tabButton}
        >
            <Animated.View style={[styles.tabItemContainer, { backgroundColor }]}>
                <Animated.View style={{ transform: [{ scale }] }}>
                    <IconComponent color={iconColor} fill={fillValue} size={24} strokeWidth={2.5} />
                </Animated.View>
                <Animated.View style={{ width: labelWidth, opacity: labelOpacity, marginLeft, overflow: 'hidden' }}>
                    <Text style={[styles.tabLabel, { color: '#10B981' }]} numberOfLines={1}>
                        {options.title || route.name}
                    </Text>
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.floatingBarContainer}>
            <View style={styles.floatingBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TabItem
                            key={route.key}
                            route={route}
                            isFocused={isFocused}
                            options={options}
                            onPress={onPress}
                            onLongPress={onLongPress}
                        />
                    );
                })}
            </View>
        </View>
    );
};

export default function TabNavigator() {
    const { user } = useContext(AuthContext);

    return (
        <Tab.Navigator
            initialRouteName="Home"
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#10B981', // Emerald primary
                    shadowColor: 'transparent', // remove default shadow
                    elevation: 0,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '900', fontSize: 20, letterSpacing: 0.5 },
            }}
        >
            {user?.role === 'teacher' ? (
                <>
                    <Tab.Screen name="Home" component={TeacherStackNavigator} options={{ title: 'Home', headerShown: false }} />
                    <Tab.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum', headerShown: false }} />
                    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
                </>
            ) : (
                <>
                    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
                    <Tab.Screen name="Modules" component={ModulesStackNavigator} options={{ title: 'Learn', headerShown: false }} />
                    <Tab.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum', headerShown: false }} />
                    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Ranks' }} />
                    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
                </>
            )}
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    floatingBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    floatingBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        height: 64,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 24,
    },
    tabLabel: {
        fontWeight: '800',
        fontSize: 13,
    },
});
