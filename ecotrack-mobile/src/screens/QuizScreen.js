import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OPTIONS = ['A', 'B', 'C', 'D'];

export default function QuizScreen({ route, navigation }) {
    const { user, setUser } = useContext(AuthContext);
    const { moduleID, title } = route?.params || { moduleID: 1, title: 'Quiz' };

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);       // { questionID, selectedOption }
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await api.get(`/modules/${moduleID}/quiz?form=${user?.formLevel || 1}`);
                setQuestions(response.data);
            } catch (error) {
                console.error('Error fetching questions:', error);
                Alert.alert('Error', 'Could not load questions. Please try again later.');
            }
        };

        if (moduleID) {
            fetchQuestions();
        }
    }, [moduleID]);

    if (questions.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ marginTop: 16, color: '#6B7280', fontWeight: '600' }}>Loading questions...</Text>
            </SafeAreaView>
        );
    }

    const question = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const progress = (currentQuestionIndex + 1) / totalQuestions;

    // ── Select an option ──
    const handleSelect = (option) => {
        setSelectedOption(option);
    };

    // ── Go to next question or submit ──
    // ── Go to next question or submit ──
    const handleNext = async () => {
        if (!selectedOption) {
            Alert.alert('Select an answer', 'Please choose an option before continuing.');
            return;
        }

        // 1. Capture current answer
        const currentAnswerText = getOptionText(selectedOption);
        const updatedAnswers = [
            ...answers,
            { questionID: question.questionID, selectedOption: currentAnswerText },
        ];
        setAnswers(updatedAnswers);

        if (isLastQuestion) {
            try {
                // 2. Submit to the Backend Engine
                // Matches your Controller: const { moduleID, answers } = req.body;
                const response = await api.post('/quizzes/submit', {
                    moduleID: moduleID,
                    answers: updatedAnswers
                });

                if (response.data.leveledUp) {
                    Alert.alert(
                        '🎉 Level Up!',
                        `Congratulations! You've reached Level ${response.data.newLevel}!`
                    );
                }

                // 3. Re-fetch user profile data so progress and XP update seamlessly
                try {
                    const profileRes = await api.get('/auth/me');
                    if (setUser) {
                        setUser(profileRes.data);
                    }
                } catch (profileError) {
                    console.error('Failed to re-fetch user profile after quiz submission:', profileError);
                }

                // 4. Navigate to Results using SERVER-SIDE grading
                navigation.navigate('Results', {
                    score: response.data.correctCount,
                    total: response.data.totalQuestions
                });

            } catch (error) {
                console.error('Quiz submission error:', error);
                Alert.alert(
                    'Submission Failed',
                    'We couldn\'t save your score. Please check your connection.'
                );
            }
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
        }
    };

    // ── Get option text from question ──
    const getOptionText = (opt) => {
        const key = `option${opt}`;
        return question[key];
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.moduleTitle}>{title}</Text>
                <Text style={styles.questionCount}>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                </Text>
            </View>

            {/* Progress bar */}
            <ProgressBar progress={progress} color="#10B981" height={10} style={{ marginBottom: 28 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Question card */}
                <Card style={styles.questionCard}>
                    <Badge variant="outline" style={{ marginBottom: 12 }}>
                        Q{currentQuestionIndex + 1}
                    </Badge>
                    <Text style={styles.questionText}>{question.questionText}</Text>
                </Card>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {OPTIONS.map((opt) => {
                        const isSelected = selectedOption === opt;
                        return (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.optionSelected,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => handleSelect(opt)}
                            >
                                <View style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                                    <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                                        {opt}
                                    </Text>
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {getOptionText(opt)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Action button */}
                <View style={{ marginBottom: 20 }}>
                    <Button
                        variant={selectedOption ? 'default' : 'outline'}
                        onPress={handleNext}
                        disabled={!selectedOption}
                    >
                        {isLastQuestion ? '🚀 Submit Quiz' : 'Next Question →'}
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    moduleTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        flex: 1,
    },
    questionCount: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '700',
    },
    questionCard: {
        padding: 24,
        marginBottom: 28,
        backgroundColor: '#FFFFFF',
    },
    questionText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        lineHeight: 30,
    },
    optionsContainer: {
        flex: 1,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderBottomWidth: 4,
        borderBottomColor: '#D1D5DB',
    },
    optionSelected: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
        borderBottomColor: '#059669',
    },
    optionBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    optionBadgeSelected: {
        backgroundColor: '#10B981',
        borderColor: '#059669',
    },
    optionLetter: {
        fontSize: 16,
        fontWeight: '900',
        color: '#6B7280',
    },
    optionLetterSelected: {
        color: '#FFFFFF',
    },
    optionText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '600',
        flex: 1,
    },
    optionTextSelected: {
        color: '#064E3B',
        fontWeight: '800',
    },
});
