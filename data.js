(function () {
  const dimensions = [
    { id: "dominance", label: "节奏位置", leftLabel: "响应", rightLabel: "主动" },
    { id: "attachment", label: "情感卷入", leftLabel: "抽离", rightLabel: "依附" },
    { id: "novelty", label: "体验取向", leftLabel: "稳定", rightLabel: "新鲜" },
    { id: "boundary", label: "关系边界", leftLabel: "开放", rightLabel: "排他" },
    { id: "control", label: "局面把握", leftLabel: "随缘", rightLabel: "掌控" },
    { id: "expression", label: "表达方式", leftLabel: "克制", rightLabel: "直接" },
    { id: "security", label: "安全来源", leftLabel: "自稳", rightLabel: "确认" },
    { id: "pace", label: "升温速度", leftLabel: "慢热", rightLabel: "快进" }
  ];

  const archetypes = [
    {
      id: "dog",
      name: "小狗型",
      emoji: "🐶",
      nickname: "反馈依恋者",
      summary: "你不是黏，你只是很会把回应当成关系的体温计。",
      interpretation: "你在关系里最敏锐的，不是表面的热闹，而是对方有没有接住你。你会记得谁回得认真，谁在情绪上回来过，谁只是礼貌但不真正靠近。很多人以为你温和、好相处、适配度高，可真正驱动你的从来不是讨好，而是确认感。你愿意给耐心，也愿意调整节奏，但前提是你能感到自己不是一个人在维护这段联系。一旦确认足够，你会非常稳定；一旦回应含糊，你的脑子也会比表面忙得多。",
      attracts: "你会吸引那些嘴上说自己没事、内里却很吃被照顾和被放在心上的人。",
      risk: "你容易在关系里长期值班，把体贴做成责任，最后先耗掉的是自己的稳定感。",
      advice: "继续保留你的温度，但别把安全感全部外包。你越能自稳，越不容易被细节拖走。",
      profile: {
        dominance: 34,
        attachment: 86,
        novelty: 38,
        boundary: 64,
        control: 38,
        expression: 68,
        security: 82,
        pace: 56
      },
      weights: {
        dominance: 1.2,
        attachment: 1.8,
        novelty: 0.9,
        boundary: 1.1,
        control: 1,
        expression: 1.2,
        security: 1.7,
        pace: 1
      }
    },
    {
      id: "hunter",
      name: "猎手型",
      emoji: "🦅",
      nickname: "局面发动机",
      summary: "你很少等关系自然发生，你更习惯让它发生。",
      interpretation: "你对局面的敏感，不体现在读懂情绪，而体现在你知道什么时候该推进。别人还在观察，你已经在起势；别人还在试探，你已经在决定这段关系有没有必要继续往前。你不是为了控制而控制，而是你本能地不喜欢悬着。你喜欢把模糊变清楚，把停滞变流动，把被动场面拉回到自己能掌握的节奏里。真正让人上头的不是你的强势，而是你那种清楚、利落、让人无处躲闪的存在感。",
      attracts: "你会吸引欣赏决断力、喜欢被带起节奏、又期待被认真对待的人。",
      risk: "你容易把推进当成效率，把关系做得很顺，却忘了有些人需要的是进入，不是被推着进入。",
      advice: "你不需要变慢，但需要留白。高级的主导不是一直往前，而是知道什么时候让对方也有参与感。",
      profile: {
        dominance: 86,
        attachment: 46,
        novelty: 62,
        boundary: 58,
        control: 88,
        expression: 76,
        security: 34,
        pace: 80
      },
      weights: {
        dominance: 1.8,
        attachment: 0.9,
        novelty: 1.1,
        boundary: 1,
        control: 1.8,
        expression: 1.3,
        security: 0.9,
        pace: 1.2
      }
    },
    {
      id: "cat",
      name: "猫系",
      emoji: "🐈",
      nickname: "留白掌舵者",
      summary: "你不靠热烈取胜，你靠的是边界、留白和让人猜不透。",
      interpretation: "你很少一开始就把自己摊得很开。不是没有感觉，而是你需要先判断这个人值不值得、这个局面会不会失衡、这段靠近会不会太快拿走你的空间。很多人会把你理解成慢热、难懂、有点冷，实际上你只是太清楚什么叫“失去自我感”。你很擅长拿捏距离，也知道什么时候后退会比靠近更有力量。你吸引人的不是热度，而是那种让人一直想再往里看一点的克制感。",
      attracts: "你会吸引对独立感、分寸感和反差感特别上头的人。",
      risk: "你太会保护自己，最后容易把真正值得建立深度的人一起挡在门外。",
      advice: "留白是魅力，但别让所有重要信息都只能靠别人猜。偶尔明确，不会削弱你。",
      profile: {
        dominance: 58,
        attachment: 26,
        novelty: 58,
        boundary: 34,
        control: 64,
        expression: 26,
        security: 24,
        pace: 38
      },
      weights: {
        dominance: 1.1,
        attachment: 1.8,
        novelty: 1,
        boundary: 1.2,
        control: 1.4,
        expression: 1.8,
        security: 1.5,
        pace: 1
      }
    },
    {
      id: "explorer",
      name: "体验派",
      emoji: "🦊",
      nickname: "高刺激采样者",
      summary: "你不一定轻浮，但你确实很难对没有流动感的关系保持兴奋。",
      interpretation: "你对关系里的新鲜度、反差感、未完成感和化学反应非常敏感。别人觉得稳定是答案，你更容易先感受到空气有没有电流。你不怕变化，也不排斥尝试，甚至在很多时候，正是变化本身让你觉得自己真的活着。你享受被刷新，也享受一起试出新层次，但一旦一切都变得太 predictable，你就会开始失神。你不是不能认真，你只是很难对没有变化的认真保持投入。",
      attracts: "你会吸引好奇心强、接受度高、愿意一起试不同相处方式的人。",
      risk: "你容易把刺激感下降误判成关系不对，于是把本来能沉下去的连接停在浅层。",
      advice: "保留你对活力的要求，但训练自己识别一种更安静的后劲。不是所有好关系都靠高浓度维持。",
      profile: {
        dominance: 56,
        attachment: 42,
        novelty: 90,
        boundary: 20,
        control: 42,
        expression: 62,
        security: 34,
        pace: 72
      },
      weights: {
        dominance: 0.9,
        attachment: 0.8,
        novelty: 1.9,
        boundary: 1.6,
        control: 1,
        expression: 1.1,
        security: 1,
        pace: 1.2
      }
    },
    {
      id: "observer",
      name: "观察者",
      emoji: "🦉",
      nickname: "清醒延迟器",
      summary: "你先启动的不是心动，而是判断。",
      interpretation: "你不是没有情绪，而是很少立刻让情绪接管自己。你会先看边界、看动机、看投入产出，再决定要不要真的往里走。你很擅长保持清醒，也很擅长在关系里给自己保留退出权，所以很多人会觉得你成熟、稳定、难被撼动。可只有你自己知道，那不是不动心，而是你太清楚一段关系会把人带到哪里。你不是慢，你只是不会轻易交出判断权。",
      attracts: "你会吸引那些情绪浓度高、需要被理解、又会被你的稳定感安抚的人。",
      risk: "你最容易错过的，不是错误的人，而是那些需要你先放下分析，才能真正进入的关系。",
      advice: "保留你的判断力，但别让每次靠近都要先通过完整审批。有些东西只能边感受边确认。",
      profile: {
        dominance: 34,
        attachment: 20,
        novelty: 34,
        boundary: 62,
        control: 68,
        expression: 22,
        security: 28,
        pace: 28
      },
      weights: {
        dominance: 1,
        attachment: 1.8,
        novelty: 1,
        boundary: 1.1,
        control: 1.4,
        expression: 1.9,
        security: 1.2,
        pace: 1.4
      }
    },
    {
      id: "binding",
      name: "绑定型",
      emoji: "🦢",
      nickname: "深水归属者",
      summary: "你不只是想靠近，你更想知道自己是不是被认真放进对方的人生坐标里。",
      interpretation: "你对关系的要求不是表面的热闹，而是明确和连续。你可以慢慢投入，也愿意认真经营，但一旦认定，你很自然就会开始要边界、要归属、要排位。你不喜欢那种一直模糊、一直游移、一直说不清的位置，因为你真正想要的是被认真放进生活，而不是只被放进一时情绪。你能给出很深的稳定感，也很懂长期关系靠什么维持，但你也因此容易在不确定时比别人更焦虑。",
      attracts: "你会吸引那些想被认真对待、想拥有明确归属、也想真正稳定下来的人。",
      risk: "你对模糊区的耐受度不高，一旦感觉不够确定，就容易提前把关系推进到要答案的阶段。",
      advice: "你的深度不是问题，节奏才是。别把“想认真”误用成“必须马上落实”。",
      profile: {
        dominance: 46,
        attachment: 92,
        novelty: 28,
        boundary: 90,
        control: 70,
        expression: 58,
        security: 84,
        pace: 52
      },
      weights: {
        dominance: 0.9,
        attachment: 1.9,
        novelty: 1,
        boundary: 1.9,
        control: 1.2,
        expression: 1,
        security: 1.7,
        pace: 1
      }
    },
    {
      id: "chaos",
      name: "混沌型",
      emoji: "🦂",
      nickname: "情境分裂体",
      summary: "你不是没有风格，你是不同场景会叫醒完全不同的自己。",
      interpretation: "你身上的矛盾不是装出来的，而是真的共存。你可能在不重要的人面前很冷静，在真正心动的人面前却突然变得很需要确认；你也可能平时追求新鲜，可一旦认定又想要边界和秩序。你的反应高度依赖对象、信任程度、当下氛围和你对局面的判断，所以别人很难一句话概括你。你复杂，但也因此很有后劲，因为你不是单线程的人。",
      attracts: "你会吸引对复杂人格有兴趣、愿意研究你、也不怕关系里有变化和反差的人。",
      risk: "你容易被自己的多套反应系统拉扯，今天说服了自己，明天又被另一面推翻。",
      advice: "先别急着归类自己。把会触发你不同一面的情境记下来，你会更快看清真实结构。",
      profile: {
        dominance: 52,
        attachment: 52,
        novelty: 60,
        boundary: 44,
        control: 50,
        expression: 50,
        security: 50,
        pace: 54
      },
      weights: {
        dominance: 1,
        attachment: 1,
        novelty: 1,
        boundary: 1,
        control: 1,
        expression: 1,
        security: 1,
        pace: 1
      }
    },
    {
      id: "reversal",
      name: "反转型",
      emoji: "🪞",
      nickname: "强外壳软内里",
      summary: "你表面很会掌局，真正动心时反而比谁都容易露出软肋。",
      interpretation: "你平时看起来清醒、有分寸、甚至带点压迫感，可一旦关系进入真正重要的区域，你内里那部分很想确认、很想靠近、很想被认真留下来的需求就会浮上来。你不是双标，你只是有明显的内外反差。对普通关系，你能非常理性；对真正心动的人，你会突然从掌控切换成在意。这种反转很有魅力，因为别人总会在你身上看到第二层，但也会让你自己有时不太适应。",
      attracts: "你会吸引既吃你外在锋利感、又会被你偶尔暴露的认真击中的人。",
      risk: "你容易高估自己“应该很稳”的那一面，低估自己一旦认真其实会多在意。",
      advice: "接受自己的反差，不必一直扮演单一版本。你越能认出那层软，越不会在关键时刻措手不及。",
      profile: {
        dominance: 70,
        attachment: 72,
        novelty: 50,
        boundary: 60,
        control: 76,
        expression: 48,
        security: 70,
        pace: 62
      },
      weights: {
        dominance: 1.4,
        attachment: 1.5,
        novelty: 1,
        boundary: 1.1,
        control: 1.5,
        expression: 1.2,
        security: 1.5,
        pace: 1
      }
    },
    {
      id: "steady",
      name: "稳态型",
      emoji: "🪨",
      nickname: "低噪长期派",
      summary: "你不追高浓度，你追的是能长期维持的舒服。",
      interpretation: "你对关系最大的要求不是上头，而是可持续。你不太喜欢起伏过大的拉扯，也不会轻易被短期高热带偏。你看重的是有没有秩序、有没有一致性、有没有长期相处下去的稳定感。很多人会以为你不够戏剧、不够刺激，但真正进入你的节奏后会发现，你不是没感觉，你只是比很多人更清楚，关系真正值钱的是能不能久。你喜欢低噪、讨厌反复，是典型的“热度不一定高，但质量要稳”。",
      attracts: "你会吸引那些厌倦消耗、想过稳定生活、也愿意在关系里保持一致性的人。",
      risk: "你容易对过于不稳定的人迅速失去耐心，也可能把某些有生命力的变化误判成风险。",
      advice: "继续保护你的稳定感，但别让“稳”变成过早关门。合适的变化未必是破坏，有时是更新。",
      profile: {
        dominance: 44,
        attachment: 62,
        novelty: 20,
        boundary: 74,
        control: 62,
        expression: 48,
        security: 62,
        pace: 26
      },
      weights: {
        dominance: 0.9,
        attachment: 1.3,
        novelty: 1.9,
        boundary: 1.3,
        control: 1.2,
        expression: 1,
        security: 1.2,
        pace: 1.4
      }
    },
    {
      id: "probing",
      name: "试探型",
      emoji: "🦔",
      nickname: "谨慎靠近者",
      summary: "你不是慢，你只是每往前一步都想确认地面是不是稳的。",
      interpretation: "你对关系不是没兴趣，而是进入之前一定会先看很多信号。你会观察对方是否稳定、是否一致、是否值得你把那部分更真的自己交出来。你不是冷，也不是端着，你只是对失控和落空的代价很有记忆，所以不会轻易快进。别人会觉得你节奏慢、反馈不够满，可一旦你确认安全，你其实会比很多人投入得更深。问题在于，很多人还没等到你真正打开，就已经以为你没兴趣。",
      attracts: "你会吸引那些愿意给耐心、对细节敏感、也懂得慢慢建立信任的人。",
      risk: "你太依赖前期判断，容易把本来可以自然长出来的关系挡在外面。",
      advice: "保留你的谨慎，但别把所有靠近都变成资格审核。信任确实要看，但也要给它长出来的机会。",
      profile: {
        dominance: 38,
        attachment: 58,
        novelty: 34,
        boundary: 68,
        control: 58,
        expression: 34,
        security: 72,
        pace: 24
      },
      weights: {
        dominance: 1,
        attachment: 1.2,
        novelty: 1,
        boundary: 1.2,
        control: 1.1,
        expression: 1.5,
        security: 1.7,
        pace: 1.7
      }
    }
  ];

  const questions = [
    {
      id: "q01",
      text: "第一次见面结束后，气氛还留在身上。你更像哪种人？",
      options: [
        { text: "到家前就发一句“今晚比我预期好”。", scores: { dominance: 2, expression: 2, pace: 1 } },
        { text: "回到家再慢慢接话，但不会拖到第二天。", scores: { expression: 1, attachment: 1, pace: 0 } },
        { text: "先不主动，让那点余温自己发酵。", scores: { expression: -1, pace: -1, control: 1 } },
        { text: "会刻意压一压，等确认对方也在意再回应。", scores: { security: 2, expression: -2, pace: -2 } }
      ]
    },
    {
      id: "q02",
      text: "聚会里，对方和别人聊得正热。你的自然反应更接近：",
      options: [
        { text: "找个时机把注意力重新拉回来。", scores: { dominance: 1, control: 2, boundary: 1 } },
        { text: "先不急，等气口合适再接近。", scores: { control: 0, pace: -1, security: -1 } },
        { text: "没什么感觉，真正的连接不靠这一会儿证明。", scores: { security: -2, boundary: -1, control: -1 } },
        { text: "表面没事，心里会把这当成一个信号。", scores: { security: 2, attachment: 1, boundary: 1 } }
      ]
    },
    {
      id: "q03",
      text: "对方临时取消原本说好的见面。你更可能：",
      options: [
        { text: "马上问一句那改到什么时候。", scores: { control: 2, security: 1, pace: 1 } },
        { text: "表示理解，但会观察后续有没有主动补回来。", scores: { security: 1, control: 1, expression: -1 } },
        { text: "不太当回事，先各忙各的。", scores: { security: -2, attachment: -1, pace: -1 } },
        { text: "嘴上说没事，心里其实会迅速降温。", scores: { attachment: 1, security: 2, boundary: 1 } }
      ]
    },
    {
      id: "q04",
      text: "聊到比较私人的经历时，你通常：",
      options: [
        { text: "如果氛围对，会把真实想法讲得很清楚。", scores: { expression: 2, attachment: 1, pace: 1 } },
        { text: "会讲，但只讲能控制住的那一层。", scores: { expression: 0, control: 1, security: 1 } },
        { text: "更习惯先听，对自己的部分点到为止。", scores: { expression: -2, control: 1, pace: -1 } },
        { text: "会给一些线索，让对方自己慢慢读。", scores: { expression: -1, novelty: 1, boundary: -1 } }
      ]
    },
    {
      id: "q05",
      text: "关系开始升温，但还没明确说开。你更自然的是：",
      options: [
        { text: "默认边界该慢慢收窄了。", scores: { boundary: 2, attachment: 1, security: 1 } },
        { text: "先顺着感觉走，不急着下定义。", scores: { boundary: -2, novelty: 1, pace: 0 } },
        { text: "我会观察对方是不是也在同步靠近。", scores: { security: 2, attachment: 1, pace: -1 } },
        { text: "会主动试探一下对方对这段关系的理解。", scores: { expression: 1, dominance: 1, boundary: 1 } }
      ]
    },
    {
      id: "q06",
      text: "一个随口提起的小计划，对方突然说“那就这周去吧”。你更像：",
      options: [
        { text: "顺势接住，甚至开始安排细节。", scores: { pace: 2, dominance: 1, control: 1 } },
        { text: "会答应，但会留一点弹性。", scores: { pace: 1, control: -1, novelty: 1 } },
        { text: "会觉得有点快，想再看看是不是一时兴起。", scores: { pace: -2, control: 1, security: 1 } },
        { text: "会先看自己有没有真的想去，不因为气氛硬接。", scores: { control: 1, security: -1, expression: 1 } }
      ]
    },
    {
      id: "q07",
      text: "你感觉到对方状态不太对，但对方没主动说。你通常：",
      options: [
        { text: "直接问一句，省得彼此猜。", scores: { expression: 2, attachment: 1, dominance: 1 } },
        { text: "先给个口子，看对方愿不愿意接。", scores: { expression: 1, control: -1, attachment: 1 } },
        { text: "先给空间，等他自己开口。", scores: { expression: -1, security: -1, control: -1 } },
        { text: "会默默记住这个异常，之后再看。", scores: { control: 1, security: 1, expression: -2 } }
      ]
    },
    {
      id: "q08",
      text: "一段关系开始变得规律时，你更容易：",
      options: [
        { text: "想换个场景或玩法，让它别太快定型。", scores: { novelty: 2, pace: 1, control: -1 } },
        { text: "觉得规律本身就是好信号。", scores: { novelty: -2, security: 1, boundary: 1 } },
        { text: "表面接受规律，但心里会警惕无聊。", scores: { novelty: 1, attachment: -1, security: -1 } },
        { text: "会继续观察它究竟是稳定，还是只是惯性。", scores: { control: 1, novelty: -1, pace: -1 } }
      ]
    },
    {
      id: "q09",
      text: "碰到一个明显很有吸引力、但一直不太好读懂的人，你会：",
      options: [
        { text: "更想靠近，模糊感本身就有吸引力。", scores: { novelty: 2, pace: 1, attachment: -1 } },
        { text: "会尝试，但会给自己留后手。", scores: { novelty: 1, control: 1, security: 1 } },
        { text: "提醒自己，真正留得住我的还是明确和稳定。", scores: { novelty: -1, security: 1, boundary: 1 } },
        { text: "会直接试一下对方的真实反馈。", scores: { dominance: 1, expression: 1, control: 1 } }
      ]
    },
    {
      id: "q10",
      text: "对方说“看你安排”。你的第一反应更像：",
      options: [
        { text: "那我来定，别让这事散掉。", scores: { dominance: 2, control: 2, expression: 1 } },
        { text: "我会给两个方案，让对方也表态。", scores: { control: 1, dominance: 1, security: -1 } },
        { text: "我不急着接这个球，先看他到底有没有想法。", scores: { control: 1, pace: -1, security: 1 } },
        { text: "无所谓，能成就成，不成也行。", scores: { control: -2, security: -1, pace: -1 } }
      ]
    },
    {
      id: "q11",
      text: "和对方有一点小摩擦时，你更在意的是：",
      options: [
        { text: "把结论说清楚，不然这根刺会留着。", scores: { expression: 2, control: 1, boundary: 1 } },
        { text: "先把气氛稳住，再找机会补谈。", scores: { control: 1, pace: -1, attachment: 1 } },
        { text: "先让它过去，很多事不值得当场说穿。", scores: { expression: -1, control: -1, boundary: -1 } },
        { text: "我会装得没事，但会悄悄记分。", scores: { security: 2, control: 1, expression: -2 } }
      ]
    },
    {
      id: "q12",
      text: "对方在人前夸你时，你通常会：",
      options: [
        { text: "顺势接回去，甚至把气氛再推高一点。", scores: { expression: 2, dominance: 1, pace: 1 } },
        { text: "笑着接住，但不会继续往下演。", scores: { expression: 0, control: 1, security: -1 } },
        { text: "看起来淡定，其实会很吃这一套。", scores: { attachment: 1, security: 2, expression: -1 } },
        { text: "会下意识后退一点，不太习惯太高调。", scores: { expression: -2, control: 1, pace: -1 } }
      ]
    },
    {
      id: "q13",
      text: "消息已读但没回，你更常见的内在状态是：",
      options: [
        { text: "会开始找解释，但不一定会说。", scores: { security: 2, attachment: 1, expression: -1 } },
        { text: "会主动丢个新话题，看对方状态。", scores: { dominance: 1, security: 1, expression: 1 } },
        { text: "默认每个人都有自己的节奏。", scores: { security: -2, attachment: -1, pace: -1 } },
        { text: "会提醒自己别过度填空，但心里还是会卡一下。", scores: { security: 1, control: 1, attachment: 1 } }
      ]
    },
    {
      id: "q14",
      text: "准备一起去一个陌生城市过周末，你更偏向：",
      options: [
        { text: "路线、住处、关键安排都先订稳。", scores: { control: 2, security: 1, novelty: -1 } },
        { text: "大框架定好，细节留到路上。", scores: { control: 0, novelty: 1, pace: 1 } },
        { text: "尽量留白，旅途本来就该允许意外。", scores: { control: -2, novelty: 2, boundary: -1 } },
        { text: "看跟谁去。人对了，我对计划要求没那么高。", scores: { attachment: 1, control: -1, security: -1 } }
      ]
    },
    {
      id: "q15",
      text: "某次相处特别顺，甚至有一点过热。之后你更可能：",
      options: [
        { text: "顺着热度继续推进，不想让它凉太快。", scores: { pace: 2, attachment: 1, security: 1 } },
        { text: "继续联系，但会故意放一点缓冲。", scores: { pace: -1, control: 1, security: 1 } },
        { text: "会突然警觉，想看看这是不是错觉。", scores: { security: 2, attachment: -1, pace: -2 } },
        { text: "会有点上头，但更想看它能不能自然延续。", scores: { attachment: 1, novelty: 1, control: -1 } }
      ]
    },
    {
      id: "q16",
      text: "对方忽然比平时更黏你。你更自然的是：",
      options: [
        { text: "会觉得这说明我对他真的重要。", scores: { attachment: 2, security: 1, boundary: 1 } },
        { text: "只要方式舒服，我其实不排斥。", scores: { attachment: 1, boundary: 0, security: 0 } },
        { text: "会下意识后退一点，想先确认原因。", scores: { attachment: -2, control: 1, security: 1 } },
        { text: "会接住，但心里会开始评估之后会不会麻烦。", scores: { control: 1, attachment: 0, security: 1 } }
      ]
    },
    {
      id: "q17",
      text: "约会选餐厅时，你更常做的选择是：",
      options: [
        { text: "去那家一直稳、不容易出错的。", scores: { novelty: -2, control: 1, security: 1 } },
        { text: "新旧都行，但我会优先看当下心情。", scores: { novelty: 0, control: -1, pace: 0 } },
        { text: "试一家新的，就算不完美也没关系。", scores: { novelty: 2, pace: 1, control: -1 } },
        { text: "看这个人值不值得我折腾。", scores: { novelty: 1, attachment: 1, control: 1 } }
      ]
    },
    {
      id: "q18",
      text: "当对方突然认真问“我们现在算什么”时，你更像：",
      options: [
        { text: "愿意把状态说清楚，别让彼此一直悬着。", scores: { boundary: 2, expression: 1, security: 1 } },
        { text: "会先回应感受，但不想太快定死。", scores: { expression: 1, boundary: -1, pace: 0 } },
        { text: "我会明显紧一下，觉得还没走到那一步。", scores: { pace: -2, boundary: -1, security: 1 } },
        { text: "会反问对方到底想听到什么。", scores: { control: 2, expression: 1, security: -1 } }
      ]
    },
    {
      id: "q19",
      text: "一段互动化学反应很强，但始终没有明确方向。你更可能：",
      options: [
        { text: "先继续往里走，很多东西本来就是边走边成形。", scores: { novelty: 1, pace: 1, boundary: -1 } },
        { text: "会享受这段模糊，但不会太早投入全部。", scores: { novelty: 1, control: 1, attachment: -1 } },
        { text: "会提醒自己别沉太快，没方向感很消耗。", scores: { security: 1, boundary: 1, pace: -1 } },
        { text: "会主动试探一次，看看它到底有没有未来。", scores: { dominance: 1, control: 1, security: 1 } }
      ]
    },
    {
      id: "q20",
      text: "如果一段关系已经明显不同于普通朋友，但还没正式说破，你更偏向：",
      options: [
        { text: "默认彼此别再把注意力铺得太开。", scores: { boundary: 2, attachment: 1, security: 1 } },
        { text: "我会先看对方是不是也有这个默契。", scores: { security: 2, boundary: 1, expression: -1 } },
        { text: "在没真正确定前，我不喜欢把路收得太窄。", scores: { boundary: -2, novelty: 1, security: -1 } },
        { text: "看具体感觉，规则太早会让我失去兴趣。", scores: { novelty: 2, boundary: -1, pace: 1 } }
      ]
    }
  ];

  const shareTemplates = {
    casual: "我刚做完这个关系风格评估，结果是「{type}」{match}%。一句话挺戳我：{summary}",
    provocative: "这个测试比“你是主动还是被动”狠多了，直接把我归到「{type}」。最扎心的是：{summary}",
    neutral: "完成一份关系风格评估，我的结果是「{type}」{match}%。主要特征：{signal}"
  };

  const shareConfig = {
    testUrl: "https://hamusutaii.github.io/xpti-test/",
    exportFileName: "relationship-profile.jpg"
  };

  window.QUIZ_DATA = {
    dimensions,
    archetypes,
    questions,
    shareTemplates,
    shareConfig
  };
})();
