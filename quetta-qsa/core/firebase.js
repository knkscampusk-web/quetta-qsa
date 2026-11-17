// Firebase 초기화 (SDK 10.x 모듈 방식으로 통일)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, linkedProjects } from "./config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 2·3단계: 기존 프로젝트를 이름 붙인 보조 앱으로 연결합니다.
// 로그인은 프로젝트마다 따로이므로, auth.js 의 linkSignIn() 으로 같은 Google 인증을 재사용합니다.
const linked = new Map();
export function getLinkedApp(name) {
  if (linked.has(name)) return linked.get(name);
  const cfg = linkedProjects[name];
  if (!cfg) throw new Error(`연결 설정이 없습니다: ${name} (core/config.js 의 linkedProjects 확인)`);
  const a = initializeApp(cfg, name);
  linked.set(name, a);
  return a;
}
