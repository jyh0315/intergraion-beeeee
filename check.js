// 답안 해석 & 채점 (math.js 사용)
const math = window.math;

const FUNCS = [
  "pi", "e", "sqrt", "cbrt", "log", "exp", "abs",
  "sin", "cos", "tan", "sec", "csc", "cot", "asin", "acos", "atan", "sinh", "cosh", "tanh",
];

export function normalize(raw) {
  return String(raw)
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\barctan\b/g, "atan")
    .replace(/\barcsin\b/g, "asin")
    .replace(/\barccos\b/g, "acos")
    .replace(/ln/g, "log")
    // xe^x, xsinx, 2xlnx 처럼 붙여 쓴 곱셈
    .replace(/(?<![a-z])x(?=e\^|e\b|sin|cos|tan|sec|log|sqrt|exp|pi|asin|atan)/g, "x*")
    // ln2 → log(2), sqrt3 → sqrt(3), sinx → sin(x)
    .replace(/(?<![a-z])(log|sqrt|cbrt|sin|cos|tan|sec)\s*(\d+|pi|x)(?![\w(.])/g, "$1($2)")
    .replace(/\s+/g, " ")
    .trim();
}

// 식만 해석 (값 계산 X). vars: 허용할 변수 (부정적분은 x, C)
export function parseAnswer(raw, vars = []) {
  let s = normalize(raw);
  if (vars.length) s = s.replace(/\+\s*C\s*$/, "").trim(); // 끝의 +C는 무시
  if (!s) return { error: "답을 입력하세요" };
  if (/\.\d{3,}/.test(s)) return { error: "소수 말고 정확한 값(분수, π, ln, √ …)으로 입력하세요" };
  let node;
  try { node = math.parse(s); } catch { return { error: "수식을 해석할 수 없어요" }; }
  const allowed = new Set([...FUNCS, ...vars]);
  const bad = node.filter((n) => n.isSymbolNode && !allowed.has(n.name));
  if (bad.length) {
    const name = bad[0].name;
    return { error: name === "x" ? "이 문제는 숫자 값으로 답해요" : `알 수 없는 기호: ${name}` };
  }
  if (node.filter((n) => n.isAssignmentNode || n.isFunctionAssignmentNode || n.isBlockNode).length)
    return { error: "수식을 해석할 수 없어요" };
  return { node, tex: node.toTex({ parenthesis: "auto" }) };
}

const varsFor = (prob) => (prob?.type === "i" ? ["x", "C"] : []);
export const previewAnswer = (raw, prob) => parseAnswer(raw, varsFor(prob));

const close = (u, v) => Math.abs(u - v) <= 1e-7 * Math.max(1, Math.abs(v));
const real = (v) => typeof v === "number" && isFinite(v);

export function checkAnswer(raw, prob) {
  const r = parseAnswer(raw, varsFor(prob));
  if (r.error) return r;
  if (prob.type !== "i") {
    let v;
    try { v = r.node.evaluate({}); } catch { return { error: "계산할 수 없는 식이에요" }; }
    if (!real(v)) return { error: "실수 값이 아니에요" };
    return { correct: close(v, math.evaluate(normalize(prob.ans))) };
  }
  // 부정적분: 구간 안 여러 점에서 F(x)-F(x0)가 정답 원시함수와 같은지 확인 (적분상수 무관)
  const F = r.node.compile(), A = math.compile(normalize(prob.ans));
  const [lo, hi] = prob.dom;
  const xs = [0.07, 0.29, 0.51, 0.73, 0.94].map((t) => lo + (hi - lo) * t);
  try {
    const f = xs.map((x) => F.evaluate({ x, C: 0 }));
    const a = xs.map((x) => A.evaluate({ x }));
    if (!f.every(real)) return { correct: false };
    return { correct: xs.every((_, i) => close(f[i] - f[0], a[i] - a[0])) };
  } catch {
    return { error: "계산할 수 없는 식이에요" };
  }
}
