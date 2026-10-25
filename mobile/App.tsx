import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootScreen } from './src/types';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { VideoPlayerScreen } from './src/screens/VideoPlayerScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { TipsScreen } from './src/screens/TipsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const MainNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<RootScreen>('splash');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('usg-01');
  const [previousScreen, setPreviousScreen] = useState<RootScreen>('home');

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentScreen('home');
      }
    }
  }, [isLoading, isAuthenticated]);

  const navigateTo = (screen: RootScreen) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  };

  const handleOpenDetails = (recordId: string) => {
    setSelectedRecordId(recordId);
    setPreviousScreen(currentScreen);
    setCurrentScreen('details');
  };

  const handleWatchVideo = (recordId: string) => {
    setSelectedRecordId(recordId);
    setPreviousScreen(currentScreen);
    setCurrentScreen('videoplayer');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#18D27C" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={currentScreen === 'videoplayer' ? 'light' : 'dark'} />

      {currentScreen === 'splash' && (
        <SplashScreen onContinue={() => navigateTo(isAuthenticated ? 'home' : 'login')} />
      )}

      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={() => navigateTo('home')}
          onGoToRegister={() => navigateTo('register')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen
          onRegisterSuccess={() => navigateTo('home')}
          onGoToLogin={() => navigateTo('login')}
        />
      )}

      {currentScreen === 'home' && (
        <HomeScreen
          onNavigate={navigateTo}
          onOpenDetails={handleOpenDetails}
          onWatchVideo={handleWatchVideo}
        />
      )}

      {currentScreen === 'history' && (
        <HistoryScreen
          onNavigate={navigateTo}
          onSelectRecord={handleOpenDetails}
        />
      )}

      {currentScreen === 'details' && (
        <DetailsScreen
          recordId={selectedRecordId}
          onBack={() => setCurrentScreen(previousScreen === 'details' ? 'home' : previousScreen)}
          onNavigate={navigateTo}
          onWatchVideo={handleWatchVideo}
        />
      )}

      {currentScreen === 'videoplayer' && (
        <VideoPlayerScreen
          recordId={selectedRecordId}
          onBack={() => setCurrentScreen(previousScreen === 'videoplayer' ? 'home' : previousScreen)}
        />
      )}

      {currentScreen === 'notifications' && (
        <NotificationsScreen
          onBack={() => setCurrentScreen(previousScreen === 'notifications' ? 'home' : previousScreen)}
          onNavigate={navigateTo}
          onOpenRecord={handleOpenDetails}
        />
      )}

      {currentScreen === 'tips' && (
        <TipsScreen onNavigate={navigateTo} />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          onNavigate={navigateTo}
          onLogout={() => navigateTo('login')}
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
