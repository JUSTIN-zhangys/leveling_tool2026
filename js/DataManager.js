// ============================================================
// 模块 2：数据管理 (DataManager)
//   职责：读取/解析输入、数据校验、重置默认值
//   依赖：MathUtils (triangleArea)
//   函数：parseInput, readPoints, readPivots, validateInputs,
//         getMeasureKeys, resetData
// ============================================================

/** 从 DOM 读取数值 */
function parseInput(id) {
    return parseFloat(document.getElementById(id).value);
}

/** 读取四个测量点的坐标和高度 */
function readPoints() {
    return {
        front: { name: '前', x: parseInput('front_x'), y: parseInput('front_y'), z: parseInput('front_z') },
        rear:  { name: '后', x: parseInput('rear_x'),  y: parseInput('rear_y'),  z: parseInput('rear_z') },
        left:  { name: '左', x: parseInput('left_x'),  y: parseInput('left_y'),  z: parseInput('left_z') },
        right: { name: '右', x: parseInput('right_x'), y: parseInput('right_y'), z: parseInput('right_z') }
    };
}

/** 读取三个支点的坐标 */
function readPivots() {
    return {
        A: { x: parseInput('pivotA_x'), y: parseInput('pivotA_y') },
        B: { x: parseInput('pivotB_x'), y: parseInput('pivotB_y') },
        C: { x: parseInput('pivotC_x'), y: parseInput('pivotC_y') }
    };
}

/** 校验输入数据完整性 */
function validateInputs(points, pivots) {
    const errBox = document.getElementById('error-box');
    const measureKeys = ['front', 'rear', 'left', 'right'];
    for (const key of measureKeys) {
        const p = points[key];
        if ([p.x, p.y, p.z].some(v => isNaN(v))) {
            errBox.innerHTML = `<div class="error-box">⚠️ "${points[key].name}" 点数据不完整，请检查所有坐标和高度</div>`;
            return false;
        }
    }
    for (const key of ['A', 'B', 'C']) {
        const p = pivots[key];
        if ([p.x, p.y].some(v => isNaN(v))) {
            errBox.innerHTML = `<div class="error-box">⚠️ 支点 ${key} 坐标不完整</div>`;
            return false;
        }
    }
    const totalArea = triangleArea(pivots.A, pivots.B, pivots.C);
    if (totalArea < 100) {
        errBox.innerHTML = `<div class="error-box">⚠️ 三个支点几乎共线，无法构成三角形支撑，请检查支点坐标</div>`;
        return false;
    }
    return true;
}

/** 获取测量点 key 列表 */
function getMeasureKeys() {
    return ['front', 'rear', 'left', 'right'];
}

/** 重置所有输入为默认值 */
function resetData() {
    document.getElementById('front_x').value = -726.3;
    document.getElementById('front_y').value = 45133.9;
    document.getElementById('front_z').value = 3298.8;
    document.getElementById('rear_x').value = -726.26;
    document.getElementById('rear_y').value = 75134;
    document.getElementById('rear_z').value = 3291.4;
    document.getElementById('left_x').value = -35726.26;
    document.getElementById('left_y').value = 60133.4;
    document.getElementById('left_z').value = 3293.423;
    document.getElementById('right_x').value = 34273.72;
    document.getElementById('right_y').value = 60133.995;
    document.getElementById('right_z').value = 3292.4;
    document.getElementById('pivotA_x').value = -80726.28;
    document.getElementById('pivotA_y').value = 93467.15;
    document.getElementById('pivotB_x').value = 79273.72;
    document.getElementById('pivotB_y').value = 93467.15;
    document.getElementById('pivotC_x').value = -726.28;
    document.getElementById('pivotC_y').value = -6532.85;

    // 重置平台 B 的数据缓存
    platformData.B = null;
    currentPlatform = 'A';
    document.querySelectorAll('.platform-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.platform === 'A');
    });

    calculate();
}

// ============================================================
// 双平台管理（A/B 独立数据，平台 B 为 X 轴镜像）
// ============================================================

/** 当前激活的平台 */
let currentPlatform = 'A';

/** 两个平台的数据缓存 */
const platformData = { A: null, B: null };

/**
 * 从表单读取当前所有坐标数据
 * 返回：{ points: { front:{x,y,z}, ... }, pivots: { A:{x,y}, B:{x,y}, C:{x,y} } }
 */
function readFormData() {
    return {
        points: readPoints(),
        pivots: readPivots()
    };
}

/**
 * 将数据写入表单
 */
function writeFormData(data) {
    if (!data) return;
    const { points, pivots } = data;
    for (const [key, p] of Object.entries(points)) {
        document.getElementById(`${key}_x`).value = p.x;
        document.getElementById(`${key}_y`).value = p.y;
        document.getElementById(`${key}_z`).value = p.z;
    }
    for (const [key, p] of Object.entries(pivots)) {
        document.getElementById(`pivot${key}_x`).value = p.x;
        document.getElementById(`pivot${key}_y`).value = p.y;
    }
}

/**
 * 将某份数据做 Y 轴镜像（X 不变，Y 取反）
 */
function mirrorDataY(data) {
    const mirrored = {
        points: {},
        pivots: {}
    };
    for (const [key, p] of Object.entries(data.points)) {
        mirrored.points[key] = { x: p.x, y: -p.y, z: p.z };
    }
    for (const [key, p] of Object.entries(data.pivots)) {
        mirrored.pivots[key] = { x: p.x, y: -p.y };
    }
    return mirrored;
}

/**
 * 切换到指定平台
 */
function switchPlatform(platform) {
    if (platform === currentPlatform) return;

    // 保存当前平台数据
    platformData[currentPlatform] = readFormData();

    // 如果目标平台有缓存数据，直接加载
    if (platformData[platform]) {
        writeFormData(platformData[platform]);
    } else {
        // 平台 B 首次切换：从平台 A 镜像
        if (platform === 'B') {
            const source = platformData['A'] || readFormData();
            platformData['B'] = mirrorDataY(source);
            writeFormData(platformData['B']);
        }
    }

    currentPlatform = platform;

    // 更新 Tab 样式
    document.querySelectorAll('.platform-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.platform === platform);
    });

    calculate();
}