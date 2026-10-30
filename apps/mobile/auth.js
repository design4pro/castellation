import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const API = process.env.EXPO_PUBLIC_API_URL || '';
export const auth = createAuthClient({baseURL:API || 'http://localhost:8787',plugins:[expoClient({scheme:'castellation',storagePrefix:'castellation',storage:SecureStore})]});
export async function privateFetch(path, options={}) {
  const cookie=await auth.getCookie();
  return fetch(`${API}${path}`,{...options,credentials:'omit',headers:{...options.headers,...(cookie?{Cookie:cookie}:{})}});
}
