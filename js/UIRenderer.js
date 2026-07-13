// ============================================================
// 模块 4：UI 渲染 (UIRenderer)
//   职责：将计算结果渲染到 DOM
//   依赖：DataManager (getMeasureKeys)
//   对象：UIRenderer
//   方法：renderPivotCards, renderHeightTable, renderBarycentricTable,
//         renderDiffStats, renderFitQuality, renderStatusBanner
// ============================================================
const UIRenderer = {
    renderPivotCards(pivots, deltaA, deltaB, deltaC, targetZ) {
        const makeCard = (key, coord, delta, isFixed) => {
            if (isFixed) {
                return `
                    <div style="background:linear-gradient(135deg,#f8fafc,#e2e8f0);border:1px solid #cbd5e1;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;position:relative;">
                        <div style="font-size:13px;font-weight:600;color:#475569;display:flex;align-items:center;justify-content:space-between;">
                            <span>支点 ${key}</span>
                            <span style="font-size:10px;background:#64748b;color:white;padding:2px 8px;border-radius:4px;font-weight:500;">固定</span>
                        </div>
                        <div style="font-size:11px;color:#64748b;font-family:Consolas,monospace;">(${coord.x.toFixed(0)}, ${coord.y.toFixed(0)})</div>
                        <div style="font-size:26px;font-weight:700;color:#475569;letter-spacing:-0.5px;line-height:1.1;margin-top:2px;">0.000</div>
                        <div style="font-size:11px;color:#64748b;font-weight:500;">μm · 锁定不动</div>
                    </div>
                `;
            }
            const isRise = delta >= 0;
            const mainColor = isRise ? '#16a34a' : '#dc2626';
            const bgColor = isRise ? '#f0fdf4' : '#fef2f2';
            const borderColor = isRise ? '#bbf7d0' : '#fecaca';
            const arrow = isRise ? '▲' : '▼';
            const sign = delta >= 0 ? '+' : '';
            return `
                <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;position:relative;">
                    <div style="font-size:13px;font-weight:600;color:${mainColor};display:flex;align-items:center;justify-content:space-between;">
                        <span>支点 ${key}</span>
                        <span style="font-size:10px;background:${mainColor};color:white;padding:2px 8px;border-radius:4px;font-weight:500;">${isRise ? '升高' : '降低'}</span>
                    </div>
                    <div style="font-size:11px;color:#64748b;font-family:Consolas,monospace;">(${coord.x.toFixed(0)}, ${coord.y.toFixed(0)})</div>
                    <div style="font-size:28px;font-weight:700;color:${mainColor};letter-spacing:-0.5px;line-height:1.1;margin-top:2px;">${sign}${delta.toFixed(3)}</div>
                    <div style="font-size:12px;color:${mainColor};font-weight:600;display:flex;align-items:center;gap:4px;">
                        <span>${arrow}</span>
                        <span>${Math.abs(delta).toFixed(2)} μm</span>
                    </div>
                </div>
            `;
        };
        const html = [
            `<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;">
                <div style="font-size:13px;font-weight:600;color:#3730a3;display:flex;align-items:center;gap:6px;">
                    <span style="font-size:18px;">🔧</span>
                    <span>C 点固定 · 仅调整 A、B</span>
                </div>
                <div style="font-size:11px;color:#4338ca;line-height:1.5;">刚性平台绕 C 点倾斜，最小化四点高度方差</div>
                <div style="font-size:22px;font-weight:700;color:#3730a3;letter-spacing:-0.5px;line-height:1.1;margin-top:4px;">${targetZ.toFixed(3)}</div>
                <div style="font-size:11px;color:#4338ca;font-weight:500;">对齐后均值 μm</div>
            </div>`,
            makeCard('A', pivots.A, deltaA, false),
            makeCard('B', pivots.B, deltaB, false),
            makeCard('C', pivots.C, 0, true)
        ].join('');
        const container = document.getElementById('pivot-cards');
        container.innerHTML = html;
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(4, 1fr)';
        container.style.gap = '12px';
        container.style.alignItems = 'stretch';
    },

    renderHeightTable(points, predictions, residuals, targetZ) {
        const measureKeys = getMeasureKeys();
        let html = `<table>
            <tr>
                <th>测量点</th>
                <th>坐标 (X, Y)</th>
                <th>当前高度 Z (μm)</th>
                <th>调整后预测 (μm)</th>
                <th>变化量 (μm)</th>
                <th>距均值 (μm)</th>
            </tr>`;
        for (const key of measureKeys) {
            const p = points[key];
            const pred = predictions[key];
            const delta = pred - p.z;
            const res = residuals[key];
            const resColor = Math.abs(res) < 0.1 ? '#64748b' : (Math.abs(res) < 0.3 ? '#d97706' : '#dc2626');
            html += `<tr>
                <td><strong>${p.name}</strong></td>
                <td style="font-family:Consolas,monospace;font-size:12px;">(${p.x.toFixed(1)}, ${p.y.toFixed(1)})</td>
                <td>${p.z.toFixed(3)}</td>
                <td>${pred.toFixed(3)}</td>
                <td style="color:${Math.abs(delta) < 0.01 ? '#64748b' : (delta >= 0 ? '#16a34a' : '#dc2626')}; font-weight:600;">
                    ${delta >= 0 ? '+' : ''}${delta.toFixed(3)}
                </td>
                <td style="color:${resColor}; font-weight:600;">
                    ${res >= 0 ? '+' : ''}${res.toFixed(3)}
                </td>
            </tr>`;
        }
        html += `<tr style="background:#f8fafc;font-weight:600;">
            <td>平均值</td>
            <td>-</td>
            <td>-</td>
            <td style="color:#3730a3;">${targetZ.toFixed(3)}</td>
            <td>-</td>
            <td>0.000</td>
        </tr></table>`;
        document.getElementById('height-table').innerHTML = html;
    },

    renderBarycentricTable(points, barycentric) {
        const measureKeys = getMeasureKeys();
        let html = `<table>
            <tr>
                <th>测量点</th>
                <th>α (对支点 A 的权重)</th>
                <th>β (对支点 B 的权重)</th>
                <th>γ (对支点 C 的权重)</th>
                <th>α + β + γ</th>
            </tr>`;
        for (const key of measureKeys) {
            const p = points[key];
            const bc = barycentric[key];
            const sum = bc.alpha + bc.beta + bc.gamma;
            const hasNeg = bc.alpha < 0 || bc.beta < 0 || bc.gamma < 0;
            const rowColor = hasNeg ? '#fef3c7' : 'white';
            html += `<tr style="background:${rowColor};">
                <td><strong>${p.name}</strong></td>
                <td style="font-family:Consolas,monospace;color:${bc.alpha < 0 ? '#dc2626' : '#1e293b'};">${bc.alpha.toFixed(4)}</td>
                <td style="font-family:Consolas,monospace;color:${bc.beta < 0 ? '#dc2626' : '#1e293b'};">${bc.beta.toFixed(4)}</td>
                <td style="font-family:Consolas,monospace;color:${bc.gamma < 0 ? '#dc2626' : '#1e293b'};">${bc.gamma.toFixed(4)}</td>
                <td style="font-family:Consolas,monospace;color:#64748b;">${sum.toFixed(4)}</td>
            </tr>`;
        }
        html += '</table>';
        const hasNeg = Object.values(barycentric).some(bc => bc.alpha < 0 || bc.beta < 0 || bc.gamma < 0);
        html += `<div style="font-size:12px;color:#64748b;margin-top:8px;padding:8px 12px;background:#f1f5f9;border-radius:6px;line-height:1.6;">
            <strong>解读：</strong>由于 <strong>C 点固定 (ΔC = 0)</strong>，只有 α 和 β 两项影响调整结果。例如 α=0.4000 意味着支点 A 调整 1 μm，该测量点变化约 0.4 μm。γ 虽显示但不参与计算。
            ${hasNeg ? '<br>⚠️ <strong style="color:#dc2626;">出现负值</strong>表示该测量点在三角形外部，属于外插，精度下降。' : '<br>✅ 所有权重为正，测量点均在三角形内部，内插精度最佳。'}
        </div>`;
        document.getElementById('barycentric-table').innerHTML = html;
    },

    renderDiffStats(currFR, currLR, predFR, predLR) {
        const threshold = 10.0;
        const makeBox = (title, curr, pred) => {
            const cls = pred < threshold ? 'good' : 'warn';
            const statusText = pred < threshold ? '✅ 预测达标' : `⚠️ 仍需调整 (超 ${(pred - threshold).toFixed(3)} μm)`;
            const improvement = curr - pred;
            const pct = curr > 0 ? ((improvement / curr) * 100).toFixed(1) : '0.0';
            return `
                <div class="diff-box ${cls}">
                    <div class="label">${title}</div>
                    <div class="value">${curr.toFixed(3)} → ${pred.toFixed(3)} μm</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">改善量 ${improvement.toFixed(3)} μm (${pct}%)</div>
                    <div class="status">${statusText}</div>
                </div>
            `;
        };
        document.getElementById('diff-stats').innerHTML =
            makeBox('前后差 Front-Rear', currFR, predFR) +
            makeBox('左右差 Left-Right', currLR, predLR);
    },

    renderFitQuality(r2, rmse, maxRes, zMean, fitQualityText) {
        const level = fitQualityText.level;
        const colors = {
            excellent: { bg: '#dcfce7', border: '#86efac', text: '#166534', icon: '✅' },
            good: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', icon: '✅' },
            fair: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', icon: '📊' },
            poor: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: '⚠️' }
        };
        const c = colors[level] || colors.poor;
        const levels = [
            { key: 'excellent', label: '非常优秀', min: 0.99 },
            { key: 'good', label: '良好', min: 0.95 },
            { key: 'fair', label: '一般', min: 0.85 },
            { key: 'poor', label: '偏差较大', min: 0 }
        ];
        let barHtml = levels.map(l => {
            const isActive = l.key === level;
            const fill = isActive ? c.border : '#e2e8f0';
            const textColor = isActive ? c.text : '#94a3b8';
            return `<div style="flex:1;padding:6px 8px;text-align:center;background:${fill};border-radius:6px;font-weight:${isActive?'700':'400'};color:${textColor};font-size:12px;transition:all 0.2s;border:${isActive?'2px solid '+c.border:'2px solid transparent'};">${l.label}</div>`;
        }).join('');

        const html = `
            <div style="background:${c.bg};border:2px solid ${c.border};border-radius:12px;padding:16px 18px;margin:10px 0;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                    <span style="font-size:22px;">${c.icon}</span>
                    <div>
                        <div style="font-weight:700;color:${c.text};font-size:16px;">拟合质量：${fitQualityText.text}</div>
                        <div style="font-size:12px;color:${c.text};opacity:0.8;">平面拟合评估</div>
                    </div>
                </div>
                <div style="display:flex;gap:6px;margin-bottom:12px;">${barHtml}</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                    <div style="background:rgba(255,255,255,0.7);padding:10px;border-radius:8px;text-align:center;">
                        <div style="font-size:11px;color:${c.text};opacity:0.7;">决定系数 R²</div>
                        <div style="font-size:20px;font-weight:700;color:${c.text};font-family:Consolas,monospace;">${r2.toFixed(4)}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.7);padding:10px;border-radius:8px;text-align:center;">
                        <div style="font-size:11px;color:${c.text};opacity:0.7;">均方根误差 RMSE</div>
                        <div style="font-size:20px;font-weight:700;color:${c.text};font-family:Consolas,monospace;">${rmse.toFixed(4)} μm</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.7);padding:10px;border-radius:8px;text-align:center;">
                        <div style="font-size:11px;color:${c.text};opacity:0.7;">最大残差</div>
                        <div style="font-size:20px;font-weight:700;color:${c.text};font-family:Consolas,monospace;">${maxRes.toFixed(4)} μm</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('fit-quality').innerHTML = html;
    },

    renderStatusBanner(currFR, currLR, predFR, predLR, r2, maxRes) {
        const banner = document.getElementById('status-banner');
        const diffThreshold = 10.0;
        const currOk = currFR < diffThreshold && currLR < diffThreshold;
        const predOk = predFR < diffThreshold && predLR < diffThreshold;
        const fitOk = r2 > 0.95 && maxRes < 10.0;

        let html;
        if (currOk) {
            html = `<div class="status-banner good">✅ 当前平整度已达标！预测值也在阈值内。当前：前后差=${currFR.toFixed(3)}, 左右差=${currLR.toFixed(3)} μm</div>`;
        } else if (predOk && fitOk) {
            html = `<div class="status-banner warn">📊 当前超差（前后差=${currFR.toFixed(3)}, 左右差=${currLR.toFixed(3)} μm），按推荐调整后<strong>预测可达标</strong>（调整后残差 &lt; ${maxRes.toFixed(3)} μm，R²=${r2.toFixed(4)}）</div>`;
        } else if (predOk && !fitOk) {
            html = `<div class="status-banner warn">⚠️ 按推荐调整后预测差值达标（前后差=${predFR.toFixed(3)}, 左右差=${predLR.toFixed(3)} μm），但拟合质量一般（R²=${r2.toFixed(4)}, 最大残差=${maxRes.toFixed(3)} μm），建议调整后复测以验证。</div>`;
        } else {
            html = `<div class="status-banner error">⚠️ 即使按推荐调整后仍可能超差（预测：前后差=${predFR.toFixed(3)}, 左右差=${predLR.toFixed(3)} μm）。请检查测量数据是否正确，或考虑更精确的测量；如 R² 较低说明平台可能有非线性变形，三点调整无法完全消除。</div>`;
        }
        banner.innerHTML = html;
    }
};