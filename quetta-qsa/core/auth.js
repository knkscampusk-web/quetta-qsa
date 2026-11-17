// 로그인 + 교무 허용목록 확인
// 화면 쪽 확인은 "안내용"이고, 실제 접근 차단은 firestore.rules 가 합니다.
import {
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  getAuth, signInWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// 연결 프로젝트 로그인용 Google 인증 정보. 메모리에만 두고 저장하지 않습니다.
let googleCredential = null;

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  googleCredential = GoogleAuthProvider.credentialFromResult(result);
  return result.user;
}

export function logout() {
  googleCredential = null;
  return signOut(auth);
}

// 허용목록: qsa_admins/{이메일 소문자} 문서가 있어야 통과
export async function isAllowed(user) {
  if (!user?.email || !user.emailVerified) return false;
  const snap = await getDoc(doc(db, "qsa_admins", user.email.toLowerCase()));
  return snap.exists();
}

// 상태 변화 구독: cb({ state: "signedOut" | "allowed" | "denied" | "error", user, error })
// 거부/오류로 로그아웃시킬 때, 뒤따르는 "로그아웃됨" 이벤트가 안내 문구를 지우지 않도록
// 사유를 들고 있다가 그 이벤트에서 함께 넘깁니다.
let pendingReason = null;

export function watchAuth(cb) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      const reason = pendingReason;
      pendingReason = null;
      return cb(reason || { state: "signedOut" });
    }
    try {
      if (await isAllowed(user)) return cb({ state: "allowed", user });
      pendingReason = { state: "denied", email: user.email };
    } catch (error) {
      pendingReason = { state: "error", error };
    }
    await logout();
  });
}

// 2·3단계: 연결 프로젝트에도 같은 Google 계정으로 로그인
// (새로고침 후에는 인증 정보가 없으므로 Google 창이 한 번 더 뜰 수 있습니다)
export async function linkSignIn(linkedApp) {
  const linkedAuth = getAuth(linkedApp);
  if (linkedAuth.currentUser) return linkedAuth.currentUser;
  if (googleCredential) {
    return (await signInWithCredential(linkedAuth, googleCredential)).user;
  }
  return (await signInWithPopup(linkedAuth, provider)).user;
}
