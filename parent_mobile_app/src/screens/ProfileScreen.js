import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const ProfileScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { userInfo } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setProfile(response.data || null);
    } catch (e) {
      console.error('Failed to load profile details:', e);
    } finally {
      setLoading(false);
    }
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {userInfo?.first_name ? userInfo.first_name[0].toUpperCase() : 'P'}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>{userInfo?.first_name || 'Parent User'}</Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary }]}>Coaching Portal: Parent Role</Text>
        </View>

        {/* Read-Only Details Grid */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Records (Read-Only)</Text>
        
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Registered Email</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{userInfo?.email || 'N/A'}</Text>
          </View>

          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Student ID Number</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{userInfo?.student_id || 'N/A'}</Text>
          </View>

          {profile && (
            <>
              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Father's Name</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{profile.father_name || 'N/A'}</Text>
              </View>

              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Mother's Name</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{profile.mother_name || 'N/A'}</Text>
              </View>

              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>School / Institution</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{profile.school || 'N/A'}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Coaching Admission Date</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{profile.admission_date || 'N/A'}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={[styles.warningText, { color: theme.textSecondary }]}>
          ⚠️ Account details cannot be modified by parents. Please contact coaching administrators to request any updates.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

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
  profileCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  detailItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 12,
  }
});
