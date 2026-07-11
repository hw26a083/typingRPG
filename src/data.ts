import { Skill, Enemy } from './types';

export const SKILLS: { [role: string]: Skill[] } = {
  hero: [
    {
      name: '斬りつける',
      roman: 'kiritsukeru',
      desc: '選択した敵に5ダメージする。',
      levelRequired: 1,
    },
    {
      name: '回転斬り',
      roman: 'kaitengiri',
      desc: '選択した敵とその左右にいる敵に10ダメージ与える。',
      levelRequired: 1,
    },
    {
      name: '炎舞斬り',
      roman: 'enbugiri',
      desc: '選択した敵に20ダメージを与える。40%の確率でやけど状態にし、3ダメージずつ削る。',
      levelRequired: 2,
    },
    {
      name: '氷雪斬り',
      roman: 'hyousetugiri',
      desc: '選択した敵に30ダメージを与える。50%の確率でこおり状態にし、その敵の行動を封じる。',
      levelRequired: 3,
    },
    {
      name: '最終奥義・空間断絶斬',
      roman: 'saisyuuougi・kuukadanzetuzan',
      desc: '選択した敵に50ダメージを与え、数ターン10ダメージの追加効果。5ターン後に勇者は死亡する。',
      levelRequired: 4,
    },
  ],
  mage: [
    {
      name: 'ひのこ',
      roman: 'hinoko',
      desc: '選択した敵に5ダメージ与える。また30%の確率でやけど状態になる。1ターン継続。',
      levelRequired: 1,
    },
    {
      name: 'ニトロバーン',
      roman: 'nitoroba-n',
      desc: '選択した敵に10ダメージを与える。20%の確率でやけど状態にし1ダメージずつ削る。',
      levelRequired: 1,
    },
    {
      name: 'ライトニングブレイカー',
      roman: 'raitoningbureika-',
      desc: '選択した敵に15ダメージ、その左右の敵に10ダメージ。40%の確率で感電(3ダメ&麻痺)させる。',
      levelRequired: 2,
    },
    {
      name: 'ブリザードマウンテン',
      roman: 'buriza-domaunten',
      desc: '選択した敵に30、左右に20、さらに外側に10ダメージ。50%の確率でこおり状態にする。',
      levelRequired: 3,
    },
    {
      name: '最終奥義・エクスプロージョン',
      roman: 'saisyuuougi・ekusupuro-zyon',
      desc: '敵全体に80ダメージを与え、爆発状態（効果を付与された者は毎ターン30ダメージ受ける）を付与する。しかし、味方にも15ダメージ与えてしまう。5ターン継続して生存していれば、魔法使いは最終奥義を使用したことで死亡してしまう。',
      levelRequired: 4,
    },
  ],
  priest: [
    {
      name: 'たたく',
      roman: 'tataku',
      desc: '選択した敵に3ダメージ与える。',
      levelRequired: 1,
    },
    {
      name: 'ヒール',
      roman: 'hi-ru',
      desc: '選択した味方のHPを30回復させる。',
      levelRequired: 1,
    },
    {
      name: 'オールヒール',
      roman: 'o-ruhi-ru',
      desc: 'すべての味方の体力を20回復させる。',
      levelRequired: 2,
    },
    {
      name: 'ツヨクナール',
      roman: 'tuyokuna-ru',
      desc: '選択した味方の攻撃力・防御力を20%上げる。(2ターン継続)',
      levelRequired: 3,
    },
    {
      name: '最終奥義・ザ・モンクレボリューション',
      roman: 'saisyuuougi・za・monkureboryu-syon',
      desc: '敵攻防を50%下げ、味方攻防を50%上げ、さらに全回復。5ターン後に僧侶は死亡する。',
      levelRequired: 4,
    },
  ],
  warrior: [
    {
      name: '斧で斬る',
      roman: 'onodekiru',
      desc: '選択した敵に7ダメージ与える。',
      levelRequired: 1,
    },
    {
      name: 'ザ・シールド',
      roman: 'za・si-rudo',
      desc: '自身に30ダメージの攻撃を防ぐことができる盾を付与する。',
      levelRequired: 1,
    },
    {
      name: '挑発',
      roman: 'tyouhatu',
      desc: '敵の攻撃を3ターン自身に向けさせる。敵の攻撃力10%UP、防御力10%DOWN。',
      levelRequired: 2,
    },
    {
      name: 'オールシールド',
      roman: 'o-rusi-rudo',
      desc: '味方全員に20ダメージまでの攻撃を防ぐ盾を付与する。',
      levelRequired: 3,
    },
    {
      name: '最終奥義・シールドブレイカー',
      roman: 'saisyuuougi・si-rudobureika-',
      desc: '味方全員に50ダメージの盾を付与し、敵に70ダメージ。5ターン後に戦士は死亡する。',
      levelRequired: 4,
    },
  ],
};

export const STAGES = [
  {
    number: 1,
    name: '草原 (Grassland)',
    bgColor: 'bg-emerald-950 border-emerald-500',
    tileColor: 'bg-emerald-800',
    monsterTemplates: [
      {
        name: 'スライム',
        romanName: 'suraimu',
        avatar: '🟢',
        hp: 10,
        maxHp: 10,
        attacks: [
          { name: 'ふみつける', roman: 'fumitsukeru', damage: 5 },
        ],
      },
      {
        name: 'スケルトン',
        romanName: 'sukeruton',
        avatar: '💀',
        hp: 15,
        maxHp: 15,
        attacks: [
          { name: '矢を放つ', roman: 'yawohanatsu', damage: 10 },
        ],
      },
      {
        name: '魔女',
        romanName: 'majo',
        avatar: '🧙‍♀️',
        hp: 20,
        maxHp: 20,
        attacks: [
          { name: 'ひのこ', roman: 'hinoko', damage: 10, effect: 'burn', chance: 10 },
        ],
      },
    ] as Enemy[],
  },
  {
    number: 2,
    name: '砂漠 (Desert)',
    bgColor: 'bg-amber-950 border-amber-600',
    tileColor: 'bg-amber-800',
    monsterTemplates: [
      {
        name: 'サンドワーム',
        romanName: 'sandowa-mu',
        avatar: '🪱',
        hp: 50,
        maxHp: 50,
        attacks: [
          { name: '噛みつく', roman: 'kamitsuku', damage: 20 },
        ],
      },
      {
        name: 'ミイラ',
        romanName: 'miira',
        avatar: '🧟',
        hp: 40,
        maxHp: 40,
        attacks: [
          { name: 'ひっかく', roman: 'hikkaku', damage: 10 },
          { name: '連れ込む', roman: 'tsurekomu', damage: 15, effect: 'debuff_atk', chance: 20 },
        ],
      },
      {
        name: '蛮族',
        romanName: 'banzoku',
        avatar: '🪓',
        hp: 30,
        maxHp: 30,
        attacks: [
          { name: '切りつける', roman: 'kiritsukeru', damage: 15 },
        ],
      },
    ] as Enemy[],
  },
  {
    number: 3,
    name: '雪原 (Snowfield)',
    bgColor: 'bg-sky-950 border-sky-400',
    tileColor: 'bg-sky-800',
    monsterTemplates: [
      {
        name: 'イエティ',
        romanName: 'ieti',
        avatar: '🦧',
        hp: 100,
        maxHp: 100,
        attacks: [
          { name: 'ぶん殴る', roman: 'bunnaguru', damage: 50 },
        ],
      },
      {
        name: '雪女',
        romanName: 'yukionna',
        avatar: '❄️',
        hp: 70,
        maxHp: 70,
        attacks: [
          { name: '凍らせる', roman: 'kooraseru', damage: 30, effect: 'freeze', chance: 20 },
          { name: 'ふぶき', roman: 'fubuki', damage: 20 },
        ],
      },
      {
        name: '邪悪なペンギン',
        romanName: 'jaakuna-pengin',
        avatar: '🐧',
        hp: 60,
        maxHp: 60,
        attacks: [
          { name: 'つつく', roman: 'tsutsuku', damage: 20 },
          { name: 'すべりつつき', roman: 'suberitsutsuki', damage: 15 },
        ],
      },
    ] as Enemy[],
  },
  {
    number: 4,
    name: '火山 (Volcano)',
    bgColor: 'bg-red-950 border-red-500',
    tileColor: 'bg-red-900',
    monsterTemplates: [
      {
        name: 'マグマスライム',
        romanName: 'magumasuraimu',
        avatar: '🌋',
        hp: 60,
        maxHp: 60,
        attacks: [
          { name: 'ふみつける', roman: 'fumitsukeru', damage: 40, effect: 'burn', chance: 50 },
        ],
      },
      {
        name: 'リザードマン',
        romanName: 'riza-doman',
        avatar: '🐊',
        hp: 80,
        maxHp: 80,
        attacks: [
          { name: '斬りつける', roman: 'kiritsukeru', damage: 50, effect: 'burn', chance: 50 },
          { name: '回転斬り', roman: 'kaitengiri', damage: 40, effect: 'burn', chance: 50 },
        ],
      },
      {
        name: 'フレイムドラゴン',
        romanName: 'fureimudoragon',
        avatar: '🐉',
        hp: 100,
        maxHp: 100,
        attacks: [
          { name: '火を吹く', roman: 'hiwofuku', damage: 50 },
          { name: '咆哮する', roman: 'houkousuru', damage: 0, effect: 'debuff_atk' },
        ],
      },
    ] as Enemy[],
  },
  {
    number: 5,
    name: '魔王城 (Demon Castle)',
    bgColor: 'bg-slate-950 border-purple-600',
    tileColor: 'bg-indigo-950',
    monsterTemplates: [
      {
        name: 'デスナイト',
        romanName: 'desunaito',
        avatar: '💀',
        hp: 110,
        maxHp: 110,
        attacks: [
          { name: 'ダークスラッシュ', roman: 'da-kusurassyu', damage: 45 },
        ],
      },
      {
        name: 'アークデーモン',
        romanName: 'a-kude-mon',
        avatar: '👿',
        hp: 130,
        maxHp: 130,
        attacks: [
          { name: 'ヘルファイア', roman: 'herufaia', damage: 50 },
        ],
      },
      {
        name: 'サキュバス',
        romanName: 'sakyubasu',
        avatar: '🧛‍♀️',
        hp: 100,
        maxHp: 100,
        attacks: [
          { name: 'ドレインキッス', roman: 'doreinkissu', damage: 35, effect: 'debuff_atk', chance: 30 },
        ],
      },
    ] as Enemy[],
  },
];

export const BOSS_TEMPLATE: Enemy = {
  name: '魔王',
  romanName: 'maou',
  avatar: '😈',
  hp: 500,
  maxHp: 500,
  attacks: [
    { name: '召喚する', roman: 'shoukansuru', damage: 0, effect: 'summon' },
    { name: 'ビーム', roman: 'bi-mu', damage: 50 },
    { name: 'メテオストライク', roman: 'meteosutoraiku', damage: 50 },
    { name: '殴りつける', roman: 'naguritsukeru', damage: 40 },
  ],
};
