(function () {
  const dimensions = [
    {
      id: "dominance",
      label: "节奏位置",
      leftLabel: "响应",
      rightLabel: "主动"
    },
    {
      id: "attachment",
      label: "情感卷入",
      leftLabel: "抽离",
      rightLabel: "依附"
    },
    {
      id: "novelty",
      label: "体验取向",
      leftLabel: "稳定",
      rightLabel: "新鲜"
    },
    {
      id: "boundary",
      label: "关系边界",
      leftLabel: "开放",
      rightLabel: "排他"
    },
    {
      id: "control",
      label: "局面把握",
      leftLabel: "随缘",
      rightLabel: "掌控"
    },
    {
      id: "expression",
      label: "表达方式",
      leftLabel: "克制",
      rightLabel: "直接"
    },
    {
      id: "security",
      label: "安全来源",
      leftLabel: "自稳",
      rightLabel: "确认"
    },
    {
      id: "pace",
      label: "升温速度",
      leftLabel: "慢热",
      rightLabel: "快进"
    }
  ];

  const archetypes = [
    {
      id: "dog",
      name: "小狗型",
      emoji: "🐶",
      nickname: "反馈依恋者",
      summary: "你不是没有立场，你只是把被认真回应，当成关系成立的证据。",
      interpretation: "你最擅长的不是制造戏剧性，而是把一段关系养出温度。你会下意识留心对方有没有接住你、有没有记得你的细节、有没有在情绪上回到你这里。你对互动质量非常敏感，所以别人一句敷衍、一次撤退、一个迟来的回应，都比你表面看上去更影响你。你不一定黏人，但你确实需要确认感，而这份确认一旦给够，你会比很多人更稳定、更耐心、更愿意配合彼此的节奏。",
      attracts: "会被你吸引的，往往是外表不动声色、内里又渴望被照顾的人。他们未必嘴上承认，但很容易在你这里放下防备。",
      risk: "你容易把“体贴”做成一种长期值班。关系越重要，你越可能在意对方有没有回到你这里，最后把自己的情绪稳定权交出去。",
      advice: "把确认感拆成两部分：一部分向外要，一部分向内建。你会更轻松，也更不容易在细节里反复猜。",
      profile: {
        dominance: 30,
        attachment: 84,
        novelty: 40,
        boundary: 62,
        control: 34,
        expression: 66,
        security: 80,
        pace: 58
      },
      weights: {
        dominance: 1.4,
        attachment: 1.8,
        novelty: 0.9,
        boundary: 1.1,
        control: 1.1,
        expression: 1.2,
        security: 1.8,
        pace: 0.9
      }
    },
    {
      id: "hunter",
      name: "猎手型",
      emoji: "🦅",
      nickname: "局面发动机",
      summary: "你不太擅长被动等待，你更习惯让局面往你想要的方向移动。",
      interpretation: "你在关系里有很强的推进本能。气氛冷了你会点火，局面悬了你会定调，别人含糊时你甚至会忍不住替这段关系按下加速键。你不一定总是强势，但你确实不爱把方向盘长时间交给别人。你的吸引力来自清晰、行动力和一种“我知道自己在干嘛”的笃定感。问题是，当你习惯先把局面做出来，再观察对方是否跟得上时，偶尔会忽略一件事：不是每个人都用同样的速度表达真心。",
      attracts: "你会吸引欣赏力量感、喜欢被带起节奏、同时又想在关系里感受到明确感的人。",
      risk: "你可能把主动误用成提前完成全部流程。对方还在试探，你已经开始布局；对方只是在靠近，你已经在衡量投入回报。",
      advice: "保留你的推进力，但留一点空位给对方选择。真正高级的主导，不是一路往前，而是知道什么时候该收。",
      profile: {
        dominance: 86,
        attachment: 48,
        novelty: 62,
        boundary: 58,
        control: 86,
        expression: 74,
        security: 34,
        pace: 78
      },
      weights: {
        dominance: 1.8,
        attachment: 0.8,
        novelty: 1.1,
        boundary: 1,
        control: 1.8,
        expression: 1.3,
        security: 1,
        pace: 1.2
      }
    },
    {
      id: "cat",
      name: "猫系",
      emoji: "🐈",
      nickname: "留白掌舵者",
      summary: "你最迷人的地方，不是热烈，而是你总给自己留了一点别人进不去的空间。",
      interpretation: "你不喜欢一开始就把自己铺得太开。不是没有情绪，而是你更愿意先看局势、看分寸、看对方是否值得。你对距离感非常敏锐，知道什么时候靠近会显得珍贵，也知道什么时候后退反而让关系更有呼吸。很多人会把你理解成难懂、慢热、甚至有点冷，但真正接近你的人会发现：你不是没有需求，你只是非常在意自主权，不愿意让关系过快地定义你。",
      attracts: "你会吸引那些对独立感、边界感和微妙掌控感上头的人。他们常常以为自己在靠近你，其实是被你的留白牵着走。",
      risk: "你太会自保，也太会处理自己的感受，于是容易把值得建立深度的人一起挡在门外。你不是没人懂，只是给别人读懂你的时间太短。",
      advice: "保留你的分寸感，但别让所有重要信息都靠别人猜。你不需要变热烈，只需要偶尔更明确一点。",
      profile: {
        dominance: 58,
        attachment: 26,
        novelty: 56,
        boundary: 36,
        control: 62,
        expression: 28,
        security: 24,
        pace: 38
      },
      weights: {
        dominance: 1.1,
        attachment: 1.8,
        novelty: 1,
        boundary: 1.2,
        control: 1.4,
        expression: 1.7,
        security: 1.5,
        pace: 1
      }
    },
    {
      id: "explorer",
      name: "体验派",
      emoji: "🦊",
      nickname: "高刺激采样者",
      summary: "你不是轻浮，你只是很难对没有流动感的关系保持长久兴奋。",
      interpretation: "你对关系里的变化、化学反应和新鲜张力格外敏感。别人觉得“稳定下来也挺好”，你可能已经开始感觉空气变平。你并不是不认真，恰恰相反，你对情绪波动和互动质量要求很高，所以更容易被新鲜、反差、未知和未完成感击中。你享受被点亮，也享受一起试出新层次，但一旦关系被固定成模板，你就会迅速失去电流感。",
      attracts: "你吸引的通常是反应快、接受度高、不怕变化、也愿意一起试不同相处方式的人。",
      risk: "你容易把“刺激感下降”误判成“关系不对”，于是把本来能沉下去的连接，提前留在了浅水区。",
      advice: "继续追求活力，但试着区分两件事：一种是已经无聊，一种只是进入更深但更安静的阶段。后者未必比前者差。",
      profile: {
        dominance: 56,
        attachment: 40,
        novelty: 90,
        boundary: 18,
        control: 42,
        expression: 60,
        security: 36,
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
      summary: "你最先启动的不是心动，而是判断系统。",
      interpretation: "你并不是感受不到东西，你只是很少让自己立刻沉进去。你习惯先看动机、看节奏、看边界、看后果，再决定值不值得投入。很多人会觉得你稳定、成熟、讲理，甚至有点难被扰动；但你自己知道，那不是没感觉，而是你太清楚关系会把人带去哪里，所以不会轻易让自己失速。你在关系里的安全感来自理解，而不是热烈。",
      attracts: "你会吸引那些情绪浓度高、需要被理解、同时又被你这种稳定判断力安抚的人。",
      risk: "你最容易错过的，不是错误的人，而是那些需要你先放下分析、才能真正进入的关系。你太会看局，有时就停在了局外。",
      advice: "保留你的判断，但给自己一个小出口：不是每次都要完全想清楚，才配开始靠近。",
      profile: {
        dominance: 34,
        attachment: 20,
        novelty: 36,
        boundary: 60,
        control: 66,
        expression: 22,
        security: 28,
        pace: 26
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
      summary: "你不是只想恋爱，你更想知道自己是不是被认真放进了对方的生活坐标里。",
      interpretation: "你对关系的需求不是热闹，而是确定。你愿意慢慢认识、耐心投入，但你真正想要的从来不是表面互动，而是那种彼此都在认真靠近、认真排位、认真留出位置的感觉。你能给出非常深的稳定感，也能把一段关系经营得有连续性。只是当你认定一段关系时，会很自然地开始要边界、要归属、要更清楚的承诺，这既是你的安全感来源，也是你最容易给关系施压的地方。",
      attracts: "你会吸引那些想被认真对待、想拥有明确归属、也愿意进入长期视角的人。",
      risk: "你对模糊区的耐受度比较低，一旦感到不够确定，就容易提前把关系推进到“必须给答案”的阶段。",
      advice: "你的深度不是负担，节奏才是关键。别把“想认真”误用成“必须马上落实”。",
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
        pace: 0.9
      }
    },
    {
      id: "chaos",
      name: "混沌型",
      emoji: "🦂",
      nickname: "情境分裂体",
      summary: "你不是没有风格，你的问题恰恰是不同场景会叫醒完全不同的你。",
      interpretation: "你身上的矛盾不是装出来的，而是真的共存。你可能在不重要的人面前冷静克制，在真正心动的人面前却突然想确认、想推进；你也可能平时追求新鲜，但一旦认定，又很想要边界和秩序。你的反应高度依赖对象、信任程度、当下氛围和你对局面的判断，所以别人很难一句话概括你。你让人觉得复杂，也让人觉得有后劲，因为你不是一种固定配置。",
      attracts: "你会吸引对复杂人格有兴趣、愿意研究你、也不怕关系里有反差和变化的人。",
      risk: "你容易被自己的多套反应系统拉扯。今天觉得自己已经想清楚，明天又被另一套需求推翻，最后最累的人常常是你自己。",
      advice: "先别急着给自己定性。记录什么人、什么情境、什么推进方式会触发你的不同一面，你会更快看清自己的真实结构。",
      profile: {
        dominance: 52,
        attachment: 52,
        novelty: 58,
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
    }
  ];

  const questions = [
    {
      id: "q01",
      text: "第一次见面结束后，你坐上车，气氛还在。你更可能：",
      options: [
        {
          text: "到家前就发一句，“今晚比我预期好。”",
          scores: { dominance: 2, expression: 2, pace: 1 }
        },
        {
          text: "先放一晚，让那点余温自己发酵。",
          scores: { dominance: -1, expression: -2, pace: -2 }
        }
      ]
    },
    {
      id: "q02",
      text: "一群人聚会时，对方和别人聊得正热。你更自然的反应是：",
      options: [
        {
          text: "找个时机把话题接回来，重新把注意力拉到你们之间。",
          scores: { dominance: 1, control: 2, boundary: 1 }
        },
        {
          text: "先随它流动，等真正轮到你们的时候再靠近。",
          scores: { control: -2, boundary: -1, pace: -1 }
        }
      ]
    },
    {
      id: "q03",
      text: "对方临时取消了原本说好的见面，但理由听上去也成立。你更像：",
      options: [
        {
          text: "会追问一下新的安排，至少想知道这件事有没有被认真放回日程。",
          scores: { security: 2, control: 1, boundary: 1 }
        },
        {
          text: "会说没关系，先看后续有没有自然补回来。",
          scores: { security: -2, control: -1, pace: -1 }
        }
      ]
    },
    {
      id: "q04",
      text: "聊天聊到比较私人的经历时，你更常见的状态是：",
      options: [
        {
          text: "如果当下氛围对，我会把自己的真实想法说出来。",
          scores: { expression: 2, attachment: 1, pace: 1 }
        },
        {
          text: "我会点到为止，先保留最关键的那部分。",
          scores: { expression: -2, attachment: -1, control: 1 }
        }
      ]
    },
    {
      id: "q05",
      text: "关系开始升温，但还没明确说开。你更容易默认：",
      options: [
        {
          text: "既然已经靠近到这一步，就该慢慢收窄边界。",
          scores: { boundary: 2, attachment: 1, security: 1 }
        },
        {
          text: "没必要太快收口，先把感觉走扎实再说。",
          scores: { boundary: -2, novelty: 1, pace: -1 }
        }
      ]
    },
    {
      id: "q06",
      text: "一个原本随口提起的小计划，对方突然说“那就这周去吧”。你更像：",
      options: [
        {
          text: "会顺势接住，甚至开始想具体怎么安排更好。",
          scores: { pace: 2, dominance: 1, control: 1 }
        },
        {
          text: "会觉得有点快，想再观察一下是不是只是当下兴起。",
          scores: { pace: -2, control: 1, attachment: -1 }
        }
      ]
    },
    {
      id: "q07",
      text: "你明显感觉到对方状态不对，但对方没有主动说。你通常会：",
      options: [
        {
          text: "直接问一句，“你今天是不是有点不对劲？”",
          scores: { expression: 2, attachment: 1, dominance: 1 }
        },
        {
          text: "先给空间，等对方自己决定要不要开口。",
          scores: { expression: -1, control: -1, security: -1 }
        }
      ]
    },
    {
      id: "q08",
      text: "一段关系进行到一半，互动越来越规律。你更可能：",
      options: [
        {
          text: "想换个场景、换个节奏，别让它太快定型。",
          scores: { novelty: 2, pace: 1, control: -1 }
        },
        {
          text: "觉得规律挺好，至少说明彼此真的留了位置。",
          scores: { novelty: -2, security: 1, boundary: 1 }
        }
      ]
    },
    {
      id: "q09",
      text: "碰到一个很有吸引力但一直不太好读懂的人，你更容易：",
      options: [
        {
          text: "被这种模糊感勾住，反而更想靠近看看。",
          scores: { novelty: 1, attachment: -1, pace: 1 }
        },
        {
          text: "会提醒自己，真正让我留得住的还是明确和稳定。",
          scores: { novelty: -1, security: 1, boundary: 1 }
        }
      ]
    },
    {
      id: "q10",
      text: "对方说“看你安排”。你的第一反应更像：",
      options: [
        {
          text: "那我来定，起码别让这件事散掉。",
          scores: { dominance: 2, control: 2, expression: 1 }
        },
        {
          text: "我会丢几个方向出去，看对方到底真正想要什么。",
          scores: { control: -1, dominance: -1, security: -1 }
        }
      ]
    },
    {
      id: "q11",
      text: "和对方有点小摩擦时，你更在意的是：",
      options: [
        {
          text: "把结论说清楚，不然这根刺会一直在。",
          scores: { expression: 2, control: 1, boundary: 1 }
        },
        {
          text: "先给彼此一点冷静空间，别在情绪最高的时候收口。",
          scores: { expression: -1, control: -1, pace: -1 }
        }
      ]
    },
    {
      id: "q12",
      text: "对方在人前夸你，你通常更像：",
      options: [
        {
          text: "会接回去，甚至顺手把气氛再推高一点。",
          scores: { expression: 2, dominance: 1, pace: 1 }
        },
        {
          text: "会笑一下，但心里记下，不一定当场展开。",
          scores: { expression: -2, attachment: 1, control: 1 }
        }
      ]
    },
    {
      id: "q13",
      text: "消息已读但没回。你更接近：",
      options: [
        {
          text: "表面淡定，心里其实会开始寻找解释。",
          scores: { security: 2, attachment: 1, control: 1 }
        },
        {
          text: "会默认每个人都有自己的节奏，不急着填空。",
          scores: { security: -2, attachment: -1, control: -1 }
        }
      ]
    },
    {
      id: "q14",
      text: "准备一起去一个陌生城市过周末，你更偏向：",
      options: [
        {
          text: "把路线、住处、关键安排都先订稳，玩的时候才真的轻松。",
          scores: { control: 2, security: 1, novelty: -1 }
        },
        {
          text: "留一点空白，旅途本来就该允许意外发生。",
          scores: { control: -2, novelty: 2, boundary: -1 }
        }
      ]
    },
    {
      id: "q15",
      text: "某次相处特别顺，甚至有一点过热。之后你更可能：",
      options: [
        {
          text: "想顺着这股劲继续推进，不想让它凉得太快。",
          scores: { pace: 2, attachment: 1, security: 1 }
        },
        {
          text: "会故意把节奏放慢一点，给自己一点回看空间。",
          scores: { pace: -2, control: 1, attachment: -1 }
        }
      ]
    },
    {
      id: "q16",
      text: "对方忽然比平时更黏你。你更自然的是：",
      options: [
        {
          text: "只要方式真诚，我会觉得这说明我对他很重要。",
          scores: { attachment: 2, security: 1, boundary: 1 }
        },
        {
          text: "会下意识想退半步，先确认这是不是一阵情绪。",
          scores: { attachment: -2, boundary: -1, control: 1 }
        }
      ]
    },
    {
      id: "q17",
      text: "约会选餐厅时，你更常做出的选择是：",
      options: [
        {
          text: "去那家一直稳、不容易出错的老地方。",
          scores: { novelty: -2, security: 1, control: 1 }
        },
        {
          text: "试那家新开的，哪怕不一定完美。",
          scores: { novelty: 2, pace: 1, control: -1 }
        }
      ]
    },
    {
      id: "q18",
      text: "当对方突然认真问一句“我们现在算什么”时，你更倾向：",
      options: [
        {
          text: "愿意把现在的状态说清楚，至少别让彼此一直悬着。",
          scores: { boundary: 2, expression: 1, security: 1 }
        },
        {
          text: "会想先继续相处，怕太早定义把感觉压扁。",
          scores: { boundary: -2, novelty: 1, pace: -1 }
        }
      ]
    },
    {
      id: "q19",
      text: "你喜欢的人在饭局上显得很受欢迎。你更像：",
      options: [
        {
          text: "会更想重新抢回一点专注感，至少别彻底散掉。",
          scores: { boundary: 1, dominance: 1, security: 1 }
        },
        {
          text: "不会急着介入，真正的连接不靠抢这一下证明。",
          scores: { boundary: -1, security: -1, control: -1 }
        }
      ]
    },
    {
      id: "q20",
      text: "约会前一晚，你的脑子更容易忙在哪一边：",
      options: [
        {
          text: "会想好想聊什么、想去哪里、如何把氛围带顺。",
          scores: { control: 2, dominance: 1, pace: 1 }
        },
        {
          text: "不会预演太多，到了现场自然判断最真实。",
          scores: { control: -2, novelty: 1, pace: -1 }
        }
      ]
    },
    {
      id: "q21",
      text: "对方改了原定计划，但语气很自然。你更在意：",
      options: [
        {
          text: "我会卡一下，因为我希望重要的事别总在最后一刻变动。",
          scores: { control: 1, security: 1, boundary: 1 }
        },
        {
          text: "只要不是经常这样，我能接受关系里有点弹性。",
          scores: { control: -2, boundary: -1, novelty: 1 }
        }
      ]
    },
    {
      id: "q22",
      text: "某件小事让你不舒服时，你比较接近：",
      options: [
        {
          text: "早点说，比憋到最后忽然爆出来更有效。",
          scores: { expression: 2, control: 1, pace: 1 }
        },
        {
          text: "先放一放，等我确定自己不是一时情绪再讲。",
          scores: { expression: -2, control: 1, pace: -1 }
        }
      ]
    },
    {
      id: "q23",
      text: "一个人很稳定、很靠谱，但火花感没有那么强。你通常会：",
      options: [
        {
          text: "愿意继续了解，我知道后劲这件事常常更重要。",
          scores: { novelty: -1, attachment: 1, boundary: 1 }
        },
        {
          text: "会觉得少了点电流，难免想看还有没有别的可能。",
          scores: { novelty: 2, boundary: -1, pace: 1 }
        }
      ]
    },
    {
      id: "q24",
      text: "一段互动化学反应很强，但始终没有明确方向。你更可能：",
      options: [
        {
          text: "先继续往里走，很多东西本来就是边靠近边成形。",
          scores: { novelty: 1, pace: 1, boundary: -1 }
        },
        {
          text: "会提醒自己别沉太快，没方向感的热度很消耗人。",
          scores: { security: 1, boundary: 1, pace: -1 }
        }
      ]
    },
    {
      id: "q25",
      text: "夜里聊到彼此的偏好和雷区，对方认真问你“那你到底更喜欢哪种？” 你更像：",
      options: [
        {
          text: "会说得比较明确，省得以后一直靠猜。",
          scores: { expression: 2, control: 1, boundary: 1 }
        },
        {
          text: "会给线索，但不会一次全摊开。",
          scores: { expression: -2, control: 1, novelty: 1 }
        }
      ]
    },
    {
      id: "q26",
      text: "如果最近对方明显更需要你，你更容易：",
      options: [
        {
          text: "会被这种“我对你很重要”的感觉拉近。",
          scores: { attachment: 2, security: 2, boundary: 1 }
        },
        {
          text: "会有一点警觉，怕自己被卷得太深太快。",
          scores: { attachment: -1, security: -1, pace: -1 }
        }
      ]
    },
    {
      id: "q27",
      text: "当关系已经很顺时，你更像哪种人：",
      options: [
        {
          text: "想把这种顺继续维持好，别轻易打乱。",
          scores: { novelty: -2, control: 1, security: 1 }
        },
        {
          text: "会想稍微换点东西，不然很快就变成机械重复。",
          scores: { novelty: 2, pace: 1, boundary: -1 }
        }
      ]
    },
    {
      id: "q28",
      text: "刚刚靠近得很近，对方却忽然说想要一点自己的空间。你更接近：",
      options: [
        {
          text: "会想知道这是不是某种退意，心里会起波动。",
          scores: { security: 2, attachment: 1, boundary: 1 }
        },
        {
          text: "会把空间还给对方，也把情绪留给自己消化。",
          scores: { security: -2, attachment: -1, control: -1 }
        }
      ]
    },
    {
      id: "q29",
      text: "有人在酒局上明显对你抛来试探和暧昧。你更可能：",
      options: [
        {
          text: "顺着接住，甚至会把气氛再往前推一点。",
          scores: { dominance: 2, expression: 1, pace: 1 }
        },
        {
          text: "先看对方有没有持续性，再决定要不要真正回应。",
          scores: { dominance: -1, control: 1, security: 1 }
        }
      ]
    },
    {
      id: "q30",
      text: "聊到下个月的安排时，你更自然的是：",
      options: [
        {
          text: "会顺手把对方放进你的时间表里，看起来很自然。",
          scores: { attachment: 1, pace: 1, boundary: 1 }
        },
        {
          text: "更习惯先过好当下，不急着把未来排得太满。",
          scores: { pace: -2, control: -1, boundary: -1 }
        }
      ]
    },
    {
      id: "q31",
      text: "对方忘了你之前随口提过的一件小事。你更可能：",
      options: [
        {
          text: "嘴上不一定说，但心里会把它当作关注度的信号。",
          scores: { security: 2, attachment: 1, control: 1 }
        },
        {
          text: "会觉得人不可能记住所有细节，不必过度解读。",
          scores: { security: -2, attachment: -1, control: -1 }
        }
      ]
    },
    {
      id: "q32",
      text: "聊天出现空白时，你更像：",
      options: [
        {
          text: "会主动把话接上，不太喜欢让气氛掉下去。",
          scores: { dominance: 1, expression: 1, control: 1 }
        },
        {
          text: "不急着补，沉默有时也能说明很多东西。",
          scores: { expression: -1, pace: -1, control: -1 }
        }
      ]
    },
    {
      id: "q33",
      text: "原本的约会因为天气临时作废。你更容易：",
      options: [
        {
          text: "马上换方案，别让这次见面就这么散了。",
          scores: { dominance: 1, control: 2, pace: 1 }
        },
        {
          text: "接受这次作废，真正合拍的人不靠一次补救证明。",
          scores: { control: -2, security: -1, pace: -1 }
        }
      ]
    },
    {
      id: "q34",
      text: "有人说你“其实挺难被看懂”。你内心更接近：",
      options: [
        {
          text: "某种程度上是故意的，我不想太快把自己交出来。",
          scores: { expression: -2, attachment: -1, control: 1 }
        },
        {
          text: "如果是重要的人，我不介意让对方更早看清我。",
          scores: { expression: 2, attachment: 1, security: 1 }
        }
      ]
    },
    {
      id: "q35",
      text: "一段关系已经明显不同于普通朋友，但还没正式说破。你更偏向：",
      options: [
        {
          text: "至少默认彼此别再把注意力铺得太开。",
          scores: { boundary: 2, security: 1, attachment: 1 }
        },
        {
          text: "在没真正确定之前，我不喜欢把路收得太窄。",
          scores: { boundary: -2, novelty: 1, security: -1 }
        }
      ]
    },
    {
      id: "q36",
      text: "一次激烈争执之后，关系暂时和好了。你更容易：",
      options: [
        {
          text: "想把规则重新对齐，不然下次还会撞同一面墙。",
          scores: { control: 2, boundary: 1, expression: 1 }
        },
        {
          text: "更愿意让情绪慢慢退掉，别把刚缓和的局面又谈硬了。",
          scores: { control: -1, expression: -1, pace: -1 }
        }
      ]
    }
  ];

  const shareTemplates = [
    "我刚做完这个关系风格评估，结果是「{type}」{match}%。它最戳我的一句话是：{summary}。副型分别是 {secondary}。发给认识我的人看，应该会有人笑着点头。",
    "这个测试没有在问“你主动不主动”这种老套问题，而是从相处细节里把我归到了「{type}」。最明显的倾向是 {dimensionHighlight}，看完有种被安静拆开的感觉。",
    "成年人关系里最难装的，从来不是表面话术，而是你怎么推进、怎么要确认、怎么留边界。我的结果是「{type}」{match}%：{summary}"
  ];

  const shareConfig = {
    // Replace this with your deployed page URL after publishing.
    testUrl: "https://hamusutaii.github.io/xpti-test/",
    qrApi: "https://quickchart.io/qr",
    posterTitle: "关系风格评估",
    posterSubtitle: "扫描二维码，直接进入测试"
  };

  window.QUIZ_DATA = {
    dimensions,
    archetypes,
    questions,
    shareTemplates,
    shareConfig
  };
})();
