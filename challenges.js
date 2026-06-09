// ============================================================
// 张雪峰整蛊系统 — 多分支验证挑战引擎
// 20种离谱挑战，每次随机组合，永远可跳过
// ============================================================

const BILIBILI_POOL = [
    'https://www.bilibili.com/video/BV1GJ411x7h7',   // Rick Roll 经典
    'https://search.bilibili.com/all?keyword=张雪峰+搞笑',
    'https://search.bilibili.com/all?keyword=高考+鬼畜',
    'https://search.bilibili.com/all?keyword=张雪峰+名场面',
    'https://www.bilibili.com/video/BV1uT4y1P7CX',
    'https://search.bilibili.com/all?keyword=千万不要报+专业',
    'https://search.bilibili.com/all?keyword=大学生+后悔+专业',
    'https://search.bilibili.com/all?keyword=张雪峰+怼人',
];

function randomBilibiliUrl() {
    return BILIBILI_POOL[Math.floor(Math.random() * BILIBILI_POOL.length)];
}

// ---- 挑战引擎 ----
const ChallengeManager = {
    registry: [],

    register(challenge) {
        this.registry.push(challenge);
    },

    // 选择 1~3 个挑战
    selectChallenges() {
        const roll = Math.random();
        const count = roll < 0.4 ? 1 : (roll < 0.75 ? 2 : 3);

        // 分类
        const interactive = this.registry.filter(c => c.category === 'interactive');
        const passive = this.registry.filter(c => c.category === 'passive');
        const bluff = this.registry.filter(c => c.category === 'bluff');

        const selected = [];
        const usedCategories = new Set();

        for (let i = 0; i < count; i++) {
            // 权重：互动型60%，被动型25%，诈唬型15%
            const r = Math.random();
            let pool;
            if (r < 0.6) {
                pool = interactive;
            } else if (r < 0.85) {
                pool = passive;
            } else {
                pool = bluff;
            }

            // 去重：避免同类挑战重复
            const available = pool.filter(c => !selected.includes(c));
            if (available.length === 0) {
                // fallback: 从全部未选中中选
                const allAvailable = this.registry.filter(c => !selected.includes(c));
                if (allAvailable.length === 0) break;
                selected.push(allAvailable[Math.floor(Math.random() * allAvailable.length)]);
            } else {
                selected.push(available[Math.floor(Math.random() * available.length)]);
            }
        }

        // 保证至少1个互动型
        if (!selected.some(c => c.category === 'interactive') && interactive.length > 0) {
            const nonInteractiveIdx = selected.findIndex(c => c.category !== 'interactive');
            if (nonInteractiveIdx >= 0) {
                const avail = interactive.filter(c => !selected.includes(c));
                if (avail.length > 0) {
                    selected[nonInteractiveIdx] = avail[Math.floor(Math.random() * avail.length)];
                }
            }
        }

        return selected;
    },

    // 创建挑战容器
    createContainer(challenge, index, total) {
        // 移除旧容器
        const old = document.querySelector('.challenge-container');
        if (old) old.remove();

        const container = document.createElement('div');
        container.className = 'challenge-container';

        let progressHTML = '';
        if (total > 1) {
            let squares = '';
            for (let i = 0; i < total; i++) {
                squares += `<span class="challenge-dot ${i <= index ? 'done' : ''}">${i < index ? '✓' : (i === index ? '●' : '○')}</span>`;
            }
            progressHTML = `<div class="challenge-progress">${squares} <span class="challenge-progress-text">${index + 1}/${total}</span></div>`;
        }

        container.innerHTML = `
            <div class="challenge-backdrop"></div>
            <div class="challenge-modal">
                <div class="challenge-header">
                    <span class="challenge-icon">${challenge.icon}</span>
                    <span class="challenge-name">${challenge.name}</span>
                </div>
                ${progressHTML}
                <p class="challenge-desc">${challenge.description}</p>
                <div class="challenge-body" id="challenge-body"></div>
                <div class="challenge-footer">
                    <button class="challenge-skip-btn" id="challenge-skip">😤 我拒绝，跳过</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // 跳过按钮——会躲避
        const skipBtn = container.querySelector('#challenge-skip');
        const dodgeSkipBtn = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            if (window.playAnnoyingBeep) window.playAnnoyingBeep();
            const x = (Math.random() - 0.5) * 300;
            const y = (Math.random() - 0.5) * 200;
            skipBtn.style.transform = `translate(${x}px, ${y}px) scale(0.85)`;
            skipBtn.style.transition = 'transform 0.2s ease';
        };
        skipBtn.addEventListener('mouseover', dodgeSkipBtn);
        skipBtn.addEventListener('touchstart', dodgeSkipBtn, { passive: false });

        return container;
    },

    // 执行单个挑战
    async executeChallenge(challenge, index, total) {
        const container = this.createContainer(challenge, index, total);
        const body = container.querySelector('#challenge-body');
        const skipBtn = container.querySelector('#challenge-skip');

        return new Promise((resolve) => {
            let resolved = false;

            const finish = (result) => {
                if (resolved) return;
                resolved = true;
                // 清理
                if (challenge.cleanup) challenge.cleanup();
                container.querySelector('.challenge-backdrop').style.opacity = '0';
                container.querySelector('.challenge-modal').style.opacity = '0';
                container.querySelector('.challenge-modal').style.transform = 'scale(0.8)';
                container.querySelector('.challenge-modal').style.transition = 'all 0.3s ease-in';
                setTimeout(() => container.remove(), 350);
                resolve(result);
            };

            skipBtn.addEventListener('click', () => {
                window.alert(challenge.skipPenalty || '你选择逃避！但系统已经记住你了。');
                finish('skip');
            });

            // 安全超时：60秒后自动跳过
            const safetyTimer = setTimeout(() => finish('skip'), 60000);

            // 执行挑战逻辑
            try {
                challenge.execute(body, finish, container);
            } catch (e) {
                console.error('Challenge error:', challenge.id, e);
                finish('skip');
            }
        });
    },

    // 入口：执行挑战序列
    async startVerification() {
        const challenges = this.selectChallenges();
        console.log('🎯 选中挑战:', challenges.map(c => c.name).join(', '));

        for (let i = 0; i < challenges.length; i++) {
            const result = await this.executeChallenge(challenges[i], i, challenges.length);
            if (result === 'dead_end') {
                this.triggerDeadEndRedirect(challenges[i].deadEndUrl || randomBilibiliUrl());
                return false;
            }
            // 'pass' 或 'skip' 都继续
        }

        return true; // 所有挑战完成，可以进入结果页
    },

    // 跳转视频（带2秒可取消倒计时）
    triggerDeadEndRedirect(url) {
        const overlay = document.createElement('div');
        overlay.className = 'dead-end-overlay';
        let countdown = 3;
        let cancelled = false;

        overlay.innerHTML = `
            <div class="dead-end-content">
                <h1>😈 验证失败！</h1>
                <p>正在将你送往B站接受张老师再教育...</p>
                <p class="dead-end-countdown" id="dead-countdown">${countdown} 秒后跳转</p>
                <button class="dead-end-cancel-btn" id="dead-cancel">😱 我不去！放我一马！</button>
            </div>
        `;
        document.body.appendChild(overlay);

        const cdEl = overlay.querySelector('#dead-countdown');
        const timer = setInterval(() => {
            countdown--;
            if (cdEl) cdEl.textContent = `${countdown} 秒后跳转`;
            if (countdown <= 0) {
                clearInterval(timer);
                if (!cancelled) {
                    window.location.href = url;
                }
            }
        }, 1000);

        overlay.querySelector('#dead-cancel').addEventListener('click', () => {
            cancelled = true;
            clearInterval(timer);
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(() => overlay.remove(), 500);
            window.alert('😤 算你跑得快！但你的前途还是没救！');
        });
    }
};

// ============================================================
// 挑战1: 声音验证
// ============================================================
ChallengeManager.register({
    id: 'voice_sincerity',
    name: '声音诚意验证',
    icon: '🎤',
    category: 'interactive',
    description: '请大声喊出指定内容，证明你还有救（虽然并没有）',
    canSkip: true,
    skipPenalty: '连喊的勇气都没有！张老师对你非常失望！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const phrases = ['张老师我去搬砖了', '张雪峰老师保佑我', '复读是我唯一的出路', '我再也不做清北梦了'];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];

        body.innerHTML = `
            <div style="text-align:center;">
                <div class="shout-meter" id="shout-meter">
                    <div class="shout-meter-fill" id="shout-fill"></div>
                </div>
                <p style="font-size:1.3rem;font-weight:bold;margin:1rem 0;color:#cc0000;" id="shout-phrase">请大喊：<br>"${phrase}"</p>
                <p style="color:#666;font-size:0.85rem;">检测到你的声音诚意中...</p>
                <button class="challenge-action-btn" id="shout-done">我喊完了</button>
            </div>
        `;

        const fill = body.querySelector('#shout-fill');
        let shouted = false;

        // 模拟检测——其实点按钮就行
        body.querySelector('#shout-done').addEventListener('click', () => {
            shouted = true;
            fill.style.width = '100%';
            fill.style.background = '#4caf50';
            body.querySelector('#shout-phrase').style.color = '#4caf50';
            setTimeout(() => {
                window.alert('✅ 声纹分析：音量达标，但内容毫无说服力。勉强放行。');
                finish('pass');
            }, 600);
        });

        // 也真的检测一下麦克风（如果有 detectShout）
        if (window.detectShout) {
            window.detectShout().then(loud => {
                if (loud && !shouted) {
                    shouted = true;
                    fill.style.width = '100%';
                    fill.style.background = '#4caf50';
                    setTimeout(() => finish('pass'), 800);
                }
            });
        }

        // 动画：假音量条
        let fakeLevel = 0;
        const anim = setInterval(() => {
            if (shouted) { clearInterval(anim); return; }
            fakeLevel = Math.max(0, Math.min(95, fakeLevel + (Math.random() - 0.4) * 20));
            fill.style.width = fakeLevel + '%';
        }, 300);
        this.cleanup = () => clearInterval(anim);
    }
});

// ============================================================
// 挑战2: AI面容鉴定
// ============================================================
ChallengeManager.register({
    id: 'ai_face_scan',
    name: 'AI面容鉴定',
    icon: '📸',
    category: 'interactive',
    description: '系统将扫描你的面部特征，进行AI深度颜值与智商关联分析',
    canSkip: true,
    skipPenalty: '不敢露脸？判定为心虚！你的照片将被标记为"嫌疑人"。',
    deadEnd: false,
    cleanup: null,
    async execute(body, finish) {
        body.innerHTML = `
            <div style="text-align:center;">
                <div id="face-preview" style="width:100%;min-height:200px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0.5rem 0;">
                    <span style="color:#999;">📷 摄像头预览区域</span>
                </div>
                <div id="face-score" style="display:none;margin:1rem 0;"></div>
                <button class="challenge-action-btn" id="face-start">📸 开始扫描</button>
            </div>
        `;

        body.querySelector('#face-start').addEventListener('click', async () => {
            body.querySelector('#face-start').disabled = true;
            body.querySelector('#face-start').textContent = '正在打开摄像头...';

            if (window.captureCameraPhoto) {
                const photo = await window.captureCameraPhoto();
                if (photo) {
                    window.capturedPhotoUrl = photo;
                    const preview = body.querySelector('#face-preview');
                    preview.innerHTML = `<img src="${photo}" style="max-width:100%;max-height:250px;border:3px solid red;border-radius:8px;">`;

                    const scoreDiv = body.querySelector('#face-score');
                    scoreDiv.style.display = 'block';
                    const scores = [
                        '颜值分：3.7/10（勉强及格线以下）',
                        '智商面相：12%（额头区域过窄）',
                        '对称性：左眼和右眼互相鄙视',
                        '前途预测：脸上写满了"复读"',
                        'AI总结：建议戴口罩出门'
                    ];
                    scoreDiv.innerHTML = scores.map(s => `<p style="color:#cc0000;margin:0.3rem 0;font-weight:bold;">${s}</p>`).join('');
                    scoreDiv.innerHTML += '<p style="color:#666;margin-top:0.5rem;">✅ 面容鉴定完成——结果不太乐观</p>';

                    setTimeout(() => {
                        window.alert('📸 面容鉴定完毕！你的脸已经进入系统黑名单！');
                        finish('pass');
                    }, 1500);
                    return;
                }
            }
            // 摄像头不可用
            body.querySelector('#face-preview').innerHTML = '<p style="color:#cc0000;">⚠️ 无法访问摄像头（害怕了吧）</p>';
            setTimeout(() => {
                window.alert('🤷 没拍到！但根据大数据推测，你长得也不咋地。');
                finish('pass');
            }, 1000);
        });
    }
});

// ============================================================
// 挑战3: 智熵测试
// ============================================================
ChallengeManager.register({
    id: 'iq_entropy_test',
    name: '智熵(IQ)测试',
    icon: '🧠',
    category: 'interactive',
    description: '4道精心设计的智商题，精准测量你的"智熵"值',
    canSkip: true,
    skipPenalty: '连测试都不敢做！智熵值自动判定为-250！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const questions = [
            {
                q: '高考满分750，你估分250。请问你的智商相等于？',
                opts: ['A. 250（非常聪明）', 'B. 室温25°C（正常）', 'C. 冰箱温度4°C（冷静）', 'D. 绝对零度-273°C（你的真实水平）']
            },
            {
                q: '张雪峰嘴唇发紫是因为缺氧。你考不上大学是因为？',
                opts: ['A. 缺分', 'B. 缺德', 'C. 缺心眼', 'D. 以上都是']
            },
            {
                q: '如果 1+1=2，那么 你+大学=？',
                opts: ['A. 不可能', 'B. 妄想', 'C. 扫大街', 'D. 社会实验对象']
            },
            {
                q: '以下哪个大学真实存在？',
                opts: ['A. 月球背面无线电职业技术大学', 'B. 西伯利亚母猪护理学院', 'C. 奈何桥收费管理干部学院', 'D. 都不存在（但你只能去这些）']
            }
        ];

        let currentQ = 0;
        const answers = [];

        function renderQuestion() {
            if (currentQ >= questions.length) {
                showScore();
                return;
            }
            const q = questions[currentQ];
            body.innerHTML = `
                <div class="quiz-card">
                    <div class="quiz-progress">第 ${currentQ + 1}/${questions.length} 题</div>
                    <p class="quiz-question">${q.q}</p>
                    <div class="quiz-options">
                        ${q.opts.map((opt, i) => `
                            <button class="quiz-option" data-idx="${i}">${opt}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            body.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    answers.push(parseInt(btn.dataset.idx));
                    currentQ++;
                    renderQuestion();
                });
            });
        }

        function showScore() {
            body.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:4rem;">🧠💥</div>
                    <h3 style="color:#cc0000;">测试完成！</h3>
                    <p>你答对了 <b>0/${questions.length}</b> 题（意料之中）</p>
                    <p style="font-size:1.2rem;color:#cc0000;">智商等级：<b>-250</b>（负数，建议充值）</p>
                    <p style="color:#666;">张老师点评：你的大脑是一个美丽的装饰品。</p>
                    <p style="color:#666;">建议：立即关闭网页，打开小学课本第一页。</p>
                    <button class="challenge-action-btn" id="iq-ok">接受现实</button>
                </div>
            `;
            body.querySelector('#iq-ok').addEventListener('click', () => finish('pass'));
        }

        renderQuestion();
    }
});

// ============================================================
// 挑战4: 手残鉴定（抓按钮）
// ============================================================
ChallengeManager.register({
    id: 'reflex_test',
    name: '手残鉴定测试',
    icon: '🎯',
    category: 'interactive',
    description: '抓住会逃跑的按钮！测试你的手残程度！',
    canSkip: true,
    skipPenalty: '手残到连测试都不敢做！双倍手残认证！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        let caught = 0;
        const target = 5;

        body.innerHTML = `
            <div style="text-align:center;">
                <p>抓住按钮 <span id="catch-count">${caught}</span>/${target} 次</p>
                <p style="color:#666;font-size:0.85rem;">按钮越来越狡猾，你的手越来越残</p>
                <div style="position:relative;min-height:200px;display:flex;align-items:center;justify-content:center;" id="catch-area">
                    <button class="challenge-action-btn catch-target" id="catch-btn" style="font-size:1.5rem;padding:1.5rem 2.5rem;">来抓我呀！</button>
                </div>
            </div>
        `;

        const btn = body.querySelector('#catch-btn');
        const countEl = body.querySelector('#catch-count');

        btn.addEventListener('mouseover', function() {
            if (caught >= target) return;
            const range = 100 + caught * 50;
            const x = (Math.random() - 0.5) * range * 2;
            const y = (Math.random() - 0.5) * range * 2;
            this.style.transform = `translate(${x}px, ${y}px)`;
            this.style.transition = 'transform 0.15s ease';
            if (window.playAnnoyingBeep) window.playAnnoyingBeep();
        });

        btn.addEventListener('click', function() {
            caught++;
            countEl.textContent = caught;
            btn.textContent = ['抓到一次！继续！', '又来？！', '有点厉害...', '不可能！', '最后一次？！'][caught - 1] || '抓到！';
            if (caught >= target) {
                btn.textContent = '🏆 手残战胜了按钮！';
                btn.style.transform = '';
                btn.style.fontSize = '1rem';
                btn.style.padding = '0.8rem 1.5rem';
                setTimeout(() => {
                    window.alert('🎯 手残鉴定结果：虽然抓住了按钮，但你的手残分数依然很高！');
                    finish('pass');
                }, 800);
            }
        });
    }
});

// ============================================================
// 挑战5: 终极验证码
// ============================================================
ChallengeManager.register({
    id: 'captcha_hell',
    name: '终极验证码',
    icon: '🔢',
    category: 'interactive',
    description: '请选出所有包含"你考不上的大学"的图片',
    canSkip: true,
    skipPenalty: '验证码都不做？机器人实锤了！机器人不需要上大学。',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        let attempts = 0;
        const items = [
            { emoji: '🏫', label: '清华大学', fake: true },
            { emoji: '🐷', label: '母猪护理学院', fake: false },
            { emoji: '🌙', label: '月球技校', fake: false },
            { emoji: '🏥', label: '北京大学医学部', fake: true },
            { emoji: '🎣', label: '奈何桥大学', fake: false },
            { emoji: '💻', label: 'MIT计算机', fake: true },
            { emoji: '🧹', label: '扫大街专科', fake: false },
            { emoji: '☠️', label: '丧尸生存学院', fake: false },
            { emoji: '🎓', label: '哈佛商学院', fake: true },
        ];

        function renderGrid() {
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            body.innerHTML = `
                <div style="text-align:center;">
                    <p style="color:#666;margin-bottom:1rem;">请选出所有<b>你考不上的大学</b></p>
                    <div class="captcha-grid">
                        ${shuffled.map((item, i) => `
                            <div class="captcha-cell" data-idx="${i}" data-fake="${item.fake}">
                                <span style="font-size:2.5rem;">${item.emoji}</span>
                                <span style="font-size:0.8rem;display:block;">${item.label}</span>
                            </div>
                        `).join('')}
                    </div>
                    <p style="color:#cc0000;font-size:0.85rem;margin-top:0.5rem;" id="captcha-msg">尝试次数: ${attempts}</p>
                    <button class="challenge-action-btn" id="captcha-submit">提交验证</button>
                </div>
            `;

            body.querySelectorAll('.captcha-cell').forEach(cell => {
                cell.addEventListener('click', () => cell.classList.toggle('selected'));
            });

            body.querySelector('#captcha-submit').addEventListener('click', () => {
                const selected = body.querySelectorAll('.captcha-cell.selected');
                const allCorrect = [...selected].every(c => c.dataset.fake === 'false');
                const allSelected = selected.length === items.filter(i => !i.fake).length;

                if (allCorrect && allSelected && attempts >= 1) {
                    window.alert('✅ 验证通过！（其实是因为系统烦了）');
                    finish('pass');
                } else {
                    attempts++;
                    body.querySelector('#captcha-msg').textContent = `验证失败！请重试（第${attempts}次，永远失败）`;
                    if (attempts >= 3) {
                        window.alert('🤖 算了，判定你是机器人。但机器人也需要被整蛊！');
                        finish('pass');
                    } else {
                        renderGrid();
                    }
                }
            });
        }

        renderGrid();
    }
});

// ============================================================
// 挑战6: 认命书打字
// ============================================================
ChallengeManager.register({
    id: 'surrender_typing',
    name: '认命书签字',
    icon: '⌨️',
    category: 'interactive',
    description: '请逐字输入以下"认命宣言"，承认你的真实水平',
    canSkip: true,
    skipPenalty: '不签字？那就默认你认命了！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const text = '本人郑重承认高考分数过低考不上任何体面大学自愿接受AI系统安排的一切离谱专业包括但不限于母猪产后护理月壤路由器维修奈何桥收费管理等本人承诺不复读不抱怨不跳楼';
        let startTime = Date.now();

        body.innerHTML = `
            <div style="text-align:center;">
                <p style="color:#666;font-size:0.85rem;">请在下方逐字输入以下内容（复制粘贴无效）：</p>
                <div class="surrender-ref" style="background:#fff5f5;padding:0.8rem;border-radius:6px;margin-bottom:1rem;font-size:0.9rem;line-height:1.8;text-align:left;max-height:120px;overflow-y:auto;border:1px solid #ffcccc;">${text}</div>
                <textarea class="surrender-textarea" id="surrender-input" placeholder="在这里输入..." rows="3"></textarea>
                <p style="color:#666;font-size:0.8rem;margin-top:0.3rem;" id="surrender-status">已输入 0/${text.length} 字</p>
                <div class="surrender-timer" id="surrender-timer">剩余时间：30秒</div>
            </div>
        `;

        const input = body.querySelector('#surrender-input');
        const status = body.querySelector('#surrender-status');
        const timer = body.querySelector('#surrender-timer');
        let timeLeft = 30;
        let done = false;

        const timerId = setInterval(() => {
            if (done) { clearInterval(timerId); return; }
            timeLeft--;
            timer.textContent = `剩余时间：${timeLeft}秒`;
            if (timeLeft <= 10) timer.style.color = 'red';
            if (timeLeft <= 0) {
                clearInterval(timerId);
                if (!done) {
                    window.alert('⏰ 时间到！打字速度：龟速。建议从键盘认识字母开始重新做人。');
                    done = true;
                    finish('pass');
                }
            }
        }, 1000);

        this.cleanup = () => { done = true; clearInterval(timerId); };

        input.addEventListener('input', () => {
            if (done) return;
            const val = input.value;
            status.textContent = `已输入 ${val.length}/${text.length} 字`;
            if (val === text) {
                done = true;
                clearInterval(timerId);
                status.textContent = '✅ 打字完成！认罪态度良好...但还是没用！';
                status.style.color = '#cc0000';
                setTimeout(() => finish('pass'), 1500);
            }
        });
    }
});

// ============================================================
// 挑战7: 命运轮盘
// ============================================================
ChallengeManager.register({
    id: 'destiny_wheel',
    name: '命运大转盘',
    icon: '🎡',
    category: 'interactive',
    description: '转动命运之轮！看看你的真实归宿是什么！',
    canSkip: true,
    skipPenalty: '不敢转？默认归宿：流浪！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const outcomes = [
            { label: '复读', emoji: '📚' },
            { label: '搬砖', emoji: '🧱' },
            { label: '保安', emoji: '🛡️' },
            { label: '扫大街', emoji: '🧹' },
            { label: '流浪', emoji: '🏚️' },
            { label: '出家', emoji: '🧘' },
            { label: '啃老', emoji: '🛋️' },
            { label: '进宫', emoji: '🏯' },
        ];

        body.innerHTML = `
            <div style="text-align:center;">
                <div class="wheel-container" id="wheel-container">
                    <div class="wheel-pointer">▼</div>
                    <div class="wheel" id="wheel">
                        <div class="wheel-label" style="top:15px;left:50%;transform:translateX(-50%);">📚复读</div>
                        <div class="wheel-label" style="top:50px;right:15px;">🧱搬砖</div>
                        <div class="wheel-label" style="bottom:50px;right:15px;">🛡️保安</div>
                        <div class="wheel-label" style="bottom:15px;left:50%;transform:translateX(-50%);">🧹扫街</div>
                        <div class="wheel-label" style="bottom:50px;left:15px;">🏚️流浪</div>
                        <div class="wheel-label" style="top:50px;left:15px;">🧘出家</div>
                        <div class="wheel-label" style="top:35%;left:50%;transform:translate(-50%,-50%);">🎰</div>
                    </div>
                </div>
                <button class="challenge-action-btn" id="spin-btn" style="margin-top:1rem;">🎰 转动命运！</button>
                <div id="wheel-result" style="margin-top:1rem;font-size:1.2rem;font-weight:bold;color:#cc0000;display:none;"></div>
            </div>
        `;

        const wheel = body.querySelector('#wheel');
        let spinning = false;

        body.querySelector('#spin-btn').addEventListener('click', () => {
            if (spinning) return;
            spinning = true;
            // 随机旋转（保证总是落在倒霉的位置）
            const extraSpins = 5 + Math.floor(Math.random() * 5);
            const targetAngle = Math.floor(Math.random() * 360);
            const totalRotation = extraSpins * 360 + targetAngle + Math.floor(Math.random() * 40) + 5;

            wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
            wheel.style.transform = `rotate(${totalRotation}deg)`;

            setTimeout(() => {
                const finalAngle = totalRotation % 360;
                const idx = Math.floor(finalAngle / 45) % outcomes.length;
                const result = outcomes[idx];
                const resultDiv = body.querySelector('#wheel-result');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `${result.emoji} 命运选择了：<b>${result.label}</b>！<br><span style="font-size:0.9rem;color:#666;">（意料之中，毫无惊喜）</span>`;
                setTimeout(() => finish('pass'), 2000);
            }, 4200);
        });
    }
});

// ============================================================
// 挑战8: 三扇命运之门
// ============================================================
ChallengeManager.register({
    id: 'three_doors',
    name: '三扇命运之门',
    icon: '🚪',
    category: 'interactive',
    description: '三扇门分别通往不同的命运。选一个吧——但后果自负！',
    canSkip: true,
    skipPenalty: '不敢选？那就默认走后门——扫大街的大门！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const doors = [
            { emoji: '🌈', label: '梦想之门', desc: '通往理想大学', result: 'dream' },
            { emoji: '💀', label: '现实之门', desc: '看看你真实能去哪', result: 'reality' },
            { emoji: '❓', label: '未知之门', desc: '谁也不知道后面是什么', result: 'unknown' },
        ];

        body.innerHTML = `
            <div class="doors-container">
                ${doors.map((d, i) => `
                    <div class="door" data-idx="${i}">
                        <div class="door-emoji">${d.emoji}</div>
                        <div class="door-label">${d.label}</div>
                        <div class="door-desc">${d.desc}</div>
                    </div>
                `).join('')}
            </div>
            <div id="door-outcome" style="text-align:center;margin-top:1.5rem;display:none;"></div>
        `;

        body.querySelectorAll('.door').forEach(doorEl => {
            doorEl.addEventListener('click', () => {
                const idx = parseInt(doorEl.dataset.idx);
                const choice = doors[idx];
                const outcome = body.querySelector('#door-outcome');
                outcome.style.display = 'block';

                if (choice.result === 'dream') {
                    outcome.innerHTML = `
                        <p style="color:#cc0000;font-size:1.2rem;">🌈 梦想之门已打开——</p>
                        <p style="color:#666;">然而你的梦想和现实之间有38万公里差距！</p>
                        <p style="color:#cc0000;font-weight:bold;">系统正在把你遣送B站接受教育...</p>
                    `;
                    finish('dead_end');
                } else if (choice.result === 'reality') {
                    outcome.innerHTML = `
                        <p style="color:#cc0000;font-size:1.2rem;">💀 现实之门：复读是你唯一的出路</p>
                        <p style="color:#666;">不是吓你，是真的。</p>
                    `;
                    setTimeout(() => finish('pass'), 2000);
                } else {
                    const effects = ['earthquake', 'fake_virus', 'page_melt', 'glitch'];
                    const effect = effects[Math.floor(Math.random() * effects.length)];
                    outcome.innerHTML = `
                        <p style="color:#cc0000;font-size:1.2rem;">❓ 未知之门——打开了潘多拉魔盒！</p>
                        <p style="color:#666;">随机释放诅咒中...</p>
                    `;
                    setTimeout(() => {
                        if (window.triggerResultEffect) {
                            window.triggerResultEffect(effect);
                        }
                        finish('pass');
                    }, 1500);
                }
            });
        });
    }
});

// ============================================================
// 挑战9: 协议签署
// ============================================================
ChallengeManager.register({
    id: 'agreement_signing',
    name: '霸王协议签署',
    icon: '📜',
    category: 'interactive',
    description: '请仔细阅读并同意以下条款（不看也行，反正你只能同意）',
    canSkip: true,
    skipPenalty: '不签协议？那默认视为同意全部条款！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const clauses = [
            '第1条：你承认自己的高考分数确实很离谱。',
            '第2条：你放弃对"好大学"一词的所有解释权。',
            '第3条：你同意毕业后第一份工作是给张老师家的狗做保姆。',
            '第4条：你自愿放弃对体面工作的所有幻想。',
            '第5条：你理解AI推荐的专业可能让你在家族群社会性死亡。',
            '第6条：你同意张雪峰老师对你的智商进行公开点评。',
            '第7条：你接受任何离谱专业推荐，不得有异议。',
            '第8条：你放弃因本网站导致的心理创伤起诉权利。',
            '第9条：你承认自己确实需要复读但就是不想。',
            '第10条：你知道看这个网页本身就是浪费时间。',
            '第11条：但你还是看了，说明你确实需要一个离谱专业来拯救。',
            '第12条：本协议最终解释权归张雪峰老师的嘴唇所有。',
        ];

        body.innerHTML = `
            <div>
                <div class="agreement-scroll" id="agreement-scroll">
                    <h3 style="color:#cc0000;text-align:center;">📜 用户认命协议 v6.6.6</h3>
                    ${clauses.map(c => `<p style="margin:0.5rem 0;font-size:0.9rem;">${c}</p>`).join('')}
                    <p style="margin:1rem 0;font-size:0.9rem;">......（还有392条类似条款，懒得写全）</p>
                    <p style="color:#cc0000;font-weight:bold;">—— 请滚动到底部以继续 ——</p>
                </div>
                <div style="text-align:center;margin-top:1rem;">
                    <button class="challenge-action-btn" id="accept-btn" disabled>✅ 我认命，接受全部条款</button>
                    <p style="color:#666;font-size:0.8rem;margin-top:0.3rem;">（需滚动到底部才能接受）</p>
                </div>
            </div>
        `;

        const scrollDiv = body.querySelector('#agreement-scroll');
        const acceptBtn = body.querySelector('#accept-btn');

        scrollDiv.addEventListener('scroll', () => {
            const atBottom = scrollDiv.scrollHeight - scrollDiv.scrollTop - scrollDiv.clientHeight < 10;
            if (atBottom) {
                acceptBtn.disabled = false;
                acceptBtn.textContent = '✅ 我认命，接受全部条款';
            }
        });

        acceptBtn.addEventListener('click', () => {
            window.alert('📜 协议签署完毕！你的灵魂已归张雪峰老师所有。');
            finish('pass');
        });
    }
});

// ============================================================
// 挑战10: 人生扫雷
// ============================================================
ChallengeManager.register({
    id: 'minesweeper_of_life',
    name: '人生扫雷',
    icon: '💣',
    category: 'interactive',
    description: '点击方格避开地雷——好吧其实每一格都是雷，你的前途也一样',
    canSkip: true,
    skipPenalty: '不敢点？连面对现实的勇气都没有！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div style="text-align:center;">
                <p style="color:#666;margin-bottom:0.5rem;">5×5 人生棋盘 —— 请点击一个安全格</p>
                <div class="minesweeper-grid" id="mine-grid"></div>
                <div id="mine-msg" style="margin-top:1rem;font-size:1rem;font-weight:bold;color:#cc0000;"></div>
            </div>
        `;

        const grid = body.querySelector('#mine-grid');
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.textContent = '❓';
            grid.appendChild(cell);
        }

        let exploded = false;
        grid.querySelectorAll('.mine-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                if (exploded) return;
                exploded = true;

                // 全部爆炸
                grid.querySelectorAll('.mine-cell').forEach((c, i) => {
                    setTimeout(() => {
                        c.classList.add('revealed');
                        c.textContent = '💣';
                        c.style.animation = 'shake 0.1s infinite alternate';
                    }, i * 30);
                });

                body.querySelector('#mine-msg').innerHTML = `
                    💥 全部是雷！<br>
                    <span style="font-size:0.9rem;color:#666;">你的人生就像这张棋盘——到处都是雷，点哪都是死。</span>
                `;

                setTimeout(() => finish('pass'), 2500);
            });
        });
    }
});

// ============================================================
// 挑战11: 地震求生
// ============================================================
ChallengeManager.register({
    id: 'earthquake_survival',
    name: '地震求生测试',
    icon: '⚡',
    category: 'interactive',
    description: '地震来了！快点击按钮求生！',
    canSkip: true,
    skipPenalty: '地震面前不求生？判定为放弃治疗！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div style="text-align:center;">
                <div class="earthquake-warning">⚠️ 地震警报！⚠️</div>
                <p style="color:#666;">点击下方按钮求生！（10秒倒计时）</p>
                <div class="earthquake-countdown" id="eq-countdown">10</div>
                <button class="challenge-action-btn survive-btn" id="survive-btn">🏃 点我存活！</button>
            </div>
        `;

        // 触发地震效果
        document.body.classList.add('earthquake-active');

        let timeLeft = 10;
        let survived = false;
        this.cleanup = () => {
            document.body.classList.remove('earthquake-active');
            clearInterval(eqTimer);
        };

        const countdownEl = body.querySelector('#eq-countdown');
        const eqTimer = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;
            if (timeLeft <= 3) countdownEl.style.color = 'red';
            if (timeLeft <= 0 && !survived) {
                clearInterval(eqTimer);
                window.alert('💀 你在地震中阵亡了！但好消息是——你的烂分数也会一起被埋葬。');
                document.body.classList.remove('earthquake-active');
                finish('pass');
            }
        }, 1000);

        body.querySelector('#survive-btn').addEventListener('click', () => {
            if (survived) return;
            survived = true;
            clearInterval(eqTimer);
            document.body.classList.remove('earthquake-active');
            countdownEl.textContent = '存活！';
            countdownEl.style.color = 'green';
            window.alert('🏃 求生意志强烈！可惜你的分数在地震中还是活不下来。');
            finish('pass');
        });

        // 逃生按钮也会逃跑
        const surviveBtn = body.querySelector('#survive-btn');
        surviveBtn.addEventListener('mouseover', () => {
            if (survived) return;
            const x = (Math.random() - 0.5) * 250;
            const y = (Math.random() - 0.5) * 150;
            surviveBtn.style.transform = `translate(${x}px, ${y}px)`;
            surviveBtn.style.transition = 'transform 0.2s ease';
        });
    }
});

// ============================================================
// 挑战12: 测谎仪
// ============================================================
ChallengeManager.register({
    id: 'lie_detector',
    name: 'AI测谎仪',
    icon: '🕵️',
    category: 'interactive',
    description: 'AI将问3个问题，分析你的回答是否诚实（答案永远是"不诚实"）',
    canSkip: true,
    skipPenalty: '逃避测谎？心虚实锤！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const questions = [
            '你是否真心觉得自己能考上好大学？',
            '你对这个离谱专业推荐感到满意吗？',
            '你会向同学推荐这个志愿填报系统吗？',
        ];

        let qIdx = 0;
        const lies = [];

        function renderQ() {
            if (qIdx >= questions.length) {
                showVerdict();
                return;
            }
            body.innerHTML = `
                <div style="text-align:center;">
                    <div class="lie-meter">
                        <div class="lie-meter-waves" id="lie-waves">
                            <span class="lie-wave"></span><span class="lie-wave"></span><span class="lie-wave"></span>
                            <span class="lie-wave"></span><span class="lie-wave"></span><span class="lie-wave"></span>
                        </div>
                    </div>
                    <p style="font-size:1.1rem;margin:1rem 0;font-weight:bold;">问题 ${qIdx + 1}/3:</p>
                    <p style="font-size:1rem;margin-bottom:1rem;">${questions[qIdx]}</p>
                    <div style="display:flex;gap:1rem;justify-content:center;">
                        <button class="quiz-option" id="ans-yes">✅ 是的</button>
                        <button class="quiz-option" id="ans-no">❌ 不是</button>
                    </div>
                </div>
            `;

            body.querySelector('#ans-yes').addEventListener('click', () => {
                lies.push(true);
                qIdx++;
                renderQ();
            });
            body.querySelector('#ans-no').addEventListener('click', () => {
                lies.push(false);
                qIdx++;
                renderQ();
            });
        }

        function showVerdict() {
            body.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:5rem;">🕵️</div>
                    <h3 style="color:#cc0000;">测谎分析完成！</h3>
                    <div style="background:#fff5f5;padding:1rem;border-radius:8px;margin:1rem 0;">
                        <p>心率波动：<span style="color:red;">异常剧烈</span></p>
                        <p>瞳孔变化：<span style="color:red;">明显闪烁（心虚）</span></p>
                        <p>脑电波：<span style="color:red;">试图欺骗AI</span></p>
                        <p>综合判定：<b style="color:#cc0000;font-size:1.2rem;">你在大声说谎！</b></p>
                    </div>
                    <p style="color:#666;">AI建议：诚实面对自己的分数，别装了。</p>
                    <button class="challenge-action-btn" id="lie-ok">好吧我承认我说谎了</button>
                </div>
            `;
            body.querySelector('#lie-ok').addEventListener('click', () => finish('pass'));
        }

        renderQ();
    }
});

// ============================================================
// 挑战13: 刮刮乐
// ============================================================
ChallengeManager.register({
    id: 'scratch_card',
    name: '命运刮刮乐',
    icon: '🎫',
    category: 'interactive',
    description: '刮开涂层，看看下面藏着什么惊喜！',
    canSkip: true,
    skipPenalty: '不刮是吧？那就直接告诉你——下面是"你落榜了"！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div style="text-align:center;">
                <p style="color:#666;margin-bottom:0.5rem;">用鼠标（手指）疯狂刮开涂层！</p>
                <div class="scratch-container">
                    <canvas id="scratch-canvas" width="400" height="200"></canvas>
                </div>
                <div id="scratch-revealed" style="display:none;margin-top:1rem;">
                    <h3 style="color:#cc0000;">🎉 恭喜刮出大奖！</h3>
                    <p style="font-size:1.3rem;font-weight:bold;color:#cc0000;">惊喜就是：<b>你没考上！</b></p>
                    <p style="color:#666;">再来一次结果也一样。</p>
                    <button class="challenge-action-btn" id="scratch-ok">😤 退钱！</button>
                </div>
            </div>
        `;

        const canvas = body.querySelector('#scratch-canvas');
        const ctx = canvas.getContext('2d');

        // 覆盖灰色涂层
        ctx.fillStyle = '#999999';
        ctx.fillRect(0, 0, 400, 200);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'bold 28px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText('🔒 刮开有惊喜', 200, 110);

        let scratched = 0;
        let revealed = false;

        function scratch(e) {
            if (revealed) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
            const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fill();

            scratched++;
            if (scratched > 50 && !revealed) {
                revealed = true;
                body.querySelector('#scratch-revealed').style.display = 'block';
                canvas.style.opacity = '0.5';
            }
        }

        canvas.addEventListener('mousemove', scratch);
        canvas.addEventListener('touchmove', scratch);
        this.cleanup = () => {
            canvas.removeEventListener('mousemove', scratch);
            canvas.removeEventListener('touchmove', scratch);
        };

        const scratchOk = body.querySelector('#scratch-ok');
        if (scratchOk) scratchOk.addEventListener('click', () => finish('pass'));
    }
});

// ============================================================
// 挑战14: 死亡数学
// ============================================================
ChallengeManager.register({
    id: 'math_of_death',
    name: '死亡数学测验',
    icon: '🔢',
    category: 'interactive',
    description: '3道超简单数学题——但在本系统中你永远算不对！',
    canSkip: true,
    skipPenalty: '数学都不做？等于承认你脑子是摆设！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const problems = [
            { q: '1 + 1 = ?', ans: 2, trick: '你以为等于2？太天真了！系统判定你错了！' },
            { q: '3 × 3 = ?', ans: 9, trick: '9？不，在这个宇宙里3×3=复读！答错！' },
            { q: '750 - 你的分数 = ?', ans: 0, trick: '不管你输入什么都是错的，因为你的分数太刺激了。' },
        ];

        let pIdx = 0;
        let wrongCount = 0;

        function renderP() {
            if (pIdx >= problems.length) {
                showFinal();
                return;
            }
            const p = problems[pIdx];
            body.innerHTML = `
                <div style="text-align:center;">
                    <p style="color:#666;">第 ${pIdx + 1}/${problems.length} 题</p>
                    <p style="font-size:1.5rem;font-weight:bold;margin:1rem 0;">${p.q}</p>
                    <input type="number" class="math-input" id="math-answer" placeholder="输入你的答案">
                    <button class="challenge-action-btn" id="math-submit" style="margin-top:0.5rem;">提交</button>
                    <p id="math-feedback" style="margin-top:0.8rem;font-weight:bold;color:#cc0000;"></p>
                </div>
            `;

            body.querySelector('#math-submit').addEventListener('click', () => {
                const feedback = body.querySelector('#math-feedback');
                feedback.textContent = p.trick;
                wrongCount++;
                pIdx++;
                setTimeout(() => renderP(), 1200);
            });
        }

        function showFinal() {
            body.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:4rem;">🤯</div>
                    <h3 style="color:#cc0000;">数学测验成绩：0分</h3>
                    <p>答对 0/${problems.length} 题</p>
                    <p style="color:#666;">结论：你的数学水平相当于一块砖头。</p>
                    <p style="color:#666;">建议：重新从幼儿园开始。</p>
                    <button class="challenge-action-btn" id="math-ok">😭 数学太难了</button>
                </div>
            `;
            body.querySelector('#math-ok').addEventListener('click', () => finish('pass'));
        }

        renderP();
    }
});

// ============================================================
// 挑战15: 系统深度扫描（被动）
// ============================================================
ChallengeManager.register({
    id: 'system_scan',
    name: '系统深度扫描',
    icon: '🛡️',
    category: 'passive',
    description: '正在对您的智商、成绩、前途进行全面体检...',
    canSkip: true,
    skipPenalty: '跳过扫描？说明你不敢面对体检结果！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        const scanLines = [
            '正在启动全盘智商扫描引擎 v0.0.1...',
            '扫描 C:/Users/你/大脑/智商.dat ... ❌ 文件不存在',
            '扫描 C:/Users/你/回忆/好成绩/ ... 📂 文件夹为空',
            '扫描 C:/Users/你/幻想/清华梦.exe ... 🦠 检测到妄想症病毒！',
            '扫描 C:/Users/你/前途/ ... 💀 已损坏，无法修复',
            '正在分析高中三年成绩趋势... 📉 持续下跌，触底但无反弹',
            '正在搜索你的一丝优点... 🔍 搜索中... 搜索中...',
            '...未找到任何优点。扩大搜索范围...',
            '...搜索垃圾桶... 垃圾桶里也没有。',
            '正在生成体检报告...',
        ];

        body.innerHTML = `
            <div class="scan-terminal">
                <pre id="scan-output" style="color:#0f0;font-size:0.85rem;line-height:1.8;min-height:250px;">
╔════════════════════════════════════╗
║   张雪峰智商体检系统 v6.6.6        ║
╚════════════════════════════════════╝
                </pre>
                <div class="scan-progress" id="scan-progress">
                    <div class="scan-progress-bar" id="scan-bar"></div>
                </div>
            </div>
        `;

        const output = body.querySelector('#scan-output');
        const bar = body.querySelector('#scan-bar');
        let lineIdx = 0;

        const interval = setInterval(() => {
            if (lineIdx < scanLines.length) {
                output.textContent += '\n' + scanLines[lineIdx];
                output.scrollTop = output.scrollHeight;
                bar.style.width = ((lineIdx + 1) / scanLines.length * 100) + '%';
                lineIdx++;
            } else {
                clearInterval(interval);
                output.textContent += '\n\n扫描完成。结论：你的存在本身就是一个Bug。';
                output.textContent += '\n\n按任意键继续（其实没有任意键，等3秒自动过）';
                bar.style.width = '100%';
                bar.style.background = '#cc0000';
                setTimeout(() => finish('pass'), 3000);
            }
        }, 600);

        this.cleanup = () => clearInterval(interval);
    }
});

// ============================================================
// 挑战16: 无限加载（被动）
// ============================================================
ChallengeManager.register({
    id: 'loading_bar_fake',
    name: '结果加载中...',
    icon: '⏳',
    category: 'passive',
    description: '正在加载你的命运结果...请耐心等待...',
    canSkip: true,
    skipPenalty: '没耐心？那你凭什么觉得自己能上好大学？',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div style="text-align:center;">
                <div class="loading-bar-container">
                    <div class="loading-bar-track">
                        <div class="loading-bar-fill" id="fake-load-bar"></div>
                    </div>
                    <p style="margin-top:0.5rem;font-size:0.9rem;" id="load-percent">0%</p>
                </div>
                <div id="load-msg" style="margin-top:1rem;color:#666;font-size:0.9rem;min-height:2rem;"></div>
            </div>
        `;

        const bar = body.querySelector('#fake-load-bar');
        const percent = body.querySelector('#load-percent');
        const msg = body.querySelector('#load-msg');

        const messages = [
            { at: 30, text: '正在寻找你的一丝可能性...' },
            { at: 60, text: '可能性的确存在——在平行宇宙里。' },
            { at: 85, text: '这个宇宙里没找到，正在搜索垃圾桶...' },
            { at: 92, text: '垃圾桶也没有。正在搜索回收站...' },
            { at: 96, text: '回收站已清空。前途文件永久丢失。' },
            { at: 98, text: '还在加载...你还等什么呢？' },
        ];

        let pct = 0;
        const interval = setInterval(() => {
            if (pct < 85) {
                pct += Math.random() * 8 + 2;
            } else if (pct < 98) {
                pct += Math.random() * 1.5 + 0.3;
            } else if (pct < 99.5) {
                pct += Math.random() * 0.1;
            } else {
                clearInterval(interval);
                pct = 100;
                bar.style.width = '100%';
                percent.textContent = '加载失败！';
                msg.innerHTML = '<span style="color:#cc0000;">💀 你的前途文件已损坏！<br>系统决定强行继续——反正也没差。</span>';
                setTimeout(() => finish('pass'), 2500);
                return;
            }
            bar.style.width = pct + '%';
            percent.textContent = Math.floor(pct) + '%';

            for (const m of messages) {
                if (pct >= m.at && !m.shown) {
                    m.shown = true;
                    msg.textContent = m.text;
                    break;
                }
            }
        }, 400);

        this.cleanup = () => clearInterval(interval);
    }
});

// ============================================================
// 挑战17: 倒计时审判（被动）
// ============================================================
ChallengeManager.register({
    id: 'countdown_anxiety',
    name: '终极倒计时审判',
    icon: '⏰',
    category: 'passive',
    description: '20秒倒计时，你的信息将被同步到全宇宙...',
    canSkip: true,
    skipPenalty: '不敢面对倒计时？你的前途已经倒数中！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        let timeLeft = 20;
        const threats = [
            { at: 16, msg: '⚠️ 正在将你的分数同步到相亲相爱一家人...' },
            { at: 12, msg: '🚨 已生成"最离谱考生"海报，即将发布微博...' },
            { at: 8, msg: '📞 已自动预约复读学校，押金从你的零花钱扣除...' },
            { at: 4, msg: '💀 张雪峰老师已收到推送，正在赶来...' },
        ];

        body.innerHTML = `
            <div style="text-align:center;">
                <div class="challenge-countdown-circle" id="cd-circle">
                    <span id="cd-number">${timeLeft}</span>
                </div>
                <p style="margin-top:1rem;color:#cc0000;font-weight:bold;min-height:2rem;" id="cd-threat"></p>
            </div>
        `;

        const cdNum = body.querySelector('#cd-number');
        const cdThreat = body.querySelector('#cd-threat');

        const interval = setInterval(() => {
            timeLeft--;
            cdNum.textContent = timeLeft;

            const threat = threats.find(t => t.at === timeLeft);
            if (threat) cdThreat.textContent = threat.msg;

            if (timeLeft <= 5) cdNum.style.color = 'red';
            if (timeLeft <= 3) cdNum.style.fontSize = '3rem';

            if (timeLeft <= 0) {
                clearInterval(interval);
                cdNum.textContent = '😈';
                cdThreat.innerHTML = '<span style="color:#cc0000;">哈哈哈——开玩笑的！<br><span style="color:#666;">但你的前途确实在倒数。这点没开玩笑。</span></span>';
                setTimeout(() => finish('pass'), 2500);
            }
        }, 1000);

        this.cleanup = () => clearInterval(interval);
    }
});

// ============================================================
// 挑战18: 系统更新（被动）
// ============================================================
ChallengeManager.register({
    id: 'fake_update',
    name: '系统紧急更新',
    icon: '⚙️',
    category: 'passive',
    description: 'Windows正在安装张雪峰认证补丁，请勿关闭网页...',
    canSkip: true,
    skipPenalty: '跳过更新？系统将失去对你的最后一丝信任！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div class="update-overlay-content">
                <div style="font-size:4rem;">⚙️</div>
                <h3 style="color:#0078d7;">正在安装更新</h3>
                <p style="color:#666;">张雪峰认证补丁 v6.6.6 (KB666-你的分数)</p>
                <div class="update-spinner"></div>
                <p style="color:#666;font-size:0.85rem;" id="update-status">正在安装更新 1/999...</p>
                <p style="color:#666;font-size:0.8rem;">请勿关闭计算机。你的前途取决于本次更新。</p>
            </div>
        `;

        const status = body.querySelector('#update-status');
        let progress = 1;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 30) + 5;
            if (progress >= 999) {
                clearInterval(interval);
                status.textContent = '更新失败！错误代码: 0x0000SCORE（分数过低，无法完成更新）';
                status.style.color = '#cc0000';
                setTimeout(() => {
                    window.alert('⚙️ 系统更新失败！但这不影响你继续被忽悠！');
                    finish('pass');
                }, 2000);
            } else {
                status.textContent = `正在安装更新 ${Math.min(progress, 998)}/999...`;
            }
        }, 300);

        this.cleanup = () => clearInterval(interval);
    }
});

// ============================================================
// 挑战19: 付费解锁（诈唬型）
// ============================================================
ChallengeManager.register({
    id: 'payment_required',
    name: '付费解锁结果',
    icon: '💰',
    category: 'bluff',
    description: '您的分数过低，需要缴纳费用才能继续查看结果！',
    canSkip: true,
    skipPenalty: '白嫖怪！但系统宽宏大量，这次算了！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color:#cc0000;">⚠️ 低分费用清单</h3>
                <table class="payment-table">
                    <tr><td>智商充值税</td><td style="color:#cc0000;">¥ 999.00</td></tr>
                    <tr><td>妄想消除税</td><td style="color:#cc0000;">¥ 888.00</td></tr>
                    <tr><td>张老师精神损失费</td><td style="color:#cc0000;">¥ 666.00</td></tr>
                    <tr><td>社会资源浪费补偿</td><td style="color:#cc0000;">¥ 520.00</td></tr>
                    <tr><td style="font-weight:bold;font-size:1.1rem;">合计</td><td style="font-weight:bold;font-size:1.1rem;color:#cc0000;">¥ 3073.00</td></tr>
                </table>
                <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:center;">
                    <button class="challenge-action-btn" id="pay-btn">💳 立即付款</button>
                    <button class="challenge-action-btn" id="no-money-btn" style="background:#999;">😭 我没钱</button>
                </div>
            </div>
        `;

        body.querySelector('#pay-btn').addEventListener('click', () => {
            window.alert('💳 付款处理中...\n\n哈哈哈骗你的！这智商还好意思付款呢？');
            finish('pass');
        });
        body.querySelector('#no-money-btn').addEventListener('click', () => {
            window.alert('😭 没钱是吧？那就白嫖吧！反正这专业也不值钱！');
            finish('pass');
        });
    }
});

// ============================================================
// 挑战20: 假FBI警告（诈唬型）
// ============================================================
ChallengeManager.register({
    id: 'fbi_warning',
    name: '⚠️ 安全警告',
    icon: '🚨',
    category: 'bluff',
    description: '系统检测到异常活动！正在锁定...',
    canSkip: true,
    skipPenalty: '逃也没有用！你的IP已经被记录！',
    deadEnd: false,
    cleanup: null,
    execute(body, finish) {
        body.innerHTML = `
            <div class="fbi-warning-content">
                <div style="font-size:5rem;">🚨</div>
                <h2 style="color:#cc0000;">⚠️ 安全警告</h2>
                <p style="font-size:1rem;line-height:1.8;">
                    中华人民共和国虚构网络安全局（并不存在）<br>
                    已检测到您的异常访问行为：<br>
                    <span style="color:#cc0000;">• 分数过低，涉嫌浪费教育资源</span><br>
                    <span style="color:#cc0000;">• IP地址已被临时标记</span><br>
                    <span style="color:#cc0000;">• 您的浏览记录已被截图（吓你的）</span>
                </p>
                <p style="color:#666;font-size:0.85rem;margin-top:1rem;">
                    案件编号：ZXF-2026-${Math.floor(Math.random()*999999).toString().padStart(6,'0')}<br>
                    处理状态：<span style="color:orange;">正在锁定嫌疑人...</span>
                </p>
                <p style="color:#666;font-size:0.8rem;margin-top:1rem;">（3秒后自动解除——假的，其实现在就没事）</p>
            </div>
        `;

        setTimeout(() => {
            window.alert('🚨 开个玩笑！你不是罪犯——但你是落榜生。这比罪犯还惨。');
            finish('pass');
        }, 3500);
    }
});

// ---- 挂载到全局，让 app.js 可以调用 ----
window.ChallengeManager = ChallengeManager;
console.log('🎯 张雪峰挑战引擎已加载！共注册 ' + ChallengeManager.registry.length + ' 个离谱验证挑战。');
