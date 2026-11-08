// ==UserScript==
// @name         YouTube 화면 정리 (댓글 오른쪽 · 추천 영상 N열 · 라이브 채팅 버블)
// @namespace    youbitter
// @updateURL    https://raw.githubusercontent.com/boldvoid/youtube-layout/main/youtube-layout.user.js
// @downloadURL  https://raw.githubusercontent.com/boldvoid/youtube-layout/main/youtube-layout.user.js
// @version      0.18.2
// @description  댓글을 오른쪽 위로, 추천 영상은 영상 아래 N열 카드로, 라이브 채팅은 영상 위 버블로 보여줍니다.
// @match        https://www.youtube.com/*
// @run-at       document-start
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// ==/UserScript==

// 유저스크립트 단독 파일입니다. 이 파일을 직접 수정하세요.
// 버전: 0.18.2 beta

const YTPC_CSS = "/* 공통 디자인 값: 모든 간격·모서리를 이 두 값으로 통일 (JS의 GAP 과 같은 값) */\nhtml { --ytpc-gap: 12px; --ytpc-radius: 12px; }\n\n/* 오른쪽 칸 맨 위 댓글 상자 */\n#ytpc-box {\n  position: relative;\n  height: var(--ytpc-h, 360px);\n  border: 1px solid rgba(0, 0, 0, .1);\n  border-radius: var(--ytpc-radius);\n  overflow: hidden;\n  box-sizing: border-box;\n  background: transparent;\n  color-scheme: light;\n}\n/* 다크모드: YouTube 다크 테마(html[dark])일 때 */\nhtml[dark] #ytpc-box {\n  border-color: rgba(255, 255, 255, .16);\n  color-scheme: dark;\n}\n#ytpc-box .ytpc-scroll {\n  position: absolute;\n  inset: 0;\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  padding: var(--ytpc-gap) var(--ytpc-gap) 4px var(--ytpc-gap);\n  box-sizing: border-box;\n}\n/* 좁은 칸에 맞게 댓글 여백 정리 */\n#ytpc-box ytd-comments#comments { margin: 0 !important; padding: 0 !important; }\n#ytpc-box ytd-comments-header-renderer { margin-top: 0 !important; margin-bottom: 16px !important; }\n#ytpc-box ytd-comments-header-renderer #title { flex-wrap: wrap; }\n\n/* ---- 추천 영상: 영상 아래 전체 너비 N열 카드 ---- */\n#ytpc-wide {\n  box-sizing: border-box;\n  width: 100%;\n  padding: var(--ytpc-gap) calc(var(--ytpc-gap) * 2) calc(var(--ytpc-gap) * 2);\n}\n#ytpc-wide ytd-watch-next-secondary-results-renderer { display: block; width: 100% !important; max-width: none !important; margin: 0 !important; }\n#ytpc-wide ytd-item-section-renderer > #contents {\n  display: grid !important;\n  grid-template-columns: repeat(var(--ytpc-cols, 4), minmax(0, 1fr));\n  grid-auto-flow: row dense;   /* 쇼츠 묶음 등 한 줄짜리 때문에 생긴 빈칸을 뒤 영상으로 채움 */\n  column-gap: var(--ytpc-gap);\n  row-gap: calc(var(--ytpc-gap) * 2);\n}\n/* 영상 카드·광고가 아닌 것(더보기 로딩, 쇼츠 묶음 등)은 한 줄 전체 */\n#ytpc-wide ytd-item-section-renderer > #contents > :not(yt-lockup-view-model):not(ytd-compact-video-renderer):not(ytd-ad-slot-renderer) {\n  grid-column: 1 / -1;\n}\n#ytpc-wide ytd-item-section-renderer > #contents > * { margin: 0 !important; min-width: 0; }\n\n/* 새 YouTube 카드: 썸네일 위, 제목 아래 */\n#ytpc-wide yt-lockup-view-model .ytLockupViewModelHost { flex-direction: column !important; padding: 0 !important; }\n#ytpc-wide yt-lockup-view-model .ytLockupViewModelContentImage { width: 100% !important; margin: 0 0 8px 0 !important; padding: 0 !important; }\n#ytpc-wide yt-lockup-view-model .ytLockupViewModelMetadata { width: 100%; min-width: 0; }\n\n/* 예전 YouTube 카드 */\n#ytpc-wide ytd-compact-video-renderer #dismissible { flex-direction: column !important; }\n#ytpc-wide ytd-compact-video-renderer ytd-thumbnail { width: 100% !important; margin: 0 0 8px 0 !important; }\n#ytpc-wide ytd-compact-video-renderer .details { padding: 0 !important; }\n\n/* ---- 댓글 로딩 효과 (YouTube 스켈레톤 + 글로우) ---- */\n#ytpc-box .ytpc-scroll { transition: opacity .25s ease; }\n#ytpc-box.ytpc-loading .ytpc-scroll { opacity: 0; pointer-events: none; }\n#ytpc-box .ytpc-skeleton {\n  position: absolute;\n  inset: 0;\n  padding: 16px 14px;\n  overflow: hidden;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity .25s ease;\n  --sk-base: rgba(0, 0, 0, .06);\n  --sk-glow: rgba(0, 0, 0, .12);\n}\nhtml[dark] #ytpc-box .ytpc-skeleton {\n  --sk-base: rgba(255, 255, 255, .08);\n  --sk-glow: rgba(255, 255, 255, .17);\n}\n#ytpc-box.ytpc-loading .ytpc-skeleton { opacity: 1; }\n\n.ytpc-sk {\n  border-radius: 4px;\n  background: linear-gradient(90deg, var(--sk-base) 0%, var(--sk-base) 35%, var(--sk-glow) 50%, var(--sk-base) 65%, var(--sk-base) 100%);\n  background-size: 300% 100%;\n  animation: ytpc-glow 1.4s ease-in-out infinite;\n}\n@keyframes ytpc-glow {\n  0%   { background-position: 100% 0; }\n  100% { background-position: 0 0; }\n}\n.ytpc-sk-head { display: flex; gap: 24px; align-items: center; margin-bottom: 24px; }\n.ytpc-sk-title { width: 96px; height: 20px; }\n.ytpc-sk-sort { width: 72px; height: 20px; }\n.ytpc-sk-row { display: flex; gap: 12px; margin-bottom: 22px; }\n.ytpc-sk-avatar { flex: 0 0 40px; width: 40px; height: 40px; border-radius: 50%; }\n.ytpc-sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 2px; }\n.ytpc-sk-name { width: 35%; height: 12px; }\n.ytpc-sk-text { width: 92%; height: 14px; }\n.ytpc-sk-short { width: 60%; }\n@media (prefers-reduced-motion: reduce) { .ytpc-sk { animation: none; } }\n\n/* ---- 오른쪽 칸으로 옮긴 추천 탭 ---- */\n#secondary-inner > .ytpc-chips {\n  display: block;\n  width: 100%;\n  min-width: 0;\n  padding: 0 !important;\n  overflow: hidden;\n}\n#secondary-inner > .ytpc-chips > * { margin: 0 !important; max-width: 100% !important; }\n\n/* ---- 라이브 채팅 버블 ---- */\n/* 오른쪽 채팅창: 메시지는 계속 받아야 하므로 끄지 않고 화면 밖으로 치움 */\nhtml.ytpc-hidechat ytd-live-chat-frame#chat {\n  position: fixed !important;\n  left: -10000px !important;\n  top: 0 !important;\n  width: 400px !important;\n  height: 700px !important;\n  min-height: 0 !important;\n  max-height: none !important;\n  opacity: 0 !important;\n  pointer-events: none !important;\n}\n\n#ytpc-bubbles {\n  position: absolute;\n  left: 16px;\n  bottom: 64px;                 /* 재생 컨트롤 위 */\n  z-index: 40;\n  width: min(420px, 42%);\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 6px;\n  pointer-events: none;\n  transition: bottom .2s ease;\n}\n.ytp-autohide #ytpc-bubbles { bottom: 20px; }   /* 컨트롤이 숨으면 아래로 */\n\n.ytpc-bubble {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  max-width: 100%;\n  padding: 6px 12px 6px 6px;\n  border-radius: 18px;\n  background: rgba(15, 15, 15, .62);\n  backdrop-filter: blur(8px);\n  -webkit-backdrop-filter: blur(8px);\n  color: #fff;\n  font: 400 14px/1.4 Roboto, \"Malgun Gothic\", Arial, sans-serif;\n  text-shadow: 0 1px 2px rgba(0, 0, 0, .5);\n  box-shadow: 0 2px 10px rgba(0, 0, 0, .25);\n  animation: ytpc-bubble-in .25s ease-out both;\n  word-break: break-word;\n}\n.ytpc-bubble.ytpc-out { animation: ytpc-bubble-out .4s ease-in both; }\n@keyframes ytpc-bubble-in  { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }\n@keyframes ytpc-bubble-out { to { opacity: 0; transform: translateY(-6px); } }\n\n.ytpc-bubble-avatar { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%; }\n.ytpc-bubble-body { min-width: 0; padding-top: 2px; }\n.ytpc-bubble-name { font-weight: 500; color: rgba(255, 255, 255, .72); margin-right: 6px; }\n.ytpc-bubble-amount { font-weight: 700; margin-right: 6px; }\n.ytpc-emoji { width: 20px; height: 20px; vertical-align: -4px; margin: 0 1px; }\n\n.ytpc-author-owner .ytpc-bubble-name { color: #ffd600; }\n.ytpc-author-moderator .ytpc-bubble-name { color: #5e84f1; }\n.ytpc-author-member .ytpc-bubble-name { color: #2ba640; }\n.ytpc-bubble.ytpc-paid { background: var(--ytpc-paid, #1565c0); }\n.ytpc-bubble.ytpc-paid .ytpc-bubble-name { color: rgba(255, 255, 255, .85); }\n.ytpc-bubble.ytpc-member { background: rgba(15, 157, 88, .85); }\n\n@media (prefers-reduced-motion: reduce) {\n  .ytpc-bubble, .ytpc-bubble.ytpc-out { animation: none; }\n}\n\n/* ---- 라이브 채팅창: 오른쪽 칸 맨 위, 다른 칸과 같은 모서리 ---- */\n#secondary-inner > ytd-live-chat-frame#chat {\n  border-radius: var(--ytpc-radius) !important;\n  overflow: hidden;\n  box-sizing: border-box;\n}\n\n/* 다른 영상으로 이동하는 동안 이전 라이브 채팅이 잠깐 보이지 않게 */\nhtml.ytpc-navigating ytd-live-chat-frame#chat,\nhtml.ytpc-navigating #chat-container { visibility: hidden !important; }\n\n/* ---- 탭형 사이드바 ---- */\n#ytpc-tabs {\n  display: flex;\n  gap: 8px;\n  overflow-x: auto;\n  scrollbar-width: none;\n  box-sizing: border-box;\n}\n#ytpc-tabs[hidden] { display: none !important; }\n#ytpc-tabs::-webkit-scrollbar { display: none; }\n.ytpc-tab {\n  flex: 0 0 auto;\n  height: 32px;\n  padding: 0 12px;\n  border: 0;\n  border-radius: 8px;\n  font: 500 14px/32px Roboto, Arial, sans-serif;\n  cursor: pointer;\n  background: rgba(0, 0, 0, .05);\n  color: #0f0f0f;\n  white-space: nowrap;\n}\n.ytpc-tab:hover { background: rgba(0, 0, 0, .1); }\n.ytpc-tab[aria-selected=\"true\"] { background: #0f0f0f; color: #fff; }\nhtml[dark] .ytpc-tab { background: rgba(255, 255, 255, .1); color: #f1f1f1; }\nhtml[dark] .ytpc-tab:hover { background: rgba(255, 255, 255, .2); }\nhtml[dark] .ytpc-tab[aria-selected=\"true\"] { background: #f1f1f1; color: #0f0f0f; }\n\n/* 숨겨진 채팅 화면: 메시지를 계속 받아야 해서(버블) display:none 대신 화면 밖으로 */\n#secondary-inner > .ytpc-offslot {\n  position: fixed !important;\n  left: -10000px !important;\n  top: 0 !important;\n  width: 400px !important;\n  height: 700px !important;\n  opacity: 0 !important;\n  pointer-events: none !important;\n}\n\n/* 탭 화면들의 모서리를 통일 */\n#secondary-inner > ytd-playlist-panel-renderer#playlist,\n#secondary-inner > #panels > ytd-engagement-panel-section-list-renderer {\n  border-radius: var(--ytpc-radius) !important;\n  overflow: hidden;\n}\n\n/* 탭에 합친 \"실시간 채팅 다시보기\" 카드 */\n#teaser-carousel.ytpc-merged { display: none !important; }\n\n/* 정보 패널: 제목 줄과 안쪽 칩 줄 숨김 (칩은 위 탭으로 올림) */\nytd-engagement-panel-section-list-renderer[ytpc-flat] > #header,\nytd-engagement-panel-section-list-renderer[ytpc-flat] chip-bar-view-model { display: none !important; }\nytd-engagement-panel-section-list-renderer[ytpc-flat] chip-view-model:has(button[aria-label=\"타임라인\"]) { display: none !important; }\n\n/* 댓글이 꺼진 영상 안내 */\n#ytpc-box .ytpc-nocomments-msg {\n  display: none;\n  position: absolute;\n  inset: 0;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  text-align: center;\n  font: 400 14px/1.5 Roboto, \"Malgun Gothic\", Arial, sans-serif;\n  color: #606060;\n}\nhtml[dark] #ytpc-box .ytpc-nocomments-msg { color: #aaa; }\n#ytpc-box.ytpc-nocomments .ytpc-nocomments-msg { display: flex; }\n#ytpc-box.ytpc-nocomments .ytpc-scroll,\n#ytpc-box.ytpc-nocomments .ytpc-skeleton { display: none; }\n\n/* 오른쪽 칸 높이가 바뀔 때 Chrome 스크롤 앵커링이 페이지를 밀지 않게 */\n#secondary, #secondary-inner, #primary-inner, #below { overflow-anchor: none; }\n\n#ytpc-split{margin:0!important;box-sizing:border-box;display:none;flex:0 0 18px;height:18px;order:2;cursor:row-resize;touch-action:none;position:relative;z-index:5;user-select:none}\n#ytpc-split.on{display:block}\n#ytpc-split::before{content:\"\";position:absolute;left:0;right:0;top:-8px;bottom:-8px}#ytpc-split::after{content:\"\";position:absolute;left:50%;top:50%;width:48px;height:6px;margin:-3px 0 0 -24px;border-radius:3px;background:var(--yt-spec-text-secondary,#888);opacity:.45;transition:opacity .15s,background .15s}\n#ytpc-split:hover::after,#ytpc-split.drag::after{opacity:1;background:var(--yt-spec-call-to-action,#3ea6ff)}ytd-engagement-panel-section-list-renderer[ytpc-flat]{margin:0!important;box-sizing:border-box;background:var(--yt-spec-base-background,#0f0f0f)!important;border:1px solid var(--yt-spec-10-percent-layer,rgba(255,255,255,.12));border-radius:var(--ytpc-radius,12px);overflow:hidden}\n#ytpc-box,#secondary-inner>#panels,#secondary-inner>#panels>ytd-engagement-panel-section-list-renderer{min-width:0;max-width:100%}\n#secondary-inner>#panels{overflow:hidden}";

(() => {
  'use strict';

  /*
   * 배치
   *   왼쪽 위  : 영상, 제목, 설명 (YouTube 그대로)
   *   오른쪽 위: 댓글 + 재생목록  → 아래 끝을 왼쪽 설명 끝과 딱 맞춤 (단차 0)
   *              재생목록을 접으면 남는 공간만큼 댓글 칸이 커짐
   *   그 아래  : 추천 영상, 전체 너비 N열 카드
   *
   * YouTube의 댓글/추천 요소를 통째로 옮기므로 정렬·답글·좋아요·댓글 쓰기·
   * 무한 스크롤이 그대로 동작합니다. 끄거나 극장 모드/좁은 화면이 되면 원래 자리로 돌려놓습니다.
   */

  const DEFAULTS = { enabled: true, plRatio: 0.45, splitRatio: 0.5, grid: true, cols: 4, bubbles: true, hideChat: false, yieldPanels: true, tabs: true };
  const GAP = 12;            // 모든 칸 사이 간격 (CSS의 --ytpc-gap 과 같은 값)
  const MIN_COMMENTS = 180;  // 댓글 칸 최소 높이
  const MIN_PLAYLIST = 200;  // 펼친 재생목록 최소 높이

  let settings = { ...DEFAULTS };

  /* ---------- 설정 저장소 (확장: chrome.storage / 유저스크립트: GM_*) ---------- */
  const store = (() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return {
        get(cb) { chrome.storage.sync.get(DEFAULTS, cb); },
        set(o) { try { chrome.storage.sync.set(o); } catch (_) {} },
        watch(cb) {
          chrome.storage.onChanged.addListener((ch, area) => {
            if (area !== 'sync') return;
            const o = {};
            for (const k in ch) o[k] = ch[k].newValue;
            cb(o);
          });
        }
      };
    }
    if (typeof GM_getValue === 'function') {
      return {
        get(cb) { const o = {}; for (const k in DEFAULTS) o[k] = GM_getValue(k, DEFAULTS[k]); cb(o); },
        set(o) { for (const k in o) GM_setValue(k, o[k]); },
        watch(cb) {
          if (typeof GM_addValueChangeListener !== 'function') return;
          for (const k in DEFAULTS) GM_addValueChangeListener(k, (_n, _o, v) => cb({ [k]: v }));
        }
      };
    }
    return { get(cb) { cb({ ...DEFAULTS }); }, set() {}, watch() {} };
  })();

  // 유저스크립트 버전에서는 CSS를 직접 넣음 (확장은 manifest가 넣어줌)
  if (typeof YTPC_CSS === 'string') {
    const st = document.createElement('style');
    st.id = 'ytpc-style';
    st.textContent = YTPC_CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- 인라인 스타일 기록/복구 ---------- */
  const styled = new Map();
  function setStyle(el, prop, value) {
    if (el.style.getPropertyValue(prop) !== value || el.style.getPropertyPriority(prop) !== 'important') {
      el.style.setProperty(prop, value, 'important');
    }
    let set = styled.get(el);
    if (!set) styled.set(el, (set = new Set()));
    set.add(prop);
  }
  function clearStyle(el) {
    const set = el && styled.get(el);
    if (!set) return;
    set.forEach((p) => el.style.removeProperty(p));
    styled.delete(el);
  }
  function clearAllStyles() { [...styled.keys()].forEach(clearStyle); }

  /* ---------- 요소 옮기기 / 되돌리기 ---------- */
  function makeMover() {
    let moved = null, marker = null;
    return {
      get el() { return moved; },
      // el을 into 안으로 옮김. after를 주면 그 요소 바로 뒤에 둠
      put(el, into, after) {
        if (moved && moved !== el) this.back();
        if (el.parentElement === into && (!after || el.previousSibling === after)) return;
        if (moved !== el) {
          marker = document.createComment('ytpc-home');
          el.parentNode.insertBefore(marker, el);
          moved = el;
        }
        if (after) after.after(el); else into.appendChild(el);
      },
      back() {
        if (moved && marker && marker.parentNode) marker.parentNode.insertBefore(moved, marker);
        if (marker) marker.remove();
        moved = null; marker = null;
      }
    };
  }
  const commentsMover = makeMover();
  const relatedMover = makeMover();
  const chipsMover = makeMover();   // 추천 탭(모두 / 관련 콘텐츠 …)

  let box = null, scroller = null, wide = null;

  function buildBox() {
    box = document.createElement('div');
    box.id = 'ytpc-box';
    box.classList.add('ytpc-loading');
    scroller = document.createElement('div');
    scroller.className = 'ytpc-scroll';

    // YouTube 스타일 로딩 화면 (반짝이는 회색 막대)
    const sk = document.createElement('div');
    sk.className = 'ytpc-skeleton';
    const bar = (cls) => { const d = document.createElement('div'); d.className = 'ytpc-sk ' + cls; return d; };
    const head = document.createElement('div');
    head.className = 'ytpc-sk-head';
    head.append(bar('ytpc-sk-title'), bar('ytpc-sk-sort'));
    sk.appendChild(head);
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('div');
      row.className = 'ytpc-sk-row';
      const lines = document.createElement('div');
      lines.className = 'ytpc-sk-lines';
      lines.append(bar('ytpc-sk-name'), bar('ytpc-sk-text'), bar('ytpc-sk-text ytpc-sk-short'));
      row.append(bar('ytpc-sk-avatar'), lines);
      sk.appendChild(row);
    }
    const nc = document.createElement('div');
    nc.className = 'ytpc-nocomments-msg';
    nc.textContent = NO_COMMENTS_TEXT;
    box.append(scroller, sk, nc);
  }

  /* ---------- 로딩 상태 ---------- */
  let navAt = Date.now();        // 마지막 페이지 이동 시각
  const LOADING_MAX = 25000;     // 최대 로딩 표시 시간 (앞광고 중엔 YouTube가 댓글을 늦게 불러옴)
  const NO_COMMENTS_GRACE = 25000; // 댓글 요소가 끝내 안 나오면 상자 제거

  const NO_COMMENTS_TEXT = '이 영상은 댓글이 비활성화 되어있습니다';
  let graceTimer = 0;
  const graceLeft = () => NO_COMMENTS_GRACE - (Date.now() - navAt);
  function waitGrace() {   // 불러오는 시간이 끝나는 순간 다시 판단하도록 한 번 예약
    if (graceTimer || graceLeft() <= 0) return;
    graceTimer = setTimeout(() => { graceTimer = 0; schedule(); }, graceLeft() + 100);
  }
  // 댓글 사용 중지 안내(YouTube 가 ytd-message-renderer 로 표시)만 있고 댓글이 없으면 true
  function commentsOffMsg() {
    if (!scroller || scroller.querySelector('ytd-comment-thread-renderer, ytd-comment-view-model')) return false;
    const m = scroller.querySelector('ytd-message-renderer');
    return !!m && /사용 중지|비활성|turned off|disabled/i.test(m.textContent);
  }
  // 빠른 확인: 영상 정보 패널들은 이미 생겼는데 "댓글 패널"만 없으면 댓글이 꺼진 영상
  // (페이지 이동 직후 이전 영상 패널이 남아 있을 수 있어 2.5초 뒤부터, 1초 이상 같은 상태일 때만 판단. 앞광고 중엔 보류. 틀리면 댓글이 나올 때 자동 정정)
  let pollTimer = 0;
  let offSince = 0;
  function earlyOff(f) {
    // 앞광고 중엔 댓글이 늦게 오므로 판단 보류 (기존 대기 시간 사용)
    const adShowing = !!$('#movie_player.ad-showing');
    const panels = f.querySelectorAll('#panels > ytd-engagement-panel-section-list-renderer');
    const cond = !adShowing && Date.now() - navAt >= 2500 && panels.length > 0 &&
      !f.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]');
    if (!cond) { offSince = 0; return false; }
    if (!offSince) offSince = Date.now();
    return Date.now() - offSince >= 1000;      // 1초 이상 계속 같은 상태일 때만 확정
  }
  function pollSoon(ms) {
    if (!pollTimer) pollTimer = setTimeout(() => { pollTimer = 0; schedule(); }, ms || 500);
  }
  function setNoComments(on) {
    if (!box) return;
    box.classList.toggle('ytpc-nocomments', on);
    if (on) box.classList.remove('ytpc-loading');
  }

  function updateLoading() {
    if (!box) return;
    const since = Date.now() - navAt;
    const hasContent = scroller.querySelector('ytd-comment-thread-renderer, ytd-comment-view-model, ytd-message-renderer');
    // 댓글 0개 영상: 머리글(댓글 0개)만 오고 목록이 없음 → 숫자가 0이면 바로 표시
    const countEl = scroller.querySelector('ytd-comments-header-renderer #count');
    const digits = countEl ? countEl.textContent.replace(/[^0-9]/g, '') : '';
    const headerOnly = digits === '0';
    const ready = since > LOADING_MAX || (since > 350 && (hasContent || headerOnly));
    if (!ready && since <= LOADING_MAX) pollSoon(400);
    box.classList.toggle('ytpc-loading', !ready);
  }

  // 탭 모드가 만든 흔적(숨김 클래스·속성) 정리 — 탭을 끄거나 레이아웃이 풀릴 때
  function cleanupTabsState() {
    prevExpanded = false; prevTab = '';
    if (offSlot) { offSlot.classList.remove('ytpc-offslot'); offSlot = null; }
    document.querySelectorAll('.ytpc-offslot').forEach((e) => e.classList.remove('ytpc-offslot'));
    document.querySelectorAll('[ytpc-flat]').forEach((e) => e.removeAttribute('ytpc-flat'));
    if (splitEl) splitEl.remove();
    document.querySelectorAll('.ytpc-merged').forEach((e) => e.classList.remove('ytpc-merged'));
  }

  function teardown() {
    pinKey = '';
    cleanupTabsState();
    if (tabsEl) tabsEl.remove();
    tabsKey = '';
    chipsMover.back();
    commentsMover.back();
    relatedMover.back();
    if (box) box.remove();
    if (wide) wide.remove();
    clearAllStyles();
  }

  const visible = (el) => !!el && !el.hidden && !el.hasAttribute('hidden') && el.offsetHeight > 0;

  /* ---------- 높이 맞추기 ---------- */
  // 오른쪽 칸: [댓글] [기타 패널] [재생목록] [광고 등] 을 차례로 쌓고,
  // 맨 아래가 왼쪽 설명 끝과 정확히 같도록 댓글 높이를 계산한다.
  function fit(f, inner) {
    const pi = $('#primary-inner', f);
    if (!pi || !box.isConnected) return;

    const pl = [...inner.children].find((c) => c.matches('ytd-playlist-panel-renderer#playlist'));
    const stack = [...inner.children].filter((c) =>
      c === box || (visible(c) && !(c.id === 'related' && !settings.grid)));
    const last = stack[stack.length - 1];

    // 칸 사이 간격: 마지막 것을 빼고 모두 아래 GAP
    let rest = 0;
    for (const c of stack) {
      if (c === box) continue;
      const mb = c === last ? 0 : GAP;
      setStyle(c, 'margin-top', '0px');
      setStyle(c, 'margin-bottom', mb + 'px');
      if (c !== pl) rest += c.offsetHeight + mb;
    }
    // 댓글 칸 아래 간격: 맨 마지막이면 0, 아니면 GAP
    const boxGap = box === last ? 0 : GAP;
    box.style.marginBottom = boxGap + 'px';

    // 댓글 칸 위쪽 ~ 왼쪽 설명 아래쪽
    const avail = Math.round(pi.getBoundingClientRect().bottom - box.getBoundingClientRect().top);

    let plTotal = 0;
    if (pl && stack.includes(pl)) {
      const plGap = pl === last ? 0 : GAP;
      if (pl.hasAttribute('collapsed')) {
        // 접힘: 재생목록은 한 줄만, 남는 공간은 전부 댓글
        ['height', 'max-height', 'min-height', '--ytd-watch-flexy-panel-max-height'].forEach((p) => pl.style.removeProperty(p));
        const c = $('#container', pl);
        if (c) clearStyle(c);
        plTotal = pl.offsetHeight + plGap;
      } else {
        const ratio = Math.min(0.8, Math.max(0.2, Number(settings.plRatio) || DEFAULTS.plRatio));
        const h = Math.max(MIN_PLAYLIST, Math.round((avail - boxGap - rest - plGap) * ratio));
        const px = h + 'px';
        setStyle(pl, '--ytd-watch-flexy-panel-max-height', px);
        setStyle(pl, 'height', px);
        setStyle(pl, 'max-height', px);
        setStyle(pl, 'min-height', '0px');
        const c = $('#container', pl);
        if (c) {
          setStyle(c, 'height', px);
          setStyle(c, 'max-height', px);
          setStyle(c, 'box-sizing', 'border-box');
        }
        plTotal = h + plGap;
      }
    }

    const boxH = Math.max(MIN_COMMENTS, avail - boxGap - rest - plTotal);
    box.style.setProperty('--ytpc-h', boxH + 'px');

    alignWide(f, inner, pi);
  }

  // 라이브: 채팅창 + 추천 탭 + 기타를 같은 간격으로 쌓고, 채팅창 높이로 맨 아래를 설명란 끝에 맞춤
  function fitLive(f, inner, chat, slot) {
    const pi = $('#primary-inner', f);
    if (!pi) return;
    clearAllStyles();
    // 추천 영상을 아래로 옮긴 뒤 남은 빈 #related 는 큰 높이를 차지하므로 접어서 계산에서 뺀다
    const rel = $('#related', inner);
    if (rel && settings.grid && !rel.querySelector('ytd-watch-next-secondary-results-renderer')) {
      setStyle(rel, 'display', 'none');
    }
    const stack = [...inner.children].filter((c) =>
      c === slot || (visible(c) && c.id !== 'related' && c.id !== 'panels'));
    const last = stack[stack.length - 1];
    let rest = 0;
    for (const c of stack) {
      setStyle(c, 'margin-top', '0px');
      setStyle(c, 'margin-bottom', (c === last ? 0 : GAP) + 'px');
      if (c !== slot) rest += c.offsetHeight + (c === last ? 0 : GAP);
    }
    // 접힌 채팅(한 줄)은 높이를 건드리지 않음
    if (!chat.hasAttribute('collapsed')) {
      const avail = Math.round(pi.getBoundingClientRect().bottom - slot.getBoundingClientRect().top);
      const h = Math.max(MIN_COMMENTS, avail - rest - (slot === last ? 0 : GAP)) + 'px';
      for (const el of slot === chat ? [chat] : [slot, chat]) {
        setStyle(el, 'height', h);
        setStyle(el, 'max-height', h);
        setStyle(el, 'min-height', '0px');
        setStyle(el, '--ytd-watch-flexy-chat-max-height', h);
      }
    }
    alignWide(f, inner, pi);
  }


  /* ---------- 탭형 사이드바: 댓글 · 채팅 · 스크립트/챕터 · 재생목록 ---------- */
  const TAB_LABEL = { comments: '댓글', chat: '실시간 채팅', info: '챕터·스크립트', playlist: '재생목록' };
  const TAB_ORDER = ['comments', 'chat', 'info', 'playlist'];
  const PANEL_RE = /transcript|chapters|structured-description|macro-markers/;
  let tabsEl = null, tabsKey = '', activeTab = '', userPicked = false;
  let panelBusyUntil = 0, offSlot = null, prevExpanded = false, prevTab = '', lastReopen = 0, refreshRun = null, lastEnsure = 0;

  const infoPanels = (inner) => [...inner.querySelectorAll('#panels > ytd-engagement-panel-section-list-renderer')]
    .filter((p) => PANEL_RE.test(p.getAttribute('target-id') || '') || !p.getAttribute('target-id'));  // id 없는 "동영상 정보" 패널(타임라인·챕터·스크립트 칩) 포함
  const expandedPanel = (inner) => infoPanels(inner)
    .find((p) => (p.getAttribute('visibility') || '').endsWith('EXPANDED'));
  // "동영상 정보" 패널 안쪽 칩 탭(타임라인·챕터·스크립트): 바깥 탭 줄로 펼쳐서 한 줄로 합침
  const subTabs = (p) => p ? [...p.querySelectorAll('chip-bar-view-model [role="tab"]')] : [];
  const subLabel = (b) => (b.getAttribute('aria-label') || b.textContent || '').trim();
  const chapPanelOf = (inner) => infoPanels(inner).find((p) => /chapters|macro-markers/.test(p.getAttribute('target-id') || '') && p.querySelector('ytd-macro-markers-list-item-renderer'));
  let infoTries = 0, chipTries = 0;
  const isInfo = (k) => k === 'info' || k.startsWith('info:');
  const tabLabel = (k) => k.startsWith('info:') ? k.slice(5) : TAB_LABEL[k];
  const vidId = () => new URLSearchParams(location.search).get('v') || '';
  let subCache = { vid: '', labels: [] }, lastSubClick = 0, pendingChip = null;
  const transcriptButton = (f) =>
    $('ytd-video-description-transcript-section-renderer button', f) ||
    [...f.querySelectorAll('button')].find((b) => /^(스크립트 표시|show transcript)$/i.test((b.getAttribute('aria-label') || '').trim()));

  // 대신 눌러 줄 때 YouTube 가 페이지를 살짝 아래로 스크롤(포커스 이동 등)하는 것을 막음.
  // 누른 뒤 눌리기 전 위치를 1.5초간 "잠가서" 스크롤 이벤트가 나는 즉시(화면에 그려지기 전) 되돌림 → 내려갔다 올라오는 깜빡임 없음.
  // 사용자가 직접 휠/터치/키/마우스를 쓰면 바로 잠금 해제.
  let scrollLock = null;
  const scrollEl = () => document.scrollingElement || document.documentElement;
  window.addEventListener('scroll', () => {
    if (!scrollLock) return;
    if (Date.now() > scrollLock.until) { scrollLock = null; return; }
    const se = scrollEl();
    if (Math.abs(se.scrollTop - scrollLock.y) > 1 || Math.abs(se.scrollLeft - scrollLock.x) > 1) {
      se.scrollTo({ left: scrollLock.x, top: scrollLock.y, behavior: 'instant' });
    }
  }, { passive: true, capture: true });
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) =>
    window.addEventListener(ev, () => { scrollLock = null; }, { passive: true, capture: true }));
  // 잠금 시작/연장 (이미 잠겨 있으면 처음 저장한 위치를 유지)
  function holdScroll(ms) {
    const now = Date.now();
    if (!scrollLock || now > scrollLock.until) {
      const se = scrollEl();
      scrollLock = { x: se.scrollLeft, y: se.scrollTop, until: 0 };
    }
    scrollLock.until = Math.max(scrollLock.until, now + ms);
  }
  function clickKeep(b) {
    holdScroll(1500);
    b.click();
  }
  // 챕터 패널 여는 버튼: 플레이어 아래쪽 챕터 제목 / "챕터 보기" 류
  const chapterButton = (f) =>
    $('.ytp-chapter-container button', f) || $('button.ytp-chapter-title', f) || $('.ytp-chapter-title', f) ||
    [...f.querySelectorAll('button')].find((b) => /^(챕터 보기|모든 챕터 보기|view chapters|show chapters)$/i.test((b.getAttribute('aria-label') || '').trim()));
  // 원하는 탭(챕터/스크립트)에 맞는 버튼으로 열기. 챕터 탭인데 스크립트 패널이 열리던 문제 방지
  function openInfo(f, inner, key) {
    if (expandedPanel(inner) || Date.now() < panelBusyUntil) return;
    // 영상마다 패널 구조가 다름:
    //  - 통합형(PAmodern_transcript_view 있음): 스크립트 버튼으로 "동영상 정보" 패널을 열고 안쪽 챕터 칩을 선택
    //  - 분리형(챕터 패널 / 스크립트 패널이 따로): 챕터는 챕터 버튼, 스크립트는 스크립트 버튼으로 각각 열어야 함
    const modern = !!inner.querySelector('#panels > [target-id="PAmodern_transcript_view"]');
    let b;
    if (key === 'info:챕터') b = modern ? (transcriptButton(f) || chapterButton(f)) : (chapterButton(f) || transcriptButton(f));
    else b = transcriptButton(f) || chapterButton(f);
    if (b) { panelBusyUntil = Date.now() + 2000; clickKeep(b); }
  }
  // 화면 밖에 있던 채팅 iframe 은 목록이 비어 보일 수 있어, 탭으로 돌아오면 크기 갱신 + 맨 아래로 스크롤
  // force=false: 접힘 해제/빈 목록일 때만 손댐 (읽는 중인 채팅 스크롤을 건드리지 않음)
  function chatTick(force) {
    const frame = $('ytd-live-chat-frame#chat');
    if (!frame) return;
    // 다시보기 채팅은 아래 카드의 "패널 열기" 를 눌러야 열린다 → 대신 눌러 줌 (카드는 숨김)
    if (frame.hasAttribute('collapsed') && Date.now() - lastReopen > 1500) {
      lastReopen = Date.now();
      const card = $('#teaser-carousel button', $('ytd-watch-flexy') || document);
      const btn = card || $('#show-hide-button button, #show-hide-button', frame);
      if (btn) clickKeep(btn);
    }
    let w = null, d = null;
    try { const ifr = $('iframe', frame); w = ifr && ifr.contentWindow; d = ifr && ifr.contentDocument; } catch (_) {}
    if (!w || !d) return;
    try {
      const items = d.querySelector('yt-live-chat-item-list-renderer #items');
      if (!force && items && items.children.length) return;
      w.dispatchEvent(new Event('resize'));
      const sc = d.querySelector('#item-scroller');
      if (sc) sc.scrollTop = sc.scrollHeight;
      const more = d.querySelector('#show-more');
      if (more && more.offsetParent !== null) more.click();
    } catch (_) {}
  }
  function refreshChat() {
    [60, 250, 700].forEach((t) => setTimeout(() => chatTick(true), t));
    [1500, 3000].forEach((t) => setTimeout(() => chatTick(false), t));
    refreshRun = () => chatTick(false);
  }
  function pickTab(key) {
    if (key === activeTab) return;
    const f = $('ytd-watch-flexy'), inner = f && $('#secondary-inner', f);
    // 스크립트·챕터 패널은 닫지 않고 숨기기만 한다 (닫았다 열면 매번 다시 불러오므로)
    activeTab = key;
    userPicked = true;
    if (isInfo(key)) holdScroll(3500);   // 패널이 열려 로딩되는 동안(몇 초) 페이지가 밀리지 않게
    pendingChip = null; infoTries = 0; chipTries = 0;
    if (isInfo(key) && inner) openInfo(f, inner, key);
    schedule();
  }

  function buildTabs(keys) {
    if (!tabsEl) {
      tabsEl = document.createElement('div');
      tabsEl.id = 'ytpc-tabs';
      tabsEl.setAttribute('role', 'tablist');
    }
    tabsEl.replaceChildren();
    for (const k of keys) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ytpc-tab';
      b.dataset.tab = k;
      b.setAttribute('role', 'tab');
      b.textContent = tabLabel(k);
      b.addEventListener('click', () => pickTab(k));
      tabsEl.appendChild(b);
    }
  }

  // 반환값: true = 탭 레이아웃이 처리함
  function applyTabs(f, inner) {
    const pi = $('#primary-inner', f);
    if (!pi) return false;

    const chat = $('ytd-live-chat-frame#chat', f);
    const hasChat = !!chat && !settings.hideChat && !chat.hidden && !chat.hasAttribute('hidden');
    let slot = null;
    if (hasChat) {
      slot = chat;
      while (slot.parentElement && slot.parentElement !== inner) slot = slot.parentElement;
      if (slot.parentElement !== inner) slot = chat;
    }
    const pl = [...inner.children].find((c) => c.matches('ytd-playlist-panel-renderer#playlist'));
    const hasPl = !!pl && !pl.hidden && !pl.hasAttribute('hidden') && !!pl.querySelector('ytd-playlist-panel-video-renderer');
    const panelsEl = [...inner.children].find((c) => c.id === 'panels') || null;
    const expanded = expandedPanel(inner);
    const hasInfo = !!panelsEl && (!!expanded || !!transcriptButton(f) || !!chapPanelOf(inner));

    const all = [...f.querySelectorAll('ytd-comments#comments')];
    const comments = all.find((c) => !scroller || !scroller.contains(c)) || all[0];
    const commentsOk = !!comments && !comments.hidden && !comments.hasAttribute('hidden');
    const hasComments = true;   // 댓글이 없어도 탭은 유지하고 안내 문구를 보여줌

    // "실시간 채팅 다시보기" 카드는 탭에 합쳤으므로 숨김
    const tz = $('#teaser-carousel', f);
    if (tz && /채팅 다시보기|chat replay/i.test(tz.textContent.slice(0, 80))) tz.classList.toggle('ytpc-merged', hasChat);

    const avail = { comments: hasComments, chat: hasChat, info: hasInfo, playlist: hasPl };
    const subs = subTabs(expanded);
    if (subs.length) subCache = { vid: vidId(), labels: subs.map(subLabel) };
    const labels = subCache.vid === vidId() ? subCache.labels : [];
    // 위 탭은 처음부터 챕터 / 스크립트로 나눠 보여줌 (누른 뒤에 갈라지지 않음). 타임라인은 스크립트와 내용이 같아 뺌.
    // 충돌 방지: 칩은 사용자가 탭을 눌렀을 때만 눌러 맞추고(성공하면 멈춤), 이후엔 YouTube 쪽 선택을 따라감
    const chips = labels.length > 1;           // 안쪽 칩 줄이 있는 패널
    const hasChap = labels.includes('챕터') ||
      infoPanels(inner).some((p) => /chapters|macro-markers/.test(p.getAttribute('target-id') || ''));
    const hasScr = labels.includes('스크립트') || !!transcriptButton(f);
    const infoKeys = ['info'];
    const split = false;
    const keys = TAB_ORDER.filter((k) => avail[k])
      .flatMap((k) => (k === 'info' ? infoKeys : [k]));
    for (const ip of infoPanels(inner)) ip.toggleAttribute('ytpc-flat', true);
    if (!keys.length) { teardown(); return true; }

    const justOpened = !!expanded && !prevExpanded;     // 패널이 막 열림 (설명란 버튼 등 YouTube 쪽에서 연 경우 포함)
    const justClosed = !expanded && prevExpanded;       // 패널 자체의 X 로 닫음
    prevExpanded = !!expanded;
    const selChip = subs.find((b) => b.getAttribute('aria-selected') === 'true');
    const chipNorm = (() => { const c = selChip ? subLabel(selChip) : ''; return c === '타임라인' ? '스크립트' : c; })();
    const chipKey = infoKeys.includes('info:' + chipNorm) ? 'info:' + chipNorm : infoKeys[infoKeys.length - 1];
    if (activeTab === 'info' && split) activeTab = chipKey;
    else if (activeTab.startsWith('info:') && !split) activeTab = 'info';
    let reset = !userPicked || !keys.includes(activeTab);
    if (justOpened && !isInfo(activeTab)) {
      activeTab = split ? chipKey : 'info';
      userPicked = true; reset = false;
    } else if (justClosed && isInfo(activeTab)) reset = true;
    if (reset) {
      userPicked = false;
      activeTab = hasChat ? 'chat' : (hasPl ? 'playlist' : (keys.includes('comments') ? 'comments' : keys[0]));
      // 이미 열려 있는 패널이 있으면 (예: 다른 탭을 보는 중) 자동으로 끌려가지 않는다
    }

    clearAllStyles();
    if (activeTab === 'chat' && prevTab !== 'chat') refreshChat();
    else if (activeTab === 'chat' && refreshRun && Date.now() - lastEnsure > 2000) { lastEnsure = Date.now(); refreshRun(); }
    prevTab = activeTab;

    // 탭 바
    const key = keys.join(',');
    if (!tabsEl || key !== tabsKey) { buildTabs(keys); tabsKey = key; }
    tabsEl.hidden = keys.length < 2;
    if (inner.firstElementChild !== tabsEl) inner.prepend(tabsEl);
    for (const b of tabsEl.children) b.setAttribute('aria-selected', String(b.dataset.tab === activeTab));

    // 댓글 상자
    if (hasComments) {
      if (!box) buildBox();
      if (box.previousElementSibling !== tabsEl) tabsEl.after(box);
      if (commentsOk) { commentsMover.put(comments, scroller); updateLoading(); setNoComments(commentsOffMsg()); }
      else if (graceLeft() > 0) {
        if (earlyOff(f)) { commentsMover.back(); setNoComments(true); }
        else { setNoComments(false); box.classList.add('ytpc-loading'); waitGrace(); pollSoon(); }
      }
      else { commentsMover.back(); setNoComments(true); }
    } else {
      commentsMover.back();
      if (box) box.remove();
    }

    // 보이는/숨길 화면
    if (box) box.style.display = activeTab === 'comments' ? '' : 'none';
    if (slot) {
      const off = activeTab !== 'chat';
      slot.classList.toggle('ytpc-offslot', off);
      offSlot = slot;
    } else if (offSlot) { offSlot.classList.remove('ytpc-offslot'); offSlot = null; }
    if (pl && hasPl && activeTab !== 'playlist') setStyle(pl, 'display', 'none');
    if (panelsEl && !isInfo(activeTab)) setStyle(panelsEl, 'display', 'none');

    if (pendingChip || justOpened) holdScroll(1500);
    // 챕터(위) + 스크립트(아래) 한 화면: 스크립트 패널을 열어 두고, 챕터 패널은 숨김 상태 그대로 강제로 보여줌
    if (isInfo(activeTab)) {
      const chapP = chapPanelOf(inner);
      const scrP = infoPanels(inner).find((p) => p !== chapP && (p.getAttribute('visibility') || '').endsWith('EXPANDED'));
      if (!scrP) {
        const tb = transcriptButton(f);
        if (tb && infoTries < 5 && Date.now() - lastSubClick > 1500 && Date.now() >= panelBusyUntil) {
          lastSubClick = Date.now(); infoTries++; panelBusyUntil = Date.now() + 1500; clickKeep(tb);
        }
        if (tb && infoTries < 5) pollSoon(500);
      } else {
        infoTries = 0;
        const ss = subTabs(scrP);
        const sel = ss.find((b) => b.getAttribute('aria-selected') === 'true');
        if (sel && chipTries < 4 && Date.now() - lastSubClick > 800) {
          const want = ss.find((b) => /^(스크립트|transcript)$/i.test(subLabel(b))) || ss.find((b) => /^(타임라인|timeline)$/i.test(subLabel(b)));
          if (want && want !== sel && /챕터|chapter/i.test(subLabel(sel))) { lastSubClick = Date.now(); chipTries++; clickKeep(want); setTimeout(schedule, 300); }
        }
      }
    }

    const view = { comments: box, chat: slot, info: panelsEl, playlist: hasPl ? pl : null }[isInfo(activeTab) ? 'info' : activeTab];
    if (!view) return true;

    // 추천 탭(모두 / 관련 콘텐츠 …)은 현재 화면 바로 아래
    const listNow = relatedMover.el;
    const hdr = (listNow && listNow.querySelector('ytd-item-section-renderer > #header')) || chipsMover.el;
    if (settings.grid && hdr) {
      chipsMover.put(hdr, inner, view);
      hdr.classList.add('ytpc-chips');
    } else {
      chipsMover.back();
    }

    // 높이: 오른쪽 맨 아래를 왼쪽 설명란 끝에 맞춤
    const rel = $('#related', inner);
    if (rel && settings.grid && !rel.querySelector('ytd-watch-next-secondary-results-renderer')) setStyle(rel, 'display', 'none');
    const inactive = [box, slot, pl, panelsEl];
    const uniq = [...inner.children].filter((c) => c === view ||
      (c === tabsEl ? !tabsEl.hidden : (!inactive.includes(c) && visible(c) && c.id !== 'related')));
    const last = uniq[uniq.length - 1];
    let others = 0;
    for (const c of uniq) {
      setStyle(c, 'margin-top', '0px');
      setStyle(c, 'margin-bottom', (c === last ? 0 : GAP) + 'px');
      if (c !== view) others += c.offsetHeight;
    }
    const top = (tabsEl.hidden ? view : tabsEl).getBoundingClientRect().top;
    const h = Math.max(MIN_COMMENTS, Math.round(pi.getBoundingClientRect().bottom - top - others - (uniq.length - 1) * GAP));
    const px = h + 'px';

    if (activeTab === 'comments') {
      box.style.setProperty('--ytpc-h', px);
    } else if (activeTab === 'chat') {
      if (!chat.hasAttribute('collapsed')) {
        for (const el of slot === chat ? [chat] : [slot, chat]) {
          setStyle(el, 'height', px); setStyle(el, 'max-height', px);
          setStyle(el, 'min-height', '0px'); setStyle(el, '--ytd-watch-flexy-chat-max-height', px);
        }
      }
    } else if (activeTab === 'playlist') {
      if (pl.hasAttribute('collapsed')) { try { pl.collapsed = false; } catch (_) {} pl.removeAttribute('collapsed'); }
      setStyle(pl, '--ytd-watch-flexy-panel-max-height', px);
      setStyle(pl, 'height', px); setStyle(pl, 'max-height', px); setStyle(pl, 'min-height', '0px');
      const c = $('#container', pl);
      if (c) { setStyle(c, 'height', px); setStyle(c, 'max-height', px); setStyle(c, 'box-sizing', 'border-box'); }
    } else if (isInfo(activeTab)) {
      layoutInfo(inner, panelsEl, h);
    }
    alignWide(f, inner, pi);
    return true;
  }

  /* 챕터(위)·스크립트(아래) 분할: 기본 반반, 가운데 막대를 끌어 크기 조절 (비율은 저장) */
  const SPLIT_H = 18;
  let splitEl = null, splitDrag = null;
  function splitter(panelsEl) {
    if (!splitEl) {
      splitEl = document.createElement('div');
      splitEl.id = 'ytpc-split';
      splitEl.title = '끌어서 챕터/스크립트 크기 조절 (더블클릭: 반반)';
      splitEl.addEventListener('pointerdown', (e) => {
        splitDrag = { id: e.pointerId }; splitEl.classList.add('drag');
        try { splitEl.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
      });
      splitEl.addEventListener('pointermove', (e) => {
        if (!splitDrag) return;
        const pr = splitEl.parentElement.getBoundingClientRect();
        const r = (e.clientY - pr.top - SPLIT_H / 2) / Math.max(1, pr.height - SPLIT_H);
        settings.splitRatio = Math.min(0.85, Math.max(0.15, r));
        schedule();
      });
      const end = () => { if (!splitDrag) return; splitDrag = null; splitEl.classList.remove('drag'); store.set({ splitRatio: settings.splitRatio }); };
      splitEl.addEventListener('pointerup', end);
      splitEl.addEventListener('pointercancel', end);
      splitEl.addEventListener('dblclick', () => { settings.splitRatio = 0.5; store.set({ splitRatio: 0.5 }); schedule(); });
    }
    if (splitEl.parentElement !== panelsEl) panelsEl.appendChild(splitEl);
    return splitEl;
  }
  function layoutInfo(inner, panelsEl, h) {
    const chapP = chapPanelOf(inner);
    const botP = infoPanels(inner).find((p) => p !== chapP && (p.getAttribute('visibility') || '').endsWith('EXPANDED'));
    const both = !!chapP && !!botP;
    const sp = splitter(panelsEl);
    sp.classList.toggle('on', both);
    const r = Math.min(0.85, Math.max(0.15, Number(settings.splitRatio) || 0.5));
    const topH = both ? Math.round((h - SPLIT_H) * r) : h;
    const botH = both ? h - SPLIT_H - topH : h;
    setStyle(panelsEl, 'display', 'flex'); setStyle(panelsEl, 'flex-direction', 'column');
    setStyle(panelsEl, 'height', h + 'px'); setStyle(panelsEl, 'max-height', h + 'px');
    const put = (p, H, order) => {
      setStyle(p, 'display', 'flex'); setStyle(p, 'order', String(order)); setStyle(p, 'margin', '0px'); setStyle(p, 'box-sizing', 'border-box');
      setStyle(p, 'height', H + 'px'); setStyle(p, 'max-height', H + 'px'); setStyle(p, 'min-height', '0px');
      setStyle(p, 'flex', '0 0 ' + H + 'px'); setStyle(p, '--ytd-watch-flexy-panel-max-height', H + 'px');
    };
    // 스크립트 검색칸이 위에 달라붙어 글자가 비쳐 보이는 문제: 검색 입력 상위 요소를 불투명하게
    if (botP) {
      let e = botP.querySelector('input');
      for (let i = 0; i < 6 && e && e !== botP; i++, e = e.parentElement) setStyle(e, 'background-color', 'var(--yt-spec-base-background, #0f0f0f)');
    }
    if (chapP) put(chapP, topH, 1);
    if (botP) put(botP, botH, 3);
  }

  // 탭을 바꿀 때마다 오른쪽 칸 폭이 내용(댓글/챕터 목록 등)에 따라 달라져 전체 가로 비율이 흔들리는 문제:
  // 처음 안정된 폭을 재서 고정(창 크기·영상·극장/전체화면이 바뀌면 다시 잼)
  let pinW = 0, pinKey = '', pinCand = 0;
  // 오른쪽 칸 폭은 창 너비에 대한 고정 비율(24%, 400~540px)로 정함 → 내용이 길어도 흔들리지 않고, 채널명 한 줄은 항상 나옴
  function pinSidebar(f) {
    const sec = $('#secondary', f), prim = $('#primary', f);
    if (!sec || !prim) return;
    if (sec.getBoundingClientRect().top - prim.getBoundingClientRect().top > 50) return;   // 한 줄 배치(좁은 창·극장)에서는 손대지 않음
    const w = Math.round(Math.min(540, Math.max(400, innerWidth * 0.24)));
    const px = w + 'px';
    setStyle(sec, 'width', px); setStyle(sec, 'min-width', px); setStyle(sec, 'max-width', px);
    setStyle(sec, 'flex', '0 0 ' + px);
  }

  // 위 두 열의 실제 내용 끝 바로 아래에서 추천 영상이 시작하도록 (YouTube 기본 하단 여백 상쇄)
  function alignWide(f, inner, pi) {
    if (!wide || !wide.isConnected) return;
    const columns = $('#columns', f);
    wide.style.marginTop = '0px';
    const contentBottom = Math.max(pi.getBoundingClientRect().bottom, inner.getBoundingClientRect().bottom);
    const extra = Math.round(columns.getBoundingClientRect().bottom - contentBottom);
    wide.style.marginTop = extra > 0 ? -extra + 'px' : '0px';
  }

  /* ---------- 라이브 채팅 → 영상 위 버블 ---------- */
  // 오른쪽 채팅창은 화면 밖으로 숨기되 계속 살려 둬서(그래야 새 메시지가 옴)
  // 채팅 iframe 안의 새 메시지를 감지해 영상 위에 말풍선으로 띄운다.
  const BUBBLE_MAX = 6;          // 동시에 보이는 버블 수
  const BUBBLE_LIFE = 8000;      // 버블 유지 시간(ms)
  let layer = null, chatItems = null, chatMO = null, expandTried = false;

  function detachChat() {
    if (chatMO) chatMO.disconnect();
    chatMO = null; chatItems = null;
  }

  // ---- 다른 영상(라이브)으로 이동할 때: 이전 채팅이 잠깐 보이거나 새 채팅을 못 잡는 문제 방지 ----
  // 같은 채팅 iframe 이 재사용되므로, 이동 전 iframe 주소를 기억해 두었다가
  // 주소가 바뀌고 로딩이 끝나면 "새 채팅 준비됨"으로 본다. 그 전까지는 채팅창을 숨기고 버블도 잡지 않는다.
  let navOldHref = null, navHideTimer = 0, retryTimer = 0;
  const NAV_HIDE_MAX = 8000;     // 새 채팅을 끝내 못 잡아도 이 시간 뒤엔 숨김 해제

  const chatHref = (frame) => {
    try {
      const w = $('iframe', frame) && $('iframe', frame).contentWindow;
      return w ? String(w.location.href) : '';
    } catch (_) { return ''; }
  };
  function chatReady(frame) {
    if (navOldHref === null) return true;                  // 이동 중이 아님
    const h = chatHref(frame);
    if (!h || h === 'about:blank' || h === navOldHref) return false;
    try { return $('iframe', frame).contentDocument.readyState !== 'loading'; } catch (_) { return false; }
  }
  function clearBubbles() { if (layer) layer.replaceChildren(); }
  function startNavHide() {
    const frame = $('ytd-live-chat-frame#chat');
    detachChat();
    clearBubbles();
    if (!frame) { navOldHref = null; return; }
    navOldHref = chatHref(frame) || '';
    document.documentElement.classList.add('ytpc-navigating');
    clearTimeout(navHideTimer);
    navHideTimer = setTimeout(endNavHide, NAV_HIDE_MAX);
  }
  function endNavHide() {
    clearTimeout(navHideTimer);
    navOldHref = null;
    document.documentElement.classList.remove('ytpc-navigating');
    schedule();
  }

  function applyBubbles() {
    const frame = $('ytd-live-chat-frame#chat');
    document.documentElement.classList.toggle('ytpc-hidechat',
      !!frame && !!settings.enabled && !!settings.hideChat && location.pathname === '/watch');

    // 새 영상의 채팅이 준비되면 숨김 해제 (채팅이 없는 영상이면 프레임이 사라지므로 바로 해제)
    if (navOldHref !== null && (!frame || chatReady(frame))) endNavHide();

    const on = settings.enabled && settings.bubbles && location.pathname === '/watch' && frame;
    if (!on) { detachChat(); if (layer) { layer.remove(); layer = null; } return; }

    // 사용자가 채팅을 접어 둔 상태면 메시지가 안 오므로 한 번 펼침
    if (frame.hasAttribute('collapsed') && !expandTried) {
      expandTried = true;
      const btn = $('#show-hide-button button, #show-hide-button', frame);
      if (btn) clickKeep(btn);
    }

    const player = $('#movie_player');
    if (player) {
      if (!layer) { layer = document.createElement('div'); layer.id = 'ytpc-bubbles'; }
      if (layer.parentElement !== player) player.appendChild(layer);
    }

    if (!chatReady(frame)) { detachChat(); return; }       // 아직 이전 채팅이거나 로딩 중

    let items = null;
    try {
      const doc = $('iframe', frame) && $('iframe', frame).contentDocument;
      items = doc && doc.querySelector('yt-live-chat-item-list-renderer #items');
    } catch (_) {}
    if (items && !items.isConnected) items = null;
    if (items !== chatItems) {
      detachChat();
      if (items) {
        chatItems = items;
        chatMO = new MutationObserver((muts) => {
          for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) addBubble(n);
        });
        chatMO.observe(items, { childList: true });   // 이미 있던 메시지는 띄우지 않고 새 메시지만
      }
    }
    // 메시지 목록이 아직 없으면(채팅 iframe 로딩 중) 짧게 다시 확인
    if (!chatItems && !retryTimer) {
      retryTimer = setTimeout(() => { retryTimer = 0; schedule(); }, 400);
    }
  }

  const BUBBLE_TAGS = {
    'yt-live-chat-text-message-renderer': 'text',
    'yt-live-chat-paid-message-renderer': 'paid',
    'yt-live-chat-paid-sticker-renderer': 'paid',
    'yt-live-chat-membership-item-renderer': 'member'
  };

  function addBubble(node) {
    const kind = BUBBLE_TAGS[node.tagName.toLowerCase()];
    if (!kind || !layer || document.hidden) return;

    const name = (node.querySelector('#author-name') || {}).textContent || '';
    const photo = (node.querySelector('#author-photo img') || {}).src || '';
    const msg = node.querySelector('#message, #header-subtext');
    const amount = (node.querySelector('#purchase-amount, #purchase-amount-chip') || {}).textContent || '';

    const b = document.createElement('div');
    b.className = 'ytpc-bubble ytpc-' + kind;
    const type = node.getAttribute('author-type');
    if (type) b.classList.add('ytpc-author-' + type);   // owner / moderator / member
    if (kind === 'paid') {
      const c = node.style.getPropertyValue('--yt-live-chat-paid-message-primary-color') ||
                node.style.getPropertyValue('--yt-live-chat-paid-sticker-background-color');
      if (c) b.style.setProperty('--ytpc-paid', c.trim());
    }

    if (photo) {
      const img = document.createElement('img');
      img.className = 'ytpc-bubble-avatar';
      img.src = photo;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      b.appendChild(img);
    }
    const body = document.createElement('div');
    body.className = 'ytpc-bubble-body';
    const nm = document.createElement('span');
    nm.className = 'ytpc-bubble-name';
    nm.textContent = name.trim();
    body.appendChild(nm);
    if (amount.trim()) {
      const am = document.createElement('span');
      am.className = 'ytpc-bubble-amount';
      am.textContent = amount.trim();
      body.appendChild(am);
    }
    const tx = document.createElement('span');
    tx.className = 'ytpc-bubble-text';
    if (msg) {
      // 글자와 이모지 이미지만 옮겨 담음 (innerHTML 사용 안 함)
      msg.childNodes.forEach((c) => {
        if (c.nodeType === 3) tx.appendChild(document.createTextNode(c.textContent));
        else if (c.tagName === 'IMG') {
          const e = document.createElement('img');
          e.className = 'ytpc-emoji';
          e.src = c.src; e.alt = c.alt || '';
          tx.appendChild(e);
        } else tx.appendChild(document.createTextNode(c.textContent));
      });
    }
    if (!tx.childNodes.length && !amount.trim() && kind === 'text') return;
    body.appendChild(tx);
    b.appendChild(body);

    layer.appendChild(b);
    while (layer.children.length > BUBBLE_MAX) layer.firstElementChild.remove();
    setTimeout(() => {
      b.classList.add('ytpc-out');
      setTimeout(() => b.remove(), 400);
    }, BUBBLE_LIFE);
  }

  /* ---------- 메인 ---------- */
  function apply() {
    applyBubbles();
    const f = $('ytd-watch-flexy');
    const inner = f && $('#secondary-inner', f);
    const ok = settings.enabled && location.pathname === '/watch' && f && inner &&
               f.hasAttribute('is-two-columns_') && !f.hasAttribute('theater') && !f.hasAttribute('fullscreen');
    if (!ok) { teardown(); return; }

    // 추천 영상 → 영상 아래 전체 너비
    const columns = $('#columns', f);
    const list = wide && relatedMover.el && wide.contains(relatedMover.el)
      ? [...f.querySelectorAll('ytd-watch-next-secondary-results-renderer')].find((x) => !wide.contains(x)) || relatedMover.el
      : $('#related ytd-watch-next-secondary-results-renderer', f);
    if (settings.grid && columns && list) {
      if (!wide) { wide = document.createElement('div'); wide.id = 'ytpc-wide'; }
      if (wide.previousElementSibling !== columns) columns.after(wide);
      wide.style.setProperty('--ytpc-cols', String(Math.min(8, Math.max(2, Number(settings.cols) || 4))));
      relatedMover.put(list, wide);
    } else {
      relatedMover.back();
      if (wide) wide.remove();
    }

    // 탭형 사이드바 (기본)
    if (settings.tabs) {
      if (applyTabs(f, inner)) { pinSidebar(f); watchSizes(f, inner); return; }
    } else { if (tabsEl) { tabsEl.remove(); tabsKey = ''; } cleanupTabsState(); }

    // 라이브 채팅창이 보이면: 채팅창이 오른쪽 맨 위 (댓글 상자 대신)
    const chat = $('ytd-live-chat-frame#chat', f);
    if (chat && !settings.hideChat && !chat.hidden && !chat.hasAttribute('hidden')) {
      // 채팅창은 #secondary-inner 의 직접 자식이 아니라 #chat-container 안에 있다
      let slot = chat;
      while (slot.parentElement && slot.parentElement !== inner) slot = slot.parentElement;
      if (slot.parentElement !== inner) slot = chat;
      commentsMover.back();
      if (box) box.remove();
      const listL = relatedMover.el;
      const hdrL = (listL && listL.querySelector('ytd-item-section-renderer > #header')) || chipsMover.el;
      if (settings.grid && hdrL) {
        chipsMover.put(hdrL, inner, slot);
        hdrL.classList.add('ytpc-chips');
      } else {
        chipsMover.back();
      }
      fitLive(f, inner, chat, slot);
      watchSizes(f, inner);
      return;
    }

    // 스크립트·챕터 같은 패널이 열리면 오른쪽 칸을 패널에 양보 (댓글 상자는 원래 자리로 복귀, 닫으면 다시 상자로)
    if (settings.yieldPanels && [...inner.querySelectorAll('#panels > ytd-engagement-panel-section-list-renderer')].some((p) =>
        (p.getAttribute('visibility') || '').endsWith('EXPANDED') &&
        p.getAttribute('target-id') !== 'engagement-panel-comments-section')) {
      chipsMover.back();
      commentsMover.back();
      if (box) box.remove();
      clearAllStyles();
      const piY = $('#primary-inner', f);
      if (piY) alignWide(f, inner, piY);
      return;
    }

    // 댓글 → 오른쪽 맨 위
    const all = [...f.querySelectorAll('ytd-comments#comments')];
    const comments = all.find((c) => !scroller || !scroller.contains(c)) || all[0];
    let missing = false;
    if (!comments || comments.hidden || comments.hasAttribute('hidden')) {
      if (Date.now() - navAt < NO_COMMENTS_GRACE) {
        waitGrace();
        // 아직 불러오는 중: 빈 상자 + 로딩 효과를 먼저 보여줌
        if (!box) buildBox();
        if (box.parentElement !== inner) inner.prepend(box);
        if (earlyOff(f)) setNoComments(true);
        else { setNoComments(false); box.classList.add('ytpc-loading'); pollSoon(); }
        fit(f, inner);
        watchSizes(f, inner);
        return;
      }
      missing = true;   // 끝내 안 나옴: 상자는 두고 안내 문구 표시
    }
    if (!box) buildBox();
    if (box.parentElement !== inner) inner.prepend(box);
    if (missing) { commentsMover.back(); setNoComments(true); }
    else { commentsMover.put(comments, scroller); updateLoading(); setNoComments(commentsOffMsg()); }

    // 추천 탭(모두 / 관련 콘텐츠 / 최근에 업로드된 동영상 …) → 댓글 칸 바로 아래
    const listNow = relatedMover.el;
    const hdr = (listNow && listNow.querySelector('ytd-item-section-renderer > #header')) || chipsMover.el;
    if (settings.grid && hdr) {
      chipsMover.put(hdr, inner, box);
      hdr.classList.add('ytpc-chips');
    } else {
      chipsMover.back();
    }

    fit(f, inner);
    watchSizes(f, inner);
  }

  /* ---------- 크기 변화 감지 (설명 펼치기, 재생목록 접기 등) ---------- */
  let ro = null;
  const watched = new Set();
  function watchSizes(f, inner) {
    if (!('ResizeObserver' in window)) return;
    if (!ro) ro = new ResizeObserver(schedule);
    const targets = [$('#primary-inner', f), $('ytd-playlist-panel-renderer#playlist', inner), $('#player-container-inner', f)];
    targets.forEach((t) => { if (t && !watched.has(t)) { ro.observe(t); watched.add(t); } });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    // rAF는 탭이 가려지면 멈추므로 setTimeout 사용
    setTimeout(() => {
      queued = false;
      try { apply(); } catch (e) { console.warn('[ytpc]', e); }
    }, 0);
  }

  // 다른 영상으로 이동 시작 → 바로 로딩 화면
  document.addEventListener('yt-navigate-start', () => {
    navAt = Date.now();
    startNavHide();
    setNoComments(false);
    if (box) box.classList.add('ytpc-loading');
  });
  document.addEventListener('yt-navigate-finish', () => {
    navAt = Date.now();
    expandTried = false;
    userPicked = false; activeTab = ''; prevExpanded = false; prevTab = ''; lastEnsure = 0;
    setNoComments(false);
    detachChat();
    clearBubbles();
    schedule();
    if (box) box.classList.add('ytpc-loading');
    if (scroller) scroller.scrollTop = 0;
    schedule();
  });
  document.addEventListener('yt-page-data-updated', schedule);
  window.addEventListener('resize', schedule);

  // 댓글·재생목록 등이 생기거나 바뀌는 즉시 반영
  let moTimer = 0;
  new MutationObserver(() => {
    if (moTimer) return;
    moTimer = setTimeout(() => { moTimer = 0; schedule(); }, 50);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // 패널(스크립트·챕터 등)이 열리고 닫히는 즉시 반영
  new MutationObserver(schedule).observe(document.documentElement,
    { attributes: true, subtree: true, attributeFilter: ['visibility'] });

  setInterval(schedule, 1000); // 안전망

  store.get((v) => { settings = { ...DEFAULTS, ...v }; schedule(); });
  store.watch((o) => { Object.assign(settings, o); schedule(); });

  // 유저스크립트: 관리자(Tampermonkey 등) 메뉴에서 설정
  if (typeof GM_registerMenuCommand === 'function') {
    const toggle = (k, label) => GM_registerMenuCommand(label, () => {
      settings[k] = !settings[k];
      store.set({ [k]: settings[k] });
      schedule();
      alert(label.replace(/ 켜기\/끄기$/, '') + ': ' + (settings[k] ? '켜짐' : '꺼짐'));
    });
    toggle('enabled', '전체 기능 켜기/끄기');
    toggle('grid', '추천 영상 영상 아래 전체로 켜기/끄기');
    toggle('bubbles', '라이브 채팅 버블 켜기/끄기');
    toggle('hideChat', '라이브 오른쪽 채팅창 숨기기 켜기/끄기');
    toggle('tabs', '탭형 사이드바(댓글·채팅·스크립트·재생목록) 켜기/끄기');
    toggle('yieldPanels', '스크립트·챕터 패널 열면 댓글 상자 양보 켜기/끄기');
    GM_registerMenuCommand('추천 영상 열 개수…', () => {
      const v = parseInt(prompt('추천 영상 열 개수 (3~6)', settings.cols), 10);
      if (v >= 3 && v <= 6) { settings.cols = v; store.set({ cols: v }); schedule(); }
    });
    GM_registerMenuCommand('재생목록 높이 비율…', () => {
      const v = parseInt(prompt('재생목록을 펼쳤을 때 오른쪽 칸에서 차지하는 비율 % (20~80)', Math.round(settings.plRatio * 100)), 10);
      if (v >= 20 && v <= 80) { settings.plRatio = v / 100; store.set({ plRatio: v / 100 }); schedule(); }
    });
  }
})();
