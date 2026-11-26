// 문제 은행
// 정적분: ["d", 분류, 문제 LaTeX, 피적분함수, 아래끝, 위끝, 정답(math.js 식), 정답 LaTeX]
// 부정적분: ["i", 분류, 문제 LaTeX, 피적분함수, 원시함수(math.js 식), 원시함수 LaTeX, [채점 구간]]
// 정답은 모두 수치적분/수치미분으로 검증됨 (tools/verify)

const RAW = {
  easy: [
    ["d", "기본", "\\int_0^1 x^3\\,dx", "x^3", "0", "1", "1/4", "\\frac14"],
    ["d", "기본", "\\int_0^1 (2x+1)\\,dx", "2x+1", "0", "1", "2", "2"],
    ["d", "기본", "\\int_1^2 (3x^2-2x)\\,dx", "3x^2-2x", "1", "2", "4", "4"],
    ["d", "기본", "\\int_0^4 \\sqrt{x}\\,dx", "sqrt(x)", "0", "4", "16/3", "\\frac{16}{3}"],
    ["d", "기본", "\\int_1^2 \\left(x^2+\\frac{1}{x^2}\\right)dx", "x^2+1/x^2", "1", "2", "17/6", "\\frac{17}{6}"],
    ["d", "지수·로그", "\\int_1^{e} \\frac{1}{x}\\,dx", "1/x", "1", "e", "1", "1"],
    ["d", "지수·로그", "\\int_0^1 e^x\\,dx", "exp(x)", "0", "1", "e-1", "e-1"],
    ["d", "지수·로그", "\\int_0^{\\ln 2} e^{2x}\\,dx", "exp(2x)", "0", "log(2)", "3/2", "\\frac32"],
    ["d", "지수·로그", "\\int_0^1 2^x\\,dx", "2^x", "0", "1", "1/ln(2)", "\\frac{1}{\\ln 2}"],
    ["d", "삼각함수", "\\int_0^{\\pi} \\sin x\\,dx", "sin(x)", "0", "pi", "2", "2"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\cos x\\,dx", "cos(x)", "0", "pi/2", "1", "1"],
    ["d", "삼각함수", "\\int_0^{\\pi/4} \\sec^2 x\\,dx", "sec(x)^2", "0", "pi/4", "1", "1"],
    ["d", "삼각함수", "\\int_0^{\\pi} \\cos^2 x\\,dx", "cos(x)^2", "0", "pi", "pi/2", "\\frac{\\pi}{2}"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sin 2x\\,dx", "sin(2x)", "0", "pi/2", "1", "1"],
    ["d", "역삼각함수", "\\int_0^1 \\frac{1}{1+x^2}\\,dx", "1/(1+x^2)", "0", "1", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "역삼각함수", "\\int_0^{1/2} \\frac{1}{\\sqrt{1-x^2}}\\,dx", "1/sqrt(1-x^2)", "0", "1/2", "pi/6", "\\frac{\\pi}{6}"],
    ["d", "치환", "\\int_0^1 x e^{x^2}\\,dx", "x*exp(x^2)", "0", "1", "(e-1)/2", "\\frac{e-1}{2}"],
    ["d", "절댓값", "\\int_0^2 |x-1|\\,dx", "abs(x-1)", "0", "2", "1", "1"],
    ["d", "대칭", "\\int_{-1}^{1} (x^5+\\sin x)\\,dx", "x^5+sin(x)", "-1", "1", "0", "0"],
    ["d", "이상적분", "\\int_1^{\\infty} \\frac{1}{x^2}\\,dx", "1/x^2", "1", "inf", "1", "1"],
    ["i", "기본", "\\int x^2\\,dx", "x^2", "x^3/3", "\\frac{x^3}{3}", [-2, 2]],
    ["i", "기본", "\\int (4x^3+2x)\\,dx", "4x^3+2x", "x^4+x^2", "x^4+x^2", [-2, 2]],
    ["i", "기본", "\\int \\frac{1}{\\sqrt{x}}\\,dx", "1/sqrt(x)", "2sqrt(x)", "2\\sqrt{x}", [0.5, 4]],
    ["i", "삼각함수", "\\int \\cos x\\,dx", "cos(x)", "sin(x)", "\\sin x", [-2, 2]],
    ["i", "삼각함수", "\\int \\sec^2 x\\,dx", "sec(x)^2", "tan(x)", "\\tan x", [-1, 1]],
    ["i", "지수·로그", "\\int e^{3x}\\,dx", "exp(3x)", "exp(3x)/3", "\\frac{e^{3x}}{3}", [-1, 1]],
    ["i", "지수·로그", "\\int \\frac{1}{x}\\,dx\\quad(x>0)", "1/x", "log(x)", "\\ln x", [0.5, 4]],
  ],
  normal: [
    ["d", "부분적분", "\\int_0^1 x e^x\\,dx", "x*exp(x)", "0", "1", "1", "1"],
    ["d", "부분적분", "\\int_1^{e} \\ln x\\,dx", "log(x)", "1", "e", "1", "1"],
    ["d", "부분적분", "\\int_0^{\\pi/2} x\\sin x\\,dx", "x*sin(x)", "0", "pi/2", "1", "1"],
    ["d", "부분적분", "\\int_0^{\\pi} x\\cos x\\,dx", "x*cos(x)", "0", "pi", "-2", "-2"],
    ["d", "부분적분", "\\int_1^{e} (\\ln x)^2\\,dx", "log(x)^2", "1", "e", "e-2", "e-2"],
    ["d", "부분적분", "\\int_0^1 x^2 e^x\\,dx", "x^2*exp(x)", "0", "1", "e-2", "e-2"],
    ["d", "부분적분", "\\int_0^1 \\arctan x\\,dx", "atan(x)", "0", "1", "pi/4 - ln(2)/2", "\\frac{\\pi}{4}-\\frac{\\ln 2}{2}"],
    ["d", "부분적분", "\\int_0^1 x\\arctan x\\,dx", "x*atan(x)", "0", "1", "pi/4 - 1/2", "\\frac{\\pi}{4}-\\frac12"],
    ["d", "부분적분", "\\int_0^1 x\\ln x\\,dx", "x*log(x)", "0", "1", "-1/4", "-\\frac14"],
    ["d", "부분적분", "\\int_0^{\\pi/2} e^x\\cos x\\,dx", "exp(x)*cos(x)", "0", "pi/2", "(e^(pi/2)-1)/2", "\\frac{e^{\\pi/2}-1}{2}"],
    ["d", "치환", "\\int_0^1 \\frac{x}{1+x^2}\\,dx", "x/(1+x^2)", "0", "1", "ln(2)/2", "\\frac{\\ln 2}{2}"],
    ["d", "치환", "\\int_0^1 x\\sqrt{1+x^2}\\,dx", "x*sqrt(1+x^2)", "0", "1", "(2sqrt(2)-1)/3", "\\frac{2\\sqrt2-1}{3}"],
    ["d", "치환", "\\int_1^2 \\frac{2x+3}{x^2+3x}\\,dx", "(2x+3)/(x^2+3x)", "1", "2", "ln(5/2)", "\\ln\\frac52"],
    ["d", "치환", "\\int_0^{\\pi/2} \\frac{\\sin x}{(1+\\cos x)^2}\\,dx", "sin(x)/(1+cos(x))^2", "0", "pi/2", "1/2", "\\frac12"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sin^3 x\\,dx", "sin(x)^3", "0", "pi/2", "2/3", "\\frac23"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sin^2 x\\cos x\\,dx", "sin(x)^2*cos(x)", "0", "pi/2", "1/3", "\\frac13"],
    ["d", "삼각함수", "\\int_0^{\\pi/3} \\tan x\\,dx", "tan(x)", "0", "pi/3", "ln(2)", "\\ln 2"],
    ["d", "부분분수", "\\int_0^1 \\frac{1}{x^2+3x+2}\\,dx", "1/(x^2+3x+2)", "0", "1", "ln(4/3)", "\\ln\\frac43"],
    ["d", "부분분수", "\\int_2^3 \\frac{1}{x^2-1}\\,dx", "1/(x^2-1)", "2", "3", "ln(3/2)/2", "\\frac12\\ln\\frac32"],
    ["d", "삼각치환", "\\int_0^1 \\sqrt{1-x^2}\\,dx", "sqrt(1-x^2)", "0", "1", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "이상적분", "\\int_0^{\\infty} e^{-x}\\sin x\\,dx", "exp(-x)*sin(x)", "0", "inf", "1/2", "\\frac12"],
    ["d", "이상적분", "\\int_0^{\\infty} x e^{-x}\\,dx", "x*exp(-x)", "0", "inf", "1", "1"],
    ["d", "이상적분", "\\int_1^{\\infty} \\frac{1}{x(x+1)}\\,dx", "1/(x*(x+1))", "1", "inf", "ln(2)", "\\ln 2"],
    ["i", "부분적분", "\\int x e^x\\,dx", "x*exp(x)", "(x-1)exp(x)", "(x-1)e^x", [-2, 2]],
    ["i", "부분적분", "\\int \\ln x\\,dx", "log(x)", "x*log(x)-x", "x\\ln x - x", [0.5, 4]],
    ["i", "부분적분", "\\int x\\cos x\\,dx", "x*cos(x)", "x*sin(x)+cos(x)", "x\\sin x+\\cos x", [-2, 2]],
    ["i", "치환", "\\int 2x\\cos(x^2)\\,dx", "2x*cos(x^2)", "sin(x^2)", "\\sin(x^2)", [-1.5, 1.5]],
    ["i", "치환", "\\int \\frac{x}{x^2+1}\\,dx", "x/(x^2+1)", "log(x^2+1)/2", "\\frac12\\ln(x^2+1)", [-2, 2]],
    ["i", "삼각함수", "\\int \\tan x\\,dx\\quad(|x|<\\tfrac{\\pi}{2})", "tan(x)", "-log(cos(x))", "-\\ln(\\cos x)", [-1, 1]],
    ["i", "부분분수", "\\int \\frac{1}{x^2-1}\\,dx\\quad(x>1)", "1/(x^2-1)", "log((x-1)/(x+1))/2", "\\frac12\\ln\\frac{x-1}{x+1}", [1.5, 4]],
  ],
  hard: [
    ["d", "대칭", "\\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x+\\cos x}\\,dx", "sin(x)/(sin(x)+cos(x))", "0", "pi/2", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "대칭", "\\int_0^{\\pi/2} \\frac{1}{1+\\tan^{\\sqrt2} x}\\,dx", "1/(1+tan(x)^sqrt(2))", "0", "pi/2", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "대칭", "\\int_{-1}^{1} \\frac{1}{(1+e^x)(1+x^2)}\\,dx", "1/((1+exp(x))*(1+x^2))", "-1", "1", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "대칭", "\\int_0^{\\pi} \\frac{x\\sin x}{1+\\cos^2 x}\\,dx", "x*sin(x)/(1+cos(x)^2)", "0", "pi", "pi^2/4", "\\frac{\\pi^2}{4}"],
    ["d", "대칭", "\\int_0^{\\pi} \\frac{x}{1+\\sin x}\\,dx", "x/(1+sin(x))", "0", "pi", "pi", "\\pi"],
    ["d", "대칭", "\\int_0^{\\pi/4} \\ln(1+\\tan x)\\,dx", "log(1+tan(x))", "0", "pi/4", "pi*ln(2)/8", "\\frac{\\pi\\ln 2}{8}"],
    ["d", "대칭", "\\int_0^1 \\frac{\\ln(1+x)}{1+x^2}\\,dx", "log(1+x)/(1+x^2)", "0", "1", "pi*ln(2)/8", "\\frac{\\pi\\ln 2}{8}"],
    ["d", "대칭", "\\int_0^{\\infty} \\frac{\\ln x}{1+x^2}\\,dx", "log(x)/(1+x^2)", "0", "inf", "0", "0"],
    ["d", "급수", "\\int_0^{\\infty} \\frac{x}{e^x-1}\\,dx", "x/(exp(x)-1)", "0", "inf", "pi^2/6", "\\frac{\\pi^2}{6}"],
    ["d", "급수", "\\int_0^{\\infty} \\frac{x^3}{e^x-1}\\,dx", "x^3/(exp(x)-1)", "0", "inf", "pi^4/15", "\\frac{\\pi^4}{15}"],
    ["d", "급수", "\\int_0^1 \\frac{\\ln x}{1-x}\\,dx", "log(x)/(1-x)", "0", "1", "-pi^2/6", "-\\frac{\\pi^2}{6}"],
    ["d", "급수", "\\int_0^1 \\frac{\\ln(1+x)}{x}\\,dx", "log(1+x)/x", "0", "1", "pi^2/12", "\\frac{\\pi^2}{12}"],
    ["d", "급수", "\\int_0^1 \\ln x\\,\\ln(1-x)\\,dx", "log(x)*log(1-x)", "0", "1", "2 - pi^2/6", "2-\\frac{\\pi^2}{6}"],
    ["d", "특수", "\\int_0^{\\pi/2} \\ln(\\sin x)\\,dx", "log(sin(x))", "0", "pi/2", "-pi*ln(2)/2", "-\\frac{\\pi\\ln 2}{2}"],
    ["d", "특수", "\\int_0^{\\pi/2} \\frac{x}{\\tan x}\\,dx", "x/tan(x)", "0", "pi/2", "pi*ln(2)/2", "\\frac{\\pi\\ln 2}{2}"],
    ["d", "특수", "\\int_0^{\\infty} e^{-x^2}\\,dx", "exp(-x^2)", "0", "inf", "sqrt(pi)/2", "\\frac{\\sqrt{\\pi}}{2}"],
    ["d", "특수", "\\int_0^1 \\frac{x-1}{\\ln x}\\,dx", "(x-1)/log(x)", "0", "1", "ln(2)", "\\ln 2"],
    ["d", "유리함수", "\\int_0^1 \\frac{x^4(1-x)^4}{1+x^2}\\,dx", "x^4*(1-x)^4/(1+x^2)", "0", "1", "22/7 - pi", "\\frac{22}{7}-\\pi"],
    ["d", "유리함수", "\\int_0^{\\infty} \\frac{1}{1+x^4}\\,dx", "1/(1+x^4)", "0", "inf", "pi/(2sqrt(2))", "\\frac{\\pi}{2\\sqrt2}"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sqrt{\\tan x}\\,dx", "sqrt(tan(x))", "0", "pi/2", "pi/sqrt(2)", "\\frac{\\pi}{\\sqrt2}"],
    ["d", "삼각함수", "\\int_0^{2\\pi} \\frac{1}{2+\\cos x}\\,dx", "1/(2+cos(x))", "0", "2pi", "2pi/sqrt(3)", "\\frac{2\\pi}{\\sqrt3}"],
    ["i", "삼각함수", "\\int \\sec x\\,dx\\quad(|x|<\\tfrac{\\pi}{2})", "sec(x)", "log(sec(x)+tan(x))", "\\ln(\\sec x+\\tan x)", [-1.2, 1.2]],
    ["i", "부분적분", "\\int e^x\\sin x\\,dx", "exp(x)*sin(x)", "exp(x)(sin(x)-cos(x))/2", "\\frac{e^x(\\sin x-\\cos x)}{2}", [-2, 2]],
    ["i", "삼각치환", "\\int \\sqrt{1-x^2}\\,dx", "sqrt(1-x^2)", "(x*sqrt(1-x^2)+asin(x))/2", "\\frac{x\\sqrt{1-x^2}+\\arcsin x}{2}", [-0.9, 0.9]],
    ["i", "치환", "\\int \\frac{1}{1+e^x}\\,dx", "1/(1+exp(x))", "x-log(1+exp(x))", "x-\\ln(1+e^x)", [-2, 2]],
  ],
};

function build(d, row, i) {
  if (row[0] === "d") {
    const [, cat, tex, f, a, b, ans, ansTex] = row;
    return { id: `${d}:${i}`, diff: d, type: "d", cat, tex, f, a, b, ans, ansTex };
  }
  const [, cat, tex, f, ans, ansTex, dom] = row;
  return { id: `${d}:${i}`, diff: d, type: "i", cat, tex, f, ans, ansTex: `${ansTex}+C`, dom };
}

export const PROBLEMS = Object.fromEntries(
  Object.entries(RAW).map(([d, rows]) => [d, rows.map((r, i) => build(d, r, i))])
);
/* ---------------- 숫자 랜덤 변형 문제 ----------------
   같은 시드면 모두에게 같은 문제가 나옴. id 형식: "g:템플릿:시드" */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
// 기약분수: s = math.js 식, t = LaTeX
function fr(p, q = 1) {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q) || 1; p /= g; q /= g;
  const neg = p < 0 ? "-" : "", ap = Math.abs(p);
  return { p, q, s: q === 1 ? `${p}` : `${p}/${q}`, t: q === 1 ? `${p}` : `${neg}\\frac{${ap}}{${q}}` };
}
// 계수 표기: 1 → "", 분수 → \frac{}{}
const co = (f) => (f.p === f.q ? "" : f.t);
const cn = (n) => (n === 1 ? "" : `${n}`);
const pw = (n) => (n === 1 ? "" : `^{${n}}`);
const piOver = (n) => (n === 1 ? "\\pi" : `\\frac{\\pi}{${n}}`);
const piOverS = (n) => (n === 1 ? "pi" : `pi/${n}`);
const lnFrac = (num, den) => { const g = gcd(num, den); num /= g; den /= g;
  return den === 1 ? { s: `ln(${num})`, t: `\\ln ${num}` } : { s: `ln(${num}/${den})`, t: `\\ln\\frac{${num}}{${den}}` }; };

const TEMPLATES = {
  // ---- 쉬움 ----
  E1: ["easy", "d", "기본", (r) => { const c = ri(r, 1, 5), d = ri(r, 1, 6), b = ri(r, 1, 3), A = fr(2 * c * b ** 3 + 3 * d * b * b, 6);
    return { tex: `\\int_0^{${b}} (${cn(c)}x^2+${cn(d)}x)\\,dx`, f: `${c}x^2+${d}x`, a: "0", b: `${b}`, ans: A.s, ansTex: A.t }; }],
  E2: ["easy", "d", "기본", (r) => { const n = ri(r, 2, 5), b = ri(r, 2, 3), A = fr(b ** (n + 1), n + 1);
    return { tex: `\\int_0^{${b}} x^{${n}}\\,dx`, f: `x^${n}`, a: "0", b: `${b}`, ans: A.s, ansTex: A.t }; }],
  E3: ["easy", "d", "지수·로그", (r) => { const k = ri(r, 2, 4), m = ri(r, 1, 3), A = fr(k ** m - 1, m);
    return { tex: `\\int_0^{\\ln ${k}} e^{${cn(m)}x}\\,dx`, f: `exp(${m}x)`, a: "0", b: `log(${k})`, ans: A.s, ansTex: A.t }; }],
  E4: ["easy", "d", "삼각함수", (r) => { const m = ri(r, 2, 6);
    if (r() < 0.5) { const A = fr(2, m); return { tex: `\\int_0^{${piOver(m)}} \\sin ${m}x\\,dx`, f: `sin(${m}x)`, a: "0", b: piOverS(m), ans: A.s, ansTex: A.t }; }
    const A = fr(1, m); return { tex: `\\int_0^{${piOver(2 * m)}} \\cos ${m}x\\,dx`, f: `cos(${m}x)`, a: "0", b: piOverS(2 * m), ans: A.s, ansTex: A.t }; }],
  E5: ["easy", "d", "지수·로그", (r) => { const c = ri(r, 1, 5), k = ri(r, 2, 9);
    return { tex: `\\int_1^{${k}} \\frac{${c}}{x}\\,dx`, f: `${c}/x`, a: "1", b: `${k}`, ans: `${c}*ln(${k})`, ansTex: `${cn(c)}\\ln ${k}` }; }],
  E6: ["easy", "d", "역삼각함수", (r) => { const b = ri(r, 1, 5);
    return { tex: `\\int_0^{${b}} \\frac{1}{x^2+${b * b}}\\,dx`, f: `1/(x^2+${b * b})`, a: "0", b: `${b}`, ans: piOverS(4 * b), ansTex: piOver(4 * b) }; }],
  E7: ["easy", "i", "기본", (r) => { const n = ri(r, 1, 6), a = ri(r, 1, 9), A = fr(a, n + 1);
    return { tex: `\\int ${cn(a)}x${pw(n)}\\,dx`, f: `${a}x^${n}`, ans: `${A.s}*x^${n + 1}`, ansTex: `${co(A)}x^{${n + 1}}`, dom: [-2, 2] }; }],
  E8: ["easy", "i", "지수·로그", (r) => { const c = ri(r, 1, 6), m = ri(r, 2, 5), A = fr(c, m);
    return { tex: `\\int ${cn(c)}e^{${m}x}\\,dx`, f: `${c}exp(${m}x)`, ans: `${A.s}*exp(${m}x)`, ansTex: `${co(A)}e^{${m}x}`, dom: [-1, 1] }; }],
  E9: ["easy", "i", "삼각함수", (r) => { const m = ri(r, 2, 7);
    return r() < 0.5
      ? { tex: `\\int \\cos ${m}x\\,dx`, f: `cos(${m}x)`, ans: `sin(${m}x)/${m}`, ansTex: `\\frac{\\sin ${m}x}{${m}}`, dom: [-2, 2] }
      : { tex: `\\int \\sin ${m}x\\,dx`, f: `sin(${m}x)`, ans: `-cos(${m}x)/${m}`, ansTex: `-\\frac{\\cos ${m}x}{${m}}`, dom: [-2, 2] }; }],
  // ---- 보통 ----
  N1: ["normal", "부분적분", "d", (r) => { const m = ri(r, 2, 4);
    return { tex: `\\int_0^1 x e^{${m}x}\\,dx`, f: `x*exp(${m}x)`, a: "0", b: "1", ans: `(${m - 1}*e^${m}+1)/${m * m}`, ansTex: `\\frac{${cn(m - 1)}e^{${m}}+1}{${m * m}}` }; }],
  N2: ["normal", "부분적분", "d", (r) => { const m = ri(r, 1, 5);
    return { tex: `\\int_0^{${piOver(m)}} x\\sin ${cn(m)}x\\,dx`, f: `x*sin(${m}x)`, a: "0", b: piOverS(m), ans: piOverS(m * m), ansTex: piOver(m * m) }; }],
  N3: ["normal", "치환", "d", (r) => { const b = ri(r, 1, 4), c = ri(r, 1, 5), L = lnFrac(b * b + c, c);
    return { tex: `\\int_0^{${b}} \\frac{x}{x^2+${c}}\\,dx`, f: `x/(x^2+${c})`, a: "0", b: `${b}`, ans: `${L.s}/2`, ansTex: `\\frac12${L.t}` }; }],
  N4: ["normal", "부분분수", "d", (r) => { const p = ri(r, 1, 4), q = p + ri(r, 1, 3), L = lnFrac((1 + p) * q, (1 + q) * p), d = q - p;
    return { tex: `\\int_0^1 \\frac{1}{(x+${p})(x+${q})}\\,dx`, f: `1/((x+${p})*(x+${q}))`, a: "0", b: "1", ans: `${L.s}/${d}`, ansTex: `${d === 1 ? "" : `\\frac{1}{${d}}`}${L.t}` }; }],
  N5: ["normal", "삼각함수", "d", (r) => { const m = ri(r, 1, 5);
    return { tex: `\\int_0^{${piOver(2 * m)}} \\sin^2 ${cn(m)}x\\,dx`, f: `sin(${m}x)^2`, a: "0", b: piOverS(2 * m), ans: piOverS(4 * m), ansTex: piOver(4 * m) }; }],
  N6: ["normal", "이상적분", "d", (r) => { const n = ri(r, 1, 3), m = ri(r, 1, 3), A = fr(fact(n), m ** (n + 1));
    return { tex: `\\int_0^{\\infty} x${pw(n)} e^{-${cn(m)}x}\\,dx`, f: `x^${n}*exp(-${m}x)`, a: "0", b: "inf", ans: A.s, ansTex: A.t }; }],
  N7: ["normal", "부분적분", "i", (r) => { const m = ri(r, 2, 4);
    return { tex: `\\int x e^{${m}x}\\,dx`, f: `x*exp(${m}x)`, ans: `exp(${m}x)*(x/${m}-1/${m * m})`, ansTex: `e^{${m}x}\\left(\\frac{x}{${m}}-\\frac{1}{${m * m}}\\right)`, dom: [-1, 1] }; }],
  N8: ["normal", "치환", "i", (r) => { const n = ri(r, 1, 4), c = ri(r, 1, 5);
    return { tex: `\\int x(x^2+${c})${pw(n)}\\,dx`, f: `x*(x^2+${c})^${n}`, ans: `(x^2+${c})^${n + 1}/${2 * (n + 1)}`, ansTex: `\\frac{(x^2+${c})^{${n + 1}}}{${2 * (n + 1)}}`, dom: [-2, 2] }; }],
  N9: ["normal", "부분적분", "i", (r) => { const n = ri(r, 1, 4), k = n + 1;
    return { tex: `\\int x${pw(n)}\\ln x\\,dx`, f: `x^${n}*log(x)`, ans: `x^${k}*(ln(x)/${k}-1/${k * k})`, ansTex: `x^{${k}}\\left(\\frac{\\ln x}{${k}}-\\frac{1}{${k * k}}\\right)`, dom: [0.5, 3] }; }],
  N10: ["normal", "부분적분", "d", (r) => { const m = ri(r, 1, 6), A = fr(-1, (m + 1) ** 2);
    return { tex: `\\int_0^1 x${pw(m)}\\ln x\\,dx`, f: `x^${m}*log(x)`, a: "0", b: "1", ans: A.s, ansTex: A.t }; }],
  // ---- 어려움 ----
  H1: ["hard", "대칭", "d", (r) => { const a = ri(r, 2, 12);
    return r() < 0.5
      ? { tex: `\\int_0^{\\pi/2} \\frac{\\sin^{${a}}x}{\\sin^{${a}}x+\\cos^{${a}}x}\\,dx`, f: `sin(x)^${a}/(sin(x)^${a}+cos(x)^${a})`, a: "0", b: "pi/2", ans: "pi/4", ansTex: "\\frac{\\pi}{4}" }
      : { tex: `\\int_0^{\\pi/2} \\frac{1}{1+\\tan^{${a}}x}\\,dx`, f: `1/(1+tan(x)^${a})`, a: "0", b: "pi/2", ans: "pi/4", ansTex: "\\frac{\\pi}{4}" }; }],
  H2: ["hard", "대칭", "d", (r) => { const c = ri(r, 2, 5), k = ri(r, 1, 2), b = ri(r, 1, 2), A = fr(b ** (2 * k + 1), 2 * k + 1);
    return { tex: `\\int_{-${b}}^{${b}} \\frac{x^{${2 * k}}}{1+${c}^x}\\,dx`, f: `x^${2 * k}/(1+${c}^x)`, a: `-${b}`, b: `${b}`, ans: A.s, ansTex: A.t }; }],
  H3: ["hard", "급수", "d", (r) => { const n = r() < 0.5 ? 1 : 3, m = ri(r, 1, 3), d = n === 1 ? 6 * m * m : 15 * m ** 4, e = n + 1;
    return { tex: `\\int_0^{\\infty} \\frac{x${pw(n)}}{e^{${cn(m)}x}-1}\\,dx`, f: `x^${n}/(exp(${m}x)-1)`, a: "0", b: "inf", ans: `pi^${e}/${d}`, ansTex: `\\frac{\\pi^{${e}}}{${d}}` }; }],
  H4: ["hard", "유리함수", "d", (r) => { const a = ri(r, 1, 3), b = a + ri(r, 1, 3), d = 2 * a * b * (a + b);
    return { tex: `\\int_0^{\\infty} \\frac{dx}{(x^2+${a * a})(x^2+${b * b})}`, f: `1/((x^2+${a * a})*(x^2+${b * b}))`, a: "0", b: "inf", ans: `pi/${d}`, ansTex: `\\frac{\\pi}{${d}}` }; }],
  H5: ["hard", "삼각함수", "d", (r) => { const b = ri(r, 1, 4), a = b + ri(r, 1, 3), D = a * a - b * b, s = Math.round(Math.sqrt(D));
    const sq = s * s === D;
    return { tex: `\\int_0^{2\\pi} \\frac{dx}{${a}+${cn(b)}\\cos x}`, f: `1/(${a}+${b}cos(x))`, a: "0", b: "2pi",
      ans: sq ? `2pi/${s}` : `2pi/sqrt(${D})`, ansTex: sq ? (s === 2 ? "\\pi" : s === 1 ? "2\\pi" : `\\frac{2\\pi}{${s}}`) : `\\frac{2\\pi}{\\sqrt{${D}}}` }; }],
  H6: ["hard", "특수", "d", (r) => { const a = ri(r, 2, 9);
    return { tex: `\\int_0^{\\infty} e^{-${a}x^2}\\,dx`, f: `exp(-${a}x^2)`, a: "0", b: "inf", ans: `sqrt(pi/${a})/2`, ansTex: `\\frac12\\sqrt{\\frac{\\pi}{${a}}}` }; }],
  H7: ["hard", "특수", "d", (r) => { const a = ri(r, 2, 9);
    return { tex: `\\int_0^1 \\frac{x^{${a}}-1}{\\ln x}\\,dx`, f: `(x^${a}-1)/log(x)`, a: "0", b: "1", ans: `ln(${a + 1})`, ansTex: `\\ln ${a + 1}` }; }],
  H8: ["hard", "특수", "d", (r) => { const a = ri(r, 3, 9), L = lnFrac(a, 2);
    return { tex: `\\int_0^{\\pi/2} \\ln(${a}\\sin x)\\,dx`, f: `log(${a}sin(x))`, a: "0", b: "pi/2", ans: `pi/2*${L.s}`, ansTex: `\\frac{\\pi}{2}${L.t}` }; }],
  H9: ["hard", "부분적분", "i", (r) => { const a = ri(r, 1, 3), b = ri(r, 1, 3), d = a * a + b * b;
    return { tex: `\\int e^{${cn(a)}x}\\sin ${cn(b)}x\\,dx`, f: `exp(${a}x)*sin(${b}x)`, ans: `exp(${a}x)*(${a}sin(${b}x)-${b}cos(${b}x))/${d}`,
      ansTex: `\\frac{e^{${cn(a)}x}(${cn(a)}\\sin ${cn(b)}x-${cn(b)}\\cos ${cn(b)}x)}{${d}}`, dom: [-1, 1] }; }],
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);
const cache = new Map();
function generate(tpl, seed) {
  const t = TEMPLATES[tpl]; if (!t) return null;
  // [난이도, 유형, 분류] 순서가 섞여 있어도 되게 정리
  const diff = t[0], type = ["d", "i"].includes(t[1]) ? t[1] : t[2], cat = ["d", "i"].includes(t[1]) ? t[2] : t[1];
  const p = t[3](rng(Number(seed)));
  return { id: `g:${tpl}:${seed}`, diff, type, cat, gen: true, ...p, ansTex: type === "i" ? `${p.ansTex}+C` : p.ansTex };
}
export function templateInfo(tpl) {
  const t = TEMPLATES[tpl];
  return { diff: t[0], type: ["d", "i"].includes(t[1]) ? t[1] : t[2] };
}
export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export const getProblem = (id) => {
  id = String(id);
  if (cache.has(id)) return cache.get(id);
  let p;
  if (id.startsWith("g:")) { const [, tpl, seed] = id.split(":"); p = generate(tpl, seed); }
  else { const [d, i] = id.split(":"); p = PROBLEMS[d]?.[Number(i)]; }
  if (p) cache.set(id, p);
  return p;
};

export const DIFFICULTY_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움", mixed: "섞어서" };
export const DEFAULT_TIME = { easy: 60, normal: 120, hard: 180, mixed: 120 };
