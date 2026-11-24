
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from './firebase';

// ---------------- COLORS ----------------

const COLORS = {
  primary: '#6554C0',
  dark: '#292344',
  background: '#F8F7FC',
  white: '#FFFFFF',
  grey: '#777777',
  light: '#EAE7F5',
  red: '#D9534F',
  green: '#299D68',
};

// ---------------- MAIN APP ----------------

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [screen, setScreen] = useState('Home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    return unsubscribe;
  }, []);

  // ICON ONLY SPLASH SCREEN

  if (checking) {
    return (
      <View style={styles.splashScreen}>
        <StatusBar hidden />
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={45}
          color={COLORS.primary}
        />
      </View>
    );
  }

  // LOGIN / REGISTER

  if (!user) {
    return <AuthScreen />;
  }

  // MAIN APP

  return (
    <View style={styles.appContainer}>
      <StatusBar
        backgroundColor={COLORS.background}
        barStyle="dark-content"
      />

      <View style={styles.screenContainer}>
        {screen === 'Home' && (
          <HomeScreen
            user={user}
            onNavigate={setScreen}
          />
        )}

        {screen === 'Study' && <BooksScreen />}

        {screen === 'Tasks' && <TasksScreen user={user} />}

        {screen === 'Profile' && <ProfileScreen user={user} />}
      </View>

      <View style={styles.bottomNavigation}>
        <NavButton
          label="Home"
          icon="home-outline"
          active={screen === 'Home'}
          onPress={() => setScreen('Home')}
        />

        <NavButton
          label="Books"
          icon="book-open-page-variant-outline"
          active={screen === 'Study'}
          onPress={() => setScreen('Study')}
        />

        <NavButton
          label="Tasks"
          icon="checkbox-marked-circle-outline"
          active={screen === 'Tasks'}
          onPress={() => setScreen('Tasks')}
        />

        <NavButton
          label="Profile"
          icon="account-outline"
          active={screen === 'Profile'}
          onPress={() => setScreen('Profile')}
        />
      </View>
    </View>
  );
}

// ---------------- AUTHENTICATION ----------------

function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    if (isRegister && !name.trim()) {
      Alert.alert('Missing name', 'Enter your name.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(result.user, {
          displayName: name.trim(),
        });

      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }
    } catch (error) {
      Alert.alert('Authentication error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={45}
            color={COLORS.white}
          />
        </View>

        <Text style={styles.appTitle}>EduVibe</Text>
        <Text style={styles.authSubtitle}>
          Your Student Companion
        </Text>

        <View style={styles.authCard}>
          <Text style={styles.authHeading}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Text>

          {isRegister && (
            <TextInput
              style={styles.authInput}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.authInput}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.authInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegister ? 'Register' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsRegister(!isRegister)}
            style={styles.switchAuth}
          >
            <Text style={styles.switchAuthText}>
              {isRegister
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------- HOME SCREEN ----------------

function HomeScreen({ user, onNavigate }) {
  const firstName =
    user.displayName?.split(' ')[0] || 'Student';

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 25 }}
    >
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
          <Text style={styles.subtitle}>
            Ready to make today productive?
          </Text>
        </View>

        <View style={styles.smallLogo}>
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={27}
            color={COLORS.primary}
          />
        </View>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          Welcome to EduVibe!
        </Text>
        <Text style={styles.welcomeText}>
          Your learning journey starts here. Stay organised,
          explore books and achieve your goals.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Explore EduVibe</Text>

      <View style={styles.featureGrid}>
        <FeatureCard
          icon="book-open-page-variant"
          title="Study Resources"
          description="Discover books"
          onPress={() => onNavigate('Study')}
        />

        <FeatureCard
          icon="clipboard-check-outline"
          title="My Tasks"
          description="Manage your tasks"
          onPress={() => onNavigate('Tasks')}
        />

        <FeatureCard
          icon="account-circle-outline"
          title="My Profile"
          description="Your account"
          onPress={() => onNavigate('Profile')}
        />

        <FeatureCard
          icon="calendar-check-outline"
          title="Stay Productive"
          description="Plan your day"
          onPress={() => onNavigate('Tasks')}
        />
      </View>

      <View style={styles.tipCard}>
        <MaterialCommunityIcons
          name="lightbulb-on-outline"
          size={28}
          color={COLORS.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Study Tip</Text>
          <Text style={styles.tipText}>
            Break large tasks into smaller steps and take
            short breaks while studying.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------- FEATURE CARD ----------------

function FeatureCard({ icon, title, description, onPress }) {
  return (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={34}
        color={COLORS.primary}
      />

      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------- BOOKS SCREEN ----------------

function BooksScreen() {
  const [search, setSearch] = useState('computer science');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');

  const loadBooks = async (keyword) => {
    const term = (keyword || '').trim();

    if (!term) {
      setError('Please enter a book name.');
      return;
    }

    setLoading(true);
    setError('');
    setBooks([]);
    setSource('');

    const queryText = encodeURIComponent(term);

    // GOOGLE BOOKS API

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${queryText}&maxResults=20`,
        {
          headers: { Accept: 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Books HTTP ${response.status}`);
      }

      const data = await response.json();

      const googleResults = (data.items || []).map((item) => {
        const info = item.volumeInfo || {};

        return {
          id: item.id,
          title: info.title || 'Untitled',
          author: (info.authors || ['Unknown author']).join(', '),
          year: info.publishedDate || 'Not available',
          description:
            info.description || 'No description available.',
          image:
            info.imageLinks?.thumbnail?.replace(
              'http://',
              'https://'
            ) || null,
          link: info.infoLink || '',
        };
      });

      if (googleResults.length > 0) {
        setBooks(googleResults);
        setSource('Google Books');
        setLoading(false);
        return;
      }
    } catch (googleError) {
      console.log('Google Books API:', googleError.message);
    }

    // OPEN LIBRARY BACKUP API

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${queryText}&limit=20`,
        {
          headers: { Accept: 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Open Library HTTP ${response.status}`);
      }

      const data = await response.json();

      const openResults = (data.docs || []).map((item, index) => ({
        id: item.key || String(index),
        title: item.title || 'Untitled',
        author: (item.author_name || ['Unknown author']).join(', '),
        year: item.first_publish_year || 'Not available',
        description: 'Book information from Open Library.',
        image: item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
          : null,
        link: item.key
          ? `https://openlibrary.org${item.key}`
          : '',
      }));

      if (openResults.length > 0) {
        setBooks(openResults);
        setSource('Open Library');
      } else {
        setError('No books found. Try a different search.');
      }
    } catch (openError) {
      console.log('Open Library API:', openError.message);

      setError(
        'Unable to connect to either book service. Check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks('computer science');
  }, []);

  const renderBook = ({ item }) => (
    <View style={styles.bookCard}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.bookCover}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.noCover}>
          <MaterialCommunityIcons
            name="book-outline"
            size={35}
            color={COLORS.primary}
          />
          <Text style={styles.noCoverText}>No Cover</Text>
        </View>
      )}

      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle}>{item.title}</Text>

        <Text style={styles.bookAuthor}>
          Author: {item.author}
        </Text>

        <Text style={styles.bookYear}>
          Published: {item.year}
        </Text>

        <Text style={styles.bookDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {!!item.link && (
          <TouchableOpacity
            style={styles.viewBookButton}
            onPress={() => Linking.openURL(item.link)}
          >
            <Text style={styles.viewBookText}>View Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>Study Resources</Text>
      <Text style={styles.subtitle}>
        Search books and learning resources
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadBooks(search)}
          returnKeyType="search"
        />

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => loadBooks(search)}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={23}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
          <Text style={styles.loadingText}>
            Fetching books...
          </Text>
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={35}
            color={COLORS.red}
          />
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadBooks(search)}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && books.length > 0 && (
        <Text style={styles.sourceText}>
          {books.length} books found • {source}
        </Text>
      )}

      <FlatList
        data={books}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderBook}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 25 }}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.emptyText}>
              Search for a book to get started.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

// ---------------- TASKS SCREEN ----------------

function TasksScreen({ user }) {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const taskList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setTasks(taskList);
        setLoading(false);
      },
      (error) => {
        console.log('Tasks error:', error.message);
        setLoading(false);
        Alert.alert('Tasks error', error.message);
      }
    );

    return unsubscribe;
  }, [user.uid]);

  const addTask = async () => {
    if (!taskText.trim()) {
      Alert.alert('Empty task', 'Please enter a task.');
      return;
    }

    try {
      await addDoc(
        collection(db, 'users', user.uid, 'tasks'),
        {
          title: taskText.trim(),
          completed: false,
          createdAt: serverTimestamp(),
        }
      );

      setTaskText('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleTask = async (task) => {
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'tasks', task.id),
        {
          completed: !task.completed,
        }
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const removeTask = async (taskId) => {
    try {
      await deleteDoc(
        doc(db, 'users', user.uid, 'tasks', taskId)
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>My Tasks</Text>
      <Text style={styles.subtitle}>
        Organise your study schedule
      </Text>

      <View style={styles.taskInputRow}>
        <TextInput
          style={styles.taskInput}
          placeholder="Enter a new task..."
          value={taskText}
          onChangeText={setTaskText}
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={addTask}
        >
          <MaterialCommunityIcons
            name="plus"
            size={26}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No tasks yet. Add your first task!
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <TouchableOpacity
                style={styles.taskCheck}
                onPress={() => toggleTask(item)}
              >
                <MaterialCommunityIcons
                  name={
                    item.completed
                      ? 'checkbox-marked-circle'
                      : 'checkbox-blank-circle-outline'
                  }
                  size={25}
                  color={
                    item.completed
                      ? COLORS.green
                      : COLORS.primary
                  }
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.taskTitle,
                  item.completed && styles.completedTask,
                ]}
              >
                {item.title}
              </Text>

              <TouchableOpacity
                onPress={() => removeTask(item.id)}
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={24}
                  color={COLORS.red}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ---------------- PROFILE SCREEN ----------------

function ProfileScreen({ user }) {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>My Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <MaterialCommunityIcons
            name="account"
            size={55}
            color={COLORS.white}
          />
        </View>

        <Text style={styles.profileName}>
          {user.displayName || 'Student'}
        </Text>

        <Text style={styles.profileEmail}>
          {user.email}
        </Text>
      </View>

      <View style={styles.profileInfo}>
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.profileInfoText}>
          Student Account
        </Text>
      </View>

      <View style={styles.profileInfo}>
        <MaterialCommunityIcons
          name="email-outline"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.profileInfoText}>
          {user.email}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons
          name="logout"
          size={21}
          color="#FFFFFF"
        />
        <Text style={styles.primaryButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------- BOTTOM NAVIGATION ----------------

function NavButton({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={styles.navButton}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={active ? COLORS.primary : '#999999'}
      />

      <Text
        style={[
          styles.navLabel,
          active && styles.activeNavLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  splashScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screenContainer: {
    flex: 1,
  },

  page: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 17,
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 10,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.grey,
    marginTop: 5,
    marginBottom: 18,
  },

  // AUTH

  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  authContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },

  logoCircle: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginTop: 13,
  },

  authSubtitle: {
    textAlign: 'center',
    color: COLORS.grey,
    marginBottom: 28,
  },

  authCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 20,
    elevation: 3,
  },

  authHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
  },

  authInput: {
    backgroundColor: '#F7F6FA',
    borderWidth: 1,
    borderColor: '#E3E0ED',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    color: COLORS.dark,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },

  switchAuth: {
    marginTop: 20,
    alignItems: 'center',
  },

  switchAuthText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // HOME

  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },

  greeting: {
    fontSize: 23,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  smallLogo: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 15,
  },

  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 22,
    marginBottom: 25,
  },

  welcomeTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 9,
  },

  welcomeText: {
    color: '#F0EDFF',
    lineHeight: 21,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  featureCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 13,
    elevation: 2,
    minHeight: 135,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 12,
  },

  featureDescription: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 5,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    gap: 12,
  },

  tipTitle: {
    color: COLORS.dark,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  tipText: {
    color: COLORS.grey,
    fontSize: 12,
    lineHeight: 18,
  },

  // BOOKS

  searchRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 13,
    color: COLORS.dark,
  },

  searchButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: {
    padding: 25,
    alignItems: 'center',
  },

  loadingText: {
    color: COLORS.primary,
    marginTop: 10,
  },

  sourceText: {
    color: COLORS.grey,
    fontSize: 12,
    marginBottom: 10,
  },

  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 13,
    marginBottom: 12,
    elevation: 2,
  },

  bookCover: {
    width: 85,
    height: 125,
    backgroundColor: '#F0EFF4',
    borderRadius: 5,
  },

  noCover: {
    width: 85,
    height: 125,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },

  noCoverText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 5,
  },

  bookDetails: {
    flex: 1,
    marginLeft: 12,
  },

  bookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  bookAuthor: {
    color: COLORS.primary,
    fontSize: 11,
    marginTop: 5,
  },

  bookYear: {
    color: COLORS.grey,
    fontSize: 11,
    marginTop: 4,
  },

  bookDescription: {
    color: '#555',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },

  viewBookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  viewBookText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },

  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },

  errorText: {
    color: COLORS.red,
    textAlign: 'center',
    marginTop: 10,
  },

  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },

  emptyText: {
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 35,
  },

  // TASKS

  taskInputRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 20,
  },

  taskInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 13,
    color: COLORS.dark,
  },

  addButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 11,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },

  taskCheck: {
    marginRight: 11,
  },

  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },

  completedTask: {
    textDecorationLine: 'line-through',
    color: COLORS.grey,
  },

  // PROFILE

  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    padding: 25,
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
  },

  profileAvatar: {
    backgroundColor: COLORS.primary,
    width: 90,
    height: 90,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileName: {
    fontSize: 21,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 15,
  },

  profileEmail: {
    color: COLORS.grey,
    marginTop: 5,
  },

  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 11,
    padding: 16,
    marginBottom: 11,
  },

  profileInfoText: {
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },

  logoutButton: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    padding: 15,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  // BOTTOM NAVIGATION

  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 9,
    paddingBottom: Platform.OS === 'ios' ? 20 : 9,
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  navLabel: {
    color: '#999999',
    fontSize: 11,
  },

  activeNavLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
