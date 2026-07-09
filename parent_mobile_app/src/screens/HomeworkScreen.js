import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const HomeworkScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeworks, setHomeworks] = useState([]);

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    try {
      const response = await api.get('/homework/');
      setHomeworks(response.data || []);
    } catch (e) {
      console.error('Failed to load homework:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomework();
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Homework Assignments</Text>
        
        {homeworks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No homework assigned.</Text>
          </View>
        ) : (
          homeworks.map((item, idx) => {
            const hasSubmitted = item.submissions && item.submissions.length > 0;
            return (
              <View key={idx} style={[styles.hwCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: hasSubmitted ? `${theme.success}20` : `${theme.warning}20`, borderColor: hasSubmitted ? theme.success : theme.warning }]}>
                    <Text style={[styles.statusText, { color: hasSubmitted ? theme.success : theme.warning }]}>
                      {hasSubmitted ? 'Submitted' : 'Pending'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: theme.textSecondary }]}>{item.description}</Text>
                
                <View style={[styles.metaRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>📅 Due: {item.due}</Text>
                  {hasSubmitted && (
                    <Text style={[styles.metaText, { color: theme.success }]}>
                      ✓ Submitted on: {item.submissions[0].submitted_at || 'N/A'}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeworkScreen;

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
  hwCard: {
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
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});
