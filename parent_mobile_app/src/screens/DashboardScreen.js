import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const DashboardScreen = ({ navigation, isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { userInfo, logout } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    attendanceRate: '100%',
    pendingHomework: 0,
    latestResult: 'N/A'
  });
  const [latestRemark, setLatestRemark] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Get attendance rate
      const attRes = await api.get('/parent/attendance/');
      const logs = attRes.data || [];
      if (logs.length > 0) {
        const presents = logs.filter(l => l.status === 'present').length;
        const rate = ((presents / logs.length) * 100).toFixed(0);
        setStats(prev => ({ ...prev, attendanceRate: `${rate}%` }));
      }

      // 2. Get pending homework
      const hwRes = await api.get('/homework/');
      const pendingHw = (hwRes.data || []).filter(h => h.submissions?.length === 0).length;
      setStats(prev => ({ ...prev, pendingHomework: pendingHw }));

      // 3. Get latest exam result
      const examRes = await api.get('/exams/');
      const exams = examRes.data || [];
      if (exams.length > 0 && exams[0].marks?.length > 0) {
        const mark = exams[0].marks[0].marks;
        const max = exams[0].max_marks;
        setStats(prev => ({ ...prev, latestResult: `${mark}/${max}` }));
      }

      // 4. Get latest remark
      const remarkRes = await api.get('/remarks/');
      const remarks = remarkRes.data || [];
      if (remarks.length > 0) {
        setLatestRemark(remarks[0]);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
        {/* Welcome Banner */}
        <View style={[styles.welcomeBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>Hello, Parent</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
            Viewing stats for {userInfo?.first_name || 'Student'} ({userInfo?.student_id || ''})
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Attendance</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>{stats.attendanceRate}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Homework</Text>
            <Text style={[styles.statValue, { color: theme.warning }]}>{stats.pendingHomework} Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Latest Score</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>{stats.latestResult}</Text>
          </View>
        </View>

        {/* Latest Remark Preview */}
        {latestRemark && (
          <View style={[styles.remarkBox, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}>
            <Text style={[styles.remarkTitle, { color: theme.primary }]}>Latest Teacher Observation</Text>
            <Text style={[styles.remarkText, { color: theme.text }]}>"{latestRemark.text}"</Text>
            <Text style={[styles.remarkMeta, { color: theme.textSecondary }]}>
              By {latestRemark.teacher_name} on {latestRemark.date}
            </Text>
          </View>
        )}

        {/* Dashboard Navigation Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dashboard Sections</Text>
        
        <View style={styles.menuGrid}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Attendance')}>
            <Text style={[styles.menuText, { color: theme.text }]}>📅 Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Homework')}>
            <Text style={[styles.menuText, { color: theme.text }]}>📝 Homework</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Exams')}>
            <Text style={[styles.menuText, { color: theme.text }]}>📊 Exam Results</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Fees')}>
            <Text style={[styles.menuText, { color: theme.text }]}>💳 Fee Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Timetable')}>
            <Text style={[styles.menuText, { color: theme.text }]}>⏰ Timetable</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Remarks')}>
            <Text style={[styles.menuText, { color: theme.text }]}>🗣️ Remarks</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Notifications')}>
            <Text style={[styles.menuText, { color: theme.text }]}>🔔 Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('ReportCard')}>
            <Text style={[styles.menuText, { color: theme.text }]}>🎓 Report Card</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.danger }]} onPress={logout}>
          <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out of Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

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
  welcomeBanner: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  remarkBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  remarkTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  remarkText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  remarkMeta: {
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  menuText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutBtn: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  logoutText: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});
