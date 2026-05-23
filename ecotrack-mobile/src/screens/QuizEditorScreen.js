import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Edit2, Trash2, X } from 'lucide-react-native';

export default function QuizEditorScreen({ route, navigation }) {
    const { moduleID, moduleTitle } = route.params;
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [formData, setFormData] = useState({
        questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: ''
    });

    useEffect(() => {
        fetchQuestions();
    }, [moduleID]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/modules/${moduleID}/questions`);
            setQuestions(response.data);
        } catch (error) {
            console.error('Fetch questions error:', error);
            Alert.alert('Error', 'Failed to fetch quiz questions');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (question = null) => {
        if (question) {
            setEditingQuestion(question);
            setFormData({
                questionText: question.questionText,
                optionA: question.optionA,
                optionB: question.optionB,
                optionC: question.optionC,
                optionD: question.optionD,
                correctAnswer: question.correctAnswer
            });
        } else {
            setEditingQuestion(null);
            setFormData({
                questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: ''
            });
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingQuestion(null);
    };

    const handleSave = async () => {
        const { questionText, optionA, optionB, optionC, optionD, correctAnswer } = formData;
        if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            Alert.alert('Validation Error', 'All fields are required');
            return;
        }

        try {
            if (editingQuestion) {
                await api.put(`/modules/questions/${editingQuestion.questionID}`, formData);
                Alert.alert('Success', 'Question updated successfully');
            } else {
                await api.post(`/modules/${moduleID}/questions`, formData);
                Alert.alert('Success', 'Question created successfully');
            }
            handleCloseModal();
            fetchQuestions();
        } catch (error) {
            console.error('Save question error:', error);
            Alert.alert('Error', 'Failed to save question');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this question?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/modules/questions/${id}`);
                            Alert.alert('Deleted', 'Question removed');
                            fetchQuestions();
                        } catch (error) {
                            console.error('Delete question error:', error);
                            Alert.alert('Error', 'Failed to delete question');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }) => (
        <Card style={styles.questionCard}>
            <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.iconButton}>
                        <Edit2 color="#3B82F6" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.questionID)} style={styles.iconButton}>
                        <Trash2 color="#EF4444" size={18} />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.questionText}>{item.questionText}</Text>
            <Text style={styles.optionText}>A: {item.optionA}</Text>
            <Text style={styles.optionText}>B: {item.optionB}</Text>
            <Text style={styles.optionText}>C: {item.optionC}</Text>
            <Text style={styles.optionText}>D: {item.optionD}</Text>
            <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerText}>Correct: {item.correctAnswer}</Text>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{moduleTitle || 'Module'} Quiz</Text>
                <Text style={styles.headerSubtitle}>Manage questions for this module</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1B263B" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={questions}
                    keyExtractor={(item) => item.questionID.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>No questions found.</Text>}
                />
            )}

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => handleOpenModal()}
            >
                <Plus color="#FFF" size={24} />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingQuestion ? 'Edit Question' : 'Add Question'}
                            </Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <X color="#6B7280" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Question Text"
                                value={formData.questionText}
                                onChangeText={(text) => setFormData({ ...formData, questionText: text })}
                                multiline
                                numberOfLines={3}
                            />
                            <TextInput style={styles.input} placeholder="Option A" value={formData.optionA} onChangeText={(text) => setFormData({ ...formData, optionA: text })} />
                            <TextInput style={styles.input} placeholder="Option B" value={formData.optionB} onChangeText={(text) => setFormData({ ...formData, optionB: text })} />
                            <TextInput style={styles.input} placeholder="Option C" value={formData.optionC} onChangeText={(text) => setFormData({ ...formData, optionC: text })} />
                            <TextInput style={styles.input} placeholder="Option D" value={formData.optionD} onChangeText={(text) => setFormData({ ...formData, optionD: text })} />
                            <TextInput 
                                style={[styles.input, styles.correctAnswerInput]} 
                                placeholder="Correct Answer (e.g., A, B, C, D)" 
                                value={formData.correctAnswer} 
                                onChangeText={(text) => setFormData({ ...formData, correctAnswer: text })} 
                                autoCapitalize="characters"
                                maxLength={1}
                            />

                            <Button onPress={handleSave} style={styles.saveButton}>
                                Save Question
                            </Button>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, backgroundColor: '#1B263B' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
    headerSubtitle: { fontSize: 14, color: '#D1D5DB', marginTop: 4 },
    listContainer: { padding: 16, paddingBottom: 100 },
    questionCard: { padding: 16, marginBottom: 12 },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    questionNumber: { fontSize: 16, fontWeight: 'bold', color: '#1B263B', backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    actionButtons: { flexDirection: 'row' },
    iconButton: { padding: 8, marginLeft: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
    questionText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
    optionText: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
    correctAnswerContainer: { marginTop: 12, padding: 8, backgroundColor: '#D1FAE5', borderRadius: 6, alignSelf: 'flex-start' },
    correctAnswerText: { fontSize: 13, fontWeight: 'bold', color: '#047857' },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 },
    fab: { position: 'absolute', right: 24, bottom: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1B263B', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    correctAnswerInput: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
    saveButton: { marginTop: 12, backgroundColor: '#1B263B' }
});
