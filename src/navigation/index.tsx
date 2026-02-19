import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DetailsScreen } from '../screens/DetailsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Tabs: undefined;
  Details: { id: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#121A2B', borderTopColor: '#2A3550' },
        tabBarActiveTintColor: '#6D5BFF',
        tabBarInactiveTintColor: '#97A3BA'
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Busca" component={SearchScreen} options={{ tabBarIcon: () => <Text>🔎</Text> }} />
      <Tab.Screen name="Config" component={SettingsScreen} options={{ tabBarIcon: () => <Text>⚙</Text> }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { loading, onboarded } = useAppContext();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {loading && <Stack.Screen name="Splash" component={SplashScreen} />}
      {!loading && !onboarded && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
      {!loading && onboarded && (
        <>
          <Stack.Screen name="Tabs" component={TabsNavigator} />
          <Stack.Screen name="Details" component={DetailsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
