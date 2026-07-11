export interface Character {
  id: string;
  name: string;
  role: 'hero' | 'mage' | 'priest' | 'warrior';
  avatar: string;
  maxHp: number;
  hp: number;
  level: number;
  skills: Skill[];
  isDead: boolean;
  atkBuff: number; // multiplier, e.g., 1.2
  defBuff: number; // multiplier, e.g., 1.2
  provokeTurns: number; // warrior's provocation
  ultimateCooldown: number; // ultimate life countdown
  shield: number; // shield value
  ultimateUsed?: boolean;
  skillCooldowns?: { [skillName: string]: number };
}

export interface Skill {
  name: string;
  roman: string;
  desc: string;
  levelRequired: number;
}

export interface Enemy {
  name: string;
  romanName: string;
  avatar: string;
  hp: number;
  maxHp: number;
  attacks: EnemyAttack[];
}

export interface EnemyAttack {
  name: string;
  roman: string;
  damage: number;
  effect?: 'burn' | 'freeze' | 'debuff_atk' | 'summon';
  chance?: number;
}

export interface TypingStats {
  totalKeystrokes: number;
  correctKeys: number;
  missedKeys: number;
  totalWordsTyped: number;
  successfulWords: number;
  failedWords: number;
  mistakeMap: { [key: string]: number };
  startTime: number;
  elapsedTimeMs: number;
}

export interface BattleState {
  enemies: Enemy[];
  currentTurn: number; // 1, 2, 3...
  phase: 'action_select' | 'action_execute' | 'enemy_turn' | 'battle_result' | 'game_over' | 'victory';
  selectedSkills: { [charId: string]: Skill }; // skill selected for each character in current turn
  currentCharIndex: number; // index of character currently choosing action
  executingCharIndex: number; // index of character currently typing action
  defendingCharIndex: number; // index of character defending
  enemyAttackingIndex: number; // index of enemy attacking
  currentAttack: EnemyAttack | null;
  typingInput: string;
  typingTarget: string;
  typingStartTime: number;
  typingLimitTime: number; // in seconds
  typingMistakeCount: number; // in current typing session
  battleLogs: string[];
}
