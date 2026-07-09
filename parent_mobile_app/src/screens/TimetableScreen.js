import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const TimetableScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await api.get('/timetable/');
      setSchedules(response.data || []);
    } catch (e) {
      console.error('Failed to load timetable:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimetable();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Sort schedule slots logically by day
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const groupedSchedules = daysOrder.reduce((acc, day) => {
    const slots = schedules.filter(s => s.day === day);
    if (slots.length > 0) {
      acc[day] = slots;
    }
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Timetable Slots</Text>
        
        {schedules.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No schedule slots set yet.</Text>
          </View>
        ) : (
          daysOrder.map((day) => {
            const slots = groupedSchedules[day];
            if (!slots) return null;

            return (
              <View key={day} style={styles.daySection}>
                <Text style={[styles.dayTitle, { color: theme.primary }]}>{day}</Text>
                {slots.map((item, idx) => (
                  <View key={idx} style={[styles.slotItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.slotDetails}>
                      <Text style={[styles.slotSubject, { color: theme.text }]}>{item.subject || 'Tutorial'}</Text>
                      <Text style={[styles.slotInfo, { color: theme.textSecondary }]}>Teacher: {item.teacher_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>⏰ {item.time || 'N/A'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TimetableScreen;

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
  daySection: {
    marginBottom: 18,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  slotDetails: {
    flex: 1,
    marginRight: 10,
  },
  slotSubject: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  slotInfo: {
    fontSize: 10,
  },
  timeBadge: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  }
});
