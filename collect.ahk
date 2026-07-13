; ============================================================
; collect.ahk — SalusEVOEUI 坐标采集助手
;   用途：在 SalusEVOEUI 中按快捷键采集测量点坐标
;        自动组合后粘贴到浏览器调平工具
;   用法：
;     1. 安装 AutoHotkey (https://www.autohotkey.com/)
;     2. 双击运行 collect.ahk
;     3. 在 SalusEVOEUI 中逐行选中坐标，按对应快捷键
;     4. 采集完成自动切换到浏览器并粘贴
; ============================================================

#NoEnv
#Warn
SendMode Input
SetWorkingDir %A_ScriptDir%

; ========== 配置 ==========

; 浏览器进程名（如不生效会自动检测其他浏览器）
BrowserExe := "chrome.exe"

; 日志文件路径
LogFile := A_ScriptDir . "\coords_log.txt"

; JSON 数据文件（网页工具可通过"导入"按钮加载）
DataFile := A_ScriptDir . "\coords_data.json"

; ========== 全局变量 ==========

points := {front:"", rear:"", left:"", right:""}
pn := {front:"前 (Front)", rear:"后 (Rear)", left:"左 (Left)", right:"右 (Right)"}

; ========== 快捷键 ==========

; Ctrl+Shift+1 ~ 4 → 采集对应的点
^+1:: CollectPoint("front")
^+2:: CollectPoint("rear")
^+3:: CollectPoint("left")
^+4:: CollectPoint("right")

; Ctrl+Shift+0 → 手动粘贴（自动切换失败时用）
^+0:: PasteToBrowser()

; F12 → 查看采集状态
F12:: ShowStatus()

; ========== 函数 ==========

; 采集单个点
CollectPoint(key) {
    global points, pn, LogFile

    oldClip := ClipboardAll
    Clipboard := ""

    Send ^c
    ClipWait, 1

    if (ErrorLevel || Clipboard = "") {
        TrayTip 采集失败, 请先选中坐标数据再按快捷键, 2, 3
        Clipboard := oldClip
        return
    }

    rawText := Clipboard
    points[key] := rawText
    TrayTip % "已采集 " . pn[key], % rawText, 2, 1

    ; 追加日志
    timestamp := A_YYYY "-" A_MM "-" A_DD " " A_Hour ":" A_Min ":" A_Sec
    FileAppend % "[" timestamp "] " pn[key] " : " rawText "`n", %LogFile%

    Clipboard := oldClip

    ; 检查是否全部采集完成
    allDone := true
    for k, v in points {
        if (v = "") {
            allDone := false
            break
        }
    }

    if (allDone) {
        Sleep 500
        TrayTip 采集完成, 四个点已全部采集，正在粘贴到浏览器..., 3, 1
        Sleep 300
        SaveDataFile()
        PasteToBrowser()
    }
}

; 粘贴到浏览器
PasteToBrowser() {
    global points, BrowserExe

    ; 组装数据（与网页工具粘贴解析格式一致）
    combined := "前 " . points["front"] . "`n"
              . "后 " . points["rear"] . "`n"
              . "左 " . points["left"] . "`n"
              . "右 " . points["right"]
    Clipboard := combined
    ClipWait, 1
    Sleep 200

    ; 按优先级尝试切换浏览器窗口
    browsers := [BrowserExe, "msedge.exe", "firefox.exe", "brave.exe"
               , "opera.exe", "360chrome.exe", "QQBrowser.exe", "sogouexplorer.exe"]
    found := false
    for i, exe in browsers {
        if WinExist("ahk_exe " . exe) {
            WinActivate
            Sleep 300
            found := true
            break
        }
    }

    if (!found) {
        MsgBox 48, 未找到浏览器
            , 请手动切换到浏览器窗口，然后按 Ctrl+V 粘贴。`n`n采集数据已复制到剪贴板。
        return
    }

    Send ^v
    Sleep 200
    TrayTip 已粘贴, 坐标数据已粘贴到浏览器工具, 2, 1
}

; 保存 JSON 数据文件
SaveDataFile() {
    global points, DataFile, front_x, front_y, front_z, rear_x, rear_y, rear_z, left_x, left_y, left_z, right_x, right_y, right_z

    ParseCoords("front")
    ParseCoords("rear")
    ParseCoords("left")
    ParseCoords("right")

    json = 
(
{
  "front": { "x": %front_x%, "y": %front_y%, "z": %front_z% },
  "rear":  { "x": %rear_x%, "y": %rear_y%, "z": %rear_z% },
  "left":  { "x": %left_x%, "y": %left_y%, "z": %left_z% },
  "right": { "x": %right_x%, "y": %right_y%, "z": %right_z% }
}
)
    FileDelete %DataFile%
    FileAppend %json%, %DataFile%
    TrayTip 数据已保存, 已保存到 %DataFile%, 2, 1
}

; 从指定点的文本中提取 X/Y/Z → 存入全局 front_x 等变量
ParseCoords(key) {
    global points, front_x, front_y, front_z, rear_x, rear_y, rear_z, left_x, left_y, left_z, right_x, right_y, right_z
    text := points[key]
    x := "", y := "", z := ""

    ; 尝试 X=值 Y=值 Z=值 格式
    match := ""
    if RegExMatch(text, "[Xx]\s*[=:]\s*(-?\d+\.?\d*)", match)
        x := match1
    if RegExMatch(text, "[Yy]\s*[=:]\s*(-?\d+\.?\d*)", match)
        y := match1
    if RegExMatch(text, "[Zz]\s*[=:]\s*(-?\d+\.?\d*)", match)
        z := match1

    ; 回退：取所有数字的前三个
    if (x = "" or y = "" or z = "") {
        nums := []
        pos := 1
        while (pos := RegExMatch(text, "-?\d+\.?\d*", match, pos + StrLen(match))) {
            nums.Push(match)
        }
        if (nums.Length() >= 3) {
            if (x = "") x := nums[1]
            if (y = "") y := nums[2]
            if (z = "") z := nums[3]
        }
    }

    ; 只设置当前 key 对应的全局变量
    if (key = "front")
        front_x := x, front_y := y, front_z := z
    else if (key = "rear")
        rear_x := x, rear_y := y, rear_z := z
    else if (key = "left")
        left_x := x, left_y := y, left_z := z
    else if (key = "right")
        right_x := x, right_y := y, right_z := z
}

; 显示当前采集状态
ShowStatus() {
    global points, pn
    status := "当前采集状态：`n`n"
    cnt := 0
    for k, v in points {
        if (v != "") {
            status .= "[✓] " . pn[k] . " : " . v . "`n"
            cnt++
        } else {
            status .= "[ ] " . pn[k] . " (未采集)`n"
        }
    }
    status .= "`n共 " . cnt . " / 4 个点"
    MsgBox 64, 坐标采集状态, %status%
}

; ========== 启动提示 ==========
TrayTip SalusEVOEUI 采集助手已启动
    , 快捷键：`n  Ctrl+Shift+1 → 前点`n  Ctrl+Shift+2 → 后点`n  Ctrl+Shift+3 → 左点`n  Ctrl+Shift+4 → 右点`n  Ctrl+Shift+0 → 手动粘贴`n  F12 → 查看状态
    , 5, 1