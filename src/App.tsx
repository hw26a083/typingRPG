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

  playKeySuccess() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
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

const ORIGINAL_STABLE_URL = "https://ais-pre-lxpvyvsmpia4dogk37sgay-561811395117.asia-northeast1.run.app";

// コピー先や共有時のベースURLを考慮したパスを解決するヘルパー関数
const getPortableImagePath = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('/image/')) {
    // 現在のオリジンが、元の開発/共有環境（lxpvyvsmpia4dogk37sgay）またはローカル環境でない場合、
    // コピー先（Remix先）とみなして元の安定したURLから直接画像を読み込みます。
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const isOriginalOrLocal = 
      currentHost.includes('lxpvyvsmpia4dogk37sgay') || 
      currentHost === 'localhost' || 
      currentHost === '127.0.0.1' ||
      currentHost === '';

    if (!isOriginalOrLocal) {
      return `${ORIGINAL_STABLE_URL}${path}`;
    }
    return `.${path}`;
  }
  return path;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.currentTarget;
  const rawPath = img.getAttribute('data-rawpath');
  if (rawPath && !img.src.startsWith(ORIGINAL_STABLE_URL)) {
    img.src = `${ORIGINAL_STABLE_URL}${rawPath}`;
  }
};

const renderAvatar = (avatar: string, className: string = "", isDead: boolean = false, role?: string) => {
  let displaySrc = avatar;
  if (isDead) {
    if (role === 'hero') displaySrc = '/image/grave_hero.png';
    else if (role === 'mage') displaySrc = '/image/grave_mage.png';
    else if (role === 'priest') displaySrc = '/image/grave_priest.png';
    else if (role === 'warrior') displaySrc = '/image/grave_fighter.png';
    else displaySrc = '/image/grave_monster.png';
  }

  if (displaySrc && (displaySrc.startsWith('/image/') || displaySrc.includes('.png'))) {
    return (
      <img
        src={getPortableImagePath(displaySrc)}
        data-rawpath={displaySrc}
        onError={handleImageError}
        className={`${className} object-contain inline-block`}
        alt="avatar"
        referrerPolicy="no-referrer"
      />
    );
  }
  return <span className={className}>{displaySrc}</span>;
};

// Create Initial Party Members
const createParty = (level: number = 1): Character[] => [
  {
    id: 'hero',
    name: '勇者',
    role: 'hero',
    avatar: '/image/hero.png',
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
    skillCooldowns: {},
  },
  {
    id: 'mage',
    name: '魔法使い',
    role: 'mage',
    avatar: '/image/mage.png',
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
    skillCooldowns: {},
  },
  {
    id: 'priest',
    name: '僧侶',
    role: 'priest',
    avatar: '/image/priest.png',
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
    skillCooldowns: {},
  },
  {
    id: 'warrior',
    name: '戦士',
    role: 'warrior',
    avatar: '/image/warrior.png',
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
    skillCooldowns: {},
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
  'saisyuuougi・kuukandanzetuzann': 'さいしゅうおうぎ・くうかんだんぜつざん',
  'nitoroba-n': 'にとろばーん',
  'raitoningbureika-': 'らいとにんぐぶれいかー',
  'buriza-domaunten': 'ぶりざーどまうんてん',
  'saisyuuougi・ekusupuro-zyon': 'さいしゅうおうぎ・えくすぷろーじょん',
  'o-ruhi-ru': 'おーるひーる',
  'hi-ru': 'ひーる',
  'tataku': 'たたく',
  'onodekiru': 'おのできる',
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
  matchedInputLen: number;
} {
  if (input === "") {
    return {
      isValid: true,
      isComplete: false,
      nextKeys: getNextKeysForKana(kana, 0),
      matchedKanaCount: 0,
      matchedInputLen: 0,
    };
  }

  interface QueueItem {
    kanaPos: number;
    inputPos: number;
    lastCompletedKanaPos: number;
    lastCompletedInputPos: number;
  }

  const results: { 
    kanaPos: number; 
    isComplete: boolean; 
    lastCompletedKanaPos: number; 
    lastCompletedInputPos: number; 
  }[] = [];
  
  const queue: QueueItem[] = [{ 
    kanaPos: 0, 
    inputPos: 0, 
    lastCompletedKanaPos: 0, 
    lastCompletedInputPos: 0 
  }];
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
        lastCompletedKanaPos: curr.lastCompletedKanaPos,
        lastCompletedInputPos: curr.lastCompletedInputPos,
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
      queue.push({ 
        kanaPos: curr.kanaPos + 1, 
        inputPos: curr.inputPos,
        lastCompletedKanaPos: curr.kanaPos + 1,
        lastCompletedInputPos: curr.inputPos,
      });
      
      // 入力されたパス
      if (nextChar === '・' || nextChar === '/' || nextChar === ' ' || nextChar === '-') {
        queue.push({ 
          kanaPos: curr.kanaPos + 1, 
          inputPos: curr.inputPos + 1,
          lastCompletedKanaPos: curr.kanaPos + 1,
          lastCompletedInputPos: curr.inputPos + 1,
        });
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
            queue.push({ 
              kanaPos: curr.kanaPos + kanaConsumed, 
              inputPos: curr.inputPos + doubleRoman.length,
              lastCompletedKanaPos: curr.kanaPos + kanaConsumed,
              lastCompletedInputPos: curr.inputPos + doubleRoman.length,
            });
          } else if (doubleRoman.startsWith(inputPart)) {
            queue.push({ 
              kanaPos: curr.kanaPos, 
              inputPos: curr.inputPos + inputPart.length,
              lastCompletedKanaPos: curr.lastCompletedKanaPos,
              lastCompletedInputPos: curr.lastCompletedInputPos,
            });
          }
        }
      }
      
      const xtsuCandidates = ['xtsu', 'ltsu', 'xtu', 'ltu'];
      for (const cand of xtsuCandidates) {
        if (inputPart.startsWith(cand)) {
          queue.push({ 
            kanaPos: curr.kanaPos + 1, 
            inputPos: curr.inputPos + cand.length,
            lastCompletedKanaPos: curr.kanaPos + 1,
            lastCompletedInputPos: curr.inputPos + cand.length,
          });
        } else if (cand.startsWith(inputPart)) {
          queue.push({ 
            kanaPos: curr.kanaPos, 
            inputPos: curr.inputPos + inputPart.length,
            lastCompletedKanaPos: curr.lastCompletedKanaPos,
            lastCompletedInputPos: curr.lastCompletedInputPos,
          });
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
        queue.push({ 
          kanaPos: curr.kanaPos + 1, 
          inputPos: curr.inputPos + 2,
          lastCompletedKanaPos: curr.kanaPos + 1,
          lastCompletedInputPos: curr.inputPos + 2,
        });
      } else if ('nn'.startsWith(inputPart)) {
        queue.push({ 
          kanaPos: curr.kanaPos, 
          inputPos: curr.inputPos + inputPart.length,
          lastCompletedKanaPos: curr.lastCompletedKanaPos,
          lastCompletedInputPos: curr.lastCompletedInputPos,
        });
      }
      
      if (!needsDoubleN) {
        if (inputPart.startsWith('n')) {
          queue.push({ 
            kanaPos: curr.kanaPos + 1, 
            inputPos: curr.inputPos + 1,
            lastCompletedKanaPos: curr.kanaPos + 1,
            lastCompletedInputPos: curr.inputPos + 1,
          });
        } else if ('n'.startsWith(inputPart)) {
          queue.push({ 
            kanaPos: curr.kanaPos, 
            inputPos: curr.inputPos + inputPart.length,
            lastCompletedKanaPos: curr.lastCompletedKanaPos,
            lastCompletedInputPos: curr.lastCompletedInputPos,
          });
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
            queue.push({ 
              kanaPos: curr.kanaPos + 2, 
              inputPos: curr.inputPos + cand.length,
              lastCompletedKanaPos: curr.kanaPos + 2,
              lastCompletedInputPos: curr.inputPos + cand.length,
            });
          } else if (cand.startsWith(inputPart)) {
            queue.push({ 
              kanaPos: curr.kanaPos, 
              inputPos: curr.inputPos + inputPart.length,
              lastCompletedKanaPos: curr.lastCompletedKanaPos,
              lastCompletedInputPos: curr.lastCompletedInputPos,
            });
          }
        }
      }
    }
    
    const singleChar = remainingKana[0];
    const isNextSmallChar = remainingKana.length >= 2 && ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', 'ゅ', 'ょ', 'ゎ'].includes(remainingKana[1]);
    const candidates = ROMAN_RULES[singleChar];
    if (candidates && !isNextSmallChar) {
      for (const cand of candidates) {
        if (inputPart.startsWith(cand)) {
          queue.push({ 
            kanaPos: curr.kanaPos + 1, 
            inputPos: curr.inputPos + cand.length,
            lastCompletedKanaPos: curr.kanaPos + 1,
            lastCompletedInputPos: curr.inputPos + cand.length,
          });
        } else if (cand.startsWith(inputPart)) {
          queue.push({ 
            kanaPos: curr.kanaPos, 
            inputPos: curr.inputPos + inputPart.length,
            lastCompletedKanaPos: curr.lastCompletedKanaPos,
            lastCompletedInputPos: curr.lastCompletedInputPos,
          });
        }
      }
    }
  }
  
  const isValid = results.length > 0;
  const isComplete = results.some(r => r.isComplete);
  
  let matchedKanaCount = 0;
  let matchedInputLen = 0;
  
  if (isValid) {
    const best = results.reduce((best, item) => {
      if (item.lastCompletedKanaPos > best.lastCompletedKanaPos) return item;
      if (item.lastCompletedKanaPos === best.lastCompletedKanaPos) {
        return item.lastCompletedInputPos > best.lastCompletedInputPos ? item : best;
      }
      return best;
    }, results[0]);
    
    matchedKanaCount = best.lastCompletedKanaPos;
    matchedInputLen = best.lastCompletedInputPos;
  }
  
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
    matchedInputLen,
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
  const [difficulty, setDifficulty] = useState<'easy' | 'normal'>('normal');
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [party, rawSetParty] = useState<Character[]>(createParty(1));
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [portalAlert, setPortalAlert] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [isKKeyPressed, setIsKKeyPressed] = useState<boolean>(false);
  const isTransitioningRef = useRef(false);
  const processedEnemyActionsRef = useRef<{ [key: number]: boolean }>({});

  // Keyboard tracking for K key (to toggle test mode on click)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' || e.key === 'K') {
        setIsKKeyPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'k' || e.key === 'K') {
        setIsKKeyPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // スタート画面でのキーボード操作（矢印キーで難易度選択、Enter/Spaceでゲーム開始）
  useEffect(() => {
    if (screen !== 'start') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'Left') {
        e.preventDefault();
        sound.playKeySuccess();
        setDifficulty('easy');
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        e.preventDefault();
        sound.playKeySuccess();
        setDifficulty('normal');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.playSuccess();
        setScreen('explore');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screen]);

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
  const [battle, rawSetBattle] = useState<BattleState>({
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

  // Keyboard navigation helpers for Battle
  const [focusedSkillIndex, setFocusedSkillIndex] = useState<number>(0);
  const [focusedTargetIndex, setFocusedTargetIndex] = useState<number>(0);

  // キーボードイベントで常に最新のステートを参照するためのRef
  const stateRef = useRef({
    screen,
    battle,
    isChoosingTarget,
    focusedSkillIndex,
    focusedTargetIndex,
    pendingSkill,
    party,
    difficulty,
  });

  const setParty = useCallback((value: Character[] | ((prev: Character[]) => Character[])) => {
    rawSetParty((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      stateRef.current.party = next; // 即時同期！
      return next;
    });
  }, []);

  const setBattle = useCallback((value: BattleState | ((prev: BattleState) => BattleState)) => {
    rawSetBattle((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      stateRef.current.battle = next; // 即時同期！
      return next;
    });
  }, []);

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
    usedPositions.add('4,6'); // Player front safe zone
    usedPositions.add('4,0'); // Portal position
    usedPositions.add('4,1'); // Portal front safe zone

    // Add monster spawns (Stage 5 has only 1 boss monster)
    const isStage5 = stageIndex === 4;
    const monsterCount = isStage5 ? 1 : 3;
    const templates = currentStage.monsterTemplates;
    const monsterPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < monsterCount; i++) {
      let mx = Math.floor(Math.random() * 9);
      let my = Math.floor(Math.random() * 6); // Keep monsters slightly upper
      if (isStage5) {
        // Center the boss on Stage 5
        mx = 4;
        my = 3;
      }
      let posKey = `${mx},${my}`;
      let isAdjacent = monsterPositions.some(p => Math.abs(p.x - mx) <= 1 && Math.abs(p.y - my) <= 1);
      while (usedPositions.has(posKey) || (!isStage5 && isAdjacent)) {
        mx = Math.floor(Math.random() * 9);
        my = Math.floor(Math.random() * 6);
        posKey = `${mx},${my}`;
        isAdjacent = monsterPositions.some(p => Math.abs(p.x - mx) <= 1 && Math.abs(p.y - my) <= 1);
      }
      usedPositions.add(posKey);
      monsterPositions.push({ x: mx, y: my });
      
      if (isStage5) {
        entities.push({
          id: `monster-${i}`,
          type: 'monster',
          x: mx,
          y: my,
          avatar: BOSS_TEMPLATE.avatar,
          label: BOSS_TEMPLATE.name,
        });
      } else {
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
      const isReserved = (ox === 4 && oy === 0) || (ox === 4 && oy === 1) || (ox === 4 && oy === 7) || (ox === 4 && oy === 6);
      const isNearMonster = monsterPositions.some(m => Math.abs(m.x - ox) + Math.abs(m.y - oy) <= 1);
      if (!usedPositions.has(posKey) && oy !== 7 && !isReserved && !isNearMonster) {
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
    isTransitioningRef.current = false;
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
      if (touchedPortal && !isTransitioningRef.current) {
        // Prevent progressing if there are remaining monsters
        const hasMonsters = mapEntities.some((e) => e.type === 'monster');
        if (hasMonsters) {
          setPortalAlert(true);
          setTimeout(() => setPortalAlert(false), 2000);
          return prev;
        }

        // Remove portal instantly to prevent double-triggering
        setMapEntities((oldEntities) => oldEntities.filter((e) => e.type !== 'portal'));
        // Go to next stage immediately
        goToNextStage();
        return prev;
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

    if (currentStage.number === 5) {
      // Stage 5 has only the Demon King! Spawn him directly.
      spawnedEnemies = [JSON.parse(JSON.stringify(BOSS_TEMPLATE))];
      // Party levels up to 5 and fully recovers for the final boss!
      setParty((prev) => 
        prev.map((char) => ({
          ...char,
          level: 5,
          hp: char.maxHp,
          isDead: false,
          atkBuff: 1.0,
          defBuff: 1.0,
          provokeTurns: 0,
          ultimateCooldown: 0,
          shield: 0,
        }))
      );
    } else {
      // Always spawn the monster that player touched on the map as the first enemy!
      const matchedTemplate = currentStage.monsterTemplates.find(t => t.name === monsterEntity.label);
      if (matchedTemplate) {
        spawnedEnemies.push(JSON.parse(JSON.stringify(matchedTemplate)));
      } else {
        const randTemplate = currentStage.monsterTemplates[0];
        spawnedEnemies.push(JSON.parse(JSON.stringify(randTemplate)));
      }

      // If we spawn 2 enemies, choose another random one
      const amount = Math.random() > 0.4 ? 2 : 1;
      if (amount === 2) {
        const templateNames = currentStage.monsterTemplates;
        const randTemplate = templateNames[Math.floor(Math.random() * templateNames.length)];
        spawnedEnemies.push(JSON.parse(JSON.stringify(randTemplate)));
      }
    }

    const isBossFight = spawnedEnemies.some(e => e.name === '魔王');
    const spawnText = isBossFight ? '魔王が現れた！' : `野生の ${spawnedEnemies.map(e => e.name).join('と')} が現れた！`;

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
      battleLogs: [spawnText],
    });

    // Remove this monster from map
    setMapEntities((prev) => prev.filter((e) => e.id !== monsterEntity.id));
    // Reset ultimateUsed state for the new battle
    setParty((prev) => prev.map((char) => ({ ...char, ultimateUsed: false })));
    setScreen('battle');
  };

  const getFirstAliveCharIndex = (): number => {
    for (let i = 0; i < party.length; i++) {
      if (!party[i].isDead) return i;
    }
    return 0;
  };

  const getExecutionOrder = (partyList: Character[], selectedSkills: { [charId: string]: Skill }): number[] => {
    const indices = partyList.map((_, i) => i);
    const supportSkills = [
      'ヒール',
      'オールヒール',
      'ツヨクナール',
      '最終奥義・ザ・モンクレボリューション',
      'ザ・シールド',
      '挑発',
      'オールシールド',
      '最終奥義・シールドブレイカー'
    ];
    const isSupport = (idx: number) => {
      const char = partyList[idx];
      const skill = selectedSkills[char.id];
      return skill && supportSkills.includes(skill.name);
    };

    const supportIndices = indices.filter(idx => isSupport(idx));
    const offensiveIndices = indices.filter(idx => !isSupport(idx));
    return [...supportIndices, ...offensiveIndices];
  };

  const goToNextStage = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if (stageIndex < 4) {
      sound.playLevelUp();
      const nextIdx = stageIndex + 1;
      setStageIndex(nextIdx);
      
      // Every stage transition increases level up to 4 (stages 2, 3, 4). Boss fight levels up to 5.
      const shouldLevelUp = nextIdx < 4;

      // Party fully recovers and levels up! Also stage transition increases max HP by 20!
      setParty((prev) => 
        prev.map((char) => {
          const nextMaxHp = char.maxHp + 20;
          return {
            ...char,
            maxHp: nextMaxHp,
            level: shouldLevelUp ? char.level + 1 : char.level,
            hp: nextMaxHp,
            isDead: false,
            atkBuff: 1.0,
            defBuff: 1.0,
            provokeTurns: 0,
            ultimateCooldown: 0,
            shield: 0,
            skillCooldowns: {}, // Reset cooldowns on new stage
          };
        })
      );
      if (shouldLevelUp) {
        addDamageAnim('レベルアップ！ 全員完全回復！', 50, 45, 'text-green-400 font-bold bg-slate-900/90 px-4 py-2 border-2 border-green-500 rounded text-base sm:text-lg shadow-xl max-w-[90vw] text-center whitespace-normal break-words');
      } else {
        addDamageAnim('全員完全回復！', 50, 45, 'text-green-400 font-bold bg-slate-900/90 px-4 py-2 border-2 border-green-500 rounded text-base sm:text-lg shadow-xl max-w-[90vw] text-center whitespace-normal break-words');
      }
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
    if (!testMode && char.level < skill.levelRequired) return;

    // Check ultimate once-per-battle restriction
    if (skill.name.includes('最終奥義') && char.ultimateUsed) return;

    // Check skill cooldown
    const cooldown = char.skillCooldowns?.[skill.name] || 0;
    if (cooldown > 0) return;

    // Skills that target ALL, SELF or are area attacks do not need target selection
    const isAutoTarget = skill.name === 'オールヒール' || 
                        skill.name === 'ザ・シールド' || 
                        skill.name === 'オールシールド' || 
                        skill.name === '最終奥義・ザ・モンクレボリューション' || 
                        skill.name === '最終奥義・エクスプロージョン' || 
                        skill.name === '最終奥義・シールドブレイカー';
    
    const pending = { charId: char.id, skill };
    setPendingSkill(pending);
    if (isAutoTarget) {
      // Auto target all or self, proceed directly
      submitChosenAction(0, pending);
    } else {
      // Needs targeting an enemy or an ally
      setIsChoosingTarget(true);
    }
  };

  const submitChosenAction = (targetIndex: number, overridePending?: { charId: string, skill: Skill }) => {
    console.log("submitChosenAction called with targetIndex:", targetIndex, "overridePending:", overridePending, "pendingSkill:", pendingSkill);
    let activePending = overridePending || pendingSkill;
    if (!activePending) {
      // Fallback: Use currentCharIndex and focusedSkillIndex
      const char = party[battle.currentCharIndex];
      if (char) {
        const availableSkills = char.skills;
        const skill = availableSkills[focusedSkillIndex];
        if (skill) {
          // Check requirement & cooldown in fallback as well
          const cooldown = char.skillCooldowns?.[skill.name] || 0;
          if (!testMode && char.level < skill.levelRequired) return;
          if (skill.name.includes('最終奥義') && char.ultimateUsed) return;
          if (cooldown > 0) return;

          activePending = { charId: char.id, skill };
          console.warn("Fallback pendingSkill used:", activePending);
        }
      }
    }
    if (!activePending) {
      console.error("submitChosenAction failed: No active pending skill found!");
      return;
    }
    const { charId, skill } = activePending;

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
        const order = getExecutionOrder(party, nextSkills);
        let firstExecIdx = getFirstAliveCharIndex();
        for (const idx of order) {
          if (!party[idx].isDead && nextSkills[party[idx].id]) {
            firstExecIdx = idx;
            break;
          }
        }
        return {
          ...prev,
          selectedSkills: nextSkills,
          phase: 'action_execute',
          executingCharIndex: firstExecIdx,
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
      if (!selectedSkill || !char || char.isDead) {
        // Skip if no skill selected or character died since choosing
        return { ...prev };
      }

      const textLen = selectedSkill.roman.length;
      const limit = difficulty === 'easy' ? (textLen * 2.0 + 3.0) : (textLen * 0.5 + 1.5);

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

  const selectSkillRef = useRef(selectSkillForChar);
  const submitActionRef = useRef(submitChosenAction);

  useEffect(() => {
    stateRef.current = {
      screen,
      battle,
      isChoosingTarget,
      focusedSkillIndex,
      focusedTargetIndex,
      pendingSkill,
      party,
      difficulty,
    };
    selectSkillRef.current = selectSkillForChar;
    submitActionRef.current = submitChosenAction;
  });

  // 手番やフェーズが変わった時に、初期フォーカスを設定する
  useEffect(() => {
    if (battle.phase === 'action_select') {
      setFocusedSkillIndex(0);
      
      const isSupport = pendingSkill && (pendingSkill.skill.name === 'ツヨクナール' || pendingSkill.skill.name === 'ヒール');
      if (isChoosingTarget) {
        if (isSupport) {
          const firstAliveCharIdx = party.findIndex(c => !c.isDead);
          setFocusedTargetIndex(firstAliveCharIdx !== -1 ? firstAliveCharIdx : 0);
        } else {
          const firstAliveEnemyIdx = battle.enemies.findIndex(e => e.hp > 0);
          setFocusedTargetIndex(firstAliveEnemyIdx !== -1 ? firstAliveEnemyIdx : 0);
        }
      }
    }
  }, [battle.phase, battle.currentCharIndex, isChoosingTarget, pendingSkill, party, battle.enemies]);

  // 行動コマンド＆ターゲット選択のキーボードハンドラー
  useEffect(() => {
    if (screen !== 'battle') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        battle: currentBattle,
        isChoosingTarget: currentIsChoosingTarget,
        focusedSkillIndex: currentFocusedSkillIndex,
        focusedTargetIndex: currentFocusedTargetIndex,
        pendingSkill: currentPendingSkill,
        party: currentParty,
      } = stateRef.current;

      if (currentBattle.phase === 'battle_result') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          sound.playSuccess();
          setScreen('explore');
        }
        return;
      }

      if (currentBattle.phase === 'game_over') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          sound.playSuccess();
          restartCurrentStage();
        }
        return;
      }

      if (currentBattle.phase !== 'action_select') return;

      const char = currentParty[currentBattle.currentCharIndex];
      if (!char) return;

      const availableSkills = char.skills;
      const meetsSkillReq = (skill: Skill) => {
        const cooldown = char.skillCooldowns?.[skill.name] || 0;
        return (testMode || char.level >= skill.levelRequired) &&
          (!skill.name.includes('最終奥義') || !char.ultimateUsed) &&
          cooldown === 0;
      };

      if (!currentIsChoosingTarget) {
        // --- 行動コマンド（スキル）選択フェーズ ---
        const skillCount = availableSkills.length;
        if (skillCount === 0) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D', ' ', 'Enter'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }

        let nextIdx = currentFocusedSkillIndex;

        const isSkillLockedIdx = (idx: number) => {
          const sk = availableSkills[idx];
          if (!sk) return true;
          return !testMode && char.level < sk.levelRequired;
        };

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          if (nextIdx >= 2 && !isSkillLockedIdx(nextIdx - 2)) nextIdx -= 2;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          if (nextIdx + 2 < skillCount && !isSkillLockedIdx(nextIdx + 2)) nextIdx += 2;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          if (nextIdx % 2 === 1 && !isSkillLockedIdx(nextIdx - 1)) nextIdx -= 1;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          if (nextIdx % 2 === 0 && nextIdx + 1 < skillCount && !isSkillLockedIdx(nextIdx + 1)) nextIdx += 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          const selectedSkill = availableSkills[currentFocusedSkillIndex];
          if (selectedSkill && meetsSkillReq(selectedSkill)) {
            sound.playSuccess();
            selectSkillRef.current(selectedSkill);
          } else {
            sound.playKeyWrong();
          }
          return;
        }

        setFocusedSkillIndex(nextIdx);

      } else {
        // --- 対象（ターゲット）選択フェーズ ---
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D', ' ', 'Enter', 'Escape', 'Backspace'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }

        if (e.key === 'Escape' || e.key === 'Backspace') {
          sound.playKeyWrong();
          setIsChoosingTarget(false);
          setPendingSkill(null);
          return;
        }

        const activeSkill = currentPendingSkill?.skill || currentParty[currentBattle.currentCharIndex]?.skills[currentFocusedSkillIndex];
        const isSupport = activeSkill && (activeSkill.name === 'ツヨクナール' || activeSkill.name === 'ヒール');

        console.log("Target choosing phase active. Key:", e.key, "isSupport:", isSupport, "activeSkill:", activeSkill?.name);

        if (isSupport) {
          const targets = currentParty;
          const aliveIndices = targets.map((c, i) => (!c.isDead ? i : -1)).filter(i => i !== -1);
          if (aliveIndices.length === 0) return;

          let currentPosInAlive = aliveIndices.indexOf(currentFocusedTargetIndex);
          if (currentPosInAlive === -1) currentPosInAlive = 0;

          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            currentPosInAlive = (currentPosInAlive - 1 + aliveIndices.length) % aliveIndices.length;
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            currentPosInAlive = (currentPosInAlive + 1) % aliveIndices.length;
          } else if (e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            sound.playSuccess();
            console.log("Submitting ally target. Index:", aliveIndices[currentPosInAlive]);
            submitActionRef.current(aliveIndices[currentPosInAlive]);
            return;
          }
          setFocusedTargetIndex(aliveIndices[currentPosInAlive]);
        } else {
          const targets = currentBattle.enemies;
          const aliveIndices = targets.map((e, i) => (e.hp > 0 ? i : -1)).filter(i => i !== -1);
          if (aliveIndices.length === 0) return;

          let currentPosInAlive = aliveIndices.indexOf(currentFocusedTargetIndex);
          if (currentPosInAlive === -1) currentPosInAlive = 0;

          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            currentPosInAlive = (currentPosInAlive - 1 + aliveIndices.length) % aliveIndices.length;
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            currentPosInAlive = (currentPosInAlive + 1) % aliveIndices.length;
          } else if (e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            sound.playSuccess();
            console.log("Submitting enemy target. Index:", aliveIndices[currentPosInAlive]);
            submitActionRef.current(aliveIndices[currentPosInAlive]);
            return;
          }
          setFocusedTargetIndex(aliveIndices[currentPosInAlive]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen]);

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

  // Trigger game over instantly if all party members are dead
  useEffect(() => {
    if (screen === 'battle' && battle.phase !== 'game_over') {
      const anySurvivor = party.some((c) => !c.isDead);
      if (!anySurvivor) {
        setBattle((prev) => ({
          ...prev,
          phase: 'game_over',
        }));
      }
    }
  }, [party, screen, battle.phase]);

  const handleTypingFinished = (isCompleted: boolean) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const hasMistake = battle.typingMistakeCount > 0;
    const isSuccess = isCompleted && !hasMistake;

    // Clear typing targets immediately to hide the typing panel during animations
    setBattle((prev) => ({
      ...prev,
      typingTarget: '',
      typingInput: '',
    }));

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

    // Set skill cooldowns based on user specifications
    // Cooldown is decremented at the end of the current turn, so to prevent use in the next turn(s),
    // we set it to cooldown_turns + 1.
    let cooldownValue = 0;
    const cooldown1TurnSkills = ['回転斬り', 'ニトロバーン', 'ヒール', 'ザ・シールド'];
    const cooldown2TurnSkills = ['炎舞斬り', 'ライトニングブレイカー', 'オールヒール', '挑発'];
    const cooldown3TurnSkills = ['氷雪斬り', 'ブリザードマウンテン', 'ツヨクナール', 'オールシールド'];

    if (cooldown1TurnSkills.includes(skill.name)) {
      cooldownValue = 2; // 1 turn cooldown (disabled for the next turn)
    } else if (cooldown2TurnSkills.includes(skill.name)) {
      cooldownValue = 3; // 2 turns cooldown (disabled for the next 2 turns)
    } else if (cooldown3TurnSkills.includes(skill.name)) {
      cooldownValue = 4; // 3 turns cooldown (disabled for the next 3 turns)
    }

    setParty(prev => prev.map(c => {
      if (c.id === char.id) {
        const nextCooldowns = { ...c.skillCooldowns };
        if (cooldownValue > 0) {
          nextCooldowns[skill.name] = cooldownValue;
        }
        return { ...c, skillCooldowns: nextCooldowns };
      }
      return c;
    }));

    if (skill.name.includes('最終奥義')) {
      setParty(prev => prev.map(c => c.id === char.id ? { ...c, ultimateUsed: true } : c));
    }

    let targetIdx = skill.targetIdx ?? 0;
    let baseDamage = 0;
    let healingAmount = 0;
    let msg = '';

    // Damage modifier based on completion & mistakes
    let modifier = 1.0;
    if (!isCompleted) {
      modifier = 0; // failed/timed out completely
    } else if (hasMistake && difficulty !== 'easy') {
      modifier = 0.8; // slightly weaker on mistakes (e.g. 5 becomes 4)
    }

    if (isCompleted) {
      sound.playSuccess();
    } else {
      sound.playDamage();
    }

    // Ensure target is still alive, otherwise switch to nearest living enemy (if it is a targeted attack)
    const isEnemyTargetSkill = skill.name !== 'ヒール' && skill.name !== 'オールヒール' && skill.name !== 'ツヨクナール' && skill.name !== 'ザ・シールド' && skill.name !== 'オールシールド' && skill.name !== '最終奥義・ザ・モンクレボリューション';
    if (isEnemyTargetSkill && battle.enemies[targetIdx] && battle.enemies[targetIdx].hp <= 0) {
      let bestIdx = -1;
      let minDistance = Infinity;
      for (let i = 0; i < battle.enemies.length; i++) {
        if (battle.enemies[i].hp > 0) {
          const dist = Math.abs(i - targetIdx);
          if (dist < minDistance) {
            minDistance = dist;
            bestIdx = i;
          }
        }
      }
      if (bestIdx !== -1) {
        targetIdx = bestIdx;
      }
    }

    // Process Skills Logic
    if (skill.name === '斬りつける') {
      baseDamage = 5 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-500 font-bold text-lg');
            return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！` : ''}`],
        };
      });
    } else if (skill.name === 'ひのこ') {
      baseDamage = 5 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        let isApplied = false;
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-orange-500 font-bold text-lg');
            const isBurned = Math.random() < 0.30;
            isApplied = isBurned;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isBurned: isBurned || (enemy as any).isBurned,
              burnTurns: isBurned ? 1 : (enemy as any).burnTurns,
            };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！${isApplied ? ' やけどさせた！' : ''}` : ''}`],
        };
      });
    } else if (skill.name === 'たたく') {
      baseDamage = 3 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-slate-400 font-bold text-md');
            return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！` : ''}`],
        };
      });
    } else if (skill.name === 'ヒール') {
      healingAmount = Math.floor(30 * modifier);
      setParty((prev) => prev.map((c, idx) => {
        if (idx === targetIdx && !c.isDead) {
          const nextHp = Math.min(c.hp + healingAmount, c.maxHp);
          addDamageAnim(`+${healingAmount}`, 20 + idx * 20, 65, 'text-green-400 font-bold text-xl');
          return { ...c, hp: nextHp };
        }
        return c;
      }));
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} が ${party[targetIdx]?.name} に ${skill.name}！ ${healingAmount} 回復！`],
      }));
    } else if (skill.name === '斧で斬る') {
      baseDamage = 7 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-600 font-bold text-lg');
            return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！` : ''}`],
        };
      });
    } else if (skill.name === '回転斬り') {
      baseDamage = 10 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        let logs: string[] = [];
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if ((idx === targetIdx || idx === targetIdx - 1 || idx === targetIdx + 1) && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-500 font-extrabold text-xl animate-bounce');
            logs.push(`${enemy.name}に${finalDamage}ダメージ`);
            return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
          }
          return enemy;
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${logs.join('、')}！`],
        };
      });
    } else if (skill.name === '炎舞斬り') {
      baseDamage = 20 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        let isApplied = false;
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-orange-500 font-extrabold text-2xl');
            const isBurned = Math.random() < 0.40; // 40% chance
            isApplied = isBurned;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isBurned: isBurned || (enemy as any).isBurned,
              burnTurns: isBurned ? 3 : (enemy as any).burnTurns,
            };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！${isApplied ? ' やけど状態にした！' : ''}` : ''}`],
        };
      });
    } else if (skill.name === '氷雪斬り') {
      baseDamage = 30 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        let isApplied = false;
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-sky-400 font-extrabold text-2xl');
            const isFrozen = Math.random() < 0.50; // 50% chance
            isApplied = isFrozen;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isFrozen: isFrozen || (enemy as any).isFrozen,
              freezeTurns: isFrozen ? 2 : (enemy as any).freezeTurns,
            };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！${isApplied ? ' こおり状態にした！' : ''}` : ''}`],
        };
      });
    } else if (skill.name === '最終奥義・空間断絶斬') {
      baseDamage = 50 * modifier;
      // Triggers death in 5 turns if character survives
      setParty(prev => prev.map(c => c.id === char.id ? { ...c, ultimateCooldown: 5 } : c));
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
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
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の空間断絶斬！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！` : ''} 5ターン後勇者は力尽きる...`],
        };
      });
    } else if (skill.name === 'ニトロバーン') {
      baseDamage = 10 * modifier;
      setBattle((prev) => {
        const finalDamage = Math.floor(baseDamage * char.atkBuff);
        let isApplied = false;
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (idx === targetIdx && enemy.hp > 0) {
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-400 font-bold text-xl');
            const isBurned = Math.random() < 0.20;
            isApplied = isBurned;
            return { 
              ...enemy, 
              hp: Math.max(enemy.hp - finalDamage, 0),
              isBurned: isBurned || (enemy as any).isBurned,
              burnTurns: isBurned ? 3 : (enemy as any).burnTurns,
            };
          }
          return enemy;
        });
        const targetEnemy = prev.enemies[targetIdx];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${targetEnemy ? `${targetEnemy.name} に ${finalDamage} ダメージ！${isApplied ? ' やけど状態にした！' : ''}` : ''}`],
        };
      });
    } else if (skill.name === 'ライトニングブレイカー') {
      baseDamage = 15 * modifier;
      const splashDamage = 10 * modifier;
      setBattle((prev) => {
        let logs: string[] = [];
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          const isMain = idx === targetIdx;
          const isSplash = idx === targetIdx - 1 || idx === targetIdx + 1;
          if ((isMain || isSplash) && enemy.hp > 0) {
            const finalDamage = Math.floor((isMain ? baseDamage : splashDamage) * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-yellow-400 font-extrabold text-xl');
            const isShocked = isMain && Math.random() < 0.40; // 40% chance
            logs.push(`${enemy.name}に${finalDamage}ダメージ${isShocked ? '(麻痺)' : ''}`);
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
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${logs.join('、')}！`],
        };
      });
    } else if (skill.name === 'ブリザードマウンテン') {
      baseDamage = 30 * modifier;
      setBattle((prev) => {
        let logs: string[] = [];
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          const dist = Math.abs(idx - targetIdx);
          const rawDamage = Math.max(baseDamage - dist * 10, 0);
          if (rawDamage > 0 && enemy.hp > 0) {
            const finalDamage = Math.floor(rawDamage * char.atkBuff);
            addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-cyan-400 font-extrabold text-2xl');
            const isFrozen = Math.random() < 0.50; // 50% chance
            logs.push(`${enemy.name}に${finalDamage}ダメージ${isFrozen ? '(凍結)' : ''}`);
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
          battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ ${logs.join('、')}！`],
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
        let logs: string[] = [];
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (enemy.hp <= 0) return enemy;
          const finalDamage = Math.floor(baseDamage * char.atkBuff);
          addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-600 font-extrabold text-3xl animate-ping');
          logs.push(`${enemy.name}に${finalDamage}ダメージ`);
          return { 
            ...enemy, 
            hp: Math.max(enemy.hp - finalDamage, 0),
            isExploded: true,
            explosionTurns: 5
          };
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の最終奥義エクスプロージョン！ ${logs.join('、')}＆毎ターン30の爆発効果付与！味方全体に15ダメージ！5ターン後死亡...`],
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
        battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ 味方全員が ${healingAmount} 回復！`],
      }));
    } else if (skill.name === 'ツヨクナール') {
      let buffVal = 1.0;
      const perfectOrEasy = !hasMistake || difficulty === 'easy';
      if (isCompleted && perfectOrEasy) {
        buffVal = 1.3; // 30% UP
      } else if (isCompleted && hasMistake) {
        buffVal = 1.15; // 15% UP
      } // 失敗なら 1.0 (上昇なし)

      setParty((prev) => prev.map((c, idx) => {
        if (idx === targetIdx && !c.isDead) {
          const upPercent = Math.round((buffVal - 1.0) * 100);
          addDamageAnim(`攻撃/防御 ${upPercent}% UP`, 20 + idx * 20, 65, 'text-green-300 font-bold text-sm');
          return { ...c, atkBuff: buffVal, defBuff: buffVal };
        }
        return c;
      }));
      const upPercent = Math.round((buffVal - 1.0) * 100);
      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${char.name} が ${party[targetIdx]?.name} に ${skill.name} をかけた！ 攻防${upPercent}%上昇！`],
      }));
    } else if (skill.name === '最終奥義・ザ・モンクレボリューション') {
      setParty(prev => prev.map(c => {
        const maxBuff = c.id === char.id ? { ...c, ultimateCooldown: 5 } : c; // death in 5 turns instead of 3
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
          battleLogs: [...prev.battleLogs, `${char.name} の究極の祈りモンクレボリューション！ 敵全体を弱体化、味方全ステータス大上昇＆完全回復！5ターン後僧侶は力尽きる...`],
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
        battleLogs: [...prev.battleLogs, `${char.name} は ${skill.name} で自身にシールド ${shieldValue} 展開！`],
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
        battleLogs: [...prev.battleLogs, `${char.name} が 挑発 して敵の攻撃を3ターン自身に引きつける！`],
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
        battleLogs: [...prev.battleLogs, `${char.name} の ${skill.name}！ 味方全員にシールド ${shieldValue} を付与！`],
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
        let logs: string[] = [];
        const nextEnemies = prev.enemies.map((enemy, idx) => {
          if (enemy.hp <= 0) return enemy;
          const finalDamage = Math.floor(enemyDmg * char.atkBuff);
          addDamageAnim(`-${finalDamage}`, 20 + idx * 30, 30, 'text-red-500 font-extrabold text-2xl');
          logs.push(`${enemy.name}に${finalDamage}ダメージ`);
          return { ...enemy, hp: Math.max(enemy.hp - finalDamage, 0) };
        });
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: [...prev.battleLogs, `${char.name} の最終奥義シールドブレイカー！ ${logs.join('、')}！ 味方全員にシールド ${shieldValue} を展開！5ターン後死亡...`],
        };
      });
    };

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

        // Find next executing character using custom execution order
        const order = getExecutionOrder(party, prev.selectedSkills);
        const currentPos = order.indexOf(prev.executingCharIndex);
        let nextExecIdx = -1;
        if (currentPos !== -1) {
          for (let i = currentPos + 1; i < order.length; i++) {
            const idx = order[i];
            if (!party[idx].isDead && prev.selectedSkills[party[idx].id]) {
              nextExecIdx = idx;
              break;
            }
          }
        }

        if (nextExecIdx !== -1) {
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
    processedEnemyActionsRef.current = {};
    setBattle((prev) => {
      const aliveEnemies = prev.enemies.filter((e) => e.hp > 0);
      if (aliveEnemies.length === 0) {
        setTimeout(() => winBattle(), 100);
        return prev;
      }
      return {
        ...prev,
        phase: 'enemy_turn',
        enemyAttackingIndex: 0,
        typingTarget: '',
        currentAttack: null,
      };
    });

    // 0.5秒待ってから最初の敵の行動判定を開始
    setTimeout(() => {
      executeEnemyAction(0);
    }, 500);
  };

  const executeEnemyAction = (enemyIdx: number) => {
    const currentBattle = stateRef.current.battle;
    const currentParty = stateRef.current.party;
    const enemy = currentBattle.enemies[enemyIdx];

    if (!enemy || enemy.hp <= 0) {
      moveToNextEnemyOrEndAction(enemyIdx);
      return;
    }

    if (processedEnemyActionsRef.current[enemyIdx]) {
      return;
    }
    processedEnemyActionsRef.current[enemyIdx] = true;

    // Apply status conditions on enemies (frozen, shocked, etc.)
    if ((enemy as any).isFrozen) {
      const currentTurns = (enemy as any).freezeTurns !== undefined ? (enemy as any).freezeTurns : 2;
      const nextTurns = currentTurns - 1;
      const keep = nextTurns > 0;
      addDamageAnim('凍結中！', 20 + enemyIdx * 30, 20, 'text-sky-300 font-bold');

      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((e, idx) => {
          if (idx === enemyIdx) {
            return { 
              ...e, 
              isFrozen: keep,
              freezeTurns: Math.max(nextTurns, 0)
            };
          }
          return e;
        });
        const nextLogs = [...prev.battleLogs, `${enemy.name} は凍りついているため動けない！${!keep ? ' (凍結が解けた！)' : ''}`];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: nextLogs,
          typingTarget: '',
          typingInput: '',
          currentAttack: null,
        };
      });

      // 1秒待ってから次の敵へ移行
      setTimeout(() => {
        moveToNextEnemyOrEndAction(enemyIdx);
      }, 1000);
      return;
    }

    if ((enemy as any).isShocked) {
      const currentTurns = (enemy as any).shockTurns !== undefined ? (enemy as any).shockTurns : 2;
      const nextTurns = currentTurns - 1;
      const keep = nextTurns > 0;
      addDamageAnim('麻痺中！', 20 + enemyIdx * 30, 20, 'text-yellow-300 font-bold');

      setBattle((prev) => {
        const nextEnemies = prev.enemies.map((e, idx) => {
          if (idx === enemyIdx) {
            return { 
              ...e, 
              isShocked: keep,
              shockTurns: Math.max(nextTurns, 0)
            };
          }
          return e;
        });
        const nextLogs = [...prev.battleLogs, `${enemy.name} は麻痺しているため動けない！${!keep ? ' (麻痺が解けた！)' : ''}`];
        return {
          ...prev,
          enemies: nextEnemies,
          battleLogs: nextLogs,
          typingTarget: '',
          typingInput: '',
          currentAttack: null,
        };
      });

      // 1秒待ってから次の敵へ移行
      setTimeout(() => {
        moveToNextEnemyOrEndAction(enemyIdx);
      }, 1000);
      return;
    }

    // Select random attack
    const attack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
    
    // Choose target (provoked warrior gets priority)
    let targetCharIdx = 0;
    const warriorIdx = currentParty.findIndex(c => c.id === 'warrior');
    if (warriorIdx !== -1 && !currentParty[warriorIdx].isDead && currentParty[warriorIdx].provokeTurns > 0) {
      targetCharIdx = warriorIdx;
    } else {
      // Pick random alive party member
      const aliveIdxs: number[] = [];
      currentParty.forEach((c, idx) => {
        if (!c.isDead) aliveIdxs.push(idx);
      });
      if (aliveIdxs.length === 0) {
        // All party dead, trigger defeat
        setTimeout(() => handleDefeat(), 100);
        return;
      }
      targetCharIdx = aliveIdxs[Math.floor(Math.random() * aliveIdxs.length)];
    }

    const textLen = attack.roman.length;
    const currentDifficulty = stateRef.current.difficulty;
    const limit = currentDifficulty === 'easy' ? (textLen * 2.0 + 3.0) : (textLen * 0.5 + 1.5);

    // Trigger defence typing (タイピングのターンに移行する)
    setBattle((prev) => ({
      ...prev,
      enemyAttackingIndex: enemyIdx,
      defendingCharIndex: targetCharIdx,
      currentAttack: attack,
      typingTarget: attack.roman,
      typingInput: '',
      typingStartTime: Date.now(),
      typingLimitTime: limit,
      typingMistakeCount: 0,
      battleLogs: [...prev.battleLogs, `${enemy.name} が ${attack.name} の構えをとった！`],
    }));
  };

  const moveToNextEnemyOrEndAction = (currentEnemyIdx: number) => {
    const nextIdx = currentEnemyIdx + 1;
    const currentBattle = stateRef.current.battle;

    if (nextIdx < currentBattle.enemies.length) {
      setBattle((prev) => ({
        ...prev,
        enemyAttackingIndex: nextIdx,
        typingTarget: '',
        currentAttack: null,
        typingInput: '',
      }));

      // 0.5秒待ってから、次の敵の行動判定を開始
      setTimeout(() => {
        executeEnemyAction(nextIdx);
      }, 500);
    } else {
      // All enemies finished attacking. Tick status effects, then go to next turn!
      setBattle((prev) => ({
        ...prev,
        typingTarget: '',
        typingInput: '',
        currentAttack: null,
      }));

      setTimeout(() => {
        endTurnAndStartNext();
      }, 1000);
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
    const perfectOrEasy = !hasMistake || difficulty === 'easy';
    if (isCompleted && perfectOrEasy) {
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
      // Demon King summons a random monster of previous stages!
      setBattle((prev) => {
        const allPreviousTemplates: Enemy[] = [];
        for (let s = 0; s < stageIndex; s++) {
          const st = STAGES[s];
          if (st && st.monsterTemplates) {
            allPreviousTemplates.push(...st.monsterTemplates);
          }
        }

        let spawnedTemplate = null;
        if (allPreviousTemplates.length > 0) {
          spawnedTemplate = allPreviousTemplates[Math.floor(Math.random() * allPreviousTemplates.length)];
        }

        if (spawnedTemplate) {
          const spawned = JSON.parse(JSON.stringify(spawnedTemplate));
          const nextEnemies = [...prev.enemies, spawned];
          addDamageAnim('召喚！', 50, 20, 'text-purple-400 font-bold');
          return {
            ...prev,
            enemies: nextEnemies,
            battleLogs: [...prev.battleLogs, `魔王 が ${spawned.name} を召喚した！`],
          };
        }
        return prev;
      });

      // Proceed to next enemy or end phase (FIXED: added missing transition for summon)
      setTimeout(() => {
        moveToNextEnemyOrEndAction(battle.enemyAttackingIndex);
      }, 300);
    } else if (attack.name === 'ふぶき' || attack.name === 'すべりつつき' || attack.name === '回転斬り' || attack.name === '火を吹く' || attack.name === 'メテオストライク' || attack.effect === 'debuff_atk') {
      // Hit everyone!
      let debuffPercent = 0;
      if (attack.effect === 'debuff_atk') {
        const perfectOrEasy = !hasMistake || difficulty === 'easy';
        if (isCompleted && perfectOrEasy) {
          debuffPercent = 0;
        } else if (isCompleted && hasMistake) {
          debuffPercent = 10;
        } else {
          debuffPercent = 30;
        }
      }

      let updatedParty: Character[] = [];
      setParty((prevParty) => {
        const nextParty = prevParty.map((char, idx) => {
          if (char.isDead) return char;
          
          // Debuff only
          if (attack.effect === 'debuff_atk') {
            const reduction = debuffPercent / 100;
            if (debuffPercent > 0) {
              addDamageAnim(`攻撃力 ${debuffPercent}% DOWN`, 20 + idx * 20, 65, 'text-amber-500 font-bold text-sm');
            } else {
              addDamageAnim(`ガード成功！`, 20 + idx * 20, 65, 'text-green-400 font-bold text-sm');
            }
            return { ...char, atkBuff: Math.max(char.atkBuff - reduction, 0.5) };
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
        });
        updatedParty = nextParty;
        return nextParty;
      });

      setBattle((prev) => {
        let log = '';
        if (attack.effect === 'debuff_atk') {
          if (debuffPercent === 0) {
            log = `${enemy.name} の「${attack.name}」！ タイピング成功によりデバフを完全に防ぎきった！`;
          } else {
            log = `${enemy.name} の「${attack.name}」！ 味方全員の攻撃力を ${debuffPercent}% 低下させた！`;
          }
        } else {
          log = `${enemy.name} の全体攻撃 ${attack.name}！ 全員が ${finalDmg} ダメージを受けた！`;
        }
        return {
          ...prev,
          battleLogs: [...prev.battleLogs, log],
        };
      });

      // Proceed to next enemy or end phase
      setTimeout(() => {
        // Check if party is defeated completely
        const anySurvivor = updatedParty.some(c => !c.isDead);
        if (!anySurvivor) {
          handleDefeat();
          return;
        }

        moveToNextEnemyOrEndAction(battle.enemyAttackingIndex);
      }, 300);
    } else {
      // Single target attack
      let updatedParty: Character[] = [];
      setParty((prevParty) => {
        const nextParty = prevParty.map((char, idx) => {
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
        });
        updatedParty = nextParty;
        return nextParty;
      });

      setBattle((prev) => ({
        ...prev,
        battleLogs: [...prev.battleLogs, `${enemy.name} の ${attack.name}！ ${defender.name} は ${finalDmg} ダメージを受けた！`],
      }));

      // Proceed to next enemy or end phase
      setTimeout(() => {
        // Check if party is defeated completely
        const anySurvivor = updatedParty.some(c => !c.isDead);
        if (!anySurvivor) {
          handleDefeat();
          return;
        }

        moveToNextEnemyOrEndAction(battle.enemyAttackingIndex);
      }, 300);
    }
  };

  const endTurnAndStartNext = () => {
    // Tick status effects like burn, frost, and ultimate limits
    let updatedParty: Character[] = [];
    setParty((prevParty) => {
      const nextParty = prevParty.map((char) => {
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

        // Decrement skill cooldowns
        const nextCooldowns = { ...char.skillCooldowns };
        for (const skillName in nextCooldowns) {
          if (nextCooldowns[skillName] > 0) {
            nextCooldowns[skillName]--;
          }
        }

        return {
          ...char,
          hp: nextHp,
          isDead,
          ultimateCooldown: nextCooldown,
          provokeTurns: nextProvoke,
          skillCooldowns: nextCooldowns,
        };
      });
      updatedParty = nextParty;
      return nextParty;
    });

    setBattle((prev) => {
      // Apply bleed / poison damages to enemies
      const nextEnemies = prev.enemies.map((enemy) => {
        let currentHp = enemy.hp;
        if (currentHp <= 0) return enemy;

        let bleed = 0;
        let burn = 0;
        let explosion = 0;

        if ((enemy as any).isBurned) {
          const currentTurns = (enemy as any).burnTurns !== undefined ? (enemy as any).burnTurns : 1;
          burn = 3;
          const nextTurns = currentTurns - 1;
          const keep = nextTurns > 0;
          
          (enemy as any).burnTurns = Math.max(nextTurns, 0);
          if (!keep) {
            (enemy as any).isBurned = false;
          }
        }

        if ((enemy as any).extraBleed && (enemy as any).bleedTurns > 0) {
          bleed = 10;
          (enemy as any).bleedTurns--;
        }

        if ((enemy as any).isExploded && (enemy as any).explosionTurns > 0) {
          explosion = 30;
          (enemy as any).explosionTurns--;
          if ((enemy as any).explosionTurns === 0) (enemy as any).isExploded = false;
        }

        const nextHp = Math.max(currentHp - (burn + bleed + explosion), 0);
        if (burn + bleed + explosion > 0) {
          let text = '';
          if (burn > 0) text += `-${burn} (やけど) `;
          if (bleed > 0) text += `-${bleed} (空間断絶) `;
          if (explosion > 0) text += `-${explosion} (爆発) `;
          addDamageAnim(text.trim(), 50, 20, 'text-orange-500 font-bold');
        }

        return {
          ...enemy,
          hp: nextHp,
        };
      });

      const aliveEnemies = nextEnemies.filter(e => e.hp > 0);
      if (aliveEnemies.length === 0) {
        setTimeout(() => winBattle(), 200);
        return {
          ...prev,
          enemies: [],
          phase: 'battle_result',
        };
      }

      // Determine next first alive character index from the updated party list
      let firstAliveIdx = 0;
      const partyToUse = updatedParty.length > 0 ? updatedParty : party;
      for (let i = 0; i < partyToUse.length; i++) {
        if (!partyToUse[i].isDead) {
          firstAliveIdx = i;
          break;
        }
      }

      // Clear action selection, increment turn
      return {
        ...prev,
        enemies: aliveEnemies,
        currentTurn: prev.currentTurn + 1,
        phase: 'action_select',
        currentCharIndex: firstAliveIdx,
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
    // Reset all skill cooldowns, shields, buffs, and status/provokes at the end of the battle
    setParty((prevParty) =>
      prevParty.map((char) => ({
        ...char,
        skillCooldowns: {},
        shield: 0,
        atkBuff: 1.0,
        defBuff: 1.0,
        provokeTurns: 0,
        ultimateCooldown: 0,
      }))
    );
  };

  const handleDefeat = () => {
    setBattle((prev) => ({
      ...prev,
      phase: 'game_over',
    }));
    // Reset shields and buffs at defeat
    setParty((prevParty) =>
      prevParty.map((char) => ({
        ...char,
        shield: 0,
        atkBuff: 1.0,
        defBuff: 1.0,
        provokeTurns: 0,
        ultimateCooldown: 0,
      }))
    );
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
        skillCooldowns: {}, // Reset cooldowns when restarting stage
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

  // ゲームクリア画面でのキーボード操作（Enter/Spaceでゲームを最初からリスタート）
  useEffect(() => {
    if (screen !== 'game_clear') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.playSuccess();
        restartWholeGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screen]);

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
      const subInput = input.slice(result.matchedInputLen);

      let remainingNextRoman = '';
      let nextKanaChar = '';

      if (subInput.length > 0 && remainingKana.length > 0) {
        // Find next kana character
        if (remainingKana[0] === 'っ') {
          // Geminate consonant
          nextKanaChar = remainingKana.slice(0, 2);
          const nextChar = remainingKana[1];
          const nextPair = remainingKana.slice(1, 3);
          const candidates = ROMAN_RULES[nextPair] || ROMAN_RULES[nextChar] || [];
          for (const cand of candidates) {
            const consonant = cand[0];
            if (consonant && !['a', 'i', 'u', 'e', 'o'].includes(consonant)) {
              const doubleRoman = consonant + cand;
              if (doubleRoman.startsWith(subInput)) {
                remainingNextRoman = doubleRoman.slice(subInput.length);
                break;
              }
            }
          }
          if (!remainingNextRoman) {
            const xtsuCandidates = ['xtsu', 'ltsu', 'xtu', 'ltu'];
            for (const cand of xtsuCandidates) {
              if (cand.startsWith(subInput)) {
                remainingNextRoman = cand.slice(subInput.length);
                break;
              }
            }
          }
        } else if (remainingKana[0] === 'ん') {
          nextKanaChar = 'ん';
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
          const cand = needsDoubleN ? 'nn' : 'n';
          if (cand.startsWith(subInput)) {
            remainingNextRoman = cand.slice(subInput.length);
          }
        } else {
          // Normal kana
          if (remainingKana.length >= 2 && ROMAN_RULES[remainingKana.slice(0, 2)]) {
            nextKanaChar = remainingKana.slice(0, 2);
          } else {
            nextKanaChar = remainingKana[0];
          }
          const candidates = ROMAN_RULES[nextKanaChar] || [];
          for (const cand of candidates) {
            if (cand.startsWith(subInput)) {
              remainingNextRoman = cand.slice(subInput.length);
              break;
            }
          }
        }
      }

      const displayInput = input.replace(/\//g, '・').replace(/ /g, '・');

      if (nextKanaChar) {
        displayTarget = displayInput + remainingNextRoman + kanaToStandardRoman(remainingKana.slice(nextKanaChar.length));
      } else {
        displayTarget = displayInput + kanaToStandardRoman(remainingKana);
      }
      matchCount = input.length;
    }

    let originalText = '';
    if (battle.phase === 'action_execute') {
      const char = party[battle.executingCharIndex];
      const skill = battle.selectedSkills[char?.id];
      if (skill) {
        originalText = skill.name;
      }
    } else if (battle.phase === 'enemy_turn' && battle.currentAttack) {
      originalText = battle.currentAttack.name;
    }

    if (!originalText && kana) {
      originalText = kana;
    }

    return (
      <div className="flex flex-col gap-1.5 max-w-xl mx-auto my-3 w-full">
        {originalText && (
          <div className="text-center">
            <span className="text-sm font-bold text-slate-300 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800 tracking-wide animate-pulse">
              {originalText}
            </span>
          </div>
        )}
        <div className="font-mono text-2xl tracking-wider text-center p-4 bg-slate-900/80 border border-slate-700 rounded-lg shadow-inner relative overflow-hidden w-full">
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
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Damage/Healing Animations overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {damageAnimations.map((anim) => {
          const isCentered = anim.x === 50;
          return (
            <div
              key={anim.id}
              style={{ left: `${anim.x}%`, top: `${anim.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex justify-center items-center ${
                isCentered ? 'w-[90vw] max-w-lg' : ''
              }`}
            >
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.6 }}
                animate={{ opacity: 1, y: -25, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.8 }}
                className={anim.colorClass}
              >
                {anim.text}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Header Container */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Sword className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              Typing Quest
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {screen !== 'start' && (
            <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-mono flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Stage {stageIndex + 1}: {STAGES[stageIndex]?.name}
            </div>
          )}

          <button
            onClick={() => {
              if (isKKeyPressed) {
                setTestMode((prev) => !prev);
              } else {
                setSoundOn((prev) => !prev);
              }
            }}
            className={`p-2 border rounded-lg transition-colors ${
              testMode
                ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={isKKeyPressed ? 'テストモード切替' : testMode ? 'テストモード作動中' : soundOn ? 'ミュートする' : '音声をONにする'}
          >
            {testMode ? (
              <Sparkles className="h-4 w-4" />
            ) : soundOn ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-rose-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Screen Container */}
      <main className={`flex-1 max-w-5xl w-full mx-auto px-4 pt-3 pb-6 flex flex-col justify-center ${screen === 'battle' && battle.phase === 'battle_result' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <AnimatePresence mode="wait">
          
          {/* SCREEN: START SCREEN */}
          {screen === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg mx-auto text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="mb-5 flex flex-col items-center justify-center">
                <img 
                  src={getPortableImagePath("/image/title_rogo.png")} 
                  alt="Typing Quest" 
                  className="max-h-40 object-contain filter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                  data-rawpath="/image/title_rogo.png"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.startsWith(ORIGINAL_STABLE_URL)) {
                      img.src = `${ORIGINAL_STABLE_URL}/image/title_rogo.png`;
                    } else {
                      img.style.display = 'none';
                      const fallback = document.getElementById('title-fallback-text');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
                <h2 id="title-fallback-text" className="hidden text-3xl font-normal tracking-tight text-white font-dela">
                  Typing Quest
                </h2>
              </div>

              <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg text-left text-[11px] text-slate-300 space-y-1 mb-4 font-sans leading-relaxed">
                <div className="flex gap-2 font-bold text-indigo-400 border-b border-slate-800 pb-1 items-center">
                  <Info className="h-3.5 w-3.5" /> ゲームの基本ルール
                </div>
                <p>・十字キーまたは画面タップで勇者を操作し、マップの敵と戦おう！</p>
                <p>・戦闘時は、表示されるローマ字を制限時間内にタイピングして攻撃！</p>
                <p>・敵の攻撃ターンでは、敵の技名をタイピングして防御（ダメージ激減）！</p>
                <p>・1文字も間違えずに完遂すると最大ダメージ、ミスがあると効果が減衰！</p>
                <p>・各ステージのモンスターを一掃すると次のステージへのポータルが解放！</p>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {createParty(1).map((char) => (
                  <div key={char.id} className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 flex items-center justify-center mb-1">
                      {renderAvatar(char.avatar, "w-full h-full")}
                    </div>
                    <span className="text-[10px] font-bold block truncate text-slate-200">{char.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>

              {/* Difficulty Selection */}
              <div className="mb-4 bg-slate-950/80 p-3 border border-slate-800 rounded-xl">
                <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 justify-center">
                  <Gamepad2 className="h-3.5 w-3.5 text-indigo-400" />
                  難易度を選択してください
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playKeySuccess();
                      setDifficulty('easy');
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-xs border transition-all flex flex-col items-center justify-center gap-1 ${
                      difficulty === 'easy'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 font-black scale-[1.02]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs flex items-center gap-1 justify-center">
                      <kbd className="px-1 py-0.5 text-[8px] bg-slate-800 border border-slate-700 rounded text-slate-300">←</kbd>
                      🍀 イージー (Easy)
                    </span>
                    <span className="text-[9px] font-normal text-slate-400 leading-none">
                      制限時間:長め / ミスペナルティ:なし
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playKeySuccess();
                      setDifficulty('normal');
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-xs border transition-all flex flex-col items-center justify-center gap-1 ${
                      difficulty === 'normal'
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20 font-black scale-[1.02]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs flex items-center gap-1 justify-center">
                      🔥 ノーマル (Normal)
                      <kbd className="px-1 py-0.5 text-[8px] bg-slate-800 border border-slate-700 rounded text-slate-300">→</kbd>
                    </span>
                    <span className="text-[9px] font-normal text-slate-400 leading-none">
                      制限時間:通常 / ミスペナルティ:あり
                    </span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playSuccess();
                  setScreen('explore');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 text-base flex items-center justify-center gap-1.5"
              >
                冒険をはじめる
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <div className="text-[9px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5 font-sans">
                <span>操作ガイド:</span>
                <span className="flex items-center gap-0.5">
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px]">←</kbd>
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px]">→</kbd>
                  <span>難易度選択</span>
                </span>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-0.5">
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px]">Enter</kbd>
                  <span>決定</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* SCREEN: EXPLORE SCREEN */}
          {screen === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-3 gap-4 items-start"
            >
              {/* Left Column: Map Board */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-indigo-400" />
                    <span className="font-extrabold text-white">{STAGES[stageIndex]?.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    残りのモンスター: {mapEntities.filter((e) => e.type === 'monster').length} 匹
                  </div>
                </div>

                {testMode && (
                  <div className="w-full bg-rose-950/40 border border-rose-900/50 p-2 rounded-lg mb-3 flex flex-col sm:flex-row items-center gap-2 z-10">
                    <span className="text-[11px] font-extrabold text-rose-400 font-mono flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" /> ステージジャンプ:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {STAGES.map((stg, idx) => (
                        <button
                          key={stg.number}
                          onClick={() => {
                            sound.playSuccess();
                            setStageIndex(idx);
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
                                skillCooldowns: {},
                              }))
                            );
                          }}
                          className={`px-2 py-1 rounded text-xs font-mono font-extrabold transition-all border ${
                            stageIndex === idx
                              ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-lg shadow-rose-500/20'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-rose-500/50 hover:text-white'
                          }`}
                        >
                          Stage {stg.number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2D Map Grid (9x9) */}
                <div className={`relative grid grid-cols-9 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden w-full max-w-sm aspect-square ${STAGES[stageIndex]?.bgColor}`}>
                  <AnimatePresence>
                    {portalAlert && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-slate-950/95 border-2 border-amber-500 rounded-xl p-4 shadow-2xl z-30 flex flex-col items-center justify-center text-center pointer-events-none"
                      >
                        <span className="text-3xl mb-1">🔒</span>
                        <span className="text-sm font-bold text-amber-400 whitespace-nowrap">
                          先にすべてのモンスターを倒して！
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                              <motion.div
                                layoutId="playerSprite"
                                className="z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] w-8 h-8 flex items-center justify-center"
                              >
                                {renderAvatar('/image/hero.png', "w-full h-full")}
                              </motion.div>
                            )}

                            {/* Entity Sprites */}
                            {!isPlayer && isObstacle && (
                              <span className="scale-95 filter drop-shadow">{entity.avatar}</span>
                            )}
                            {!isPlayer && isMonster && (
                              <motion.div
                                animate={{ scale: [0.95, 1.05, 0.95] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="z-10 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.4)] w-8 h-8 flex items-center justify-center"
                              >
                                {renderAvatar(entity.avatar, "w-full h-full")}
                              </motion.div>
                            )}
                            {!isPlayer && isPortal && (
                              <div className={`w-8 h-8 flex items-center justify-center ${portalLocked ? 'opacity-40 brightness-50' : 'animate-pulse'}`}>
                                {renderAvatar(portalLocked ? '/image/portal_off.png' : '/image/portal_on.png', "w-full h-full")}
                              </div>
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
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-1.5">
                    <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span className="font-extrabold text-white text-sm">現在のパーティー状態</span>
                  </div>

                  <div className="space-y-1.5">
                    {party.map((char) => (
                      <div key={char.id} className="bg-slate-950/60 p-2 border border-slate-800 rounded-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center">
                              {renderAvatar(char.avatar, "w-full h-full", char.isDead, char.role)}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-200 block leading-tight">{char.name.split(' ')[0]}</span>
                              <span className="text-[9px] text-slate-400 font-mono">LV {char.level}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-bold font-mono ${char.isDead ? 'text-rose-500' : 'text-slate-200'}`}>
                            {char.isDead ? '死亡' : `${char.hp} / ${char.maxHp}`}
                          </span>
                        </div>
                        
                        {/* HP Bar */}
                        <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-800">
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
                            <span className="text-[9px] bg-blue-950/40 text-blue-400 border border-blue-900/60 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                              🛡️ +{char.shield}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-xl">
                  <h3 className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> ステージ遷移のルール
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-normal font-sans">
                    すべてのモンスターを討伐すると、北に配置されているポータルが起動する！
                    ポータルを踏むと次のステージへ進み、全員の体力が全回復！
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
              className="space-y-4"
            >
              {/* Battle Arena View (Split Row: Monsters & Player Party) */}
              {battle.phase !== 'battle_result' && battle.phase !== 'game_over' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/30 pointer-events-none"></div>

                  {/* Upper row: Enemies */}
                  <div className="flex justify-around items-center py-2 relative z-10 gap-2">
                    {battle.enemies.map((enemy, idx) => {
                      const isSupportTemp = pendingSkill && (pendingSkill.skill.name === 'ツヨクナール' || pendingSkill.skill.name === 'ヒール');
                      const isTargeted = isChoosingTarget && pendingSkill && !isSupportTemp;
                      const isWeak = (enemy as any).isWeakened;
                      const isBurn = (enemy as any).isBurned && (enemy as any).burnTurns > 0;
                      const isFrost = (enemy as any).isFrozen && (enemy as any).freezeTurns > 0;
                      const isShock = (enemy as any).isShocked && (enemy as any).shockTurns > 0;
                      const isExploded = (enemy as any).isExploded && (enemy as any).explosionTurns > 0;

                      const isSupport = pendingSkill && (pendingSkill.skill.name === 'ツヨクナール' || pendingSkill.skill.name === 'ヒール');
                      const isFocusedTarget = isChoosingTarget && !isSupport && focusedTargetIndex === idx && enemy.hp > 0;

                      return (
                        <motion.div
                          key={`${enemy.name}-${idx}`}
                          className={`p-2 border rounded-lg flex flex-col items-center w-32 text-center transition-all relative ${
                            enemy.hp <= 0 ? 'opacity-20 border-slate-800 bg-slate-950/30' : 'bg-slate-950 border-slate-800'
                          } ${isTargeted && enemy.hp > 0 ? (isFocusedTarget ? 'ring-4 ring-yellow-400 scale-105 border-yellow-400 z-10' : 'ring-4 ring-indigo-500 animate-pulse cursor-pointer') : ''}`}
                          onClick={() => {
                            if (isTargeted && enemy.hp > 0) {
                              setFocusedTargetIndex(idx);
                              submitChosenAction(idx);
                            }
                          }}
                        >
                          {/* Status condition indicators */}
                          <div className="absolute -top-2 flex gap-1">
                            {isBurn && <span className="bg-orange-600 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 text-white">🔥 燃</span>}
                            {isFrost && <span className="bg-sky-600 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 text-white">❄️ 凍</span>}
                            {isWeak && <span className="bg-yellow-600 text-[10px] font-bold px-1 rounded text-white">☠️ 弱</span>}
                            {isShock && <span className="bg-amber-500 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 text-white">⚡ 麻</span>}
                            {isExploded && <span className="bg-red-600 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 text-white">💥 爆</span>}
                          </div>

                          {/* Active Attack Pointer */}
                          {battle.phase === 'enemy_turn' && battle.enemyAttackingIndex === idx && battle.typingTarget && (
                            <div className="absolute -top-7 text-rose-500 font-extrabold animate-bounce text-xs bg-rose-950 px-2 py-0.5 rounded border border-rose-800 shadow">
                              攻撃中！🗡️
                            </div>
                          )}

                          {isFocusedTarget && (
                            <div className="absolute -bottom-2 bg-yellow-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow animate-pulse z-20">
                              🎯 ENTER決定
                            </div>
                          )}

                          <div className="w-12 h-12 flex items-center justify-center mb-1 mx-auto">
                            {renderAvatar(enemy.avatar, "w-full h-full", enemy.hp <= 0)}
                          </div>
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
                  <div className="my-2 bg-slate-950/80 px-4 py-2 border-y border-slate-800/80 max-h-20 overflow-y-auto text-xs text-slate-300 font-mono space-y-1">
                    {battle.battleLogs.slice(-2).map((log, i) => {
                      const formattedLog = log.replace(/！[ 　]+/g, '！\n');
                      return (
                        <div key={i} className="flex gap-2 items-start whitespace-pre-line">
                          <span className="text-indigo-400 font-bold mt-0.5">▶</span>
                          <span className="flex-1">{formattedLog}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Lower row: Player Party Members */}
                  <div className={`flex justify-around items-center py-1.5 relative z-10 gap-2 ${battle.phase === 'battle_result' ? 'hidden' : ''}`}>
                    {party.map((char, idx) => {
                      const isTargetedForSupport = isChoosingTarget && pendingSkill && 
                        (pendingSkill.skill.name === 'ツヨクナール' || pendingSkill.skill.name === 'ヒール');
                      const isProvoking = char.provokeTurns > 0;
                      const isUltimateCharging = char.ultimateCooldown > 0;

                      const isFocusedTarget = isChoosingTarget && isTargetedForSupport && focusedTargetIndex === idx && !char.isDead;

                      return (
                        <div
                          key={char.id}
                          className={`p-2 border rounded-lg flex flex-col items-center w-28 text-center transition-all relative ${
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
                          } ${isTargetedForSupport && !char.isDead ? (isFocusedTarget ? 'ring-4 ring-yellow-400 scale-105 border-yellow-400 z-10' : 'ring-4 ring-green-500 cursor-pointer') : ''}`}
                          onClick={() => {
                            if (isTargetedForSupport && !char.isDead) {
                              setFocusedTargetIndex(idx);
                              submitChosenAction(idx);
                            }
                          }}
                        >
                          {/* Status Badges Container (prevents overlap) */}
                          <div className="absolute -top-2.5 left-0 right-0 flex flex-wrap justify-center gap-0.5 z-20 px-1">
                            {isUltimateCharging && (
                              <div className="bg-purple-600 text-[8px] font-extrabold px-1 py-0.5 rounded text-white shadow whitespace-nowrap">
                                💀崩壊: {char.ultimateCooldown}T
                              </div>
                            )}
                            {isProvoking && (
                              <div className="bg-rose-600 text-[8px] font-bold px-1 py-0.5 rounded text-white shadow whitespace-nowrap">
                                🛡️挑発
                              </div>
                            )}
                            {char.atkBuff > 1.0 && (
                              <div className="bg-emerald-600 text-[8px] font-bold px-1 py-0.5 rounded text-white shadow whitespace-nowrap">
                                ⚔️攻撃▲
                              </div>
                            )}
                            {char.atkBuff < 1.0 && (
                              <div className="bg-amber-600 text-[8px] font-bold px-1 py-0.5 rounded text-white shadow whitespace-nowrap">
                                ⚔️攻撃▼
                              </div>
                            )}
                            {char.defBuff > 1.0 && (
                              <div className="bg-emerald-600 text-[8px] font-bold px-1 py-0.5 rounded text-white shadow whitespace-nowrap">
                                🛡️防御▲
                              </div>
                            )}
                            {char.defBuff < 1.0 && (
                              <div className="bg-amber-600 text-[8px] font-bold px-1 py-0.5 rounded text-white shadow whitespace-nowrap">
                                🛡️防御▼
                              </div>
                            )}
                          </div>
                          {isFocusedTarget && (
                            <div className="absolute -bottom-2 bg-yellow-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow animate-pulse z-20">
                              🎯 ENTER決定
                            </div>
                          )}

                          <div className="w-10 h-10 flex items-center justify-center mb-1 mx-auto">
                            {renderAvatar(char.avatar, "w-full h-full", char.isDead, char.role)}
                          </div>
                          <span className="text-xs font-bold block text-slate-200 leading-tight">{char.name.split(' ')[0]}</span>
                          <span className="text-[9px] text-slate-500 font-mono">LV {char.level}</span>

                          {/* HP status value */}
                          <span className="text-[10px] font-mono font-bold mt-1 text-slate-300">
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
              )}

              {/* Phase Controller Panels */}
              <AnimatePresence mode="wait">

                {/* PHASE 1: ACTION SELECTION COMMAND BOARD */}
                {battle.phase === 'action_select' && (
                  <motion.div
                    key="action_select_panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {renderAvatar(party[battle.currentCharIndex]?.avatar, "w-full h-full")}
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-xs">{party[battle.currentCharIndex]?.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">行動コマンド選択</span>
                        </div>
                      </div>
                      
                      {isChoosingTarget && (
                        <button
                          onClick={() => {
                            setIsChoosingTarget(false);
                            setPendingSkill(null);
                          }}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded flex items-center gap-1 text-slate-300"
                        >
                          <Undo2 className="h-3 w-3" /> 選択し直す
                        </button>
                      )}
                    </div>

                    {!isChoosingTarget ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {party[battle.currentCharIndex]?.skills.map((skill, skillIdx) => {
                          const cooldown = party[battle.currentCharIndex].skillCooldowns?.[skill.name] || 0;
                          const meetsReq = (testMode || party[battle.currentCharIndex].level >= skill.levelRequired) &&
                            (!skill.name.includes('最終奥義') || !party[battle.currentCharIndex].ultimateUsed) &&
                            cooldown === 0;
                          const isFocused = !isChoosingTarget && focusedSkillIndex === skillIdx;
                          return (
                            <button
                              key={skill.name}
                              disabled={!meetsReq}
                              tabIndex={-1}
                              onClick={(e) => {
                                e.currentTarget.blur();
                                setFocusedSkillIndex(skillIdx);
                                selectSkillForChar(skill);
                              }}
                              className={`p-2 rounded-lg border text-left transition-all relative overflow-hidden group flex flex-col justify-between h-18 ${
                                meetsReq
                                  ? isFocused
                                    ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]'
                                    : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60'
                                  : 'bg-slate-950/20 border-slate-900/50 opacity-40 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className={`text-xs font-bold ${meetsReq ? (isFocused ? 'text-yellow-300' : 'text-indigo-300') : 'text-slate-500'}`}>
                                  {skill.name}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {skill.roman}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans line-clamp-1 mt-0.5 leading-relaxed">
                                {skill.desc}
                              </p>
                              {!meetsReq && (
                                <span className="absolute inset-0 bg-slate-950/90 flex items-center justify-center font-bold text-[10px] text-rose-400 font-mono border border-slate-800 text-center px-1">
                                  {!testMode && party[battle.currentCharIndex].level < skill.levelRequired 
                                    ? `レベル ${skill.levelRequired} で解放` 
                                    : cooldown > 0
                                      ? `リチャージ中 (あと ${cooldown} ターン)`
                                      : '最終奥義は1回のみ使用可能'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                        <span className="text-xl block animate-bounce mb-1">🎯</span>
                        <h4 className="font-extrabold text-white mb-0.5 text-xs">対象（ターゲット）を選択してください</h4>
                        <div className="text-[10px] text-slate-400 space-y-1">
                          <p>
                            キーボードの <span className="text-indigo-400 font-bold border border-slate-700 px-1 py-0.5 rounded font-mono">← →</span> または <span className="text-indigo-400 font-bold border border-slate-700 px-1 py-0.5 rounded font-mono">A D</span> でターゲットを選択し、<span className="text-indigo-400 font-bold border border-slate-700 px-1 py-0.5 rounded font-mono">Enter</span> / <span className="text-indigo-400 font-bold border border-slate-700 px-1 py-0.5 rounded font-mono">Space</span> で決定！
                          </p>
                          <p className="text-slate-500">
                            （<span className="text-rose-400 font-bold border border-slate-800 px-1 py-0.5 rounded font-mono">Esc</span> または <span className="text-rose-400 font-bold border border-slate-800 px-1 py-0.5 rounded font-mono">Backspace</span> でスキル選択に戻ります。画面を直接クリックして選ぶことも可能です）
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* PHASE 2: TYPING GAME BOARD (ATTACK AND GUARD EXECUTION) */}
                {(battle.phase === 'action_execute' || battle.phase === 'enemy_turn') && battle.typingTarget && (battle.phase === 'enemy_turn' ? !!battle.currentAttack : true) && (
                  <motion.div
                    key="typing_board"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl relative overflow-hidden text-center space-y-2"
                  >
                    {/* Progress limit bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-75"
                        style={{ width: `${(timeLeft / battle.typingLimitTime) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      {battle.phase === 'action_execute' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center">
                            {renderAvatar(party[battle.executingCharIndex]?.avatar, "w-full h-full")}
                          </div>
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl space-y-6 max-w-lg mx-auto w-full"
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl space-y-6 max-w-lg mx-auto w-full"
                  >
                    <div className="text-6xl animate-bounce">💀🏜️🥀</div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-rose-500 font-mono">全員敗北...</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        パーティー全員 of HPが0になってしまいました。
                      </p>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl text-left text-xs text-slate-300 max-w-md mx-auto">
                      <strong>💡 コンティニュー特典:</strong> <br />
                      レベル、覚えたワザ、すべてのステータスはそのままで、挑戦中のステージの最初からやり真すことができます！
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

              <h2 className="text-[40px] font-extrabold text-yellow-400 font-['Arial'] tracking-tight">
                GAME CLEAR！！
              </h2>
              <p className="text-base text-slate-300 leading-relaxed font-sans">
                世界に平和が訪れた！！
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
        <p>© 2026 Typing Quest. Made with Love by AI & Human Craftsmanship.</p>
      </footer>
    </div>
  );
}
