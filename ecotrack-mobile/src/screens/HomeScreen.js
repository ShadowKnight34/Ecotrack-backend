import React, { useState, useCallback, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Flame, Star } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, setUser, setIsAuthenticated } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      };

      fetchUserData();
    }, [setUser])
  );

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const currentLevel = user.level || 1;
  const currentXP = user.xp || 0;

  // Example formula for XP required to reach next level
  const nextLevelXP = currentLevel * 200; 
  const progress = currentXP / nextLevelXP;

  const badgesCount = user.earnedBadges ? user.earnedBadges.length : 0;
  // TODO: Implement backend streak tracking logic
  const streakCount = user.streak || 0;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    setIsAuthenticated(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Welcome Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          {/* Dynamic greeting logic for user onboarding */}
          <Text style={styles.welcomeText}>
            {currentXP === 0 ? 'Welcome to EcoTrack,' : 'Welcome back,'}
          </Text>
          <Text style={styles.username}>{user.username}! 🌱</Text>
          {user.className ? (
              <Text style={styles.classLabel}>Class: {user.className}</Text>
          ) : (
              <Text style={styles.classLabelWarning}>Class: Not Assigned</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={28} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Dynamic onboarding banner for new users */}
      {currentXP === 0 && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeBannerText}>
            Complete your first module to start your journey!
          </Text>
        </View>
      )}

      {user?.role === 'student' && (
        <>
          {/* ── Level & Progress Card ── */}
          <Card style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View>
                <Text style={styles.levelTitle}>Current Level</Text>
                <Text style={styles.levelNumber}>Level {currentLevel}</Text>
              </View>
              {streakCount > 0 && (
                <Badge variant="secondary" style={styles.streakBadge}>
                  <Flame size={16} color="#78350F" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#78350F', fontWeight: 'bold' }}>{streakCount} Day Streak</Text>
                </Badge>
              )}
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.xpText}>{currentXP} XP</Text>
                <Text style={styles.xpTarget}>{nextLevelXP} XP to Level {currentLevel + 1}</Text>
              </View>
              <ProgressBar progress={progress} color="#FBBF24" height={16} />
            </View>
          </Card>

          {/* ── Quick Stats Grid ── */}
          <View style={styles.statsGrid}>
            <Card style={styles.statSquareCard}>
              <Star color="#FBBF24" size={32} fill="#FBBF24" style={styles.statIcon} />
              <Text style={styles.statSquareValue}>{currentXP}</Text>
              <Text style={styles.statSquareLabel}>Total XP</Text>
            </Card>
            <Card style={styles.statSquareCard}>
              <Text style={{ fontSize: 32 }}>🎖️</Text>
              <Text style={styles.statSquareValue}>{badgesCount}</Text>
              <Text style={styles.statSquareLabel}>Badges</Text>
            </Card>
          </View>
        </>
      )}
      {/* ── Daily Goal / CTA ── */}
      <Card style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Ready for your next lesson?</Text>
        <Text style={styles.ctaSubtitle}>
          You are {nextLevelXP - currentXP} XP away from reaching Level {currentLevel + 1}. Complete a module today to level up!
        </Text>
        <Button
          variant="default"
          // Try adding .jumpTo if navigate fails, or keep it as Modules
          onPress={() => navigation.navigate('Modules')}
          style={{ width: '100%' }}
        >
          Continue Learning →
        </Button>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Lighter background to make white cards pop
  },
  content: {
    padding: 24,
    paddingTop: 32,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  username: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },
  classLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    marginTop: 4,
  },
  classLabelWarning: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 4,
  },

  // ── Welcome Banner ──
  welcomeBanner: {
    backgroundColor: '#E0F2F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  welcomeBannerText: {
    color: '#00796B',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Level Card ──
  levelCard: {
    marginBottom: 20,
    backgroundColor: '#10B981', // Emerald primary
    borderColor: '#059669',
    borderBottomColor: '#047857',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  levelTitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelNumber: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  xpTarget: {
    color: '#D1FAE5',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Stats Grid ──
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statSquareCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 24,
  },
  statIcon: {
    marginBottom: 8,
  },
  statSquareValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginTop: 8,
  },
  statSquareLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },

  // ── Call to Action ──
  ctaCard: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
});
