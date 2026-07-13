// ============================================================
// 模块 5：SVG 绘图 (SVGDrawer)
//   职责：绘制平台布局示意图（支点三角形 + 测量点）
//   对象：SVGDrawer
//   方法：drawDiagram
// ============================================================
const SVGDrawer = {
    drawDiagram(pivots, points) {
        const svg = document.getElementById('diagram');

        const allXs = [pivots.A.x, pivots.B.x, pivots.C.x, points.front.x, points.rear.x, points.left.x, points.right.x];
        const allYs = [pivots.A.y, pivots.B.y, pivots.C.y, points.front.y, points.rear.y, points.left.y, points.right.y];

        const minX = Math.min(...allXs);
        const maxX = Math.max(...allXs);
        const minY = Math.min(...allYs);
        const maxY = Math.max(...allYs);

        const rangeX = Math.max(maxX - minX, 10000);
        const rangeY = Math.max(maxY - minY, 10000);
        const marginX = rangeX * 0.2;
        const marginY = rangeY * 0.2;

        const vbX = minX - marginX;
        const vbY = minY - marginY;
        const vbW = rangeX + 2 * marginX;
        const vbH = rangeY + 2 * marginY;

        svg.setAttribute('viewBox', `${vbX} ${-vbY - vbH} ${vbW} ${vbH}`);

        const textSize = Math.max(vbW, vbH) * 0.03;
        const pivotR = Math.max(vbW, vbH) * 0.012;
        const pointR = Math.max(vbW, vbH) * 0.008;

        let content = `
            <rect x="${minX - marginX}" y="${-(maxY + marginY)}" width="${vbW}" height="${vbH}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="${textSize*0.3}" stroke-dasharray="${textSize},${textSize*0.5}" opacity="0.4"/>
            <polygon points="${pivots.A.x},${-pivots.A.y} ${pivots.B.x},${-pivots.B.y} ${pivots.C.x},${-pivots.C.y}" fill="#e0e7ff" fill-opacity="0.35" stroke="#6366f1" stroke-width="${textSize*0.5}" stroke-dasharray="${textSize*1.5},${textSize*0.5}"/>
            <line x1="${vbX}" y1="0" x2="${vbX+vbW}" y2="0" stroke="#94a3b8" stroke-width="${textSize*0.25}" opacity="0.3"/>
            <line x1="0" y1="${-vbY-vbH}" x2="0" y2="${-vbY}" stroke="#94a3b8" stroke-width="${textSize*0.25}" opacity="0.3"/>
        `;

        for (const key of ['A', 'B', 'C']) {
            const p = pivots[key];
            content += `<circle cx="${p.x}" cy="${-p.y}" r="${pivotR}" fill="#ef4444" stroke="white" stroke-width="${pivotR*0.35}"/>`;
            content += `<circle cx="${p.x}" cy="${-p.y}" r="${pivotR*0.5}" fill="white"/>`;
            content += `<text x="${p.x}" y="${-p.y + pivotR*0.3}" fill="#ef4444" font-size="${textSize}" font-weight="bold" text-anchor="middle" font-family="Arial,sans-serif">${key}</text>`;
            content += `<text x="${p.x}" y="${-p.y - pivotR*1.8}" fill="#334155" font-size="${textSize*0.55}" text-anchor="middle" font-family="Consolas,monospace">(${p.x.toFixed(0)}, ${p.y.toFixed(0)})</text>`;
        }

        for (const key of ['front', 'rear', 'left', 'right']) {
            const p = points[key];
            content += `<circle cx="${p.x}" cy="${-p.y}" r="${pointR}" fill="#22c55e" stroke="white" stroke-width="${pointR*0.35}"/>`;
            content += `<text x="${p.x}" y="${-p.y - pointR*1.8}" fill="#166534" font-size="${textSize*0.75}" font-weight="600" text-anchor="middle" font-family="Arial,sans-serif">${p.name}</text>`;
            content += `<text x="${p.x}" y="${-p.y + pointR*3.5}" fill="#475569" font-size="${textSize*0.45}" text-anchor="middle" font-family="Consolas,monospace">Z=${p.z.toFixed(2)}μm</text>`;
        }

        content += `<text x="${vbX + vbW*0.02}" y="${-vbY - vbH + textSize*1.5}" fill="#475569" font-size="${textSize*0.6}" font-family="Arial,sans-serif">Y ↑</text>`;
        content += `<text x="${vbX + vbW - textSize*2}" y="${-vbY - textSize}" fill="#475569" font-size="${textSize*0.6}" font-family="Arial,sans-serif">X →</text>`;

        svg.innerHTML = content;
    }
};