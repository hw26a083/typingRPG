import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield as ShieldIcon, 
  Heart, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  RefreshCw, 
  Gamepad2, 
  Compass, 
  Award, 
  Flame, 
  Snowflake, 
  Zap,
  Info,
  Undo2
} from 'lucide-react';
import { Character, Enemy, EnemyAttack, Skill, TypingStats, BattleState } from './types';
import { SKILLS, STAGES, BOSS_TEMPLATE } from './data';

// Web Audio API Sound Synthesizer
class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy initialize to bypass browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playKeyCorrect() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playKeyWrong() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.22);
    });
  }

  playDamage() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.08, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }
}

const sound = new SoundController();

// Create Initial Party Members
const createParty = (level: number = 1): Character[] => [
  {
    id: 'hero',
    name: '勇者 (男の子)',
    role: 'hero',
    avatar: '👦',
    maxHp: 100,
    hp: 100,
    level,
    skills: SKILLS.hero,
    isDead: false,
    atkBuff: 1.0,
    defBuff: 1.0,
    provokeTurns: 0,
    ultimateCooldown: 0,
    shield: 0,
  },
  {
    id: 'mage',
    name: '魔法使い (女性)',
    role: 'mage',
    avatar: '👧',
    maxHp: 70,
    hp: 70,
    level,
    skills: SKILLS.mage,
    isDead: false,
    atkBuff: 1.0,
    defBuff: 1.0,
    provokeTurns: 0,
    ultimateCooldown: 0,
    shield: 0,
  },
  {
    id: 'priest',
    name: '僧侶 (老人)',
    role: 'priest',
    avatar: '👴',
    maxHp: 80,
    hp: 80,
    level,
    skills: SKILLS.priest,
    isDead: false,
    atkBuff: 1.0,
    defBuff: 1.0,
    provokeTurns: 0,
    ultimateCooldown: 0,
    shield: 0,
  },
  {
    id: 'warrior',
    name: '戦士 (屈強な男)',
    role: 'warrior',
    avatar: '🧔',
    maxHp: 120,
    hp: 120,
    level,
    skills: SKILLS.warrior,
    isDead: false,
    atkBuff: 1.0,
    defBuff: 1.0,
    provokeTurns: 0,
    ultimateCooldown: 0,
    shield: 0,
  },
];

const ROMAN_RULES: { [kana: string]: string[] } = {
  'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu'], 'え': ['e'], 'お': ['o'],
  'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
  'さ': ['sa'], 'し': ['shi', 'si'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo', 'o'],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di', 'zi', 'ji'], 'づ': ['du', 'zu'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  'ー': ['-'], '〜': ['-'],
  '・': ['・', '/', ' ', ''],
  ' ': [' '],

  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
  'ちゃ': ['cha', 'tya'], 'ちゅ': ['chu', 'tyu'], 'ちょ': ['cho', 'tyo'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['ja', 'zya', 'jya'], 'じゅ': ['ju', 'zyu', 'jyu'], 'じょ': ['jo', 'zyo', 'jyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
};

const ROMAN_TO_KANA: { [key: string]: string } = {
  'kaitengiri': 'かいてんぎり',
  'enbugiri': 'えんぶぎり',
  'hyousetugiri': 'ひょうせつぎり',
  'saisyuuougi・kuukadanzetuzan': 'さいしゅうおうぎ・くうかだんぜつざん',
  'nitoroba-n': 'にとろばーん',
  'raitoningbureika-': 'らいとにんぐぶれいかー',
  'buriza-domaunten': 'ぶりざーどまうんてん',
  'saisyuuougi・ekusupuro-zyon': 'さいしゅうおうぎ・えくすぷろーじょん',
  'o-ruhi-ru': 'おーるひーる',
  'yowakuna-ru': 'よわくなーる',
  'tuyokuna-ru': 'つよくなーる',
  'saisyuuougi・za・monkureboryu-syon': 'さいしゅうおうぎ・ざ・もんくれぼりゅーしょん',
  'za・si-rudo': 'ざ・しーるど',
  'tyouhatu': 'ちょうはつ',
  'o-rusi-rudo': 'おーるしーるど',
  'saisyuuougi・si-rudobureika-': 'さいしゅうおうぎ・しーるどぶれいかー',
  
  // モンスターの技
  'fumitsukeru': 'ふみつける',
  'yawohanatsu': 'やをはなつ',
  'hinoko': 'ひのこ',
  'kamitsuku': 'かみつく',
  'tsurekomu': 'つれこむ',
  'kiritsukeru': 'きりつける',
  'bunnaguru': 'ぶんなぐる',
  'kooraseru': 'こおらせる',
  'fubuki': 'ふぶき',
  'tsutsuku': 'つつく',
  'suberitsutsuki': 'すべりつつき',
  'magumasuraimu': 'まぐますらいむ',
  'houkousuru': 'ほうこうする',
  'hiwofuku': 'ひをふく',
  'shoukansuru': 'しょうかんする',
  'bi-mu': 'びーむ',
  'meteosutoraiku': 'めておすとらいく',
  'naguritsukeru': 'なぐりつける',
};

interface MatchState {
  kanaPos: number;
  inputPos: number;
}

function getNextKeysForKana(kana: string, kanaPos: number): string[] {
  const remainingKana = kana.slice(kanaPos);
  if (remainingKana.length === 0) return [];
  
  const keysSet = new Set<string>();
  
  // 1. 中黒
  if (remainingKana[0] === '・') {
    keysSet.add('・');
    keysSet.add('/');
    keysSet.add(' ');
    keysSet.add('-');
    if (remainingKana.length > 1) {
      const nextKeys = getNextKeysForKana(kana, kanaPos + 1);
      for (const k of nextKeys) keysSet.add(k);
    }
    return Array.from(keysSet);
  }
  
  // 2. 促音
  if (remainingKana[0] === 'っ' && remainingKana.length > 1) {
    const nextChar = remainingKana[1];
    const nextPair = remainingKana.slice(1, 3);
    const candidates = ROMAN_RULES[nextPair] || ROMAN_RULES[nextChar] || [];
    for (const cand of candidates) {
      if (cand[0]) keysSet.add(cand[0]);
    }
    keysSet.add('x');
    keysSet.add('l');
    return Array.from(keysSet);
  }
  
  // 3. 撥音
  if (remainingKana[0] === 'ん') {
    keysSet.add('n');
    return Array.from(keysSet);
  }
  
  // 4. 通常
  if (remainingKana.length >= 2) {
    const pair = remainingKana.slice(0, 2);
    const candidates = ROMAN_RULES[pair];
    if (candidates) {
      for (const cand of candidates) {
        if (cand[0]) keysSet.add(cand[0]);
      }
    }
  }
  
  const single = remainingKana[0];
  const candidates = ROMAN_RULES[single];
  if (candidates) {
    for (const cand of candidates) {
      if (cand[0]) keysSet.add(cand[0]);
    }
  }
  
  return Array.from(keysSet);
}

function checkTypingPrefix(kana: string, input: string): { 
  isValid: boolean; 
  isComplete: boolean; 
  nextKeys: string[]; 
  matchedKanaCount: number;
} {
  if (input === "") {
    return {
      isValid: true,
      isComplete: false,
      nextKeys: getNextKeysForKana(kana, 0),
      matchedKanaCount: 0,
    };
  }

  const results: { kanaPos: number; isComplete: boolean }[] = [];
  const queue: { kanaPos: number; inputPos: number }[] = [{ kanaPos: 0, inputPos: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const key = `${curr.kanaPos},${curr.inputPos}`;
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (curr.inputPos === input.length) {
      results.push({
        kanaPos: curr.kanaPos,
        isComplete: curr.kanaPos === kana.length,
      });
      continue;
    }
    
    const remainingKana = kana.slice(curr.kanaPos);
    if (remainingKana.length === 0) continue;
    
    // 1. 中黒「・」の処理
    if (remainingKana[0] === '・') {
      const inputPart = input.slice(curr.inputPos);
      const nextChar = inputPart[0];
      // スキップパス
      queue.push({ kanaPos: curr.kanaPos + 1, inputPos: curr.inputPos });
      
      // 入力されたパス
      if (nextChar === '・' || nextChar === '/' || nextChar === ' ' || nextChar === '-') {
        queue.push({ kanaPos: curr.kanaPos + 1, inputPos: curr.inputPos + 1 });
      }
      continue;
    }
    
    // 2. 促音「っ」の処理
    if (remainingKana[0] === 'っ' && remainingKana.length > 1) {
      const nextKanaChar = remainingKana[1];
      let nextKanaPair = remainingKana.slice(1, 3);
      let candidates: string[] = [];
      let kanaConsumed = 2;
      
      if (ROMAN_RULES[nextKanaPair]) {
        candidates = ROMAN_RULES[nextKanaPair];
        kanaConsumed = 3;
      } else if (ROMAN_RULES[nextKanaChar]) {
        candidates = ROMAN_RULES[nextKanaChar];
        kanaConsumed = 2;
      }
      
      const inputPart = input.slice(curr.inputPos);
      
      for (const cand of candidates) {
        const consonant = cand[0];
        if (consonant && !['a', 'i', 'u', 'e', 'o'].includes(consonant)) {
          const doubleRoman = consonant + cand;
          if (inputPart.startsWith(doubleRoman)) {
            queue.push({ kanaPos: curr.kanaPos + kanaConsumed, inputPos: curr.inputPos + doubleRoman.length });
          } else if (doubleRoman.startsWith(inputPart)) {
            queue.push({ kanaPos: curr.kanaPos, inputPos: curr.inputPos + inputPart.length });
          }
        }
      }
      
      const xtsuCandidates = ['xtsu', 'ltsu', 'xtu', 'ltu'];
      for (const cand of xtsuCandidates) {
        if (inputPart.startsWith(cand)) {
          queue.push({ kanaPos: curr.kanaPos + 1, inputPos: curr.inputPos + cand.length });
        } else if (cand.startsWith(inputPart)) {
          queue.push({ kanaPos: curr.kanaPos, inputPos: curr.inputPos + inputPart.length });
        }
      }
      continue;
    }
    
    // 3. 撥音「ん」の処理
    if (remainingKana[0] === 'ん') {
      const inputPart = input.slice(curr.inputPos);
      const isLast = remainingKana.length === 1;
      const nextCharOfKana = !isLast ? remainingKana[1] : '';
      
      let needsDoubleN = isLast;
      if (!isLast) {
        const nextPair = remainingKana.slice(1, 3);
        const nextRules = ROMAN_RULES[nextPair] || ROMAN_RULES[nextCharOfKana] || [];
        const startsWithVowelOrYorN = nextRules.some(r => 
          ['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(r[0])
        );
        if (startsWithVowelOrYorN) {
          needsDoubleN = true;
        }
      }
      
      if (inputPart.startsWith('nn')) {
        queue.push({ kanaPos: curr.kanaPos + 1, inputPos: curr.inputPos + 2 });
      } else if ('nn'.startsWith(inputPart)) {
        queue.push({ kanaPos: curr.kanaPos, inputPos: curr.inputPos + inputPart.length });
      }
      
      if (!needsDoubleN) {
        if (inputPart.startsWith('n')) {
          queue.push({ kanaPos: curr.kanaPos + 1, inputPos: curr.inputPos + 1 });
        } else if ('n'.startsWith(inputPart)) {
          queue.push({ kanaPos: curr.kanaPos, inputPos: curr.inputPos + inputPart.length });
        }
      }
      continue;
    }
    
    const inputPart = input.slice(curr.inputPos);
    
    if (remainingKana.length >= 2) {
      const pair = remainingKana.slice(0, 2);
      const candidates = ROMAN_RULES[pair];
      if (candidates) {
        for (const cand of candidates) {
          if (inputPart.startsWith(cand)) {
            queue.push({ kanaPos: curr.kanaPos + 2, inputPos: curr.inputPos + cand.length });
          } else if (cand.startsWith(inputPart)) {
            queue.push({ kanaPos: curr.kanaPos, inputPos: curr.inputPos + inputPart.length });
          }
        }
      }
    }
    
    const singleChar = remainingKana[0];
    const candidates = ROMAN_RULES[singleChar];
    if (candidates) {
      for (const cand of candidates) {
        if (inputPart.startsWith(cand)) {
          queue.push({ kanaPos: curr.kanaPos + 1, inputPos: curr.inputPos + cand.length });
        } else if (cand.startsWith(inputPart)) {
          queue.push({ kanaPos: curr.kanaPos, inputPos: curr.inputPos + inputPart.length });
        }
      }
    }
  }
  
  const isValid = results.length > 0;
  const isComplete = results.some(r => r.isComplete);
  const matchedKanaCount = results.reduce((max, r) => Math.max(max, r.kanaPos), 0);
  
  const nextKeysSet = new Set<string>();
  if (isValid) {
    for (const r of results) {
      if (r.isComplete) continue;
      const keys = getNextKeysForKana(kana, r.kanaPos);
      for (const k of keys) nextKeysSet.add(k);
    }
  }
  
  return {
    isValid,
    isComplete,
    nextKeys: Array.from(nextKeysSet),
    matchedKanaCount,
  };
}

function kanaToStandardRoman(kana: string): string {
  let result = '';
  let i = 0;
  while (i < kana.length) {
    if (i < kana.length - 1) {
      const pair = kana.slice(i, i + 2);
      if (ROMAN_RULES[pair]) {
        result += ROMAN_RULES[pair][0];
        i += 2;
        continue;
      }
    }
    const single = kana[i];
    if (single === 'ん') {
      result += 'nn';
      i++;
      continue;
    }
    if (single === 'っ' && i < kana.length - 1) {
      const nextKana = kana[i + 1];
      let nextRoman = '';
      if (i < kana.length - 2 && ROMAN_RULES[kana.slice(i + 1, i + 3)]) {
        nextRoman = ROMAN_RULES[kana.slice(i + 1, i + 3)][0];
      } else if (ROMAN_RULES[nextKana]) {
        nextRoman = ROMAN_RULES[nextKana][0];
      }
      if (nextRoman && !['a', 'i', 'u', 'e', 'o'].includes(nextRoman[0])) {
        result += nextRoman[0];
      } else {
        result += 'xtsu';
      }
      i++;
      continue;
    }
    
    if (ROMAN_RULES[single]) {
      result += ROMAN_RULES[single][0];
    } else {
      result += single;
    }
    i++;
  }
  return result;
}

export default function App() {
  // Game General State
  const [screen, setScreen] = useState<'start' | 'explore' | 'battle' | 'game_clear'>('start');
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [party, setParty] = useState<Character[]>(createParty(1));
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Stats over the entire game
  const [globalStats, setGlobalStats] = useState<TypingStats>({
    totalKeystrokes: 0,
    correctKeys: 0,
    missedKeys: 0,
    totalWordsTyped: 0,
    successfulWords: 0,
    failedWords: 0,
    mistakeMap: {},
    startTime: 0,
    elapsedTimeMs: 0,
  });

  // Current battle stats (for the active encounter only)
  const [battleStats, setBattleStats] = useState({
    keystrokes: 0,
    correct: 0,
    missed: 0,
    successfulTypings: 0,
    failedTypings: 0,
  });

  // 2D Map Exploration state
  const [playerPos, setPlayerPos] = useState({ x: 4, y: 7 });
  interface MapEntity {
    id: string;
    type: 'monster' | 'portal' | 'tree' | 'obstacle' | 'chest';
    x: number;
    y: number;
    avatar: string;
    label?: string;
  }
  const [mapEntities, setMapEntities] = useState<MapEntity[]>([]);

  // Battle State
  const [battle, setBattle] = useState<BattleState>({
    enemies: [],
    currentTurn: 1,
    phase: 'action_select',
    selectedSkills: {},
    currentCharIndex: 0,
    executingCharIndex: 0,
    defendingCharIndex: 0,
    enemyAttackingIndex: 0,
    currentAttack: null,
    typingInput: '',
    typingTarget: '',
    typingStartTime: 0,
    typingLimitTime: 5,
    typingMistakeCount: 0,
    battleLogs: [],
  });

  // Target choosing helper
  const [isChoosingTarget, setIsChoosingTarget] = useState<boolean>(false);
  const [pendingSkill, setPendingSkill] = useState<{ charId: string, skill: Skill } | null>(null);

  // Floating damage text animations
  const [damageAnimations, setDamageAnimations] = useState<{ id: number; text: string; x: number; y: number; colorClass: string }[]>([]);
  const animCounter = useRef<number>(0);

  const addDamageAnim = (text: string, xPercent: number, yPercent: number, colorClass = 'text-red-500 font-bold') => {
    const id = animCounter.current++;
    setDamageAnimations((prev) => [...prev, { id, text, x: xPercent, y: yPercent, colorClass }]);
    setTimeout(() => {
      setDamageAnimations((prev) => prev.filter((anim) => anim.id !== id));
    }, 1200);
  };

  // Sound enable/disable hook
  useEffect(() => {
    sound.enabled = soundOn;
  }, [soundOn]);

  // Set up 2D Exploration Map Entities when stageIndex changes
  useEffect(() => {
    const currentStage = STAGES[stageIndex];
    if (!currentStage) return;

    // Fixed Obstacles & 2-3 wandering monster icons
    const entities: MapEntity[] = [];
    
    // Add trees/rocks obstacles
    const obstacleCount = 10 + stageIndex * 3;
    const usedPositions = new Set<string>();
    usedPositions.add('4,7'); // Player start position

    // Add 3 monster spawns
    const templates = currentStage.monsterTemplates;
    for (let i = 0; i < 3; i++) {
      let mx = Math.floor(Math.random() * 9);
      let my = Math.floor(Math.random() * 6); // Keep monsters slightly upper
      let posKey = `${mx},${my}`;
      while (usedPositions.has(posKey)) {
        mx = Math.floor(Math.random() * 9);
        my = Math.floor(Math.random() * 6);
        posKey = `${mx},${my}`;
      }
      usedPositions.add(posKey);
      
      const t = templates[i % templates.length];
      entities.push({
        id: `monster-${i}`,
        type: 'monster',
        x: mx,
        y: my,
        avatar: t.avatar,
        label: t.name,
      });
    }

    // Portal (glowing crystal or door) at top center
    entities.push({
      id: 'portal',
      type: 'portal',
      x: 4,
      y: 0,
      avatar: '🔮',
      label: '次のステージへ',
    });

    // Decorative obstacles depending on Stage theme
    const obstaclesAvatars = stageIndex === 0 ? ['🌳', '🌲', '🪨'] 
                          : stageIndex === 1 ? ['🌵', '🏜️', '🪨']
                          : stageIndex === 2 ? ['❄️', '☃️', '🧊']
                          : ['🌋', '🔥', '🪨'];
                          
    for (let i = 0; i < obstacleCount; i++) {
      let ox = Math.floor(Math.random() * 9);
      let oy = Math.floor(Math.random() * 8);
      let posKey = `${ox},${oy}`;
      if (!usedPositions.has(posKey) && oy !== 7) { // Leave room near start
        usedPositions.add(posKey);
        entities.push({
          id: `obstacle-${i}`,
          type: 'obstacle',
          x: ox,
          y: oy,
          avatar: obstaclesAvatars[Math.floor(Math.random() * obstaclesAvatars.length)],
        });
      }
    }

    setMapEntities(entities);
    setPlayerPos({ x: 4, y: 7 });
  }, [stageIndex]);

  // Track global timer
  useEffect(() => {
    if (screen === 'start') {
      setGlobalStats((prev) => ({ ...prev, startTime: Date.now() }));
    }
  }, [screen]);

  // 2D Movement Keyboard Listeners
  const handleMapMovement = useCallback((dx: number, dy: number) => {
    setPlayerPos((prev) => {
      const nextX = Math.min(Math.max(prev.x + dx, 0), 8);
      const nextY = Math.min(Math.max(prev.y + dy, 0), 8);

      // Check collision with obstacles
      const collidesObstacle = mapEntities.find(
        (e) => e.x === nextX && e.y === nextY && e.type === 'obstacle'
      );
      if (collidesObstacle) return prev; // Do not move

      // Check if monster touched
      const touchedMonster = mapEntities.find(
        (e) => e.x === nextX && e.y === nextY && e.type === 'monster'
      );
      if (touchedMonster) {
        // Trigger Battle!
        setTimeout(() => triggerBattleWith(touchedMonster), 100);
        return { x: nextX, y: nextY };
      }

      // Check if portal touched
      const touchedPortal = mapEntities.find(
        (e) => e.x === nextX && e.y === nextY && e.type === 'portal'
      );
      if (touchedPortal) {
        // Only allow progression if no monsters remain on map
        const activeMonsters = mapEntities.filter((e) => e.type === 'monster');
        if (activeMonsters.length > 0) {
          addDamageAnim('先にすべてのモンスターを倒して！', 50, 40, 'text-yellow-400 font-bold bg-black/80 p-2 rounded text-sm shadow');
          return prev;
        } else {
          // Go to next stage
          goToNextStage();
        }
      }

      return { x: nextX, y: nextY };
    });
  }, [mapEntities]);

  useEffect(() => {
    if (screen !== 'explore') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') handleMapMovement(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleMapMovement(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleMapMovement(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleMapMovement(1, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleMapMovement]);

  const triggerBattleWith = (monsterEntity: MapEntity) => {
    const currentStage = STAGES[stageIndex];
    let spawnedEnemies: Enemy[] = [];

    // Reset battle statistics
    setBattleStats({
      keystrokes: 0,
      correct: 0,
      missed: 0,
      successfulTypings: 0,
      failedTypings: 0,
    });

    if (currentStage.number === 4 && mapEntities.filter((e) => e.type === 'monster').length === 1 && monsterEntity.id === 'monster-0') {
      // If it's the last stage, and final monster, spawn Demon King!
      spawnedEnemies = [JSON.parse(JSON.stringify(BOSS_TEMPLATE))];
    } else {
      // Spawn random 1 or 2 monsters of this stage template
      const templateNames = currentStage.monsterTemplates;
      const amount = Math.random() > 0.4 ? 2 : 1;
      for (let i = 0; i < amount; i++) {
        const randTemplate = templateNames[Math.floor(Math.random() * templateNames.length)];
        spawnedEnemies.push(JSON.parse(JSON.stringify(randTemplate)));
      }
    }

    // Set first character to start action select
    setBattle({
      enemies: spawnedEnemies,
      currentTurn: 1,
      phase: 'action_select',
      selectedSkills: {},
      currentCharIndex: getFirstAliveCharIndex(),
      executingCharIndex: 0,
      defendingCharIndex: 0,
      enemyAttackingIndex: 0,
      currentAttack: null,
      typingInput: '',
      typingTarget: '',
      typingStartTime: 0,
      typingLimitTime: 5,
      typingMistakeCount: 0,
      battleLogs: [`野生の ${spawnedEnemies.map(e => e.name).join('と')} が現れた！`],
    });

    // Remove this monster from map
    setMapEntities((prev) => prev.filter((e) => e.id !== monsterEntity.id));
    setScreen('battle');
  };

  const getFirstAliveCharIndex = (): number => {
    for (let i = 0; i < party.length; i++) {
      if (!party[i].isDead) return i;
    }
    return 0;
  };

  const goToNextStage = () => {
    if (stageIndex < 3) {
      sound.playLevelUp();
      const nextIdx = stageIndex + 1;
      setStageIndex(nextIdx);
      // Party fully recovers and levels up!
      setParty((prev) => 
        prev.map((char) => ({
          ...char,
          level: char.level + 1,
          hp: char.maxHp,
          isDead: false,
          atkBuff: 1.0,
          defBuff: 1.0,
          provokeTurns: 0,
          ultimateCooldown: 0,
          shield: 0,
        }))
      );
      addDamageAnim('レベルアップ！ 全員完全回復！', 50, 45, 'text-green-400 font-bold bg-slate-900/90 px-4 py-2 border-2 border-green-500 rounded text-lg shadow-xl');
    } else {
      // Clear game!
      setScreen('game_clear');
      setGlobalStats((prev) => ({
        ...prev,
        elapsedTimeMs: Date.now() - prev.startTime,
      }));
    }
  };

  // Turn Flow Controllers
  const selectSkillForChar = (skill: Skill) => {
    const char = party[battle.currentCharIndex];
    
    // Check level requirement
    if (char.level < skill.levelRequired) return;

    // Healing/Buff skills might target allies, attacks target enemies
    const isSupport = skill.name === 'オールヒール' || skill.name === 'ツヨクナール' || skill.name === 'ザ・シールド' || skill.name === 'オールシールド' || skill.name === '最終奥義・ザ・モンクレボリューション';
    
    setPendingSkill({ charId: char.id, skill });
    if (isSupport || skill.name === '最終奥義・エクスプロージョン' || skill.name === '最終奥義・シールドブレイカー' || skill.name === '回転切り') {
      // Auto target all or self, proceed directly
      submitChosenAction(0);
    } else {
      // Needs targeting an enemy or an ally
      setIsChoosingTarget(true);
    }
  };

  const submitChosenAction = (targetIndex: number) => {
    if (!pendingSkill) return;
    const { charId, skill } = pendingSkill;

    // Attach target index directly as property
    const skillWithTarget = { ...skill, targetIdx: targetIndex };

    setBattle((prev) => {
      const nextSkills = { ...prev.selectedSkills, [charId]: skillWithTarget };
      
      // Look for next alive character to select actions
      let nextCharIdx = prev.currentCharIndex + 1;
      while (nextCharIdx < party.length && party[nextCharIdx].isDead) {
        nextCharIdx++;
      }

      if (nextCharIdx < party.length) {
        // Move to next character action select
        return {
          ...prev,
          selectedSkills: nextSkills,
          currentCharIndex: nextCharIdx,
        };
      } else {
        // All alive characters have selected actions. Start the execution phase!
        setTimeout(() => startExecutionPhase(), 100);
        return {
          ...prev,
          selectedSkills: nextSkills,
          phase: 'action_execute',
          executingCharIndex: getFirstAliveCharIndex(),
          typingTarget: '',
          typingInput: '',
        };
      }
    });

    setIsChoosingTarget(false);
    setPendingSkill(null);
  };

  // Execution Phase (Typing)
  const startExecutionPhase = () => {
    setBattle((prev) => {
      const char = party[prev.executingCharIndex];
      const selectedSkill = prev.selectedSkills[char.id];
      if (!selectedSkill) {
        // Skip if no skill selected (or character died since choosing, etc.)
        return { ...prev };
      }

      const limit = selectedSkill.roman.length * 1.0 + 1.5;

      return {
        ...prev,
        typingTarget: selectedSkill.roman,
        typingInput: '',
        typingStartTime: Date.now(),
        typingLimitTime: limit,
        typingMistakeCount: 0,
      };
    });
  };

  // Listeners for Typing inputs during Action/Defense Phases
  useEffect(() => {
    if (screen !== 'battle') return;
    if (battle.phase !== 'action_execute' && battle.phase !== 'enemy_turn') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default scrolling for Spacebar and other keys during typing
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }

      // Check standard keys (letters, symbols)
      const key = e.key.toLowerCase();
      if (key.length !== 1) return; // ignore control keys

      const target = battle.typingTarget;
      const kana = ROMAN_TO_KANA[target];

      // Record keystroke in statistics
      setGlobalStats((prev) => ({
        ...prev,
        totalKeystrokes: prev.totalKeystrokes + 1,
      }));
      setBattleStats((prev) => ({
        ...prev,
        keystrokes: prev.keystrokes + 1,
      }));

      if (kana) {
        const nextInput = battle.typingInput + key;
        const result = checkTypingPrefix(kana, nextInput);

        if (result.isValid) {
          // Correct key!
          sound.playKeyCorrect();
          
          setGlobalStats((prev) => ({
            ...prev,
            correctKeys: prev.correctKeys + 1,
          }));
          setBattleStats((prev) => ({
            ...prev,
            correct: prev.correct + 1,
          }));

          setBattle((prev) => ({
            ...prev,
            typingInput: nextInput,
          }));

          if (result.isComplete) {
            // Finished typing perfectly!
            handleTypingFinished(true);
          }
        } else {
          // Wrong key!
          sound.playKeyWrong();
          const currentResult = checkTypingPrefix(kana, battle.typingInput);
          const expectedChar = currentResult.nextKeys[0] || 'n';

          setGlobalStats((prev) => {
            const map = { ...prev.mistakeMap };
            map[expectedChar] = (map[expectedChar] || 0) + 1;
            return {
              ...prev,
              missedKeys: prev.missedKeys + 1,
              mistakeMap: map,
            };
          });
          setBattleStats((prev) => ({
            ...prev,
            missed: prev.missed + 1,
          }));

          setBattle((prev) => ({
            ...prev,
            typingMistakeCount: prev.typingMistakeCount + 1,
          }));
        }
      } else {
        // Fallback for custom target without kana mapping
        const index = battle.typingInput.length;
        const expectedChar = target[index]?.toLowerCase();
        const isMatch = (key === expectedChar) || 
                        (expectedChar === '・' && (key === '・' || key === '/' || key === ' ' || key === '-'));

        if (isMatch) {
          sound.playKeyCorrect();
          const nextInput = battle.typingInput + key;
          
          setGlobalStats((prev) => ({
            ...prev,
            correctKeys: prev.correctKeys + 1,
          }));
          setBattleStats((prev) => ({
            ...prev,
            correct: prev.correct + 1,
          }));

          setBattle((prev) => ({
            ...prev,
            typingInput: nextInput,
          }));

          if (nextInput.length >= target.length) {
            handleTypingFinished(true);
          }
        } else {
          sound.playKeyWrong();
          setGlobalStats((prev) => {
            const map = { ...prev.mistakeMap };
            if (expectedChar) {
              map[expectedChar] = (map[expectedChar] || 0) + 1;
            }
            return {
              ...prev,
              missedKeys: prev.missedKeys + 1,
              mistakeMap: map,
            };
          });
          setBattleStats((prev) => ({
            ...prev,
            missed: prev.missed + 1,
          }));

          setBattle((prev) => ({
            ...prev,
            typingMistakeCount: prev.typingMistakeCount + 1,
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [screen, battle.phase, battle.typingTarget, battle.typingInput]);

  // Handle typing timer countdown
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (screen !== 'battle' || (battle.phase !== 'action_execute' && battle.phase !== 'enemy_turn') || !battle.typingTarget) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const duration = battle.typingLimitTime * 1000;
    const end = battle.typingStartTime + duration;
    setTimeLeft(battle.typingLimitTime);

    timerIntervalRef.current = setInterval(() => {
      const remaining = Math.max((end - Date.now()) / 1000, 0);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        handleTypingFinished(false); // Time out!
      }
    }, 50);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [screen, battle.phase, battle.typingTarget, battle.typingStartTime, battle.typingLimitTime]);

  const handleTypingFinished = (isCompleted: boolean) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const hasMistake = battle.typingMistakeCount > 0;
    const isSuccess = isCompleted && !hasMistake;

    // Record typing result
    setGlobalStats((prev) => ({
      ...prev,
      totalWordsTyped: prev.totalWordsTyped + 1,
      successfulWords: prev.successfulWords + (isSuccess ? 1 : 0),
      failedWords: prev.failedWords + (!isSuccess ? 1 : 0),
    }));

    setBattleStats((prev) => ({
      ...prev,
      successfulTypings: prev.successfulTypings + (isSuccess ? 1 : 0),
      failedTypings: prev.failedTypings + (!isSuccess ? 1 : 0),
    }));

    if (battle.phase === 'action_execute') {
      executeActiveCharacterSkill(isCompleted, hasMistake);
    } else {
      executeDefenseFinish(isCompleted, hasMistake);
    }
  };

  // Perform active character skill effect on target
  const executeActiveCharacterSkill = (isCompleted: boolean, hasMistake: boolean) => {
    const char = party[battle.executingCharIndex];
    const skill = battle.selectedSkills[char.id] as (Skill & { targetIdx?: number });
    if (!skill) return;

    let targetIdx = skill.targetIdx ?? 0;
    let baseDamage = 0;
    let healingAmount = 0;
    let msg = '';

    // Damage modifier based on completion & mistakes
    let modifier = 1.0;
    if (!isCompleted) {
      modifier = 0; // failed/timed out completely
    } else if (hasMistake) {
      modifier = 0.8; // slightly weaker on mistakes (e.g. 5 becomes 4)
    }

    if (isCompleted) {
      sound.playSuccess();
    } else {
      sound.playDamage();
    }

    // Process Skills Logic
    if (skill.name === '回転切り') {
      baseDamage = 10 * modifier;
      // Hit target, target-1, target+1
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx || idx === targetIdx - 1 || idx === targetIdx + 1) {
            const finalDamage = Math.floor(baseDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-500 font-extrabold text-xl animate-bounce');
            return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！(ミス時減衰適用: ${hasMistake ? 'あり' : 'なし'})`],
        };
      });
    } else if (skill.name === '炎舞切り') {
      baseDamage = 20 * modifier;
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx) {
            const finalDamage = Math.floor(baseDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-orange-500 font-extrabold text-2xl');
            const isBurned = Math.random() < 0.10;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isBurned: isBurned || (enemy as any).isBurned,
              burnTurns: isBurned ? 3 : (enemy as any).burnTurns,
            };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
        };
      });
    } else if (skill.name === '氷雪切り') {
      baseDamage = 30 * modifier;
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx) {
            const finalDamage = Math.floor(baseDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-sky-400 font-extrabold text-2xl');
            const isFrozen = Math.random() < 0.10;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isFrozen: isFrozen || (enemy as any).isFrozen,
              freezeTurns: isFrozen ? 2 : (enemy as any).freezeTurns,
            };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
        };
      });
    } else if (skill.name === '最終奥義・空間断絶斬') {
      baseDamage = 50 * modifier;
      // Triggers death in 5 turns if character survives
      setParty(prev => prev.map(c => c.id === char.id ? { ...c, ultimateCooldown: 5 } : c));
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx) {
            const finalDamage = Math.floor(baseDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-purple-500 font-extrabold text-3xl');
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              extraBleed: 10,
              bleedTurns: 4,
            };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の 最終奥義！ 5ターン後勇者は力尽きる...`],
        };
      });
    } else if (skill.name === 'ニトロバーン') {
      baseDamage = 10 * modifier;
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx) {
            const finalDamage = Math.floor(baseDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-400 font-bold text-xl');
            const isBurned = Math.random() < 0.20;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isBurned: isBurned || (enemy as any).isBurned,
              burnTurns: isBurned ? 3 : (enemy as any).burnTurns,
            };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
        };
      });
    } else if (skill.name === 'ライトニングブレイカー') {
      baseDamage = 15 * modifier;
      const splashDamage = 10 * modifier;
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          const isMain = idx === targetIdx;
          const isSplash = idx === targetIdx - 1 || idx === targetIdx + 1;
          if (isMain || isSplash) {
            const finalDamage = Math.floor((isMain ? baseDamage : splashDamage) * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-yellow-400 font-extrabold text-xl');
            const isShocked = isMain && Math.random() < 0.20;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isShocked: isShocked || (enemy as any).isShocked,
              shockTurns: isShocked ? 2 : (enemy as any).shockTurns,
            };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
        };
      });
    } else if (skill.name === 'ブリザードマウンテン') {
      baseDamage = 30 * modifier;
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          const dist = Math.abs(idx - targetIdx);
          const rawDamage = Math.max(baseDamage - dist * 10, 0);
          if (rawDamage > 0) {
            const finalDamage = Math.floor(rawDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-cyan-400 font-extrabold text-2xl');
            const isFrozen = Math.random() < 0.20;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isFrozen: isFrozen || (enemy as any).isFrozen,
              freezeTurns: isFrozen ? 2 : (enemy as any).freezeTurns,
            };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
        };
      });
    } else if (skill.name === '最終奥義・エクスプロージョン') {
      baseDamage = 80 * modifier;
      setParty(prev => prev.map(c => {
        if (c.id === char.id) {
          return { ...c, ultimateCooldown: 5, hp: Math.max(c.hp - 15, 0), isDead: c.hp - 15 <= 0 };
        }
        return { ...c, hp: Math.max(c.hp - 15, 0), isDead: c.hp - 15 <= 0 };
      }));
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          const finalDamage = Math.floor(baseDamage * char.atkBuff);
          addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-600 font-extrabold text-3xl animate-ping');
          return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の究極魔法！ 味方にも15ダメージ！5ターン後死亡...`],
        };
      });
    } else if (skill.name === 'オールヒール') {
      healingAmount = 20 * modifier;
      setParty((prev) => prev.map((c) => {
        if (c.isDead) return c;
        const nextHp = Math.min(c.hp + healingAmount, c.maxHp);
        return { ...c, hp: nextHp };
      }));
      addDamageAnim(`+${healingAmount}`, 50, 60, 'text-green-400 font-bold text-2xl');
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
      }));
    } else if (skill.name === 'ヨワクナール') {
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx) {
            addDamageAnim(`攻撃/防御 20% DOWN`, 20 + idx * 30, 25, 'text-yellow-300 font-bold text-sm');
            return { ...enemy, isWeakened: true, weakenTurns: 2 };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} が敵に ${skill.name} をかけた！`],
        };
      });
    } else if (skill.name === 'ツヨクナール') {
      setParty((prev) => prev.map((c, idx) => {
        if (idx === targetIdx && !c.isDead) {
          addDamageAnim(`攻撃/防御 20% UP`, 20 + idx * 20, 65, 'text-green-300 font-bold text-sm');
          return { ...c, atkBuff: 1.2, defBuff: 1.2 }; // lasts 2 turns technically, simplified
        }
        return c;
      }));
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} が ${party[targetIdx]?.name} に ${skill.name} をかけた！`],
      }));
    } else if (skill.name === '最終奥義・ザ・モンクレボリューション') {
      setParty(prev => prev.map(c => {
        const maxBuff = c.id === char.id ? { ...c, ultimateCooldown: 3 } : c;
        return {
          ...maxBuff,
          atkBuff: 1.5,
          defBuff: 1.5,
          hp: c.maxHp,
          isDead: false,
        };
      }));
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy) => ({
          ...enemy,
          isWeakened: true,
          weakenTurns: 3,
        }));
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の究極の祈り！ 味方は全回復し、全ステータス大上昇！3ターン後死亡する...`],
        };
      });
    } else if (skill.name === 'ザ・シールド') {
      const shieldValue = Math.floor(30 * modifier);
      setParty((prev) => prev.map((c) => {
        if (c.id === char.id) {
          return { ...c, shield: c.shield + shieldValue };
        }
        return c;
      }));
      addDamageAnim(`シールド+${shieldValue}`, 80, 70, 'text-blue-400 font-bold text-sm');
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} は ${skill.name} でシールドを展開！`],
      }));
    } else if (skill.name === '挑発') {
      // Directs attacks to warrior for 3 turns
      setParty((prev) => prev.map((c) => {
        if (c.id === char.id) {
          return { ...c, provokeTurns: 3 };
        }
        return c;
      }));
      addDamageAnim(`挑発(3T)`, 80, 70, 'text-red-400 font-bold text-sm');
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} が 挑発 して敵を引きつける！`],
      }));
    } else if (skill.name === 'オールシールド') {
      const shieldValue = Math.floor(20 * modifier);
      setParty((prev) => prev.map((c) => {
        if (c.isDead) return c;
        return { ...c, shield: c.shield + shieldValue };
      }));
      addDamageAnim(`全員シールド+${shieldValue}`, 50, 65, 'text-blue-400 font-bold text-lg');
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！`],
      }));
    } else if (skill.name === '最終奥義・シールドブレイカー') {
      const shieldValue = Math.floor(50 * modifier);
      const enemyDmg = Math.floor(70 * modifier);
      setParty(prev => prev.map(c => {
        const withCooldown = c.id === char.id ? { ...c, ultimateCooldown: 5 } : c;
        if (c.isDead) return c;
        return { ...withCooldown, shield: withCooldown.shield + shieldValue };
      }));
      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          const finalDamage = Math.floor(enemyDmg * char.atkBuff);
          addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-500 font-extrabold text-2xl');
          return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の最終盾技！ 全員に強大なシールドを張り、敵全体を撃破する！5ターン後死亡...`],
        };
      });
    }

    // After action complete, move to next character or Enemy Turn
    setTimeout(() => {
      setBattle((prev) => {
        // Clean up dead enemies instantly
        const aliveEnemies = prev.enemies.filter((e) => e.hp > 0);
        if (aliveEnemies.length === 0) {
          // All enemies dead! Win Battle!
          setTimeout(() => winBattle(), 200);
          return { ...prev, enemies: [] };
        }

        // Find next executing character
        let nextExecIdx = prev.executingCharIndex + 1;
        while (nextExecIdx < party.length && party[nextExecIdx].isDead) {
          nextExecIdx++;
        }

        if (nextExecIdx < party.length) {
          // Trigger next character's typing
          setTimeout(() => startExecutionPhase(), 100);
          return {
            ...prev,
            executingCharIndex: nextExecIdx,
            typingTarget: '',
            typingInput: '',
          };
        } else {
          // All characters executed! Proceed to Enemy Turn!
          setTimeout(() => startEnemyTurnPhase(), 100);
          return {
            ...prev,
            phase: 'enemy_turn',
            enemyAttackingIndex: 0,
            defendingCharIndex: 0,
            currentAttack: null,
            typingTarget: '',
            typingInput: '',
          };
        }
      });
    }, 1500);
  };

  // Enemy Attacks and Guard Typing
  const startEnemyTurnPhase = () => {
    setBattle((prev) => {
      const aliveEnemies = prev.enemies.filter((e) => e.hp > 0);
      if (aliveEnemies.length === 0) {
        setTimeout(() => winBattle(), 100);
        return prev;
      }

      // Find first enemy to attack
      return triggerEnemyAttack(prev, 0);
    });
  };

  const triggerEnemyAttack = (currentBattleState: BattleState, enemyIdx: number): BattleState => {
    const enemy = currentBattleState.enemies[enemyIdx];
    if (!enemy || enemy.hp <= 0) {
      // If no more enemies left, check next or end turn
      return moveNextEnemyOrEnd(currentBattleState, enemyIdx);
    }

    // Apply status conditions on enemies (frozen, etc.)
    if ((enemy as any).isFrozen && (enemy as any).freezeTurns > 0) {
      const nextEnemies = [...currentBattleState.enemies];
      (nextEnemies[enemyIdx] as any).freezeTurns--;
      if ((nextEnemies[enemyIdx] as any).freezeTurns === 0) {
        (nextEnemies[enemyIdx] as any).isFrozen = false;
      }
      addDamageAnim('凍結中！', 20 + enemyIdx * 30, 20, 'text-sky-300 font-bold');
      
      const nextLogs = [...currentBattleState.battleLogs, `${enemy.name} は凍りついているため動けない！`];
      const nextState = { ...currentBattleState, enemies: nextEnemies, battleLogs: nextLogs };
      return moveNextEnemyOrEnd(nextState, enemyIdx);
    }

    // Select random attack
    const attack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
    
    // Choose target (provoked warrior gets priority)
    let targetCharIdx = 0;
    const warriorIdx = party.findIndex(c => c.id === 'warrior');
    if (warriorIdx !== -1 && !party[warriorIdx].isDead && party[warriorIdx].provokeTurns > 0) {
      targetCharIdx = warriorIdx;
    } else {
      // Pick random alive party member
      const aliveIdxs: number[] = [];
      party.forEach((c, idx) => {
        if (!c.isDead) aliveIdxs.push(idx);
      });
      if (aliveIdxs.length === 0) {
        // All party dead, trigger defeat
        setTimeout(() => handleDefeat(), 100);
        return currentBattleState;
      }
      targetCharIdx = aliveIdxs[Math.floor(Math.random() * aliveIdxs.length)];
    }

    const limit = attack.roman.length * 1.0 + 1.5;

    // Trigger defence typing
    return {
      ...currentBattleState,
      enemyAttackingIndex: enemyIdx,
      defendingCharIndex: targetCharIdx,
      currentAttack: attack,
      typingTarget: attack.roman,
      typingInput: '',
      typingStartTime: Date.now(),
      typingLimitTime: limit,
      typingMistakeCount: 0,
      battleLogs: [...currentBattleState.battleLogs, `${enemy.name} が ${attack.name} の構えをとった！`],
    };
  };

  const moveNextEnemyOrEnd = (state: BattleState, currentEnemyIdx: number): BattleState => {
    const nextIdx = currentEnemyIdx + 1;
    if (nextIdx < state.enemies.length) {
      // Delay slightly and trigger next enemy attack
      setTimeout(() => {
        setBattle((prev) => triggerEnemyAttack(prev, nextIdx));
      }, 1000);
      return {
        ...state,
        typingTarget: '',
        typingInput: '',
      };
    } else {
      // All enemies finished attacking. Tick status effects, then go to next turn!
      setTimeout(() => endTurnAndStartNext(), 1000);
      return {
        ...state,
        typingTarget: '',
        typingInput: '',
      };
    }
  };

  const executeDefenseFinish = (isCompleted: boolean, hasMistake: boolean) => {
    const enemy = battle.enemies[battle.enemyAttackingIndex];
    const attack = battle.currentAttack;
    const defender = party[battle.defendingCharIndex];

    if (!attack) return;

    let baseDamage = attack.damage;
    
    // Check defense outcome
    let finalDmg = baseDamage;
    if (isCompleted && !hasMistake) {
      sound.playSuccess();
      finalDmg = Math.floor(baseDamage * 0.2); // Just guard reduces damage to 20%
      addDamageAnim('ガード成功！', 20 + battle.defendingCharIndex * 20, 60, 'text-green-400 font-extrabold shadow');
    } else if (isCompleted && hasMistake) {
      sound.playKeyWrong();
      finalDmg = Math.floor(baseDamage * 0.6); // guard with mistakes reduces damage to 60%
      addDamageAnim('ガード不完全', 20 + battle.defendingCharIndex * 20, 60, 'text-yellow-400 font-semibold shadow');
    } else {
      sound.playDamage();
      addDamageAnim('ガード失敗！', 20 + battle.defendingCharIndex * 20, 50, 'text-red-500 font-extrabold text-2xl shadow animate-bounce');
    }

    // Process target damage (or support effects like summon)
    if (attack.effect === 'summon') {
      // Demon King summons a random monster of current stage!
      setBattle((prev) => {
        const templates = STAGES[stageIndex].monsterTemplates;
        const spawned = JSON.parse(JSON.stringify(templates[Math.floor(Math.random() * templates.length)]));
        // Push to enemies
        const nextEnemies = [...prev.enemies, spawned];
        addDamageAnim('召喚！', 50, 20, 'text-purple-400 font-bold');
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `魔王 が ${spawned.name} を召喚した！`],
        };
      });
    } else if (attack.name === 'ふぶき' || attack.name === 'すべりつつき' || attack.name === '回転斬り' || attack.name === '火を吹く' || attack.name === 'メテオストライク' || attack.effect === 'debuff_atk') {
      // Hit everyone!
      setParty((prev) => prev.map((char) => {
        if (char.isDead) return char;
        
        // Debuff only
        if (attack.effect === 'debuff_atk') {
          return { ...char, atkBuff: Math.max(char.atkBuff - 0.1, 0.5) };
        }

        let damageToTake = finalDmg;
        let nextShield = char.shield;
        if (nextShield > 0) {
          if (nextShield >= damageToTake) {
            nextShield -= damageToTake;
            damageToTake = 0;
          } else {
            damageToTake -= nextShield;
            nextShield = 0;
          }
        }

        const nextHp = Math.max(char.hp - damageToTake, 0);
        return {
          ...char,
          hp: nextHp,
          isDead: nextHp <= 0,
          shield: nextShield,
        };
      }));

      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${enemy.name} の全体攻撃 ${attack.name}！`],
      }));
    } else {
      // Single target attack
      setParty((prev) => prev.map((char, idx) => {
        if (idx === battle.defendingCharIndex) {
          let damageToTake = finalDmg;
          let nextShield = char.shield;
          if (nextShield > 0) {
            if (nextShield >= damageToTake) {
              nextShield -= damageToTake;
              damageToTake = 0;
            } else {
              damageToTake -= nextShield;
              nextShield = 0;
            }
          }

          const nextHp = Math.max(char.hp - damageToTake, 0);
          return {
            ...char,
            hp: nextHp,
            isDead: nextHp <= 0,
            shield: nextShield,
          };
        }
        return char;
      }));

      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${enemy.name} の ${attack.name}！`],
      }));
    }

    // Proceed to next enemy or end phase
    setTimeout(() => {
      // Check if party is defeated completely
      const anySurvivor = party.some(c => !c.isDead);
      if (!anySurvivor) {
        handleDefeat();
        return;
      }

      setBattle((prev) => moveNextEnemyOrEnd(prev, prev.enemyAttackingIndex));
    }, 1200);
  };

  const endTurnAndStartNext = () => {
    // Tick status effects like burn, frost, and ultimate limits
    setParty((prevParty) => {
      return prevParty.map((char) => {
        if (char.isDead) return char;

        let nextHp = char.hp;
        let isDead = char.isDead;
        let nextCooldown = char.ultimateCooldown;

        // Provoke turn ticks
        let nextProvoke = Math.max(char.provokeTurns - 1, 0);

        // Ultimate countdown tick
        if (nextCooldown > 0) {
          nextCooldown--;
          if (nextCooldown === 0) {
            nextHp = 0;
            isDead = true;
            addDamageAnim('最終奥義の副作用！', 50, 70, 'text-purple-600 font-extrabold text-xl');
          }
        }

        return {
          ...char,
          hp: nextHp,
          isDead,
          ultimateCooldown: nextCooldown,
          provokeTurns: nextProvoke,
        };
      });
    });

    setBattle((prev) => {
      // Apply bleed / poison damages to enemies
      const nextEnemies = prev.enemies.map((enemy) => {
        let currentHp = enemy.hp;
        if (currentHp <= 0) return enemy;

        let bleed = 0;
        let burn = 0;

        if ((enemy as any).isBurned && (enemy as any).burnTurns > 0) {
          burn = 3;
          (enemy as any).burnTurns--;
          if ((enemy as any).burnTurns === 0) (enemy as any).isBurned = false;
        }

        if ((enemy as any).extraBleed && (enemy as any).bleedTurns > 0) {
          bleed = 10;
          (enemy as any).bleedTurns--;
        }

        const nextHp = Math.max(currentHp - (burn + bleed), 0);
        if (burn + bleed > 0) {
          addDamageAnim(`-${burn + bleed} (状態異常)`, 50, 20, 'text-orange-400 font-bold');
        }

        return {
          ...enemy,
          hp: nextHp,
        };
      });

      // Clear action selection, increment turn
      return {
        ...prev,
        enemies: nextEnemies.filter(e => e.hp > 0),
        currentTurn: prev.currentTurn + 1,
        phase: 'action_select',
        currentCharIndex: getFirstAliveCharIndex(),
        selectedSkills: {},
        currentAttack: null,
      };
    });
  };

  const winBattle = () => {
    setBattle((prev) => ({
      ...prev,
      phase: 'battle_result',
    }));
  };

  const handleDefeat = () => {
    setBattle((prev) => ({
      ...prev,
      phase: 'game_over',
    }));
  };

  const restartCurrentStage = () => {
    // Revive and heal party, but levels and skills are preserved
    setParty((prev) => 
      prev.map((c) => ({
        ...c,
        hp: c.maxHp,
        isDead: false,
        atkBuff: 1.0,
        defBuff: 1.0,
        provokeTurns: 0,
        ultimateCooldown: 0,
        shield: 0,
      }))
    );
    // Reset stage map entities
    setStageIndex((prev) => prev); // force reload map entities
    setScreen('explore');
  };

  const restartWholeGame = () => {
    setParty(createParty(1));
    setStageIndex(0);
    setScreen('start');
  };

  // Render Helper functions for highlights in typing words
  const renderTypingText = () => {
    const target = battle.typingTarget;
    const input = battle.typingInput;
    const kana = ROMAN_TO_KANA[target];

    let displayTarget = target;
    let matchCount = input.length;

    if (kana) {
      const result = checkTypingPrefix(kana, input);
      const remainingKana = kana.slice(result.matchedKanaCount);
      displayTarget = input + kanaToStandardRoman(remainingKana);
      matchCount = input.length;
    }

    return (
      <div className="font-mono text-2xl tracking-wider text-center p-4 bg-slate-900/80 border border-slate-700 rounded-lg shadow-inner max-w-xl mx-auto my-3 relative overflow-hidden">
        {displayTarget.split('').map((char, index) => {
          let colorClass = 'text-slate-500';
          let borderClass = '';
          if (index < matchCount) {
            colorClass = 'text-green-400 font-extrabold drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]';
          } else if (index === matchCount) {
            colorClass = 'text-yellow-300 animate-pulse font-bold bg-yellow-500/10 rounded';
            borderClass = 'border-b-2 border-yellow-300';
          }
          return (
            <span key={index} className={`${colorClass} ${borderClass} px-0.5 transition-all`}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Damage/Healing Animations overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {damageAnimations.map((anim) => (
          <div
            key={anim.id}
            style={{ left: `${anim.x}%`, top: `${anim.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${anim.colorClass}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.6 }}
              animate={{ opacity: 1, y: -25, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              {anim.text}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Header Container */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Sword className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              TYPING LEGEND
            </h1>
            <p className="text-xs text-slate-400 font-mono">2D Retro RPG Typing Adventure</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-mono flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Stage {stageIndex + 1}: {STAGES[stageIndex]?.name}
          </div>

          <button
            onClick={() => setSoundOn(!soundOn)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title={soundOn ? 'ミュートする' : '音声をONにする'}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
          </button>
        </div>
      </header>

      {/* Main Screen Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* SCREEN: START SCREEN */}
          {screen === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="text-7xl mb-6 select-none animate-bounce">⚔️👑🏰</div>
              
              <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-mono">
                タイピング・レジェンド
              </h2>
              <p className="text-indigo-300 text-sm font-medium mb-6">
                ~ 勇者のタイピングで世界を救うコマンドRPG ~
              </p>

              <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg text-left text-sm text-slate-300 space-y-2 mb-8 font-sans">
                <div className="flex gap-2 font-bold text-indigo-400 border-b border-slate-800 pb-1 items-center">
                  <Info className="h-4 w-4" /> ゲームの基本ルール
                </div>
                <p>・十字キーまたは画面タップで勇者を操作し、マップの敵と戦おう！</p>
                <p>・戦闘時は、表示されるローマ字を**制限時間内**にタイピングして攻撃！</p>
                <p>・敵の攻撃ターンでは、敵の技名をタイピングして**防御（ダメージ激減）**！</p>
                <p>・1文字も間違えずに完遂すると最大ダメージ、ミスがあると効果が減衰します。</p>
                <p>・各ステージのモンスターを一掃すると次のステージへのポータルが解放！</p>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-8">
                {createParty(1).map((char) => (
                  <div key={char.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center">
                    <span className="text-2xl block mb-1">{char.avatar}</span>
                    <span className="text-xs font-bold block truncate text-slate-200">{char.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-indigo-300 bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-900/50 inline-block mt-1 font-mono">
                      {char.role === 'hero' ? '勇者' : char.role === 'mage' ? '魔法使' : char.role === 'priest' ? '僧侶' : '戦士'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  sound.playSuccess();
                  setScreen('explore');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 text-lg flex items-center justify-center gap-2"
              >
                冒険をはじめる
                <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* SCREEN: EXPLORE SCREEN */}
          {screen === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-3 gap-6 items-start"
            >
              {/* Left Column: Map Board */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-indigo-400" />
                    <span className="font-extrabold text-white">2Dエリアマップ</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    残りのモンスター: {mapEntities.filter((e) => e.type === 'monster').length} 匹
                  </div>
                </div>

                {/* 2D Map Grid (9x9) */}
                <div className={`grid grid-cols-9 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden w-full max-w-md aspect-square ${STAGES[stageIndex]?.bgColor}`}>
                  {Array.from({ length: 9 }).map((_, rIdx) => (
                    <React.Fragment key={rIdx}>
                      {Array.from({ length: 9 }).map((_, cIdx) => {
                        const isPlayer = playerPos.x === cIdx && playerPos.y === rIdx;
                        const entity = mapEntities.find((e) => e.x === cIdx && e.y === rIdx);
                        const isPortal = entity?.type === 'portal';
                        const isMonster = entity?.type === 'monster';
                        const isObstacle = entity?.type === 'obstacle';

                        // Portal unlocks visually if no monsters remain
                        const portalLocked = mapEntities.some((e) => e.type === 'monster');

                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`relative aspect-square rounded flex items-center justify-center text-xl cursor-pointer select-none transition-colors border border-slate-900/10 ${STAGES[stageIndex]?.tileColor} hover:brightness-110`}
                            onClick={() => {
                              // Click movement support
                              const dx = cIdx - playerPos.x;
                              const dy = rIdx - playerPos.y;
                              if (Math.abs(dx) + Math.abs(dy) === 1) {
                                handleMapMovement(dx, dy);
                              }
                            }}
                          >
                            {/* Player sprite */}
                            {isPlayer && (
                              <motion.span
                                layoutId="playerSprite"
                                className="z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                              >
                                👦
                              </motion.span>
                            )}

                            {/* Entity Sprites */}
                            {!isPlayer && isObstacle && (
                              <span className="scale-95 filter drop-shadow">{entity.avatar}</span>
                            )}
                            {!isPlayer && isMonster && (
                              <motion.span
                                animate={{ scale: [0.95, 1.05, 0.95] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="z-10 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.4)] text-2xl"
                              >
                                {entity.avatar}
                              </motion.span>
                            )}
                            {!isPlayer && isPortal && (
                              <span className={`text-2xl ${portalLocked ? 'opacity-40 brightness-50' : 'animate-pulse'}`}>
                                {portalLocked ? '🔒' : '🔮'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {/* Mobile/Gamepad navigation buttons */}
                <div className="mt-4 flex flex-col items-center gap-1 w-full max-w-xs md:hidden">
                  <button
                    onClick={() => handleMapMovement(0, -1)}
                    className="w-12 h-12 bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center font-bold"
                  >
                    ▲
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleMapMovement(-1, 0)}
                      className="w-12 h-12 bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center font-bold"
                    >
                      ◀
                    </button>
                    <div className="w-12"></div>
                    <button
                      onClick={() => handleMapMovement(1, 0)}
                      className="w-12 h-12 bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center font-bold"
                    >
                      ▶
                    </button>
                  </div>
                  <button
                    onClick={() => handleMapMovement(0, 1)}
                    className="w-12 h-12 bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center font-bold"
                  >
                    ▼
                  </button>
                </div>

                <div className="mt-4 text-xs text-slate-400 font-mono text-center space-y-1">
                  <p>キーボードの <span className="text-indigo-400 font-bold border border-slate-700 px-1 py-0.5 rounded">↑ ↓ ← →</span> または <span className="text-indigo-400 font-bold border border-slate-700 px-1 py-0.5 rounded">W A S D</span> で移動</p>
                  <p>（マップを直接クリックすることでも1マス移動できます）</p>
                </div>
              </div>

              {/* Right Column: Party Summary & Instructions */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                    <span className="font-extrabold text-white">現在のパーティー状態</span>
                  </div>

                  <div className="space-y-3">
                    {party.map((char) => (
                      <div key={char.id} className="bg-slate-950/60 p-3 border border-slate-800 rounded-xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{char.avatar}</span>
                            <div>
                              <span className="text-xs font-bold text-slate-200 block leading-tight">{char.name.split(' ')[0]}</span>
                              <span className="text-[10px] text-slate-400 font-mono">LV {char.level}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-bold font-mono ${char.isDead ? 'text-rose-500' : 'text-slate-200'}`}>
                            {char.isDead ? '死亡' : `${char.hp} / ${char.maxHp}`}
                          </span>
                        </div>
                        
                        {/* HP Bar */}
                        <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              char.isDead ? 'bg-transparent' : char.hp / char.maxHp < 0.3 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${char.isDead ? 0 : (char.hp / char.maxHp) * 100}%` }}
                          />
                        </div>

                        {/* Shields or custom ultimate counts */}
                        {char.shield > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] bg-blue-950/40 text-blue-400 border border-blue-900/60 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                              🛡️ シールド: +{char.shield}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" /> ステージ遷移のルール
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    すべての 👾 モンスターを討伐すると、北に配置されているポータル 🔮 が起動します。
                    ポータルを踏むと次のステージへ進むことができ、進んだ瞬間に**レベルアップ & 死亡含む全員の体力が全回復**します！
                  </p>
                </div>
              </div>

            </motion.div>
          )}

          {/* SCREEN: BATTLE SCREEN */}
          {screen === 'battle' && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-6"
            >
              {/* Battle Arena View (Split Row: Monsters & Player Party) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[350px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/30 pointer-events-none"></div>

                {/* Upper row: Enemies */}
                <div className="flex justify-around items-center py-4 relative z-10 gap-4">
                  {battle.enemies.map((enemy, idx) => {
                    const isTargeted = isChoosingTarget && pendingSkill;
                    const isWeak = (enemy as any).isWeakened;
                    const isBurn = (enemy as any).isBurned;
                    const isFrost = (enemy as any).isFrozen;

                    return (
                      <motion.div
                        key={`${enemy.name}-${idx}`}
                        className={`p-4 border rounded-xl flex flex-col items-center w-40 text-center transition-all relative ${
                          enemy.hp <= 0 ? 'opacity-20 border-slate-800 bg-slate-950/30' : 'bg-slate-950 border-slate-800'
                        } ${isTargeted && enemy.hp > 0 ? 'ring-4 ring-indigo-500 animate-pulse cursor-pointer' : ''}`}
                        onClick={() => {
                          if (isTargeted && enemy.hp > 0) {
                            submitChosenAction(idx);
                          }
                        }}
                      >
                        {/* Status condition indicators */}
                        <div className="absolute -top-2 flex gap-1">
                          {isBurn && <span className="bg-orange-600 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 text-white">🔥 燃</span>}
                          {isFrost && <span className="bg-sky-600 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 text-white">❄️ 凍</span>}
                          {isWeak && <span className="bg-yellow-600 text-[10px] font-bold px-1 rounded text-white">☠️ 弱</span>}
                        </div>

                        {/* Active Attack Pointer */}
                        {battle.phase === 'enemy_turn' && battle.enemyAttackingIndex === idx && (
                          <div className="absolute -top-8 text-rose-500 font-extrabold animate-bounce text-sm bg-rose-950 px-2 py-0.5 rounded border border-rose-800 shadow">
                            攻撃中！🗡️
                          </div>
                        )}

                        <span className="text-5xl block mb-2">{enemy.hp > 0 ? enemy.avatar : '💀'}</span>
                        <span className="text-xs font-extrabold block text-slate-200 leading-tight">{enemy.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({enemy.romanName})</span>

                        {/* Health Bar */}
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mt-3">
                          <div
                            className="h-full bg-rose-500 transition-all duration-300"
                            style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold mt-1 text-slate-400">
                          HP: {enemy.hp} / {enemy.maxHp}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Middle line/divider logs */}
                <div className="my-2 bg-slate-950/80 px-4 py-2 border-y border-slate-800/80 max-h-16 overflow-y-auto text-xs text-slate-300 font-mono space-y-1">
                  {battle.battleLogs.slice(-2).map((log, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-indigo-400 font-bold">▶</span> {log}
                    </div>
                  ))}
                </div>

                {/* Lower row: Player Party Members */}
                <div className="flex justify-around items-center py-3 relative z-10 gap-2">
                  {party.map((char, idx) => {
                    const isTargetedForSupport = isChoosingTarget && pendingSkill && 
                      (pendingSkill.skill.name === 'ツヨクナール');
                    const isProvoking = char.provokeTurns > 0;
                    const isUltimateCharging = char.ultimateCooldown > 0;

                    return (
                      <div
                        key={char.id}
                        className={`p-3 border rounded-xl flex flex-col items-center w-36 text-center transition-all relative ${
                          char.isDead ? 'border-red-900 bg-red-950/10 opacity-30' : 'bg-slate-950 border-slate-800'
                        } ${
                          battle.phase === 'action_select' && battle.currentCharIndex === idx && !char.isDead
                            ? 'ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/10 scale-105'
                            : ''
                        } ${
                          battle.phase === 'action_execute' && battle.executingCharIndex === idx
                            ? 'ring-2 ring-emerald-400 shadow-lg scale-105'
                            : ''
                        } ${
                          battle.phase === 'enemy_turn' && battle.defendingCharIndex === idx
                            ? 'ring-2 ring-rose-500 animate-pulse'
                            : ''
                        } ${isTargetedForSupport && !char.isDead ? 'ring-4 ring-green-500 cursor-pointer' : ''}`}
                        onClick={() => {
                          if (isTargetedForSupport && !char.isDead) {
                            submitChosenAction(idx);
                          }
                        }}
                      >
                        {/* Ultimate timer badge */}
                        {isUltimateCharging && (
                          <div className="absolute -top-2 bg-purple-600 text-[10px] font-extrabold px-1.5 rounded text-white shadow">
                            崩壊まで: {char.ultimateCooldown}T
                          </div>
                        )}
                        {isProvoking && (
                          <div className="absolute -top-2 bg-rose-600 text-[10px] font-bold px-1.5 rounded text-white shadow">
                            挑発中
                          </div>
                        )}

                        <span className="text-3xl block mb-1">{char.isDead ? '💀' : char.avatar}</span>
                        <span className="text-xs font-bold block text-slate-200 leading-tight">{char.name.split(' ')[0]}</span>
                        <span className="text-[9px] text-slate-500 font-mono">LV {char.level}</span>

                        {/* HP status value */}
                        <span className="text-[10px] font-mono font-bold mt-1.5 text-slate-300">
                          {char.hp} / {char.maxHp}
                        </span>

                        {/* Shield Badge */}
                        {char.shield > 0 && (
                          <span className="text-[9px] font-mono text-blue-400 bg-blue-950 border border-blue-900/60 px-1 rounded-full mt-1">
                            🛡️ +{char.shield}
                          </span>
                        )}

                        {/* HP Bar */}
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800 mt-2">
                          <div
                            className={`h-full transition-all duration-300 ${
                              char.isDead ? 'bg-transparent' : char.hp / char.maxHp < 0.3 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${char.isDead ? 0 : (char.hp / char.maxHp) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase Controller Panels */}
              <AnimatePresence mode="wait">

                {/* PHASE 1: ACTION SELECTION COMMAND BOARD */}
                {battle.phase === 'action_select' && (
                  <motion.div
                    key="action_select_panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{party[battle.currentCharIndex]?.avatar}</span>
                        <div>
                          <span className="font-extrabold text-white text-sm">{party[battle.currentCharIndex]?.name}</span>
                          <span className="text-xs text-slate-400 block font-mono">行動コマンド選択</span>
                        </div>
                      </div>
                      
                      {isChoosingTarget && (
                        <button
                          onClick={() => {
                            setIsChoosingTarget(false);
                            setPendingSkill(null);
                          }}
                          className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-slate-300"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> 選択し直す
                        </button>
                      )}
                    </div>

                    {!isChoosingTarget ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {party[battle.currentCharIndex]?.skills.map((skill) => {
                          const meetsReq = party[battle.currentCharIndex].level >= skill.levelRequired;
                          return (
                            <button
                              key={skill.name}
                              disabled={!meetsReq}
                              onClick={() => selectSkillForChar(skill)}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between h-22 ${
                                meetsReq
                                  ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60'
                                  : 'bg-slate-950/20 border-slate-900/50 opacity-40 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className={`text-sm font-bold ${meetsReq ? 'text-indigo-300' : 'text-slate-500'}`}>
                                  {skill.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {skill.roman}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1 leading-relaxed">
                                {skill.desc}
                              </p>
                              {!meetsReq && (
                                <span className="absolute inset-0 bg-slate-950/90 flex items-center justify-center font-bold text-xs text-rose-400 font-mono border border-slate-800">
                                  レベル {skill.levelRequired} で解放
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-3xl block animate-bounce mb-3">🎯</span>
                        <h4 className="font-extrabold text-white mb-1 text-base">対象（ターゲット）を選択してください</h4>
                        <p className="text-xs text-slate-400">
                          上部の戦場画面にいるモンスター、あるいはパーティーメンバーを直接タップしてください。
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* PHASE 2: TYPING GAME BOARD (ATTACK AND GUARD EXECUTION) */}
                {(battle.phase === 'action_execute' || battle.phase === 'enemy_turn') && (
                  <motion.div
                    key="typing_board"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-center space-y-4"
                  >
                    {/* Progress limit bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-75"
                        style={{ width: `${(timeLeft / battle.typingLimitTime) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      {battle.phase === 'action_execute' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{party[battle.executingCharIndex]?.avatar}</span>
                          <div className="text-left">
                            <span className="font-bold text-slate-200 block text-sm">
                              {party[battle.executingCharIndex]?.name} のワザ詠唱
                            </span>
                            <span className="text-xs text-indigo-400 font-mono">
                              発動ワザ: 「{battle.selectedSkills[party[battle.executingCharIndex]?.id]?.name}」
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🛡️</span>
                          <div className="text-left">
                            <span className="font-bold text-rose-400 block text-sm">
                              緊急防御タイピング！
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              防ぐ攻撃: 「{battle.currentAttack?.name}」
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-mono">制限時間</span>
                        <span className="text-lg font-bold font-mono text-indigo-400">
                          {timeLeft.toFixed(1)}s
                        </span>
                      </div>
                    </div>

                    {/* Rendering the highlight word typing board */}
                    {renderTypingText()}

                    {/* Tip instructions */}
                    <div className="text-[11px] text-slate-500 font-mono max-w-md mx-auto">
                      <p>
                        ローマ字で上の通りにタイピングしてください（キーボードを直接入力）。
                        ミスタイプがあると「{battle.phase === 'action_execute' ? '与える効果が弱くなります' : '被弾ダメージが多くなります'}」。
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 3: BATTLE RESULT (VICTORY MODAL) */}
                {battle.phase === 'battle_result' && (
                  <motion.div
                    key="battle_victory_panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl space-y-6"
                  >
                    <div className="text-6xl animate-pulse">👑✨⚔️</div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-white font-mono">戦闘勝利！</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        出現したすべての敵の討伐に成功しました！
                      </p>
                    </div>

                    {/* Stats summary of this single battle */}
                    <div className="bg-slate-950 p-5 rounded-xl max-w-md mx-auto border border-slate-800 text-left space-y-3 font-mono">
                      <div className="text-xs text-indigo-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
                        <Award className="h-4 w-4" /> 戦闘タイピングスタッツ
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-300">
                        <span>合計打鍵数 (キーストローク):</span>
                        <span className="text-right text-white font-extrabold">{battleStats.keystrokes} 回</span>
                        
                        <span>成功タイピング (ノーミス):</span>
                        <span className="text-right text-green-400 font-bold">{battleStats.successfulTypings} 回</span>
                        
                        <span>ミス/タイムアウト数:</span>
                        <span className="text-right text-rose-400 font-bold">{battleStats.failedTypings} 回</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sound.playSuccess();
                        setScreen('explore');
                      }}
                      className="w-full max-w-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 text-base mx-auto flex items-center justify-center gap-2"
                    >
                      マップ探索に戻る
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}

                {/* PHASE 4: DEFEAT / GAME OVER SCREEN */}
                {battle.phase === 'game_over' && (
                  <motion.div
                    key="battle_defeat_panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl space-y-6"
                  >
                    <div className="text-6xl animate-bounce">💀🏜️🥀</div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-rose-500 font-mono">全員敗北...</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        パーティー全員のHPが0になってしまいました。
                      </p>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl text-left text-xs text-slate-300 max-w-md mx-auto">
                      <strong>💡 コンティニュー特典:</strong> <br />
                      レベル、覚えたワザ、すべてのステータスはそのままで、挑戦中のステージの最初からやり直すことができます！
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <button
                        onClick={restartCurrentStage}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        ステージの最初から再開
                      </button>
                      <button
                        onClick={restartWholeGame}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-sm flex items-center justify-center gap-1"
                      >
                        タイトルへ戻る
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

          {/* SCREEN: GAME CLEAR (VICTORY SHOWCASE) */}
          {screen === 'game_clear' && (
            <motion.div
              key="game_clear"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500"></div>

              <div className="text-7xl animate-bounce select-none">🏆🌟🎉👑</div>

              <h2 className="text-3xl font-extrabold text-yellow-400 font-mono tracking-tight">
                世界に光が戻った！
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                勇者、魔法使い、僧侶、戦士の伝説のタイピングにより、
                邪悪なる魔王の討伐に完全成功しました！世界に平和が訪れました。
              </p>

              {/* Ultimate Keyboard Stats Details */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-left space-y-4 font-mono">
                <div className="text-xs text-yellow-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> 最終タイピング統計結果
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 text-sm text-slate-300">
                  <span>合計打鍵数 (キーストローク):</span>
                  <span className="text-right text-white font-extrabold">{globalStats.totalKeystrokes} 回</span>
                  
                  <span>入力正解数 / ミスキー数:</span>
                  <span className="text-right font-bold">
                    <span className="text-green-400">{globalStats.correctKeys}</span> / <span className="text-rose-400">{globalStats.missedKeys}</span>
                  </span>

                  <span>タイピング成功率:</span>
                  <span className="text-right text-indigo-400 font-bold">
                    {globalStats.totalKeystrokes > 0 
                      ? `${((globalStats.correctKeys / globalStats.totalKeystrokes) * 100).toFixed(1)}%` 
                      : '0%'}
                  </span>

                  <span>総単語タイピング試行:</span>
                  <span className="text-right text-slate-200">
                    {globalStats.totalWordsTyped} 回（完遂 {globalStats.successfulWords}）
                  </span>

                  <span>合計冒険時間:</span>
                  <span className="text-right text-white font-bold">
                    {((globalStats.elapsedTimeMs || 0) / 1000).toFixed(1)} 秒
                  </span>
                </div>

                {/* Most Mistyped Keys */}
                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-xs text-slate-400 block mb-2">特に間違えやすかったキー (ワースト):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(globalStats.mistakeMap).length > 0 ? (
                      Object.entries(globalStats.mistakeMap)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .slice(0, 5)
                        .map(([key, count]) => (
                          <span key={key} className="bg-rose-950/50 border border-rose-900/50 text-rose-400 text-xs px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1 shadow-inner">
                            <span className="bg-rose-500/20 px-1 rounded text-white">{key.toUpperCase()}</span>: {count}回
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-green-400 font-bold">ミスタイプなし！完璧な正確さです！</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={restartWholeGame}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 text-base flex items-center justify-center gap-1"
              >
                最初からもう一度あそぶ
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer / Credits */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 text-center text-[10px] text-slate-600 font-mono">
        <p>© 2026 TYPING LEGEND. Made with Love by AI & Human Craftsmanship.</p>
      </footer>
    </div>
  );
}
