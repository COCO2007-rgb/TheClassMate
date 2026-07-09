import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const ExamScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams/');
      setExams(response.data || []);
    } catch (e) {
      console.error('Failed to load exams:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exam Results</Text>
        
        {exams.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No exam records recorded yet.</Text>
          </View>
        ) : (
          exams.map((item, idx) => {
            const hasMarks = item.marks && item.marks.length > 0;
            const score = hasMarks ? item.marks[0].marks : 0;
            const percentage = hasMarks ? ((score / item.max_marks) * 100).toFixed(0) : 0;
            
            return (
              <View key={idx} style={[styles.examCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.headerRow}>
                  <View>
                    <Text style={[styles.title, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.metaDate, { color: theme.textSecondary }]}>📅 Date: {item.date}</Text>
                  </View>
                  <View style={styles.scoreCol}>
                    <Text style={[styles.scoreValue, { color: theme.primary }]}>
                      {hasMarks ? `${score}/${item.max_marks}` : 'N/A'}
                    </Text>
                    {hasMarks && (
                      <Text style={[styles.scorePct, { color: theme.textSecondary }]}>{percentage}%</Text>
                    )}
                  </View>
                </View>

                {/* Progress bar visual */}
                {hasMarks && (
                  <View style={[styles.progressBg, { backgroundColor: theme.background }]}>
                    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: parseInt(percentage) >= 50 ? theme.success : theme.danger }]} />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  examCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaDate: {
    fontSize: 10,
    fontWeight: '600',
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scorePct: {
    fontSize: 10,
    marginTop: 2,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  }
});
