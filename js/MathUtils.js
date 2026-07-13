// ============================================================
// 模块 1：核心数学工具 (MathUtils)
//   职责：提供底层几何与矩阵运算，不依赖 DOM
//   函数：triangleArea, signedTriangleArea, isPointInTriangle,
//         barycentricCoords, transpose, multiplyMatrices,
//         multiplyVector, solveLinearSystem
// ============================================================

/** 三角形面积（绝对值，正值） */
function triangleArea(p1, p2, p3) {
    return Math.abs(
        (p2.x - p1.x) * (p3.y - p1.y) -
        (p3.x - p1.x) * (p2.y - p1.y)
    ) / 2;
}

/** 有符号三角形面积（用于重心坐标计算） */
function signedTriangleArea(p1, p2, p3) {
    return (
        (p2.x - p1.x) * (p3.y - p1.y) -
        (p3.x - p1.x) * (p2.y - p1.y)
    ) / 2;
}

/** 判断点 p 是否在三角形 a-b-c 内部 */
function isPointInTriangle(p, a, b, c) {
    const total = triangleArea(a, b, c);
    if (total < 1e-6) return false;
    const a1 = triangleArea(p, b, c);
    const a2 = triangleArea(p, a, c);
    const a3 = triangleArea(p, a, b);
    const diff = Math.abs(total - (a1 + a2 + a3));
    const tol = total * 0.001;
    return diff < tol;
}

/** 计算点 p 在三角形 a-b-c 中的重心坐标 [alpha, beta, gamma] */
function barycentricCoords(p, a, b, c) {
    const totalArea = signedTriangleArea(a, b, c);
    if (Math.abs(totalArea) < 1e-10) return [0, 0, 0];
    const alpha = signedTriangleArea(p, b, c) / totalArea;
    const beta = signedTriangleArea(p, a, c) / totalArea;
    const gamma = 1 - alpha - beta;
    return [alpha, beta, gamma];
}

/** 矩阵转置 */
function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/** 矩阵乘法 A × B */
function multiplyMatrices(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
            result[i][j] = 0;
            for (let k = 0; k < a[0].length; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    return result;
}

/** 矩阵 × 向量 */
function multiplyVector(matrix, vector) {
    return matrix.map(row => {
        let sum = 0;
        for (let i = 0; i < row.length; i++) {
            sum += row[i] * vector[i];
        }
        return sum;
    });
}

/** 高斯消元求解线性系统 Ax = b（列主元） */
function solveLinearSystem(A, b) {
    const n = A.length;
    const mat = A.map((row, i) => [...row, b[i]]);
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(mat[j][i]) > Math.abs(mat[max][i])) max = j;
        }
        [mat[i], mat[max]] = [mat[max], mat[i]];
        if (Math.abs(mat[i][i]) < 1e-12) return null;
        for (let j = i + 1; j < n; j++) {
            const factor = mat[j][i] / mat[i][i];
            for (let k = i; k <= n; k++) {
                mat[j][k] -= factor * mat[i][k];
            }
        }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += mat[i][j] * x[j];
        }
        x[i] = (mat[i][n] - sum) / mat[i][i];
    }
    return x;
}