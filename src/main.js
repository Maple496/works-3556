// src/main.js —— 入口：创建画布与 UI，装配 engine/ui，声明容器合同
// 纪律：mount 参数名固定 ctx；自建 2D 上下文只能叫 g；RAF/定时器句柄在 register 闭包变量上

var canvas = null;      // HTMLCanvasElement
var g = null;           // 2D 上下文（禁止叫 ctx）
var rafId = 0;          // RAF 句柄，destroy 里 cancel
var tickTimerId = 0;    // 兜底 setInterval 句柄（可选），destroy 里 clear
var boundsHandler = null; // ctx.onBounds 返回的解绑句柄（若平台提供）

function mount(ctx) {
  // 1. 创建画布，absolute 定位挂进 ctx.stage
  canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  canvas.style.top = '0';
  ctx.stage.appendChild(canvas);
  g = canvas.getContext('2d');

  // 2. 画布尺寸合同：初值 + onBounds 跟随（注册时平台会立即补发一次）
  canvas.width = ctx.bounds.w;
  canvas.height = ctx.bounds.h;
  boundsHandler = ctx.onBounds(function (b) {
    canvas.width = b.w;
    canvas.height = b.h;
    uiLayout(canvas.width, canvas.height); // 内部重排按钮热区
    renderFrame(g, canvas.width, canvas.height);
  });

  // 3. 装配：engine 初始化（含本轮次数持久状态）、ui 初始化
  engineInit();
  uiInit(canvas, g);

  // 4. 交互合同：pointer 事件承载主要操作（点按钮、切换状态），键盘作快捷方式
  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('keydown', onKey);
  canvas.style.touchAction = 'none';
  canvas.setAttribute('tabindex', '0');

  // 5. 主循环：RAF 驱动引擎步进 + 渲染
  function loop() {
    engineTick();
    renderFrame(g, canvas.width, canvas.height);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // 首帧引导由 ui 层绘制「点击 开始」提示
}

function onPointer(e) {
  if (!canvas) return;
  // 计算触点相对 canvas 的坐标（兼容 CSS 尺寸与画布像素尺寸不一致的情况）
  var rect = canvas.getBoundingClientRect();
  var scaleX = rect.width > 0 ? (canvas.width / rect.width) : 1;
  var scaleY = rect.height > 0 ? (canvas.height / rect.height) : 1;
  var x = (e.clientX - rect.left) * scaleX;
  var y = (e.clientY - rect.top) * scaleY;
  // 命中按钮热区则交给 ui 层处理（开始/暂停/重置等）
  uiHandleTap(x, y);
  if (g) renderFrame(g, canvas.width, canvas.height);
  canvas.focus();
}

function onKey(e) {
  if (!canvas) return;
  // 快捷键：空格=开始/暂停，R=重置；走 uiHandleTap 等价路径（点击按钮热区中心）
  var hot = null;
  if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
    hot = uiGetButtonCenter && uiGetButtonCenter('toggle');
  } else if (e.key === 'r' || e.key === 'R') {
    hot = uiGetButtonCenter && uiGetButtonCenter('reset');
  }
  if (!hot) return;
  e.preventDefault();
  uiHandleTap(hot.x, hot.y);
  if (g) renderFrame(g, canvas.width, canvas.height);
}

function destroy() {
  // 清理骨架：逐一 cancel/clear，只允许访问闭包变量与 this._xxx
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  if (tickTimerId) { clearInterval(tickTimerId); tickTimerId = 0; }
  if (typeof boundsHandler === 'function') { boundsHandler(); }
  boundsHandler = null;
  if (canvas) {
    canvas.removeEventListener('pointerdown', onPointer);
    canvas.removeEventListener('keydown', onKey);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  canvas = null;
  g = null;
}

Work.register({
  name: 'minimal-pomodoro',
  mount: mount,
  destroy: destroy
});
