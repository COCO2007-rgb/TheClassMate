import React, { useContext, useState } from 'react';
import { useColorScheme, StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { lightTheme, darkTheme } from './src/theme/colors';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import HomeworkScreen from './src/screens/HomeworkScreen';
import ExamScreen from './src/screens/ExamScreen';
import FeesScreen from './src/screens/FeesScreen';
import TimetableScreen from './src/screens/TimetableScreen';
import RemarksScreen from './src/screens/RemarksScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ReportCardScreen from './src/screens/ReportCardScreen';

const Stack = createStackNavigator();

const AppContent = () => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Common options for headers
  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.card,
      elevation: 1,
      shadowOpacity: 0.1,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTintColor: theme.text,
    headerTitleStyle: {
      fontWeight: 'bold',
      fontSize: 15,
    },
  };

  return (
    <NavigationContainer>
      <StatusBar barStyle={theme.statusBar === 'dark' ? 'dark-content' : 'light-content'} backgroundColor={theme.card} />
      
      <Stack.Navigator screenOptions={screenOptions}>
        {!userToken ? (
          // Auth Stack
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => <LoginScreen {...props} isDarkMode={isDarkMode} />}
          </Stack.Screen>
        ) : (
          // Main Portal Stack
          <>
            <Stack.Screen name="Dashboard" options={{ title: 'Parent Portal' }}>
              {(props) => <DashboardScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Attendance" options={{ title: 'Attendance Record' }}>
              {(props) => <AttendanceScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Homework" options={{ title: 'Homework Worksheets' }}>
              {(props) => <HomeworkScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Exams" options={{ title: 'Academic Results' }}>
              {(props) => <ExamScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Fees" options={{ title: 'Fees Ledger' }}>
              {(props) => <FeesScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Timetable" options={{ title: 'Timetable Schedule' }}>
              {(props) => <TimetableScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Remarks" options={{ title: 'Teacher Observations' }}>
              {(props) => <RemarksScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Notifications" options={{ title: 'Announcements' }}>
              {(props) => <NotificationsScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="ReportCard" options={{ title: 'Monthly Progress Card' }}>
              {(props) => <ReportCardScreen {...props} isDarkMode={isDarkMode} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
