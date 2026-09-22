import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  plan: "Free" | "Creator" | "Pro" | "Enterprise";
  credits: number;
  role: "client" | "admin";
  createdAt: string;
  updatedAt?: string;
}

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId if defined
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore: client is offline or network is unreachable.");
    }
    return false;
  }
}

// Register new client with Email & Password
export async function registerClient(
  email: string,
  pass: string,
  displayName: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = cred.user;

  // Update Auth Profile
  if (displayName.trim()) {
    try {
      await updateProfile(user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn("Failed to set Auth display name:", e);
    }
  }

  const initialProfile: UserProfile = {
    id: user.uid,
    email: user.email || email.trim(),
    displayName: displayName.trim() || user.email?.split("@")[0] || "Client",
    plan: "Free",
    credits: 10000, // 10,000 complimentary free starter credits (~15 mins HD speech)
    role: "client",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "users", user.uid), initialProfile);
  } catch (err) {
    console.warn("Could not save initial profile to Firestore:", err);
  }

  return initialProfile;
}

// Login existing client with Email & Password
export async function loginClient(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = cred.user;
  return await fetchOrCreateProfile(user);
}

// Login/Register with Google
export async function loginWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return await fetchOrCreateProfile(result.user);
}

// Helper: fetch or create profile for authenticated user
export async function fetchOrCreateProfile(user: FirebaseUser): Promise<UserProfile> {
  const userDocRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn("Error fetching user profile doc:", err);
  }

  // If document does not exist yet (e.g., first-time Google sign-in)
  const newProfile: UserProfile = {
    id: user.uid,
    email: user.email || "client@voxify.ai",
    displayName: user.displayName || user.email?.split("@")[0] || "Client",
    plan: "Free",
    credits: 10000,
    role: "client",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userDocRef, newProfile);
  } catch (err) {
    console.warn("Could not write new profile to Firestore:", err);
  }

  return newProfile;
}

// Sign out current client
export async function logoutClient(): Promise<void> {
  await signOut(auth);
}

// Update client credits in Firestore
export async function syncUserCreditsToCloud(userId: string, credits: number): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      credits,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to sync credits to Firestore:", err);
  }
}

// Update client subscription plan in Firestore
export async function syncUserPlanToCloud(
  userId: string,
  plan: "Free" | "Creator" | "Pro" | "Enterprise",
  credits?: number
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    const payload: Partial<UserProfile> = {
      plan,
      updatedAt: new Date().toISOString(),
    };
    if (typeof credits === "number") {
      payload.credits = credits;
    }
    await updateDoc(userDocRef, payload);
  } catch (err) {
    console.warn("Failed to sync plan to Firestore:", err);
  }
}

// Save take to user cloud library
export async function saveTakeToCloud(userId: string, take: any): Promise<void> {
  try {
    const takeRef = doc(db, "users", userId, "takes", take.id);
    await setDoc(takeRef, {
      id: take.id,
      userId,
      text: take.text,
      voice: take.voice,
      style: take.style || "natural",
      duration: take.duration || 0,
      createdAt: new Date(take.timestamp || Date.now()).toISOString(),
    });
  } catch (err) {
    console.warn("Failed to save take to cloud subcollection:", err);
  }
}
