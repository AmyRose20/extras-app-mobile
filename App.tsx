import React, { useState, useEffect } from 'react';
import { Text, View, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, DialogConfig } from './src/types';
import { setPasswordChangedHandler } from './src/api/client';

// Hooks: each one looks after one area of the app's data
import { useNavigation } from './src/hooks/useNavigation';
import { useAuth } from './src/hooks/useAuth';
import { useBadges } from './src/hooks/useBadges';
import { useMyProfile } from './src/hooks/useMyProfile';
import { useMyInvites } from './src/hooks/useMyInvites';
import { useShootDays } from './src/hooks/useShootDays';
import { useExtras } from './src/hooks/useExtras';
import { useRequests } from './src/hooks/useRequests';

// Shared components
import HeaderMenu, { MenuItem } from './src/components/HeaderMenu';
import ConfirmDialog from './src/components/ConfirmDialog';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/extra/ProfileScreen';
import InvitesScreen from './src/screens/extra/InvitesScreen';
import ShootDaysListScreen from './src/screens/coordinator/ShootDaysListScreen';
import ShootDayDetailScreen from './src/screens/coordinator/ShootDayDetailScreen';
import BulkCreateShootDaysScreen from './src/screens/coordinator/BulkCreateShootDaysScreen';
import AttendanceScreen from './src/screens/coordinator/AttendanceScreen';
import CreateCallRequestScreen from './src/screens/coordinator/CreateCallRequestScreen';
import CallRequestStatusScreen from './src/screens/coordinator/CallRequestStatusScreen';
import InviteListScreen from './src/screens/coordinator/InviteListScreen';
import ExtrasListScreen from './src/screens/coordinator/ExtrasListScreen';
import ExtraProfileDetailScreen from './src/screens/coordinator/ExtraProfileDetailScreen';
import InviteExtrasScreen from './src/screens/coordinator/InviteExtrasScreen';
import DeletionRequestsScreen from './src/screens/coordinator/DeletionRequestsScreen';
import ProductionRequestsScreen from './src/screens/coordinator/ProductionRequestsScreen';

function AppContent(): React.JSX.Element {
  const insets = useSafeAreaInsets(); // how much space the status bar etc. take up
  const {
    screen,
    setScreen,
    callRequestStatusReturnTo,
    setCallRequestStatusReturnTo,
    extraProfileReturnTo,
    setExtraProfileReturnTo,
    shootDayDetailReturnTo,
    setShootDayDetailReturnTo,
    callRequestShootDayId,
    setCallRequestShootDayId,
    activeCallRequestId,
    setActiveCallRequestId,
    inviteListStatus,
    viewInviteList,
    viewResponses,
  } = useNavigation();
  const [dialog, setDialog] = useState<DialogConfig | null>(null); // null = no dialog open
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shows a short message at the bottom of any screen for 3 seconds
  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const {
    email,
    setEmail,
    password,
    setPassword,
    message,
    setMessage,
    loginNotice,
    setLoginNotice,
    token,
    userId,
    userName,
    role,
    coordinatorProduction,
    login,
    logout,
    updateToken,
  } = useAuth();

  const { badgeCounts, resetBadges } = useBadges(screen, token);

  const profile = useMyProfile({ screen, role, userId, loginEmail: email });
  const myInvites = useMyInvites(screen, role);
  const schedule = useShootDays(screen, role); // shoot days (coordinators)
  const casting = useExtras(screen); // Extra Profiles list + one opened extra (coordinators)
  const requests = useRequests(screen); // deletion + production requests (coordinators)

  const handleLogin = async () => {
    if (await login()) {
      setScreen('home');
    }
  };

  const handleLogout = async () => {
    await logout();
    setScreen('login');
    // Forget the last user's searches, filters, lists and badge counts,
    // so the next person to log in on this phone starts fresh
    casting.resetExtras();
    resetBadges();
  };

  // If the password is changed on another phone, the backend rejects this phone's
  // old login. apiRequest (src/api/client.ts) spots that and calls this, which
  // sends the user back to the login screen with a clear message.
  useEffect(() => {
    setPasswordChangedHandler(async () => {
      await handleLogout();
      setMessage('Your password was changed. Please log in again.');
    });
    return () => setPasswordChangedHandler(null); // stop listening if App ever unmounts
  }, []);

  const handleSelectExtra = (id: string, returnTo: Screen = 'extrasList') => {
    setExtraProfileReturnTo(returnTo);
    setScreen('extraProfileDetail');
    casting.openExtra(id);
  };

  const handleSelectShootDay = (id: string, returnTo: Screen = 'shootDaysList') => {
    setShootDayDetailReturnTo(returnTo);
    setScreen('shootDayDetail');
    schedule.loadShootDayDetail(id);
  };

  const renderScreen = (): React.JSX.Element => {
    if (screen === 'changePassword') {
      return (
        <ChangePasswordScreen
          onBack={() => setScreen('home')}
          onChanged={(newToken) => {
            updateToken(newToken); // this phone stays logged in; other phones are logged out
            setScreen('home');
            setDialog({
              title: 'Password changed',
              message: "Your password has been changed. You've been logged out on any other phones.",
              confirmText: 'OK',
            });
          }}
        />
      );
    }
    if (screen === 'forgotPassword') {
      return (
        <ForgotPasswordScreen
          initialEmail={email}
          onBack={() => setScreen('login')}
          onDone={(resetEmail) => {
            setEmail(resetEmail);
            setPassword('');
            setMessage('');
            setLoginNotice('Password reset. Please log in with your new password.');
            setScreen('login');
          }}
        />
      );
    }
    if (screen === 'login') {
      return (
        <LoginScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          message={message}
          onLogin={handleLogin}
          notice={loginNotice}
          onForgotPassword={() => {
            setMessage('');
            setLoginNotice('');
            setScreen('forgotPassword');
          }}
        />
      );
    }

    if (screen === 'home') {
      return (
        <HomeScreen
          userName={userName}
          role={role}
          shootDays={schedule.shootDays}
          invites={myInvites.invites}
          onNavigate={(target) => {
            setCallRequestShootDayId(undefined); // opening from Home never pre-selects a shoot day
            setScreen(target);
          }}
          onSelectShootDay={(id) => handleSelectShootDay(id, 'home')}
          invitesBadge={badgeCounts.invites}
        />
      );
    }

    if (screen === 'profile') {
      return (
        <ProfileScreen
          name={userName}
          dateOfBirth={profile.dateOfBirth}
          setDateOfBirth={profile.setDateOfBirth}
          gender={profile.gender}
          setGender={profile.setGender}
          heightCm={profile.heightCm}
          setHeightCm={profile.setHeightCm}
          skills={profile.skills}
          onToggleSkill={profile.toggleSkill}
          otherSkills={profile.otherSkills}
          setOtherSkills={profile.setOtherSkills}
          languages={profile.languages}
          onToggleLanguage={profile.toggleLanguage}
          otherLanguages={profile.otherLanguages}
          setOtherLanguages={profile.setOtherLanguages}
          phoneNumber={profile.phoneNumber}
          setPhoneNumber={profile.setPhoneNumber}
          contactEmail={profile.contactEmail}
          setContactEmail={profile.setContactEmail}
          contactError={profile.contactError}
          availability={profile.availability}
          onToggleAvailability={profile.toggleAvailability}
          otherAvailability={profile.otherAvailability}
          setOtherAvailability={profile.setOtherAvailability}
          loading={profile.profileLoading}
          message={profile.profileMessage}
          onSave={profile.saveProfile}
          onBack={() => {
            profile.setIsEditingProfile(false);
            setScreen('home');
          }}
          isEditingProfile={profile.isEditingProfile}
          setIsEditingProfile={profile.setIsEditingProfile}
          onCancelEdit={profile.handleCancelEdit}
          facePhotoUrl={profile.facePhotoUrl}
          fullBodyPhotoUrl={profile.fullBodyPhotoUrl}
          pendingFacePhoto={profile.pendingFacePhoto}
          pendingFullBodyPhoto={profile.pendingFullBodyPhoto}
          onPickFacePhoto={profile.handlePickFacePhoto}
          onPickFullBodyPhoto={profile.handlePickFullBodyPhoto}
          uploadingPhoto={profile.uploadingPhoto}
          showSavedPopup={profile.showSavedPopup}
          deletionRequestStatus={profile.deletionRequestStatus}
          allProductionNames={profile.allProductions.map((p) => p.name)}
          myProductionNames={profile.myProductionNames}
          onToggleProduction={profile.toggleProduction}
          productionsError={profile.productionsError}
          pendingProductionNames={profile.pendingProductionNames}
          deniedProductions={profile.deniedProductions}
          hasSmartphone={profile.hasSmartphone}
          setHasSmartphone={profile.setHasSmartphone}
          bankDetails={profile.bankDetails}
          editingBank={profile.editingBank}
          setEditingBank={profile.setEditingBank}
          removeBank={profile.removeBank}
          setRemoveBank={profile.setRemoveBank}
          ibanInput={profile.ibanInput}
          setIbanInput={profile.setIbanInput}
          bicInput={profile.bicInput}
          setBicInput={profile.setBicInput}
          accountNameInput={profile.accountNameInput}
          setAccountNameInput={profile.setAccountNameInput}
          bankError={profile.bankError}
        />
      );
    }

    if (screen === 'invites') {
      return (
        <InvitesScreen
          invites={myInvites.invites}
          loading={myInvites.invitesLoading}
          message={myInvites.invitesMessage}
          onRespond={myInvites.respondToInvite}
          onBack={() => setScreen('home')}
          tally={myInvites.tally}
          showDialog={setDialog}
        />
      );
    }

    if (screen === 'extrasList') {
      return (
        <ExtrasListScreen
          extras={casting.extras}
          loading={casting.extrasLoading}
          message={casting.extrasMessage}
          skillFilter={casting.skillFilter}
          onSelectSkillFilter={casting.toggleSkillFilter}
          onClearSkillFilter={() => casting.setSkillFilter([])}
          genderFilter={casting.genderFilter}
          onSelectGenderFilter={casting.setGenderFilter}
          nameFilter={casting.nameFilter}
          onSearchName={casting.setNameFilter}
          availabilityFilter={casting.availabilityFilter}
          onSelectAvailabilityFilter={casting.toggleAvailabilityFilter}
          onClearAvailabilityFilter={() => casting.setAvailabilityFilter([])}
          minAgeFilter={casting.minAgeFilter}
          setMinAgeFilter={casting.setMinAgeFilter}
          maxAgeFilter={casting.maxAgeFilter}
          setMaxAgeFilter={casting.setMaxAgeFilter}
          onApplyAgeFilter={casting.loadExtras}
          onSelectExtra={handleSelectExtra}
          onClearFilters={casting.clearFilters}
          onBack={() => setScreen('home')}
        />
      );
    }

    if (screen === 'extraProfileDetail') {
      return (
        <ExtraProfileDetailScreen
          profile={casting.selectedExtraProfile}
          loading={casting.extraDetailLoading}
          message={casting.extraDetailMessage}
          onBack={() => setScreen(extraProfileReturnTo)}
          tally={casting.extraTally}
        />
      );
    }

    if (screen === 'deletionRequests') {
      return (
        <DeletionRequestsScreen
          requests={requests.deletionRequests}
          loading={requests.deletionRequestsLoading}
          message={requests.deletionRequestsMessage}
          onApprove={(userId) => requests.reviewDeletionRequest(userId, 'approve')}
          onDeny={(userId) => requests.reviewDeletionRequest(userId, 'deny')}
          onBack={() => setScreen('home')}
          showDialog={setDialog}
        />
      );
    }
 
    if (screen === 'inviteExtras') {
      return (
        <InviteExtrasScreen
          productionName={coordinatorProduction}
          onBack={() => setScreen('home')}
        />
      );
    }
    if (screen === 'productionRequests') {
      return (
        <ProductionRequestsScreen
          productionName={coordinatorProduction}
          requests={requests.productionRequests}
          loading={requests.productionRequestsLoading}
          message={requests.productionRequestsMessage}
          onApprove={(id) => requests.reviewProductionRequest(id, 'approve')}
          onDeny={(id) => requests.reviewProductionRequest(id, 'deny')}
          onBack={() => setScreen('home')}
          showDialog={setDialog}
        />
      );
    }

    if (screen === 'shootDaysList') {
      return (
        <ShootDaysListScreen
          shootDays={schedule.shootDays}
          loading={schedule.shootDaysLoading}
          message={schedule.shootDaysMessage}
          onSelectShootDay={handleSelectShootDay}
          onBack={() => setScreen('home')}
        />
      );
    }

    if (screen === 'attendance' && schedule.selectedShootDay) {
      return (
        <AttendanceScreen
          shootDayId={schedule.selectedShootDay.id}
          productionName={coordinatorProduction}
          onBack={() => setScreen('shootDayDetail')}
          showDialog={setDialog}
        />
      );
    }

    if (screen === 'shootDayDetail') {
      return (
        <ShootDayDetailScreen
          shootDay={schedule.selectedShootDay}
          loading={schedule.shootDayDetailLoading}
          message={schedule.shootDayDetailMessage}
          onBack={() => setScreen(shootDayDetailReturnTo)}
          onSaved={() => {
            if (schedule.selectedShootDay) {
              schedule.loadShootDayDetail(schedule.selectedShootDay.id);
            }
          }}
          editingCallRequestId={schedule.editingCallRequestId}
          editDescription={schedule.editDescription}
          setEditDescription={schedule.setEditDescription}
          editQuantity={schedule.editQuantity}
          setEditQuantity={schedule.setEditQuantity}
          onStartEditCallRequest={schedule.startEditCallRequest}
          onCancelEditCallRequest={schedule.cancelEditCallRequest}
          onSaveCallRequest={schedule.saveCallRequest}
          onViewResponses={viewResponses}
          onOpenAttendance={() => setScreen('attendance')}
          onAddCallRequest={() => {
            if (schedule.selectedShootDay) {
              setCallRequestShootDayId(schedule.selectedShootDay.id);
              setScreen('createCallRequest');
            }
          }}
        />
      );
    }

    if (screen === 'createCallRequest') {
      const fromShootDayId = callRequestShootDayId; // undefined if opened from Home
      return (
        <CreateCallRequestScreen
          initialShootDayId={fromShootDayId}
          onBack={() => {
            setCallRequestShootDayId(undefined);
            if (fromShootDayId) {
              setScreen('shootDayDetail'); // back to the shoot day it was opened from
            } else {
              setScreen('home');
            }
          }}
          onCreated={(callRequestId) => {
            setCallRequestShootDayId(undefined);
            setActiveCallRequestId(callRequestId);
            if (fromShootDayId) {
              schedule.loadShootDayDetail(fromShootDayId); // refresh so the new call request shows
              setCallRequestStatusReturnTo('shootDayDetail');
            } else {
              setCallRequestStatusReturnTo('home');
            }
            setScreen('callRequestStatus');
          }}
        />
      );
    }

    if (screen === 'callRequestStatus') {
      return (
        <CallRequestStatusScreen
          callRequestId={activeCallRequestId}
          onBack={() => setScreen(callRequestStatusReturnTo)}
          onViewInvites={viewInviteList}
        />
      );
    }

    if (screen === 'inviteList') {
      return (
        <InviteListScreen
          callRequestId={activeCallRequestId}
          status={inviteListStatus}
          onBack={() => setScreen('callRequestStatus')}
          onSelectExtra={(id) => handleSelectExtra(id, 'inviteList')}
        />
      );
    }

    if (screen === 'bulkCreateShootDays') {
      return (
        <BulkCreateShootDaysScreen
          productionName={coordinatorProduction}
          onBack={() => setScreen('home')}
          onCreated={(count) => {
            showToast(`Created ${count} shoot ${count === 1 ? 'day' : 'days'}.`);
            setScreen('shootDaysList');
          }}
        />
      );
    }

    // Fallback — shouldn't normally be reached, but keeps TypeScript happy
    // about every possible Screen value being handled.
    return (
      <HomeScreen
        userName={userName}
        role={role}
        shootDays={schedule.shootDays}
        invites={myInvites.invites}
        onNavigate={(target) => setScreen(target)}
        onSelectShootDay={(id) => handleSelectShootDay(id, 'home')}
        invitesBadge={badgeCounts.invites}
      />
    );
  };

    // ----- Hamburger menu items for the current screen -----
  const menuItems: MenuItem[] = [];
  
  // Everyone: change password
  menuItems.push({
    label: 'Change Password',
    disabled: screen === 'changePassword',
    onPress: () => setScreen('changePassword'),
  });
 
  // Coordinators: deletion requests live in the menu (they're only needed occasionally)
  if (role === 'ADMIN') {
    menuItems.push({
      label: 'Deletion Requests',
      badge: badgeCounts.deletionRequests,
      disabled: screen === 'deletionRequests', // greyed out when you're already there
      onPress: () => setScreen('deletionRequests'),
    });
      menuItems.push({
      label: 'Production Requests',
      badge: badgeCounts.productionRequests,
      disabled: screen === 'productionRequests', // greyed out when you're already there
      onPress: () => setScreen('productionRequests'),
    });
    menuItems.push({
      label: 'Invite Extras',
      disabled: screen === 'inviteExtras', // greyed out when you're already there
      onPress: () => setScreen('inviteExtras'),
    });
  }

  // Extras: request (or cancel) deletion of their own account
  if (role === 'EXTRA') {
    const pending = profile.deletionRequestStatus === 'PENDING';
    menuItems.push({
      label: pending ? 'Cancel Deletion Request' : 'Delete My Account',
      danger: true,
      disabled: profile.deletionActionLoading,
      onPress: () =>
        setDialog(
          pending
            ? {
                title: 'Cancel Deletion Request?',
                message: 'Your account will no longer be scheduled for deletion.',
                cancelText: 'No',
                confirmText: 'Yes, Cancel It',
                onConfirm: profile.cancelAccountDeletion,
              }
            : {
                title: 'Delete Account?',
                message:
                  'This sends a request to the admin to delete your account. You will not be able to log in once it is approved.',
                confirmText: 'Request Deletion',
                destructive: true,
                onConfirm: profile.requestAccountDeletion,
              }
        ),
    });
  }

  // Coordinators viewing an extra's profile: remove from production / request deletion
  if (screen === 'extraProfileDetail' && casting.selectedExtraProfile) {
    const extra = casting.selectedExtraProfile;
    const deletionPending = extra.deletionRequestStatus === 'PENDING';

    const openDeletionDialog = () =>
      setDialog({
        title: 'Request Account Deletion?',
        message: `This sends a deletion request for ${extra.name}'s account to be reviewed.`,
        confirmText: 'Request Deletion',
        destructive: true,
        onConfirm: () => casting.requestDeletionForExtra(extra.userId),
      });

    menuItems.push({
      label: 'Remove from Production',
      danger: true,
      onPress: () => {
        if ((extra.productions?.length ?? 0) <= 1) {
          // Only production: explain, and offer the deletion route instead
          setDialog({
            title: `Can't remove ${extra.name}`,
            message: deletionPending
              ? `${coordinatorProduction} is ${extra.name}'s only production, and an account deletion request is already awaiting approval.`
              : `${coordinatorProduction} is ${extra.name}'s only production. To take them off completely, request account deletion instead.`,
            cancelText: 'Close',
            ...(deletionPending
              ? {}
              : { confirmText: 'Request Deletion', destructive: true, onConfirm: openDeletionDialog }),
          });
        } else {
          setDialog({
            title: `Remove from ${coordinatorProduction}?`,
            message: `${extra.name} will no longer be matched or invited for ${coordinatorProduction}. Their upcoming invites for this production will be expired. Their account and any other productions are not affected.`,
            confirmText: 'Remove',
            destructive: true,
            onConfirm: async () => {
              if (await casting.removeFromMyProduction(extra.id)) {
                setScreen(extraProfileReturnTo); // back to the list it was opened from
              }
            },
          });
        }
      },
    });

    menuItems.push({
      label: deletionPending ? 'Deletion Requested' : 'Request Account Deletion',
      danger: !deletionPending,
      disabled: deletionPending, // greyed out once a request is pending
      onPress: openDeletionDialog,
    });
  }

      return (
    <View style={{ flex: 1, backgroundColor: '#1a1330', paddingTop: screen === 'login' ? 0 : insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flex: 1 }}>
        {renderScreen()}

        {screen !== 'login' && screen !== 'forgotPassword' && (
          <HeaderMenu
            isHome={screen === 'home'}
            onGoHome={() => setScreen('home')}
            onLogout={handleLogout}
            items={menuItems}
            badgeCount={role === 'ADMIN' ? badgeCounts.deletionRequests + badgeCounts.productionRequests : 0}
          />
        )}

        {/* One app-wide confirmation dialog, drawn over everything */}
        <ConfirmDialog
          visible={dialog !== null}
          title={dialog?.title ?? ''}
          message={dialog?.message ?? ''}
          confirmText={dialog?.confirmText}
          cancelText={dialog?.cancelText}
          destructive={dialog?.destructive}
          onCancel={() => setDialog(null)}
          onConfirm={
            dialog?.onConfirm
              ? () => {
                  const action = dialog?.onConfirm;
                  setDialog(null); // close this dialog first...
                  action?.();      // ...then run the action (which may open another dialog)
                }
              : undefined
          }
        />
        
        {/* App-wide toast message (e.g. "Created 2 shoot days.") */}
        {toastMessage ? (
          <View
            style={{
              position: 'absolute',
              bottom: 30,
              left: 20,
              right: 20,
              backgroundColor: '#d99c4a',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              zIndex: 200,
              elevation: 200,
            }}
          >
            <Text style={{ color: '#1a1330', fontWeight: '700', fontSize: 15 }}>{toastMessage}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;