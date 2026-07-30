import React from 'react';
import { SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { Role } from '../types';

type Props = {
  userName: string;
  role: Role;
  onNavigate: (screen: 'profile' | 'invites' | 'createShootDay' | 'createCallRequest' | 'callRequestStatus') => void;
  onLogout: () => void;
};

function HomeScreen({ userName, role, onNavigate, onLogout }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome, {userName}</Text>

      {/* Extras see profile/invites options; admins see coordinator options.
          This is what makes Amy2 and extra2 see different Home screens. */}
      {role === 'EXTRA' ? (
        <>
          <TouchableOpacity style={styles.button} onPress={() => onNavigate('profile')}>
            <Text style={styles.buttonText}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('invites')}>
            <Text style={styles.buttonText}>My Invites</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={() => onNavigate('createShootDay')}>
            <Text style={styles.buttonText}>Create Shoot Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('createCallRequest')}>
            <Text style={styles.buttonText}>Create Call Request</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default HomeScreen;

/* A couple of things worth understanding:

1. role === 'EXTRA' ? (...) : (...) — this is a conditional (an "if/else" written as an expression). 
If the logged-in user's role is EXTRA, show the extra buttons; otherwise (meaning ADMIN), show 
the coordinator buttons instead.
2. import { Role } from '../types' — this is why we made types.ts first. Role is defined there as
 'ADMIN' | 'EXTRA', and now any file can import and reuse that exact definition instead of retyping it. */