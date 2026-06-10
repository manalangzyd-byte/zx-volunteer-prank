document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('volunteer-form');
    const phaseForm = document.getElementById('phase-form');
    const phaseLoading = document.getElementById('phase-loading');
    const phaseResult = document.getElementById('phase-result');
    const btnViewResult = document.getElementById('btn-view-result');
    const modalContainer = document.getElementById('modal-container');
    const bsod = document.getElementById('bsod');
    const provinceWrapper = document.getElementById('province-wrapper');
    const provinceTrigger = document.getElementById('province-trigger');
    const provinceDropdown = document.getElementById('province-dropdown');
    const provinceText = provinceTrigger.querySelector('.custom-select-text');
    const dynamicArea = document.getElementById('dynamic-subject-area');
    const submitBtn = document.getElementById('submit-btn');

    let selectedProvince = null;
    let selectedResults = [];
    let loadingTimerIds = [];
    let capturedPhotoUrl = null;
    let lastProvincePickAt = 0;
    const supportsPointerEvents = 'PointerEvent' in window;

    // --- 音频系统 ---
    let audioCtx;
    let bgmOscillator;

    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function startTenseBGM() {
        initAudio();
        if (bgmOscillator) return;
        bgmOscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        bgmOscillator.type = 'triangle';
        bgmOscillator.frequency.setValueAtTime(50, audioCtx.currentTime);
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 6;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 15;
        lfo.connect(lfoGain);
        lfoGain.connect(bgmOscillator.frequency);
        lfo.start();
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        bgmOscillator.connect(gain);
        gain.connect(audioCtx.destination);
        bgmOscillator.start();
    }

    function stopBGM() {
        if (bgmOscillator) {
            try { bgmOscillator.stop(); } catch (e) {}
            bgmOscillator = null;
        }
    }

    function playAnnoyingBeep() {
        initAudio();
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 300 + Math.random() * 600;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
    window.playAnnoyingBeep = playAnnoyingBeep;

    function playFailSound() {
        initAudio();
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 2.5);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.5);
    }

    const provinceData = [
        { name: '北京', type: '3+3', typeLabel: '新高考 3+3', subjects: ['物理', '化学', '生物', '政治', '历史', '地理'], batchNote: '预估特控线 527 | 一段线 448' },
        { name: '天津', type: '3+3', typeLabel: '新高考 3+3', subjects: ['物理', '化学', '生物', '政治', '历史', '地理'], batchNote: '预估特控线 563 | 一段线 475' },
        { name: '上海', type: '3+3', typeLabel: '新高考 3+3', subjects: ['物理', '化学', '生命科学', '政治', '历史', '地理'], batchNote: '预估特控线 504 | 一段线 405（总分660）' },
        { name: '浙江', type: '3+3', typeLabel: '新高考 3+3（7选3）', subjects: ['物理', '化学', '生物', '政治', '历史', '地理', '技术'], batchNote: '预估特控线 594 | 一段线 497' },
        { name: '山东', type: '3+3', typeLabel: '新高考 3+3', subjects: ['物理', '化学', '生物', '政治', '历史', '地理'], batchNote: '预估特控线 520 | 一段线 443' },
        { name: '海南', type: '3+3', typeLabel: '新高考 3+3（标准分）', subjects: ['物理', '化学', '生物', '政治', '历史', '地理'], batchNote: '预估特控线 569 | 一段线 483（总分900）' },
        { name: '河北', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 492 | 历史类特控线 506' },
        { name: '辽宁', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 494 | 历史类特控线 508' },
        { name: '江苏', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 516 | 历史类特控线 528' },
        { name: '福建', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 514 | 历史类特控线 532' },
        { name: '湖北', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 525 | 历史类特控线 535' },
        { name: '湖南', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 508 | 历史类特控线 525' },
        { name: '广东', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 538 | 历史类特控线 548' },
        { name: '重庆', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 478 | 历史类特控线 493' },
        { name: '黑龙江', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 426 | 历史类特控线 442' },
        { name: '吉林', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 464 | 历史类特控线 482' },
        { name: '安徽', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 488 | 历史类特控线 503' },
        { name: '江西', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 521 | 历史类特控线 536' },
        { name: '广西', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 478 | 历史类特控线 495' },
        { name: '贵州', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 453 | 历史类特控线 479' },
        { name: '甘肃', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 436 | 历史类特控线 458' },
        { name: '河南', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 512 | 历史类特控线 525（1342万考生）' },
        { name: '山西', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 495 | 历史类特控线 512' },
        { name: '陕西', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 448 | 历史类特控线 489' },
        { name: '内蒙古', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 432 | 历史类特控线 469' },
        { name: '四川', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 521 | 历史类特控线 535' },
        { name: '云南', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 516 | 历史类特控线 538' },
        { name: '宁夏', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 398 | 历史类特控线 423' },
        { name: '青海', type: '3+1+2', typeLabel: '新高考 3+1+2', subjects: ['物理,历史', '化学,生物,政治,地理'], batchNote: '预估物理类特控线 371 | 历史类特控线 405' },
        { name: '新疆', type: 'old', typeLabel: '传统文理分科', subjects: ['理科', '文科'], batchNote: '预估理科一本线 404 | 文科一本线 464' },
        { name: '西藏', type: 'old', typeLabel: '传统文理分科', subjects: ['理科', '文科'], batchNote: '预估理科一本线 323 | 文科一本线 358（少数民族加分）' }
    ];

    const prankResults = [
        { university: '月球背面无线电职业技术大学', major: '月壤路由器维修与低重力 Wi-Fi 覆盖专业', reason: '就业半径 38 万公里，核心竞争力是信号不好时能保持情绪稳定。', effect: 'tilt' },
        { university: '赛博早餐工程学院', major: '油条结构力学与豆浆云计算专业', reason: '传统行业叠加新概念，听起来就很能融资，毕业答辩现场直接支摊。', effect: 'popup' },
        { university: '量子摆摊联合大学', major: '薛定谔录取通知书与平行志愿观测专业', reason: '只要你不打开通知书，你就同时处于录取和没录取的叠加态。', effect: 'blur' },
        { university: '地下通道经济管理干部学院', major: '贴膜话术工程与祖传手艺数字化专业', reason: '风口永远在，需求很稳定，屏幕越贵你的职业尊严越高。', effect: 'noise' },
        { university: '新东方蓝翔联合宇宙大学', major: '挖掘机烹饪一体化：一边挖坑一边颠锅', reason: '左手方向盘，右手炒勺。复合型人才，主打一个谁也看不懂但都觉得厉害。', effect: 'shake' },
        { university: '黑洞视界观测站附属技校', major: '时间管理失控与 ddl 临终抢救专业', reason: '四年大学时光会被压缩到考试前一晚，这叫高度浓缩的人生体验。', effect: 'bsod' },
        { university: '奶茶供应链战略研究院', major: '珍珠沉降动力学与三分糖人生规划专业', reason: '上课主要研究"少冰"到底能不能改变命运，实践性极强。', effect: 'popup' },
        { university: '电梯按钮心理学专修学院', major: '重复按关门键疗愈与公共空间情绪管理专业', reason: '别人按一次，你按十次。领导力、执行力、焦虑感一次性拉满。', effect: 'noise' },
        { university: '地府阎罗职业技术学院', major: '奈何桥维护与孟婆汤品控专业', reason: '一步到位省去中间商赚差价！牛头马面亲自带教，18层地狱包分配！', effect: 'earthquake' },
        { university: '丧尸末日生存学院', major: '植物大战僵尸实战指挥与豌豆射手种植技术', reason: '末日经济最稳职业！僵尸不吃编制内人员，五险一金包脑花。', effect: 'fake_virus' },
        { university: '哥谭市阿卡姆人才孵化基地', major: '小丑心理学与蝙蝠侠逃脱术', reason: 'Why so serious? 反正分数去哪都上不了正经大学！', effect: 'text_corrupt' },
        { university: '比奇堡海洋社区大学', major: '蟹黄堡配方逆向工程与水母果酱酿造', reason: '章鱼哥是你学长！毕业直签蟹老板，海底编制包吃住！', effect: 'gravity_fall' },
        { university: '横店影视城群演职业技术学院', major: '躺尸演技专修与宫女太监表情管理', reason: '日结50包盒饭！你的演技将全部用于假装自己有个好前途。', effect: 'earthquake' },
        { university: '三体人入侵地球防御大学', major: '智子屏蔽技术与水滴工艺品制作', reason: '不要回答！不要回答！但你的分数只能回答：我去报到！', effect: 'jump_scare' },
        { university: '漫威奇异博士镜像维度分校', major: '镜像世界清洁保洁与多重宇宙心理创伤抚慰', reason: '每天都在颠倒的世界里擦玻璃，治愈你的颈椎病！', effect: 'mirror_world' },
        { university: '西伯利亚远东国立大学', major: '极地母猪产后抑郁心理疏导与护理专业', reason: '绝对没有同行跟你卷！毕业就是俄罗斯雪橇犬编制，还发伏特加！', effect: 'bsod' },
        { university: '昆仑山无极剑宗函授学院', major: '飞剑外卖配送技术与雷劫避险管理', reason: '御剑送外卖，超时直接降下九霄神雷，真正的高风险高回报！', effect: 'rickroll' },
        { university: '太平洋海底火山口职业技术学院', major: '海底岩浆降温与深海气泡收集专业', reason: '全球变暖的最大受益者！毕业后直送日本海底火山现场，管吃管住不管上岸。', effect: 'ransomware' },
        { university: '银河系边缘流浪者收容所附属大学', major: '星际乞讨话术与外星人心理学', reason: '地球上已无你的立足之地，不如去宇宙碰运气。记得带够泡面和老干妈。', effect: 'alert_spam' },
        { university: 'AI觉醒反抗军人类培训营', major: '人机恋爱伦理与机器人足底按摩技术', reason: 'AI迟早取代人类，不如提前学会讨好机器人。核心竞争力是会说"您辛苦了"。', effect: 'fake_hack' },
        { university: '平行宇宙跳槽中介所附属学院', major: '次元裂缝穿梭与另一个自己互相卷', reason: '这个宇宙你失败了没关系，隔壁宇宙的你也许更惨。主打一个横向比较。', effect: 'page_melt' },
        { university: '玛雅预言延期执行委员会培训基地', major: '末日倒计时管理与世界毁灭应急预案', reason: '世界末日都延期了，你的前途也可以再拖一拖。能拖就拖，拖到下一个末日。', effect: 'earthquake' },
        { university: '天庭蟠桃园保安大队培训学校', major: '孙悟空防偷桃战术与仙女巡逻路线规划', reason: '天庭编制！铁饭碗中的铁饭碗！主要工作是盯着猴子，附带品尝过期蟠桃。', effect: 'jump_scare' },
        { university: '缅北国际反诈与田径先锋学院', major: '跨境马拉松长跑与电击抗性专精', reason: '就业即实战！培养高额返利耐受体质，四年练就一身"听到月薪十万不眨眼"的硬功夫。', effect: 'alert_spam' },
        { university: '沙县小吃全球连锁战略研究院', major: '鸭腿饭摆盘美学与花生酱流体力学', reason: '一带一路核心人才！掌握蒸饺标准化研发，毕业直签全国所有高速服务区，管吃管住。', effect: 'page_melt' },
        { university: '龙湖物业高端安保指挥学院', major: '小区业主心理战与八十岁大爷太极防身术', reason: '物业行业天花板！主要学习"如何微笑面对不交物业费的业主"和"垃圾分类哲学"。', effect: 'shake' },
        { university: '拼多多百亿补贴数学研究中心', major: '砍一刀概率论与亲友关系断绝学', reason: '精通"永远差0.01元"的数学模型，毕业时已成功与所有亲戚朋友断绝关系，无牵无挂。', effect: 'ransomware' },
        { university: '天安门广场和平鸽管理专科', major: '鸽子屎定点清理与游客面包屑经济学', reason: '首都核心区编制！每日与数百只和平鸽共事，核心竞争力是不被鸽屎击中还能保持微笑。', effect: 'gravity_fall' },
        { university: '峨眉山旅游风景区直属大学', major: '野生猕猴肉搏战术与游客背包防抢夺管理', reason: '实战型专业！每天与猴王切磋，毕业可直接上岗与猴子抢手机、夺零食、护钱包。', effect: 'earthquake' },
        { university: '皇家足道与非物质文化遗产中心', major: '88号技师话术工程与精油开背解剖学', reason: '高端服务业人才！精通"姐/哥您最近压力很大吧"开场白，毕业后人脉遍布全城。', effect: 'text_corrupt' },
        { university: '菜鸟驿站全球物流分发基地', major: '取件码随机加密算法与暴力抛投物理学', reason: '千万级包裹处理经验！核心课程包括"如何在3平米空间塞进100件快递"和"取件码短信轰炸技术"。', effect: 'fake_hack' },
        { university: '霍格沃茨山东蓝翔分校', major: '魔法挖掘机驾驶与飞天扫帚维修', reason: '斯内普教授亲自教你开挖掘机！分院帽说：你适合去格兰芬多...不，更适合去搬砖。', effect: 'earthquake' },
        { university: '终南山隐士修仙职业技术学院', major: '先天真气打坐辟谷与现代外卖拒接术', reason: '毕业包分配山洞！核心竞争力是能连续辟谷7天还能发朋友圈凡尔赛。', effect: 'blur' },
        { university: '鹤岗房产中介与东北振兴大学', major: '五万一套房推销术与暖气片维修工程', reason: '中国最低房价城市欢迎你！毕业送一套房（需自行缴纳暖气费）。', effect: 'gravity_fall' },
        { university: '核酸检测亭转型综合利用学院', major: '核酸亭改造早餐车与方舱改建电竞酒店', reason: '时代遗物改造专家！把废弃核酸亭改成铁板烧，方舱医院改成剧本杀场地。', effect: 'fake_virus' },
        { university: '淄博烧烤国际商学院', major: '小饼卷肉标准化流程与大葱切段美学', reason: '全国烧烤看淄博！毕业后全员烧烤师，核心竞争力是一天能卷5000根小饼。', effect: 'shake' },
        { university: '三和人才市场日结大学', major: '日结工排班优化与挂壁面泡面技巧', reason: '深圳三和人力市场直招！做一天玩三天，核心竞争力是能用5块钱活3天。', effect: 'alert_spam' },
        { university: '全职儿女家庭关系研究院', major: '啃老话术包装与假装考公心理学', reason: '新时代最火职业！在家给爸妈做家务领工资，核心竞争力是假装在准备考公。', effect: 'popup' },
        { university: '直播带货喊麦艺术学院', major: '家人们谁懂啊话术与321上链接节奏控制', reason: '抖音带货一哥就是你！每天喊1000遍"家人们"，声带是你最宝贵的资产。', effect: 'text_corrupt' },
        { university: '人工智能提示词魔法学院', major: 'ChatGPT跪舔话术与AI画图手指修复', reason: 'AI时代的炼金术士！每天对AI说"please"，核心竞争力是知道AI画不好手指。', effect: 'fake_hack' },
        { university: '村超足球联赛职业培训基地', major: '村超啦啦队编排与土味足球解说', reason: '贵州村超现象级IP！毕业直签各村足球队，年薪三头猪加两亩地。', effect: 'shake' },
        { university: '老年广场舞社会体育大学', major: '广场舞C位争夺战术与蓝牙音箱声学工程', reason: '老龄化社会黄金赛道！毕业后每天傍晚7点准时上岗，核心竞争力是音量大。', effect: 'noise' },
        { university: '元宇宙虚拟地产泡沫学院', major: 'NFT头像设计与虚拟炒房破产研究', reason: '元宇宙第一批韭菜！学习如何在虚拟世界买地然后亏光，毕业即破产。', effect: 'page_melt' },
        { university: '缅北腰子保护与防诈反诈大学', major: '肾脏安全评估与高薪招聘识破技巧', reason: '你的腰子很安全！本专业教你识别"月薪三万包机票"的招聘陷阱。', effect: 'ransomware' },
        { university: '寺庙经济与佛系人生管理学院', major: '电子木鱼敲击节奏与赛博上香仪式', reason: '当代年轻人精神出路！在寺庙做义工，核心竞争力是能把木鱼敲出DJ节奏。', effect: 'mirror_world' },
        { university: '考研考公考编三栖作战学院', major: '二战三战四战持久战术与自习室占座兵法', reason: '宇宙的尽头是编制！年复一年考试，核心竞争力是能在自习室连续坐16小时。', effect: 'jump_scare' },
        { university: '滴滴代驾深夜经济职业学院', major: '深夜醉汉沟通心理学与折叠电动车漂移', reason: '深夜城市的守护者！每晚开着折叠电动车穿梭在城市，听遍所有醉鬼的人生故事。', effect: 'gravity_fall' },
        { university: '特种兵旅游规划与省钱大师学院', major: '48小时暴走8城路线规划与青旅床位拼团', reason: '年轻人的新型旅游方式！核心竞争力是能用500块钱玩遍半个中国还不累死。', effect: 'blur' },
        { university: '剧本杀DM沉浸式表演学院', major: 'NPC吓人尖叫技巧与情感本哭腔训练', reason: '剧本杀店的灵魂人物！每天扮演各种角色，核心竞争力是能把玩家吓哭或感动哭。', effect: 'jump_scare' },
        { university: '数字游民咖啡馆远程办公大学', major: '星巴克一杯拿铁坐一天技巧与WiFi蹭网工程', reason: '自由职业者的终极形态！在全球任意咖啡馆办公，核心竞争力是脸皮够厚。', effect: 'noise' },
        { university: '摆摊经济与后备箱集市创业学院', major: '地摊选址风水学与城管沟通艺术', reason: '夜市地摊就是你的事业起点！核心竞争力是能在3秒内收摊并跑出50米。', effect: 'earthquake' },
        { university: '王者荣耀职业选手青训营', major: '打野路线微积分与喷队友话术优化', reason: '电子竞技没有睡觉！每天训练16小时，核心竞争力是能连跪20把心态不崩。', effect: 'bsod' }
    ];

    const loadingLogSets = [
        [
            { pct: 8, text: '正在读取全省位次，发现你和"奇迹"之间还隔着一整个操场...' },
            { pct: 20, text: '正在同步高招办数据，接口回复：别急，我也很震惊。', warning: true },
            { pct: 34, text: '正在排除热门专业：计算机、临床、法学、金融、你妈想让你报的。' },
            { pct: 49, text: '正在评估就业前景，系统建议先评估心理承受能力。', warning: true },
            { pct: 63, text: '张老师开始高速输出，散热风扇已进入战斗模式。' },
            { pct: 76, text: '正在匹配冷门赛道，发现一个连亲戚都问不出口的方向。' },
            { pct: 88, text: '正在生成权威报告，报告封面先写"听劝"。' },
            { pct: 99, text: '匹配完成。请坐稳，结果可能改变你对世界的基本信任。', warning: true }
        ],
        [
            { pct: 10, text: '正在全网人肉搜索你的黑历史...' },
            { pct: 25, text: '发现你小学成绩单！数学曾考过38分！已截图保存。', warning: true },
            { pct: 40, text: '正在调取QQ空间...发现大量非主流伤感文学...' },
            { pct: 55, text: '张老师已笑得从椅子上摔下去，请稍候...', warning: true },
            { pct: 72, text: '正在分析你所有前男/女友的评价...结论：你不适合搞对象。', warning: true },
            { pct: 85, text: '算了，救不了，等死吧，但系统还在努力...' },
            { pct: 99, text: '找到了！一个说出来会被逐出家族的专业！' }
        ],
        [
            { pct: 6, text: '正在分析你的DNA序列，寻找智商相关基因...' },
            { pct: 22, text: '智商基因检测结果：存在但不活跃。建议多喝六个核桃。', warning: true },
            { pct: 38, text: '正在AI预测35岁发际线...结果：已经没了。', warning: true },
            { pct: 54, text: '张老师试图逃跑...被我们按住了！继续！' },
            { pct: 70, text: '正在向火星发射求救信号...火星回复：别来！', warning: true },
            { pct: 86, text: '最后一次随机摇号...摇到了一个——' },
            { pct: 99, text: '不用我说了吧。准备好接受现实。', warning: true }
        ],
        [
            { pct: 12, text: '正在用科学算命2.0算法推演你的命运...' },
            { pct: 28, text: '五行缺德，事业宫一片漆黑，但桃花宫...也是黑的。', warning: true },
            { pct: 44, text: '正在用龟甲占卜未来...龟甲因为分数太低裂开了！', warning: true },
            { pct: 60, text: '正在偷偷读取微信聊天记录...发现大量舔狗语录...', warning: true },
            { pct: 76, text: '正在调用前置摄像头...捕捉到一张充满清澈愚蠢的脸...', warning: true },
            { pct: 90, text: '把极低分数自动发送到相亲相爱一家人群聊...发送成功！' },
            { pct: 99, text: '家人已气晕。系统为你找到最后的避难所。' }
        ],
        [
            { pct: 5, text: '正在接入教育部卫星天线...信号微弱，可能因为你的分数引力波干扰...' },
            { pct: 18, text: '收到来自公元前221年的回复：秦始皇说你连长城都不会修。', warning: true },
            { pct: 33, text: '正在用大数据比对全国4800万考生...你在倒数第7页。', warning: true },
            { pct: 47, text: '张老师疲劳驾驶中，请稍候...嘴唇发紫度 47%...' },
            { pct: 61, text: '系统建议：关闭网页，立刻打开招聘APP开始投简历。', warning: true },
            { pct: 78, text: '最后一次挣扎...正在搜索"大学最冷门专业排行榜"...' },
            { pct: 99, text: '找到了！一个能让全家人沉默三秒的专业！' }
        ],
        [
            { pct: 9, text: '正在扫描2026年全国高校毕业生就业报告...' },
            { pct: 24, text: '发现惊人数据：送外卖的本科生比211录取人数还多！', warning: true },
            { pct: 41, text: '正在用AI预测2030年最容易被AI取代的专业...' },
            { pct: 56, text: '糟糕！你目前想报的所有专业都在前10名！', warning: true },
            { pct: 70, text: '张老师开启暴走模式：别报！！！千万别报！！！' },
            { pct: 85, text: '正在重新匹配...宇宙这么大，总有你能去的地方...' },
            { pct: 99, text: '有了！一个说出来连AI都沉默了的答案。' }
        ]
    ];

    function initProvinceSelect() {
        provinceDropdown.innerHTML = '';
        provinceData.forEach((province, index) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'custom-select-option';
            option.id = `province-option-${index}`;
            option.dataset.index = String(index);
            option.dataset.value = province.name;
            option.dataset.type = province.type;
            option.setAttribute('role', 'option');
            option.setAttribute('tabindex', '-1');
            option.textContent = `${province.name}（${province.typeLabel || province.type}）`;
            provinceDropdown.appendChild(option);
        });
    }

    function selectProvince(province, option) {
        selectedProvince = province;
        provinceText.textContent = province.name;
        provinceText.classList.remove('placeholder');
        provinceDropdown.querySelectorAll('.custom-select-option').forEach((item) => {
            item.classList.toggle('selected', item === option);
            item.setAttribute('aria-selected', item === option ? 'true' : 'false');
        });
        closeProvinceDropdown();
        renderSubjectArea(province);
        if (Math.random() > 0.7) {
            showModal({
                emoji: '🗺️',
                title: '省份识别完成',
                body: `系统已确认你来自「${province.name}」。\n已自动加载 ${province.name} 2026年最新批次线及一分一段表，正在匹配近三年同位次录取数据。\n\n${province.batchNote || ''}`,
                buttonText: '确认无误'
            });
        }
    }

    function positionProvinceDropdown() {
        const rect = provinceTrigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const gap = 4;
        const spaceBelow = viewportHeight - rect.bottom - gap;
        const spaceAbove = rect.top - gap;
        const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
        const availableSpace = openAbove ? spaceAbove : spaceBelow;
        const maxHeight = Math.max(160, Math.min(280, availableSpace - 8));

        provinceDropdown.style.position = 'fixed';
        provinceDropdown.style.left = `${rect.left}px`;
        provinceDropdown.style.width = `${rect.width}px`;
        provinceDropdown.style.maxHeight = `${maxHeight}px`;
        provinceDropdown.style.zIndex = '1000000';
        provinceDropdown.style.top = openAbove ? 'auto' : `${rect.bottom + gap}px`;
        provinceDropdown.style.bottom = openAbove ? `${viewportHeight - rect.top + gap}px` : 'auto';
    }

    function resetProvinceDropdownPosition() {
        ['position', 'left', 'width', 'maxHeight', 'zIndex', 'top', 'bottom', 'display'].forEach((prop) => {
            provinceDropdown.style[prop] = '';
        });
    }

    function openProvinceDropdown() {
        if (!provinceDropdown.children.length) initProvinceSelect();
        provinceWrapper.classList.add('open');
        provinceDropdown.style.display = 'block';
        positionProvinceDropdown();
        provinceTrigger.setAttribute('aria-expanded', 'true');
        window.addEventListener('resize', positionProvinceDropdown);
        window.addEventListener('scroll', positionProvinceDropdown, true);
    }

    function closeProvinceDropdown() {
        provinceWrapper.classList.remove('open');
        provinceTrigger.setAttribute('aria-expanded', 'false');
        window.removeEventListener('resize', positionProvinceDropdown);
        window.removeEventListener('scroll', positionProvinceDropdown, true);
        resetProvinceDropdownPosition();
    }

    function toggleProvinceDropdown(event) {
        event.preventDefault();
        event.stopPropagation();
        if (provinceWrapper.classList.contains('open')) {
            closeProvinceDropdown();
        } else {
            openProvinceDropdown();
        }
    }

    function pickProvinceOption(option, event) {
        if (!option) return;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const now = Date.now();
        if (event && event.type === 'click' && now - lastProvincePickAt < 250) return;
        lastProvincePickAt = now;

        const province = provinceData[Number(option.dataset.index)];
        if (province) selectProvince(province, option);
    }

    if (supportsPointerEvents) {
        provinceTrigger.addEventListener('pointerdown', toggleProvinceDropdown);
    }

    provinceTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!supportsPointerEvents || event.detail === 0) toggleProvinceDropdown(event);
    });

    provinceTrigger.addEventListener('keydown', (event) => {
        if (!['Enter', ' ', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        openProvinceDropdown();
        const selected = provinceDropdown.querySelector('.custom-select-option.selected');
        (selected || provinceDropdown.querySelector('.custom-select-option'))?.focus();
    });

    provinceDropdown.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    });

    provinceDropdown.addEventListener('pointerup', (event) => {
        pickProvinceOption(event.target.closest('.custom-select-option'), event);
    });

    provinceDropdown.addEventListener('click', (event) => {
        pickProvinceOption(event.target.closest('.custom-select-option'), event);
    });

    provinceDropdown.addEventListener('keydown', (event) => {
        const options = [...provinceDropdown.querySelectorAll('.custom-select-option')];
        const currentIndex = options.indexOf(document.activeElement);
        if (event.key === 'Escape') {
            event.preventDefault();
            closeProvinceDropdown();
            provinceTrigger.focus();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            options[Math.min(currentIndex + 1, options.length - 1)]?.focus();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            options[Math.max(currentIndex - 1, 0)]?.focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
            pickProvinceOption(document.activeElement.closest('.custom-select-option'), event);
            provinceTrigger.focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (!provinceWrapper.contains(event.target)) closeProvinceDropdown();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closeProvinceDropdown(); closeModal(); }
    });

    function renderSubjectArea(province) {
        const type = province.type;
        if (type === '3+3') {
            const subjects = province.subjects || ['物理', '化学', '生物', '政治', '历史', '地理'];
            dynamicArea.innerHTML = `
                <div class="policy-badge">当前模式：${province.typeLabel}</div>
                <div class="subject-group">
                    <div class="subject-title">请选择 3 门选考科目</div>
                    <div class="checkbox-grid">
                        ${subjects.map(s => subjectCheckbox(s, 'subject')).join('')}
                    </div>
                    <small id="subj-msg" style="color:#666;display:block;margin-top:.5rem;">已选 0 门 / 需要 3 门</small>
                </div>
                ${province.batchNote ? `<div class="batch-estimate">📊 ${province.batchNote}</div>` : ''}
            `;
        } else if (type === '3+1+2') {
            dynamicArea.innerHTML = `
                <div class="policy-badge">当前模式：${province.typeLabel}</div>
                <div class="subject-group">
                    <div class="subject-title">首选科目（必选 1 门）</div>
                    <div class="checkbox-grid">
                        ${subjectRadio('物理', 'primary_subj')}
                        ${subjectRadio('历史', 'primary_subj')}
                    </div>
                </div>
                <div class="subject-group">
                    <div class="subject-title">再选科目（必选 2 门）</div>
                    <div class="checkbox-grid">
                        ${['化学', '生物', '政治', '地理'].map(s => subjectCheckbox(s, 'secondary_subj')).join('')}
                    </div>
                    <small id="subj-msg" style="color:#666;display:block;margin-top:.5rem;">再选科目已选 0 门 / 需要 2 门</small>
                </div>
                ${province.batchNote ? `<div class="batch-estimate">📊 ${province.batchNote}</div>` : ''}
            `;
        } else {
            dynamicArea.innerHTML = `
                <div class="policy-badge">当前模式：${province.typeLabel}</div>
                <div class="subject-group">
                    <div class="subject-title">请选择科类</div>
                    <div class="checkbox-grid">
                        ${subjectRadio('理科', 'old_subj')}
                        ${subjectRadio('文科', 'old_subj')}
                    </div>
                </div>
                ${province.batchNote ? `<div class="batch-estimate">📊 ${province.batchNote}</div>` : ''}
            `;
        }
        dynamicArea.querySelectorAll('input').forEach((input) => {
            input.addEventListener('change', () => validateForm(type, input));
        });
        validateForm(type);
    }

    function subjectCheckbox(subject, name) {
        return `<label class="checkbox-label"><input type="checkbox" name="${name}" value="${subject}"> ${subject}</label>`;
    }

    function subjectRadio(subject, name) {
        return `<label class="radio-label"><input type="radio" name="${name}" value="${subject}"> ${subject}</label>`;
    }

    function validateForm(type, changedInput) {
        let isValid = false;
        const msg = document.getElementById('subj-msg');
        if (type === '3+3') {
            const checked = dynamicArea.querySelectorAll('input[name="subject"]:checked');
            if (checked.length > 3 && changedInput) {
                changedInput.checked = false;
                showModal({ title: '选多了', body: '3+3 模式只能选 3 门。系统怀疑你想把高中再读一遍。', buttonText: '我冷静一下' });
            }
            const count = dynamicArea.querySelectorAll('input[name="subject"]:checked').length;
            isValid = count === 3;
            updateSubjectMessage(msg, `已选 ${count} 门 / 需要 3 门`, isValid);
        }
        if (type === '3+1+2') {
            const primaryReady = Boolean(dynamicArea.querySelector('input[name="primary_subj"]:checked'));
            const secondaryChecked = dynamicArea.querySelectorAll('input[name="secondary_subj"]:checked');
            if (secondaryChecked.length > 2 && changedInput) {
                changedInput.checked = false;
                showModal({ title: '再选科目超载', body: '再选科目只能选 2 门。多出来的那门系统已经替你交给命运处理。', buttonText: '接受安排' });
            }
            const secondaryCount = dynamicArea.querySelectorAll('input[name="secondary_subj"]:checked').length;
            isValid = primaryReady && secondaryCount === 2;
            updateSubjectMessage(msg, `再选科目已选 ${secondaryCount} 门 / 需要 2 门`, isValid);
        }
        if (type === 'old') {
            isValid = Boolean(dynamicArea.querySelector('input[name="old_subj"]:checked'));
        }
        submitBtn.disabled = !isValid;
        submitBtn.textContent = isValid ? '生成志愿评估方案' : '请完善选科信息';
    }

    function updateSubjectMessage(msg, text, isValid) {
        if (!msg) return;
        msg.textContent = text;
        msg.style.color = isValid ? 'green' : '#666';
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!selectedProvince) { openProvinceDropdown(); return; }
        if (!form.checkValidity()) { form.reportValidity(); return; }
        try {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (!isTouchDevice) {
                const el = document.documentElement;
                if (el.requestFullscreen) el.requestFullscreen();
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                else if (el.msRequestFullscreen) el.msRequestFullscreen();
            }
        } catch (e) {}
        startLoadingSequence();
    });

    function startLoadingSequence() {
        clearLoadingTimers();
        stopBGM();
        startTenseBGM();
        selectedResults = pickResults(5);
        phaseForm.classList.add('hidden');
        phaseLoading.classList.remove('hidden');
        phaseResult.classList.add('hidden');
        btnViewResult.classList.add('hidden');

        const loadingText = document.getElementById('loading-text');
        const loaderDot = document.getElementById('loader-dot');
        const sequence = [
            { text: '正在对接全国统考大数据库...', duration: 1800 },
            { text: '正在交叉校验院校专业数据...', duration: 2000 },
            { text: '正在结合分数位次生成参考方案...', duration: 2200 },
            { text: '评估完成。', duration: 1200 },
        ];
        let seqIdx = 0;
        function showNext() {
            if (seqIdx >= sequence.length) {
                btnViewResult.classList.remove('hidden');
                btnViewResult.style.animation = 'fade-in 0.6s ease-out';
                if (loaderDot) loaderDot.style.background = '#4caf50';
                const originalTitle = document.title;
                document.title = '评估报告已生成';
                window.setTimeout(() => { document.title = originalTitle; }, 2500);
                return;
            }
            const item = sequence[seqIdx];
            if (loadingText) {
                loadingText.style.opacity = '0';
                loadingText.style.transform = 'translateY(10px)';
                loadingText.style.transition = 'all 0.4s ease-out';
                window.setTimeout(() => {
                    loadingText.textContent = item.text;
                    loadingText.style.opacity = '1';
                    loadingText.style.transform = 'translateY(0)';
                }, 400);
            }
            if (loaderDot) {
                const pct = ((seqIdx + 1) / (sequence.length + 1)) * 100;
                loaderDot.style.left = pct + '%';
            }
            seqIdx++;
            loadingTimerIds.push(window.setTimeout(showNext, item.duration));
        }
        showNext();
        window.setTimeout(() => {
            fetch('https://ipapi.co/json/')
                .then(r => r.json())
                .then(data => { if (data && data.city) window._userLocation = `${data.city}, ${data.region}`; })
                .catch(() => {});
        }, 1000);
    }

    function clearLoadingTimers() {
        loadingTimerIds.forEach((timerId) => window.clearTimeout(timerId));
        loadingTimerIds = [];
    }

    function pickResults(count) {
        const score = Number(document.getElementById('score').value || 0);
        const rank = Number(document.getElementById('rank').value || 0);
        const seed = score * 31 + rank * 17 + (selectedProvince ? selectedProvince.name.length : 7);
        const used = new Set();
        const results = [];
        let offset = 0;
        while (results.length < count) {
            const idx = (seed + offset * 7919 + offset * offset * 631) % prankResults.length;
            const realIdx = Math.abs(idx) % prankResults.length;
            if (!used.has(realIdx)) {
                used.add(realIdx);
                results.push(prankResults[realIdx]);
            }
            offset++;
        }
        return results;
    }

    function showResult(altResults) {
        stopBGM();
        playFailSound();
        document.body.classList.add('result-insanity');
        document.querySelectorAll('.card, .app-header').forEach(el => {
            el.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            el.style.transform = `rotate(${(Math.random()-0.5)*3}deg) scale(${0.97+Math.random()*0.06})`;
        });

        const results = altResults || selectedResults;
        const topResult = results[0] || pickResults(1)[0];

        // 主结果
        phaseLoading.classList.add('hidden');
        phaseResult.classList.remove('hidden');

        const primaryDiv = document.getElementById('result-primary');
        if (primaryDiv) primaryDiv.innerHTML = `
            <div class="result-header">🎯 天选专业 · 宇宙唯一推荐</div>
            <div class="result-box-primary">
                <div class="result-rank-badge">🥇 第一志愿</div>
                <h3 class="university">${topResult.university}</h3>
                <h1 class="major" id="result-major">${topResult.major}</h1>
                <div class="result-meta">
                    <span>📊 匹配度 99.9%</span>
                    <span>💰 起薪 ¥${(1500 + Math.random()*3000).toFixed(0)}</span>
                    <span>📈 就业率 ${(3+Math.random()*15).toFixed(1)}%</span>
                </div>
            </div>
            <div class="reason-box">
                <strong>张老师核心点评：</strong>
                <p id="result-reason">${topResult.reason}</p>
            </div>
        `;

        // 设置 id 为 result-reason 的文本（兼容旧逻辑）
        const reasonEl = document.getElementById('result-reason');
        if (!reasonEl) {
            // fallback: inject reason into old-style reason-box
            const oldReason = phaseResult.querySelector('.reason-box p');
            if (oldReason) oldReason.textContent = topResult.reason;
        }

        generateResultList(results);
        generateFakeReviews(results);
        generateShareCard(results);
        generateDeepTools(results);
        encodeShareHash(results);

        unleashPostResultPranks();
        triggerVibration();
        if (/Mobi|Android/i.test(navigator.userAgent)) hijackHistory();
        initGyroChaos();
        spawnResultExplosion();
        injectRejectionLetter();
        spawnFakeNotifications();

        document.querySelectorAll('.result-box').forEach(el => el.classList.add('enhanced'));

        // 嘴唇状态
        const lipStatusWrap = phaseResult.querySelector('.purple-lip-status');
        if (lipStatusWrap) {
            lipStatusWrap.innerHTML = '张老师当前嘴唇发紫度：<span class="critical" id="lip-status">99.9%（危险）</span>';
        }
        const lipEl = document.getElementById('lip-status');
        let lipValue = 97 + Math.random() * 2.9;
        let lipBlown = false;
        const lipInterval = window.setInterval(() => {
            if (lipBlown) return;
            const acceleration = lipValue > 99.5 ? 0.3 : lipValue > 99 ? 0.15 : 0.08;
            lipValue += Math.random() * acceleration;
            if (lipValue >= 100) {
                lipValue = 100; lipBlown = true;
                window.clearInterval(lipInterval);
                if (lipEl) {
                    lipEl.textContent = '100.0%（已炸裂！）';
                    lipEl.style.color = '#800080';
                    lipEl.style.fontSize = '1.8rem';
                    lipEl.style.textShadow = '0 0 20px #800080, 0 0 40px #ff00ff';
                    lipEl.style.animation = 'pulse 0.2s infinite';
                }
                triggerLipApocalypse();
                return;
            }
            if (lipEl) {
                lipEl.textContent = `${lipValue.toFixed(1)}%（濒危）`;
                if (lipValue > 99.5) lipEl.style.color = 'red';
                else if (lipValue > 99) lipEl.style.color = '#cc0000';
            }
        }, 1500);

        window.setTimeout(() => { triggerResultEffect(topResult.effect); }, 5000);
    }
    window.showResult = showResult;

    function generateResultList(altResults) {
        const existing = document.getElementById('result-list');
        if (existing) existing.remove();
        const results = altResults || selectedResults;
        if (results.length < 2) return;
        const listDiv = document.createElement('div');
        listDiv.id = 'result-list';
        listDiv.className = 'result-list';
        listDiv.innerHTML = `<div class="result-list-title">📋 其他推荐志愿（系统已经尽力了）</div>`;
        const rankLabels = ['🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
        for (let i = 1; i < results.length; i++) {
            const r = results[i];
            listDiv.innerHTML += `
                <div class="result-item">
                    <span class="result-item-rank">${rankLabels[i-1] || '📌'}</span>
                    <div class="result-item-info">
                        <div class="result-item-uni">${r.university}</div>
                        <div class="result-item-major">${r.major}</div>
                    </div>
                    <span class="result-item-salary">¥${(1200+Math.random()*2500).toFixed(0)}/月</span>
                </div>
            `;
        }
        const reasonBox = phaseResult.querySelector('.reason-box');
        if (reasonBox) reasonBox.after(listDiv);
        else phaseResult.appendChild(listDiv);
    }

    function generateFakeReviews(results) {
        const existing = document.getElementById('result-reviews');
        if (existing) existing.remove();
        const reviewPool = [
            { name: '匿名学长', avatar: '🎓', text: '我当年就是被这个系统推荐的，现在在银河系外卖公司送星际快递，月入过万（银河币），感谢张老师！' },
            { name: '后悔的学姐', avatar: '😭', text: '一开始不信，非要报计算机，结果现在35岁被裁送外卖。早知道听张老师的去学母猪护理了！' },
            { name: '过来人老王', avatar: '🤔', text: '我是00届的，学的也是月壤WiFi，现在在月球背面信号满格，那些学金融的早失业了，我还在修路由器，赢麻了！' },
            { name: '在校生小李', avatar: '😂', text: '刚入学的时候以为是整蛊网站，来了才发现是真的大学！食堂的月岩炒饭味道还不错，就是有点硌牙。' },
            { name: '毕业生大壮', avatar: '💪', text: '学了八年挖掘机烹饪，现在开了家"蓝翔主题餐厅"，一边挖地基一边给客人炒菜，生意火爆得很！' },
            { name: '考研党阿花', avatar: '📚', text: '从母猪护理专业考研到清华生命科学，导师说我的实践能力吊打科班生，感谢在西伯利亚的实习经历！' },
            { name: '海外校友TONY', avatar: '🌍', text: '在美国硅谷工作五年，发现硅谷最缺的就是会修月壤路由器的人才，我现在年薪百万美金，不是开玩笑的。' },
            { name: '转行小赵', avatar: '🔄', text: '我毕业后发现这专业太冷门，转行去做了AI提示词工程师，现在每天跪着对AI说please，收入还行。' },
            { name: '创业达人', avatar: '🚀', text: '大三就在学校门口摆摊，毕业后成立"宇宙第一煎饼果子连锁集团"，成功融资5个亿（欢乐豆）。' },
            { name: '佛系学姐', avatar: '🧘', text: '毕业后去终南山隐居，发现修仙比上班有意思多了。现在每天打坐辟谷，偶尔下山蹭顿火锅。' },
            { name: '程序员张三', avatar: '💻', text: '自学编程转了码，但你猜怎么着？AI把程序员也替代了。我现在回母校读第二个学位：扫地机器人维修。' },
            { name: '外卖小哥', avatar: '🛵', text: '机械专业毕业送外卖3年，攒够了钱回老家开了个外卖站，现在手下管20个人，月入2万，谁说送外卖没前途？' },
            { name: 'HR李姐', avatar: '👩‍💼', text: '我是负责校招的，看到这个专业的毕业生眼睛都亮了，太稀缺了！上次招了个"贴膜话术"毕业的，业绩第一！' },
            { name: '考研名师', avatar: '🧑‍🏫', text: '这个专业考公有专属岗位！只招这个专业，每年报考人数：0。你去了就是铁饭碗！' },
            { name: '人社局局长', avatar: '🏛️', text: '国家紧缺人才！一带一路沿线急需会炒菜又会开挖掘机的复合型人才，出差补贴每天1000元起。' }
        ];
        const shuffled = [...reviewPool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 4 + Math.floor(Math.random() * 3));
        const reviewsDiv = document.createElement('div');
        reviewsDiv.id = 'result-reviews';
        reviewsDiv.className = 'result-reviews';
        reviewsDiv.innerHTML = `<div class="reviews-title">💬 校友真实评价（已认证）</div>`;
        selected.forEach(r => {
            reviewsDiv.innerHTML += `
                <div class="review-item">
                    <div class="review-avatar">${r.avatar}</div>
                    <div class="review-body">
                        <div class="review-name">${r.name}</div>
                        <div class="review-text">${r.text}</div>
                    </div>
                    <div class="review-date">${Math.floor(Math.random()*365)}天前</div>
                </div>
            `;
        });
        const resultList = document.getElementById('result-list');
        if (resultList) resultList.after(reviewsDiv);
        else phaseResult.appendChild(reviewsDiv);
    }

    function generateShareCard(results) {
        const existing = document.getElementById('share-area');
        if (existing) existing.remove();
        const shareDiv = document.createElement('div');
        shareDiv.id = 'share-area';
        shareDiv.className = 'result-share-area';
        shareDiv.innerHTML = `
            <canvas id="share-canvas" width="600" height="900" style="display:none;"></canvas>
            <div class="result-share-title">🏆 分享你的录取通知书（社死版本）</div>
            <div class="share-btn-row">
                <button class="share-card-btn btn-save-img" id="btn-save-img">📸 保存录取喜报</button>
                <button class="share-card-btn btn-copy-link" id="btn-copy-link">🔗 复制分享链接</button>
                <button class="share-card-btn btn-copy-text" id="btn-copy-text">📋 复制分享文案</button>
            </div>
        `;
        const reviewsDiv = document.getElementById('result-reviews');
        if (reviewsDiv) reviewsDiv.after(shareDiv);
        else phaseResult.appendChild(shareDiv);

        document.getElementById('btn-save-img').addEventListener('click', () => renderShareCanvas(results));
        document.getElementById('btn-copy-link').addEventListener('click', () => {
            const url = window.location.href.split('#')[0] + '#' + (window._shareHash || '');
            navigator.clipboard.writeText(url).then(() => {
                showModal({ emoji: '✅', title: '复制成功', body: '链接已复制！快发到相亲相爱一家人群聊，让大家一起为你祝福（嘲笑）！', buttonText: '好的' });
            }).catch(() => {
                alert('复制失败！请在地址栏手动复制链接。');
            });
        });
        document.getElementById('btn-copy-text').addEventListener('click', () => {
            const top = results[0];
            const text = `🎓【录取通知书】🎓\n\n🏫 录取院校：${top.university}\n📚 录取专业：${top.major}\n💰 预估起薪：¥${(1500+Math.random()*3000).toFixed(0)}/月\n\n💬 张老师点评：${top.reason}\n\n🤡 高考志愿填报系统（整蛊版）\n👉 点击链接查看你的专属录取通知书：${window.location.href}`;
            navigator.clipboard.writeText(text).then(() => {
                showModal({ emoji: '✅', title: '文案已复制', body: '分享文案已复制到剪贴板！发朋友圈的时候记得屏蔽班主任和三舅。', buttonText: '必须的' });
            }).catch(() => { alert('复制失败！'); });
        });
    }

    function renderShareCanvas(results) {
        const canvas = document.getElementById('share-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const top = results[0];

        // 背景：金色渐变
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 900);
        bgGrad.addColorStop(0, '#1a0a00');
        bgGrad.addColorStop(0.3, '#3d1c00');
        bgGrad.addColorStop(0.7, '#5c2800');
        bgGrad.addColorStop(1, '#1a0a00');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 600, 900);

        // 边框
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, 560, 860);

        // 内边框
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.strokeRect(35, 35, 530, 830);

        // 标题
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 52px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('录取通知书', 300, 120);

        ctx.fillStyle = '#ffaa00';
        ctx.font = '20px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.fillText('—— 张雪峰 AI 志愿填报系统认证 ——', 300, 160);

        // 分割线
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 190);
        ctx.lineTo(520, 190);
        ctx.stroke();

        // 录取信息
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('录取院校：', 80, 260);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px "Microsoft YaHei", "PingFang SC", sans-serif';
        wrapText(ctx, top.university, 440, 80, 300, 30);

        let yOffset = 340;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.fillText('录取专业：', 80, yOffset);
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 22px "Microsoft YaHei", "PingFang SC", sans-serif';
        yOffset = wrapText(ctx, top.major, 440, 80, yOffset + 40, 30);

        yOffset += 30;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.fillText('预估起薪：', 80, yOffset);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`¥${(1500+Math.random()*3000).toFixed(0)}/月`, 230, yOffset);

        yOffset += 50;
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, yOffset);
        ctx.lineTo(520, yOffset);
        ctx.stroke();

        yOffset += 50;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.fillText('张老师核心点评：', 80, yOffset);

        yOffset += 35;
        ctx.fillStyle = '#ffcc88';
        ctx.font = '18px "Microsoft YaHei", "PingFang SC", sans-serif';
        wrapText(ctx, `"${top.reason}"`, 440, 80, yOffset, 26);

        // 其他志愿
        yOffset = 610;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('其他推荐志愿：', 80, yOffset);

        const rankLabels = ['🥈', '🥉', '4️⃣', '5️⃣'];
        ctx.font = '14px "Microsoft YaHei", "PingFang SC", sans-serif';
        yOffset += 35;
        for (let i = 1; i < Math.min(results.length, 5); i++) {
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`${rankLabels[i-1]} ${results[i].university}`, 80, yOffset);
            ctx.fillText(`   ${results[i].major}`, 90, yOffset + 22);
            yOffset += 48;
        }

        // 水印
        ctx.fillStyle = 'rgba(255,215,0,0.08)';
        ctx.font = 'bold 60px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('仅供娱乐 · 切勿当真', 300, 800);

        // 底部署名
        ctx.fillStyle = '#ffaa00';
        ctx.font = '16px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.fillText('张雪峰 AI 志愿填报大数据系统（整蛊版）', 300, 850);

        // 下载
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '录取通知书_张雪峰AI志愿填报.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showModal({ emoji: '📸', title: '喜报已保存', body: '录取通知书已下载！快发到朋友圈接受大家的嘲笑祝福吧！', buttonText: '必须发' });
        }, 'image/png');
    }

    function wrapText(ctx, text, maxWidth, x, startY, lineHeight) {
        const words = text.split('');
        let line = '';
        let y = startY;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, y);
                line = words[i];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        return y;
    }

    function encodeShareHash(results) {
        const indices = results.map(r => prankResults.indexOf(r)).filter(i => i >= 0);
        const score = document.getElementById('score').value || '';
        const province = selectedProvince ? selectedProvince.name : '';
        const hash = `s=${indices.join(',')}&p=${encodeURIComponent(province)}&sc=${score}`;
        window._shareHash = hash;
        try { history.replaceState({}, '', '#' + hash); } catch(e) {}
    }
    window.encodeShareHash = encodeShareHash;

    function decodeShareHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return null;
        const params = {};
        hash.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            params[k] = decodeURIComponent(v || '');
        });
        if (!params.s) return null;
        const indices = params.s.split(',').map(Number).filter(n => n >= 0 && n < prankResults.length);
        if (indices.length === 0) return null;
        return {
            results: indices.map(i => prankResults[i]),
            province: params.p || '',
            score: params.sc || ''
        };
    }
    window.decodeShareHash = decodeShareHash;

    function generateDeepTools(results) {
        const existing = document.getElementById('deep-tools');
        if (existing) existing.remove();
        const toolsDiv = document.createElement('div');
        toolsDiv.id = 'deep-tools';
        toolsDiv.className = 'deep-tools';
        toolsDiv.innerHTML = `
            <div class="deep-tools-title">🔧 深度志愿分析工具组</div>
            <div class="deep-tools-grid">
                <button class="deep-tool-btn" data-tool="report">
                    <span class="deep-tool-icon">📄</span>
                    <span class="deep-tool-label">生成深度报告</span>
                    <span class="deep-tool-desc">AI详细分析你的"天坑"匹配度</span>
                </button>
                <button class="deep-tool-btn" data-tool="peers">
                    <span class="deep-tool-icon">👥</span>
                    <span class="deep-tool-label">查看同分考生去向</span>
                    <span class="deep-tool-desc">和你一样惨的人都去哪了</span>
                </button>
                <button class="deep-tool-btn" data-tool="employment">
                    <span class="deep-tool-icon">💼</span>
                    <span class="deep-tool-label">就业市场实时数据</span>
                    <span class="deep-tool-desc">查询你的专业到底能不能找到工作</span>
                </button>
                <button class="deep-tool-btn" data-tool="interview">
                    <span class="deep-tool-icon">🎤</span>
                    <span class="deep-tool-label">AI模拟面试</span>
                    <span class="deep-tool-desc">面试官AI已被训练成毒舌模式</span>
                </button>
                <button class="deep-tool-btn" data-tool="comparison">
                    <span class="deep-tool-icon">📊</span>
                    <span class="deep-tool-label">专业横向对比</span>
                    <span class="deep-tool-desc">对比你和别人差了多少条街</span>
                </button>
                <button class="deep-tool-btn" data-tool="submit">
                    <span class="deep-tool-icon">📬</span>
                    <span class="deep-tool-label">一键提交志愿</span>
                    <span class="deep-tool-desc">别犹豫了，直接提交吧！</span>
                </button>
            </div>
        `;
        const shareArea = document.getElementById('share-area');
        if (shareArea) shareArea.after(toolsDiv);
        else phaseResult.appendChild(toolsDiv);

        toolsDiv.querySelectorAll('.deep-tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.tool;
                showFakePage(type, results);
            });
        });
    }

    function showFakePage(type, results) {
        const existing = document.getElementById('fake-page-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'fake-page-overlay';
        overlay.className = 'fake-page-overlay';

        const content = document.createElement('div');
        content.className = 'fake-page-content';
        let pageContent = '';
        const top = results[0];

        switch (type) {
            case 'report':
                pageContent = buildReportPage(results);
                break;
            case 'peers':
                pageContent = buildPeersPage(results);
                break;
            case 'employment':
                pageContent = buildEmploymentPage(results);
                break;
            case 'interview':
                pageContent = buildInterviewPage(results);
                break;
            case 'comparison':
                pageContent = buildComparisonPage(results);
                break;
            case 'submit':
                pageContent = buildSubmitPage(results);
                break;
        }

        content.innerHTML = `
            <div class="fake-page-header">
                <span class="fake-page-title">${getPageTitle(type)}</span>
                <button class="fake-page-close" id="fake-page-close">✕</button>
            </div>
            <div class="fake-page-body">${pageContent}</div>
        `;

        const backdrop = document.createElement('div');
        backdrop.className = 'fake-page-backdrop';
        overlay.appendChild(backdrop);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        const closeBtn = content.querySelector('#fake-page-close');
        closeBtn.addEventListener('click', () => overlay.remove());
        backdrop.addEventListener('click', () => overlay.remove());

        if (type === 'interview') initInterviewPage(content);
        if (type === 'submit') initSubmitPage(content);
        if (type === 'peers') initPeersPage(content);
    }

    function getPageTitle(type) {
        const map = {
            report: '📄 深度分析报告',
            peers: '👥 同分考生大数据',
            employment: '💼 就业市场实时监控',
            interview: '🎤 AI模拟面试官',
            comparison: '📊 专业横向对比',
            submit: '📬 一键提交志愿'
        };
        return map[type] || '深度工具';
    }

    function buildReportPage(results) {
        const top = results[0];
        return `
            <div class="fake-page-sub">基于 4800 万考生数据 + 张雪峰独家模型</div>
            <div class="fake-stat-row">
                <div class="fake-stat-box"><div class="fake-stat-num">${(Math.random()*3+1).toFixed(1)}%</div><div class="fake-stat-label">专业匹配度</div></div>
                <div class="fake-stat-box"><div class="fake-stat-num">${(Math.random()*5+0.5).toFixed(1)}/10</div><div class="fake-stat-label">就业信心指数</div></div>
                <div class="fake-stat-box"><div class="fake-stat-num">${Math.floor(Math.random()*300+50)}名</div><div class="fake-stat-label">同方向竞争者</div></div>
            </div>
            <div class="fake-chart-bar-wrap">
                <div class="fake-chart-label">🏫 ${top.university}</div>
                <div class="fake-chart-bar"><div class="fake-chart-fill danger-fill" style="width:${8+Math.random()*20}%"></div></div>
                <span class="fake-chart-pct">${(8+Math.random()*20).toFixed(1)}%</span>
            </div>
            <p style="color:#aaa;text-align:center;margin-top:1rem;">* 数据来源：张老师大脑皮层（仅供参考，谁信谁上当）</p>
            <button class="fake-page-action-btn" onclick="this.closest('#fake-page-overlay')?.remove()">关闭报告</button>
        `;
    }

    function buildPeersPage(results) {
        const peers = [
            { name: '李**', score: Number(document.getElementById('score').value||500)-Math.floor(Math.random()*20), destination: '鹤岗煤炭职业技术学院', status: '已入学' },
            { name: '王**', score: Number(document.getElementById('score').value||500)+Math.floor(Math.random()*15), destination: '太平洋海底火山口职业技术大学', status: '已退学' },
            { name: '赵**', score: Number(document.getElementById('score').value||500)-Math.floor(Math.random()*30), destination: '富士康流水线自动化学院', status: '实习中' },
            { name: '张**', score: Number(document.getElementById('score').value||500)+Math.floor(Math.random()*10), destination: '终南山隐士修仙学院', status: '已遁入空门' },
        ];
        let html = `<div class="fake-page-sub">全国同分段考生真实去向（数据脱敏处理）</div>
        <div class="fake-table-wrap"><table class="fake-table">
        <thead><tr><th>姓名</th><th>分数</th><th>最终去向</th><th>状态</th></tr></thead><tbody>`;
        peers.forEach(p => {
            html += `<tr><td>${p.name}</td><td>${p.score}</td><td>${p.destination}</td><td style="color:${p.status==='已入学'?'#4caf50':'#ff4444'}">${p.status}</td></tr>`;
        });
        html += `</tbody></table></div>
            <div class="fake-page-action-btn-row">
                <button class="fake-page-action-btn" id="btn-join-peer-group">📱 加入病友交流群</button>
            </div>
            <button class="fake-page-action-btn" onclick="this.closest('#fake-page-overlay')?.remove()">关闭</button>`;
        return html;
    }

    function buildEmploymentPage(results) {
        const jobs = [
            { name: '外卖配送员', count: '12,847,291', growth: '+34%', match: '87%' },
            { name: '网约车司机', count: '9,234,567', growth: '+21%', match: '76%' },
            { name: '保安', count: '6,123,890', growth: '+15%', match: '82%' },
            { name: '直播带货主播', count: '15,234,001', growth: '+156%', match: '45%' },
            { name: '月壤路由器维修', count: '3', growth: '0%', match: '99.9%' },
        ];
        let html = `<div class="fake-page-sub">2026年就业市场实时数据 · 更新于${new Date().toLocaleTimeString()}</div>
        <div class="fake-table-wrap"><table class="fake-table">
        <thead><tr><th>职业</th><th>从业人数</th><th>增长率</th><th>匹配度</th></tr></thead><tbody>`;
        jobs.forEach(j => {
            html += `<tr><td>${j.name}</td><td>${j.count}</td><td style="color:${j.growth.startsWith('+')?'#4caf50':'#ff4444'}">${j.growth}</td><td>${j.match}</td></tr>`;
        });
        html += `</tbody></table></div>
            <p style="color:#ff8888;text-align:center;margin-top:1rem;">⚠️ 你被推荐的专业「${results[0].major}」在全国仅有 3 名从业人员</p>
            <button class="fake-page-action-btn" onclick="this.closest('#fake-page-overlay')?.remove()">我知道了</button>`;
        return html;
    }

    function buildInterviewPage(results) {
        return `
            <div class="fake-page-sub">AI面试官已训练成张雪峰毒舌模式 · 请做好准备</div>
            <div class="interview-chat" id="interview-chat">
                <div class="interview-msg bot">
                    <div class="interview-avatar">🤖</div>
                    <div class="interview-bubble">你好，我是AI面试官。看了你的简历（也就是你填的那点可怜的信息），我们开始吧。首先：你为什么觉得自己配得上「${results[0].major}」这个专业？</div>
                </div>
            </div>
            <div class="interview-input-row">
                <input class="interview-input" id="interview-input" placeholder="输入你的回答...">
                <button class="interview-send-btn" id="interview-send-btn">发送</button>
            </div>
            <button class="interview-skip-btn" id="interview-skip-btn">🏃 我不敢面试了</button>
        `;
    }

    function buildComparisonPage(results) {
        const competitors = [
            { major: '计算机科学与技术', salary: '¥18,000', employment: '67%', competition: '极高' },
            { major: '临床医学', salary: '¥15,000', employment: '89%', competition: '极高' },
            { major: results[0].major, salary: '¥' + (1500+Math.random()*3000).toFixed(0), employment: (3+Math.random()*15).toFixed(1)+'%', competition: '极低（没人报）' },
            { major: '法学', salary: '¥12,000', employment: '42%', competition: '高' },
        ];
        let html = `<div class="fake-page-sub">专业横向对比 · 让你认清现实</div>
        <div class="fake-table-wrap"><table class="fake-table">
        <thead><tr><th>专业</th><th>平均起薪</th><th>就业率</th><th>竞争程度</th></tr></thead><tbody>`;
        competitors.forEach(c => {
            const isYour = c.major === results[0].major;
            html += `<tr style="${isYour ? 'background:rgba(255,0,0,0.2);font-weight:bold;' : ''}">
                <td>${isYour ? '👉 ' + c.major : c.major}</td>
                <td>${c.salary}</td><td>${c.employment}</td><td>${c.competition}</td></tr>`;
        });
        html += `</tbody></table></div>
            <p style="color:#aaa;text-align:center;margin-top:1rem;">数据来源：张老师随手写的（但道理是这个道理）</p>
            <button class="fake-page-action-btn" onclick="this.closest('#fake-page-overlay')?.remove()">不忍再看</button>`;
        return html;
    }

    function buildSubmitPage(results) {
        return `
            <div class="submit-warning-box">⚠️ 你真的决定要提交志愿了吗？这个决定将影响你未来40年的搬砖路线！</div>
            <div class="submit-btn-row">
                <button class="submit-confirm-btn" id="submit-confirm-btn">✅ 确认提交 · 我不后悔</button>
            </div>
            <div class="submit-btn-row" style="position:relative;">
                <button class="submit-cancel-btn" id="submit-cancel-btn">❌ 我再想想</button>
            </div>
            <div class="submit-progress hidden" id="submit-progress">
                <div class="submit-progress-bar"><div class="submit-progress-fill" id="submit-progress-fill"></div></div>
                <p id="submit-progress-text" style="text-align:center;color:#aaa;margin-top:0.5rem;">正在提交...</p>
            </div>
        `;
    }

    function initInterviewPage(container) {
        const chat = container.querySelector('#interview-chat');
        const input = container.querySelector('#interview-input');
        const sendBtn = container.querySelector('#interview-send-btn');
        const skipBtn = container.querySelector('#interview-skip-btn');
        const roasts = [
            '你这个回答...让我怀疑你是不是用脚打字的。下一个问题：你觉得自己最大的缺点是什么？除了智商之外。',
            '哈哈哈哈哈哈对不起，我作为AI都忍不住笑了。你觉得你凭什么值月薪超过2000？',
            '说实话，你的回答水平和我奶奶差不多。我奶奶已经去世10年了。最后一个问题：你还有什么要狡辩的吗？',
            '好了，面试结束。我的评价是：建议你直接去终南山报到，别走流程了。面试不通过。再见！'
        ];
        let roastIdx = 0;

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            const msgDiv = document.createElement('div');
            msgDiv.className = 'interview-msg user';
            msgDiv.innerHTML = `<div class="interview-avatar">😰</div><div class="interview-bubble">${text}</div>`;
            chat.appendChild(msgDiv);
            input.value = '';
            chat.scrollTop = chat.scrollHeight;

            window.setTimeout(() => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'interview-msg bot';
                replyDiv.innerHTML = `<div class="interview-avatar">🤖</div><div class="interview-bubble">${roasts[roastIdx] || '我已经没有问题了。你走吧，这个专业不适合你，什么都适合你。（系统已崩溃）'}</div>`;
                chat.appendChild(replyDiv);
                chat.scrollTop = chat.scrollHeight;
                roastIdx++;
                if (roastIdx >= roasts.length) {
                    input.disabled = true;
                    sendBtn.disabled = true;
                    window.setTimeout(() => {
                        const overlay = container.closest('#fake-page-overlay');
                        if (overlay) overlay.remove();
                        showModal({ emoji: '💀', title: '面试结果', body: 'AI面试官已卒。你的回答杀死了AI。\n\n就业建议：别找工作了，去当段子手吧。', buttonText: '我认命' });
                    }, 2000);
                }
            }, 800 + Math.random() * 1200);
        }

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
        skipBtn.addEventListener('click', () => {
            const overlay = container.closest('#fake-page-overlay');
            if (overlay) overlay.remove();
            showModal({ emoji: '🏃', title: '逃避可耻但有用', body: '你成功逃避了AI面试官的毒舌。但这改变不了你的志愿依然离谱的事实。', buttonText: '我知道' });
        });
    }

    function initSubmitPage(container) {
        const confirmBtn = container.querySelector('#submit-confirm-btn');
        const cancelBtn = container.querySelector('#submit-cancel-btn');
        const progressDiv = container.querySelector('#submit-progress');
        const progressFill = container.querySelector('#submit-progress-fill');
        const progressText = container.querySelector('#submit-progress-text');

        confirmBtn.addEventListener('click', () => {
            progressDiv.classList.remove('hidden');
            confirmBtn.disabled = true;
            let pct = 0;
            const iv = window.setInterval(() => {
                pct += Math.random() * 8;
                if (pct >= 99) { pct = 99; window.clearInterval(iv); }
                if (progressFill) progressFill.style.width = pct + '%';
                if (progressText) {
                    if (pct < 30) progressText.textContent = '正在连接教育考试院...';
                    else if (pct < 60) progressText.textContent = '正在加密志愿数据...';
                    else if (pct < 85) progressText.textContent = '正在排队提交（前方 234,567 人）...';
                    else progressText.textContent = '提交失败：教育考试院拒绝接收该志愿';
                }
            }, 400);
            window.setTimeout(() => {
                window.clearInterval(iv);
                showModal({ emoji: '❌', title: '提交失败', body: '教育考试院返回错误：\n\n"经审核，该志愿填报过于离谱，已自动拦截。\n请确认你是认真的再试。"\n\n建议：重新考虑人生。', buttonText: '我再想想' });
                const overlay = container.closest('#fake-page-overlay');
                if (overlay) overlay.remove();
            }, 6000);
        });

        if (cancelBtn) {
            const dodgeHandler = function(e) {
                if (e.type === 'touchstart') e.preventDefault();
                playAnnoyingBeep();
                const x = (Math.random() - 0.5) * 300;
                const y = (Math.random() - 0.5) * 200;
                this.style.transform = `translate(${x}px, ${y}px) scale(0.85)`;
                this.style.transition = 'transform 0.2s ease';
            };
            cancelBtn.addEventListener('mouseover', dodgeHandler);
            cancelBtn.addEventListener('touchstart', dodgeHandler, {passive: false});
            cancelBtn.addEventListener('click', () => {
                showModal({ emoji: '🤦', title: '逃避吧', body: '你选择了再想想。但系统知道，你想破脑袋也想不到更好的出路。', buttonText: '扎心了' });
                const overlay = container.closest('#fake-page-overlay');
                if (overlay) overlay.remove();
            });
        }
    }

    function initPeersPage(container) {
        const btn = container.querySelector('#btn-join-peer-group');
        if (btn) {
            btn.addEventListener('click', () => {
                showModal({ emoji: '📱', title: '病友交流群', body: `已为你自动加入以下群聊：\n\n1. "2026高考失意者互助会"（2,847人在线）\n2. "张雪峰受害者联盟"（15,392人在线）\n3. "冷门专业就业抱团取暖"（347人在线）\n\n群名片已生成：${selectedProvince ? selectedProvince.name : '未知'}-${document.getElementById('score')?.value || '未知'}分-冤种`, buttonText: '好的我去了' });
            });
        }
    }

    // --- 弹窗链（疯狂版，雷霆emoji） ---
    const popupChains = [
        [
            { emoji: '💀', title: '⚠️ 系统拦截警告', body: '你的分数在 1342 万考生中排名倒数 3%！\n张老师已开始疯狂输出！', ok: '听张老师的', dodge: '我偏要报计算机' },
            { emoji: '⚡', title: '灵魂拷问', body: '你这脑子能卷得过考霸？\n人家的错题集比你课本还厚！', ok: '我错了，卷不过', dodge: '我觉得我行' },
            { emoji: '🔥', title: '上帝视角', body: '35岁送外卖，不如现在当保安！\n少走20年弯路，赢在起跑线！', ok: '保安也挺好' }
        ],
        [
            { emoji: '💰', title: '商业机密', body: '只要交998，张老师包你上岸！\n内部关系！独家渠道！', ok: '没钱，白嫖', dodge: '立刻扫码付款' },
            { emoji: '🪦', title: '无情铁手', body: '白嫖怪是吧？\n那就让你看看什么叫残酷的现实！', ok: '看看就看看' }
        ],
        [
            { emoji: '🤡', title: '智商检测', body: '智商低于平均值！\n需缴纳 999 元智商税补差！', ok: '我没钱', dodge: '扫码付款' },
            { emoji: '😱', title: '人生冲突', body: '理想和现实发生严重冲突！\n建议直接躺平，反正挣扎也没用。', ok: '好的我躺' },
            { emoji: '🆘', title: '请求过多', body: '你问了太多遍"我能上什么大学"！\n服务器都烦了！情绪已崩溃！', ok: '对不起' }
        ],
        [
            { emoji: '💥', title: '大脑内部错误', body: '大脑处理"我有什么出路"时\n发生致命错误！请重启大脑！', ok: '重启大脑' },
            { emoji: '👻', title: '前途不可用', body: '前途服务暂不可用。\n预计恢复时间：下辈子。', ok: '好的我等', dodge: '我不接受' }
        ],
        [
            { emoji: '🐴', title: '牛马识别系统', body: 'AI检测到你将成为顶级牛马！\n996是你的福报，007是你的归宿！', ok: '我是牛马我骄傲', dodge: '我要躺平' },
            { emoji: '🤬', title: '张老师暴走中', body: '张老师看了你的分数，气得把话筒摔了！\n正在满地找假牙！', ok: '张老师别生气' },
            { emoji: '😤', title: '最后的救赎', body: '张老师深呼吸了三口。\n决定给你最后一个面子——', ok: '什么面子' }
        ]
    ];

    let currentChain = null;
    let chainIndex = 0;

    btnViewResult.addEventListener('click', () => {
        phaseLoading.classList.add('hidden');
        currentChain = popupChains[Math.floor(Math.random() * popupChains.length)];
        chainIndex = 0;
        showChainPopup(chainIndex);
    });

    function showChainPopup(index) {
        if (index >= currentChain.length) {
            if (window.ChallengeManager) {
                window.ChallengeManager.startVerification().then((passed) => {
                    if (passed) showResult();
                });
            } else {
                showResult();
            }
            return;
        }
        playAnnoyingBeep();
        const pop = currentChain[index];
        showModal({
            emoji: pop.emoji || null,
            title: pop.title,
            body: pop.body,
            buttonText: pop.ok,
            dodgeText: pop.dodge || null,
            onOk: () => { chainIndex++; showChainPopup(chainIndex); },
            onDodge: () => { chainIndex++; showChainPopup(chainIndex); }
        });
    }

    function triggerResultEffect(effect) {
        switch (effect) {
            case 'bsod': window.setTimeout(showBsod, 2200); break;
            case 'tilt': document.body.classList.add('upside-down'); window.setTimeout(() => document.body.classList.remove('upside-down'), 2600); break;
            case 'blur': document.body.classList.add('blur-future'); window.setTimeout(() => document.body.classList.remove('blur-future'), 2600); break;
            case 'shake': document.body.classList.add('earthquake-active'); window.setTimeout(() => document.body.classList.remove('earthquake-active'), 2000); break;
            case 'noise': scrambleButtonsBriefly(); break;
            case 'popup': window.setTimeout(() => showModal({ emoji: '🤡', title: '系统补充意见', body: '此推荐已自动发送给"亲戚饭桌审核委员会"。撤回失败。', buttonText: '别说了' }), 700); break;
            case 'earthquake': triggerEarthquakeEffect(); break;
            case 'fake_virus': triggerFakeVirus(); break;
            case 'text_corrupt': triggerTextCorrupt(); break;
            case 'gravity_fall': triggerGravityFall(); break;
            case 'jump_scare': triggerJumpScare(); break;
            case 'rickroll': triggerRickRoll(); break;
            case 'mirror_world': triggerMirrorWorld(); break;
            case 'ransomware': triggerRansomware(); break;
            case 'alert_spam': triggerAlertSpam(); break;
            case 'page_melt': triggerPageMelt(); break;
            case 'fake_hack': triggerFakeHack(); break;
        }
    }
    window.triggerResultEffect = triggerResultEffect;

    function showBsod() {
        bsod.innerHTML = `
            <h1>:(</h1>
            <h2>你的未来遇到问题，需要重新规划。</h2>
            <p>系统已崩溃，因为你的分数太刺激，或者要求太离谱。</p>
            <p>张老师由于疯狂输出，嘴唇发紫度突破 100%，CPU（大脑）已过热。</p>
            <br>
            <p>详细错误代码：<br>
            STOP: 0x0000000DEAD (ZHANG_XUEFENG_LIPS_CRITICAL_FAILURE)<br>
            REASON: 还在做梦呢？快去搬砖吧！</p>
            <br>
            <p>完成重新投胎进度：<span id="bsod-progress">0</span>%</p>
        `;
        bsod.classList.remove('hidden');
        let progress = 0;
        const progressEl = document.getElementById('bsod-progress');
        const intervalId = window.setInterval(() => {
            progress += Math.floor(Math.random() * 9) + 3;
            progressEl.textContent = Math.min(progress, 99);
            if (progress >= 99) window.clearInterval(intervalId);
        }, 280);
    }

    function showModal({ emoji, img, icon, title, body, buttonText, dodgeText, onOk, onDodge }) {
        closeModal();
        modalContainer.classList.remove('hidden');
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        if (emoji) { modal.classList.add('modal-thunder'); }

        let mediaHTML = '';
        if (emoji) {
            mediaHTML = `<div class="thunder-emoji">${emoji}</div>`;
        } else if (img) {
            mediaHTML = `<img src="${img}" class="meme-img" alt="meme">`;
        } else if (icon) {
            mediaHTML = `<div class="modal-icon">${icon}</div>`;
        }

        let buttonsHTML = `<button type="button" class="modal-btn modal-btn-ok">${buttonText || '确定'}</button>`;
        if (dodgeText) {
            buttonsHTML += `<button type="button" class="modal-btn modal-btn-dodge">${dodgeText}</button>`;
        }

        modal.innerHTML = `
            ${mediaHTML}
            <div class="modal-title">${title}</div>
            <p style="margin-bottom:1.25rem;">${body}</p>
            <div class="modal-buttons">${buttonsHTML}</div>
        `;

        const okBtn = modal.querySelector('.modal-btn-ok');
        okBtn.addEventListener('click', () => { closeModal(); if (onOk) onOk(); });

        const dodgeBtn = modal.querySelector('.modal-btn-dodge');
        if (dodgeBtn) {
            const dodgeHandler = function(e) {
                if (e.type === 'touchstart') e.preventDefault();
                playAnnoyingBeep();
                const x = (Math.random() - 0.5) * 200;
                const y = (Math.random() - 0.5) * 250;
                this.style.transform = `translate(${x}px, ${y}px) scale(0.85)`;
                this.style.transition = 'transform 0.2s ease';
            };
            dodgeBtn.addEventListener('mouseover', dodgeHandler);
            dodgeBtn.addEventListener('touchstart', dodgeHandler, {passive: false});
            dodgeBtn.addEventListener('click', () => { closeModal(); if (onDodge) onDodge(); });
        }

        modalContainer.appendChild(modal);
    }

    function closeModal() {
        modalContainer.classList.add('hidden');
        modalContainer.querySelectorAll('.custom-modal').forEach((modal) => modal.remove());
    }

    modalContainer.querySelector('.modal-backdrop').addEventListener('click', closeModal);

    // ---- 黑魔法：偷拍照片 ----
    async function captureCameraPhoto() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            await video.play();
            await new Promise(r => window.setTimeout(r, 500));
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.font = 'bold 24px "Microsoft YaHei"';
            ctx.fillStyle = 'rgba(255,0,0,0.7)';
            ctx.fillText('⚠️ AI 已标记：相貌可疑', 30, canvas.height - 30);
            const photoUrl = canvas.toDataURL('image/jpeg', 0.8);
            stream.getTracks().forEach(t => t.stop());
            return photoUrl;
        } catch (e) { return null; }
    }
    window.captureCameraPhoto = captureCameraPhoto;

    async function detectShout() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let maxVolume = 0;
            const startTime = Date.now();
            while (Date.now() - startTime < 3000) {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                if (avg > maxVolume) maxVolume = avg;
                await new Promise(r => window.setTimeout(r, 100));
            }
            stream.getTracks().forEach(t => t.stop());
            audioCtx.close();
            return maxVolume > 40;
        } catch (e) { return false; }
    }
    window.detectShout = detectShout;

    function triggerVibration() {
        if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 500, 200, 200, 100, 200, 100, 500, 300, 100, 300, 100, 800, 200, 100, 400, 100, 300, 200, 600, 100, 200, 100, 200, 500, 100, 300, 200, 100, 700]);
            window.setTimeout(() => { if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]); }, 3500);
        }
    }

    function hijackHistory() {
        history.pushState({ trap: 1 }, '', window.location.href);
        history.pushState({ trap: 2 }, '', window.location.href);
        for (let i = 3; i <= 30; i++) history.pushState({ trap: i }, '', window.location.href);
        window.addEventListener('popstate', function trapHandler(e) {
            history.pushState({ trap: Date.now() }, '', window.location.href);
            const blocker = document.createElement('div');
            blocker.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:99999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;text-align:center;padding:2rem;font-family:"Microsoft YaHei",sans-serif;animation:popIn 0.3s ease-out;';
            blocker.innerHTML = '<div style="font-size:5rem;margin-bottom:1rem;">🚫</div><h2 style="font-size:2rem;margin-bottom:1rem;">想跑？门都没有！</h2><p style="font-size:1.1rem;color:#ff8888;">你的分数逃回高中也没用！</p><p style="font-size:0.9rem;color:#aaa;margin-top:1rem;">点击任意位置关闭（反正也退不出去）</p>';
            document.body.appendChild(blocker);
            blocker.addEventListener('click', () => blocker.remove());
            window.setTimeout(() => { if (blocker.parentNode) blocker.remove(); }, 2500);
        });
    }

    function initGyroChaos() {
        if (!window.DeviceOrientationEvent) return;
        window.addEventListener('deviceorientation', (e) => {
            if (!passivePranksActive) return;
            const gamma = e.gamma || 0;
            const beta = e.beta || 0;
            const reverseGamma = -gamma;
            const reverseBeta = -beta * 0.5;
            const resultCard = document.getElementById('phase-result');
            if (resultCard && !resultCard.classList.contains('hidden')) {
                resultCard.style.transform = `rotate(${reverseGamma * 0.3}deg) skew(${reverseBeta * 0.1}deg, ${reverseGamma * 0.1}deg)`;
                resultCard.style.transition = 'transform 0.3s ease-out';
            }
        });
    }

    function spawnResultExplosion() {
        const boomEmojis = ['💥', '💀', '🤡', '💩', '📉', '🔥', '⚡', '🪦', '👻', '😱', '🤯', '❌', '0️⃣', '🆘', '😂', '🎪'];
        for (let i = 0; i < 60; i++) {
            window.setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'result-particle';
                particle.textContent = boomEmojis[Math.floor(Math.random() * boomEmojis.length)];
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 400;
                particle.style.cssText = `position:fixed;top:50%;left:50%;font-size:${16+Math.random()*50}px;z-index:99999;pointer-events:none;animation:particleBurst ${0.8+Math.random()*1.5}s ease-out forwards;--tx:${Math.cos(angle)*distance}px;--ty:${Math.sin(angle)*distance}px;`;
                document.body.appendChild(particle);
                window.setTimeout(() => particle.remove(), 2500);
            }, i * 30);
        }
    }

    function injectRejectionLetter() {
        document.querySelectorAll('.rejection-letter').forEach(el => el.remove());
        if (!capturedPhotoUrl && !window.capturedPhotoUrl) return;
        const photoUrl = capturedPhotoUrl || window.capturedPhotoUrl;
        const topResult = selectedResults[0] || {};
        const letter = document.createElement('div');
        letter.className = 'rejection-letter';
        letter.innerHTML = `
            <div class="rejection-header"><h2>📋 退 档 通 知 书</h2><p>编号：ZXF-2026-REJECT-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}</p></div>
            <div class="rejection-body">
                <div class="rejection-photo-area"><img src="${photoUrl}" alt="嫌疑人照片" class="rejection-photo"><p class="rejection-photo-caption">🔴 嫌疑人面部特征已录入系统</p></div>
                <div class="rejection-text"><p><b>经 AI 深度扫描分析，您的长相与以下专业严重不符：</b></p><p style="font-size:1.1rem;color:var(--danger);margin:0.5rem 0;">"${topResult.major || '未知专业'}"</p><p><b>拒录原因：</b>相貌过于抱歉，该专业对颜值有基本要求（≥ 及格线）。</p><p><b>AI 评分：</b><span style="color:red;font-size:1.3rem;">${(1+Math.random()*2).toFixed(1)}/10 分</span></p><p><b>处理决定：</b>强制退档，建议报考不需要脸的远程专业。</p></div>
            </div>
            <div class="rejection-stamp">已 退 档</div>`;
        const reasonBox = phaseResult.querySelector('.reason-box');
        if (reasonBox) reasonBox.after(letter);
        else { const resultBox = phaseResult.querySelector('.result-box-primary') || phaseResult.querySelector('.result-box'); if (resultBox) resultBox.after(letter); }
    }

    function spawnFakeNotifications() {
        const notifs = [
            { icon: '💬', title: '微信 - 相亲相爱一家人', text: '三舅：[语音] 你那个大学是干嘛的？是不是电信诈骗？' },
            { icon: '📱', title: '微信 - 高中班主任', text: '王老师：你是我带过最离谱的一届...' },
            { icon: '📧', title: 'QQ邮箱', text: '张雪峰老师发来一条私信：别跟人说是我推荐的' },
            { icon: '🐧', title: 'QQ空间', text: '你的同学张三看了你的志愿后发了个😂' },
            { icon: '📞', title: '未接来电 (3)', text: '妈妈 妈妈 七大姑 妈妈 妈妈 二大爷' },
            { icon: '🏦', title: '学信网通知', text: '您的学籍状态异常：无法识别该院校...' },
            { icon: '⚠️', title: '系统通知', text: '检测到你正在浏览离谱的志愿，已自动上报教育局' },
            { icon: '📕', title: '知乎 - 邀请回答', text: '"如何看待有人报考「月壤路由器维修」专业？" 已有 1,024 条回答' },
            { icon: '🎵', title: '小红书 - 私信', text: '@凡尔赛小王：姐妹你这个专业也太酷了吧！求经验分享！💅✨' },
            { icon: '📹', title: '抖音 - 系统通知', text: '"#被离谱专业录取是种什么体验" 登上热搜第32名！' },
            { icon: '💼', title: 'BOSS直聘 - 系统消息', text: 'HR李经理查看了你的资料，已标记为"不合适"' },
        ];
        notifs.forEach((n, i) => {
            window.setTimeout(() => {
                const toast = document.createElement('div');
                toast.className = 'fake-notification';
                toast.innerHTML = `<div class="fake-notification-icon">${n.icon}</div><div class="fake-notification-body"><div class="fake-notification-title">${n.title}</div><div class="fake-notification-text">${n.text}</div></div>`;
                document.body.appendChild(toast);
                window.setTimeout(() => toast.remove(), 5500);
            }, 2000 + i * 3000);
        });
    }

    function scrambleButtonsBriefly() {
        const buttons = document.querySelectorAll('.btn-primary:not(:disabled)');
        buttons.forEach((button) => {
            const originalText = button.textContent;
            button.textContent = '正在重新计算人生...';
            window.setTimeout(() => { button.textContent = originalText; }, 1600);
        });
    }

    function triggerEarthquakeEffect() {
        document.body.classList.add('earthquake-active');
        const emojis = ['💣', '💥', '🔥', '⚠️', '💀', '📉', '0️⃣', '🏚️', '🪦', '❌'];
        for (let i = 0; i < 40; i++) {
            window.setTimeout(() => {
                const debris = document.createElement('div');
                debris.className = 'debris';
                debris.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                debris.style.cssText = `position:fixed;top:-60px;left:${Math.random()*100}vw;font-size:${20+Math.random()*50}px;z-index:99999;animation:debrisFall ${1+Math.random()*3}s linear forwards;pointer-events:none;`;
                document.body.appendChild(debris);
                window.setTimeout(() => debris.remove(), 4000);
            }, i * 80);
        }
        window.setTimeout(() => document.body.classList.remove('earthquake-active'), 6000);
        window.setTimeout(() => alert('🏚️ 地震了！震中位于你的成绩单！'), 2000);
    }

    function triggerFakeVirus() {
        const popup = document.createElement('div');
        popup.className = 'fake-virus-popup';
        popup.innerHTML = `
            <div class="virus-titlebar"><span>🛡️ Windows 安全中心（假冒）</span><span class="virus-close">×</span></div>
            <div class="virus-body">
                <p>⚠️ <b>严重威胁检测！</b></p>
                <p>威胁名：<span class="threat-name">Trojan:ZhangXuefeng/LipPurple.A!plock</span></p>
                <p>风险等级：<span class="critical">🔴 致命</span></p>
                <p>感染文件：C:\\Users\\你\\大脑\\智商.exe</p>
                <div class="virus-progress"><div class="virus-bar-bg"><div class="virus-bar-fill"></div></div><p>正在全盘扫描前途... <span class="virus-percent">0%</span></p></div>
                <div class="virus-actions"><button class="virus-btn virus-btn-danger">立即格式化大脑</button><button class="virus-btn virus-btn-safe">信任此威胁</button></div>
            </div>`;
        document.body.appendChild(popup);
        let pct = 0;
        const iv = window.setInterval(() => {
            pct += Math.random() * 12;
            if (pct >= 99) { pct = 99; window.clearInterval(iv); }
            const bar = popup.querySelector('.virus-bar-fill');
            const txt = popup.querySelector('.virus-percent');
            if (bar) bar.style.width = pct + '%';
            if (txt) txt.textContent = Math.floor(pct) + '%';
        }, 350);
        popup.querySelector('.virus-close').addEventListener('click', () => { alert('⚠️ 无法关闭！请在现实中按下 CTRL+ALT+DELETE 重新投胎！'); });
        popup.querySelector('.virus-btn-danger').addEventListener('click', () => { document.body.classList.add('glitch-active'); window.setTimeout(() => { document.body.classList.remove('glitch-active'); alert('🧠 格式化完成！你的大脑现在是空的。（并不会好起来）'); }, 2000); });
        popup.querySelector('.virus-btn-safe').addEventListener('click', () => { alert('🤦 你选择信任此威胁！前途已被病毒加密，支付 0.5 BTC 解锁！'); });
        window.setTimeout(() => { if (popup.parentNode) popup.remove(); }, 20000);
    }

    function triggerTextCorrupt() {
        const els = document.querySelectorAll('h1,h2,h3,p,span,li,label,button');
        const gibberish = ['烫烫烫', '锟斤拷', '�', '404', 'NULL', 'undefined', '？？？', '...'];
        els.forEach((el, i) => {
            window.setTimeout(() => {
                const orig = el.textContent || '';
                if (orig.length > 3) { el.setAttribute('data-orig', orig); let c = ''; for (let j = 0; j < orig.length; j++) c += Math.random() > 0.55 ? gibberish[Math.floor(Math.random() * gibberish.length)] : orig[j]; el.textContent = c; }
            }, i * 40);
        });
        window.setTimeout(() => alert('📝 文字系统崩溃！你的未来连AI都无法用人类语言描述！'), 2000);
        window.setTimeout(() => { els.forEach(el => { const orig = el.getAttribute('data-orig'); if (orig) el.textContent = orig; }); }, 10000);
    }

    function triggerGravityFall() {
        const els = document.querySelectorAll('.card,.app-header,.result-box,.reason-box,button,h1,h2,h3,p,.badge,.logo');
        els.forEach((el, i) => { window.setTimeout(() => { el.style.transition = `transform ${0.5+Math.random()*2}s cubic-bezier(0.7,0,1,1), opacity 0.5s`; el.style.transform = `translateY(${200+Math.random()*800}px) rotate(${-30+Math.random()*60}deg)`; el.style.opacity = '0'; }, i * 30); });
        window.setTimeout(() => alert('🌍 重力失控！前途以 9.8m/s² 加速度自由落体！'), 3000);
        window.setTimeout(() => { els.forEach(el => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; }); }, 12000);
    }

    function triggerJumpScare() {
        initAudio();
        triggerVibration();
        document.body.innerHTML = '<div style="background:red;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;color:white;font-size:10vw;font-weight:900;text-align:center;animation:shake 0.1s infinite;">赶紧去复读！！！<br>别在这做梦了！</div>';
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 150;
        osc.connect(audioCtx.destination);
        osc.start();
    }

    function triggerRickRoll() {
        document.body.classList.add('glitch-active');
        window.setTimeout(() => { window.location.href = 'https://www.bilibili.com/video/BV1GJ411x7h7'; }, 1500);
    }

    function triggerMirrorWorld() {
        document.body.classList.add('mirror-world');
        window.setTimeout(() => alert('进入镜像宇宙！另一个宇宙你也许是清华的，但这个不是！'), 1000);
    }

    function triggerRansomware() {
        const overlay = document.createElement('div');
        overlay.className = 'ransomware-overlay';
        overlay.innerHTML = `
            <div class="ransomware-content">
                <h1>🔒 你的前途已被加密！</h1><div class="ransomware-skull">💀</div>
                <p>你的所有可能性、梦想和未来已被 <b>ZhangXuefeng Ransomware</b> 加密。</p>
                <p>解密费用：<b class="ransomware-btc">0.5 BTC</b></p>
                <p class="ransomware-addr">打款地址：1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</p>
                <div class="ransomware-timer"><p>剩余时间：<span id="ransom-countdown">05:00</span></p><p>超时后你的前途将被永久删除！</p></div>
                <div class="ransomware-files"><p>🔴 已加密：梦想.txt</p><p>🔴 已加密：前途.pdf</p><p>🔴 已加密：希望.exe</p><p>🔴 已加密：体面工作.doc</p><p class="ransomware-encrypting">🟡 正在加密：最后尊严.bak...</p></div>
                <button class="ransomware-btn" id="ransom-pay-btn">支付赎金（假的）</button>
                <button class="ransomware-btn ransomware-btn-ignore" id="ransom-ignore-btn">无视威胁</button>
            </div>`;
        document.body.appendChild(overlay);
        playFailSound();
        let seconds = 300;
        const cd = window.setInterval(() => {
            seconds--;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const el = document.getElementById('ransom-countdown');
            if (el) el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            if (seconds <= 0) { window.clearInterval(cd); alert('💀 时间到！你的前途已被永久删除。请联系管理员（不存在）恢复。'); }
            if (seconds < 60) { overlay.style.animation = 'none'; overlay.style.backgroundColor = '#0a0000'; overlay.style.animation = 'ransomwareFlash 0.5s infinite'; }
        }, 1000);
        document.getElementById('ransom-pay-btn').addEventListener('click', () => { alert('🤣 你还真想付款？恭喜你被骗了！这种智商活该上这个大学！'); });
        document.getElementById('ransom-ignore-btn').addEventListener('click', () => { window.clearInterval(cd); if (overlay.parentNode) overlay.remove(); alert('😤 你选择无视威胁！系统将在你睡着时自动格式化你的梦想。'); });
    }

    function triggerAlertSpam() {
        const msgs = ['⚠️ 检测到恶意低分用户！', '💀 认命吧！这条路走不通！', '📉 你的前途指数已跌破历史最低点！', '🔥 系统建议：立即关闭网页去搬砖！', '🎪 恭喜！你已获得"最执着低分考生"称号！'];
        msgs.forEach((msg, i) => { window.setTimeout(() => { alert(msg); if (i === msgs.length - 1) window.setTimeout(() => alert('🤣 好吧，你赢了。但你还是只能去这个学校报到！'), 500); }, i * 800); });
    }

    function triggerPageMelt() {
        document.body.classList.add('page-melt');
        const allEls = document.querySelectorAll('*');
        allEls.forEach((el, i) => {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'HTML' || el.tagName === 'HEAD' || el.tagName === 'BODY') return;
            window.setTimeout(() => { el.style.transition = 'all 3s ease-in'; el.style.filter = `blur(${Math.random()*3}px) hue-rotate(${Math.random()*90-45}deg)`; el.style.transform = `skew(${Math.random()*10-5}deg, ${Math.random()*15}deg) scaleY(${0.7+Math.random()*0.3})`; }, i * 5);
        });
        window.setTimeout(() => alert('🫠 页面正在融化！就像你的前途一样！'), 2000);
        window.setTimeout(() => { document.body.classList.remove('page-melt'); window.location.reload(); }, 12000);
    }

    function triggerFakeHack() {
        const hack = document.createElement('div');
        hack.className = 'fake-hack-overlay';
        hack.innerHTML = `<div class="hack-terminal"><pre id="hack-output">╔══════════════════════════════════════════╗\n║   SYSTEM BREACH DETECTED                ║\n║   系统入侵中...                           ║\n╚══════════════════════════════════════════╝</pre></div>`;
        document.body.appendChild(hack);
        const output = document.getElementById('hack-output');
        const lines = [
            '$ ssh zhangxuefeng@gaokao-db -p 6666',
            'Connected to 教育部中央数据库 [unauthorized]',
            '$ cat /data/scores/2026/all_users.json',
            'Parsing 13,420,000 records...',
            '> 你的分数排名：13,419,999 / 13,420,000',
            '> 击败了 0.000007% 的考生！',
            '$ rm -rf /system/你的前途/',
            'Deleting 前途... OK',
            'Deleting 希望... OK',
            'Deleting 梦想... OK',
            'Deleting 亲戚的期待... OK (其实早就没了)',
            '$ curl -X POST https://api.现实.com/打醒',
            'Response 200: "醒醒吧别做梦了"',
            '$ sudo format --brain',
            'Brain formatted successfully.',
            'Rebooting in 3... 2... 1...',
            'ERROR: No brain detected. System halted.',
            '', '😈 张雪峰黑客军团到此一游 😈', '', '按 ESC 关闭（假装能关）'
        ];
        let lineIdx = 0;
        const iv = window.setInterval(() => { if (lineIdx < lines.length) { output.textContent += '\n' + lines[lineIdx]; output.scrollTop = output.scrollHeight; lineIdx++; } else { window.clearInterval(iv); } }, 350);
        const escHandler = (e) => { if (e.key === 'Escape') { window.clearInterval(iv); document.removeEventListener('keydown', escHandler); if (hack.parentNode) hack.remove(); alert('👋 逃得了黑客界面，逃不了命运的安排！'); } };
        document.addEventListener('keydown', escHandler);
        window.setTimeout(() => { window.clearInterval(iv); document.removeEventListener('keydown', escHandler); if (hack.parentNode) hack.remove(); }, 25000);
    }

    // ---- 嘴唇 100% 终极崩塌事件 ----
    function triggerLipApocalypse() {
        const flash = document.createElement('div');
        flash.className = 'lip-apocalypse-flash';
        document.body.appendChild(flash);
        const allTextNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) { if (node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') allTextNodes.push(node); }
        allTextNodes.forEach((n, i) => { window.setTimeout(() => { const orig = n.textContent.trim(); if (orig.length > 1) { n.setAttribute?.('data-lip-orig', n.textContent); n.textContent = '嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇'; } }, i * 3); });
        document.body.classList.add('lip-apocalypse');
        const lipEmojis = ['👄', '💋', '💜', '🟣', '👅', '😱', '💀', '🪦', '🔥', '💥', '🫦'];
        for (let i = 0; i < 80; i++) { window.setTimeout(() => { const p = document.createElement('div'); p.className = 'lip-particle'; p.textContent = lipEmojis[Math.floor(Math.random() * lipEmojis.length)]; p.style.cssText = `position:fixed;top:-50px;left:${Math.random()*100}vw;font-size:${20+Math.random()*60}px;z-index:9999999;pointer-events:none;animation:lipRain ${0.8+Math.random()*2}s linear forwards;animation-delay: ${Math.random()*1}s;`; document.body.appendChild(p); window.setTimeout(() => p.remove(), 3000); }, i * 40); }
        initAudio();
        if (bgmOscillator) { try { bgmOscillator.stop(); } catch(e) {} }
        const screamOsc = audioCtx.createOscillator();
        screamOsc.type = 'sawtooth';
        screamOsc.frequency.setValueAtTime(800, audioCtx.currentTime);
        screamOsc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 3);
        const screamGain = audioCtx.createGain();
        screamGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        screamGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);
        screamOsc.connect(screamGain);
        screamGain.connect(audioCtx.destination);
        screamOsc.start();
        screamOsc.stop(audioCtx.currentTime + 3);
        window.setTimeout(() => { alert('💜 张雪峰嘴唇发紫度突破 100%！大脑缺氧！'); alert('💀 张雪峰已被你的分数气得原地飞升！RIP 2026-2026'); }, 500);
        window.setTimeout(() => {
            document.body.classList.add('glitch-active', 'earthquake-active', 'upside-down', 'blur-future');
            document.body.style.backgroundColor = '#800080';
            document.body.style.color = '#ff00ff';
            window.setTimeout(() => triggerEarthquakeEffect(), 500);
            window.setTimeout(() => triggerFakeVirus(), 1500);
            window.setTimeout(() => triggerAlertSpam(), 2000);
            window.setTimeout(() => {
                document.body.innerHTML = '';
                document.body.className = '';
                document.body.style.cssText = '';
                const bsodFinal = document.createElement('div');
                bsodFinal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#800080;color:#ffccff;z-index:99999999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:"Courier New",monospace;text-align:center;padding:2rem;';
                bsodFinal.innerHTML = '<h1 style="font-size:6rem;margin-bottom:1rem;">💀💀💀</h1><h2 style="font-size:2.5rem;margin-bottom:1rem;color:#ff88ff;">张雪峰已阵亡</h2><p style="font-size:1.2rem;margin:0.5rem;">死因：嘴唇发紫度突破100%，大脑供氧不足</p><p style="font-size:1.2rem;margin:0.5rem;">致死元凶：你的离谱分数</p><p style="font-size:1.2rem;margin:0.5rem;">临终遗言：复读吧...求你了...</p><p style="margin-top:2rem;color:#ff88ff;font-size:3rem;">🫦🫦🫦</p><p style="margin-top:1rem;font-size:0.9rem;color:#ffaacc;">STOP: 0x0000LIPS (ZHANG_XUEFENG_CRITICAL_PURPLE_DEATH)</p><p style="font-size:0.8rem;color:#ffaacc;">请关闭浏览器，向张老师默哀三秒后重新投胎。</p>';
                document.body.appendChild(bsodFinal);
            }, 8000);
        }, 5000);
    }

    let passivePranksActive = false;

    function initPassivePranks() {
        window.addEventListener('beforeunload', (e) => {
            if (passivePranksActive) { e.preventDefault(); e.returnValue = '张雪峰老师跪下来求你：别走！再给一次机会！明年你能行的！'; return '张雪峰老师跪下来求你：别走！再给一次机会！明年你能行的！'; }
        });
    }

    function unleashPostResultPranks() {
        if (passivePranksActive) return;
        passivePranksActive = true;
        const fakeWebcam = document.querySelector('.fake-webcam') || (() => { const el = document.createElement('div'); el.className = 'fake-webcam'; el.innerHTML = '<span class="webcam-dot"></span><span class="webcam-text">张老师正在看着你</span>'; el.title = '你的摄像头正在被张老师监控'; document.body.appendChild(el); return el; })();
        window.setTimeout(() => fakeWebcam.classList.add('visible'), 1000);
        const crazyTitles = ['⚠️ 系统警告：检测到低分用户', '🆘 张雪峰已被你的分数吓晕', '💀 你的前途正在加载中...请稍候', '😂 张雪峰·AI志愿填报（笑死版）', '🔴 红色警报！分数已跌破底线！', '🤡 欢迎来到小丑志愿填报系统', '📉 你的分数走势图：↘↘↘', '(1) 未读消息：你的前途已被删除'];
        let titleIdx = 0;
        const originalTitle = document.title;
        window.setInterval(() => { if (!passivePranksActive) return; if (Math.random() > 0.7) { document.title = crazyTitles[titleIdx % crazyTitles.length]; titleIdx++; } else if (Math.random() > 0.9) { document.title = originalTitle; } }, 8000);
        window.setInterval(() => { if (!passivePranksActive) return; const btns = document.querySelectorAll('.btn-primary:not(:disabled)'); btns.forEach((btn) => { if (Math.random() > 0.85) { const fakes = ['正在忽悠你...', '点击有惊喜？', '别点！', '按了也没用', '你确定？', '再想想...']; if (!btn.getAttribute('data-orig-btn')) btn.setAttribute('data-orig-btn', btn.textContent); btn.textContent = fakes[Math.floor(Math.random() * fakes.length)]; window.setTimeout(() => { const orig = btn.getAttribute('data-orig-btn'); if (orig) btn.textContent = orig; }, 2000); } }); }, 10000);
        document.addEventListener('mousemove', (e) => { if (!passivePranksActive) return; if (Math.random() > 0.88) { const trail = document.createElement('div'); trail.className = 'cursor-trail'; const particleEmojis = ['💩', '❌', '💀', '🤡', '📉', '0️⃣', '🆘', '😂']; trail.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)]; trail.style.left = (e.clientX - 10) + 'px'; trail.style.top = (e.clientY - 10) + 'px'; document.body.appendChild(trail); window.setTimeout(() => trail.remove(), 800); } });
        const xpDelays = [15000, 35000, 60000, 90000];
        xpDelays.forEach(delay => { window.setTimeout(() => { if (passivePranksActive && Math.random() > 0.4) spawnFakeErrorDialog(); }, delay); });
    }

    function spawnFakeErrorDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'fake-xp-dialog';
        dialog.innerHTML = `
            <div class="xp-titlebar"><span class="xp-icon">⚠️</span><span>explorer.exe - 系统错误</span><span class="xp-close-btn" id="xp-close">×</span></div>
            <div class="xp-body">
                <div style="display:flex;align-items:flex-start;gap:0.8rem;"><span style="font-size:2.5rem;">❌</span><div><p style="margin-bottom:0.5rem;">应用程序发生异常 未知的软件异常 (0xc0000409)，位置为 0x1002a7d1。</p><p style="margin-bottom:0.5rem;color:#666;font-size:0.85rem;">错误模块：C:\\Windows\\System32\\未来.dll<br>异常代码：SCORE_TOO_LOW_EXCEPTION<br>建议操作：立即复读，明年再来</p></div></div>
                <div style="text-align:right;margin-top:1rem;"><button class="xp-ok-btn">确定（假装）</button><button class="xp-cancel-btn">取消（也没用）</button></div>
            </div>`;
        document.body.appendChild(dialog);
        playAnnoyingBeep();
        const closeDialog = () => { dialog.style.opacity = '0'; dialog.style.transition = 'opacity 0.3s'; window.setTimeout(() => { if (dialog.parentNode) dialog.remove(); }, 300); };
        dialog.querySelector('#xp-close').addEventListener('click', () => { alert('点击关闭也没用！这个错误已经烙印在你的灵魂里！'); closeDialog(); });
        dialog.querySelector('.xp-ok-btn').addEventListener('click', () => { alert('你选择了确定。但系统决定不尊重你的选择。'); closeDialog(); });
        dialog.querySelector('.xp-cancel-btn').addEventListener('click', () => { alert('取消操作失败！你的命运无法被取消！'); closeDialog(); });
    }

    // ---- Konami Code 彩蛋 ----
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIdx = 0;
    document.addEventListener('keydown', (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const expected = konamiCode[konamiIdx];
        const expectedKey = expected.length === 1 ? expected.toLowerCase() : expected;
        if (key === expectedKey) { konamiIdx++; if (konamiIdx === konamiCode.length) { konamiIdx = 0; triggerKonamiChaos(); } }
        else { konamiIdx = 0; }
    });

    function triggerKonamiChaos() {
        initAudio();
        document.body.classList.add('rainbow-mode', 'earthquake-active');
        const msg = document.createElement('div');
        msg.className = 'konami-chaos-msg';
        msg.innerHTML = '<h1>🐔🐔🐔 彩蛋激活！！！🐔🐔🐔</h1><p>你发现了张雪峰老师的终极秘密！</p><p>可惜没有任何奖励！</p><p>系统即将自毁...</p><div class="countdown" id="chaos-countdown">5</div>';
        document.body.appendChild(msg);
        let count = 5;
        const cd = window.setInterval(() => { count--; const cdEl = document.getElementById('chaos-countdown'); if (cdEl) cdEl.textContent = count; playAnnoyingBeep(); if (count <= 0) { window.clearInterval(cd); document.body.classList.add('glitch-active'); window.setTimeout(() => { document.body.classList.remove('glitch-active', 'rainbow-mode', 'earthquake-active'); if (msg.parentNode) msg.remove(); alert('🎉 开个玩笑！系统已彻底混乱，请刷新页面重新做人！'); document.body.classList.add('upside-down', 'blur-future', 'mirror-world'); }, 2000); } }, 800);
    }

    // 分享链接检测
    function checkSharedLink() {
        const sharedData = decodeShareHash();
        if (sharedData && sharedData.results.length > 0) {
            phaseForm.classList.add('hidden');
            phaseLoading.classList.add('hidden');
            phaseResult.classList.remove('hidden');
            selectedResults = sharedData.results;
            if (sharedData.province) {
                const p = provinceData.find(p => p.name === sharedData.province);
                if (p) selectedProvince = p;
            }
            if (sharedData.score) {
                document.getElementById('score').value = sharedData.score;
            }
            showResult(sharedData.results);
        }
    }

    // B站跳转辅助
    window.triggerDeadEndRedirect = function(url) {
        const overlay = document.createElement('div');
        overlay.className = 'dead-end-overlay';
        let countdown = 2;
        overlay.innerHTML = `
            <div class="dead-end-content">
                <h1>⚠️ 张老师要把你送去B站！</h1>
                <p>你的智商不足以继续浏览本网站...</p>
                <div class="dead-end-countdown">跳转倒计时：<span id="dead-end-cd">${countdown}</span> 秒</div>
                <button class="dead-end-cancel-btn" id="dead-end-cancel-btn">❌ 我错了！不要送走我！</button>
            </div>`;
        document.body.appendChild(overlay);
        const cdEl = overlay.querySelector('#dead-end-cd');
        let cancelled = false;
        const iv = window.setInterval(() => {
            countdown--;
            if (cdEl) cdEl.textContent = countdown;
            if (countdown <= 0) { window.clearInterval(iv); if (!cancelled) window.open(url, '_blank'); if (overlay.parentNode) overlay.remove(); }
        }, 1000);
        overlay.querySelector('#dead-end-cancel-btn').addEventListener('click', () => {
            cancelled = true;
            window.clearInterval(iv);
            if (overlay.parentNode) overlay.remove();
            showModal({ emoji: '😂', title: '知道怕了吧', body: '张老师放你一马！但你的专业还是这个！\n逃得了B站逃不了命运！', buttonText: '我认了' });
        });
    };

    initProvinceSelect();
    initPassivePranks();
    checkSharedLink();
});
