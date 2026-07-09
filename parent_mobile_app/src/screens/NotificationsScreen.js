import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const NotificationsScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data || []);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Announcements & Broadcasts</Text>
        
        {notifications.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications to display.</Text>
          </View>
        ) : (
          notifications.map((item, idx) => (
            <View key={idx} style={[styles.notifyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.headerRow}>
                <Text style={[styles.notifyTitle, { color: theme.text }]}>{item.title}</Text>
                {item.global && (
                  <View style={[styles.globalBadge, { backgroundColor: `${theme.primary}15`, borderColor: theme.primary }]}>
                    <Text style={[styles.globalText, { color: theme.primary }]}>Global</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.notifyText, { color: theme.textSecondary }]}>{item.message}</Text>
              <Text style={[styles.notifyDate, { color: theme.textSecondary }]}>📅 {item.timestamp}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

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
  notifyCard: {
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
    marginBottom: 6,
  },
  notifyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  notifyText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  notifyDate: {
    fontSize: 9,
  },
  globalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  globalText: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});
