// 답안 해석 & 채점 (math.js 사용)
const math = window.math;

const ALLOWED = new Set([
  "pi", "e", "sqrt", "cbrt", "log", "exp", "abs",
  "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh",
]);

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
    .replace(/\bln\b/g, "log")
    .replace(/\bln(?=\d|pi)/g, "log")
    // ln2 → log(2), sqrt3 → sqrt(3), sqrt pi → sqrt(pi)
    .replace(/\b(log|sqrt|cbrt|sin|cos|tan)\s*(\d+|pi)(?![\w(.])/g, "$1($2)")
    .trim();
}

export function evaluate(raw) {
  const s = normalize(raw);
  if (!s) return { error: "답을 입력하세요" };
  if (/\.\d{3,}/.test(s)) return { error: "소수 말고 정확한 값(분수, π, ln, √ …)으로 입력하세요" };
  let node;
  try { node = math.parse(s); } catch { return { error: "수식을 해석할 수 없어요" }; }
  const bad = node.filter((n) => n.isSymbolNode && !ALLOWED.has(n.name));
  if (bad.length) return { error: `알 수 없는 기호: ${bad[0].name}` };
  if (node.filter((n) => n.isAssignmentNode || n.isFunctionAssignmentNode || n.isBlockNode).length)
    return { error: "수식을 해석할 수 없어요" };
  let v;
  try { v = node.evaluate({}); } catch { return { error: "계산할 수 없는 식이에요" }; }
  if (typeof v !== "number" || !isFinite(v)) return { error: "실수 값이 아니에요" };
  return { value: v, tex: node.toTex({ parenthesis: "auto" }) };
}

export function checkAnswer(raw, ans) {
  const r = evaluate(raw);
  if (r.error) return r;
  const a = math.evaluate(normalize(ans));
  return { ...r, correct: Math.abs(r.value - a) <= 1e-9 * Math.max(1, Math.abs(a)) };
}
