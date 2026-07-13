// ============================================================
// 模块 6：应用初始化 (AppInit)
//   职责：页面加载后的初始化行为 + 移动端体验优化
//   依赖：Calculator, DataImporter
// ============================================================

/**
 * 检测当前是否为移动设备
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
}

window.addEventListener('DOMContentLoaded', function() {
    calculate();

    // 注册全局粘贴监听：用户 Ctrl+V 自动识别并填入坐标
    document.addEventListener('paste', function(event) {
        // 移动端：如果粘贴发生在 import-textarea 外，直接从 clipboardData 读取
        if (isMobile() && event.clipboardData && event.clipboardData.types) {
            const ta = document.getElementById('import-textarea');
            const active = document.activeElement;
            // 仅当焦点不在输入框内时才拦截
            if (active !== ta && active && active.tagName !== 'TEXTAREA' && active.type !== 'number') {
                const text = event.clipboardData.getData('text');
                if (text && text.trim()) {
                    event.preventDefault();
                    if (ta) ta.value = text;
                    DataImporter.processText(text);
                }
            }
        } else {
            DataImporter.handleGlobalPaste(event);
        }
    });

    // ============================================================
    // 移动端：防止输入框被键盘遮挡
    // ============================================================
    if (isMobile()) {
        const inputs = document.querySelectorAll('input[type="number"], textarea');
        inputs.forEach(function(el) {
            // 聚焦时延迟滚动到可视区域
            el.addEventListener('focus', function() {
                setTimeout(function() {
                    if (el.scrollIntoView) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }, false);
        });

        // iOS 键盘弹出后调整视口
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.addEventListener('blur', function() {
                setTimeout(function() {
                    window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
                }, 200);
            });
        }

        // 给快速录入 textarea 添加长按提示（移动端无 Ctrl+V）
        const ta = document.getElementById('import-textarea');
        if (ta) {
            ta.placeholder = '📱 在此长按粘贴坐标数据（一行一点）\n支持：前 X=-726.30 Y=45133.90 Z=3298.80\n或纯数字：-726.30  45133.90  3298.80';
        }
    }
});
