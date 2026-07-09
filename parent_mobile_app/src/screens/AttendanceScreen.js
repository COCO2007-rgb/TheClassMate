import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const AttendanceScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, percentage: 0 });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/parent/attendance/');
      const logs = response.data || [];
      setRecords(logs);

      if (logs.length > 0) {
        const presents = logs.filter(l => l.status === 'present').length;
        const absents = logs.length - presents;
        const pct = ((presents / logs.length) * 100).toFixed(1);
        setSummary({ present: presents, absent: absents, percentage: pct });
      }
    } catch (e) {
      console.error('Failed to load attendance logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
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
        {/* Attendance Summary Header Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Attendance Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Present</Text>
              <Text style={[styles.summaryValue, { color: theme.success }]}>{summary.present}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Absent</Text>
              <Text style={[styles.summaryValue, { color: theme.danger }]}>{summary.absent}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Ratio</Text>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>{summary.percentage}%</Text>
            </View>
          </View>
        </View>

        {/* History List */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance Logs</Text>
        
        {records.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No attendance records logged yet.</Text>
          </View>
        ) : (
          records.map((item, idx) => (
            <View key={idx} style={[styles.logItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View>
                <Text style={[styles.logDate, { color: theme.text }]}>{item.date}</Text>
                <Text style={[styles.logSubtitle, { color: theme.textSecondary }]}>Class Session</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'present' ? `${theme.success}20` : `${theme.danger}20`, borderColor: item.status === 'present' ? theme.success : theme.danger }]}>
                <Text style={[styles.statusText, { color: item.status === 'present' ? theme.success : theme.danger }]}>
                  {item.status === 'present' ? 'Present' : 'Absent'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AttendanceScreen;

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
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryCol: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
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
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  logDate: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  logSubtitle: {
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  }
});
