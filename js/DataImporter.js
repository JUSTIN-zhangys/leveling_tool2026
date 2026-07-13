// ============================================================
// 模块 7：数据快速录入 (DataImporter)
//   职责：粘贴文本自动解析并填入测量数据
//   依赖：DataManager, Calculator
//   对象：DataImporter
//   方法：handleGlobalPaste, parseText, fillForm, toggleEntry, fillSinglePoint
// ============================================================

const DataImporter = {
    /** 点名称映射表 */
    nameMap: {
        '前': 'front', 'front': 'front', 'f': 'front',
        '后': 'rear', 'rear': 'rear', 'back': 'rear', 'r': 'rear',
        '左': 'left', 'left': 'left', 'l': 'left',
        '右': 'right', 'right': 'right'
    },

    /** 默认点顺序（无标签时按此顺序） */
    defaultOrder: ['front', 'rear', 'left', 'right'],

    // ============================================================
    // 单点快速录入 — 每个测量点独立按钮 + 内联面板
    // ============================================================

    /** 切换某点的快速录入面板显示/隐藏 */
    toggleEntry(key) {
        const panel = document.getElementById(`qe-${key}`);
        if (!panel) return;
        const isHidden = panel.style.display === 'none' || !panel.style.display;
        document.querySelectorAll('.qe-panel').forEach(p => p.style.display = 'none');
        if (isHidden) {
            panel.style.display = 'flex';
            document.getElementById(`qe-${key}-input`).focus();
        }
    },

    /** 从单点面板读取文本并填入该点 X/Y/Z */
    fillSinglePoint(key) {
        const input = document.getElementById(`qe-${key}-input`);
        const panel = document.getElementById(`qe-${key}`);
        const status = document.getElementById('import-status');
        if (!input) return;

        const text = input.value.trim();
        if (!text) {
            status.innerHTML = `<div class="validation-box warn">⚠️ 请先粘贴坐标数据</div>`;
            return;
        }

        const data = this.parseText(text);
        if (!data || data.length === 0) {
            status.innerHTML = `<div class="validation-box warn">⚠️ 未能识别坐标，需包含 X/Y/Z 数值</div>`;
            return;
        }

        const d = data[0];
        const idMap = {
            front: { x: 'front_x', y: 'front_y', z: 'front_z' },
            rear:  { x: 'rear_x',  y: 'rear_y',  z: 'rear_z' },
            left:  { x: 'left_x',  y: 'left_y',  z: 'left_z' },
            right: { x: 'right_x', y: 'right_y', z: 'right_z' }
        };
        const ids = idMap[key];
        if (ids) {
            document.getElementById(ids.x).value = d.x;
            document.getElementById(ids.y).value = d.y;
            document.getElementById(ids.z).value = d.z;
        }

        panel.style.display = 'none';
        input.value = '';
        status.innerHTML = `<div class="validation-box ok">✅ ${key === 'front' ? '前' : key === 'rear' ? '后' : key === 'left' ? '左' : '右'} 点坐标已填入</div>`;
        calculate();
    },

    // ============================================================
    // JSON 文件导入 — 加载 AHK 采集的 coords_data.json
    // ============================================================

    /**
     * 从用户选择的 JSON 文件中加载坐标数据
     * 格式：{ "front": { "x": -726.30, "y": 45133.90, "z": 3298.80 }, ... }
     */
    loadJsonFile(event) {
        const file = event.target.files[0];
        const status = document.getElementById('import-status');
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                const idMap = {
                    front: { x: 'front_x', y: 'front_y', z: 'front_z' },
                    rear:  { x: 'rear_x',  y: 'rear_y',  z: 'rear_z' },
                    left:  { x: 'left_x',  y: 'left_y',  z: 'left_z' },
                    right: { x: 'right_x', y: 'right_y', z: 'right_z' }
                };

                let count = 0;
                for (const [key, ids] of Object.entries(idMap)) {
                    if (data[key] && data[key].x !== undefined) {
                        document.getElementById(ids.x).value = data[key].x;
                        document.getElementById(ids.y).value = data[key].y;
                        document.getElementById(ids.z).value = data[key].z;
                        count++;
                    }
                }

                status.innerHTML = `<div class="validation-box ok">✅ 已从 JSON 文件导入 ${count} 个测量点数据</div>`;

                // 重置 file input 以便重复选择同一文件
                event.target.value = '';
                calculate();
            } catch (err) {
                status.innerHTML = `<div class="validation-box warn">⚠️ JSON 解析失败：${err.message}</div>`;
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    },

    // ============================================================
    // 全局粘贴处理器 — 仅处理文本粘贴
    // ============================================================

    /**
     * 全局 paste 事件处理
     * 用户在页面任意位置 Ctrl+V 粘贴文本 → 自动解析并填入
     */
    handleGlobalPaste(event) {
        // 忽略图片粘贴
        for (const item of event.clipboardData.items) {
            if (item.type.startsWith('image/')) return;
        }

        // 纯文本粘贴 — 从 textarea 读取内容后解析
        const ta = document.getElementById('import-textarea');
        if (ta) {
            setTimeout(() => {
                const text = ta.value.trim();
                if (text) this.processText(text);
            }, 30);
        }
    },

    // ============================================================
    // 文本解析
    // ============================================================

    /** 处理粘贴的文本：解析 → 填入 → 计算 */
    processText(text) {
        const data = this.parseText(text);
        const status = document.getElementById('import-status');

        if (!data || data.length === 0) {
            status.innerHTML = `<div class="validation-box warn">⚠️ 未识别到坐标。需包含 X/Y/Z 数值，示例：前 X=-726.30 Y=45133.90 Z=3298.80</div>`;
            return;
        }

        const count = this.fillForm(data);
        status.innerHTML = `<div class="validation-box ok">✅ 已识别并填入 ${count} 个测量点（共 ${data.length} 行）</div>`;

        const ta = document.getElementById('import-textarea');
        if (ta) ta.value = text;

        calculate();
    },

    /**
     * 解析文本 → [{ pointName, x, y, z }, ...]
     * 支持格式：
     *   前 X=-726.30 Y=45133.90 Z=3298.80
     *   -726.30  45133.90  3298.80
     *   -726.30, 45133.90, 3298.80
     */
    parseText(text) {
        const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return null;

        const results = [];

        for (const line of lines) {
            let pointName = null;
            const clean = line.replace(/[：:]/g, ' ');

            // 识别点名称
            for (const [label, key] of Object.entries(this.nameMap)) {
                const re = new RegExp(`(?:^|[\\s,;|])${label}(?:[\\s:：=]|$)`, 'i');
                if (re.test(clean) && !pointName) pointName = key;
            }

            // 提取 X/Y/Z
            let x = null, y = null, z = null;

            const xM = clean.match(/[Xx]\s*[=:]\s*(-?\d+\.?\d*)/);
            const yM = clean.match(/[Yy]\s*[=:]\s*(-?\d+\.?\d*)/);
            const zM = clean.match(/[Zz]\s*[=:]\s*(-?\d+\.?\d*)/);
            if (xM) x = parseFloat(xM[1]);
            if (yM) y = parseFloat(yM[1]);
            if (zM) z = parseFloat(zM[1]);

            // 回退：提取所有数字
            if (x === null || y === null || z === null) {
                const nums = clean
                    .split(/[\s,;|\t]+/)
                    .map(v => parseFloat(v.replace(/[^-\d.]/g, '')))
                    .filter(v => !isNaN(v));
                if (x !== null && y === null) {
                    const rest = nums.filter(n => Math.abs(n - x) > 0.001);
                    y = rest[0] ?? null;
                    z = rest[1] ?? null;
                } else if (nums.length >= 3) {
                    if (x === null) x = nums[0];
                    if (y === null) y = nums[1];
                    if (z === null) z = nums[2];
                }
            }

            if (x !== null && y !== null && z !== null) {
                results.push({ pointName, x, y, z });
            }
        }

        return results.length > 0 ? results : null;
    },

    // ============================================================
    // 填入表单
    // ============================================================

    fillForm(dataList) {
        const idMap = {
            front: { x: 'front_x', y: 'front_y', z: 'front_z' },
            rear:  { x: 'rear_x',  y: 'rear_y',  z: 'rear_z' },
            left:  { x: 'left_x',  y: 'left_y',  z: 'left_z' },
            right: { x: 'right_x', y: 'right_y', z: 'right_z' }
        };

        let autoIdx = 0;
        let filled = 0;

        for (const d of dataList) {
            let key = d.pointName;
            if (!key && autoIdx < this.defaultOrder.length) key = this.defaultOrder[autoIdx++];
            if (key && idMap[key]) {
                const ids = idMap[key];
                document.getElementById(ids.x).value = d.x;
                document.getElementById(ids.y).value = d.y;
                document.getElementById(ids.z).value = d.z;
                filled++;
            }
        }
        return filled;
    }
};