import React, { useState, useCallback, useRef } from 'react';
import {
    StyleSheet, Text, View, FlatList,
    TouchableOpacity, Dimensions, Pressable, Animated, StatusBar, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookOpen, Globe, Droplets, Recycle, TreePine, ChevronRight, Book } from 'lucide-react-native';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CircularProgress from '../components/ui/CircularProgress';
import api from '../services/api';

const { width } = Dimensions.get('window');

const CATEGORY_MAP = {
    'SDG 4': { icon: BookOpen, color: '#10B981', lessons: 5 },
    'Environment': { icon: Globe, color: '#3B82F6', lessons: 4 },
    'SDG 6': { icon: Droplets, color: '#0EA5E9', lessons: 3 },
    'SDG 12': { icon: Recycle, color: '#F59E0B', lessons: 4 },
    'SDG 15': { icon: TreePine, color: '#84CC16', lessons: 3 },
};

const ModuleCardItem = ({ mod, mappedData, navigation }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const badgeBgColor = mappedData.color + '20'; // 12% opacity
    const IconComponent = mappedData.icon;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 40,
        }).start();
    };

    return (
        <Animated.View style={[styles.moduleCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.moduleCardInner}>
                <Pressable
                    style={styles.moduleCardPressable}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() =>
                        navigation.navigate('ModuleDetail', {
                            moduleID: mod.moduleID,
                            title: mod.title,
                        })
                    }
                    android_ripple={{ color: '#E5E7EB', borderless: false }}
                >
                    <View style={[styles.iconBox, { backgroundColor: mappedData.color }]}>
                        <IconComponent color="#FFF" size={24} />
                    </View>

                    <View style={styles.moduleInfo}>
                        <View style={[styles.categoryBadge, { backgroundColor: badgeBgColor }]}>
                            <Text style={[styles.categoryText, { color: mappedData.color }]}>{mod.category}</Text>
                        </View>
                        <Text style={styles.moduleTitle} numberOfLines={2}>{mod.title}</Text>
                        <Text style={styles.moduleLessons}>{mappedData.lessons} lessons</Text>
                    </View>

                    <View style={styles.chevronBox}>
                        <ChevronRight color="#9CA3AF" size={24} />
                    </View>
                </Pressable>
            </View>
        </Animated.View>
    );
};

export default function ModulesScreen({ navigation }) {
    const [modules, setModules] = useState([]);
    const [quizResults, setQuizResults] = useState([]);

    const completedModuleIDs = new Set(quizResults.filter(r => r && r.moduleID != null).map(r => r.moduleID));
    const completedModules = completedModuleIDs.size;

    const progressValue = completedModules / 17;
    const progressPercentage = Math.round(progressValue * 100);

    useFocusEffect(
        useCallback(() => {
            const fetchModules = async () => {
                try {
                    const response = await api.get('/modules');
                    setModules(response.data);
                } catch (error) {
                    console.error('Error fetching modules:', error);
                }
            };

            const fetchProgress = async () => {
                try {
                    const response = await api.get('/quizzes/user-results');
                    setQuizResults(response.data || []);
                } catch (error) {
                    console.error('Error fetching progress:', error);
                }
            };

            fetchModules();
            fetchProgress();
        }, [])
    );

    const renderItem = ({ item: mod }) => {
        const mappedData = CATEGORY_MAP[mod.category] || { icon: Book, color: '#3B82F6', lessons: 3 };
        return <ModuleCardItem mod={mod} mappedData={mappedData} navigation={navigation} />;
    };

    return (
        <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <FlatList
                contentContainerStyle={styles.content}
                data={modules}
                keyExtractor={(item) => item.moduleID.toString()}
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.greeting}>Welcome back, Ungga123</Text>
                            <Text style={styles.heading}>Learning Modules</Text>
                            <Text style={styles.subtitle}>
                                Explore topics and test your knowledge
                            </Text>
                        </View>

                        {/* Progress overview */}
                        <View style={styles.progressCard}>
                            <View style={styles.progressTextContainer}>
                                <Text style={styles.progressTitle}>Course Progress</Text>
                                <Text style={styles.progressSubtitle}>{completedModules} of 17 modules completed</Text>
                            </View>
                            <CircularProgress progress={progressValue} color="#10B981" size={80} strokeWidth={8}>
                                <Text style={styles.progressPercentageText}>{progressPercentage}%</Text>
                            </CircularProgress>
                        </View>
                    </>
                }
                renderItem={renderItem}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Light gray background
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: 20,
        borderRadius: 24,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    greeting: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    heading: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#4B5563',
        fontWeight: '500',
    },
    progressCard: {
        marginBottom: 24,
        paddingVertical: 20,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    progressSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    progressPercentageText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    moduleCardWrapper: {
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    moduleCardInner: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    moduleCardPressable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    moduleInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    moduleLessons: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    chevronBox: {
        paddingLeft: 12,
    },
});
