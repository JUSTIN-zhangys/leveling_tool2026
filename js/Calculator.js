// ============================================================
// 模块 3：算法计算 (Calculator)
//   职责：调平算法的核心逻辑（C 点固定，A/B 可调）
//   依赖：MathUtils, DataManager, UIRenderer, SVGDrawer
//   函数：calculate, describeFitQuality
// ============================================================

/** 主计算入口 */
function calculate() {
    const errBox = document.getElementById('error-box');
    errBox.innerHTML = '';

    // 1. 读取数据
    const points = readPoints();
    const pivots = readPivots();

    // 2. 校验
    if (!validateInputs(points, pivots)) return;

    const measureKeys = getMeasureKeys();
    const measureData = measureKeys.map(k => points[k]);
    const zValues = measureData.map(p => p.z);
    const zMean = zValues.reduce((s, v) => s + v, 0) / zValues.length;

    // 3. 计算重心坐标 + 三角形位置校验
    const barycentric = {};
    const validations = [];
    for (const key of measureKeys) {
        const p = points[key];
        const inside = isPointInTriangle(p, pivots.A, pivots.B, pivots.C);
        const [alpha, beta, gamma] = barycentricCoords(p, pivots.A, pivots.B, pivots.C);
        barycentric[key] = { alpha, beta, gamma };
        validations.push({ name: p.name, inside, minCoord: Math.min(alpha, beta, gamma) });
    }

    // 4. 外插警告
    const outsidePoints = validations.filter(v => !v.inside || v.minCoord < -0.3);
    const valArea = document.getElementById('validation-area');
    if (outsidePoints.length > 0) {
        valArea.innerHTML = `<div class="validation-box warn">
            ⚠️ <strong>${outsidePoints.map(v => v.name).join('、')}</strong> 点在支点三角形外部（重心坐标出现负值），属于外插，可能导致误差增大。建议调整支点坐标使其包围所有测量点。
        </div>`;
    } else {
        valArea.innerHTML = `<div class="validation-box ok">
            ✅ 所有测量点均在支点三角形内部，重心坐标全部为正，计算精度良好。
        </div>`;
    }

    // 5. 核心求解：C 固定，仅 A/B 可调
    //    模型：高度变化 = α·ΔA + β·ΔB （γ·ΔC = 0）
    //    去中心化后形成 2×2 正规方程，使调整后四点方差最小
    const alphas = measureKeys.map(k => barycentric[k].alpha);
    const betas  = measureKeys.map(k => barycentric[k].beta);
    const meanAlpha = alphas.reduce((s, v) => s + v, 0) / alphas.length;
    const meanBeta  = betas.reduce((s, v) => s + v, 0) / betas.length;

    let s_aa = 0, s_ab = 0, s_bb = 0, s_az = 0, s_bz = 0;
    for (let i = 0; i < measureKeys.length; i++) {
        const a = alphas[i] - meanAlpha;
        const b = betas[i] - meanBeta;
        const z = zValues[i] - zMean;
        s_aa += a * a;
        s_ab += a * b;
        s_bb += b * b;
        s_az += a * z;
        s_bz += b * z;
    }

    const det = s_aa * s_bb - s_ab * s_ab;
    if (Math.abs(det) < 1e-15) {
        errBox.innerHTML = `<div class="error-box">⚠️ 求解失败：A/B 权重在各测量点之间线性相关，无法解出独立的 ΔA 和 ΔB。</div>`;
        return;
    }
    const deltaA = (-s_az * s_bb + s_bz * s_ab) / det;
    const deltaB = (s_az * s_ab - s_bz * s_aa) / det;
    const deltaC = 0;

    // 6. 预测高度
    const predictions = {};
    const adjustedHeights = measureKeys.map(k => {
        const bc = barycentric[k];
        return points[k].z + deltaA * bc.alpha + deltaB * bc.beta;
    });
    const adjustedMean = adjustedHeights.reduce((s, v) => s + v, 0) / adjustedHeights.length;

    // 7. 残差分析
    const residuals = {};
    for (let i = 0; i < measureKeys.length; i++) {
        predictions[measureKeys[i]] = adjustedHeights[i];
        residuals[measureKeys[i]] = adjustedHeights[i] - adjustedMean;
    }

    // 8. 拟合统计量
    const ssTot = zValues.reduce((s, z) => s + (z - zMean) ** 2, 0);
    const ssRes = measureKeys.reduce((s, k) => s + residuals[k] ** 2, 0);
    const rSquared = ssTot > 1e-15 ? 1 - (ssRes / ssTot) : 1.0;
    const rmse = Math.sqrt(ssRes / measureKeys.length);
    const maxResidual = Math.max(...measureKeys.map(k => Math.abs(residuals[k])));

    // 9. 平整度指标
    const frontRearDiff = Math.abs(points.front.z - points.rear.z);
    const leftRightDiff = Math.abs(points.left.z - points.right.z);
    const predFrontRearDiff = Math.abs(predictions.front - predictions.rear);
    const predLeftRightDiff = Math.abs(predictions.left - predictions.right);

    const fitQualityText = describeFitQuality(rSquared, rmse, maxResidual);

    // 10. 渲染所有 UI 模块
    UIRenderer.renderPivotCards(pivots, deltaA, deltaB, deltaC, adjustedMean);
    UIRenderer.renderHeightTable(points, predictions, residuals, adjustedMean);
    UIRenderer.renderBarycentricTable(points, barycentric);
    UIRenderer.renderDiffStats(frontRearDiff, leftRightDiff, predFrontRearDiff, predLeftRightDiff);
    UIRenderer.renderStatusBanner(frontRearDiff, leftRightDiff, predFrontRearDiff, predLeftRightDiff, rSquared, maxResidual);
    SVGDrawer.drawDiagram(pivots, points);
}

/** 返回拟合质量等级描述 */
function describeFitQuality(r2, rmse, maxRes) {
    if (r2 > 0.99 && maxRes < 5.0) return { level: 'excellent', text: '非常优秀' };
    if (r2 > 0.95 && maxRes < 10.0) return { level: 'good', text: '良好' };
    if (r2 > 0.85 && maxRes < 20.0) return { level: 'fair', text: '一般' };
    return { level: 'poor', text: '偏差较大，建议复测' };
}