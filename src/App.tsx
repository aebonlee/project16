import { useState, useRef, useEffect } from 'react';
import { AppLayout, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

/* ──────────────────────────────────────────────────────────────────────────
 * 마음 한 스푼 — 위로·격려 챗
 * 지친 마음에 따뜻한 말을 클릭 한 번으로. 기분을 고르면 큐레이션된 위로/격려
 * 메시지를 건네고, 한 줄을 적으면 답을 돌려준다. (OpenAI 키 있으면 실제 생성)
 * 마음에 든 문장은 저장해 다시 꺼내 볼 수 있다.
 * ────────────────────────────────────────────────────────────────────────── */
const M: Meta = {
  id: 16, icon: '🫂', title: '마음 한 스푼', tagline: '지친 마음에 따뜻한 말 한 스푼 — 기분을 고르면 클릭 한 번으로 위로와 격려를 건넵니다',
  members: ['이초월'], color: '#FB7185', ai: true,
  problem:
    '바쁜 하루 끝에 누군가의 따뜻한 한마디가 필요하지만, 매번 사람에게 털어놓기는 부담스럽습니다. ' +
    '마음 한 스푼은 지금의 기분을 고르면 그 감정에 맞는 위로·격려를 클릭 한 번으로 건네고, 짧게 적은 마음에 다정한 답을 돌려줍니다. ' +
    '좋았던 문장은 저장해 힘든 순간에 다시 꺼내 볼 수 있습니다.',
  features: [
    { icon: '🎈', title: '기분 한 번 클릭', desc: '지침·슬픔·불안·외로움 등 지금 감정을 누르면 바로 맞춤 위로 한마디' },
    { icon: '💬', title: '마음 한 줄 답장', desc: '오늘 있었던 일을 한 줄 적으면 다정한 답을 돌려줍니다' },
    { icon: '🤖', title: 'AI 위로(선택)', desc: 'OpenAI 키를 넣으면 매번 새로운 문장을 직접 생성, 없으면 큐레이션 문구' },
    { icon: '💗', title: '마음 저장', desc: '좋았던 문장을 저장해 두고 힘들 때 다시 꺼내 보기' },
    { icon: '🌅', title: '오늘의 한마디', desc: '하루를 여는 짧은 응원 메시지' },
    { icon: '🔒', title: '조용한 공간', desc: '기록은 내 브라우저에만 — 누구에게도 보이지 않습니다' },
  ],
  howto: [
    '지금 기분을 한 번 눌러 보세요 — 바로 위로 한마디가 도착합니다',
    '하고 싶은 말이 있으면 아래 칸에 한 줄 적고 보내 보세요',
    '마음에 닿은 문장은 💗를 눌러 저장하고, 언제든 다시 읽어 보세요',
  ],
  facts: [
    { value: '클릭 1번', label: '위로까지 걸리는 동작' },
    { value: '6가지', label: '고를 수 있는 기분' },
    { value: '0원', label: '키 없이 쓰는 기본 기능' },
    { value: '100%', label: '내 브라우저에만 저장' },
  ],
  info: [
    { title: '자기 연민(self-compassion)', body: '힘들 때 자신을 친구 대하듯 다정하게 대하는 태도는 스트레스 회복에 도움이 된다는 연구가 있습니다. 이 앱의 문구도 그 결을 따릅니다.' },
    { title: '감정에 이름 붙이기', body: '"나 지금 불안하구나"처럼 감정을 말로 표현(affect labeling)하면 그 감정의 강도가 누그러지는 효과가 있습니다. 기분 선택이 그 첫걸음입니다.' },
    { title: '도움이 필요할 때', body: '마음이 많이 힘들다면 혼자 견디지 마세요. 정신건강 상담은 24시간 1577-0199(정신건강위기상담)로 연락할 수 있습니다.' },
  ],
  pipeline: [
    '고른 기분에 맞는 위로/격려 후보 문장을 고른다',
    'OpenAI 키가 있으면 감정·입력을 담아 새 문장을 생성, 없으면 큐레이션 풀에서 선택',
    '채팅 형태로 한 문장씩 건네고, 저장 요청 시 localStorage에 보관',
  ],
  techNotes: [
    { title: '키 없이도 동작', body: 'AI 키가 없으면 감정별로 손질한 문구 풀에서 무작위로 골라 항상 응답합니다.' },
    { title: '프라이버시', body: '대화·저장 문장은 서버로 보내지 않고 브라우저에만 남습니다(키 입력 시에만 OpenAI로 전송).' },
  ],
  targets: ['지친 하루에 위로가 필요한 사람', '누군가에게 털어놓기 부담스러운 사람', '혼자 마음을 다독이고 싶은 사람'],
  goals: [
    '기분을 고르면 클릭 한 번으로 맞춤 위로를 건넨다',
    '한 줄 마음에 다정한 답을 돌려준다',
    'API 키가 없어도 큐레이션 문구로 항상 응답한다',
  ],
  scenarios: [
    '지금 기분을 한 번 눌러 위로 한마디를 받는다',
    '오늘 있었던 일을 한 줄 적어 다정한 답을 받는다',
    '마음에 닿은 문장을 저장해 힘들 때 다시 본다',
  ],
  screens: [
    { name: '기분 선택', desc: '지침·슬픔·불안·외로움 등 6가지 기분 클릭 → 맞춤 위로' },
    { name: '마음 한 줄', desc: '한 줄 적으면 채팅형으로 다정한 답장' },
    { name: '마음 저장함', desc: '좋았던 문장을 저장·재열람' },
  ],
  pipelineDetail: [
    { step: '기분 매칭', detail: '고른 기분에 맞는 위로/격려 후보 문장을 고른다.' },
    { step: '생성 또는 큐레이션', detail: 'OpenAI 키가 있으면 감정·입력을 담아 새 문장을 생성하고, 없으면 큐레이션 풀에서 선택한다.' },
    { step: '전달 · 저장', detail: '채팅 형태로 한 문장씩 건네고, 저장 요청 시 localStorage(warm_saved)에 보관한다.' },
  ],
  promptNotes: [
    '고른 기분과 한 줄 입력을 담아 자기 연민(self-compassion) 결의 따뜻한 위로 문장을 생성하도록 system 프롬프트로 지시한다.',
    'API 키가 없으면 감정별로 손질한 문구 풀에서 무작위로 골라 항상 응답한다(서버 전송 없음).',
  ],
  architecture:
    '백엔드 없는 React SPA. 공통 레이아웃·5탭은 src/ui.tsx, 위로 기능은 src/App.tsx가 담당한다. ' +
    'OpenAI 호출은 src/lib/ai.ts(선택)이며, 대화·저장 문장은 서버 없이 브라우저 localStorage에만 보관한다.',
  structure: [
    { path: 'src/App.tsx', desc: '기분 선택·위로 챗·마음 저장함 + 메타(M)' },
    { path: 'src/ui.tsx', desc: '공통 레이아웃·5탭·UI 헬퍼' },
    { path: 'src/lib/ai.ts', desc: 'OpenAI chat 헬퍼(선택 위로 생성)' },
    { path: 'src/index.css', desc: '테마·채팅 스타일' },
  ],
  dataModel: [
    { name: 'Mood', desc: '기분 종류(지침·슬픔·불안·외로움 등)' },
    { name: 'Line', desc: '채팅 메시지(위로/격려 한 줄)' },
    { name: '저장', desc: '저장한 문장. localStorage "warm_saved"' },
  ],
  deploy:
    'Vite 빌드(base: "./") 후 GitHub Actions(deploy.yml)가 main push 시 GitHub Pages로 자동 배포 → aebonlee.github.io/project16/',
  stack: ['React 18', 'TypeScript', 'Vite', 'localStorage', 'OpenAI(선택)'],
};

interface Mood { key: string; emoji: string; label: string; }
const MOODS: Mood[] = [
  { key: 'tired', emoji: '😮‍💨', label: '지침' },
  { key: 'sad', emoji: '😢', label: '슬픔' },
  { key: 'anxious', emoji: '😰', label: '불안' },
  { key: 'lonely', emoji: '🥺', label: '외로움' },
  { key: 'angry', emoji: '😤', label: '화남' },
  { key: 'okay', emoji: '🙂', label: '괜찮아요' },
];

const POOL: Record<string, string[]> = {
  tired: [
    '오늘 하루도 버텨낸 당신, 정말 애썼어요. 지금은 아무것도 안 해도 괜찮아요.',
    '많이 지쳤죠? 잠깐 숨을 고르세요. 쉬는 것도 당신이 해야 할 중요한 일이에요.',
    '끝까지 해내려 애쓰는 모습이 보여요. 오늘은 이만하면 충분합니다.',
  ],
  sad: [
    '슬픈 마음을 억지로 밀어내지 않아도 돼요. 그 감정도 당신의 일부예요.',
    '울고 싶으면 울어도 괜찮아요. 비 온 뒤에 땅이 단단해지듯, 당신도 그래요.',
    '지금의 슬픔이 영원하진 않을 거예요. 제가 곁에서 같이 있어 줄게요.',
  ],
  anxious: [
    '아직 일어나지 않은 일까지 미리 아파하지 않아도 돼요. 지금 이 순간은 안전해요.',
    '숨을 천천히 들이쉬고, 더 천천히 내쉬어 보세요. 당신은 생각보다 잘 해내고 있어요.',
    '불안한 건 당신이 그만큼 잘하고 싶다는 뜻이에요. 한 걸음이면 충분해요.',
  ],
  lonely: [
    '혼자인 것 같은 밤에도, 당신을 응원하는 마음이 여기 있어요.',
    '외로움은 당신이 따뜻한 연결을 원한다는 신호예요. 그 마음, 참 소중해요.',
    '지금 이 화면 너머에서 누군가 당신의 하루를 진심으로 응원하고 있어요.',
  ],
  angry: [
    '화가 났다는 건 당신에게 소중한 무언가가 있다는 뜻이에요. 그 마음, 이해해요.',
    '감정을 참지 말고 흘려보내요. 당신은 충분히 그럴 자격이 있어요.',
    '잠깐 멈춰서 당신 편이 되어 줄게요. 당신 잘못이 아니에요.',
  ],
  okay: [
    '괜찮은 오늘이라니 다행이에요. 그 평온함을 마음껏 누리세요.',
    '잔잔한 하루도 충분히 좋은 하루예요. 오늘의 당신, 멋져요.',
    '별일 없이 흘러간 하루를 잘 살아낸 당신에게 박수를 보내요. 👏',
  ],
};
const FALLBACK_REPLY = [
  '그 마음을 들려줘서 고마워요. 당신은 혼자가 아니에요.',
  '충분히 그럴 수 있어요. 당신의 감정은 모두 소중합니다.',
  '오늘도 잘 버텨줘서 고마워요. 당신은 생각보다 강한 사람이에요.',
  '들어주는 것밖에 못 해도, 진심으로 당신을 응원하고 있어요.',
];
const TODAY = [
  '오늘의 당신은 어제보다 한 뼘 더 단단해졌어요.',
  '작은 한 걸음도 분명한 전진이에요. 오늘도 잘 부탁해요.',
  '당신은 사랑받을 자격이 충분한 사람이에요.',
  '완벽하지 않아도 괜찮아요. 있는 그대로의 당신이 좋아요.',
];

interface Line { id: string; who: 'me' | 'them'; text: string; }
const pick = (arr: string[], seed: number) => arr[seed % arr.length];

const App = () => {
  const [lines, setLines] = useState<Line[]>([{ id: 'hi', who: 'them', text: '안녕하세요. 오늘 마음은 어떤가요? 아래에서 지금 기분을 골라 보세요. 🫶' }]);
  const [input, setInput] = useState('');
  const [mood, setMood] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useLocalStorage<string[]>('warm_saved', []);
  const [todayMsg] = useState(() => TODAY[new Date().getDate() % TODAY.length]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines, busy]);

  const push = (who: 'me' | 'them', text: string) =>
    setLines((p) => [...p, { id: String(Date.now()) + Math.round(performance.now()), who, text }]);

  const respond = async (moodKey: string, userText: string) => {
    setBusy(true);
    const seed = Math.floor(performance.now());
    const moodLabel = MOODS.find((m) => m.key === moodKey)?.label ?? '';
    let reply = '';
    if (hasKey()) {
      try {
        reply = await ask(
          '너는 다정하고 따뜻한 위로 친구다. 한국어로 2~3문장, 진심 어린 위로와 격려를 건네라. 충고·진단·해결책 나열은 하지 말고 공감 위주로. 이모지는 0~1개만.',
          `상대의 기분: ${moodLabel || '말하지 않음'}\n상대가 한 말: ${userText || '(기분만 선택함)'}`,
          { temperature: 0.9, max_tokens: 260 },
        );
      } catch { reply = ''; }
    }
    if (!reply) reply = userText ? pick(FALLBACK_REPLY, seed) : pick(POOL[moodKey] ?? FALLBACK_REPLY, seed);
    setBusy(false);
    push('them', reply);
  };

  const onMood = (m: Mood) => { setMood(m.key); push('me', `${m.emoji} ${m.label}`); respond(m.key, ''); };
  const onSend = () => {
    const t = input.trim();
    if (!t) return;
    push('me', t); setInput('');
    respond(mood, t);
  };
  const toggleSave = (text: string) =>
    setSaved((p) => p.includes(text) ? p.filter((x) => x !== text) : [text, ...p]);

  const feature = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="todayq" style={{ background: `linear-gradient(135deg, ${M.color}, #f59e0b)` }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.05em', opacity: .85, marginBottom: 8 }}>🌅 오늘의 한마디</div>
        <p>{todayMsg}</p>
      </div>

      <div className="card">
        <div className="seclabel" style={{ color: M.color }}>지금 기분을 눌러 보세요</div>
        <div className="mood-grid" style={{ marginTop: 12 }}>
          {MOODS.map((m) => (
            <button key={m.key} className={`mood ${mood === m.key ? 'on' : ''}`} style={mood === m.key ? { background: M.color } : undefined} onClick={() => onMood(m)}>
              <span>{m.emoji}</span><b>{m.label}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="chat">
          {lines.map((l) => (
            <div key={l.id} className={`bubble ${l.who}`} style={l.who === 'them' ? { background: 'var(--card)', border: `1px solid ${M.color}33`, paddingBottom: l.who === 'them' ? 26 : undefined } : undefined}>
              {l.text}
              {l.who === 'them' && l.id !== 'hi' && (
                <button className="fav" title="마음에 저장" onClick={() => toggleSave(l.text)}>{saved.includes(l.text) ? '💗' : '🤍'}</button>
              )}
            </div>
          ))}
          {busy && <div className="typing">마음을 고르는 중… 🫧</div>}
          <div ref={endRef} />
        </div>
        <div className="warmth" style={{ marginTop: 14 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()} placeholder="하고 싶은 말을 한 줄 적어 보세요…" />
          <button className="btn" style={{ background: M.color, padding: '11px 20px' }} disabled={busy} onClick={onSend}>보내기</button>
        </div>
      </div>

      {saved.length > 0 && (
        <div className="card">
          <div className="seclabel" style={{ color: M.color }}>💗 저장한 마음</div>
          <div className="saved" style={{ marginTop: 12 }}>
            {saved.map((s, i) => (
              <div key={i} className="saved__item">
                <span>“{s}”</span>
                <button className="del" onClick={() => toggleSave(s)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return <AppLayout m={M} feature={feature} />;
};

export default App;
