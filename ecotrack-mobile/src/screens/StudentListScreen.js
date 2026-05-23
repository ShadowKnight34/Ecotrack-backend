import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Dimensions } from 'react-native';
import api from '../services/api';
import Card from '../components/ui/Card';
import { ChevronRight, ChevronDown, User } from 'lucide-react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const SDG_MAPPING = {
    'Recycling': 'SDG 12',
    'Energy Saving': 'SDG 7',
    'Water Conservation': 'SDG 6',
    'Education': 'SDG 4',
    'Environment': 'SDG 13',
    'Social': 'SDG 10',
    'Economy': 'SDG 8'
};

const getSdgLabel = (category) => {
    return SDG_MAPPING[category] || `SDG ${category.substring(0, 2)}`;
};

export default function StudentListScreen({ navigation }) {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableClasses, setAvailableClasses] = useState(['All Classes']);
    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isListExpanded, setIsListExpanded] = useState(false);
    const [categoryData, setCategoryData] = useState([]);
    const [moduleData, setModuleData] = useState([]);
    const [difficultyData, setDifficultyData] = useState([]);
    const [viewMode, setViewMode] = useState('BY CATEGORY');
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [chartInteractionMsg, setChartInteractionMsg] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedStudent) {
            fetchClassStats(selectedClass);
        }
    }, [selectedClass, selectedStudent]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [studentsRes, statsRes] = await Promise.all([
                api.get('/teacher/students'),
                api.get('/teacher/dashboard-stats?className=All%20Classes')
            ]);
            
            const students = studentsRes.data;
            const grouped = students.reduce((acc, student) => {
                const cName = student.className || 'Unassigned';
                if (!acc[cName]) {
                    acc[cName] = [];
                }
                acc[cName].push(student);
                return acc;
            }, {});

            const sectionData = Object.keys(grouped).map(key => ({
                title: key,
                data: grouped[key]
            })).sort((a, b) => a.title.localeCompare(b.title));

            setSections(sectionData);
            
            if (statsRes.data.availableClasses) {
                setAvailableClasses(statsRes.data.availableClasses);
            }
            if (statsRes.data.categoryBreakdown) {
                setCategoryData(statsRes.data.categoryBreakdown);
            }
            if (statsRes.data.moduleBreakdown) {
                setModuleData(statsRes.data.moduleBreakdown);
            }
            if (statsRes.data.difficultyBreakdown) {
                setDifficultyData(statsRes.data.difficultyBreakdown);
            }
        } catch (error) {
            console.error('Fetch initial data error:', error);
            Alert.alert('Error', 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassStats = async (className) => {
        try {
            const response = await api.get(`/teacher/dashboard-stats?className=${encodeURIComponent(className)}`);
            if (response.data.categoryBreakdown) {
                setCategoryData(response.data.categoryBreakdown);
            }
            if (response.data.moduleBreakdown) {
                setModuleData(response.data.moduleBreakdown);
            }
            if (response.data.difficultyBreakdown) {
                setDifficultyData(response.data.difficultyBreakdown);
            }
        } catch (error) {
            console.error('Fetch class stats error:', error);
        }
    };

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setIsListExpanded(false); // Collapse list upon selection
        try {
            const response = await api.get(`/teacher/students/${student.userID}/report`);
            if (response.data.report) {
                const formattedReport = response.data.report.map(r => ({
                    category: r.category,
                    avgScore: r.bestScore,
                    totalAttempts: r.totalAttempts
                }));
                setCategoryData(formattedReport);
            }
            if (response.data.moduleReport) {
                const formattedModuleReport = response.data.moduleReport.map(r => ({
                    moduleCode: r.moduleCode,
                    avgScore: r.bestScore,
                    totalAttempts: r.totalAttempts
                }));
                setModuleData(formattedModuleReport);
            }
            if (response.data.difficultyReport) {
                setDifficultyData(response.data.difficultyReport);
            }
        } catch (error) {
            console.error('Fetch student report error:', error);
            Alert.alert('Error', 'Failed to load student report.');
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.studentItem, selectedStudent?.userID === item.userID && styles.selectedStudentItem]}
            onPress={() => handleSelectStudent(item)}
        >
            <View style={styles.studentInfo}>
                <View style={styles.avatarPlaceholder}>
                    <User color="#1B263B" size={20} />
                </View>
                <View>
                    <Text style={[styles.studentName, selectedStudent?.userID === item.userID && { color: '#065F46' }]}>{item.username}</Text>
                    <Text style={styles.studentLevel}>Level {item.level} • {item.xp} XP</Text>
                </View>
            </View>
            <ChevronRight color="#9CA3AF" size={20} />
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const getBarChartData = () => {
        if (!categoryData || categoryData.length === 0) {
            return {
                labels: ["No Data", ""],
                datasets: [{ 
                    data: [0, 100],
                    colors: [
                        (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        () => `rgba(0, 0, 0, 0)`
                    ]
                }]
            };
        }

        const labels = categoryData.map(c => {
            if (viewMode === 'BY SDG TOPIC') {
                return getSdgLabel(c.category);
            }
            return c.category.length > 14 ? c.category.substring(0, 12) + '..' : c.category;
        });
        const data = categoryData.map(c => c.avgScore || 0);

        // Add dummy point to enforce a true 100% max Y-axis
        labels.push("");
        data.push(100);

        const colors = categoryData.map(() => (opacity = 1) => `rgba(16, 185, 129, ${opacity})`);
        colors.push(() => `rgba(0, 0, 0, 0)`); // Transparent color for dummy point

        return {
            labels: labels,
            datasets: [{ data: data, colors: colors }]
        };
    };

    const getPieChartData = () => {
        const vibrantColors = ['#0EA5E9', '#14B8A6', '#F97316', '#22C55E', '#3B82F6', '#10B981', '#F59E0B', '#06B6D4'];
        const hasAttempts = categoryData.some(c => c.totalAttempts > 0);
        
        if (!hasAttempts) {
            return [{
                name: "No Data",
                attempts: 1,
                color: "#E5E7EB",
                legendFontColor: "#6B7280",
                legendFontSize: 12
            }];
        }

        const total = categoryData.reduce((acc, c) => acc + (c.totalAttempts || 0), 0);

        return categoryData
            .filter(c => c.totalAttempts > 0)
            .sort((a, b) => b.totalAttempts - a.totalAttempts)
            .map((c, i) => {
                const percentage = Math.round((c.totalAttempts / total) * 100);
                const labelText = viewMode === 'BY SDG TOPIC' ? getSdgLabel(c.category) : c.category;
                const label = labelText.length > 15 ? labelText.substring(0, 13) + '..' : labelText;
                return {
                    name: `${label} (${percentage}%)`,
                    attempts: percentage,
                    color: vibrantColors[i % vibrantColors.length],
                    legendFontColor: "#4B5563",
                    legendFontSize: 12
                };
            });
    };

    const getLineChartData = () => {
        const sourceData = viewMode === 'BY CATEGORY' ? categoryData : moduleData;
        
        if (!sourceData || sourceData.length === 0) {
            return {
                labels: ["None"],
                datasets: [
                    { data: [0], color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` }
                ]
            };
        }
        
        const labels = sourceData.map(item => {
            if (viewMode === 'BY CATEGORY') {
                return item.category && item.category.length > 8 ? item.category.substring(0, 6) + '..' : item.category;
            } else {
                return item.moduleCode;
            }
        });
        
        const data = sourceData.map(item => item.totalAttempts || 0);
        
        return {
            labels: labels.length ? labels : ["None"],
            datasets: [
                {
                    data: data.length ? data : [0],
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 2
                }
            ]
        };
    };

    const getDifficultyChartData = () => {
        const tierOrder = ['Foundation', 'Intermediate', 'Advanced'];
        if (!difficultyData || difficultyData.length === 0) {
            return {
                labels: tierOrder,
                datasets: [{ 
                    data: [0, 0, 0],
                    colors: [
                        () => `rgba(0, 0, 0, 0)`,
                        () => `rgba(0, 0, 0, 0)`,
                        () => `rgba(0, 0, 0, 0)`
                    ]
                }]
            };
        }

        const orderedData = tierOrder.map(tier => {
            const found = difficultyData.find(d => d.tier === tier);
            return found ? found.totalAttempts : 0;
        });

        // Add dummy point if needed for scaling, but we'll just let it scale.
        // Wait, if all are 0, it fails. We handle that above.
        // Ensure there's at least one non-zero or add a hidden point.
        const maxVal = Math.max(...orderedData);
        if (maxVal === 0) {
            orderedData.push(10); // dummy for scale
            tierOrder.push("");
        }

        const colors = orderedData.map((val, idx) => {
            if (idx === 3) return () => `rgba(0, 0, 0, 0)`; // dummy
            if (idx === 0) return (opacity = 1) => `rgba(16, 185, 129, ${opacity})`; // Foundation
            if (idx === 1) return (opacity = 1) => `rgba(245, 158, 11, ${opacity})`; // Intermediate
            return (opacity = 1) => `rgba(239, 68, 68, ${opacity})`; // Advanced
        });

        return {
            labels: tierOrder,
            datasets: [{ data: orderedData, colors: colors }]
        };
    };

    const barChartData = getBarChartData();
    const barChartWidth = Math.max(screenWidth - 64, barChartData.labels.length * 85);

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: 130 }]}>
            {loading ? (
                <ActivityIndicator size="large" color="#1B263B" style={{ marginTop: 40 }} />
            ) : (
                <>
                    <View style={{ marginBottom: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                            {availableClasses.map((cls, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.filterChip, selectedClass === cls && styles.filterChipActive]}
                                    onPress={() => {
                                        setSelectedClass(cls);
                                        setSelectedStudent(null); // Reset student selection
                                    }}
                                >
                                    <Text style={[styles.filterChipText, selectedClass === cls && styles.filterChipTextActive]}>
                                        {cls}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Card style={styles.directoryCard}>
                        <TouchableOpacity 
                            style={styles.directoryHeader} 
                            onPress={() => setIsListExpanded(!isListExpanded)}
                        >
                            <Text style={styles.directoryTitle}>View Student List</Text>
                            {isListExpanded ? <ChevronDown color="#092c1d" size={24} /> : <ChevronRight color="#092c1d" size={24} />}
                        </TouchableOpacity>

                        {isListExpanded && (
                            <View style={styles.listWrapper}>
                                <SectionList
                                    sections={
                                        selectedClass === 'All Classes' 
                                            ? sections 
                                            : sections.filter(s => s.title === selectedClass)
                                    }
                                    keyExtractor={(item) => item.userID.toString()}
                                    renderItem={renderItem}
                                    renderSectionHeader={renderSectionHeader}
                                    stickySectionHeadersEnabled={false}
                                    scrollEnabled={false}
                                    ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
                                />
                            </View>
                        )}
                    </Card>

                    {selectedStudent && (
                        <View style={styles.selectedStudentHeader}>
                            <Text style={styles.selectedStudentText}>Showing Analytics for: {selectedStudent.username}</Text>
                        </View>
                    )}

                    <Card style={styles.chartCard}>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>View Metrics By:</Text>
                            <View style={styles.toggleButtonGroup}>
                                <TouchableOpacity 
                                    style={[styles.toggleButton, viewMode === 'BY CATEGORY' && styles.toggleButtonActive]}
                                    onPress={() => setViewMode('BY CATEGORY')}
                                >
                                    <Text style={[styles.toggleButtonText, viewMode === 'BY CATEGORY' && styles.toggleButtonTextActive]}>BY CATEGORY</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.toggleButton, viewMode === 'BY SDG TOPIC' && styles.toggleButtonActive]}
                                    onPress={() => setViewMode('BY SDG TOPIC')}
                                >
                                    <Text style={[styles.toggleButtonText, viewMode === 'BY SDG TOPIC' && styles.toggleButtonTextActive]}>BY SDG TOPIC</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {chartInteractionMsg && (
                            <View style={styles.interactionMsgContainer}>
                                <Text style={styles.interactionMsgText}>{chartInteractionMsg}</Text>
                            </View>
                        )}

                        <Text style={styles.chartTitle}>PERFORMANCE {viewMode.toUpperCase()}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onPress={() => {
                                    setChartInteractionMsg(`Bar Chart Active: Analyzing performance by ${viewMode.toLowerCase()}`);
                                    setTimeout(() => setChartInteractionMsg(null), 3000);
                                }}
                            >
                                <BarChart
                                    data={barChartData}
                                    width={barChartWidth}
                                    height={220}
                                    yAxisSuffix="%"
                                    fromZero={true}
                                    segments={4}
                                    withCustomBarColorFromData={true}
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(9, 44, 29, ${opacity})`,
                                        formatYLabel: (yValue) => Math.round(yValue),
                                    }}
                                    style={styles.chart}
                                    showValuesOnTopOfBars
                                />
                            </TouchableOpacity>
                        </ScrollView>
                    </Card>

                    <Card style={styles.chartCard}>
                        <Text style={styles.chartTitle}>STUDENT INTEREST & ENGAGEMENT</Text>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={() => {
                                setChartInteractionMsg(`Pie Chart Active: Viewing attempt distribution by ${viewMode.toLowerCase()}`);
                                setTimeout(() => setChartInteractionMsg(null), 3000);
                            }}
                        >
                            <PieChart
                                data={getPieChartData()}
                                width={screenWidth - 64}
                                height={200}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(9, 44, 29, ${opacity})`,
                                }}
                                accessor={"attempts"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[10, 0]}
                                absolute
                            />
                        </TouchableOpacity>
                    </Card>

                    <Card style={styles.chartCard}>
                        <View style={styles.lineChartHeaderContainer}>
                            <Text style={[styles.chartTitle, { marginBottom: 0 }]}>COMPREHENSION VELOCITY & DIFFICULTY TIMES</Text>
                        </View>
                        {activeTooltip && (
                            <View style={styles.tooltipContainer}>
                                <Text style={styles.tooltipText}>{activeTooltip.text}</Text>
                            </View>
                        )}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={getLineChartData()}
                                width={Math.max(screenWidth - 64, getLineChartData().labels.length * 80)}
                                height={220}
                                fromZero={true}
                                onDataPointClick={({ value, dataset, getColor }) => {
                                    setActiveTooltip({
                                        value: value,
                                        text: `Attempt Counts to Mastery: ${value}`
                                    });
                                    setTimeout(() => setActiveTooltip(null), 3000);
                                }}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                    propsForDots: {
                                        r: "5",
                                        strokeWidth: "2"
                                    },
                                    getDotColor: (dataPoint) => {
                                        return dataPoint > 5 ? '#EF4444' : '#3B82F6';
                                    }
                                }}
                                style={styles.chart}
                            />
                        </ScrollView>
                    </Card>

                    <Card style={styles.chartCard}>
                        <View style={styles.lineChartHeaderContainer}>
                            <Text style={[styles.chartTitle, { marginBottom: 0 }]}>PERFORMANCE BY DIFFICULTY TIER</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onPress={() => {
                                    setChartInteractionMsg(`Difficulty Tier Chart Active: Viewing attempts by curriculum level`);
                                    setTimeout(() => setChartInteractionMsg(null), 3000);
                                }}
                            >
                                <BarChart
                                    data={getDifficultyChartData()}
                                    width={Math.max(screenWidth - 64, 300)}
                                    height={220}
                                    yAxisSuffix=""
                                    fromZero={true}
                                    segments={4}
                                    withCustomBarColorFromData={true}
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(9, 44, 29, ${opacity})`,
                                        formatYLabel: (yValue) => Math.round(yValue),
                                    }}
                                    style={styles.chart}
                                    showValuesOnTopOfBars
                                />
                            </TouchableOpacity>
                        </ScrollView>
                        <Text style={styles.chartSubtitle}>
                            Tracks student progression from lower secondary (Foundation) to upper secondary (Advanced) curriculum standards.
                        </Text>
                    </Card>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    filterContainer: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#1B263B',
    },
    filterChipText: {
        color: '#4B5563',
        fontWeight: 'bold',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    directoryCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        overflow: 'hidden',
        padding: 0,
    },
    directoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    directoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#092c1d',
    },
    listWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    sectionHeader: {
        backgroundColor: '#1B263B',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
        marginTop: 8,
    },
    sectionHeaderText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedStudentItem: {
        borderColor: '#10B981',
        borderWidth: 2,
        backgroundColor: '#F0FDF4',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    studentLevel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 20,
        fontStyle: 'italic',
    },
    selectedStudentHeader: {
        padding: 12,
        backgroundColor: '#D1FAE5',
        borderRadius: 8,
        marginBottom: 16,
    },
    selectedStudentText: {
        color: '#065F46',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    chartCard: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 12,
        letterSpacing: 1,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        alignSelf: 'center',
    },
    reviewItem: {
        marginBottom: 16,
    },
    reviewItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    reviewItemTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    reviewItemScore: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    toggleButtonGroup: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    toggleButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleButtonText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    toggleButtonTextActive: {
        color: '#10B981',
    },
    interactionMsgContainer: {
        backgroundColor: '#E0F2FE',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    interactionMsgText: {
        color: '#0284C7',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    lineChartHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        zIndex: 1,
    },
    tooltipContainer: {
        position: 'absolute',
        top: 10,
        right: 16,
        backgroundColor: '#1F2937',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        zIndex: 10,
    },
    tooltipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
