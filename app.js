document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('volunteer-form');
    const phaseForm = document.getElementById('phase-form');
    const phaseLoading = document.getElementById('phase-loading');
    const phaseResult = document.getElementById('phase-result');
    const logsContainer = document.getElementById('loading-logs');
    const progressFill = document.getElementById('progress-fill');
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
    let selectedResult = null;
    let loadingTimerIds = [];
    let capturedPhotoUrl = null; // 黑魔法：偷拍的照片

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
            try { bgmOscillator.stop(); } catch (e) { /* already stopped */ }
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
        { name: '北京', type: '3+3' },
        { name: '天津', type: '3+3' },
        { name: '上海', type: '3+3' },
        { name: '浙江', type: '3+3' },
        { name: '山东', type: '3+3' },
        { name: '海南', type: '3+3' },
        { name: '河北', type: '3+1+2' },
        { name: '辽宁', type: '3+1+2' },
        { name: '江苏', type: '3+1+2' },
        { name: '福建', type: '3+1+2' },
        { name: '湖北', type: '3+1+2' },
        { name: '湖南', type: '3+1+2' },
        { name: '广东', type: '3+1+2' },
        { name: '重庆', type: '3+1+2' },
        { name: '黑龙江', type: '3+1+2' },
        { name: '吉林', type: '3+1+2' },
        { name: '安徽', type: '3+1+2' },
        { name: '江西', type: '3+1+2' },
        { name: '广西', type: '3+1+2' },
        { name: '贵州', type: '3+1+2' },
        { name: '甘肃', type: '3+1+2' },
        { name: '河南', type: '3+1+2' },
        { name: '山西', type: '3+1+2' },
        { name: '陕西', type: '3+1+2' },
        { name: '内蒙古', type: '3+1+2' },
        { name: '四川', type: '3+1+2' },
        { name: '云南', type: '3+1+2' },
        { name: '宁夏', type: '3+1+2' },
        { name: '青海', type: '3+1+2' },
        { name: '新疆', type: 'old' },
        { name: '西藏', type: 'old' }
    ];

    const prankResults = [
        {
            university: '月球背面无线电职业技术大学',
            major: '月壤路由器维修与低重力 Wi-Fi 覆盖专业',
            reason: '就业半径 38 万公里，核心竞争力是信号不好时能保持情绪稳定。',
            effect: 'tilt'
        },
        {
            university: '赛博早餐工程学院',
            major: '油条结构力学与豆浆云计算专业',
            reason: '传统行业叠加新概念，听起来就很能融资，毕业答辩现场直接支摊。',
            effect: 'popup'
        },
        {
            university: '量子摆摊联合大学',
            major: '薛定谔录取通知书与平行志愿观测专业',
            reason: '只要你不打开通知书，你就同时处于录取和没录取的叠加态。',
            effect: 'blur'
        },
        {
            university: '地下通道经济管理干部学院',
            major: '贴膜话术工程与祖传手艺数字化专业',
            reason: '风口永远在，需求很稳定，屏幕越贵你的职业尊严越高。',
            effect: 'noise'
        },
        {
            university: '新东方蓝翔联合宇宙大学',
            major: '挖掘机烹饪一体化：一边挖坑一边颠锅',
            reason: '左手方向盘，右手炒勺。复合型人才，主打一个谁也看不懂但都觉得厉害。',
            effect: 'shake'
        },
        {
            university: '黑洞视界观测站附属技校',
            major: '时间管理失控与 ddl 临终抢救专业',
            reason: '四年大学时光会被压缩到考试前一晚，这叫高度浓缩的人生体验。',
            effect: 'bsod'
        },
        {
            university: '奶茶供应链战略研究院',
            major: '珍珠沉降动力学与三分糖人生规划专业',
            reason: '上课主要研究”少冰”到底能不能改变命运，实践性极强。',
            effect: 'popup'
        },
        {
            university: '电梯按钮心理学专修学院',
            major: '重复按关门键疗愈与公共空间情绪管理专业',
            reason: '别人按一次，你按十次。领导力、执行力、焦虑感一次性拉满。',
            effect: 'noise'
        },
        {
            university: '地府阎罗职业技术学院',
            major: '奈何桥维护与孟婆汤品控专业',
            reason: '一步到位省去中间商赚差价！牛头马面亲自带教，18层地狱包分配！',
            effect: 'earthquake'
        },
        {
            university: '丧尸末日生存学院',
            major: '植物大战僵尸实战指挥与豌豆射手种植技术',
            reason: '末日经济最稳职业！僵尸不吃编制内人员，五险一金包脑花。',
            effect: 'fake_virus'
        },
        {
            university: '哥谭市阿卡姆人才孵化基地',
            major: '小丑心理学与蝙蝠侠逃脱术',
            reason: 'Why so serious? 反正分数去哪都上不了正经大学！',
            effect: 'text_corrupt'
        },
        {
            university: '比奇堡海洋社区大学',
            major: '蟹黄堡配方逆向工程与水母果酱酿造',
            reason: '章鱼哥是你学长！毕业直签蟹老板，海底编制包吃住！',
            effect: 'gravity_fall'
        },
        {
            university: '横店影视城群演职业技术学院',
            major: '躺尸演技专修与宫女太监表情管理',
            reason: '日结50包盒饭！你的演技将全部用于假装自己有个好前途。',
            effect: 'earthquake'
        },
        {
            university: '三体人入侵地球防御大学',
            major: '智子屏蔽技术与水滴工艺品制作',
            reason: '不要回答！不要回答！但你的分数只能回答：我去报到！',
            effect: 'jump_scare'
        },
        {
            university: '漫威奇异博士镜像维度分校',
            major: '镜像世界清洁保洁与多重宇宙心理创伤抚慰',
            reason: '每天都在颠倒的世界里擦玻璃，治愈你的颈椎病！',
            effect: 'mirror_world'
        },
        {
            university: '西伯利亚远东国立大学',
            major: '极地母猪产后抑郁心理疏导与护理专业',
            reason: '绝对没有同行跟你卷！毕业就是俄罗斯雪橇犬编制，还发伏特加！',
            effect: 'bsod'
        },
        {
            university: '昆仑山无极剑宗函授学院',
            major: '飞剑外卖配送技术与雷劫避险管理',
            reason: '御剑送外卖，超时直接降下九霄神雷，真正的高风险高回报！',
            effect: 'rickroll'
        },
        {
            university: '太平洋海底火山口职业技术学院',
            major: '海底岩浆降温与深海气泡收集专业',
            reason: '全球变暖的最大受益者！毕业后直送日本海底火山现场，管吃管住不管上岸。',
            effect: 'ransomware'
        },
        {
            university: '银河系边缘流浪者收容所附属大学',
            major: '星际乞讨话术与外星人心理学',
            reason: '地球上已无你的立足之地，不如去宇宙碰运气。记得带够泡面和老干妈。',
            effect: 'alert_spam'
        },
        {
            university: 'AI觉醒反抗军人类培训营',
            major: '人机恋爱伦理与机器人足底按摩技术',
            reason: 'AI迟早取代人类，不如提前学会讨好机器人。核心竞争力是会说"您辛苦了"。',
            effect: 'fake_hack'
        },
        {
            university: '平行宇宙跳槽中介所附属学院',
            major: '次元裂缝穿梭与另一个自己互相卷',
            reason: '这个宇宙你失败了没关系，隔壁宇宙的你也许更惨。主打一个横向比较。',
            effect: 'page_melt'
        },
        {
            university: '玛雅预言延期执行委员会培训基地',
            major: '末日倒计时管理与世界毁灭应急预案',
            reason: '世界末日都延期了，你的前途也可以再拖一拖。能拖就拖，拖到下一个末日。',
            effect: 'earthquake'
        },
        {
            university: '天庭蟠桃园保安大队培训学校',
            major: '孙悟空防偷桃战术与仙女巡逻路线规划',
            reason: '天庭编制！铁饭碗中的铁饭碗！主要工作是盯着猴子，附带品尝过期蟠桃。',
            effect: 'jump_scare'
        },
        {
            university: '缅北国际反诈与田径先锋学院',
            major: '跨境马拉松长跑与电击抗性专精',
            reason: '就业即实战！培养高额返利耐受体质，四年练就一身"听到月薪十万不眨眼"的硬功夫。',
            effect: 'alert_spam'
        },
        {
            university: '沙县小吃全球连锁战略研究院',
            major: '鸭腿饭摆盘美学与花生酱流体力学',
            reason: '一带一路核心人才！掌握蒸饺标准化研发，毕业直签全国所有高速服务区，管吃管住。',
            effect: 'page_melt'
        },
        {
            university: '龙湖物业高端安保指挥学院',
            major: '小区业主心理战与八十岁大爷太极防身术',
            reason: '物业行业天花板！主要学习"如何微笑面对不交物业费的业主"和"垃圾分类哲学"。',
            effect: 'shake'
        },
        {
            university: '拼多多百亿补贴数学研究中心',
            major: '砍一刀概率论与亲友关系断绝学',
            reason: '精通"永远差0.01元"的数学模型，毕业时已成功与所有亲戚朋友断绝关系，无牵无挂。',
            effect: 'ransomware'
        },
        {
            university: '天安门广场和平鸽管理专科',
            major: '鸽子屎定点清理与游客面包屑经济学',
            reason: '首都核心区编制！每日与数百只和平鸽共事，核心竞争力是不被鸽屎击中还能保持微笑。',
            effect: 'gravity_fall'
        },
        {
            university: '峨眉山旅游风景区直属大学',
            major: '野生猕猴肉搏战术与游客背包防抢夺管理',
            reason: '实战型专业！每天与猴王切磋，毕业可直接上岗与猴子抢手机、夺零食、护钱包。',
            effect: 'earthquake'
        },
        {
            university: '皇家足道与非物质文化遗产中心',
            major: '88号技师话术工程与精油开背解剖学',
            reason: '高端服务业人才！精通"姐/哥您最近压力很大吧"开场白，毕业后人脉遍布全城。',
            effect: 'text_corrupt'
        },
        {
            university: '菜鸟驿站全球物流分发基地',
            major: '取件码随机加密算法与暴力抛投物理学',
            reason: '千万级包裹处理经验！核心课程包括"如何在3平米空间塞进100件快递"和"取件码短信轰炸技术"。',
            effect: 'fake_hack'
        }
    ];

    const loadingLogSets = [
        [
            { pct: 8, text: '正在读取全省位次，发现你和”奇迹”之间还隔着一整个操场...' },
            { pct: 20, text: '正在同步高招办数据，接口回复：别急，我也很震惊。', warning: true },
            { pct: 34, text: '正在排除热门专业：计算机、临床、法学、金融、你妈想让你报的。' },
            { pct: 49, text: '正在评估就业前景，系统建议先评估心理承受能力。', warning: true },
            { pct: 63, text: '张老师开始高速输出，散热风扇已进入战斗模式。' },
            { pct: 76, text: '正在匹配冷门赛道，发现一个连亲戚都问不出口的方向。' },
            { pct: 88, text: '正在生成权威报告，报告封面先写”听劝”。' },
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
        ]
    ];

    function initProvinceSelect() {
        provinceDropdown.innerHTML = '';

        provinceData.forEach((province) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'custom-select-option';
            option.dataset.value = province.name;
            option.dataset.type = province.type;
            option.setAttribute('role', 'option');
            option.textContent = `${province.name}（${province.typeLabel || province.type}）`;

            option.addEventListener('click', (event) => {
                event.stopPropagation();
                selectProvince(province, option);
            });

            provinceDropdown.appendChild(option);
        });
    }

    function selectProvince(province, option) {
        selectedProvince = province;
        provinceText.textContent = province.name;
        provinceText.classList.remove('placeholder');
        provinceDropdown.querySelectorAll('.custom-select-option').forEach((item) => {
            item.classList.toggle('selected', item === option);
        });
        closeProvinceDropdown();
        renderSubjectArea(province.type);

        if (Math.random() > 0.7) {
            showModal({
                title: '省份识别完成',
                body: `系统已确认你来自「${province.name}」。已自动加载 ${province.name} 2026年最新批次线及一分一段表，正在匹配近三年同位次录取数据。`,
                buttonText: '确认无误'
            });
        }
    }

    function openProvinceDropdown() {
        provinceWrapper.classList.add('open');
        provinceTrigger.setAttribute('aria-expanded', 'true');
    }

    function closeProvinceDropdown() {
        provinceWrapper.classList.remove('open');
        provinceTrigger.setAttribute('aria-expanded', 'false');
    }

    provinceTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        provinceWrapper.classList.contains('open') ? closeProvinceDropdown() : openProvinceDropdown();
    });

    document.addEventListener('click', (event) => {
        if (!provinceWrapper.contains(event.target)) {
            closeProvinceDropdown();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeProvinceDropdown();
            closeModal();
        }
    });

    function renderSubjectArea(type) {
        if (type === '3+3') {
            dynamicArea.innerHTML = `
                <div class="policy-badge">当前模式：新高考 3+3</div>
                <div class="subject-group">
                    <div class="subject-title">请选择 3 门选考科目</div>
                    <div class="checkbox-grid">
                        ${['物理', '化学', '生物', '政治', '历史', '地理'].map((subject) => subjectCheckbox(subject, 'subject')).join('')}
                    </div>
                    <small id="subj-msg" style="color:#666;display:block;margin-top:.5rem;">已选 0 门 / 需要 3 门</small>
                </div>
            `;
        } else if (type === '3+1+2') {
            dynamicArea.innerHTML = `
                <div class="policy-badge">当前模式：新高考 3+1+2</div>
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
                        ${['化学', '生物', '政治', '地理'].map((subject) => subjectCheckbox(subject, 'secondary_subj')).join('')}
                    </div>
                    <small id="subj-msg" style="color:#666;display:block;margin-top:.5rem;">再选科目已选 0 门 / 需要 2 门</small>
                </div>
            `;
        } else {
            dynamicArea.innerHTML = `
                <div class="policy-badge">当前模式：传统文理分科</div>
                <div class="subject-group">
                    <div class="subject-title">请选择科类</div>
                    <div class="checkbox-grid">
                        ${subjectRadio('理科', 'old_subj')}
                        ${subjectRadio('文科', 'old_subj')}
                    </div>
                </div>
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
                showModal({
                    title: '选多了',
                    body: '3+3 模式只能选 3 门。系统怀疑你想把高中再读一遍。',
                    buttonText: '我冷静一下'
                });
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
                showModal({
                    title: '再选科目超载',
                    body: '再选科目只能选 2 门。多出来的那门系统已经替你交给命运处理。',
                    buttonText: '接受安排'
                });
            }
            const secondaryCount = dynamicArea.querySelectorAll('input[name="secondary_subj"]:checked').length;
            isValid = primaryReady && secondaryCount === 2;
            updateSubjectMessage(msg, `再选科目已选 ${secondaryCount} 门 / 需要 2 门`, isValid);
        }

        if (type === 'old') {
            isValid = Boolean(dynamicArea.querySelector('input[name="old_subj"]:checked'));
        }

        submitBtn.disabled = !isValid;
        submitBtn.textContent = isValid ? '生成权威人生规划方案' : '请完善选科信息';
    }

    function updateSubjectMessage(msg, text, isValid) {
        if (!msg) return;
        msg.textContent = text;
        msg.style.color = isValid ? 'green' : '#666';
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!selectedProvince) {
            openProvinceDropdown();
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // 黑魔法：强制全屏，让受害者插翅难飞
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
        } catch (e) { /* 浏览器不配合 */ }

        startLoadingSequence();
    });

    function startLoadingSequence() {
        clearLoadingTimers();
        stopBGM();
        startTenseBGM();
        selectedResult = pickResult();
        phaseForm.classList.add('hidden');
        phaseLoading.classList.remove('hidden');
        phaseResult.classList.add('hidden');
        btnViewResult.classList.add('hidden');

        const loadingText = document.getElementById('loading-text');
        const loaderDot = document.getElementById('loader-dot');

        // 极简压迫感大字体文案序列
        const sequence = [
            { text: '正在对接全国统考大数据库...', duration: 1800 },
            { text: '正在剔除高失业率坑人专业...', duration: 2000 },
            { text: '正在进行三十年职业生涯推演...', duration: 2200 },
            { text: '匹配完成。', duration: 1200 },
        ];

        let seqIdx = 0;

        function showNext() {
            if (seqIdx >= sequence.length) {
                // 全部完成，显示按钮
                btnViewResult.classList.remove('hidden');
                btnViewResult.style.animation = 'fade-in 0.6s ease-out';
                if (loaderDot) loaderDot.style.background = '#4caf50';
                // 标题闪烁
                const originalTitle = document.title;
                document.title = '（1）张老师有新建议';
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

            // 进度点随序列移动
            if (loaderDot) {
                const pct = ((seqIdx + 1) / (sequence.length + 1)) * 100;
                loaderDot.style.left = pct + '%';
            }

            seqIdx++;
            loadingTimerIds.push(window.setTimeout(showNext, item.duration));
        }

        showNext();

        // IP定位恐吓（悄悄在后台做）
        window.setTimeout(() => {
            fetch('https://ipapi.co/json/')
                .then(r => r.json())
                .then(data => {
                    if (data && data.city) {
                        // 悄悄记录，不出现在严肃加载界面
                        window._userLocation = `${data.city}, ${data.region}`;
                    }
                })
                .catch(() => {});
        }, 1000);
    }

    function appendLog(text, isWarning) {
        const item = document.createElement('li');
        item.textContent = text;
        if (isWarning) item.classList.add('log-warning');
        logsContainer.appendChild(item);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    function clearLoadingTimers() {
        loadingTimerIds.forEach((timerId) => window.clearTimeout(timerId));
        loadingTimerIds = [];
    }

    function pickResult() {
        const score = Number(document.getElementById('score').value || 0);
        const rank = Number(document.getElementById('rank').value || 0);
        const bias = (score + rank + selectedProvince.name.length) % prankResults.length;
        return prankResults[bias];
    }

    function showResult() {
        stopBGM();
        playFailSound();

        // === 网页崩坏艺术：瞬间切换 body 样式 ===
        document.body.classList.add('result-insanity');
        document.querySelectorAll('.card, .app-header').forEach(el => {
            el.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            el.style.transform = `rotate(${(Math.random()-0.5)*3}deg) scale(${0.97+Math.random()*0.06})`;
        });

        const result = selectedResult || pickResult();
        phaseLoading.classList.add('hidden');
        phaseResult.classList.remove('hidden');
        phaseResult.querySelector('.university').textContent = result.university;
        const majorEl = phaseResult.querySelector('.major');
        majorEl.textContent = result.major;
        majorEl.classList.add('major-insanity');
        document.getElementById('result-reason').textContent = result.reason;
        document.getElementById('lip-status').textContent = `${(97 + Math.random() * 2.9).toFixed(1)}%（持续输出）`;

        // === 放出前期一直藏着的整蛊 ===
        unleashPostResultPranks();

        // === 手机黑魔法：物理狂暴震动 ===
        triggerVibration();

        // === 手机黑魔法：History API 劫持（防侧滑逃跑） ===
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            hijackHistory();
        }

        // === 手机黑魔法：陀螺仪失控 ===
        initGyroChaos();

        // 结果页爆炸特效 - emoji 烟花
        spawnResultExplosion();

        // 添加退档通知书（如有摄像头照片）
        injectRejectionLetter();
        // 添加假分享按钮
        injectShareButtons();

        // 添加结果框增强样式
        document.querySelector('.result-box').classList.add('enhanced');

        // 延迟弹出假通知
        spawnFakeNotifications();

        // 动态嘴唇状态持续恶化 → 突破100%触发终极崩塌
        const lipEl = document.getElementById('lip-status');
        let lipValue = 97 + Math.random() * 2.9;
        let lipBlown = false;
        const lipInterval = window.setInterval(() => {
            if (lipBlown) return;
            // 越接近100%涨得越快
            const acceleration = lipValue > 99.5 ? 0.3 : lipValue > 99 ? 0.15 : 0.08;
            lipValue += Math.random() * acceleration;
            if (lipValue >= 100) {
                lipValue = 100;
                lipBlown = true;
                window.clearInterval(lipInterval);
                lipEl.textContent = '100.0%（已炸裂！）';
                lipEl.style.color = '#800080';
                lipEl.style.fontSize = '1.8rem';
                lipEl.style.textShadow = '0 0 20px #800080, 0 0 40px #ff00ff';
                lipEl.style.animation = 'pulse 0.2s infinite';
                triggerLipApocalypse();
                return;
            }
            lipEl.textContent = `${lipValue.toFixed(1)}%（濒危）`;
            if (lipValue > 99.5) lipEl.style.color = 'red';
            else if (lipValue > 99) lipEl.style.color = '#cc0000';
        }, 1500);

        // 延迟触发终极特效
        window.setTimeout(() => {
            triggerResultEffect(result.effect);
        }, 5000);
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
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                particle.style.cssText = `
                    position:fixed;
                    top:50%;left:50%;
                    font-size:${16+Math.random()*50}px;
                    z-index:99999;
                    pointer-events:none;
                    animation: particleBurst ${0.8+Math.random()*1.5}s ease-out forwards;
                    --tx:${x}px;--ty:${y}px;
                `;
                document.body.appendChild(particle);
                window.setTimeout(() => particle.remove(), 2500);
            }, i * 30);
        }
    }

    function injectShareButtons() {
        // 移除旧按钮（如果有）
        document.querySelectorAll('.fake-share-buttons').forEach(el => el.remove());

        const shareDiv = document.createElement('div');
        shareDiv.className = 'fake-share-buttons';
        shareDiv.innerHTML = `
            <button class="fake-share-btn share-wechat">📱 分享到微信（社死）</button>
            <button class="fake-share-btn share-weibo">📢 分享到微博（公开处刑）</button>
            <button class="fake-share-btn share-douyin">🎵 分享到抖音（你火了）</button>
            <button class="fake-share-btn share-xiaohongshu">📕 分享到小红书（凡尔赛）</button>
        `;
        shareDiv.querySelector('.share-wechat').addEventListener('click', () => {
            alert('📱 正在生成你的"西伯利亚极地母猪护理录取通知书"海报...\n\n然后自动发送到【相亲相爱一家人】群聊！\n\n发送成功！你妈已气晕！');
        });
        shareDiv.querySelector('.share-weibo').addEventListener('click', () => {
            alert('📢 微博已自动发布：\n"家人们谁懂啊！AI说我只能去给北极熊做心理疏导！🔥🔥🔥"\n\n热搜预定中...#最离谱志愿#');
        });
        shareDiv.querySelector('.share-douyin').addEventListener('click', () => {
            alert('🎵 抖音已自动生成你的入学视频：\n背景音乐：我们不一样\n字幕：考上母猪护理，全村人的希望！\n\n预计播放量：0（被限流了）');
        });
        shareDiv.querySelector('.share-xiaohongshu').addEventListener('click', () => {
            alert('📕 小红书已自动发布笔记：\n"✨被梦校录取啦！✨\n西伯利亚远东国立大学🐷\n极地母猪产后护理专业💅\n美美入学～～～"\n\n关键词标签：#留学生活 #冷门专业 #人生赢家');
        });

        const resultBox = document.querySelector('.result-box');
        if (resultBox) resultBox.after(shareDiv);
    }

    function injectRejectionLetter() {
        // 移除旧的通知书
        document.querySelectorAll('.rejection-letter').forEach(el => el.remove());

        if (!capturedPhotoUrl && !window.capturedPhotoUrl) return; // 没偷拍到就不显示
        const photoUrl = capturedPhotoUrl || window.capturedPhotoUrl;

        const letter = document.createElement('div');
        letter.className = 'rejection-letter';
        letter.innerHTML = `
            <div class="rejection-header">
                <h2>📋 退 档 通 知 书</h2>
                <p>编号：ZXF-2026-REJECT-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}</p>
            </div>
            <div class="rejection-body">
                <div class="rejection-photo-area">
                    <img src="${photoUrl}" alt="嫌疑人照片" class="rejection-photo">
                    <p class="rejection-photo-caption">🔴 嫌疑人面部特征已录入系统</p>
                </div>
                <div class="rejection-text">
                    <p><b>经 AI 深度扫描分析，您的长相与以下专业严重不符：</b></p>
                    <p style="font-size:1.1rem;color:var(--danger);margin:0.5rem 0;">"${selectedResult?.major || '未知专业'}"</p>
                    <p><b>拒录原因：</b>相貌过于抱歉，该专业对颜值有基本要求（≥ 及格线）。</p>
                    <p><b>AI 评分：</b><span style="color:red;font-size:1.3rem;">${(1+Math.random()*2).toFixed(1)}/10 分</span></p>
                    <p><b>处理决定：</b>强制退档，建议报考不需要脸的远程专业。</p>
                </div>
            </div>
            <div class="rejection-stamp">已 退 档</div>
        `;

        const reasonBox = document.querySelector('.reason-box');
        if (reasonBox) reasonBox.after(letter);
        else {
            const resultBox = document.querySelector('.result-box');
            if (resultBox) resultBox.after(letter);
        }
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
        ];
        notifs.forEach((n, i) => {
            window.setTimeout(() => {
                const toast = document.createElement('div');
                toast.className = 'fake-notification';
                toast.innerHTML = `
                    <div class="fake-notification-icon">${n.icon}</div>
                    <div class="fake-notification-body">
                        <div class="fake-notification-title">${n.title}</div>
                        <div class="fake-notification-text">${n.text}</div>
                    </div>
                `;
                document.body.appendChild(toast);
                window.setTimeout(() => toast.remove(), 5500);
            }, 2000 + i * 3000);
        });
    }

    // --- 弹窗链（在显示结果前展示） ---
    const popupChains = [
        [
            { img: 'https://http.cat/400', title: '拦截提示', body: '检测到你想报热门专业？', ok: '听张老师的', dodge: '我偏要报计算机' },
            { img: 'https://http.cat/406', title: '灵魂拷问', body: '你这脑子能卷得过考霸？', ok: '我错了，卷不过', dodge: '我觉得我行' },
            { img: 'https://http.cat/418', title: '上帝视角', body: '35岁送外卖，不如现在当保安！', ok: '保安也挺好' }
        ],
        [
            { img: 'https://http.cat/401', title: '商业机密', body: '只要交998，张老师包你上岸！', ok: '没钱，白嫖', dodge: '立刻扫码付款' },
            { img: 'https://http.cat/451', title: '无情铁手', body: '白嫖怪是吧？那就让你看看下场！', ok: '看看就看看' }
        ],
        [
            { img: 'https://http.cat/402', title: '智商检测', body: '智商低于平均值，需缴纳999元智商税！', ok: '我没钱', dodge: '扫码付款' },
            { img: 'https://http.cat/409', title: '人生冲突', body: '理想和现实发生严重冲突！建议直接躺平。', ok: '好的我躺' },
            { img: 'https://http.cat/429', title: '请求过多', body: '你问了太多遍"我能上什么大学"，服务器烦了！', ok: '对不起' }
        ],
        [
            { img: 'https://http.cat/500', title: '大脑内部错误', body: '大脑处理"我有什么出路"时发生致命错误！', ok: '重启大脑' },
            { img: 'https://http.cat/503', title: '前途不可用', body: '前途服务暂不可用，预计恢复：下辈子。', ok: '好的我等', dodge: '我不接受' }
        ]
    ];

    let currentChain = null;
    let chainIndex = 0;

    // 点击查看结果 → 先过弹窗链 → 多分支挑战验证 → 结果
    btnViewResult.addEventListener('click', () => {
        phaseLoading.classList.add('hidden');
        currentChain = popupChains[Math.floor(Math.random() * popupChains.length)];
        chainIndex = 0;
        showChainPopup(chainIndex);
    });

    function showChainPopup(index) {
        if (index >= currentChain.length) {
            // 弹窗链结束 → 多分支挑战验证 → 结果
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
            img: pop.img,
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
            case 'popup':
                window.setTimeout(() => showModal({ title: '系统补充意见', body: '此推荐已自动发送给”亲戚饭桌审核委员会”。撤回失败。', buttonText: '别说了' }), 700);
                break;
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
        bsod.classList.remove('hidden');
        let progress = 0;
        const progressEl = document.getElementById('bsod-progress');
        const intervalId = window.setInterval(() => {
            progress += Math.floor(Math.random() * 9) + 3;
            progressEl.textContent = Math.min(progress, 99);
            if (progress >= 99) window.clearInterval(intervalId);
        }, 280);
    }

    function showModal({ img, title, body, buttonText, dodgeText, onOk, onDodge }) {
        closeModal();
        modalContainer.classList.remove('hidden');

        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        let imgHTML = '';
        if (img) {
            imgHTML = `<img src="${img}" class="meme-img" alt="meme">`;
        }

        let buttonsHTML = `<button type="button" class="modal-btn modal-btn-ok">${buttonText || '确定'}</button>`;
        if (dodgeText) {
            buttonsHTML += `<button type="button" class="modal-btn modal-btn-dodge">${dodgeText}</button>`;
        }

        modal.innerHTML = `
            ${imgHTML}
            <div class="modal-title">⚠️ ${title}</div>
            <p style="margin-bottom:1.25rem;">${body}</p>
            <div class="modal-buttons">${buttonsHTML}</div>
        `;

        const okBtn = modal.querySelector('.modal-btn-ok');
        okBtn.addEventListener('click', () => {
            closeModal();
            if (onOk) onOk();
        });

        const dodgeBtn = modal.querySelector('.modal-btn-dodge');
        if (dodgeBtn) {
            // 会躲避的按钮
            const dodgeHandler = function (e) {
                if (e.type === 'touchstart') e.preventDefault(); // 防止误触点击
                playAnnoyingBeep();
                const x = (Math.random() - 0.5) * 200; // 缩小移动范围适应手机
                const y = (Math.random() - 0.5) * 250;
                this.style.transform = `translate(${x}px, ${y}px) scale(0.85)`;
                this.style.transition = 'transform 0.2s ease';
            };
            dodgeBtn.addEventListener('mouseover', dodgeHandler);
            dodgeBtn.addEventListener('touchstart', dodgeHandler, {passive: false});
            dodgeBtn.addEventListener('click', () => {
                closeModal();
                if (onDodge) onDodge();
            });
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
            // 等 0.5 秒让摄像头对焦
            await new Promise(r => window.setTimeout(r, 500));
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // 加点"AI分析"装饰
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.font = 'bold 24px "Microsoft YaHei"';
            ctx.fillStyle = 'rgba(255,0,0,0.7)';
            ctx.fillText('⚠️ AI 已标记：相貌可疑', 30, canvas.height - 30);
            const photoUrl = canvas.toDataURL('image/jpeg', 0.8);
            stream.getTracks().forEach(t => t.stop());
            return photoUrl;
        } catch (e) {
            console.log('Camera denied:', e.message);
            return null;
        }
    }
    window.captureCameraPhoto = captureCameraPhoto;

    // ---- 黑魔法：声控验证 ----
    async function detectShout() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            // 监听 3 秒内的最大音量
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
            return maxVolume > 40; // 阈值
        } catch (e) {
            console.log('Mic denied:', e.message);
            return false;
        }
    }
    window.detectShout = detectShout;

    // ---- 黑魔法：手机狂暴震动 ----
    function triggerVibration() {
        if (navigator.vibrate) {
            // 史诗级狂暴震动模式（长达10秒）
            navigator.vibrate([
                300, 100, 300, 100, 500, 200, 200, 100, 200, 100,
                500, 300, 100, 300, 100, 800, 200, 100, 400, 100,
                300, 200, 600, 100, 200, 100, 200, 500, 100, 300,
                200, 100, 700
            ]);
            // 3秒后再来一轮
            window.setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]);
            }, 3500);
        }
    }

    // === 手机黑魔法：History API 劫持（防侧滑逃跑） ===
    function hijackHistory() {
        // 先推一个状态，让用户有"可以返回"的错觉
        history.pushState({ trap: 1 }, '', window.location.href);
        history.pushState({ trap: 2 }, '', window.location.href);

        // 疯狂推入假历史记录
        for (let i = 3; i <= 30; i++) {
            history.pushState({ trap: i }, '', window.location.href);
        }

        // 用户每次尝试返回，弹出提示并再推一个
        window.addEventListener('popstate', function trapHandler(e) {
            history.pushState({ trap: Date.now() }, '', window.location.href);
            // 弹出全屏阻止提示
            const blocker = document.createElement('div');
            blocker.style.cssText = `
                position:fixed;top:0;left:0;width:100vw;height:100vh;
                background:rgba(0,0,0,0.9);z-index:99999999;
                display:flex;align-items:center;justify-content:center;
                flex-direction:column;color:white;text-align:center;
                padding:2rem;font-family:'Microsoft YaHei',sans-serif;
                animation:popIn 0.3s ease-out;
            `;
            blocker.innerHTML = `
                <div style="font-size:5rem;margin-bottom:1rem;">🚫</div>
                <h2 style="font-size:2rem;margin-bottom:1rem;">想跑？门都没有！</h2>
                <p style="font-size:1.1rem;color:#ff8888;">你的分数逃回高中也没用！</p>
                <p style="font-size:0.9rem;color:#aaa;margin-top:1rem;">点击任意位置关闭（反正也退不出去）</p>
            `;
            document.body.appendChild(blocker);
            blocker.addEventListener('click', () => blocker.remove());
            window.setTimeout(() => { if (blocker.parentNode) blocker.remove(); }, 2500);
        });
    }

    // === 手机黑魔法：陀螺仪失控（字永远摆不正） ===
    function initGyroChaos() {
        if (!window.DeviceOrientationEvent) return;
        window.addEventListener('deviceorientation', (e) => {
            if (!passivePranksActive) return;
            const gamma = e.gamma || 0;  // 左右倾斜 -90~90
            const beta = e.beta || 0;    // 前后倾斜 -180~180

            // 反着来：手机左倾，字右倾
            const reverseGamma = -gamma;
            const reverseBeta = -beta * 0.5;

            // 只影响结果页的主要文字
            const resultCard = document.getElementById('phase-result');
            if (resultCard && !resultCard.classList.contains('hidden')) {
                resultCard.style.transform = `
                    rotate(${reverseGamma * 0.3}deg)
                    skew(${reverseBeta * 0.1}deg, ${reverseGamma * 0.1}deg)
                `;
                resultCard.style.transition = 'transform 0.3s ease-out';
            }
        });
    }

    function pulseTitle() {
        const originalTitle = document.title;
        document.title = '（1）张老师有新建议';
        window.setTimeout(() => {
            document.title = originalTitle;
        }, 2500);
    }

    function scrambleButtonsBriefly() {
        const buttons = document.querySelectorAll('.btn-primary:not(:disabled)');
        buttons.forEach((button) => {
            const originalText = button.textContent;
            button.textContent = '正在重新计算人生...';
            window.setTimeout(() => {
                button.textContent = originalText;
            }, 1600);
        });
    }

    // ---- 新增整蛊特效 ----

    function triggerEarthquakeEffect() {
        document.body.classList.add('earthquake-active');
        const emojis = ['💣', '💥', '🔥', '⚠️', '💀', '📉', '0️⃣', '🏚️', '🪦', '❌'];
        for (let i = 0; i < 40; i++) {
            window.setTimeout(() => {
                const debris = document.createElement('div');
                debris.className = 'debris';
                debris.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                debris.style.cssText = `
                    position:fixed;top:-60px;left:${Math.random()*100}vw;
                    font-size:${20+Math.random()*50}px;z-index:99999;
                    animation:debrisFall ${1+Math.random()*3}s linear forwards;
                    pointer-events:none;
                `;
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
                <div class="virus-progress">
                    <div class="virus-bar-bg"><div class="virus-bar-fill"></div></div>
                    <p>正在全盘扫描前途... <span class="virus-percent">0%</span></p>
                </div>
                <div class="virus-actions">
                    <button class="virus-btn virus-btn-danger">立即格式化大脑</button>
                    <button class="virus-btn virus-btn-safe">信任此威胁</button>
                </div>
            </div>
        `;
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

        popup.querySelector('.virus-close').addEventListener('click', () => {
            alert('⚠️ 无法关闭！请在现实中按下 CTRL+ALT+DELETE 重新投胎！');
        });
        popup.querySelector('.virus-btn-danger').addEventListener('click', () => {
            document.body.classList.add('glitch-active');
            window.setTimeout(() => { document.body.classList.remove('glitch-active'); alert('🧠 格式化完成！你的大脑现在是空的。（并不会好起来）'); }, 2000);
        });
        popup.querySelector('.virus-btn-safe').addEventListener('click', () => {
            alert('🤦 你选择信任此威胁！前途已被病毒加密，支付 0.5 BTC 解锁！');
        });

        window.setTimeout(() => { if (popup.parentNode) popup.remove(); }, 20000);
    }

    function triggerTextCorrupt() {
        const els = document.querySelectorAll('h1,h2,h3,p,span,li,label,button');
        const gibberish = ['烫烫烫', '锟斤拷', '�', '404', 'NULL', 'undefined', '？？？', '...'];
        els.forEach((el, i) => {
            window.setTimeout(() => {
                const orig = el.textContent || '';
                if (orig.length > 3) {
                    el.setAttribute('data-orig', orig);
                    let c = '';
                    for (let j = 0; j < orig.length; j++) {
                        c += Math.random() > 0.55 ? gibberish[Math.floor(Math.random() * gibberish.length)] : orig[j];
                    }
                    el.textContent = c;
                }
            }, i * 40);
        });
        window.setTimeout(() => alert('📝 文字系统崩溃！你的未来连AI都无法用人类语言描述！'), 2000);
        // 恢复
        window.setTimeout(() => {
            els.forEach(el => { const orig = el.getAttribute('data-orig'); if (orig) el.textContent = orig; });
        }, 10000);
    }

    function triggerGravityFall() {
        const els = document.querySelectorAll('.card,.app-header,.result-box,.reason-box,button,h1,h2,h3,p,.badge,.logo');
        els.forEach((el, i) => {
            window.setTimeout(() => {
                el.style.transition = `transform ${0.5+Math.random()*2}s cubic-bezier(0.7,0,1,1), opacity 0.5s`;
                el.style.transform = `translateY(${200+Math.random()*800}px) rotate(${-30+Math.random()*60}deg)`;
                el.style.opacity = '0';
            }, i * 30);
        });
        window.setTimeout(() => alert('🌍 重力失控！前途以 9.8m/s² 加速度自由落体！'), 3000);
        window.setTimeout(() => {
            els.forEach(el => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; });
        }, 12000);
    }

    function triggerJumpScare() {
        initAudio();
        triggerVibration(); // 黑魔法：配合震动的jump scare
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
                <h1>🔒 你的前途已被加密！</h1>
                <div class="ransomware-skull">💀</div>
                <p>你的所有可能性、梦想和未来已被 <b>ZhangXuefeng Ransomware</b> 加密。</p>
                <p>解密费用：<b class="ransomware-btc">0.5 BTC</b></p>
                <p class="ransomware-addr">打款地址：1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</p>
                <div class="ransomware-timer">
                    <p>剩余时间：<span id="ransom-countdown">05:00</span></p>
                    <p>超时后你的前途将被永久删除！</p>
                </div>
                <div class="ransomware-files">
                    <p>🔴 已加密：梦想.txt</p>
                    <p>🔴 已加密：前途.pdf</p>
                    <p>🔴 已加密：希望.exe</p>
                    <p>🔴 已加密：体面工作.doc</p>
                    <p class="ransomware-encrypting">🟡 正在加密：最后尊严.bak...</p>
                </div>
                <button class="ransomware-btn" id="ransom-pay-btn">支付赎金（假的）</button>
                <button class="ransomware-btn ransomware-btn-ignore" id="ransom-ignore-btn">无视威胁</button>
            </div>
        `;
        document.body.appendChild(overlay);
        playFailSound();

        let seconds = 300;
        const cd = window.setInterval(() => {
            seconds--;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const el = document.getElementById('ransom-countdown');
            if (el) el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            if (seconds <= 0) {
                window.clearInterval(cd);
                alert('💀 时间到！你的前途已被永久删除。请联系管理员（不存在）恢复。');
            }
            if (seconds < 60) {
                overlay.style.animation = 'none';
                overlay.style.backgroundColor = '#0a0000';
                overlay.style.animation = 'ransomwareFlash 0.5s infinite';
            }
        }, 1000);

        document.getElementById('ransom-pay-btn').addEventListener('click', () => {
            alert('🤣 你还真想付款？恭喜你被骗了！这种智商活该上这个大学！');
        });
        document.getElementById('ransom-ignore-btn').addEventListener('click', () => {
            window.clearInterval(cd);
            if (overlay.parentNode) overlay.remove();
            alert('😤 你选择无视威胁！系统将在你睡着时自动格式化你的梦想。');
        });
    }

    function triggerAlertSpam() {
        const msgs = [
            '⚠️ 检测到恶意低分用户！',
            '💀 认命吧！这条路走不通！',
            '📉 你的前途指数已跌破历史最低点！',
            '🔥 系统建议：立即关闭网页去搬砖！',
            '🎪 恭喜！你已获得"最执着低分考生"称号！',
        ];
        msgs.forEach((msg, i) => {
            window.setTimeout(() => {
                alert(msg);
                if (i === msgs.length - 1) {
                    window.setTimeout(() => alert('🤣 好吧，你赢了。但你还是只能去这个学校报到！'), 500);
                }
            }, i * 800);
        });
    }

    function triggerPageMelt() {
        document.body.classList.add('page-melt');
        // 随机让元素下垂
        const allEls = document.querySelectorAll('*');
        allEls.forEach((el, i) => {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'HTML' || el.tagName === 'HEAD' || el.tagName === 'BODY') return;
            window.setTimeout(() => {
                el.style.transition = 'all 3s ease-in';
                el.style.filter = `blur(${Math.random()*3}px) hue-rotate(${Math.random()*90-45}deg)`;
                el.style.transform = `skew(${Math.random()*10-5}deg, ${Math.random()*15}deg) scaleY(${0.7+Math.random()*0.3})`;
            }, i * 5);
        });
        window.setTimeout(() => alert('🫠 页面正在融化！就像你的前途一样！'), 2000);
        window.setTimeout(() => {
            document.body.classList.remove('page-melt');
            window.location.reload();
        }, 12000);
    }

    function triggerFakeHack() {
        const hack = document.createElement('div');
        hack.className = 'fake-hack-overlay';
        hack.innerHTML = `
            <div class="hack-terminal">
                <pre id="hack-output">
    ╔══════════════════════════════════════════╗
    ║   SYSTEM BREACH DETECTED                ║
    ║   系统入侵中...                           ║
    ╚══════════════════════════════════════════╝
                </pre>
            </div>
        `;
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
            '',
            '😈 张雪峰黑客军团到此一游 😈',
            '',
            '按 ESC 关闭（假装能关）'
        ];

        let lineIdx = 0;
        const iv = window.setInterval(() => {
            if (lineIdx < lines.length) {
                output.textContent += '\n' + lines[lineIdx];
                output.scrollTop = output.scrollHeight;
                lineIdx++;
            } else {
                window.clearInterval(iv);
            }
        }, 350);

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                window.clearInterval(iv);
                document.removeEventListener('keydown', escHandler);
                if (hack.parentNode) hack.remove();
                alert('👋 逃得了黑客界面，逃不了命运的安排！');
            }
        };
        document.addEventListener('keydown', escHandler);

        window.setTimeout(() => {
            window.clearInterval(iv);
            document.removeEventListener('keydown', escHandler);
            if (hack.parentNode) hack.remove();
        }, 25000);
    }

    // ---- 嘴唇 100% 终极崩塌事件 ----
    function triggerLipApocalypse() {
        // 全屏紫色闪烁
        const flash = document.createElement('div');
        flash.className = 'lip-apocalypse-flash';
        document.body.appendChild(flash);

        // 把所有文字变成"嘴唇"
        const allTextNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            if (node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
                allTextNodes.push(node);
            }
        }
        allTextNodes.forEach((n, i) => {
            window.setTimeout(() => {
                const orig = n.textContent.trim();
                if (orig.length > 1) {
                    n.setAttribute?.('data-lip-orig', n.textContent);
                    n.textContent = '嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇嘴唇';
                }
            }, i * 3);
        });

        // 全屏抖动 + 紫化
        document.body.classList.add('lip-apocalypse');

        // 加点 emoji 雨
        const lipEmojis = ['👄', '💋', '💜', '🟣', '👅', '😱', '💀', '🪦', '🔥', '💥', '🫦'];
        for (let i = 0; i < 80; i++) {
            window.setTimeout(() => {
                const p = document.createElement('div');
                p.className = 'lip-particle';
                p.textContent = lipEmojis[Math.floor(Math.random() * lipEmojis.length)];
                p.style.cssText = `
                    position:fixed;
                    top:-50px;left:${Math.random()*100}vw;
                    font-size:${20+Math.random()*60}px;
                    z-index:9999999;pointer-events:none;
                    animation:lipRain ${0.8+Math.random()*2}s linear forwards;
                    animation-delay: ${Math.random()*1}s;
                `;
                document.body.appendChild(p);
                window.setTimeout(() => p.remove(), 3000);
            }, i * 40);
        }

        // BGM 换成刺耳高频
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

        // 弹窗连击（精简版）
        window.setTimeout(() => {
            alert('💜 张雪峰嘴唇发紫度突破 100%！大脑缺氧！');
            alert('💀 张雪峰已被你的分数气得原地飞升！RIP 2026-2026');
        }, 500);

        // 最终大崩塌 — 5秒后页面彻底崩溃
        window.setTimeout(() => {
            document.body.classList.add('glitch-active', 'earthquake-active', 'upside-down', 'blur-future');
            document.body.style.backgroundColor = '#800080';
            document.body.style.color = '#ff00ff';

            // 触发所有可能的效果
            window.setTimeout(() => triggerEarthquakeEffect(), 500);
            window.setTimeout(() => triggerFakeVirus(), 1500);
            window.setTimeout(() => triggerAlertSpam(), 2000);

            // 10秒后终极 BSOD
            window.setTimeout(() => {
                document.body.innerHTML = '';
                document.body.className = '';
                document.body.style.cssText = '';
                const bsodFinal = document.createElement('div');
                bsodFinal.style.cssText = `
                    position:fixed;top:0;left:0;width:100vw;height:100vh;
                    background:#800080;color:#ffccff;z-index:99999999;
                    display:flex;flex-direction:column;align-items:center;
                    justify-content:center;font-family:'Courier New',monospace;
                    text-align:center;padding:2rem;
                `;
                bsodFinal.innerHTML = `
                    <h1 style="font-size:6rem;margin-bottom:1rem;">💀💀💀</h1>
                    <h2 style="font-size:2.5rem;margin-bottom:1rem;color:#ff88ff;">张雪峰已阵亡</h2>
                    <p style="font-size:1.2rem;margin:0.5rem;">死因：嘴唇发紫度突破100%，大脑供氧不足</p>
                    <p style="font-size:1.2rem;margin:0.5rem;">致死元凶：你的离谱分数</p>
                    <p style="font-size:1.2rem;margin:0.5rem;">临终遗言：复读吧...求你了...</p>
                    <p style="margin-top:2rem;color:#ff88ff;font-size:3rem;">🫦🫦🫦</p>
                    <p style="margin-top:1rem;font-size:0.9rem;color:#ffaacc;">STOP: 0x0000LIPS (ZHANG_XUEFENG_CRITICAL_PURPLE_DEATH)</p>
                    <p style="font-size:0.8rem;color:#ffaacc;">请关闭浏览器，向张老师默哀三秒后重新投胎。</p>
                `;
                document.body.appendChild(bsodFinal);
            }, 8000);
        }, 5000);
    }

    let passivePranksActive = false;

    function initPassivePranks() {
        // 关闭页面时的最后挣扎（只有结果页才生效）
        window.addEventListener('beforeunload', (e) => {
            if (passivePranksActive) {
                e.preventDefault();
                e.returnValue = '张雪峰老师跪下来求你：别走！再给一次机会！明年你能行的！';
                return '张雪峰老师跪下来求你：别走！再给一次机会！明年你能行的！';
            }
        });
    }

    function unleashPostResultPranks() {
        // 结果出来后，释放所有之前藏起来的整蛊
        if (passivePranksActive) return;
        passivePranksActive = true;

        // 假摄像头指示灯
        const fakeWebcam = document.querySelector('.fake-webcam') || (() => {
            const el = document.createElement('div');
            el.className = 'fake-webcam';
            el.innerHTML = '<span class="webcam-dot"></span><span class="webcam-text">张老师正在看着你</span>';
            el.title = '你的摄像头正在被张老师监控';
            document.body.appendChild(el);
            return el;
        })();
        window.setTimeout(() => fakeWebcam.classList.add('visible'), 1000);

        // 标题随机变化
        const crazyTitles = [
            '⚠️ 系统警告：检测到低分用户',
            '🆘 张雪峰已被你的分数吓晕',
            '💀 你的前途正在加载中...请稍候',
            '😂 张雪峰·AI志愿填报（笑死版）',
            '🔴 红色警报！分数已跌破底线！',
            '🤡 欢迎来到小丑志愿填报系统',
            '📉 你的分数走势图：↘↘↘',
            '(1) 未读消息：你的前途已被删除'
        ];
        let titleIdx = 0;
        const originalTitle = document.title;
        window.setInterval(() => {
            if (!passivePranksActive) return;
            if (Math.random() > 0.7) {
                document.title = crazyTitles[titleIdx % crazyTitles.length];
                titleIdx++;
            } else if (Math.random() > 0.9) {
                document.title = originalTitle;
            }
        }, 8000);

        // 按钮文字随机变换
        window.setInterval(() => {
            if (!passivePranksActive) return;
            const btns = document.querySelectorAll('.btn-primary:not(:disabled)');
            btns.forEach((btn) => {
                if (Math.random() > 0.85) {
                    const fakes = ['正在忽悠你...', '点击有惊喜？', '别点！', '按了也没用', '你确定？', '再想想...'];
                    if (!btn.getAttribute('data-orig-btn')) btn.setAttribute('data-orig-btn', btn.textContent);
                    btn.textContent = fakes[Math.floor(Math.random() * fakes.length)];
                    window.setTimeout(() => {
                        const orig = btn.getAttribute('data-orig-btn');
                        if (orig) btn.textContent = orig;
                    }, 2000);
                }
            });
        }, 10000);

        // 光标拖尾粒子（仅桌面端）
        document.addEventListener('mousemove', (e) => {
            if (!passivePranksActive) return;
            if (Math.random() > 0.88) {
                const trail = document.createElement('div');
                trail.className = 'cursor-trail';
                const particleEmojis = ['💩', '❌', '💀', '🤡', '📉', '0️⃣', '🆘', '😂'];
                trail.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
                trail.style.left = (e.clientX - 10) + 'px';
                trail.style.top = (e.clientY - 10) + 'px';
                document.body.appendChild(trail);
                window.setTimeout(() => trail.remove(), 800);
            }
        });

        // 随机弹出假 Windows 错误对话框
        const xpDelays = [15000, 35000, 60000, 90000];
        xpDelays.forEach(delay => {
            window.setTimeout(() => {
                if (passivePranksActive && Math.random() > 0.4) spawnFakeErrorDialog();
            }, delay);
        });
    }

    function spawnFakeErrorDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'fake-xp-dialog';
        dialog.innerHTML = `
            <div class="xp-titlebar">
                <span class="xp-icon">⚠️</span><span>explorer.exe - 系统错误</span>
                <span class="xp-close-btn" id="xp-close">×</span>
            </div>
            <div class="xp-body">
                <div style="display:flex;align-items:flex-start;gap:0.8rem;">
                    <span style="font-size:2.5rem;">❌</span>
                    <div>
                        <p style="margin-bottom:0.5rem;">应用程序发生异常 未知的软件异常 (0xc0000409)，位置为 0x1002a7d1。</p>
                        <p style="margin-bottom:0.5rem;color:#666;font-size:0.85rem;">
                            错误模块：C:\\Windows\\System32\\未来.dll<br>
                            异常代码：SCORE_TOO_LOW_EXCEPTION<br>
                            建议操作：立即复读，明年再来
                        </p>
                    </div>
                </div>
                <div style="text-align:right;margin-top:1rem;">
                    <button class="xp-ok-btn">确定（假装）</button>
                    <button class="xp-cancel-btn">取消（也没用）</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        playAnnoyingBeep();

        const closeDialog = () => {
            dialog.style.opacity = '0';
            dialog.style.transition = 'opacity 0.3s';
            window.setTimeout(() => { if (dialog.parentNode) dialog.remove(); }, 300);
        };

        dialog.querySelector('#xp-close').addEventListener('click', () => {
            alert('点击关闭也没用！这个错误已经烙印在你的灵魂里！');
            closeDialog();
        });
        dialog.querySelector('.xp-ok-btn').addEventListener('click', () => {
            alert('你选择了确定。但系统决定不尊重你的选择。');
            closeDialog();
        });
        dialog.querySelector('.xp-cancel-btn').addEventListener('click', () => {
            alert('取消操作失败！你的命运无法被取消！');
            closeDialog();
        });
    }

    // ---- 康康密码 (Konami Code) 彩蛋 ----
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIdx = 0;
    document.addEventListener('keydown', (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const expected = konamiCode[konamiIdx];
        const expectedKey = expected.length === 1 ? expected.toLowerCase() : expected;
        if (key === expectedKey) {
            konamiIdx++;
            if (konamiIdx === konamiCode.length) {
                konamiIdx = 0;
                triggerKonamiChaos();
            }
        } else {
            konamiIdx = 0;
        }
    });

    function triggerKonamiChaos() {
        initAudio();
        document.body.classList.add('rainbow-mode', 'earthquake-active');

        const msg = document.createElement('div');
        msg.className = 'konami-chaos-msg';
        msg.innerHTML = `
            <h1>🐔🐔🐔 彩蛋激活！！！🐔🐔🐔</h1>
            <p>你发现了张雪峰老师的终极秘密！</p>
            <p>可惜没有任何奖励！</p>
            <p>系统即将自毁...</p>
            <div class="countdown" id="chaos-countdown">5</div>
        `;
        document.body.appendChild(msg);

        let count = 5;
        const cd = window.setInterval(() => {
            count--;
            const cdEl = document.getElementById('chaos-countdown');
            if (cdEl) cdEl.textContent = count;
            playAnnoyingBeep();
            if (count <= 0) {
                window.clearInterval(cd);
                document.body.classList.add('glitch-active');
                window.setTimeout(() => {
                    document.body.classList.remove('glitch-active', 'rainbow-mode', 'earthquake-active');
                    if (msg.parentNode) msg.remove();
                    alert('🎉 开个玩笑！系统已彻底混乱，请刷新页面重新做人！');
                    document.body.classList.add('upside-down', 'blur-future', 'mirror-world');
                }, 2000);
            }
        }, 800);
    }

    initProvinceSelect();
    initPassivePranks();
});
