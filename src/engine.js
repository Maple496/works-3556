// src/engine.js —— 状态与计时逻辑：工作 25min / 休息 5min 状态机，本轮次数计数
// 不触碰 DOM，只暴露纯状态接口，由 main/ui 驱动

var STATE_WORK = 'work';     // 25 分钟专注
var STATE_BREAK = 'break';   // 5 分钟休息
var STATE_IDLE = 'idle';     // 未开始

var pomoState = {
  phase: STATE_IDLE,   // 当前阶段
  running: false,      // 是否计时中
  remainMs: 0,         // 本阶段剩余毫秒
  rounds: 0,           // 已完成工作轮数
  lastTs: 0            // 上次 tick 时间戳（RAF 传入）
};

var WORK_MS = 25 * 60 * 1000;
var BREAK_MS = 5 * 60 * 1000;

// engineInit —— 重置全部状态：idle、remainMs=WORK_MS、rounds=0
function engineInit() {
  pomoState.phase = STATE_IDLE;
  pomoState.running = false;
  pomoState.remainMs = WORK_MS;
  pomoState.rounds = 0;
  pomoState.lastTs = 0;
}

// engineToggle —— 开始/暂停切换；idle 首次开始进入 work 计时
function engineToggle() {
  if (pomoState.running) {
    pomoState.running = false;
    pomoState.lastTs = 0;
    return;
  }
  if (pomoState.phase === STATE_IDLE) {
    pomoState.phase = STATE_WORK;
    if (pomoState.remainMs <= 0) pomoState.remainMs = WORK_MS;
  }
  if (pomoState.remainMs <= 0) {
    pomoState.remainMs = (pomoState.phase === STATE_BREAK) ? BREAK_MS : WORK_MS;
  }
  pomoState.lastTs = 0;
  pomoState.running = true;
}

// engineReset —— 重置当前阶段计时；不清空轮数
function engineReset() {
  pomoState.running = false;
  pomoState.lastTs = 0;
  pomoState.remainMs = (pomoState.phase === STATE_BREAK) ? BREAK_MS : WORK_MS;
}

// engineTick —— 每帧调用：running 时扣减 remainMs；归零时阶段切换
//   work 完成 -> rounds+1 -> 进入 break；break 完成 -> 回到 work；自动暂停等待用户开始
function engineTick(ts) {
  if (!pomoState.running) {
    pomoState.lastTs = 0;
    return;
  }
  if (!pomoState.lastTs) {
    pomoState.lastTs = ts;
    return;
  }
  var delta = ts - pomoState.lastTs;
  if (delta < 0) delta = 0;
  pomoState.lastTs = ts;

  pomoState.remainMs -= delta;
  if (pomoState.remainMs > 0) return;

  // 阶段切换：本阶段结束，溢出的毫秒不带入下一阶段
  pomoState.remainMs = 0;
  if (pomoState.phase === STATE_WORK) {
    pomoState.rounds += 1;
    pomoState.phase = STATE_BREAK;
    pomoState.remainMs = BREAK_MS;
  } else {
    pomoState.phase = STATE_WORK;
    pomoState.remainMs = WORK_MS;
  }
  pomoState.running = false;
  pomoState.lastTs = 0;
}

// engineSnapshot —— 返回只读快照 {phase, running, remainMs, rounds, mm, ss}
function engineSnapshot() {
  var totalSec = Math.ceil(pomoState.remainMs / 1000);
  if (totalSec < 0) totalSec = 0;
  var mm = Math.floor(totalSec / 60);
  var ss = totalSec % 60;
  return {
    phase: pomoState.phase,
    running: pomoState.running,
    remainMs: pomoState.remainMs,
    rounds: pomoState.rounds,
    mm: mm,
    ss: ss
  };
}
