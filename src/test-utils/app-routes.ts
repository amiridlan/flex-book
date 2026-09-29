import RootLayout from '@/app/_layout';
import MemberStackLayout from '@/app/(member)/_layout';
import MemberTabsLayout from '@/app/(member)/(tabs)/_layout';
import BookingsScreen from '@/app/(member)/(tabs)/bookings';
import ExploreScreen from '@/app/(member)/(tabs)/index';
import MemberProfile from '@/app/(member)/(tabs)/profile';
import LocationDetailScreen from '@/app/(member)/locations/[id]/index';
import BookingDetailScreen from '@/app/(member)/bookings/[id]';
import SpaceScreen from '@/app/(member)/locations/[id]/spaces/[spaceId]/index';
import BookingReviewScreen from '@/app/(member)/locations/[id]/spaces/[spaceId]/review';
import DocsScreen from '@/app/docs';
import LoginScreen from '@/app/login';
import StaffTabsLayout from '@/app/staff/_layout';
import StaffHomeScreen from '@/app/staff/index';
import StaffProfile from '@/app/staff/profile';
import StaffScanScreen from '@/app/staff/scan';
import StaffWalkInScreen from '@/app/staff/walk-in';
import StaffUsersScreen from '@/app/staff/users';
import StaffActivityScreen from '@/app/staff/activity';
import StaffLocationsScreen from '@/app/staff/locations';

/** Every app route, for expo-router's `renderRouter` in integration tests. */
export const ROUTES = {
  _layout: RootLayout,
  login: LoginScreen,
  docs: DocsScreen,
  '(member)/_layout': MemberStackLayout,
  '(member)/(tabs)/_layout': MemberTabsLayout,
  '(member)/(tabs)/index': ExploreScreen,
  '(member)/(tabs)/bookings': BookingsScreen,
  '(member)/(tabs)/profile': MemberProfile,
  '(member)/locations/[id]/index': LocationDetailScreen,
  '(member)/locations/[id]/spaces/[spaceId]/index': SpaceScreen,
  '(member)/locations/[id]/spaces/[spaceId]/review': BookingReviewScreen,
  '(member)/bookings/[id]': BookingDetailScreen,
  'staff/_layout': StaffTabsLayout,
  'staff/index': StaffHomeScreen,
  'staff/profile': StaffProfile,
  'staff/scan': StaffScanScreen,
  'staff/walk-in': StaffWalkInScreen,
  'staff/users': StaffUsersScreen,
  'staff/activity': StaffActivityScreen,
  'staff/locations': StaffLocationsScreen,
};
