// src/ui.js —— 界面渲染：纯 canvas 绘制（无外部样式/图片），按钮热区支持触屏点击

var uiButtons = []; // 按钮热区数组：{id, x, y, w, h, label}
var uiInteracted = false; // 是否已有交互（用于首帧引导）
var uiToggleLabel = '开始'; // toggle 按钮当前文案

function uiInit(canvas, g) {
  uiLayout(canvas.width, canvas.height);
  renderFrame(g, canvas.width, canvas.height);
}

function uiLayout(w, h) {
  var btnW = Math.min(180, Math.max(110, w * 0.28));
  var btnH = 52;
  var gap = 20;
  var total = btnW * 2 + gap;
  var bx = (w - total) / 2;
  var by = h - btnH - 28;
  uiButtons = [
    { id: 'toggle', x: bx, y: by, w: btnW, h: btnH, label: '开始' },
    { id: 'reset', x: bx + btnW + gap, y: by, w: btnW, h: btnH, label: '重置' }
  ];
}

function uiHandleTap(x, y) {
  uiInteracted = true;
  for (var i = 0; i < uiButtons.length; i++) {
    var b = uiButtons[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.id === 'toggle') engineToggle();
      else if (b.id === 'reset') engineReset();
      return true;
    }
  }
  return false;
}

function _uiRoundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function renderFrame(g, w, h) {
  if (!g) return;
  var s = engineSnapshot();

  // 清屏 + 双色背景：工作/休息
  var isWork = (s.phase === 'work');
  var bg = s.phase === 'idle' ? '#1c2230' : (isWork ? '#26324a' : '#1f3a33');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  var accent = isWork ? '#ff7a59' : '#4fd1a5';
  var textMain = '#eef2f7';
  var textDim = 'rgba(238,242,247,0.6)';

  // 阶段标签
  var phaseLabel = s.phase === 'idle' ? '准备开始' : (isWork ? '专注中' : '休息中');
  g.fillStyle = accent;
  g.font = 'bold 22px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(phaseLabel, w / 2, h * 0.22);

  // 大号等宽时间 mm:ss 居中
  var timeText = (s.mm < 10 ? '0' : '') + s.mm + ':' + (s.ss < 10 ? '0' : '') + s.ss;
  g.fillStyle = textMain;
  g.font = 'bold ' + Math.floor(Math.min(w * 0.22, h * 0.28)) + 'px "Courier New", monospace';
  g.fillText(timeText, w / 2, h * 0.42);

  // 轮数徽标：圆点 + 文案
  var rounds = s.rounds || 0;
  var dotX = w / 2 - (Math.max(rounds, 1) * 12 - 4) / 2;
  var dotY = h * 0.58;
  if (rounds > 0) {
    g.fillStyle = accent;
    for (var i = 0; i < rounds && i < 12; i++) {
      g.beginPath();
      g.arc(dotX + i * 12, dotY, 4, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = textDim;
  g.font = '14px sans-serif';
  g.fillText('已完成 ' + rounds + ' 轮', w / 2, dotY + 24);

  // 按钮绘制（圆角矩形 + label），running 时 toggle 显示「暂停」
  uiToggleLabel = s.running ? '暂停' : '开始';
  for (var j = 0; j < uiButtons.length; j++) {
    var b = uiButtons[j];
    var isToggle = (b.id === 'toggle');
    g.fillStyle = isToggle ? accent : 'rgba(255,255,255,0.12)';
    _uiRoundRect(g, b.x, b.y, b.w, b.h, 14);
    g.fill();
    g.strokeStyle = isToggle ? 'transparent' : textDim;
    if (!isToggle) {
      g.lineWidth = 1;
      g.stroke();
    }
    g.fillStyle = isToggle ? '#10151f' : textMain;
    g.font = 'bold 18px sans-serif';
    g.fillText(isToggle ? uiToggleLabel : b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }

  // 首帧引导：idle 且未交互
  if (s.phase === 'idle' && !uiInteracted) {
    g.fillStyle = 'rgba(238,242,247,0.85)';
    g.font = '16px sans-serif';
    g.fillText('点击画面或按空格开始', w / 2, h * 0.72);
  }
}
