import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authRepository } from '@/api';

import { useSessionStore } from './session-store';

type SignInInput = { readonly email: string; readonly password: string };

export function useSignIn() {
  const signIn = useSessionStore((s) => s.signIn);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: SignInInput) => authRepository.login(email, password),
    onSuccess: ({ token, user }) => {
      // A fresh cache per account: one user's data must never show for the next.
      queryClient.clear();
      signIn(token, user);
    },
  });
}

export function useSignOut() {
  const signOut = useSessionStore((s) => s.signOut);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authRepository.logout(),
    // Sign out locally even if the server call fails: the user asked to leave.
    onSettled: () => {
      signOut();
      queryClient.clear();
    },
  });
}
