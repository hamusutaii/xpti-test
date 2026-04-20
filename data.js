(function () {
  const dimensions = [
    {
      id: "dominance",
      label: "节奏主导",
      leftLabel: "跟随",
      rightLabel: "主导"
    },
    {
      id: "attachment",
      label: "情感投入",
      leftLabel: "克制",
      rightLabel: "投入"
    },
    {
      id: "novelty",
      label: "新鲜偏好",
      leftLabel: "稳定",
      rightLabel: "刺激"
    },
    {
      id: "boundary",
      label: "边界收束",
      leftLabel: "开放",
      rightLabel: "专属"
    }
  ];

  const archetypes = [
    {
      id: "dog",
      name: "小狗型",
      emoji: "🐶",
      nickname: "情绪回声体",
      summary: "你不是没主见，你只是把回应当成亲密的证明。",
      interpretation: "你在关系里有很强的接收能力，能很快感到对方语气、节奏、情绪的细小变化。你擅长配合，也愿意为了让互动更顺而微调自己。你的魅力不在张扬，而在那种“我有认真在感受你”的在场感。只是你太懂照顾气氛，也容易把自己悄悄放在后面。",
      attracts: "会被你稳定反馈、温柔托底和情绪耐心打动的人，尤其是外冷内耗、嘴硬心软的人。",
      risk: "你容易把回应做成一种责任，一旦对方抽离，就先怀疑是不是自己哪里做得不够。",
      advice: "把“给别人安全感”和“给自己边界感”同时练起来。你会更轻松，也会更有选择权。",
      profile: {
        dominance: 28,
        attachment: 84,
        novelty: 38,
        boundary: 58
      },
      weights: {
        dominance: 1.2,
        attachment: 1.6,
        novelty: 0.9,
        boundary: 1
      }
    },
    {
      id: "hunter",
      name: "猎手型",
      emoji: "🦅",
      nickname: "节奏发动机",
      summary: "你天生会开场，也习惯把暧昧推成故事。",
      interpretation: "你在互动里自带推进器。你不太愿意把方向盘长期交给别人，喜欢读局、起势、定调，也享受那种“局面因为我而被点亮”的感觉。你吸引人的地方，不只是强，而是你总能让关系从模糊变得有戏。你最大的课题不是勇敢，而是学会在掌控之外，也允许真诚发生。",
      attracts: "容易吸引有反差感、欣赏力量感、又希望被带起情绪的人。",
      risk: "当你太专注于推动节奏时，可能会把对方的真实承受力误读成配合度。",
      advice: "继续保留你的主动，但记得给反馈留口子。真正高级的主导，不是压过别人，而是看见别人。",
      profile: {
        dominance: 84,
        attachment: 48,
        novelty: 68,
        boundary: 52
      },
      weights: {
        dominance: 1.7,
        attachment: 0.8,
        novelty: 1.2,
        boundary: 0.9
      }
    },
    {
      id: "cat",
      name: "猫系",
      emoji: "🐈",
      nickname: "留白操盘手",
      summary: "你不靠热烈取胜，靠的是边界、留白和让人猜不透。",
      interpretation: "你身上最强的吸引力，不是热，而是分寸。你往往不会第一时间把情绪和定义都端出来，而是保持空间、保持自我，也保持一点不可完全被解释的部分。你擅长让人靠近，却不轻易让人一眼看穿。你不是冷，只是更在意自主和呼吸感。",
      attracts: "会吸引那些对神秘感、独立感和微妙反差特别上头的人。",
      risk: "你太习惯把自己藏得漂亮，有时连真正值得的人也会被挡在门外。",
      advice: "留白是魅力，但别让所有重要关系都只能靠猜。偶尔明确一下，不会削弱你，反而会让你更高级。",
      profile: {
        dominance: 62,
        attachment: 24,
        novelty: 56,
        boundary: 34
      },
      weights: {
        dominance: 1.1,
        attachment: 1.6,
        novelty: 1,
        boundary: 1.2
      }
    },
    {
      id: "explorer",
      name: "体验派",
      emoji: "🦊",
      nickname: "高感知玩家",
      summary: "你不是不认真，只是你需要关系一直活着。",
      interpretation: "你对关系里的新鲜度、张力、未知感有很强的感受力。太快固定的模式会让你失去电流感，而你真正迷恋的，是变化、化学反应和不断被刷新的人际体验。你不一定轻浮，相反，你常常只是更诚实地承认自己需要刺激和流动。",
      attracts: "会吸引同样好奇、反应快、愿意一起试不同节奏的人。",
      risk: "当热度下降时，你可能会误把“进入深水区”理解成“已经没感觉了”。",
      advice: "别只追求新鲜，也要训练自己识别“慢热但有后劲”的连接。那会让你的体验更高级，而不是更少。",
      profile: {
        dominance: 56,
        attachment: 42,
        novelty: 88,
        boundary: 20
      },
      weights: {
        dominance: 0.9,
        attachment: 0.8,
        novelty: 1.8,
        boundary: 1.3
      }
    },
    {
      id: "observer",
      name: "观察者",
      emoji: "🦉",
      nickname: "清醒旁观席",
      summary: "你对情绪很敏感，但不轻易把自己交出去。",
      interpretation: "你常常先看，再动。不是没感觉，而是你会本能地先分析动机、节奏、风险和后果。你擅长维持清醒，也擅长在情绪场里给自己留一个安全出口。你的成熟感很强，但有时也会因为太会理解局面，而忘了允许自己真正沉进去一次。",
      attracts: "容易吸引情绪强烈、希望被理解、想在你这里获得稳定判断的人。",
      risk: "你可能把“清醒”用成盔甲，结果明明心动，却永远停在评估阶段。",
      advice: "保留你的判断力，但给自己一个小许可：不是每次都要先算明白，关系里也允许先感受再总结。",
      profile: {
        dominance: 38,
        attachment: 18,
        novelty: 32,
        boundary: 68
      },
      weights: {
        dominance: 1,
        attachment: 1.7,
        novelty: 1,
        boundary: 1.1
      }
    },
    {
      id: "binding",
      name: "绑定型",
      emoji: "🦢",
      nickname: "深水专属派",
      summary: "你一旦认真，就会想把彼此放进同一个坐标系里。",
      interpretation: "你对关系的理解不是浅尝辄止，而是想要深、想要真，也想要清楚。你并不只是需要陪伴，你更在意的是彼此有没有被认真放进未来的视野里。你天生带着一种“想把人留在心里，也留在生活里”的倾向，所以你的安全感往往和专属感绑定得很紧。",
      attracts: "会吸引想安定下来、想被认真对待、也想拥有明确归属的人。",
      risk: "你一旦认定，就可能把关系浓度提得过快，给自己和对方都造成无形压力。",
      advice: "你的深情不是问题，节奏才是。把深度和推进分开，你会更不容易在爱里用力过猛。",
      profile: {
        dominance: 48,
        attachment: 90,
        novelty: 30,
        boundary: 88
      },
      weights: {
        dominance: 0.8,
        attachment: 1.6,
        novelty: 0.9,
        boundary: 1.7
      }
    },
    {
      id: "chaos",
      name: "混沌型",
      emoji: "🦂",
      nickname: "情境变体",
      summary: "你不是反复横跳，你只是不同情境下会启动完全不同的自己。",
      interpretation: "你很难被一句话定义，因为你不是单线程的人。你可能在熟悉的人面前很敢主导，在真正心动的人面前却瞬间变得敏感；你有时想要稳定，有时又会被未知拉走。你不是没有风格，而是你的风格高度依赖当下的人、气氛和信任程度。你让人上头，也让人很难提前预测。",
      attracts: "会吸引同样复杂、接受度高、对变化不怕的人，也容易吸引想研究你的人。",
      risk: "你最容易把自己困在“我到底想要什么”的循环里，今天说服自己，明天又被另一面推翻。",
      advice: "别急着把自己归类成稳定版本。先记录哪些情境会打开你不同的一面，你会更容易找到真正适合你的关系结构。",
      profile: {
        dominance: 52,
        attachment: 52,
        novelty: 62,
        boundary: 48
      },
      weights: {
        dominance: 1,
        attachment: 1,
        novelty: 1,
        boundary: 1
      }
    }
  ];

  const questions = [
    {
      id: "q01",
      text: "一段关系刚升温时，你更像：",
      options: [
        {
          text: "先抛出信号，把节奏带起来。",
          scores: { dominance: 2, novelty: 1 }
        },
        {
          text: "等对方靠近一点，再顺着回应。",
          scores: { dominance: -2, attachment: 1 }
        }
      ]
    },
    {
      id: "q02",
      text: "如果对方一天没回你，你第一反应更像：",
      options: [
        {
          text: "会在意，想确认是不是哪里出了问题。",
          scores: { attachment: 2, boundary: 1 }
        },
        {
          text: "先忙自己的，不急着追问。",
          scores: { attachment: -2, dominance: 1 }
        }
      ]
    },
    {
      id: "q03",
      text: "比起按部就班，你更容易被哪种关系吸引：",
      options: [
        {
          text: "有新鲜感、带点未知的。",
          scores: { novelty: 2, boundary: -1 }
        },
        {
          text: "稳定、清楚、可预期的。",
          scores: { novelty: -2, boundary: 1, attachment: 1 }
        }
      ]
    },
    {
      id: "q04",
      text: "在互动里你更舒服的状态是：",
      options: [
        {
          text: "我来定调，对方跟上。",
          scores: { dominance: 2, boundary: 1 }
        },
        {
          text: "彼此看感觉，不必谁主导。",
          scores: { dominance: -1, boundary: -1, novelty: 1 }
        }
      ]
    },
    {
      id: "q05",
      text: "你理想中的靠近方式更像：",
      options: [
        {
          text: "慢慢建立默契，最好越来越专属。",
          scores: { attachment: 2, boundary: 2 }
        },
        {
          text: "先感受化学反应，不急着定义。",
          scores: { novelty: 1, boundary: -2, attachment: -1 }
        }
      ]
    },
    {
      id: "q06",
      text: "别人夸你时，更可能这样形容你：",
      options: [
        {
          text: "有压迫感，但很让人上头。",
          scores: { dominance: 2, attachment: -1 }
        },
        {
          text: "很会给情绪价值，让人放松。",
          scores: { attachment: 2, dominance: -1 }
        }
      ]
    },
    {
      id: "q07",
      text: "如果一段关系开始变得太熟悉，你会：",
      options: [
        {
          text: "主动换玩法、换场景、换气氛。",
          scores: { novelty: 2, dominance: 1 }
        },
        {
          text: "觉得熟悉本身就是安全感。",
          scores: { novelty: -2, attachment: 1, boundary: 1 }
        }
      ]
    },
    {
      id: "q08",
      text: "当对方情绪明显波动时，你更可能：",
      options: [
        {
          text: "先分析原因，再决定要不要回应。",
          scores: { attachment: -2, boundary: 1 }
        },
        {
          text: "先接住情绪，再谈逻辑。",
          scores: { attachment: 2 }
        }
      ]
    },
    {
      id: "q09",
      text: "你对“留一点神秘感”的态度是：",
      options: [
        {
          text: "很好，太快看透就没意思了。",
          scores: { attachment: -1, novelty: 1, dominance: 1 }
        },
        {
          text: "关系里我更喜欢坦白和确定。",
          scores: { attachment: 1, boundary: 2, novelty: -1 }
        }
      ]
    },
    {
      id: "q10",
      text: "和人相处时，你更怕：",
      options: [
        {
          text: "无聊。",
          scores: { novelty: 2 }
        },
        {
          text: "失控。",
          scores: { boundary: 2, dominance: 1 }
        }
      ]
    },
    {
      id: "q11",
      text: "如果对方很会拿捏节奏，你通常会：",
      options: [
        {
          text: "想反过来掌控局面。",
          scores: { dominance: 2, novelty: 1 }
        },
        {
          text: "享受被带着走，只要感觉对。",
          scores: { dominance: -2, attachment: 1 }
        }
      ]
    },
    {
      id: "q12",
      text: "你更容易因为哪件事心动：",
      options: [
        {
          text: "对方锋利、有主见、有自己的世界。",
          scores: { dominance: 1, attachment: -1, novelty: 1 }
        },
        {
          text: "对方愿意稳定出现，给你偏爱。",
          scores: { attachment: 2, boundary: 1 }
        }
      ]
    },
    {
      id: "q13",
      text: "关于关系边界，你更认同：",
      options: [
        {
          text: "说清楚规则，大家才安心。",
          scores: { boundary: 2, attachment: 1 }
        },
        {
          text: "边界可以随着感觉慢慢长出来。",
          scores: { boundary: -2, novelty: 1 }
        }
      ]
    },
    {
      id: "q14",
      text: "当关系进入拉扯期，你更像：",
      options: [
        {
          text: "越不确定，越想把局面扳回来。",
          scores: { dominance: 2, attachment: 1 }
        },
        {
          text: "退一步观察，不急着下注。",
          scores: { attachment: -2, dominance: -1 }
        }
      ]
    },
    {
      id: "q15",
      text: "如果今晚只能选一种氛围，你更想要：",
      options: [
        {
          text: "熟悉的人、熟悉的默契、稳稳的热度。",
          scores: { novelty: -2, attachment: 1, boundary: 1 }
        },
        {
          text: "新鲜的火花，最好带点不可预测。",
          scores: { novelty: 2, boundary: -1 }
        }
      ]
    },
    {
      id: "q16",
      text: "别人靠近你的速度，理想上应该：",
      options: [
        {
          text: "慢一点，先让我确认值不值得。",
          scores: { attachment: -1, boundary: 1, dominance: 1 }
        },
        {
          text: "快一点，情绪来了就别太克制。",
          scores: { attachment: 1, novelty: 1, boundary: -1 }
        }
      ]
    },
    {
      id: "q17",
      text: "你在关系里最难放掉的是：",
      options: [
        {
          text: "主动权。",
          scores: { dominance: 2, boundary: 1 }
        },
        {
          text: "被偏爱的确认。",
          scores: { attachment: 2, boundary: 1 }
        }
      ]
    },
    {
      id: "q18",
      text: "如果对方忽然变得特别黏人，你会：",
      options: [
        {
          text: "有点想后退，保留自己的空间。",
          scores: { attachment: -2, boundary: -1 }
        },
        {
          text: "只要真诚，我会觉得被需要也不错。",
          scores: { attachment: 2, boundary: 1 }
        }
      ]
    },
    {
      id: "q19",
      text: "你更相信哪种吸引力：",
      options: [
        {
          text: "强烈但短暂，也值得体验一次。",
          scores: { novelty: 2, boundary: -1 }
        },
        {
          text: "慢热但扎实，后劲更大。",
          scores: { novelty: -1, attachment: 1, boundary: 2 }
        }
      ]
    },
    {
      id: "q20",
      text: "在一段互动里，你更常扮演：",
      options: [
        {
          text: "点火的人。",
          scores: { dominance: 2, novelty: 1 }
        },
        {
          text: "读空气的人。",
          scores: { dominance: -1, attachment: 1, boundary: 1 }
        }
      ]
    },
    {
      id: "q21",
      text: "如果关系一直没有明确答案，你会：",
      options: [
        {
          text: "继续试探，看看还能玩出什么新层次。",
          scores: { novelty: 2, boundary: -2, dominance: 1 }
        },
        {
          text: "想把话说开，不想一直悬着。",
          scores: { boundary: 2, attachment: 1 }
        }
      ]
    },
    {
      id: "q22",
      text: "当别人说你“有点难懂”时，你通常：",
      options: [
        {
          text: "默认，这是我的保护色。",
          scores: { attachment: -2, dominance: 1 }
        },
        {
          text: "会解释清楚，不想让误会发酵。",
          scores: { attachment: 1, boundary: 1 }
        }
      ]
    },
    {
      id: "q23",
      text: "你更容易被自己的哪一面绊住：",
      options: [
        {
          text: "情绪一上来就想投入太深。",
          scores: { attachment: 2, boundary: 1, dominance: -1 }
        },
        {
          text: "总想保持清醒，结果错过沉浸。",
          scores: { attachment: -2, novelty: -1, boundary: 1 }
        }
      ]
    },
    {
      id: "q24",
      text: "如果必须给关系定一个关键词，你更偏向：",
      options: [
        {
          text: "独特。",
          scores: { novelty: 1, dominance: 1, boundary: -1 }
        },
        {
          text: "归属。",
          scores: { attachment: 2, boundary: 2 }
        }
      ]
    }
  ];

  const shareTemplates = [
    "测完这个关系风格测试，我居然是「{type}」{match}%。系统说我属于“{nickname}”那一挂，听起来比我本人还会观察我。副型是 {secondary}。这类文案，发给最懂你的人看会更准。",
    "朋友总说我很难一句话说清，结果这次被归成了「{type}」：{summary}。匹配度 {match}%，四维里最明显的是 {dimensionHighlight}。有点被说中，又不想太快承认。",
    "成年人的关系里，真正暴露性格的不是嘴上说什么，而是你怎么靠近、怎么留白、怎么要安全感。我的答案是「{type}」{match}% 。一句话总结：{summary}"
  ];

  window.QUIZ_DATA = {
    dimensions,
    archetypes,
    questions,
    shareTemplates
  };
})();
